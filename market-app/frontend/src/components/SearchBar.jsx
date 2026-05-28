import { useState, useEffect, useRef, useCallback } from "react";
import { searchSymbols } from "../api/market.js";
import { useStore } from "../store/useStore.js";

export default function SearchBar() {
  const [q, setQ]           = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen]     = useState(false);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(-1);

  const setSelectedSymbol = useStore((s) => s.setSelectedSymbol);
  const debounceRef = useRef(null);
  const inputRef    = useRef(null);
  const containerRef = useRef(null);

  // ── Global keyboard shortcut (Ctrl/Cmd+K) ──────────────────
  useEffect(() => {
    function onKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
      if (e.key === "Escape") {
        setOpen(false);
        setQ("");
        inputRef.current?.blur();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // ── Debounced search ───────────────────────────────────────
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q.trim()) {
      setResults([]);
      setSelectedIdx(-1);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await searchSymbols(q.trim());
        setResults(res || []);
        setSelectedIdx(-1);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);
  }, [q]);

  // ── Keyboard navigation in dropdown ──────────────────────
  function onKeyDown(e) {
    if (!open || !results.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && selectedIdx >= 0) {
      e.preventDefault();
      pick(results[selectedIdx]);
    }
  }

  function pick(r) {
    setSelectedSymbol(r.symbol);
    setQ("");
    setOpen(false);
    inputRef.current?.blur();
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Search input */}
      <div
        className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all duration-200 w-48 sm:w-56 ${
          focused
            ? "border-accent/50 shadow-[0_0_0_3px_rgba(99,102,241,0.1)]"
            : "border-[rgba(99,102,241,0.18)] hover:border-accent/35"
        } bg-surface`}
      >
        <span className="text-muted text-sm shrink-0">🔍</span>
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => { setFocused(true); if (results.length) setOpen(true); }}
          onBlur={() => {
            setFocused(false);
            setTimeout(() => setOpen(false), 150);
          }}
          onKeyDown={onKeyDown}
          placeholder="Search stocks…"
          className="flex-1 bg-transparent text-xs text-slate-200 placeholder-muted outline-none min-w-0"
        />
        <kbd className="hidden sm:inline text-[9px] text-muted border border-slate-700 rounded px-1 py-0.5 shrink-0 font-mono">
          ⌘K
        </kbd>
        {loading && (
          <div className="w-3 h-3 rounded-full border-2 border-accent/30 border-t-accent animate-spin shrink-0" />
        )}
      </div>

      {/* Dropdown */}
      {open && results.length > 0 && (
        <div className="absolute z-50 mt-2 right-0 w-72 glass-card shadow-glow-accent overflow-hidden animate-fade-in">
          {results.slice(0, 8).map((r, i) => (
            <button
              key={r.symbol}
              onMouseDown={() => pick(r)}
              className={`w-full text-left px-4 py-2.5 flex items-center justify-between transition-colors ${
                i === selectedIdx ? "bg-accent/10" : "hover:bg-white/[0.04]"
              }`}
            >
              <div className="min-w-0">
                <span className="font-mono text-sm text-slate-200">{r.symbol}</span>
                <span className="ml-2 text-xs text-muted truncate">
                  {r.name?.slice(0, 28)}
                </span>
              </div>
              <span className="text-[9px] bg-accent/10 text-accent-light px-1.5 py-0.5 rounded border border-accent/20 shrink-0 ml-2">
                {r.exchange}
              </span>
            </button>
          ))}
          {results.length > 8 && (
            <div className="px-4 py-2 text-[10px] text-muted border-t border-[rgba(99,102,241,0.06)]">
              +{results.length - 8} more results
            </div>
          )}
        </div>
      )}
    </div>
  );
}
