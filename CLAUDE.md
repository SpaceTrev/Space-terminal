# Space Terminal

Bloomberg-style trading terminal. Next.js 16 + Vercel Postgres.

## Stack

Next.js 15 | TypeScript | Polygon.io | lightweight-charts v5 | Gemini / Perplexity / Claude

## Data flow

```text
Polygon REST → /api/quotes → useQuotes hook → Watchlist + Ticker (polls every 5s)
               FX/Crypto: forex snapshot endpoint
               Futures: ETF proxy (SPY×10, QQQ×42, GLD×10.5, etc.)

Polygon REST → /api/bars   → useBars hook   → LightweightChart (fetches on symbol/tf change)
Polygon REST → /api/news   → useNews hook   → NewsPanel (60s poll, was hardcoded — now fixed)
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

```text
components/terminal/
  BloombergDashboard.tsx  — root layout and state; real-time UTC session detection; LIVE/DEMO badge
  LightweightChart.tsx    — TradingView-style chart using lightweight-charts v5 (replaces SVG chart)
  CandleChart.tsx         — original SVG candlestick chart (kept for reference)
  TickerBar.tsx           — animated scrolling ticker
  WatchlistSection.tsx    — FX/Futures list with sparklines
  MiniSparkline.tsx       — SVG sparkline
  FuturesStrip.tsx        — quick-select futures strip below chart
  AITerminal.tsx          — chat UI with provider selector
  IntelPanel.tsx          — INTEL tab: session context, market structure, key levels (Bloomberg-styled)

lib/
  types.ts       — Bar, Quote, Provider, ChatMessage, NewsItem
  themes.ts      — THEMES object (dark + light)
  symbolMap.ts   — display name → Polygon ticker + timeframe mapping (18 symbols)
  mockData.ts    — FX_DATA (10 symbols), FUTURES_DATA (8 symbols), TICKER_DATA, MOCK_NEWS
  aiConfig.ts    — getAvailableProviders() (server-side only)
  generateCandles.ts — seeded LCG candle generator (fallback)

hooks/
  useQuotes.ts       — polls /api/quotes every 5s; exposes { quotes, isLive }
  useBars.ts         — fetches /api/bars on symbol/timeframe change
  useNews.ts         — polls /api/news every 60s; falls back to MOCK_NEWS
  useSessionIntel.ts — computes session (ASIAN/LONDON/NY/CLOSED), ATR, structure, levels from bars + UTC

app/api/
  chat/route.ts   — POST: proxies to Gemini | Perplexity | Claude
  quotes/route.ts — GET: Polygon FX snapshot + ETF proxy for futures → normalized Quote map
  bars/route.ts   — GET: Polygon aggregates → Bar[]
  news/route.ts   — GET: Polygon news → NewsItem[]
