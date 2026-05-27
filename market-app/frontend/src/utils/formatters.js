// Indian number formatting (lakh / crore) + common helpers.

export const formatINR = (n) => {
  if (n == null || isNaN(n)) return "—";
  return "₹" + Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 });
};

export const formatPct = (n) => {
  if (n == null || isNaN(n)) return "—";
  const sign = n > 0 ? "+" : "";
  return `${sign}${Number(n).toFixed(2)}%`;
};

export const formatSigned = (n) => {
  if (n == null || isNaN(n)) return "—";
  const sign = n > 0 ? "+" : "";
  return `${sign}${Number(n).toFixed(2)}`;
};

export function formatIndianNumber(n) {
  if (n == null || isNaN(n)) return "—";
  const abs = Math.abs(n);
  if (abs >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
  if (abs >= 1e5) return `₹${(n / 1e5).toFixed(2)} L`;
  return `₹${Number(n).toLocaleString("en-IN")}`;
}

export const colorClass = (n) => (n > 0 ? "text-bull" : n < 0 ? "text-bear" : "text-slate-500");
export const bgClass = (n) => (n > 0 ? "bg-bull/10" : n < 0 ? "bg-bear/10" : "bg-slate-100");

export function relativeTime(iso) {
  if (!iso) return "";
  const t = new Date(iso).getTime();
  const diff = Math.max(0, (Date.now() - t) / 1000);
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
