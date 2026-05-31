import { useState } from "react";
import { useStore } from "../store/useStore.js";
import { useNewsByCategory } from "../api/news.js";
import { useCategoryCount } from "../api/market.js";
import { NEWS_CATEGORIES } from "../utils/constants.js";
import { relativeTime } from "../utils/formatters.js";

/* ─── helpers ──────────────────────────────────────────────────────────────── */
const SENT_META = {
  positive: { dot: "#10b981", glow: "#10b98144", badge: "text-emerald-400 bg-emerald-500/8 border-emerald-500/15", label: "BULL" },
  negative: { dot: "#f43f5e", glow: "#f43f5e44", badge: "text-rose-400 bg-rose-500/8 border-rose-500/15",     label: "BEAR" },
  neutral:  { dot: "#64748b", glow: "transparent",                badge: "text-slate-500 bg-slate-800/40 border-slate-700/30",  label: "NEU" },
};

function SentDot({ label }) {
  const m = SENT_META[label] ?? SENT_META.neutral;
  return (
    <span
      className="inline-block w-2 h-2 rounded-full shrink-0 mt-[3px]"
      style={{ background: m.dot, boxShadow: `0 0 6px ${m.glow}` }}
    />
  );
}

/* Source favicon fallback */
function SourceIcon({ source }) {
  const letter = (source || "?")[0].toUpperCase();
  return (
    <span
      className="inline-flex items-center justify-center w-4 h-4 rounded text-[9px] font-black shrink-0"
      style={{ background: "rgba(212,150,58,0.12)", color: "#d4963a", border: "1px solid rgba(212,150,58,0.2)", fontFamily: "'DM Mono', monospace" }}
    >
      {letter}
    </span>
  );
}

/* ─── Article Card (rich) ───────────────────────────────────────────────────── */
function ArticleCard({ a, onTickerClick, onImpact }) {
  const m = SENT_META[a.sentiment_label] ?? SENT_META.neutral;
  const borderColor =
    a.sentiment_label === "positive" ? "rgba(16,185,129,0.3)"
    : a.sentiment_label === "negative" ? "rgba(244,63,94,0.3)"
    : "rgba(212,150,58,0.07)";

  return (
    <article
      className="group px-3 py-3 hover:bg-white/[0.02] transition-all duration-150 border-b border-[rgba(212,150,58,0.05)] animate-fade-in"
      style={{ borderLeft: `2px solid ${borderColor}` }}
    >
      {/* Title */}
      <a href={a.url} target="_blank" rel="noreferrer" className="block">
        <div className="flex items-start gap-2 mb-1.5">
          <SentDot label={a.sentiment_label} />
          <h3 className="text-[12px] font-semibold text-slate-300 line-clamp-2 group-hover:text-[#f0c56a] transition-colors leading-snug tracking-[-0.01em] flex-1">
            {a.title}
          </h3>
          <span className={`shrink-0 text-[8px] font-black px-1.5 py-0.5 rounded border ${m.badge} uppercase tracking-wide mt-0.5`}>
            {m.label}
          </span>
        </div>

        {/* Summary snippet if available */}
        {a.summary && (
          <p className="ml-3.5 text-[10.5px] text-muted line-clamp-2 leading-relaxed mb-1.5 opacity-80">
            {a.summary}
          </p>
        )}

        {/* Meta row */}
        <div className="ml-3.5 flex items-center gap-1.5 text-[10px] text-muted flex-wrap">
          <SourceIcon source={a.source} />
          <span className="font-semibold text-slate-500">{a.source}</span>
          <span className="text-[#2a2826]">·</span>
          <span>{relativeTime(a.published_at)}</span>
          {a.category && (
            <>
              <span className="text-[#2a2826]">·</span>
              <span className="bg-[rgba(212,150,58,0.07)] border border-[rgba(212,150,58,0.12)] text-[#7a7060] px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wide font-semibold">
                {a.category}
              </span>
            </>
          )}
        </div>
      </a>

      {/* Ticker chips + Impact */}
      {(a.tickers?.length > 0 || true) && (
        <div className="mt-2 ml-3.5 flex flex-wrap items-center gap-1">
          {a.tickers?.slice(0, 4).map((t) => (
            <button
              key={t}
              onClick={() => onTickerClick(t)}
              className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-accent/8 text-[#d4963a] border border-accent/15 hover:bg-accent/18 hover:border-accent/30 transition-colors"
            >
              {t.replace(".NS", "").replace(".BO", "")}
            </button>
          ))}
          <button
            onClick={(e) => { e.preventDefault(); onImpact(a); }}
            className="ml-auto font-mono text-[9px] px-2 py-0.5 rounded-full bg-amber-500/8 text-amber-400/80 border border-amber-500/15 hover:bg-amber-500/18 hover:text-amber-300 transition-all shrink-0"
            title="Analyze market impact with AI"
          >
            ⚡ Impact
          </button>
        </div>
      )}
    </article>
  );
}

/* ─── Skeletons ─────────────────────────────────────────────────────────────── */
function SkeletonFeed() {
  return (
    <>
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="px-3 py-3 border-b border-[rgba(212,150,58,0.04)] space-y-2">
          <div className="flex gap-2">
            <div className="shimmer-bg w-2 h-2 rounded-full mt-1 shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="shimmer-bg h-3 w-full rounded" />
              <div className="shimmer-bg h-3 w-3/4 rounded" />
            </div>
          </div>
          <div className="flex gap-2 ml-4">
            <div className="shimmer-bg h-2.5 w-20 rounded" />
            <div className="shimmer-bg h-2.5 w-14 rounded" />
          </div>
        </div>
      ))}
    </>
  );
}

