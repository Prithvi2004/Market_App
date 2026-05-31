import { useState, useRef, useEffect } from "react";
import { useStore } from "../../store/useStore.js";
import { streamCopilot } from "../../api/llm.js";

const SUGGESTIONS = [
  "Evaluate the valuation P/E vs profitability margins.",
  "Identify primary technical support & resistance levels.",
  "Summarize the recent news and key catalysts.",
  "Describe the overall trend bias & price direction.",
];

export default function CopilotChat({ symbol }) {
  const messages = useStore((s) => s.copilotMessages);
  const addMessage = useStore((s) => s.addCompareSymbol ? useStore.getState().addCopilotMessage : () => {});
  const clearHistory = useStore((s) => s.clearCopilotHistory);
  const loading = useStore((s) => s.copilotLoading);
  const setLoading = useStore((s) => s.setCopilotLoading);

  // Directly handle state additions to bypass potential setter mapping issues
  const [localHistory, setLocalHistory] = useState([]);
  const [input, setInput] = useState("");
  const [streamingText, setStreamingText] = useState("");
  
  const chatEndRef = useRef(null);
  const abortRef = useRef(null);

  // Clean chat when symbol changes
  useEffect(() => {
    setLocalHistory([]);
    setStreamingText("");
    setInput("");
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
  }, [symbol]);

  // Scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [localHistory, streamingText]);

  async function handleSend(textToSend) {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    setInput("");
    
    // Add user message
    const userMsg = { role: "user", content: query };
    const updatedHistory = [...localHistory, userMsg];
    setLocalHistory(updatedHistory);
    
    // Setup SSE controller
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setStreamingText("");

    try {
      let accumulated = "";
      await streamCopilot(
        { symbol, history: localHistory, user_query: query },
        {
          token: (d) => {
            accumulated += d.text || "";
            setStreamingText(accumulated);
          },
          done: () => {
            // Commit streaming text to history
            setLocalHistory((prev) => [
              ...prev,
              { role: "assistant", content: accumulated }
            ]);
            setStreamingText("");
          }
        },
        controller.signal
      );
    } catch (err) {
      if (err.name !== "AbortError") {
        setLocalHistory((prev) => [
          ...prev,
          { role: "assistant", content: "⚠️ Co-Pilot was unable to respond. Ensure Ollama service is servable." }
        ]);
      }
    } finally {
      setLoading(false);
    }
  }

  // Suggestion click
  function handleSuggestion(sug) {
    handleSend(sug);
  }

  return (
    <div className="flex flex-col h-[calc(100vh-240px)] min-h-[360px] md:h-full relative overflow-hidden bg-ink/30 border border-[rgba(212,150,58,0.06)] rounded-xl">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-[rgba(212,150,58,0.1)] bg-[rgba(11,11,9,0.5)]">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            AI Co-Pilot Advisor
          </span>
          <span className="text-[8px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1 rounded uppercase font-black font-mono">
            Interactive
          </span>
        </div>
        {localHistory.length > 0 && (
          <button
            onClick={() => setLocalHistory([])}
            className="text-[9px] font-bold text-slate-500 hover:text-red-400 transition-colors uppercase font-mono"
          >
            Clear Chat
          </button>
        )}
      </div>

      {/* Suggestion list on empty chat */}
      {localHistory.length === 0 && !streamingText && (
        <div className="flex-1 overflow-y-auto p-4 flex flex-col justify-center items-center text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-[rgba(212,150,58,0.05)] border border-[rgba(212,150,58,0.1)] flex items-center justify-center">
            <span className="text-xl">✨</span>
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wide">
              Stock Research Assistant
            </h4>
            <p className="text-[10px] text-[#7a7060] mt-1 max-w-[240px] leading-relaxed mx-auto">
              Ask any detailed question about {symbol.replace(".NS", "")} and get confluences computed from quotes, fundamentals, and RSS feeds.
            </p>
          </div>
          <div className="w-full max-w-[280px] space-y-1.5 pt-2">
            {SUGGESTIONS.map((s, i) => (
              <button
                key={i}
                onClick={() => handleSuggestion(s)}
                className="w-full text-[10px] text-left p-2.5 rounded-lg border border-[rgba(212,150,58,0.1)] hover:border-[rgba(212,150,58,0.25)] bg-[rgba(15,23,42,0.4)] text-slate-400 hover:text-[#f0c56a] transition-all font-medium"
              >
                💬 {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chat conversation area */}
      {localHistory.length > 0 || streamingText ? (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 pr-2">
          {localHistory.map((m, i) => {
            const isUser = m.role === "user";
            return (
              <div key={i} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-xl p-3.5 text-[11.5px] leading-relaxed border ${
                    isUser
                      ? "bg-[rgba(212,150,58,0.06)] border-[rgba(212,150,58,0.2)] text-slate-100 font-medium"
                      : "bg-[#111110]/80 border-[rgba(255,255,255,0.03)] text-slate-300"
                  }`}
                >
                  {/* Parse basic markdown inside assistant bubbles */}
                  {isUser ? (
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  ) : (
                    <div className="space-y-1.5 font-sans">
                      {m.content.split("\n").filter(Boolean).map((line, idx) => {
                        if (line.startsWith("###")) {
                          return <h5 key={idx} className="font-extrabold text-[11.5px] text-slate-100 mt-2">{line.replace("###", "")}</h5>;
                        }
                        if (line.startsWith("- ")) {
                          return <li key={idx} className="ml-2 font-medium">{line.replace("- ", "")}</li>;
                        }
                        return <p key={idx}>{line}</p>;
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Streaming Bubble */}
          {streamingText && (
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-xl p-3.5 text-[11.5px] leading-relaxed border bg-[#111110]/80 border-[rgba(255,255,255,0.03)] text-slate-300 typewriter-cursor">
                <div className="space-y-1.5 font-sans">
                  {streamingText.split("\n").filter(Boolean).map((line, idx) => {
                    if (line.startsWith("###")) {
                      return <h5 key={idx} className="font-extrabold text-[11.5px] text-slate-100 mt-2">{line.replace("###", "")}</h5>;
                    }
                    if (line.startsWith("- ")) {
                      return <li key={idx} className="ml-2 font-medium">{line.replace("- ", "")}</li>;
                    }
                    return <p key={idx}>{line}</p>;
                  })}
                </div>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>
      ) : null}

      {/* Input container */}
      <div className="p-2 border-t border-[rgba(212,150,58,0.1)] bg-[rgba(11,11,9,0.5)]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-1.5"
        >
          <input
            type="text"
            placeholder={`Ask a question about ${symbol.replace(".NS", "")}...`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            className="flex-1 input-dark !min-h-[38px] !py-1 text-xs"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="btn-primary !min-h-[38px] !py-1 !px-4 text-xs shrink-0"
          >
            {loading ? "⏳" : "Send"}
          </button>
        </form>
      </div>
    </div>
  );
}
