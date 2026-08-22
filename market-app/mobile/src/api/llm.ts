/**
 * LLM / AI streaming functions for React Native.
 * Uses XMLHttpRequest with onprogress event listening to handle text/event-stream (SSE)
 * reliably across all React Native / Hermes runtimes.
 */
import { apiUrl } from './client';
import { toast } from '../components/ui/Toast';

type EventHandlers = Partial<Record<string, (data: any) => void>>;

function streamSSERequest(
  path: string,
  payload: unknown,
  handlers: EventHandlers,
  signal?: AbortSignal,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const url = apiUrl(path);
    const xhr = new XMLHttpRequest();

    xhr.open('POST', url);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('bypass-tunnel-reminder', 'true');

    let processedLength = 0;
    let buf = '';

    const parseBuffer = () => {
      let idx: number;
      while ((idx = buf.indexOf('\n\n')) >= 0) {
        const raw = buf.slice(0, idx);
        buf = buf.slice(idx + 2);
        let event = 'message';
        let data = '';
        for (const line of raw.split('\n')) {
          if (line.startsWith('event:')) event = line.slice(6).trim();
          else if (line.startsWith('data:')) data += line.slice(5).trim();
        }
        if (data) {
          try {
            const parsed = JSON.parse(data);
            handlers[event]?.(parsed);
          } catch {
            handlers[event]?.(data);
          }
        }
      }
    };

    xhr.onprogress = () => {
      const newText = xhr.responseText.slice(processedLength);
      processedLength = xhr.responseText.length;
      buf += newText;
      parseBuffer();
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const newText = xhr.responseText.slice(processedLength);
        buf += newText;
        parseBuffer();
        resolve();
      } else {
        let errDetail = `HTTP ${xhr.status}`;
        try {
          const body = JSON.parse(xhr.responseText);
          errDetail = body?.detail ?? errDetail;
        } catch {}
        toast.error('AI Request Failed', errDetail);
        reject(new Error(errDetail));
      }
    };

    xhr.onerror = () => {
      toast.error('Network Error', 'Could not connect to AI backend');
      reject(new Error('Network error during SSE stream'));
    };

    if (signal) {
      signal.addEventListener('abort', () => {
        xhr.abort();
        resolve();
      });
    }

    xhr.send(JSON.stringify(payload));
  });
}

// ── Explain (AI price explanation) ────────────────────────────────────────────
export async function streamExplain(
  payload: { symbol: string; timeframe?: string; include_news?: boolean },
  handlers: EventHandlers,
  signal?: AbortSignal,
) {
  return streamSSERequest(
    '/api/explain',
    {
      symbol: payload.symbol,
      timeframe: payload.timeframe ?? '1D',
      include_news: payload.include_news ?? true,
    },
    handlers,
    signal,
  );
}

// ── Impact (news impact analysis) ─────────────────────────────────────────────
export async function streamImpact(
  payload: { headline: string; summary?: string },
  handlers: EventHandlers,
  signal?: AbortSignal,
) {
  return streamSSERequest(
    '/api/impact',
    { headline: payload.headline, summary: payload.summary ?? '' },
    handlers,
    signal,
  );
}

// ── Copilot chat ───────────────────────────────────────────────────────────────
export async function streamCopilot(
  payload: {
    symbol: string;
    history: { role: string; content: string }[];
    user_query: string;
  },
  handlers: EventHandlers,
  signal?: AbortSignal,
) {
  return streamSSERequest('/api/copilot/chat', payload, handlers, signal);
}

// ── Compare (peer comparison) ──────────────────────────────────────────────────
export async function streamCompare(
  payload: { target_symbol: string; compare_symbols: string[] },
  handlers: EventHandlers,
  signal?: AbortSignal,
) {
  return streamSSERequest('/api/compare/explain', payload, handlers, signal);
}
