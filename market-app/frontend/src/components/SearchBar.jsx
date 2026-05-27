import { useState, useEffect, useRef } from "react";
import { searchSymbols } from "../api/market.js";
import { useStore } from "../store/useStore.js";

export default function SearchBar() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const setSelectedSymbol = useStore((s) => s.setSelectedSymbol);
  const debounce = useRef(null);

  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    if (!q.trim()) { setResults([]); return; }
    debounce.current = setTimeout(async () => {
      try { setResults(await searchSymbols(q.trim())); setOpen(true); }
      catch { setResults([]); }
    }, 300);
  }, [q]);

  return (
    <div className="relative">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Search stocks (e.g. Reliance, TCS)…"
        className="w-72 px-3 py-2 rounded-md border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
      />
      {open && results.length > 0 && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-md shadow-lg max-h-72 overflow-auto">
          {results.map((r) => (
            <button
              key={r.symbol}
              onMouseDown={() => { setSelectedSymbol(r.symbol); setQ(""); setOpen(false); }}
              className="w-full text-left px-3 py-2 hover:bg-slate-100 flex items-center justify-between"
            >
              <span className="text-sm">
                <span className="font-mono text-slate-700">{r.symbol}</span>
                <span className="ml-2 text-slate-500">{r.name}</span>
              </span>
              <span className="text-xs bg-slate-200 px-1.5 py-0.5 rounded">{r.exchange}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
