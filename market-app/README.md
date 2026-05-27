# Market App — Indian Stock Market Analytics (Local)

End-to-end Indian stock market analytics web app. Real-time NSE/BSE quotes,
categorized news with sentiment, top gainers/losers, sector heatmap, and
LLM-powered "explain this move" narratives — all running locally via Ollama.

No paid APIs required for MVP.

## Stack

- **Backend:** FastAPI · APScheduler · yfinance · feedparser · redis · SQLModel · vaderSentiment · spaCy · httpx
- **Frontend:** React 18 · Vite · TanStack Query v5 · Zustand · Recharts · Tailwind v3
- **LLM:** Ollama (`deepseek-v3.1:671b-cloud`, fallback `qwen3-vl:235b-cloud`, `kimi-k2.5:cloud`) via SSE streaming
- **Infra:** Redis (Docker) · SQLite (`market.db`)

## Prerequisites

- Python 3.11+
- Node 18+
- Docker (for Redis)
- [Ollama](https://ollama.com) installed and running

## Setup

```bash
# 1. Pull LLM models (cloud-hosted)
ollama pull deepseek-v3.1:671b-cloud
# (optional fallback models)
ollama pull qwen3-vl:235b-cloud
ollama pull kimi-k2.5:cloud

# 2. Start Redis
docker-compose up -d

# 3. Backend
cd backend
python -m venv venv
source venv/bin/activate            # Windows: venv\Scripts\activate
pip install -r ../requirements.txt
python -m spacy download en_core_web_sm
uvicorn main:app --reload --port 8000

# 4. Frontend (new terminal)
cd frontend
npm install
npm run dev

# 5. Open http://localhost:5173
```

## Ports

| Service  | Port  |
| -------- | ----- |
| Frontend | 5173  |
| Backend  | 8000  |
| Redis    | 6379  |
| Ollama   | 11434 |

## Notes

- yfinance is polled in batch from the scheduler only — never on per-request paths.
- Outside Indian market hours (Mon–Fri 09:15–15:30 IST) the API returns last-known data with `"stale": true`.
- All LLM inference is local — the app never calls external AI providers.
- The ProvenancePanel always shows source URLs for LLM claims. Not financial advice.
