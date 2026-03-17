# Space Terminal

Bloomberg-style trading terminal. Next.js 15. No backend, no database.

## Stack

Next.js 15 | TypeScript | Polygon.io | Gemini / Perplexity / Claude

## Data flow

```
Polygon REST → /api/quotes → useQuotes hook → Watchlist + Ticker (polls every 5s)
Polygon REST → /api/bars   → useBars hook   → CandleChart (fetches on symbol/tf change)
Polygon REST → /api/news   → NewsPanel      (cached 60s)
/api/chat                  → Gemini | Perplexity | Claude → AITerminal
```

All data sources fall back to mock data gracefully if Polygon key is absent or API fails.

## AI providers

- **Perplexity** — default (built-in web search, best for live market context)
- **Gemini** — free fallback, good analysis
- **Claude** — optional, best quality, requires paid key

Provider is detected server-side via `lib/aiConfig.ts` and sent to the client.
Selected provider persists to `localStorage`. Keys never leave the server.

## Key files

```
components/terminal/
  BloombergDashboard.tsx  — root layout and state
  CandleChart.tsx         — SVG candlestick chart (receives bars[] from useBars)
  TickerBar.tsx           — animated scrolling ticker
  WatchlistSection.tsx    — FX/Futures list with sparklines
  MiniSparkline.tsx       — SVG sparkline
  FuturesStrip.tsx        — quick-select futures strip below chart
  AITerminal.tsx          — chat UI with provider selector

lib/
  types.ts       — Bar, Quote, Provider, ChatMessage, NewsItem
  themes.ts      — THEMES object (dark + light)
  symbolMap.ts   — display name → Polygon ticker + timeframe mapping
  mockData.ts    — FX_DATA, FUTURES_DATA, TICKER_DATA, MOCK_NEWS
  aiConfig.ts    — getAvailableProviders() (server-side only)
  generateCandles.ts — seeded LCG candle generator (fallback)

hooks/
  useQuotes.ts   — polls /api/quotes every 5s, maintains sparkline history
  useBars.ts     — fetches /api/bars on symbol/timeframe change

app/api/
  chat/route.ts   — POST: proxies to Gemini | Perplexity | Claude
  quotes/route.ts — GET: Polygon snapshot → normalized Quote map
  bars/route.ts   — GET: Polygon aggregates → Bar[]
  news/route.ts   — GET: Polygon news → NewsItem[]
```

## Stack evaluation (recorded)

**Verdict: Keep Next.js 15.**

- React at 50+ updates/sec: fine with useMemo + isolated hook state
- SSR: not used — all terminal components are `"use client"`
- API routes: cleanest single solution for server-side key proxying
- Switching to Vite: saves nothing, requires separate server for keys
- Switching to SvelteKit: ~2 day rewrite for marginal reactivity gains on REST polling

## To run

```bash
cp .env.example .env.local
# Fill in POLYGON_API_KEY + at least one AI key
npm install
npm run dev
```

Open http://localhost:3000

## Current state

- [x] Stack evaluation delivered
- [x] Components split into separate files
- [x] AI calls server-side only — no keys in browser
- [x] Multi-provider AI selector (Perplexity / Gemini / Claude)
- [x] Provider persists to localStorage
- [x] /api/quotes → useQuotes (5s poll, mock fallback)
- [x] /api/bars → useBars (on symbol/tf change, mock fallback)
- [x] /api/news → NewsPanel (mock fallback)
- [x] .env.example accurate
- [x] CLAUDE.md accurate

## Upgrade path: WebSocket (when on Polygon paid plan)

Replace `useQuotes.ts` polling with `usePolygonStream.ts`:
- Connect to `wss://socket.polygon.io/forex`
- Subscribe to `C.*` for FX, update quote state on each message
- Keep REST snapshot as initial load + reconnect fallback
