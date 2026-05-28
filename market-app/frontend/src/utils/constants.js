export const SECTORS = [
  "IT",
  "Banking",
  "Pharma",
  "Auto",
  "Energy",
  "FMCG",
  "Metals",
  "Financial",
  "Telecom",
  "Infrastructure",
  "Cement",
  "Insurance",
  "Healthcare",
  "Consumer",
  "Conglomerate",
  "Chemicals",
];

export const NEWS_CATEGORIES = [
  { id: "all",           label: "All" },
  { id: "national",      label: "🇮🇳 National" },
  { id: "international", label: "🌐 Global" },
  { id: "sector",        label: "📊 Sector" },
];

export const SENTIMENT_CONFIG = {
  positive: { label: "Positive", className: "badge-bull" },
  negative: { label: "Negative", className: "badge-bear" },
  neutral:  { label: "Neutral",  className: "badge-neutral" },
};

export const EXCHANGE_OPTIONS = ["NSE", "BSE"];

export const RANGE_OPTIONS = ["1D", "1W", "1M", "1Y"];

export const CONFIDENCE_COLORS = {
  high:   { bg: "bg-bull/20",         text: "text-bull",    border: "border-bull/30" },
  medium: { bg: "bg-amber-500/15",    text: "text-amber-400", border: "border-amber-500/30" },
  low:    { bg: "bg-bear/15",         text: "text-bear",    border: "border-bear/30" },
};
