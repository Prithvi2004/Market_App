import { useState } from "react";
import { useStore } from "../store/useStore.js";
import { streamImpact } from "../api/llm.js";

// Helper to parse and render Markdown sector blocks into stunning visual cards
function formatImpactText(text, loading) {
  if (!text) return null;

  // Split by double line breaks (paragraphs)
  const paras = text.split(/\n\n+/).filter(Boolean);

  return (
    <div className="space-y-4">
      {paras.map((para, idx) => {
        const trimmed = para.trim();
        if (!trimmed) return null;

        const lines = trimmed.split(/\n/);
        const firstLine = lines.find((l) => l.trim());
        const headingMatch = firstLine?.match(/^#{1,6}\s*(.+)$/);
        const headingText = headingMatch ? headingMatch[1].trim() : "";
        const isSectorBlock =
          !!headingText ||
          lines.some(
            (l) =>
              l.includes("**Direction:**") ||
              l.includes("Direction:") ||
              /Representative stocks/i.test(l),
          );

        if (isSectorBlock) {
          let sectorName = "";
          let direction = "";
          let reasoningLines = [];
          let stocks = "";

          if (headingText) {
            const dirMatch = headingText.match(
              /^(.*?)(?:\(|:)\s*(positive|negative|neutral)\s*\)?$/i,
            );
            if (dirMatch) {
              sectorName = dirMatch[1].trim();
              direction = dirMatch[2].toUpperCase();
            } else {
              sectorName = headingText;
            }
          }

          lines.forEach((line) => {
            const l = line.trim();
            if (!l) return;
            const clean = l.replace(/^#{1,6}\s*/, "").replace(/^[-*•]\s+/, "");
            if (headingMatch && l === firstLine) {
              if (!direction) {
                const dirMatch = clean.match(
                  /^(.*?)(?:\(|:)\s*(positive|negative|neutral)\s*\)?$/i,
                );
                if (dirMatch) {
                  sectorName = dirMatch[1].trim();
                  direction = dirMatch[2].toUpperCase();
                }
              }
              return;
            }
            if (
              clean.startsWith("**") &&
              clean.endsWith("**") &&
              !clean.includes("Direction:")
            ) {
              sectorName = clean.replace(/\*\*/g, "");
            } else if (l.includes("Direction:")) {
              direction = l
                .split("Direction:")[1]
                .replace(/\*\*/g, "")
                .replace(/\*/g, "")
                .trim();
            } else if (
              clean.includes("Representative stocks:") ||
              clean.includes("Representative stocks")
            ) {
              const label = clean.includes("Representative stocks:")
                ? "Representative stocks:"
                : "Representative stocks";
              stocks = clean.split(label)[1].replace(/\*/g, "").trim();
            } else {
              reasoningLines.push(clean);
            }
          });

          // Style direction badge
          const dirLower = direction.toLowerCase();
          let badgeClass = "bg-slate-800 text-slate-400 border-slate-700";
          if (dirLower.includes("positive")) {
            badgeClass =
              "bg-bull/10 text-bull border-bull/20 shadow-[0_0_8px_rgba(16,185,129,0.1)]";
          } else if (dirLower.includes("negative")) {
            badgeClass = "bg-bear/10 text-bear border-bear/20";
          } else if (dirLower.includes("neutral")) {
            badgeClass = "bg-amber-500/10 text-amber-400 border-amber-500/20";
          }

          const isLastPara = idx === paras.length - 1;

          return (
            <div
              key={idx}
              className="glass-card bg-slate-900/40 p-4 border-[rgba(99,102,241,0.06)] hover:border-accent/20 hover:scale-[1.01] transition-all duration-200"
            >
              <div className="flex items-center justify-between border-b border-white/[0.03] pb-2 mb-2.5">
                <span className="font-semibold text-slate-200 text-xs tracking-wide flex items-center gap-1.5">
                  <span>📁</span>
                  <span>{sectorName || "Sector Impact"}</span>
                </span>
                {direction && (
                  <span
                    className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-full border ${badgeClass}`}
                  >
                    {direction}
                  </span>
                )}
              </div>

              {/* Reasoning */}
              <p className="text-xs text-slate-300 leading-relaxed mb-3">
                {reasoningLines
                  .join(" ")
                  .replace(/\*\*/g, "")
                  .replace(/\*/g, "")}
                {isLastPara && loading && (
                  <span className="inline-block w-1.5 h-3 bg-accent ml-0.5 animate-blink" />
                )}
              </p>

              {/* Representative stocks */}
              {stocks && (
                <div className="flex flex-wrap items-center gap-1.5 pt-2.5 border-t border-white/[0.03]">
                  <span className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold mr-1">
                    Representative Stocks:
                  </span>
                  {stocks.split(",").map((s, sIdx) => {
                    const cleanStock = s.replace(/\*/g, "").trim();
                    if (!cleanStock) return null;
                    return (
                      <span
                        key={sIdx}
                        className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-white/[0.03] text-slate-300 border border-white/[0.03]"
                      >
                        {cleanStock}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          );
        }

        // Check if paragraph is Note block
        const isNote =
          trimmed.startsWith("*") ||
          trimmed.toLowerCase().startsWith("note:") ||
          trimmed.toLowerCase().startsWith("*note:");

        if (isNote) {
          const cleanNote = trimmed
            .replace(/^#{1,6}\s*/, "")
            .replace(/^[-*•]\s+/, "")
            .replace(/\*/g, "");
          return (
            <div
              key={idx}
              className="p-3.5 bg-accent/5 border border-accent/15 rounded-xl text-xs text-slate-400 leading-relaxed italic mb-2"
            >
              💡 {cleanNote}
            </div>
          );
        }

        // Fallback Paragraph — strip markdown markers for clean display
        const cleanText = trimmed
          .replace(/^#{1,6}\s*/, "")
          .replace(/^[-*•]\s+/, "")
          .replace(/\*\*/g, "")
          .replace(/\*/g, "");
        const isLastPara = idx === paras.length - 1;

        return (
          <p
            key={idx}
            className="text-xs text-slate-300 mb-2.5 last:mb-0 leading-relaxed"
          >
            {cleanText.split(/\n/).map((line, lineIdx, arr) => (
              <span key={lineIdx}>
                {line}
                {lineIdx < arr.length - 1 && <br />}
              </span>
            ))}
            {isLastPara && loading && (
              <span className="inline-block w-1.5 h-3 bg-accent ml-0.5 animate-blink" />
            )}
          </p>
        );
      })}
    </div>
  );
}

export default function ImpactAnalyzer() {
  const setImpactOpen = useStore((s) => s.setImpactOpen);
  const impactText = useStore((s) => s.impactText);
  const impactLoading = useStore((s) => s.impactLoading);
  const appendImpactText = useStore((s) => s.appendImpactText);
  const setImpactLoading = useStore((s) => s.setImpactLoading);
  const setImpactText = useStore((s) => s.setImpactText);
  const resetImpact = useStore((s) => s.resetImpact);

  const [headline, setHeadline] = useState("");
  const [summary, setSummary] = useState("");

  async function onAnalyze() {
    if (!headline.trim() || impactLoading) return;
    resetImpact();
    setImpactText("");
    setImpactLoading(true);
    try {
      await streamImpact(
        { headline, summary },
        {
          meta: () => {},
          token: (d) => appendImpactText(d.text || ""),
          done: () => {},
        },
      );
    } catch (e) {
      setImpactText(`Error: ${e.message}`);
    } finally {
      setImpactLoading(false);
    }
  }

  const EXAMPLES = [
    "RBI raises repo rate by 25 bps to 6.75%",
    "Crude oil surges past $100/barrel on OPEC+ cuts",
    "US Fed signals rate cuts in Q1 2026",
    "India Q3 GDP growth at 7.2%, beats estimates",
    "SEBI tightens F&O margin requirements for retail",
  ];

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) setImpactOpen(false);
      }}
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={() => setImpactOpen(false)}
      />
      <div className="relative glass-card w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col animate-slide-up shadow-glow-accent">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(99,102,241,0.1)]">
          <div>
            <h2 className="text-base font-bold gradient-text">
              ⚡ Impact Analyzer
            </h2>
            <p className="text-xs text-muted mt-0.5">
              Enter a news headline to identify which sectors &amp; stocks are
              affected
            </p>
          </div>
          <button
            onClick={() => setImpactOpen(false)}
            className="text-muted hover:text-slate-100 text-xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 transition-all"
          >
            ×
          </button>
        </div>

        {/* Input area */}
        <div className="px-6 py-4 space-y-3 border-b border-[rgba(99,102,241,0.1)]">
          <div>
            <label className="text-xs text-muted uppercase tracking-wide mb-1.5 block">
              Headline *
            </label>
            <input
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && onAnalyze()}
              placeholder="e.g. RBI raises repo rate by 25 bps…"
              className="w-full bg-surface/50 border border-[rgba(99,102,241,0.2)] rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-muted outline-none focus:border-accent/50 transition-colors"
            />
          </div>
          <div>
            <label className="text-xs text-muted uppercase tracking-wide mb-1.5 block">
              Summary (optional)
            </label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={2}
              placeholder="Additional context…"
              className="w-full bg-surface/50 border border-[rgba(99,102,241,0.2)] rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-muted outline-none focus:border-accent/50 transition-colors resize-none"
            />
          </div>

          {/* Quick examples */}
          <div>
            <div className="text-[10px] text-muted mb-1.5 uppercase tracking-wide">
              Quick examples:
            </div>
            <div className="flex flex-wrap gap-1.5">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  onClick={() => setHeadline(ex)}
                  className="text-xs px-2.5 py-1 rounded-full border border-accent/20 bg-accent/5 text-accent-light hover:bg-accent/15 transition-all duration-200"
                >
                  {ex.slice(0, 42)}
                  {ex.length > 42 ? "…" : ""}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={onAnalyze}
            disabled={!headline.trim() || impactLoading}
            className="btn-primary w-full justify-center flex items-center gap-2"
          >
            {impactLoading ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                Analyzing…
              </>
            ) : (
              "⚡ Analyze Impact"
            )}
          </button>
        </div>

        {/* Result area */}
        <div className="flex-1 overflow-y-auto px-6 py-4 min-h-[12rem]">
          {impactLoading && !impactText && (
            <div className="flex items-center gap-2 text-muted text-sm">
              <div className="w-2 h-2 rounded-full bg-accent animate-pulse-soft" />
              Waiting for LLM analysis…
            </div>
          )}
          {impactText && (
            <div className="text-sm leading-relaxed text-slate-300">
              {formatImpactText(impactText, impactLoading)}
            </div>
          )}
          {!impactText && !impactLoading && (
            <div className="text-center text-muted py-8">
              <div className="text-5xl mb-3">📊</div>
              <div className="text-sm font-medium text-slate-400">
                Enter a headline above and click Analyze Impact
              </div>
              <div className="text-xs mt-1 text-muted">
                The AI will identify affected sectors and representative stocks
              </div>
            </div>
          )}
        </div>

        {/* Footer disclaimer */}
        <div className="px-6 py-2 border-t border-[rgba(99,102,241,0.08)]">
          <p className="text-[10px] text-muted italic text-center">
            AI-generated analysis · Not financial advice · Powered by Ollama
          </p>
        </div>
      </div>
    </div>
  );
}
