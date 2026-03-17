"use client";

import { useState, useEffect } from "react";
import { generateCandles } from "@/lib/generateCandles";
import { ALL_SYMBOL_DATA } from "@/lib/mockData";
import type { Bar } from "@/lib/types";

export function useBars(symbol: string, timeframe: string): Bar[] {
  const [bars, setBars] = useState<Bar[]>(() => makeFallback(symbol, timeframe));

  useEffect(() => {
    setBars(makeFallback(symbol, timeframe)); // immediate fallback while fetching
    let cancelled = false;

    async function fetchBars() {
      try {
        const res = await fetch(`/api/bars?symbol=${encodeURIComponent(symbol)}&tf=${timeframe}`);
        if (!res.ok || cancelled) return;
        const data: Bar[] = await res.json();
        if (!cancelled && data.length > 0) setBars(data);
      } catch {
        // keep fallback
      }
    }

    fetchBars();
    return () => { cancelled = true; };
  }, [symbol, timeframe]);

  return bars;
}

function makeFallback(symbol: string, timeframe: string): Bar[] {
  const TIMEFRAMES = ["1M", "5M", "15M", "1H", "4H", "D"];
  const sd = ALL_SYMBOL_DATA[symbol];
  const tfMult = TIMEFRAMES.indexOf(timeframe) + 1;
  return generateCandles((sd?.baseSeed ?? 1000) * tfMult * 0.137, 40);
}
