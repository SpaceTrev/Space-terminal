import { NextResponse } from "next/server";
import { SYMBOL_MAP } from "@/lib/symbolMap";
import { FX_DATA, FUTURES_DATA } from "@/lib/mockData";
import type { Quote } from "@/lib/types";

export const revalidate = 5; // cache 5 seconds

// ETF proxies for futures (Polygon free tier covers stocks/ETFs)
// scale: multiply ETF price by this factor to approximate futures price
const FUTURES_ETF_PROXY: Record<string, { etf: string; scale: number }> = {
  "ES1! (S&P 500)":    { etf: "SPY",  scale: 10.0  },
  "NQ1! (Nasdaq)":     { etf: "QQQ",  scale: 42.0  },
  "YM1! (Dow)":        { etf: "DIA",  scale: 100.0 },
  "CL1! (Crude Oil)":  { etf: "USO",  scale: 1.0   },
  "GC1! (Gold)":       { etf: "GLD",  scale: 10.5  },
  "ZN1! (10Y T-Note)": { etf: "TLT",  scale: 0.72  },
  "6E1! (EUR Fut)":    { etf: "FXE",  scale: 0.01  },
  "6J1! (JPY Fut)":    { etf: "FXY",  scale: 0.000105 },
};

export async function GET() {
  const key = process.env.POLYGON_API_KEY;
  if (!key) {
    return NextResponse.json({ ...FX_DATA, ...FUTURES_DATA });
  }

  const allMock: Record<string, Quote> = { ...FX_DATA, ...FUTURES_DATA };
  const result: Record<string, Quote> = {};

  // Parallel fetch: FX/Crypto quotes + ETF proxy quotes
  const [fxResult, etfResult] = await Promise.all([
    fetchFXQuotes(key, allMock),
    fetchETFProxyQuotes(key, allMock),
  ]);

  Object.assign(result, fxResult, etfResult);

  // Fill any missing symbols with mock data
  for (const [sym, mock] of Object.entries(allMock)) {
    if (!result[sym]) result[sym] = mock;
  }

  return NextResponse.json(result);
}

async function fetchFXQuotes(key: string, allMock: Record<string, Quote>): Promise<Record<string, Quote>> {
  const result: Record<string, Quote> = {};
  try {
    const fxSymbols = Object.entries(SYMBOL_MAP)
      .filter(([, poly]) => poly.startsWith("C:") || poly.startsWith("X:"))
      .map(([, poly]) => poly)
      .join(",");

    const url = `https://api.polygon.io/v2/snapshot/locale/global/markets/forex/tickers?tickers=${fxSymbols}&apiKey=${key}`;
    const res = await fetch(url, { next: { revalidate: 5 }, signal: AbortSignal.timeout(4000) });
    if (!res.ok) return result;

    const json = await res.json();
    const tickers: PolygonTicker[] = json.tickers ?? [];

    // Build reverse map: polygon ticker → display name
    const reverseMap: Record<string, string> = {};
    for (const [display, poly] of Object.entries(SYMBOL_MAP)) {
      reverseMap[poly] = display;
    }

    for (const ticker of tickers) {
      const displayName = reverseMap[ticker.ticker];
      if (!displayName) continue;
      const mock = allMock[displayName];
      result[displayName] = buildQuote(displayName, ticker, mock);
    }
  } catch {
    // return empty, will use mock fallback
  }
  return result;
}

async function fetchETFProxyQuotes(key: string, allMock: Record<string, Quote>): Promise<Record<string, Quote>> {
  const result: Record<string, Quote> = {};
  try {
    const etfTickers = Object.values(FUTURES_ETF_PROXY).map(p => p.etf).join(",");
    const url = `https://api.polygon.io/v2/snapshot/locale/us/markets/stocks/tickers?tickers=${etfTickers}&apiKey=${key}`;
    const res = await fetch(url, { next: { revalidate: 5 }, signal: AbortSignal.timeout(4000) });
    if (!res.ok) return result;

    const json = await res.json();
    const tickers: PolygonTicker[] = json.tickers ?? [];

    // Build ETF → futures display name map
    const etfToFutures: Record<string, string> = {};
    for (const [futName, proxy] of Object.entries(FUTURES_ETF_PROXY)) {
      etfToFutures[proxy.etf] = futName;
    }

    for (const ticker of tickers) {
      const futName = etfToFutures[ticker.ticker];
      if (!futName) continue;
      const proxy = FUTURES_ETF_PROXY[futName];
      const mock = allMock[futName];
      result[futName] = buildProxyQuote(futName, ticker, proxy.scale, mock);
    }
  } catch {
    // return empty, will use mock fallback
  }
  return result;
}

