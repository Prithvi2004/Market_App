import { useQuote, useFundamentals, useTerminalChart } from "../../api/market.js";
import { formatINR } from "../../utils/formatters.js";
import { runAllIndicators } from "./IndicatorEngine.js";
import { detectPatterns } from "./PatternEngine.js";

export default function ExportReport({ symbol }) {
  const { data: q, isLoading: qLoad } = useQuote(symbol);
  const { data: f, isLoading: fLoad } = useFundamentals(symbol);
  const { data: rawChart, isLoading: cLoad } = useTerminalChart(symbol, "1M");

  const indicators = rawChart ? runAllIndicators(rawChart) : null;
  const patterns = rawChart ? detectPatterns(rawChart) : [];

  function triggerPrint() {
    window.print();
  }

  const loading = qLoad || fLoad || cLoad;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-xs text-slate-400">
        <div className="w-8 h-8 rounded-full border-2 border-[rgba(212,150,58,0.2)] border-t-[#d4963a] animate-spin mb-3" />
        <span>Compiling executive report metrics...</span>
      </div>
    );
  }

  if (!q || !f) {
    return (
      <div className="p-4 rounded-xl border border-red-500/10 bg-red-500/5 text-center text-xs text-red-400">
        ⚠️ Failed to compile report details.
      </div>
    );
  }

  const posPct = f["52w_position_pct"] ?? 50.0;
  const bullishPatterns = patterns.filter((p) => p.direction === "bullish");
  const bearishPatterns = patterns.filter((p) => p.direction === "bearish");

  return (
    <div className="space-y-4">
      {/* Action banner */}
      <div className="flex items-center justify-between p-3.5 bg-slate-900/40 rounded-xl border border-[rgba(212,150,58,0.08)]">
        <div>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
            Executive Report Exporter
          </span>
          <span className="text-[9.5px] text-[#7a7060] font-sans">
            Print this page directly to a PDF or paper report.
          </span>
        </div>
        <button
          onClick={triggerPrint}
          className="btn-primary !min-h-[38px] !py-1.5 !px-4 text-xs shrink-0 flex items-center gap-1.5"
        >
          🖨️ Export PDF / Print
        </button>
      </div>

      {/* Report Preview */}
      <div className="border border-[rgba(212,150,58,0.15)] rounded-xl overflow-hidden bg-white text-slate-800 p-8 shadow-2xl max-h-[600px] overflow-y-auto print:max-h-none print:overflow-visible print:border-none print:shadow-none print:p-0">
        {/* Style block for print mode */}
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            body * {
              visibility: hidden;
            }
            .print-report-container, .print-report-container * {
              visibility: visible;
            }
            .print-report-container {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              color: #000 !important;
              background: #fff !important;
            }
            .no-print {
              display: none !important;
            }
          }
        `}} />

        <div className="print-report-container space-y-6 font-sans text-xs">
          {/* Header */}
          <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start">
            <div>
              <div className="text-[9px] font-black uppercase tracking-widest text-[#a07028] font-mono">
                Equity Investment Analysis Brief
              </div>
              <h1 className="text-xl font-bold font-serif text-slate-900 mt-1">
                {q.name} ({symbol.replace(".NS", "")})
              </h1>
              <p className="text-[10px] text-slate-500 mt-0.5">{f.sector} · {f.industry} · NSE India</p>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-slate-400 font-mono">{new Date().toLocaleDateString("en-IN")}</div>
              <div className="text-sm font-bold mt-1 text-slate-900 font-mono">{formatINR(q.price)}</div>
              <div className={`text-[10px] font-bold font-mono ${q.change_pct >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                {q.change_pct >= 0 ? "+" : ""}{q.change_pct.toFixed(2)}%
              </div>
            </div>
          </div>

          {/* Quick Metrics grid */}
          <div className="grid grid-cols-3 gap-4 py-2 border-b border-slate-200">
            <div>
              <span className="block text-[8px] text-slate-400 uppercase font-black tracking-wider">Market Capitalization</span>
              <span className="text-[11px] font-bold font-mono text-slate-800">
                {f.market_cap ? `₹${(f.market_cap / 1e7).toFixed(1)} Cr` : "—"}
              </span>
            </div>
            <div>
              <span className="block text-[8px] text-slate-400 uppercase font-black tracking-wider">Trailing P/E Ratio</span>
              <span className="text-[11px] font-bold font-mono text-slate-800">{f.pe_ratio ? f.pe_ratio.toFixed(1) : "—"}</span>
            </div>
            <div>
              <span className="block text-[8px] text-slate-400 uppercase font-black tracking-wider">Return on Equity (ROE)</span>
              <span className="text-[11px] font-bold font-mono text-slate-800">{f.roe ? `${f.roe}%` : "—"}</span>
            </div>
          </div>

          {/* Valuation Details */}
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2 font-mono">
              1. Fundamental Valuation Analysis
            </h3>
            <div className="grid grid-cols-2 gap-x-8 gap-y-1">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Forward P/E Ratio</span>
                <span className="font-mono text-slate-950 font-bold">{f.forward_pe || "—"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Profit Margin</span>
                <span className="font-mono text-slate-950 font-bold">{f.profit_margin ? `${f.profit_margin}%` : "—"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Price-to-Book (P/B)</span>
                <span className="font-mono text-slate-950 font-bold">{f.pb_ratio || "—"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Debt-to-Equity</span>
                <span className="font-mono text-slate-950 font-bold">{f.debt_to_equity || "—"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Earnings Per Share (EPS)</span>
                <span className="font-mono text-slate-950 font-bold">{f.eps ? formatINR(f.eps) : "—"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Beta (Volatility)</span>
                <span className="font-mono text-slate-950 font-bold">{f.beta || "—"}</span>
              </div>
            </div>
          </div>

          {/* Technical Diagnostics */}
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2 font-mono">
              2. Technical Indicator Diagnostics
            </h3>
            
            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
              {/* Pattern signals */}
              <div className="space-y-1">
                <span className="block text-[8px] text-slate-400 uppercase font-black tracking-wider">Active Candle Patterns</span>
                {patterns.length > 0 ? (
                  <div className="space-y-1 pt-0.5">
                    {patterns.slice(0, 3).map((p, idx) => (
                      <div key={idx} className="flex justify-between items-center text-[10px] py-0.5 border-b border-slate-50">
                        <span className="font-medium text-slate-800">{p.name}</span>
                        <span className={`font-bold font-mono text-[8px] uppercase ${p.direction === "bullish" ? "text-emerald-600" : "text-rose-600"}`}>
                          {p.direction}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-slate-500 text-[10px] block py-1">No major candlestick pattern breakouts.</span>
                )}
              </div>

              {/* Support & Resistance */}
              <div className="space-y-1">
                <span className="block text-[8px] text-slate-400 uppercase font-black tracking-wider">Volatility Positioning</span>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">52W Position Range</span>
                  <span className="font-mono text-slate-950 font-bold">{posPct.toFixed(0)}% of range</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">52W Boundaries</span>
                  <span className="font-mono text-slate-950 font-semibold">{formatINR(f["52w_low"])} - {formatINR(f["52w_high"])}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Analyst recommendations & targets */}
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2 font-mono">
              3. Wall Street &amp; Consensus Targets ({f.num_analysts || 0} analysts)
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="border border-slate-200 p-2.5 rounded text-center">
                <span className="block text-[8px] text-slate-400 uppercase tracking-wider">Consensus Rec</span>
                <span className="text-xs font-bold text-slate-900 uppercase mt-0.5 block">{f.analyst_recommendation || "Hold"}</span>
              </div>
              <div className="border border-slate-200 p-2.5 rounded text-center">
                <span className="block text-[8px] text-slate-400 uppercase tracking-wider">Target Price (Mean)</span>
                <span className="text-xs font-bold text-[#a07028] font-mono mt-0.5 block">{f.target_price ? formatINR(f.target_price) : "—"}</span>
              </div>
              <div className="border border-slate-200 p-2.5 rounded text-center">
                <span className="block text-[8px] text-slate-400 uppercase tracking-wider">Implied Target Upside</span>
                <span className="text-xs font-bold text-emerald-600 font-mono mt-0.5 block">
                  {f.target_price && q.price ? (((f.target_price - q.price) / q.price) * 100).toFixed(1) + "%" : "—"}
                </span>
              </div>
            </div>
          </div>

          {/* Executive Disclaimer */}
          <div className="border-t border-slate-300 pt-3 text-[8.5px] text-slate-400 text-center leading-relaxed">
            This report represents a mathematical aggregation of daily historical pricing, technical breakouts, and consensus fundamental ratios. It does not represent an endorsement, solicitation, or recommendation to buy/sell securities. Personal research is advised.
          </div>
        </div>
      </div>
    </div>
  );
}
