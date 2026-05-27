import { useStore } from "../store/useStore.js";
import { streamExplain } from "../api/llm.js";
import ProvenancePanel from "./ProvenancePanel.jsx";

export default function AIExplainer({ symbol }) {
  const explainText = useStore((s) => s.explainText);
  const loading = useStore((s) => s.explainLoading);
  const setLoading = useStore((s) => s.setExplainLoading);
  const setText = useStore((s) => s.setExplainText);
  const appendText = useStore((s) => s.appendExplainText);
  const setSources = useStore((s) => s.setExplainSources);
  const setConfidence = useStore((s) => s.setExplainConfidence);
  const resetExplain = useStore((s) => s.resetExplain);

  async function onClick() {
    if (!symbol || loading) return;
    resetExplain();
    setLoading(true);
    setText("");
    try {
      await streamExplain({ symbol }, {
        meta: (d) => setSources(d.sources || []),
        token: (d) => appendText(d.text || ""),
        done: (d) => setConfidence(d.confidence || "medium"),
      });
    } catch (e) {
      setText(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">AI Explainer</h3>
        <button
          onClick={onClick}
          disabled={loading || !symbol}
          className="text-sm px-3 py-1.5 rounded-md bg-slate-900 text-white disabled:opacity-40"
        >
          {loading ? "Generating…" : "✦ Explain this move"}
        </button>
      </div>

      <div className="mt-3 min-h-[6rem] text-sm leading-relaxed text-slate-800 whitespace-pre-wrap">
        {loading && !explainText && (
          <div className="flex items-center gap-2 text-slate-500">
            <span className="inline-block w-2 h-2 rounded-full bg-slate-400 animate-pulse" />
            Waiting for first token from local LLM…
          </div>
        )}
        {explainText || (!loading && <span className="text-slate-400">Click the button to generate a narrative from recent quote + news.</span>)}
      </div>

      <ProvenancePanel />
    </div>
  );
}
