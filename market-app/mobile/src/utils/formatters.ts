// ── Indian number formatting + common helpers ─────────────────────────────────
// Faithfully ported from frontend/src/utils/formatters.js

/**
 * Format a number as Indian rupees.
 * e.g. 1234567.89 → "₹12,34,567.89"
 */
export function formatINR(n: number | null | undefined): string {
  if (n == null || isNaN(n)) return '—';
  return '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

/**
 * Format a percentage with sign.
 * e.g. 2.3 → "+2.30%", -1.4 → "-1.40%"
 */
export function formatPct(n: number | null | undefined): string {
  if (n == null || isNaN(n)) return '—';
  const sign = n > 0 ? '+' : '';
  return `${sign}${n.toFixed(2)}%`;
}

/**
 * Format a signed number (no % symbol).
 */
export function formatSigned(n: number | null | undefined): string {
  if (n == null || isNaN(n)) return '—';
  const sign = n > 0 ? '+' : '';
  return `${sign}${n.toFixed(2)}`;
}

/**
 * Format large numbers in Indian notation (Lakh / Crore / Trillion).
 */
export function formatIndianNumber(n: number | null | undefined): string {
  if (n == null || isNaN(n)) return '—';
  const abs = Math.abs(n);
  if (abs >= 1e12) return `₹${(n / 1e12).toFixed(2)}T`;
  if (abs >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
  if (abs >= 1e5) return `₹${(n / 1e5).toFixed(2)} L`;
  return `₹${n.toLocaleString('en-IN')}`;
}

/**
 * Color based on sign: green for positive, red for negative, grey for zero.
 */
export function signColor(n: number | null | undefined): string {
  if (n == null || isNaN(n)) return '#64748b';
  if (n > 0) return '#10b981';
  if (n < 0) return '#f43f5e';
  return '#64748b';
}

/**
 * Human-readable relative timestamp.
 * e.g. "3m ago", "2h ago"
 */
export function relativeTime(iso: string | null | undefined): string {
  if (!iso) return '';
  const t = new Date(iso).getTime();
  const diff = Math.max(0, (Date.now() - t) / 1000);
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

/**
 * Abbreviate symbol by removing .NS/.BO suffix.
 */
export function shortSymbol(symbol: string): string {
  return symbol.replace('.NS', '').replace('.BO', '');
}

/**
 * Clamp value between min and max.
 */
export function clamp(val: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, val));
}
