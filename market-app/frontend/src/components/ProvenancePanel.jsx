import { useStore } from "../store/useStore.js";
import { relativeTime } from "../utils/formatters.js";

const sentimentClass = (label) =>
  label === "positive" ? "bg-bull/15 text-bull"
  : label === "negative" ? "bg-bear/15 text-bear"
  : "bg-slate-200 text-slate-600";

const confColor = (c) =>
  c === "high" ? "bg-bull text-white"
  : c === "low" ? "bg-bear text-white"
  : "bg-amber-400 text-amber-950";

export default function ProvenancePanel() {
  const sources = useStore((s) => s.explainSources);
  const confidence = useStore((s) => s.explainConfidence);

  if (!sources?.length && !confidence) return null;

  return (
    <div className="mt-4 border-t border-slate-200 pt-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Provenance</h4>
        {confidence && (
          <span className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded ${confColor(confidence)}`}>
            Confidence: {confidence}
          </span>
        )}
      </div>
      <ul className="mt-2 space-y-1.5">
        {sources?.map((s, i) => (
          <li key={i} className="flex items-center gap-2 text-xs">
            <span className={`shrink-0 px-1.5 py-0.5 rounded ${sentimentClass(s.sentiment_label)}`}>
              {s.sentiment_label}
            </span>
            <a href={s.url} target="_blank" rel="noreferrer" className="truncate text-slate-700 hover:underline" title={s.title}>
              {s.title?.slice(0, 60)}{s.title?.length > 60 ? "…" : ""}
            </a>
            <span className="ml-auto text-slate-400 shrink-0">{s.source} · {relativeTime(s.published_at)}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[10px] text-slate-400">AI-generated analysis · Not financial advice</p>
    </div>
  );
}
