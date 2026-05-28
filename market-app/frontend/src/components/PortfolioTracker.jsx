import { useState, useEffect } from "react";
import { useStore, usePortfolioStore } from "../store/useStore.js";
import { portfolioValue } from "../api/market.js";
import { formatINR, formatPct, colorClass } from "../utils/formatters.js";

// List of supported Nifty 50 stocks for selection
const NIFTY50_OPTIONS = [
  { symbol: "RELIANCE.NS", name: "Reliance Industries" },
  { symbol: "TCS.NS", name: "Tata Consultancy Services" },
  { symbol: "HDFCBANK.NS", name: "HDFC Bank" },
  { symbol: "INFY.NS", name: "Infosys" },
  { symbol: "ICICIBANK.NS", name: "ICICI Bank" },
  { symbol: "HINDUNILVR.NS", name: "Hindustan Unilever" },
  { symbol: "ITC.NS", name: "ITC" },
  { symbol: "SBIN.NS", name: "State Bank of India" },
  { symbol: "BHARTIARTL.NS", name: "Bharti Airtel" },
  { symbol: "KOTAKBANK.NS", name: "Kotak Mahindra Bank" },
  { symbol: "LT.NS", name: "Larsen & Toubro" },
  { symbol: "AXISBANK.NS", name: "Axis Bank" },
  { symbol: "ASIANPAINT.NS", name: "Asian Paints" },
  { symbol: "MARUTI.NS", name: "Maruti Suzuki" },
  { symbol: "TITAN.NS", name: "Titan Company" },
  { symbol: "SUNPHARMA.NS", name: "Sun Pharmaceutical" },
  { symbol: "BAJFINANCE.NS", name: "Bajaj Finance" },
  { symbol: "WIPRO.NS", name: "Wipro" },
  { symbol: "HCLTECH.NS", name: "HCL Technologies" },
  { symbol: "ULTRACEMCO.NS", name: "UltraTech Cement" },
  { symbol: "ONGC.NS", name: "Oil and Natural Gas Corp" },
  { symbol: "POWERGRID.NS", name: "Power Grid Corp" },
  { symbol: "NTPC.NS", name: "NTPC" },
  { symbol: "JSWSTEEL.NS", name: "JSW Steel" },
  { symbol: "TATASTEEL.NS", name: "Tata Steel" },
  { symbol: "TATAMOTORS.NS", name: "Tata Motors" },
  { symbol: "M&M.NS", name: "Mahindra & Mahindra" },
  { symbol: "ADANIENT.NS", name: "Adani Enterprises" },
  { symbol: "ADANIPORTS.NS", name: "Adani Ports" },
  { symbol: "COALINDIA.NS", name: "Coal India" },
  { symbol: "DIVISLAB.NS", name: "Divi's Laboratories" },
  { symbol: "DRREDDY.NS", name: "Dr. Reddy's Labs" },
  { symbol: "EICHERMOT.NS", name: "Eicher Motors" },
  { symbol: "GRASIM.NS", name: "Grasim Industries" },
  { symbol: "HDFCLIFE.NS", name: "HDFC Life Insurance" },
  { symbol: "INDUSINDBK.NS", name: "IndusInd Bank" },
  { symbol: "NESTLEIND.NS", name: "Nestle India" },
  { symbol: "SBILIFE.NS", name: "SBI Life Insurance" },
  { symbol: "TECHM.NS", name: "Tech Mahindra" },
  { symbol: "APOLLOHOSP.NS", name: "Apollo Hospitals" },
  { symbol: "BAJAJFINSV.NS", name: "Bajaj Finserv" },
  { symbol: "BAJAJ-AUTO.NS", name: "Bajaj Auto" },
  { symbol: "BPCL.NS", name: "Bharat Petroleum" },
  { symbol: "BRITANNIA.NS", name: "Britannia Industries" },
  { symbol: "CIPLA.NS", name: "Cipla" },
  { symbol: "HEROMOTOCO.NS", name: "Hero MotoCorp" },
  { symbol: "HINDALCO.NS", name: "Hindalco Industries" },
  { symbol: "TATACONSUM.NS", name: "Tata Consumer Products" },
  { symbol: "UPL.NS", name: "UPL" },
  { symbol: "VEDL.NS", name: "Vedanta" }
];

