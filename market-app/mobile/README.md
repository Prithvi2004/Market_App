# MarketPulse Mobile Application

A mobile-native Indian Stock Market Analytics application built with **React Native**, **Expo SDK**, and **TypeScript**. Powered by the existing FastAPI backend.

---

## Features

- **Markets**: Real-time index tracking (NIFTY 50, SENSEX, BANK NIFTY, NIFTY IT), top gainers & losers, NSE/BSE exchange toggle, live price streaming via WebSockets.
- **News**: Categorized market news (National, Global, Sector) with sentiment tagging and instant AI Impact Analysis triggers.
- **Sectors**: Interactive sector performance heatmap with advance/decline metrics and stock drill-downs.
- **Screener**: Real-time technical breakout & candlestick pattern alert cards with RSI indicator metrics.
- **Portfolio**: Local holdings tracking with live P&L valuation and risk assessment backed by the backend.
- **Stock Details**: Interactive SVG line charts, financial fundamentals (P/E, ROE, Market Cap, etc.), sector peers, ticker-specific news, and streaming **AI Price Explanations**.
- **Deep Analysis Terminal**: Full 16-indicator snapshot (EMA, RSI, MACD, BB, ATR, ADX, CMF, CCI, Williams %R), interactive **AI Copilot Chat**, and **AI Peer Comparison Engine**.
- **Search**: Fast symbol search modal with NIFTY 50 defaults.

---

## Setup & Running Locally

### 1. Requirements
- Node.js 18+
- Expo Go app on physical phone (or Android Studio / Xcode simulator)

### 2. Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Ensure `EXPO_PUBLIC_API_URL` points to your running FastAPI backend (e.g. `http://localhost:8000` or `http://<YOUR_LAN_IP>:8000`).

### 3. Start Development Server
```bash
cd mobile
npm run start
```
Scan the QR code using Expo Go on your mobile device.

---

## Architecture & Code Structure

```
mobile/
├── app/                      ← Expo Router pages & layouts
│   ├── (tabs)/               ← Bottom tab bar navigation (Markets, News, Sectors, Screener, Portfolio)
│   ├── stock/[symbol].tsx    ← Stock Detail screen
│   ├── analysis/[symbol].tsx ← Deep Analysis terminal screen
│   ├── search.tsx            ← Symbol search modal
│   └── impact.tsx            ← AI Impact Analyzer modal
│
├── src/
│   ├── api/                  ← TanStack Query API hooks & SSE streaming
│   ├── components/           ← Reusable UI & domain-specific components
│   ├── hooks/                ← WebSocket & custom hooks
│   ├── store/                ← Zustand state & AsyncStorage portfolio persistence
│   ├── theme/                ← Colors, typography, spacing tokens
│   └── utils/                ← Indian number formatters & constants
```
