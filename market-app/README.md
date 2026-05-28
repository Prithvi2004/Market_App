# 📈 Indian Stock Market Analytics

An enterprise-grade real-time Indian stock market analytics platform with AI-powered explainability.

## Features

- **Live Market Data**: Nifty 50, Sensex, Bank Nifty, Nifty IT indices with 60s polling via yfinance
- **Top Gainers & Losers**: Real-time ranking of NIFTY 50 stocks
- **Categorized News**: National / International / Sector with sentiment scoring (VADER)
- **News Sources**: RSS feeds (ET, Moneycontrol, LiveMint, NDTV) + NewsData.io + GNews
- **AI Explainer**: Streaming LLM analysis of price movements with source citations
- **Impact Analyzer**: Given any news headline, identify affected sectors/stocks via LLM
- **Sector Heatmap**: Visual grid of sector-wise average performance
- **Portfolio Tracker**: localStorage-based portfolio with live P&L
- **Provenance Panel**: Full source traceability for every AI-generated narrative
- **WebSocket Live Feed**: Real-time price broadcast to all connected clients

## Architecture

```
yfinance / RSS / NewsData.io / GNews
        ↓
  APScheduler (60s quotes, 5m news)
        ↓
  FastAPI backend + SQLite + Redis cache
        ↓
  Ollama LLM (deepseek-v3.1:671b-cloud primary)
        ↓
  React 18 + Vite frontend
```

## Quick Start (Local)

### Prerequisites
- Python 3.11+
- Node.js 18+
- Docker (for Redis) OR Redis installed locally
- Ollama installed and running

### 1. Start Redis
```bash
docker run -d -p 6379:6379 redis:7-alpine
# OR with docker-compose (also starts backend):
docker-compose up -d redis
```

### 2. Backend
```bash
cd market-app/backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r ../requirements.txt
python -m spacy download en_core_web_sm
uvicorn main:app --reload --port 8000
```

### 3. Frontend
```bash
cd market-app/frontend
npm install
npm run dev
# Opens on http://localhost:5173
```

### 4. Verify
```bash
curl http://localhost:8000/api/health/detailed
curl http://localhost:8000/api/indices
curl http://localhost:8000/api/news/latest
```

## LLM Setup (Ollama)

```bash
# Install Ollama
winget install Ollama.Ollama  # Windows

# Pull models (choose based on RAM)
ollama pull mistral:7b-instruct   # 8GB RAM — 4.1GB download
ollama pull llama3:8b             # 16GB RAM — 4.7GB download

# Update OLLAMA_MODEL in .env or config.py

# Test
curl http://localhost:11434/api/generate -d '{"model":"mistral:7b-instruct","prompt":"Hello","stream":false}'
```

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health/detailed` | System health + Redis/DB status |
| GET | `/api/indices` | Nifty 50, Sensex, Bank Nifty, Nifty IT |
| GET | `/api/quote?symbol=X` | Single stock quote |
| GET | `/api/gainers?n=10` | Top N gainers |
| GET | `/api/losers?n=10` | Top N losers |
| GET | `/api/chart?symbol=X&range=1D` | OHLCV chart data |
| GET | `/api/news/latest` | Latest 30 articles |
| GET | `/api/news?ticker=X&category=national` | Filtered news |
| GET | `/api/news/categories/count` | Article counts per category |
| GET | `/api/sectors` | Sector heatmap data |
| GET | `/api/search?q=X` | Symbol search |
| GET | `/api/status` | Market open/closed/holiday |
| POST | `/api/explain` | LLM price explanation (SSE stream) |
| POST | `/api/impact` | LLM news impact analysis (SSE stream) |
| POST | `/api/portfolio/value` | Live P&L for a list of holdings |
| WS | `/ws/prices` | Real-time price broadcast |

## Environment Variables

See `.env.example` for all configurable settings.

## Compliance & Disclaimers

- yfinance data is for personal/non-commercial use per Yahoo Finance ToS
- All LLM-generated narratives are **not financial advice**
- NSE/BSE holiday calendar included for 2025-2026
- Rate limits: yfinance ~2000 req/hr, NewsData.io 200/day, GNews 100/day
