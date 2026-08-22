// ── TypeScript types for market data ──────────────────────────────────────────

export interface Index {
  symbol: string;
  name: string;
  exchange: string;
  price: number;
  change: number;
  change_pct: number;
  volume: number;
  high_52w: number;
  low_52w: number;
  market_cap: number | null;
  timestamp: string;
  stale: boolean;
}

export interface Quote {
  symbol: string;
  name: string;
  exchange: string;
  price: number;
  change: number;
  change_pct: number;
  volume: number;
  high_52w: number;
  low_52w: number;
  market_cap: number | null;
  timestamp: string;
  stale: boolean;
}

export interface Mover extends Quote {
  // Same shape as Quote
}

export interface OHLCVBar {
  t: string; // ISO timestamp
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}

export interface Sector {
  sector: string;
  count: number;
  active_count: number;
  avg_change_pct: number;
  advance_count: number;
  decline_count: number;
  stocks: SectorStock[];
}

export interface SectorStock {
  symbol: string;
  name: string;
  price: number | null;
  change: number | null;
  change_pct: number | null;
  volume: number | null;
  market_cap: number | null;
  stale: boolean;
}

export interface Fundamentals {
  symbol: string;
  name: string;
  sector: string;
  industry: string;
  market_cap: number | null;
  pe_ratio: number | null;
  forward_pe: number | null;
  pb_ratio: number | null;
  eps: number | null;
  dividend_yield: number | null;
  dividend_rate: number | null;
  revenue: number | null;
  profit_margin: number | null;
  roe: number | null;
  debt_to_equity: number | null;
  current_ratio: number | null;
  beta: number | null;
  '52w_high': number | null;
  '52w_low': number | null;
  '52w_position_pct': number | null;
  price: number | null;
  book_value: number | null;
  shares_outstanding: number | null;
  float_shares: number | null;
  held_by_institutions: number | null;
  analyst_recommendation: string | null;
  target_price: number | null;
  target_high: number | null;
  target_low: number | null;
  num_analysts: number | null;
}

export interface Indicator {
  time: string;
  close: number;
  ema9: number | null;
  ema20: number | null;
  ema50: number | null;
  ema200: number | null;
  rsi: number | null;
  macd: number | null;
  macd_h: number | null;
  macd_s: number | null;
  bb_lower: number | null;
  bb_middle: number | null;
  bb_upper: number | null;
  atr: number | null;
  adx: number | null;
  di_plus: number | null;
  di_minus: number | null;
  cmf: number | null;
  cci: number | null;
  williams_r: number | null;
}

export interface SearchHit {
  symbol: string;
  name: string;
  exchange: string;
}

export interface MarketStatus {
  market_status: string;
  is_open: boolean;
  now_ist: string;
}

export interface Signal {
  type: string;
  name: string;
  direction: 'bullish' | 'bearish' | 'neutral';
  desc: string;
}

export interface ScreenerAlert {
  symbol: string;
  name: string;
  sector: string;
  price: number;
  change_pct: number;
  rsi: number;
  signals: Signal[];
}

export interface LivePricesPayload {
  indices: Index[];
  gainers: Mover[];
  losers: Mover[];
  gainers_bse: Mover[];
  losers_bse: Mover[];
}