function EmptyFeed({ category }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-12 h-12 rounded-full bg-[rgba(212,150,58,0.06)] border border-[rgba(212,150,58,0.1)] flex items-center justify-center mb-3">
        <span className="text-xl">📰</span>
      </div>
      <p className="text-sm font-semibold text-slate-400 mb-1">No articles yet</p>
      <p className="text-xs text-muted">
        {category === "sector" ? "Select a sector to filter news" : "First pull runs at startup — check back soon."}
      </p>
    </div>
  );
}

/* ─── Sentiment bar summary ─────────────────────────────────────────────────── */
function SentimentBar({ articles }) {
  if (!articles?.length) return null;
  const pos = articles.filter(a => a.sentiment_label === "positive").length;
  const neg = articles.filter(a => a.sentiment_label === "negative").length;
  const neu = articles.length - pos - neg;
  const total = articles.length;
  const posW = ((pos / total) * 100).toFixed(0);
  const negW = ((neg / total) * 100).toFixed(0);
  const neuW = 100 - Number(posW) - Number(negW);
  const sentiment = pos > neg ? "Bullish" : neg > pos ? "Bearish" : "Neutral";
  const sentColor = pos > neg ? "text-emerald-400" : neg > pos ? "text-rose-400" : "text-slate-400";

  return (
    <div className="px-3 py-2 border-b border-[rgba(212,150,58,0.06)] bg-[rgba(212,150,58,0.02)]">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[9px] text-muted uppercase tracking-widest font-bold" style={{ fontFamily: "'DM Mono', monospace" }}>
          Market Sentiment · {total} articles
        </span>
        <span className={`text-[9px] font-bold uppercase tracking-wide ${sentColor}`}>{sentiment}</span>
      </div>
      <div className="flex gap-px h-1.5 rounded-full overflow-hidden">
        <div className="bg-emerald-500/60 rounded-l-full transition-all duration-700" style={{ width: `${posW}%` }} />
        <div className="bg-slate-600/40 transition-all duration-700" style={{ width: `${neuW}%` }} />
        <div className="bg-rose-500/60 rounded-r-full transition-all duration-700" style={{ width: `${negW}%` }} />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[8px] text-emerald-500/60">{pos} bull</span>
        <span className="text-[8px] text-muted">{neu} neutral</span>
        <span className="text-[8px] text-rose-500/60">{neg} bear</span>
      </div>
    </div>
  );
}

