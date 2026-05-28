import { useStore } from "../store/useStore.js";
import { useNewsByCategory } from "../api/news.js";
import { useCategoryCount } from "../api/market.js";
import { NEWS_CATEGORIES, SENTIMENT_CONFIG } from "../utils/constants.js";
import { relativeTime } from "../utils/formatters.js";

// ─── Sentiment dot ────────────────────────────────────────────────────────────
function SentimentDot({ label }) {
  const colors = {
    positive: "#10b981",
    negative: "#f43f5e",
    neutral: "#64748b",
  };
  const c = colors[label] || colors.neutral;
  return (
    <span
      className="inline-block w-1.5 h-1.5 rounded-full shrink-0 mt-1.5"
      style={{ background: c, boxShadow: `0 0 5px ${c}88` }}
    />
  );
}

// ─── Article Card ─────────────────────────────────────────────────────────────
function ArticleCard({ a, onTickerClick }) {
  const cfg = SENTIMENT_CONFIG[a.sentiment_label] ?? SENTIMENT_CONFIG.neutral;

  const borderColor =
    a.sentiment_label === "positive"
      ? "rgba(16,185,129,0.35)"
      : a.sentiment_label === "negative"
        ? "rgba(244,63,94,0.35)"
        : "rgba(99,102,241,0.08)";

  return (
    <article
      className="px-3 py-3 hover:bg-white/[0.025] transition-all duration-150 border-b border-[rgba(99,102,241,0.05)] animate-fade-in"
      style={{ borderLeft: `3px solid ${borderColor}` }}
    >
      <a href={a.url} target="_blank" rel="noreferrer" className="block group">
        {/* Title row */}
        <div className="flex items-start gap-2">
          <SentimentDot label={a.sentiment_label} />
          <h3 className="text-xs font-medium text-slate-300 line-clamp-2 group-hover:text-accent-light transition-colors leading-snug">
            {a.title}
          </h3>
          <span className={`shrink-0 text-[9px] mt-0.5 ${cfg.className}`}>
            {a.sentiment_label === "positive"
              ? "POS"
              : a.sentiment_label === "negative"
                ? "NEG"
                : "NEU"}
          </span>
        </div>

        {/* Meta row */}
        <div className="mt-1.5 ml-3.5 flex items-center gap-1.5 text-[10px] text-muted">
          <span className="font-medium text-slate-500">{a.source}</span>
          <span>·</span>
          <span>{relativeTime(a.published_at)}</span>
          <span className="ml-auto bg-slate-800/60 px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wide text-slate-500 border border-slate-700/50">
            {a.category}
          </span>
        </div>
      </a>

      {/* Ticker chips */}
      {a.tickers?.length > 0 && (
        <div className="mt-2 ml-3.5 flex flex-wrap gap-1">
          {a.tickers.slice(0, 5).map((t) => (
            <button
              key={t}
              onClick={() => onTickerClick(t)}
              className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-accent/10 text-accent-light border border-accent/20 hover:bg-accent/20 transition-colors"
            >
              {t.replace(".NS", "").replace(".BO", "")}
            </button>
          ))}
        </div>
      )}
    </article>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyFeed() {
  return (
    <div className="flex flex-col items-center justify-center h-40 text-muted">
      <span className="text-3xl mb-2">📰</span>
      <p className="text-sm">No articles yet.</p>
      <p className="text-xs mt-1 opacity-60">First pull runs at startup.</p>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function SkeletonArticles() {
  return (
    <>
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="px-4 py-3 border-b border-[rgba(99,102,241,0.05)] space-y-2"
        >
          <div className="shimmer-bg h-3 w-full rounded" />
          <div className="shimmer-bg h-3 w-3/4 rounded" />
          <div className="shimmer-bg h-2.5 w-24 rounded" />
        </div>
      ))}
    </>
  );
}

// ─── News Feed ────────────────────────────────────────────────────────────────
export default function NewsFeed() {
  const newsFilter = useStore((s) => s.newsFilter);
  const setNewsFilter = useStore((s) => s.setNewsFilter);
  const sectorFilter = useStore((s) => s.sectorFilter);
  const setSelectedSymbol = useStore((s) => s.setSelectedSymbol);
  const setImpactOpen = useStore((s) => s.setImpactOpen);
  const setImpactHeadline = useStore((s) => s.setImpactHeadline);
  const setImpactSummary = useStore((s) => s.setImpactSummary);

  const sectorParam = newsFilter === "sector" ? sectorFilter : null;
  const { data, isLoading } = useNewsByCategory(newsFilter, 50, sectorParam);
  const { data: counts } = useCategoryCount();

  function handleImpact(a) {
    setImpactHeadline(a.title);
    setImpactSummary(a.summary ?? "");
    setImpactOpen(true);
  }

  return (
    <section className="glass-card overflow-hidden h-full flex flex-col">
      {/* ── Header ───────────────────────────── */}
      <div className="px-4 py-3 border-b border-[rgba(99,102,241,0.08)] shrink-0">
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            News Feed
            {isLoading && (
              <span className="w-3.5 h-3.5 rounded-full border-2 border-accent/30 border-t-accent animate-spin inline-block" />
            )}
          </h2>
          <span className="text-[10px] text-muted">
            {data?.length ?? "—"} articles
          </span>
        </div>

        {/* Category tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none">
          {NEWS_CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setNewsFilter(c.id)}
              className={`shrink-0 text-xs px-2.5 py-1 rounded-full transition-all duration-200 flex items-center gap-1 border ${
                newsFilter === c.id
                  ? "bg-accent/15 text-accent-light border-accent/25"
                  : "text-muted hover:text-slate-300 border-transparent hover:border-slate-700"
              }`}
            >
              {c.label}
              {counts && counts[c.id] != null && (
                <span className="text-[9px] opacity-50 tabular-nums">
                  ({counts[c.id]})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Article list ─────────────────────── */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {isLoading ? (
          <SkeletonArticles />
        ) : !data?.length ? (
          <EmptyFeed />
        ) : (
          data.map((a) => (
            <ArticleCard key={a.id} a={a} onTickerClick={setSelectedSymbol} />
          ))
        )}
      </div>

      {/* ── Footer: quick-analyze CTA ─────────── */}
      <div className="px-4 py-2.5 border-t border-[rgba(99,102,241,0.07)] shrink-0">
        <button
          onClick={() => setImpactOpen(true)}
          className="w-full text-xs text-muted hover:text-accent-light transition-colors flex items-center justify-center gap-1.5 py-1"
        >
          <span className="text-accent/50">⚡</span>
          Analyze a headline with AI Impact
        </button>
      </div>
    </section>
  );
}
