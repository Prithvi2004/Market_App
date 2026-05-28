import { useStore } from "../store/useStore.js";
import { relativeTime } from "../utils/formatters.js";

const sentimentClass = (label) =>
  label === "positive"
    ? "bg-bull/15 text-bull border-bull/20"
    : label === "negative"
    ? "bg-bear/15 text-bear border-bear/20"
    : "bg-slate-800/60 text-slate-400 border-slate-700/50";

export default function ProvenancePanel() {
  const sources = useStore((s) => s.explainSources);

  if (!sources || !sources.length) return null;

  return (
    <div className="mt-4 border-t border-white/[0.05] pt-3.5 space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Source Citations
        </h4>
        <span className="text-[9px] text-slate-500 bg-white/[0.02] px-2 py-0.5 rounded border border-white/[0.04]">
          Provenance verified
        </span>
      </div>
      
      <ul className="space-y-1.5 max-h-40 overflow-y-auto">
        {sources.map((s, i) => (
          <li
            key={i}
            className="flex items-center gap-2 text-xs py-1 px-2 rounded-lg bg-white/[0.01] hover:bg-white/[0.03] border border-white/[0.02] transition-colors"
          >
            {/* Sentiment label */}
            <span
              className={`shrink-0 text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border ${sentimentClass(
                s.sentiment_label
              )}`}
            >
              {s.sentiment_label}
            </span>
            
            {/* Headline link */}
            <a
              href={s.url}
              target="_blank"
              rel="noreferrer"
              className="truncate text-slate-300 hover:text-accent-light hover:underline flex-1"
              title={s.title}
            >
              {s.title}
            </a>
            
            {/* Source & time info */}
            <span className="text-[9px] text-slate-500 shrink-0 tabular-nums">
              {s.source} · {relativeTime(s.published_at)}
            </span>
          </li>
        ))}
      </ul>
      <p className="text-[9px] text-slate-500 leading-normal italic pt-1 text-center">
        This analysis aggregates real-time metrics and the articles listed above. Not investment advice.
      </p>
    </div>
  );
}
