import { useStore } from "../store/useStore.js";
import { useNewsByCategory } from "../api/news.js";
import { NEWS_CATEGORIES } from "../utils/constants.js";
import { relativeTime } from "../utils/formatters.js";

const sentimentClass = (label) =>
  label === "positive" ? "bg-bull/15 text-bull"
  : label === "negative" ? "bg-bear/15 text-bear"
  : "bg-slate-200 text-slate-600";

export default function NewsFeed() {
  const newsFilter = useStore((s) => s.newsFilter);
  const setNewsFilter = useStore((s) => s.setNewsFilter);
  const setSelectedSymbol = useStore((s) => s.setSelectedSymbol);
  const { data, isLoading } = useNewsByCategory(newsFilter, 40);

  return (
    <section className="bg-white border border-slate-200 rounded-lg overflow-hidden h-full flex flex-col">
      <div className="px-4 py-2 border-b border-slate-200 flex items-center gap-1 overflow-x-auto">
        <h2 className="text-sm font-semibold mr-2">News</h2>
        {NEWS_CATEGORIES.map((c) => (
          <button
            key={c.id}
            onClick={() => setNewsFilter(c.id)}
            className={`text-xs px-2 py-1 rounded-md ${newsFilter === c.id ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"}`}
          >
            {c.label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
        {isLoading && <div className="p-6 text-center text-slate-400 text-sm">Loading…</div>}
        {!isLoading && !data?.length && <div className="p-6 text-center text-slate-400 text-sm">No articles yet. The first RSS pull runs at startup.</div>}
        {data?.map((a) => (
          <article key={a.id} className="px-4 py-3 hover:bg-slate-50">
            <a href={a.url} target="_blank" rel="noreferrer" className="block">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-medium text-slate-900 line-clamp-2">{a.title}</h3>
                <span title={`compound ${a.sentiment >= 0 ? "+" : ""}${a.sentiment.toFixed(2)}`}
                      className={`shrink-0 text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${sentimentClass(a.sentiment_label)}`}>
                  {a.sentiment_label}
                </span>
              </div>
              <div className="mt-1 text-xs text-slate-500 flex items-center gap-2">
                <span>{a.source}</span><span>·</span><span>{relativeTime(a.published_at)}</span>
                <span className="ml-auto text-[10px] uppercase bg-slate-100 px-1.5 py-0.5 rounded">{a.category}</span>
              </div>
            </a>
            {a.tickers?.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {a.tickers.map((t) => (
                  <button key={t} onClick={() => setSelectedSymbol(t)}
                          className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200">
                    {t}
                  </button>
                ))}
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
