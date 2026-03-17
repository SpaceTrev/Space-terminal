import { NextRequest, NextResponse } from "next/server";
import { SYMBOL_MAP, TIMEFRAME_MAP } from "@/lib/symbolMap";
import { generateCandles } from "@/lib/generateCandles";
import { ALL_SYMBOL_DATA } from "@/lib/mockData";
import type { Bar } from "@/lib/types";

const TIMEFRAMES = ["1M", "5M", "15M", "1H", "4H", "D"];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get("symbol") ?? "EUR/USD";
  const tf     = searchParams.get("tf")     ?? "4H";

  const key = process.env.POLYGON_API_KEY;
  if (!key) {
    return NextResponse.json(makeFallback(symbol, tf));
  }

  const polyTicker = SYMBOL_MAP[symbol];
  const tfConfig   = TIMEFRAME_MAP[tf];
  if (!polyTicker || !tfConfig) {
    return NextResponse.json(makeFallback(symbol, tf));
  }

  try {
    const now   = new Date();
    const from  = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000); // 90 days back
    const fromStr = from.toISOString().split("T")[0];
    const toStr   = now.toISOString().split("T")[0];

    const url = `https://api.polygon.io/v2/aggs/ticker/${polyTicker}/range/${tfConfig.multiplier}/${tfConfig.timespan}/${fromStr}/${toStr}?adjusted=true&sort=asc&limit=40&apiKey=${key}`;
    const res = await fetch(url, { next: { revalidate: 60 } });

    if (!res.ok) return NextResponse.json(makeFallback(symbol, tf));

    const json = await res.json();
    const results: { o: number; c: number; h: number; l: number; v: number; t: number }[] = json.results ?? [];

    if (results.length === 0) return NextResponse.json(makeFallback(symbol, tf));

    const bars: Bar[] = results.map(r => ({
      open:  r.o,
      close: r.c,
      high:  r.h,
      low:   r.l,
      up:    r.c >= r.o,
      volume: r.v,
      timestamp: r.t,
    }));

    return NextResponse.json(bars);
  } catch {
    return NextResponse.json(makeFallback(symbol, tf));
  }
}

function makeFallback(symbol: string, tf: string): Bar[] {
  const sd = ALL_SYMBOL_DATA[symbol];
  const tfMult = TIMEFRAMES.indexOf(tf) + 1;
  return generateCandles((sd?.baseSeed ?? 1000) * tfMult * 0.137, 40);
}
