import { useState } from "react";
import { usePortfolioStore } from "../../store/useStore.js";
import { usePortfolioRisk } from "../../api/market.js";
import { formatINR, formatPct } from "../../utils/formatters.js";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

const TIMEFRAMES = [
  { id: "3m", label: "3 Months (Short-term Covariance)" },
  { id: "1y", label: "1 Year (Medium-term Structural Risk)" },
];

export default function RiskAnalyticsPanel() {
  const holdings = usePortfolioStore((s) => s.holdings);
  const [period, setPeriod] = useState("1y");
  
  const { data: risk, isLoading, error } = usePortfolioRisk(holdings, period);

  if (!holdings || holdings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center text-xs text-slate-400">
        <span className="text-3xl mb-3">💼</span>
        <p className="font-semibold text-slate-300">Portfolio is empty</p>
        <p className="text-[10px] text-slate-500 mt-0.5">Add stocks to your portfolio tracker to run risk diagnostics.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-xs text-slate-400">
        <div className="w-8 h-8 rounded-full border-2 border-[rgba(212,150,58,0.2)] border-t-[#d4963a] animate-spin mb-3" />
        <span>Running 1,000 Monte Carlo simulation runs and computing portfolio covariance...</span>
      </div>
    );
  }

  if (error || !risk || risk.error) {
    return (
      <div className="p-4 rounded-xl border border-red-500/10 bg-red-500/5 text-center text-xs text-red-400">
        ⚠️ Failed to compile risk analytics: {error?.message || risk?.error || "Unknown Error"}
      </div>
    );
  }

  const {
    active_total_value,
    portfolio_beta,
    betas,
    volatilities,
    correlation_matrix,
    simulation_chart,
    var_95,
    var_pct,
    expected_shortfall,
    es_pct,
  } = risk;

  // Render Beta color class
  const betaColorClass =
    portfolio_beta > 1.2
      ? "text-rose-400"
      : portfolio_beta < 0.8
      ? "text-emerald-400"
      : "text-amber-400";

  return (
    <div className="space-y-5">
      {/* Timeframe select */}
      <div className="flex items-center justify-between pb-1 border-b border-[rgba(212,150,58,0.1)]">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
          Portfolio Risk Analytics &amp; Stress Testing
        </span>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="bg-[#111110] border border-[rgba(212,150,58,0.15)] text-[10px] font-semibold text-[#d4963a] rounded px-2.5 py-1 outline-none"
        >
          {TIMEFRAMES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {/* Grid: Beta Dial & VaR metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Beta metric */}
        <div className="bg-[#111110]/60 border border-[rgba(212,150,58,0.06)] rounded-xl p-4 flex flex-col justify-between items-center text-center">
          <div>
            <div className="text-[9px] text-[#7a7060] uppercase tracking-wider font-bold">Portfolio Beta</div>
            <div className={`text-3xl font-black font-mono mt-1 ${betaColorClass}`}>
              {portfolio_beta.toFixed(2)}
            </div>
          </div>
          <p className="text-[9.5px] text-[#7a7060] leading-relaxed mt-2 italic">
            {portfolio_beta > 1.1 ? (
              "High-Beta: Hyper-sensitive to market movements. Higher risk/reward."
            ) : portfolio_beta < 0.9 ? (
              "Defensive: Dampened sensitivity. Insulated from steep corrections."
            ) : (
              "Neutral-Beta: Correlates evenly with benchmark returns."
            )}
          </p>
        </div>

        {/* VaR card */}
        <div className="bg-[#111110]/60 border border-[rgba(212,150,58,0.06)] rounded-xl p-4 space-y-2">
          <div className="border-b border-[rgba(255,255,255,0.04)] pb-1.5 flex justify-between items-center">
            <span className="text-[9px] text-[#7a7060] uppercase tracking-wider font-bold">95% Value-at-Risk (VaR)</span>
            <span className="text-[10px] font-bold text-rose-400 font-mono">-{var_pct.toFixed(1)}%</span>
          </div>
          <div className="text-base font-extrabold font-mono text-slate-100">
            {formatINR(var_95)}
          </div>
          <p className="text-[9px] text-muted leading-relaxed">
            With 95% confidence, the portfolio value loss will not exceed this limit over the next 30 days.
          </p>
        </div>

        {/* Expected Shortfall (ES) */}
        <div className="bg-[#111110]/60 border border-[rgba(212,150,58,0.06)] rounded-xl p-4 space-y-2">
          <div className="border-b border-[rgba(255,255,255,0.04)] pb-1.5 flex justify-between items-center">
            <span className="text-[9px] text-[#7a7060] uppercase tracking-wider font-bold">Expected Shortfall</span>
            <span className="text-[10px] font-bold text-rose-400 font-mono">-{es_pct.toFixed(1)}%</span>
          </div>
          <div className="text-base font-extrabold font-mono text-slate-100">
            {formatINR(expected_shortfall)}
          </div>
          <p className="text-[9px] text-muted leading-relaxed">
            If extreme events breach the VaR boundary, the projected average loss is estimated here.
          </p>
        </div>
      </div>

      {/* Monte Carlo simulation path graph */}
      <div className="space-y-1.5">
        <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
          Monte Carlo 30-Day Simulation Probability Boundaries
        </div>
        <div className="h-[240px] w-full bg-[#0b0b09]/40 rounded-xl border border-[rgba(212,150,58,0.08)] p-3 relative">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={simulation_chart} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(212,150,58, 0.03)" vertical={false} />
              <XAxis dataKey="day" stroke="#475569" fontSize={8.5} tickLine={false} axisLine={false} dy={5} />
              <YAxis
                domain={["auto", "auto"]}
                stroke="#475569"
                fontSize={8.5}
                tickLine={false}
                axisLine={false}
                orientation="right"
                dx={5}
                tickFormatter={(v) => (v / 1000).toFixed(0) + "k"}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const data = payload[0].payload;
                  return (
                    <div className="bg-[#0b1220]/95 border border-[rgba(212,150,58,0.25)] rounded-xl p-3 shadow-2xl backdrop-blur-md text-xs font-mono">
                      <div className="text-[9px] text-slate-500 font-bold uppercase mb-1">{data.day} Projection</div>
                      <div className="space-y-1">
                        <div className="flex justify-between gap-4 text-emerald-400 font-semibold">
                          <span>Bullish Limit:</span>
                          <span>{formatINR(data.Bullish)}</span>
                        </div>
                        <div className="flex justify-between gap-4 text-fuchsia-400 font-semibold">
                          <span>Median Neutral:</span>
                          <span>{formatINR(data.Neutral)}</span>
                        </div>
                        <div className="flex justify-between gap-4 text-rose-400 font-semibold">
                          <span>Bearish Limit:</span>
                          <span>{formatINR(data.Bearish)}</span>
                        </div>
                      </div>
                    </div>
                  );
                }}
              />
              
              <Area type="monotone" dataKey="Bullish" stroke="none" fill="rgba(139, 92, 246, 0.03)" connectNulls />
              <Line type="monotone" dataKey="Neutral" stroke="#d946ef" strokeWidth={2} dot={false} connectNulls />
              <Line type="monotone" dataKey="Bullish" stroke="rgba(16, 185, 129, 0.5)" strokeWidth={1} strokeDasharray="3 3" dot={false} connectNulls />
              <Line type="monotone" dataKey="Bearish" stroke="rgba(244, 63, 94, 0.5)" strokeWidth={1} strokeDasharray="3 3" dot={false} connectNulls />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="text-[8.5px] text-[#7a7060] text-center">
          Simulated path models are generated via multi-asset Brownian motion convolving correlation matrices.
        </div>
      </div>

      {/* Correlation Matrix Heatmap */}
      <div className="space-y-2">
        <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
          Asset Daily Return Correlation Heatmap
        </div>
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-[rgba(212,150,58,0.08)] overflow-x-auto">
          <table className="w-full text-[10.5px] border-collapse font-mono text-center">
            <thead>
              <tr className="border-b border-[rgba(255,255,255,0.06)]">
                <th className="py-2 text-left font-sans text-[9px] text-[#7a7060] uppercase tracking-wider">Asset</th>
                {correlation_matrix.map((row) => (
                  <th key={row.symbol} className="py-2 px-1 text-slate-300">
                    {row.symbol.replace(".NS", "")}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {correlation_matrix.map((row) => (
                <tr key={row.symbol} className="border-b border-[rgba(255,255,255,0.03)] last:border-0">
                  <td className="py-2.5 text-left text-slate-200 font-bold font-sans">
                    {row.symbol.replace(".NS", "")}
                  </td>
                  {correlation_matrix.map((col) => {
                    const val = row[col.symbol] ?? 1.0;
                    
                    // Heatmap shading mapping
                    // values closer to 1.0 are bright gold, closer to 0.0 are dark gray, closer to -1.0 are bright red
                    let bg = "rgba(255,255,255,0.02)";
                    let color = "text-slate-400";
                    if (val > 0.7) {
                      bg = `rgba(212,150,58,${0.15 + (val - 0.7) * 0.8})`;
                      color = "text-[#f0c56a] font-extrabold";
                    } else if (val > 0.3) {
                      bg = `rgba(212,150,58,${0.05 + (val - 0.3) * 0.25})`;
                      color = "text-slate-200";
                    } else if (val < -0.2) {
                      bg = `rgba(244,63,94,${Math.abs(val) * 0.3})`;
                      color = "text-rose-400";
                    }

                    return (
                      <td
                        key={col.symbol}
                        className={`py-2 px-1 transition-colors duration-150 ${color}`}
                        style={{ backgroundColor: bg }}
                      >
                        {val.toFixed(2)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
