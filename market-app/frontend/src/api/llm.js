// SSE-style stream reader for /api/explain and /api/impact.
// FastAPI returns text/event-stream — we parse events client-side.

async function* readEvents(response) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let idx;
    while ((idx = buf.indexOf("\n\n")) >= 0) {
      const raw = buf.slice(0, idx);
      buf = buf.slice(idx + 2);
      let event = "message";
      let data = "";
      for (const line of raw.split("\n")) {
        if (line.startsWith("event:")) event = line.slice(6).trim();
        else if (line.startsWith("data:")) data += line.slice(5).trim();
      }
      try {
        yield { event, data: JSON.parse(data) };
      } catch {
        yield { event, data };
      }
    }
  }
}
const API_BASE_URL = import.meta.env.VITE_API_URL || "";

const getUrl = (url) => {
  if (url.startsWith("http") || !API_BASE_URL) return url;
  return `${API_BASE_URL.replace(/\/$/, "")}${url}`;
};

export async function streamExplain({ symbol, timeframe = "1D", include_news = true }, handlers) {
  const resp = await fetch(getUrl("/api/explain"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ symbol, timeframe, include_news }),
  });
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  for await (const ev of readEvents(resp)) {
    handlers[ev.event]?.(ev.data);
  }
}

export async function streamImpact({ headline, summary = "" }, handlers) {
  const resp = await fetch(getUrl("/api/impact"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ headline, summary }),
  });
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  for await (const ev of readEvents(resp)) {
    handlers[ev.event]?.(ev.data);
  }
}
