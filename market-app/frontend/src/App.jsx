import { useEffect, useRef } from "react";
import { useStore } from "./store/useStore.js";
import { useStatus } from "./api/market.js";
import MarketDashboard from "./components/MarketDashboard.jsx";
import NewsFeed from "./components/NewsFeed.jsx";
import StockDetail from "./components/StockDetail.jsx";
import SectorHeatmap from "./components/SectorHeatmap.jsx";
import SearchBar from "./components/SearchBar.jsx";

function useLivePricesWS() {
  const setLivePrices = useStore((s) => s.setLivePrices);
  const backoff = useRef(1000);
  useEffect(() => {
    let ws; let stopped = false;
    function connect() {
      const proto = location.protocol === "https:" ? "wss" : "ws";
      ws = new WebSocket(`${proto}://${location.host}/ws/prices`);
      ws.onopen = () => { backoff.current = 1000; };
      ws.onmessage = (e) => { try { setLivePrices(JSON.parse(e.data)); } catch {} };
      ws.onclose = () => {
        if (stopped) return;
        setTimeout(connect, backoff.current);
        backoff.current = Math.min(30_000, backoff.current * 2);
      };
      ws.onerror = () => ws.close();
    }
    connect();
    return () => { stopped = true; try { ws?.close(); } catch {} };
  }, [setLivePrices]);
}

export default function App() {
  useLivePricesWS();
  const { data: status } = useStatus();
  const setMarketStatus = useStore((s) => s.setMarketStatus);
  useEffect(() => { if (status?.market_status) setMarketStatus(status.market_status); }, [status, setMarketStatus]);

  const statusDot = status?.is_open ? "bg-bull" : "bg-slate-400";

  return (
    <div className="min-h-full flex flex-col">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
          <h1 className="text-lg font-semibold tracking-tight">📈 Market App <span className="text-slate-400 text-sm font-normal">· NSE/BSE</span></h1>
          <div className="ml-auto flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-xs text-slate-600">
              <span className={`inline-block w-2 h-2 rounded-full ${statusDot}`} />
              Market {status?.market_status ?? "…"}
            </span>
            <SearchBar />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto w-full px-4 py-4 grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1">
        <div className="lg:col-span-2 space-y-4">
          <MarketDashboard />
          <SectorHeatmap />
        </div>
        <div className="lg:col-span-1 h-[calc(100vh-7rem)] lg:sticky lg:top-4">
          <NewsFeed />
        </div>
      </main>

      <StockDetail />

      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 py-2 text-[11px] text-slate-400">
          Local-only · LLM via Ollama on http://localhost:11434 · Not financial advice
        </div>
      </footer>
    </div>
  );
}
