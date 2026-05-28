// ─── Indian number formatting + common helpers ────────────────────────────────

/**
 * Format a number as Indian rupees.
 * e.g. 1234567.89 → "₹12,34,567.89"
 */
export const formatINR = (n) => {
  if (n == null || isNaN(n)) return "—";
  return "₹" + Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 });
};

/**
 * Format a percentage with sign.
 * e.g. 2.3 → "+2.30%", -1.4 → "-1.40%"
 */
export const formatPct = (n) => {
  if (n == null || isNaN(n)) return "—";
  const sign = n > 0 ? "+" : "";
  return `${sign}${Number(n).toFixed(2)}%`;
};

/**
 * Format a signed number (no % symbol).
 */
export const formatSigned = (n) => {
  if (n == null || isNaN(n)) return "—";
  const sign = n > 0 ? "+" : "";
  return `${sign}${Number(n).toFixed(2)}`;
};

/**
 * Format large numbers in Indian notation (Lakh / Crore / Trillion).
 */
export function formatIndianNumber(n) {
  if (n == null || isNaN(n)) return "—";
  const abs = Math.abs(n);
  if (abs >= 1e12) return `₹${(n / 1e12).toFixed(2)}T`;
  if (abs >= 1e7)  return `₹${(n / 1e7).toFixed(2)} Cr`;
  if (abs >= 1e5)  return `₹${(n / 1e5).toFixed(2)} L`;
  return `₹${Number(n).toLocaleString("en-IN")}`;
}

/** Tailwind text class based on sign. */
export const colorClass = (n) =>
  n > 0 ? "text-bull" : n < 0 ? "text-bear" : "text-muted";

/** Tailwind background dim class based on sign. */
export const bgDimClass = (n) =>
  n > 0 ? "bg-bull-dim" : n < 0 ? "bg-bear-dim" : "bg-slate-800/40";

/** Tailwind border class based on sign. */
export const borderClass = (n) =>
  n > 0 ? "border-bull" : n < 0 ? "border-bear" : "border-slate-700";

/**
 * Human-readable relative timestamp.
 * e.g. "3m ago", "2h ago"
 */
export function relativeTime(iso) {
  if (!iso) return "";
  const t = new Date(iso).getTime();
  const diff = Math.max(0, (Date.now() - t) / 1000);
  if (diff < 60)    return `${Math.floor(diff)}s ago`;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

/**
 * Determine sparkline color based on first vs last value.
 */
export function sparklineColor(values) {
  if (!values || values.length < 2) return "#64748b";
  return values[values.length - 1] >= values[0] ? "#10b981" : "#f43f5e";
}

/**
 * Clamp a value between min and max.
 */
export const clamp = (val, min, max) => Math.min(max, Math.max(min, val));