export default function PortfolioTracker() {
  const setPortfolioOpen = useStore((s) => s.setPortfolioOpen);
  const setSelectedSymbol = useStore((s) => s.setSelectedSymbol);
  
  const holdings = usePortfolioStore((s) => s.holdings);
  const addHolding = usePortfolioStore((s) => s.addHolding);
  const removeHolding = usePortfolioStore((s) => s.removeHolding);

  // Form states
  const [selectedStock, setSelectedStock] = useState("");
  const [qty, setQty] = useState("");
  const [buyPrice, setBuyPrice] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Valuation states
  const [valResponse, setValResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch P&L values from backend
  useEffect(() => {
    if (!holdings || holdings.length === 0) {
      setValResponse(null);
      return;
    }

    let active = true;

    async function fetchValuation() {
      setLoading(true);
      try {
        const payload = holdings.map((h) => ({
          symbol: h.symbol,
          qty: parseFloat(h.qty),
          buy_price: parseFloat(h.buy_price)
        }));
        const res = await portfolioValue(payload);
        if (active) {
          setValResponse(res);
          setError("");
        }
      } catch (err) {
        if (active) {
          setError("Failed to fetch live quotes. Showing offline calculations.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchValuation();
    const interval = setInterval(fetchValuation, 60000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [holdings]);

  // Form actions
  function onAdd(e) {
    e.preventDefault();
    if (!selectedStock || !qty || !buyPrice) return;
    const stock = NIFTY50_OPTIONS.find((s) => s.symbol === selectedStock);
    if (!stock) return;

    // Check if symbol already exists to prevent duplicate symbols
    const exists = holdings.find((h) => h.symbol === stock.symbol);
    if (exists) {
      alert(`${stock.name} is already in your portfolio. Delete it first to re-add.`);
      return;
    }

    addHolding({
      symbol: stock.symbol,
      name: stock.name,
      qty: parseFloat(qty),
      buy_price: parseFloat(buyPrice)
    });

    // Reset
    setSelectedStock("");
    setQty("");
    setBuyPrice("");
    setSearchQuery("");
    setFormOpen(false);
  }

  // Filter options for dropdown autocomplete
  const filteredOptions = NIFTY50_OPTIONS.filter(
    (o) =>
      o.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate offline fallback values if API fails or offline
  const offlineSummary = () => {
    let totalInvested = 0;
    holdings.forEach((h) => {
      totalInvested += h.qty * h.buy_price;
    });
    return {
      total_invested: totalInvested
    };
  };

  const hasHoldings = holdings && holdings.length > 0;
  const displaySummary = valResponse || offlineSummary();

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) setPortfolioOpen(false);
      }}
    >
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-md transition-opacity duration-300"
        onClick={() => setPortfolioOpen(false)}
      />
      <div className="relative glass-card w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col animate-slide-up shadow-glow-accent">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(99,102,241,0.1)]">
          <div className="flex items-center gap-2">
            <span className="text-xl">💼</span>
            <div>
              <h2 className="text-base font-bold text-slate-100">My Portfolio</h2>
              <p className="text-[10px] text-muted">
                Track your investments and live P&L
              </p>
            </div>
            {loading && (
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse shadow-[0_0_6px_#6366f1]" />
            )}
          </div>
          <button
            onClick={() => setPortfolioOpen(false)}
            className="text-slate-400 hover:text-slate-200 text-lg transition-colors p-1"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Status Alert */}
          {error && (
            <div className="px-4 py-2 bg-bear/10 border border-bear/20 rounded-lg text-xs text-bear">
              ⚠️ {error}
            </div>
          )}

          {/* Metrics summary cards */}
          {hasHoldings && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="glass-card bg-slate-900/40 p-4 border-[rgba(99,102,241,0.06)]">
                <span className="text-[10px] font-medium text-slate-500 uppercase">
                  Invested Capital
                </span>
                <p className="text-lg font-bold text-slate-100 mt-1">
                  {formatINR(displaySummary.total_invested)}
                </p>
              </div>

              <div className="glass-card bg-slate-900/40 p-4 border-[rgba(99,102,241,0.06)]">
                <span className="text-[10px] font-medium text-slate-500 uppercase">
                  Current Value
                </span>
                <p className="text-lg font-bold text-slate-100 mt-1">
                  {valResponse
                    ? formatINR(valResponse.total_current_value)
                    : "Fetching..."}
                </p>
              </div>

              <div
                className={`glass-card p-4 transition-all duration-300 ${
                  valResponse?.total_pnl > 0
                    ? "bg-bull/5 border-bull/20 shadow-[0_4px_20px_rgba(16,185,129,0.05)]"
                    : valResponse?.total_pnl < 0
                    ? "bg-bear/5 border-bear/20"
                    : "bg-slate-900/40 border-[rgba(99,102,241,0.06)]"
                }`}
              >
                <span className="text-[10px] font-medium text-slate-500 uppercase">
                  Total P&L
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  {valResponse ? (
                    <>
                      <span
                        className={`text-lg font-bold ${colorClass(
                          valResponse.total_pnl
                        )}`}
                      >
                        {valResponse.total_pnl > 0 ? "+" : ""}
                        {formatINR(valResponse.total_pnl)}
                      </span>
                      <span
                        className={`text-xs font-semibold ${colorClass(
                          valResponse.total_pnl_pct
                        )}`}
                      >
                        ({formatPct(valResponse.total_pnl_pct)})
                      </span>
                    </>
                  ) : (
                    <span className="text-slate-400 text-sm italic">
                      Valuing...
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Form to Add Asset */}
          {formOpen ? (
            <form
              onSubmit={onAdd}
              className="glass-card bg-slate-900/30 p-5 space-y-4 border-[rgba(99,102,241,0.15)] animate-fade-in"
            >
              <h3 className="text-sm font-semibold text-slate-200">
                ➕ Add Holding
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Autocomplete Search Dropdown */}
                <div className="relative">
                  <label className="block text-[10px] text-slate-400 mb-1">
                    Select Stock
                  </label>
                  <input
                    type="text"
                    placeholder="Search NIFTY 50 stock..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setDropdownOpen(true);
                    }}
                    onFocus={() => setDropdownOpen(true)}
                    className="w-full bg-slate-950/80 border border-[rgba(99,102,241,0.2)] rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-accent"
                  />
                  {dropdownOpen && (
                    <div className="absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-slate-950 border border-[rgba(99,102,241,0.25)] rounded-lg shadow-2xl z-50">
                      {filteredOptions.length > 0 ? (
                        filteredOptions.map((o) => (
                          <button
                            key={o.symbol}
                            type="button"
                            onClick={() => {
                              setSelectedStock(o.symbol);
                              setSearchQuery(`${o.symbol.replace(".NS","")} (${o.name})`);
                              setDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 text-xs transition-colors hover:bg-white/[0.04] ${
                              selectedStock === o.symbol
                                ? "bg-accent/15 text-accent-light"
                                : "text-slate-300"
                            }`}
                          >
                            <span className="font-mono font-medium text-slate-400 mr-2">
                              {o.symbol.replace(".NS", "")}
                            </span>
                            <span className="truncate">{o.name}</span>
                          </button>
                        ))
                      ) : (
                        <div className="text-[10px] text-muted p-2 text-center">
                          No stocks match your search
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 10"
                    value={qty}
                    required
                    onChange={(e) => setQty(e.target.value)}
                    className="w-full bg-slate-950/80 border border-[rgba(99,102,241,0.2)] rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">
                    Avg Buy Price (₹)
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 2450.50"
                    value={buyPrice}
                    required
                    onChange={(e) => setBuyPrice(e.target.value)}
                    className="w-full bg-slate-950/80 border border-[rgba(99,102,241,0.2)] rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedStock || !qty || !buyPrice}
                  className="px-4 py-1.5 bg-accent text-white rounded-lg text-xs font-semibold hover:bg-indigo-500 transition-colors shadow-glow-accent disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Add Asset
                </button>
              </div>
            </form>
          ) : (
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted">
                {hasHoldings ? `${holdings.length} assets tracked` : ""}
              </span>
              <button
                onClick={() => setFormOpen(true)}
                className="px-4 py-2 bg-white/[0.04] border border-[rgba(99,102,241,0.2)] hover:border-accent text-slate-200 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-[0_2px_8px_rgba(0,0,0,0.2)]"
              >
                <span>➕</span> Add Stock
              </button>
            </div>
          )}

          {/* Holdings List */}
          {hasHoldings ? (
            <div className="glass-card bg-slate-900/10 border-[rgba(99,102,241,0.06)] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-[rgba(99,102,241,0.08)] bg-slate-950/50">
                      <th className="py-3 px-4 text-[10px] font-semibold text-slate-400 uppercase tracking-wider font-mono">
                        Ticker / Name
                      </th>
                      <th className="py-3 px-4 text-[10px] font-semibold text-slate-400 uppercase tracking-wider text-right font-mono">
                        Holding
                      </th>
                      <th className="py-3 px-4 text-[10px] font-semibold text-slate-400 uppercase tracking-wider text-right font-mono">
                        Buy Price
                      </th>
                      <th className="py-3 px-4 text-[10px] font-semibold text-slate-400 uppercase tracking-wider text-right font-mono">
                        Live Price
                      </th>
                      <th className="py-3 px-4 text-[10px] font-semibold text-slate-400 uppercase tracking-wider text-right font-mono">
                        Current Value
                      </th>
                      <th className="py-3 px-4 text-[10px] font-semibold text-slate-400 uppercase tracking-wider text-right font-mono">
                        P&L
                      </th>
                      <th className="py-3 px-4 text-[10px] font-semibold text-slate-400 uppercase tracking-wider text-center font-mono">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.02]">
                    {holdings.map((h) => {
                      const res = valResponse?.holdings?.find(
                        (r) => r.symbol === h.symbol
                      );

                      return (
                        <tr
                          key={h.symbol}
                          className="hover:bg-white/[0.01] transition-colors group"
                        >
                          <td className="py-3.5 px-4 max-w-[200px]">
                            <button
                              onClick={() => {
                                setSelectedSymbol(h.symbol);
                                setPortfolioOpen(false);
                              }}
                              className="text-xs font-semibold text-slate-200 font-mono text-left block hover:text-accent-light transition-colors"
                            >
                              {h.symbol.replace(".NS", "")}
                            </button>
                            <span className="text-[10px] text-muted truncate block">
                              {h.name}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <span className="text-xs text-slate-200 block font-medium">
                              {h.qty}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <span className="text-xs text-slate-300 font-mono">
                              {formatINR(h.buy_price)}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            {res?.current_price ? (
                              <div className="font-mono">
                                <span className="text-xs text-slate-200 block">
                                  {formatINR(res.current_price)}
                                </span>
                                <span
                                  className={`text-[9px] font-semibold ${colorClass(
                                    res.change_pct
                                  )}`}
                                >
                                  {res.change_pct > 0 ? "+" : ""}
                                  {formatPct(res.change_pct)}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-500 italic">
                                Loading...
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            {res?.current_value ? (
                              <span className="text-xs text-slate-200 font-semibold font-mono">
                                {formatINR(res.current_value)}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-500 italic">
                                Loading...
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            {res?.pnl !== undefined ? (
                              <div className="font-mono">
                                <span
                                  className={`text-xs font-bold block ${colorClass(
                                    res.pnl
                                  )}`}
                                >
                                  {res.pnl > 0 ? "+" : ""}
                                  {formatINR(res.pnl)}
                                </span>
                                <span
                                  className={`text-[9px] font-bold ${colorClass(
                                    res.pnl_pct
                                  )}`}
                                >
                                  ({formatPct(res.pnl_pct)})
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-500 italic">
                                Loading...
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <button
                              onClick={() => removeHolding(h.symbol)}
                              className="text-xs text-slate-500 hover:text-bear p-1.5 transition-colors opacity-40 group-hover:opacity-100"
                              title="Delete Holding"
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="glass-card bg-slate-900/20 py-16 px-4 text-center border-dashed border-[rgba(99,102,241,0.15)]">
              <span className="text-3xl block mb-3">💼</span>
              <h3 className="text-sm font-semibold text-slate-300">
                Your portfolio is empty
              </h3>
              <p className="text-xs text-muted max-w-sm mx-auto mt-1 mb-4">
                Add your mock stock holdings to value them in real-time and
                track your absolute return and P&L.
              </p>
              <button
                onClick={() => setFormOpen(true)}
                className="btn-primary text-xs"
              >
                Add Your First Asset
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-[rgba(99,102,241,0.08)] bg-slate-950/20 flex justify-between items-center text-[10px] text-muted">
          <span>* Data is polled live every 60s.</span>
          <span className="text-rose-600/60 font-semibold">
            Mock investment simulator only.
          </span>
        </div>
      </div>
    </div>
  );
}
