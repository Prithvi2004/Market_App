/**
 * Base API client for the MarketPulse backend.
 *
 * Automatically resolves your FastAPI backend URL (http://192.168.0.102:8000)
 * across LAN, Tunnel, and Emulator environments with automatic failover.
 */
import Constants from 'expo-constants';
import { toast } from '../components/ui/Toast';

// Extract host from Expo bundler
const debuggerHost = Constants.expoConfig?.hostUri ?? '';
const rawHost = debuggerHost ? debuggerHost.split(':')[0] : 'localhost';

// Detect if running under Expo Tunnel mode (*.exp.direct)
const isTunnel = rawHost.includes('.exp.direct') || rawHost.includes('anonymous');

// Default active LAN IP for FastAPI backend
const DEFAULT_LAN_URL = 'http://172.29.230.244:8000';
const ENV_URL = process.env.EXPO_PUBLIC_API_URL;

// If in Tunnel mode or ENV is defined, use the proper backend URL
export const API_BASE_URL = (
  ENV_URL || (isTunnel ? DEFAULT_LAN_URL : `http://${rawHost}:8000`)
).replace(/\/$/, '');

// WS base is derived automatically from the API base
export const WS_BASE_URL = API_BASE_URL
  .replace(/^https:/, 'wss:')
  .replace(/^http:/, 'ws:');

// Track last 503 timestamp to prevent toast spamming on background 10s polls
let _last503ToastTime = 0;
const TOAST_503_COOLDOWN_MS = 60_000; // Only toast 503 once per 60 seconds max

/**
 * Resolve a relative path like "/api/indices" into a full URL.
 */
export function apiUrl(path: string): string {
  if (path.startsWith('http')) return path;
  return `${API_BASE_URL}${path}`;
}

/**
 * Standard JSON GET helper with detailed debugging logs, automatic tunnel failover & suppressed 503 toast spamming.
 */
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  let url = apiUrl(path);
  const method = init?.method ?? 'GET';
  const startT = Date.now();

  console.log(`[API Request] 🚀 ${method} ${url}`);

  const performFetch = async (targetUrl: string) => {
    return fetch(targetUrl, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        'bypass-tunnel-reminder': 'true',
        ...(init?.headers ?? {}),
      },
    });
  };

  try {
    let response = await performFetch(url);

    // If public tunnel returns 503 Tunnel Unavailable, try falling back to local LAN IP directly
    if (response.status === 503 && url.includes('.loca.lt')) {
      const fallbackUrl = `${DEFAULT_LAN_URL}${path.startsWith('http') ? '' : path}`;
      console.warn(`[API 503 Tunnel Failover] ⚠️ Tunnel unavailable. Falling back to local LAN: ${fallbackUrl}`);
      try {
        const fallbackResponse = await performFetch(fallbackUrl);
        if (fallbackResponse.ok) {
          response = fallbackResponse;
          url = fallbackUrl;
        }
      } catch {
        // Ignore fallback failure, use primary error handling below
      }
    }

    const duration = Date.now() - startT;

    if (!response.ok) {
      let detail = `HTTP ${response.status}`;
      let rawText = '';
      try {
        rawText = await response.text();
        const body = JSON.parse(rawText);
        detail = body?.detail ?? detail;
      } catch {}

      console.error(
        `[API Error] ❌ ${response.status} ${method} ${url} (${duration}ms) — Detail: "${detail}"`,
        rawText ? `Raw response: ${rawText.slice(0, 300)}` : ''
      );

      // Handle 503 Service Unavailable gracefully (localtunnel / yfinance rate limit)
      if (response.status === 503) {
        const now = Date.now();
        if (now - _last503ToastTime > TOAST_503_COOLDOWN_MS) {
          _last503ToastTime = now;
          toast.error('Backend Busy (503)', 'Service transiently unavailable. Retrying automatically...');
        } else {
          console.warn(`[API 503 Warning] Suppressed duplicate 503 toast popup for ${url}`);
        }
      } else {
        toast.error('API Request Failed', detail);
      }

      throw new Error(detail);
    }

    const data = await response.json();
    console.log(`[API Response] ✅ ${response.status} ${method} ${url} (${duration}ms)`);
    return data as T;
  } catch (err: any) {
    const duration = Date.now() - startT;
    console.error(`[API Network Error] 💥 ${method} ${url} (${duration}ms):`, err?.message || err);

    if (err?.name !== 'AbortError' && !err?.message?.includes('HTTP')) {
      toast.error('Network Error', 'Failed to reach FastAPI backend');
    }
    throw err;
  }
}

/**
 * Standard JSON POST helper.
 */
export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  return apiFetch<T>(path, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}