```

## Symbols covered (17 total)

**FX / Crypto** (9): EUR/USD, GBP/USD, USD/JPY, XAU/USD, BTC/USD, ETH/USD, SOL/USD, GBP/JPY, USD/CAD
**Futures** (8): ES1! (S&P 500), NQ1! (Nasdaq), YM1! (Dow), CL1! (Crude Oil), GC1! (Gold), ZN1! (10Y T-Note), 6E1! (EUR Fut), 6J1! (JPY Fut)

## ETF Proxy map for futures quotes

```text
ES (S&P 500)  → SPY  × 10.0
NQ (Nasdaq)   → QQQ  × 42.0
YM (Dow)      → DIA  × 100.0
CL (Crude)    → USO  × 1.0
GC (Gold)     → GLD  × 10.5
ZN (10Y)      → TLT  × 0.72
6E (EUR Fut)  → FXE  × 0.01
6J (JPY Fut)  → FXY  × 0.000105
```

Polygon free tier doesn't serve direct futures contracts.
ETF proxies give good directional accuracy for display purposes.

## Stack evaluation (recorded)

**Verdict: Keep Next.js 15.**

- lightweight-charts v5 replaces SVG CandleChart for proper candlestick + volume rendering
- React at 50+ updates/sec: fine with useMemo + isolated hook state
- SSR: not used — all terminal components are `"use client"`
- API routes: cleanest single solution for server-side key proxying

## To run

```bash
cp .env.example .env.local
# Fill in POLYGON_API_KEY + at least one AI key
npm install
npm run dev
```

Open http://localhost:3000

## MCP Server

The `mcp/` directory contains a Model Context Protocol server that gives Claude
direct read/write access to the trading database.

### Tools exposed

| Tool | Description |
|---|---|
| `get_signals` | Query signals (instrument, status, min_score, days, limit) |
| `get_signal_events` | Event timeline for a signal UUID |
| `update_signal_status` | Mark signal ACTIVE / CLOSED / REJECTED |
| `run_signal_scan` | Trigger live scan via Next.js API (needs NEXT_APP_URL) |
| `get_ghost_trades` | Ghost trades + outcomes (instrument, outcome, days) |
| `get_ghost_summary` | Aggregate stats: fill rate, win rate, avg R, expectancy |
| `get_ghost_leaderboard` | Rankings by strategies / symbols / checklist |
| `create_ghost_trade` | Insert a new ghost trade |
| `record_ghost_outcome` | WIN / LOSS / etc. + R-multiples for a ghost trade |
| `get_journal` | Journal entries (days, limit) |
| `create_journal_entry` | Add note + emotion + tags + confidence |
| `get_agent_tasks` | Agent task list (role, status, limit) |
| `dispatch_agent_task` | Queue a new agent task |
| `update_agent_task` | Update task status / output |
| `get_analytics` | Signal analytics + breakdowns by any dimension |
| `get_recent_activity` | Cross-table activity feed (last N hours) |

### Resources exposed

| URI | Content |
|---|---|
| `project://context` | This CLAUDE.md file |
| `project://trading-types` | `lib/trading-types.ts` — all DB interfaces |

### Setup

```bash
cd mcp
npm install
```

Add to `~/.claude/settings.json` (Claude Code) or `claude_desktop_config.json` (Desktop):

```json
{
  "mcpServers": {
    "space-terminal": {
      "command": "npx",
      "args": ["tsx", "/absolute/path/to/Space-terminal/mcp/server.ts"],
      "env": {
        "POSTGRES_URL": "postgresql://...",
        "NEXT_APP_URL": "http://localhost:3000"
      }
    }
  }
}
```

`NEXT_APP_URL` is optional — only needed for `run_signal_scan`.

## Current state

- [x] Stack evaluation delivered
- [x] Components split into separate files
- [x] AI calls server-side only — no keys in browser
- [x] Multi-provider AI selector (Perplexity / Gemini / Claude)
- [x] Provider persists to localStorage
- [x] /api/quotes → useQuotes (5s poll, mock fallback, isLive indicator)
- [x] /api/bars → useBars (on symbol/tf change, mock fallback)
- [x] /api/news → useNews hook (60s poll — was hardcoded MOCK_NEWS, now fixed)
- [x] .env.example accurate
- [x] Futures quotes via ETF proxy (SPY, QQQ, GLD, etc.)
- [x] Real-time session detection from UTC clock (replaces hardcoded open/closed)
- [x] LIVE/DEMO indicator badge in header
- [x] lightweight-charts v5 chart (candlestick + volume histogram, zoom/pan)
- [x] INTEL panel tab: session context, ATR ratio, market structure, key levels
- [x] Symbol expansion: ETH/USD, SOL/USD, GBP/JPY, USD/CAD added

## Upgrade path: WebSocket (when on Polygon paid plan)

Replace `useQuotes.ts` polling with `usePolygonStream.ts`:
- Connect to `wss://socket.polygon.io/forex`
- Subscribe to `C.*` for FX, update quote state on each message
- Keep REST snapshot as initial load + reconnect fallback
