import { useState } from "react";
import { useStore } from "../store/useStore.js";
import { streamExplain } from "../api/llm.js";
import ProvenancePanel from "./ProvenancePanel.jsx";
import { CONFIDENCE_COLORS } from "../utils/constants.js";

// Helper to parse and render Markdown + custom chips (e.g. citations in italics)
function formatExplainText(text, loading) {
  if (!text) return null;

  // Strip trailing raw confidence line
  let cleaned = text.replace(/(?:\r?\n)*\s*confidence:\s*(?:high|medium|low)\s*$/i, "");

  // Split by double line breaks (paragraphs)
  const paras = cleaned.split(/\n\n+/).filter(Boolean);

  return (
    <div className="relative space-y-3">
      {paras.map((para, pIdx) => {
        const trimmed = para.trim();
        if (!trimmed) return null;

        let key = 0;
        const regex = /(\*\*.*?\*\*|\*.*?\*)/g;
        const splitParts = trimmed.split(regex);

        const renderedParts = splitParts.map((part) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return <strong key={key++} className="font-bold text-slate-100">{part.slice(2, -2)}</strong>;
          }
          if (part.startsWith("*") && part.endsWith("*")) {
            return (
              <em key={key++} className="italic text-accent-light bg-accent/8 border border-accent/15 px-1.5 py-0.5 rounded font-mono text-[10px]">
                {part.slice(1, -1)}
              </em>
            );
          }
          const subParts = part.split(/\n/);
          if (subParts.length > 1) {
            return subParts.map((sp, sIdx) => (
              <span key={key++}>
                {sp}
                {sIdx < subParts.length - 1 && <br />}
              </span>
            ));
          }
          return part;
        });

        const isLastPara = pIdx === paras.length - 1;

        return (
          <p key={pIdx} className="leading-relaxed">
            {renderedParts}
            {isLastPara && loading && (
              <span className="inline-block w-1.5 h-3 bg-accent ml-0.5 animate-blink" />
            )}
          </p>
        );
      })}
    </div>
  );
}

export default function AIExplainer({ symbol }) {
  const explainText = useStore((s) => s.explainText);
  const loading = useStore((s) => s.explainLoading);
  const setLoading = useStore((s) => s.setExplainLoading);
  const setText = useStore((s) => s.setExplainText);
  const appendText = useStore((s) => s.appendExplainText);
  const setSources = useStore((s) => s.setExplainSources);
  const setConfidence = useStore((s) => s.setExplainConfidence);
  const confidence = useStore((s) => s.explainConfidence);
  const resetExplain = useStore((s) => s.resetExplain);

  const [error, setError] = useState("");

  async function onClick() {
    if (!symbol || loading) return;
    resetExplain();
    setLoading(true);
    setText("");
    setError("");
    try {
      await streamExplain(
        { symbol, timeframe: "1D", include_news: true },
        {
          meta: (d) => setSources(d.sources || []),
          token: (d) => appendText(d.text || ""),
          done: (d) => setConfidence(d.confidence || "medium"),
        }
      );
    } catch (e) {
      setError(e.message || "Failed to generate AI analysis.");
    } finally {
      setLoading(false);
    }
  }

  // Determine styling for the confidence badge
  const confStyle = confidence ? CONFIDENCE_COLORS[confidence] || CONFIDENCE_COLORS.medium : null;

  return (
    <div className="glass-card bg-slate-900/40 p-5 space-y-4 border-[rgba(99,102,241,0.08)]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-200">🤖 AI Price Explainer</span>
          {confidence && confStyle && (
            <span
              className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-full border ${confStyle.bg} ${confStyle.text} ${confStyle.border} shadow-[0_0_8px_rgba(99,102,241,0.1)]`}
            >
              Confidence: {confidence}
            </span>
          )}
        </div>
        <button
          onClick={onClick}
          disabled={loading || !symbol}
          className="btn-primary text-xs px-3.5 py-1.5 flex items-center gap-1.5 transition-all"
        >
          {loading ? (
            <>
              <span className="w-3 h-3 rounded-full border border-white/20 border-t-white animate-spin" />
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <span>✦</span>
              <span>Explain Movement</span>
            </>
          )}
        </button>
      </div>

      {/* Error display */}
      {error && (
        <div className="text-xs text-bear bg-bear/10 border border-bear/20 rounded-lg px-3 py-2">
          ⚠️ {error}
        </div>
      )}

      {/* Main explanation text */}
      <div className="min-h-[6rem] text-xs leading-relaxed text-slate-300 font-sans relative bg-black/25 rounded-lg p-3.5 border border-white/[0.02]">
        {loading && !explainText && (
          <div className="flex items-center gap-2 text-slate-400">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-accent animate-pulse shadow-[0_0_8px_#6366f1]" />
            <span>Consulting DeepSeek via Ollama cloud model...</span>
          </div>
        )}
        {explainText ? (
          formatExplainText(explainText, loading)
        ) : (
          !loading && (
            <span className="text-slate-500 italic block text-center py-4">
              Click the explain button to stream live market analysis.
            </span>
          )
        )}
      </div>

      {/* Provenance and references list */}
      <ProvenancePanel />
    </div>
  );
}