/* ─── NewsFeed ──────────────────────────────────────────────────────────────── */
export default function NewsFeed({ onMinimize }) {
  const newsFilter     = useStore((s) => s.newsFilter);
  const setNewsFilter  = useStore((s) => s.setNewsFilter);
  const sectorFilter   = useStore((s) => s.sectorFilter);
  const setSelectedSymbol  = useStore((s) => s.setSelectedSymbol);
  const setImpactOpen      = useStore((s) => s.setImpactOpen);
  const setImpactHeadline  = useStore((s) => s.setImpactHeadline);
  const setImpactSummary   = useStore((s) => s.setImpactSummary);

  // Load more articles for "all" tab (60), others 40
  const limit = newsFilter === "all" ? 60 : 40;
  const sectorParam = newsFilter === "sector" ? sectorFilter : null;
  const { data, isLoading } = useNewsByCategory(newsFilter, limit, sectorParam);
  const { data: counts } = useCategoryCount();

  const [showAll, setShowAll] = useState(false);
  const displayed = showAll ? data : data?.slice(0, 25);

  function handleImpact(a) {
    setImpactHeadline(a.title);
    setImpactSummary(a.summary ?? "");
    setImpactOpen(true);
  }

  return (
    <section className="glass-card overflow-hidden h-full flex flex-col">

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="px-3 py-3 border-b border-[rgba(212,150,58,0.08)] shrink-0">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-100" style={{ fontFamily: "'DM Serif Display', serif" }}>
              Market Intelligence
            </h2>
            {isLoading && (
              <span className="w-3 h-3 rounded-full border-2 border-accent/30 border-t-accent animate-spin inline-block" />
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-muted font-mono">{data?.length ?? "—"} stories</span>
            {onMinimize && (
              <button
                onClick={onMinimize}
                title="Collapse News Panel"
                className="w-6 h-6 flex items-center justify-center rounded-md border border-[rgba(212,150,58,0.15)] text-muted hover:text-[#d4963a] hover:border-[rgba(212,150,58,0.35)] transition-all text-xs"
              >
                ⟫
              </button>
            )}
          </div>
        </div>

        {/* Category filter pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none">
          {NEWS_CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => { setNewsFilter(c.id); setShowAll(false); }}
              className={`shrink-0 text-[10px] px-2.5 py-1 rounded-full transition-all duration-200 flex items-center gap-1 border font-semibold ${
                newsFilter === c.id
                  ? "bg-accent/12 text-[#d4963a] border-accent/22"
                  : "text-muted hover:text-slate-300 border-transparent hover:border-[rgba(212,150,58,0.12)] hover:bg-white/[0.02]"
              }`}
            >
              {c.label}
              {counts?.[c.id] != null && (
                <span className="text-[8px] opacity-50 tabular-nums">({counts[c.id]})</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Sentiment bar ──────────────────────────────────────────────── */}
      {!isLoading && data?.length > 0 && <SentimentBar articles={data} />}

      {/* ── Article list ───────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {isLoading ? (
          <SkeletonFeed />
        ) : !data?.length ? (
          <EmptyFeed category={newsFilter} />
        ) : (
          <>
            {displayed.map((a) => (
              <ArticleCard
                key={a.id}
                a={a}
                onTickerClick={setSelectedSymbol}
                onImpact={handleImpact}
              />
            ))}

            {/* Load more button */}
            {!showAll && data.length > 25 && (
              <button
                onClick={() => setShowAll(true)}
                className="w-full py-3 text-[11px] text-muted hover:text-[#d4963a] transition-colors border-t border-[rgba(212,150,58,0.06)] bg-[rgba(212,150,58,0.02)] hover:bg-[rgba(212,150,58,0.04)] flex items-center justify-center gap-1.5 font-semibold"
              >
                <span>↓</span>
                Show {data.length - 25} more stories
              </button>
            )}

            {showAll && data.length > 25 && (
              <button
                onClick={() => setShowAll(false)}
                className="w-full py-3 text-[11px] text-muted hover:text-[#d4963a] transition-colors border-t border-[rgba(212,150,58,0.06)] flex items-center justify-center gap-1.5"
              >
                ↑ Collapse
              </button>
            )}
          </>
        )}
      </div>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <div className="px-3 py-2 border-t border-[rgba(212,150,58,0.07)] shrink-0 flex items-center justify-between">
        <button
          onClick={() => setImpactOpen(true)}
          className="text-[10px] text-muted hover:text-[#d4963a] transition-colors flex items-center gap-1"
        >
          <span className="text-accent/50">⚡</span>
          Analyze with AI
        </button>
        <span className="text-[9px] text-[#2a2826] font-mono">NSE · BSE · Global</span>
      </div>
    </section>
  );
}
