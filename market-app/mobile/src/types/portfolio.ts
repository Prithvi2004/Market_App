// ── TypeScript types for portfolio ────────────────────────────────────────────

export interface Holding {
  symbol: string;
  name: string;
  qty: number;
  buy_price: number;
  added_at: string; // ISO timestamp
}

export interface HoldingResult {
  symbol: string;
  name: string;
  qty: number;
  buy_price: number;
  current_price: number | null;
  current_value: number | null;
  invested: number;
  pnl: number | null;
  pnl_pct: number | null;
  change_pct: number | null;
  stale: boolean;
}

export interface PortfolioResult {
  holdings: HoldingResult[];
  total_invested: number;
  total_current_value: number | null;
  total_pnl: number | null;
  total_pnl_pct: number | null;
}

// For the risk API
export interface PortfolioRiskHolding {
  symbol: string;
  quantity: number;
  price: number;
}

export interface PortfolioRiskResult {
  portfolio_beta: number | null;
  annualized_return: number | null;
  annualized_volatility: number | null;
  sharpe_ratio: number | null;
  max_drawdown: number | null;
  var_95: number | null;
  error?: string;
}
