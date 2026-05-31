import { useState, useEffect, useRef } from "react";
import { useStore } from "../../store/useStore.js";
import { useQuote, useFundamentals, useSymbols } from "../../api/market.js";
import { streamCompare } from "../../api/llm.js";
import { formatINR } from "../../utils/formatters.js";

// Helper to query multiple components dynamically for comparison
function usePeerDetails(symbol) {
  const { data: q, isLoading: qLoad } = useQuote(symbol);
  const { data: f, isLoading: fLoad } = useFundamentals(symbol);
  return {
    symbol,
    loading: qLoad || fLoad,
    name: q?.name || "—",
    sector: f?.sector || "—",
    price: q?.price,
    change_pct: q?.change_pct ?? 0,
    pe_ratio: f?.pe_ratio,
    pb_ratio: f?.pb_ratio,
    roe: f?.roe,
    profit_margin: f?.profit_margin,
    debt_to_equity: f?.debt_to_equity,
    beta: f?.beta,
    high_52w: q?.high_52w ?? q?.price,
    low_52w: q?.low_52w ?? q?.price,
    target_price: f?.target_price,
  };
}

export default function PeerComparePanel({ symbol }) {
  const compareSymbols = useStore((s) => s.compareSymbols);
  const addCompareSymbol = useStore((s) => s.addCompareSymbol);
  const removeCompareSymbol = useStore((s) => s.removeCompareSymbol);
  const clearCompare = useStore((s) => s.clearCompare);

  const { data: allSymbols } = useSymbols();
  const [selectedPeerInput, setSelectedPeerInput] = useState("");
  const [narrativeText, setNarrativeText] = useState("");
  const [loadingNarrative, setLoadingNarrative] = useState(false);
  const abortRef = useRef(null);

  // Load details for target
  const targetData = usePeerDetails(symbol);

  // Load details for compared items
  // Since hooks cannot be called in a loop, we can just fetch target,
  // and load comparison lists in a single custom fetch or rely on manual lists.
  // Wait, to keep react-query hook call rules clean, we can fetch compare data by mapping or calling endpoints manually inside a useEffect or since comparison list is at most 3 items, we can write a nested component or fetch them dynamically!
  // Yes, a nested component is a brilliant way to fetch details for each symbol in the list without breaking hooks rules!

  useEffect(() => {
    setNarrativeText("");
    setLoadingNarrative(false);
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
  }, [symbol, compareSymbols]);

  // Handle adding peer symbol
  function handleAdd() {
    if (!selectedPeerInput) return;
    const cleanSym = selectedPeerInput.toUpperCase().trim();
    const formatted = cleanSym.endsWith(".NS") ? cleanSym : `${cleanSym}.NS`;
    addCompareSymbol(formatted);
    setSelectedPeerInput("");
  }

  // Pre-load representative peers inside same sector if user doesn't choose
  useEffect(() => {
    // If comparison slots are empty, let's auto-fill with first 2 same-sector peers
    if (compareSymbols.length === 0 && targetData?.sector !== "—") {
      // Find symbols in Nifty 50 with same sector
      // Wait, we can fetch peers using the existing peers list
      // For now let user add, or auto-fill later
    }
  }, [targetData?.sector]);

  async function triggerAICompare() {
    if (loadingNarrative || compareSymbols.length === 0) return;
    if (abortRef.current) abortRef.current.abort();
    
    const controller = new AbortController();
    abortRef.current = controller;

    setLoadingNarrative(true);
    setNarrativeText("");

    try {
      await streamCompare(
        { target_symbol: symbol, compare_symbols: compareSymbols },
        {
          token: (d) => setNarrativeText((t) => t + (d.text || "")),
          done: () => {},
        },
        controller.signal
      );
    } catch (err) {
      if (err.name !== "AbortError") {
        setNarrativeText("⚠️ Comparative analysis narrative failed to load. Ensure Ollama is serve-connected.");
      }
    } finally {
      setLoadingNarrative(false);
    }
  }

  // Render a comparison table row
  const renderRow = (label, key, formatter = (v) => v ?? "—") => {
    return (
      <tr className="border-b border-[rgba(255,255,255,0.03)] hover:bg-white/[0.01]">
        <td className="py-2 text-left font-sans font-medium text-slate-500 uppercase tracking-wider text-[9px]">{label}</td>
        {/* Target cell */}
        <td className="py-2 font-bold font-mono text-[#f0c56a] text-center">{formatter(targetData[key], targetData)}</td>
        {/* Peer cells */}
        {compareSymbols.map((s) => (
          <PeerTableCellKey key={s} symbol={s} fieldKey={key} formatter={formatter} />
        ))}
      </tr>
    );
  };

  return (
    <div className="space-y-4">
      {/* Controls: Peer selector */}
      <div className="space-y-2">
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pb-1 border-b border-[rgba(212,150,58,0.1)]">
          Compare Stock with Sector Peers (Up to 3)
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <select
            value={selectedPeerInput}
            onChange={(e) => setSelectedPeerInput(e.target.value)}
            className="w-full sm:flex-1 bg-[#111110] border border-[rgba(212,150,58,0.15)] text-xs text-[#ede8df] rounded-lg px-3 py-2 outline-none min-h-[44px]"
          >
            <option value="">-- Add peer stock --</option>
            {allSymbols
              ?.filter((s) => s.symbol !== symbol && !compareSymbols.includes(s.symbol))
              .map((s) => (
                <option key={s.symbol} value={s.symbol}>
                  {s.symbol.replace(".NS", "")} - {s.name} ({s.sector})
                </option>
              ))}
          </select>
          <button
            onClick={handleAdd}
            disabled={!selectedPeerInput || compareSymbols.length >= 3}
            className="btn-primary !min-h-[44px] !py-2 !px-4 w-full sm:w-auto shrink-0"
          >
            Add Peer
          </button>
        </div>

        {/* Selected peers list */}
        {compareSymbols.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {compareSymbols.map((s) => (
              <span
                key={s}
                className="inline-flex items-center gap-1.5 font-mono text-[9px] px-2.5 py-1 rounded-full border border-accent/15 bg-accent/8 text-[#d4963a] font-semibold uppercase"
              >
                {s.replace(".NS", "")}
                <button
                  onClick={() => removeCompareSymbol(s)}
                  className="hover:text-red-400 font-sans font-bold ml-1 transition-colors"
                >
                  ✕
                </button>
              </span>
            ))}
            <button
              onClick={clearCompare}
              className="text-[9.5px] font-bold text-slate-500 hover:text-red-400 transition-colors uppercase self-center pl-1 font-mono"
            >
              Clear All
            </button>
          </div>
        )}
      </div>

      {/* Comparative Data Grid */}
      <div className="p-3.5 rounded-xl bg-slate-900/60 border border-[rgba(212,150,58,0.08)] overflow-x-auto">
        <table className="w-full text-xs text-center border-collapse">
          <thead>
            <tr className="border-b border-[rgba(255,255,255,0.06)]">
              <th className="py-2 text-left font-sans text-[9px] text-[#7a7060] uppercase tracking-wider min-w-[100px]">Metric</th>
              <th className="py-2 text-[#f0c56a] font-mono uppercase font-black text-center min-w-[125px]">
                {symbol.replace(".NS", "")} [TGT]
              </th>
              {compareSymbols.map((s) => (
                <th key={s} className="py-2 text-slate-300 font-mono uppercase font-bold text-center relative min-w-[125px]">
                  <span className="block">{s.replace(".NS", "")}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-[rgba(255,255,255,0.03)]">
              <td className="py-2 text-left font-sans font-medium text-slate-500 uppercase tracking-wider text-[9px]">Name</td>
              <td className="py-2 font-semibold text-slate-200 text-center">
                <div className="line-clamp-1 max-w-[120px] mx-auto">{targetData.name}</div>
              </td>
              {compareSymbols.map((s) => (
                <PeerTableCellName key={s} symbol={s} />
              ))}
            </tr>
            {renderRow("Price", "price", (v) => (v ? formatINR(v) : "—"))}
            {renderRow("Change %", "change_pct", (v) => {
              if (v === undefined || v === null) return "—";
              const isPos = v >= 0;
              return <span className={isPos ? "text-emerald-400" : "text-rose-400"}>{isPos ? "+" : ""}{Number(v).toFixed(2)}%</span>;
            })}
            {renderRow("P/E Ratio", "pe_ratio", (v) => (v ? Number(v).toFixed(1) : "—"))}
            {renderRow("P/B Ratio", "pb_ratio", (v) => (v ? Number(v).toFixed(2) : "—"))}
            {renderRow("ROE", "roe", (v) => (v ? `${v}%` : "—"))}
            {renderRow("Profit Margin", "profit_margin", (v) => (v ? `${v}%` : "—"))}
            {renderRow("Debt/Equity", "debt_to_equity", (v) => (v ? Number(v).toFixed(2) : "—"))}
            {renderRow("Beta", "beta", (v) => (v ? Number(v).toFixed(2) : "—"))}
          </tbody>
        </table>
      </div>

      {/* AI Comparison synthesis report */}
      {compareSymbols.length > 0 && (
        <div className="border-t border-[rgba(212,150,58,0.1)] pt-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
              AI Peer Comparative Analysis Narrative
            </span>
            <button
              onClick={triggerAICompare}
              disabled={loadingNarrative}
              className="btn-primary text-[10.5px] px-3.5 py-1.5 flex items-center gap-1.5"
            >
              {loadingNarrative ? (
                <>
                  <span className="w-3 h-3 rounded-full border border-white/30 border-t-white animate-spin" />
                  Synthesizing Report…
                </>
              ) : (
                <>
                  ✨ {narrativeText ? "Re-Analyze Peers" : "AI Peer Synthesis"}
                </>
              )}
            </button>
          </div>

          {/* Narrative text block */}
          {narrativeText && (
            <div className="rounded-xl p-4 bg-black/35 border border-[rgba(212,150,58,0.1)] text-slate-300 text-xs leading-relaxed space-y-2 font-sans typewriter-cursor">
              {narrativeText.split("\n").filter(Boolean).map((line, idx) => {
                if (line.startsWith("1.") || line.startsWith("2.") || line.startsWith("3.") || line.startsWith("4.")) {
                  return <h4 key={idx} className="text-slate-100 font-extrabold text-[11px] pt-1.5">{line}</h4>;
                }
                return <p key={idx}>{line}</p>;
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Sub-component to fetch and render name safely
function PeerTableCellName({ symbol }) {
  const { data: q } = useQuote(symbol);
  return (
    <td className="py-2 text-slate-300 text-center">
      <div className="line-clamp-1 max-w-[120px] mx-auto">{q?.name || "—"}</div>
    </td>
  );
}

// Sub-component to fetch and render cell metrics safely
function PeerTableCellKey({ symbol, fieldKey, formatter }) {
  const { data: q } = useQuote(symbol);
  const { data: f } = useFundamentals(symbol);
  
  const metrics = {
    price: q?.price,
    change_pct: q?.change_pct,
    pe_ratio: f?.pe_ratio,
    pb_ratio: f?.pb_ratio,
    roe: f?.roe,
    profit_margin: f?.profit_margin,
    debt_to_equity: f?.debt_to_equity,
    beta: f?.beta,
  };
  
  const val = metrics[fieldKey];
  return <td className="py-2 font-mono text-slate-300 text-center">{formatter(val, { price: q?.price })}</td>;
}
