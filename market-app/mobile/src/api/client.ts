/**
 * Base API client for the MarketPulse backend.
 *
 * Automatically resolves your FastAPI backend URL with fallback to production Render URL
 * and streams client logs to centralized backend logger.
 */
import Constants from 'expo-constants';
import { toast } from '../components/ui/Toast';

// Extract host from Expo bundler
const debuggerHost = Constants.expoConfig?.hostUri ?? '';
const rawHost = debuggerHost ? debuggerHost.split(':')[0] : '';

// Detect if running under Expo Tunnel mode (*.exp.direct)
const isTunnel = rawHost.includes('.exp.direct') || rawHost.includes('anonymous');

// Production & Fallback URLs
const PRODUCTION_URL = 'https://market-app-03va.onrender.com';
const ENV_URL = process.env.EXPO_PUBLIC_API_URL;

// Resolve active API Base URL: Use ENV_URL in dev mode, PRODUCTION_URL in production updates
export const API_BASE_URL = (
  __DEV__ 
    ? (ENV_URL || (rawHost && !isTunnel ? `http://${rawHost}:8000` : PRODUCTION_URL))
    : (ENV_URL && !ENV_URL.includes("172.") && !ENV_URL.includes("192.") && !ENV_URL.includes("localhost") ? ENV_URL : PRODUCTION_URL)
).replace(/\/$/, '');

// WS base is derived automatically from the API base
export const WS_BASE_URL = API_BASE_URL
  .replace(/^https:/, 'wss:')
  .replace(/^http:/, 'ws:');

// Track last 503 timestamp to prevent toast spamming on background 10s polls
let _last503ToastTime = 0;
const TOAST_503_COOLDOWN_MS = 60_000;

/**
 * Send non-blocking remote log telemetry to central server logger.
 */
function sendClientLogRemote(level: 'INFO' | 'ERROR', message: string, details?: string) {
  try {
    fetch(`${API_BASE_URL}/api/client-logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ level, tag: 'MOBILE_APK', message, details }),
    }).catch(() => {});
  } catch {}
}

/**
 * Resolve a relative path like "/api/indices" into a full URL.
 */
export function apiUrl(path: string): string {
  if (path.startsWith('http')) return path;
  return `${API_BASE_URL}${path}`;
}

/**
 * Standard JSON GET helper with detailed debugging logs, telemetry streamer & 503 cooldown.
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

    // If local LAN URL fails, automatically fall back to live production Render URL
    if (!response.ok && url.includes('172.29.230.244')) {
      const fallbackUrl = `${PRODUCTION_URL}${path.startsWith('http') ? '' : path}`;
      console.warn(`[API Failover] ⚠️ Local LAN unreachable. Falling back to Production: ${fallbackUrl}`);
      try {
        const fallbackResponse = await performFetch(fallbackUrl);
        if (fallbackResponse.ok) {
          response = fallbackResponse;
          url = fallbackUrl;
        }
      } catch {
        // Ignore fallback error
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

      const errLog = `[API Error] ❌ ${response.status} ${method} ${url} (${duration}ms) — Detail: "${detail}"`;
      console.error(errLog, rawText ? `Raw response: ${rawText.slice(0, 300)}` : '');

      // Stream error telemetry to backend logger
      sendClientLogRemote('ERROR', errLog, rawText.slice(0, 300));

      // Handle 503 Service Unavailable gracefully
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
    const errMsg = `[API Network Error] 💥 ${method} ${url} (${duration}ms): ${err?.message || err}`;
    console.error(errMsg);

    sendClientLogRemote('ERROR', errMsg, err?.stack);

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
