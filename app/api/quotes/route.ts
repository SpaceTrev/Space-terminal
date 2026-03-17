import { NextResponse } from "next/server";
import { SYMBOL_MAP } from "@/lib/symbolMap";
import { FX_DATA, FUTURES_DATA } from "@/lib/mockData";
import type { Quote } from "@/lib/types";

export const revalidate = 5; // cache 5 seconds

export async function GET() {
  const key = process.env.POLYGON_API_KEY;
  if (!key) {
    return NextResponse.json({ ...FX_DATA, ...FUTURES_DATA });
  }

  try {
    const tickers = Object.values(SYMBOL_MAP).join(",");
    const url = `https://api.polygon.io/v2/snapshot/locale/global/markets/forex/tickers?tickers=${tickers}&apiKey=${key}`;
    const res = await fetch(url, { next: { revalidate: 5 } });

    if (!res.ok) {
      return NextResponse.json({ ...FX_DATA, ...FUTURES_DATA });
    }

    const json = await res.json();
    const tickers_data = json.tickers ?? [];

    // Build reverse map: polygon ticker → display name
    const reverseMap: Record<string, string> = {};
    for (const [display, poly] of Object.entries(SYMBOL_MAP)) {
      reverseMap[poly] = display;
    }

    const result: Record<string, Quote> = {};
    const allMock = { ...FX_DATA, ...FUTURES_DATA };

    for (const ticker of tickers_data) {
      const displayName = reverseMap[ticker.ticker];
      if (!displayName) continue;
      const mock = allMock[displayName];
      const day = ticker.day ?? {};
      const prevDay = ticker.prevDay ?? {};
      const lastTrade = ticker.lastTrade ?? {};
      const lastQuote = ticker.lastQuote ?? {};

      const last = lastTrade.p ?? day.c ?? 0;
      const prevClose = prevDay.c ?? 0;
      const change = last - prevClose;
      const changePct = prevClose ? (change / prevClose) * 100 : 0;

      result[displayName] = {
        symbol: displayName,
        bid: lastQuote.P ? String(lastQuote.P) : (mock?.bid ?? "0"),
        ask: lastQuote.S ? String(lastQuote.S) : (mock?.ask ?? "0"),
        last: String(last),
        change: change >= 0 ? `+${change.toFixed(4)}` : change.toFixed(4),
        changePct: changePct >= 0 ? `+${changePct.toFixed(2)}%` : `${changePct.toFixed(2)}%`,
        up: change >= 0,
        volume: day.v ? formatVolume(day.v) : mock?.volume,
        O: day.o ? String(day.o) : mock?.O,
        H: day.h ? String(day.h) : mock?.H,
        L: day.l ? String(day.l) : mock?.L,
        C: day.c ? String(day.c) : mock?.C,
        spread: mock?.spread,
        sparkline: mock?.sparkline,
        expiry: mock?.expiry,
        type: mock?.type,
        baseSeed: mock?.baseSeed,
      };
    }

    // fill in any symbols Polygon didn't return
    for (const [sym, mock] of Object.entries(allMock)) {
      if (!result[sym]) result[sym] = mock;
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ ...FX_DATA, ...FUTURES_DATA });
  }
}

function formatVolume(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000)     return `${(v / 1_000).toFixed(1)}K`;
  return String(v);
}