interface PolygonTicker {
  ticker: string;
  day?: { o?: number; h?: number; l?: number; c?: number; v?: number };
  prevDay?: { c?: number };
  lastTrade?: { p?: number };
  lastQuote?: { P?: number; S?: number };
}

function buildQuote(displayName: string, ticker: PolygonTicker, mock?: Quote): Quote {
  const day = ticker.day ?? {};
  const prevDay = ticker.prevDay ?? {};
  const lastTrade = ticker.lastTrade ?? {};
  const lastQuote = ticker.lastQuote ?? {};

  const last = lastTrade.p ?? day.c ?? 0;
  const prevClose = prevDay.c ?? 0;
  const change = last - prevClose;
  const changePct = prevClose ? (change / prevClose) * 100 : 0;

  return {
    symbol: displayName,
    bid:  lastQuote.P != null ? String(lastQuote.P) : (mock?.bid ?? "0"),
    ask:  lastQuote.S != null ? String(lastQuote.S) : (mock?.ask ?? "0"),
    last: String(last),
    change: change >= 0 ? `+${change.toFixed(4)}` : change.toFixed(4),
    changePct: changePct >= 0 ? `+${changePct.toFixed(2)}%` : `${changePct.toFixed(2)}%`,
    up: change >= 0,
    volume: day.v != null ? formatVolume(day.v) : mock?.volume,
    O: day.o != null ? String(day.o) : mock?.O,
    H: day.h != null ? String(day.h) : mock?.H,
    L: day.l != null ? String(day.l) : mock?.L,
    C: day.c != null ? String(day.c) : mock?.C,
    spread: mock?.spread,
    sparkline: mock?.sparkline,
    expiry: mock?.expiry,
    type: mock?.type,
    baseSeed: mock?.baseSeed,
  };
}

function buildProxyQuote(displayName: string, ticker: PolygonTicker, scale: number, mock?: Quote): Quote {
  const day = ticker.day ?? {};
  const prevDay = ticker.prevDay ?? {};
  const lastTrade = ticker.lastTrade ?? {};
  const lastQuote = ticker.lastQuote ?? {};

  const last = (lastTrade.p ?? day.c ?? 0) * scale;
  const prevClose = (prevDay.c ?? 0) * scale;
  const change = last - prevClose;
  const changePct = prevClose ? (change / prevClose) * 100 : 0;

  const dp = scale >= 100 ? 0 : scale >= 10 ? 2 : 4;
  const fmt = (n: number) => n.toFixed(dp);

  const bid = lastQuote.P != null ? fmt(lastQuote.P * scale) : mock?.bid ?? "0";
  const ask = lastQuote.S != null ? fmt(lastQuote.S * scale) : mock?.ask ?? "0";

  return {
    symbol: displayName,
    bid,
    ask,
    last: fmt(last),
    change: change >= 0 ? `+${fmt(change)}` : fmt(change),
    changePct: changePct >= 0 ? `+${changePct.toFixed(2)}%` : `${changePct.toFixed(2)}%`,
    up: change >= 0,
    volume: day.v != null ? formatVolume(day.v) : mock?.volume,
    O: day.o != null ? fmt(day.o * scale) : mock?.O,
    H: day.h != null ? fmt(day.h * scale) : mock?.H,
    L: day.l != null ? fmt(day.l * scale) : mock?.L,
    C: day.c != null ? fmt(day.c * scale) : mock?.C,
    spread: mock?.spread,
    sparkline: mock?.sparkline,
    expiry: mock?.expiry,
    type: mock?.type,
    baseSeed: mock?.baseSeed,
  };
}

function formatVolume(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000)     return `${(v / 1_000).toFixed(1)}K`;
  return String(v);
}
