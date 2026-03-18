"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { FX_DATA, FUTURES_DATA } from "@/lib/mockData";
import type { Quote } from "@/lib/types";

const ALL_MOCK: Record<string, Quote> = { ...FX_DATA, ...FUTURES_DATA };
const POLL_INTERVAL = 5000;
const SPARKLINE_LENGTH = 10;

export function useQuotes(): { quotes: Record<string, Quote>; isLive: boolean } {
  const [quotes, setQuotes] = useState<Record<string, Quote>>(ALL_MOCK);
  const [isLive, setIsLive] = useState(false);
  const sparklines = useRef<Record<string, number[]>>(
    Object.fromEntries(
      Object.entries(ALL_MOCK).map(([sym, q]) => [sym, [...(q.sparkline ?? [])]])
    )
  );

  const fetchQuotes = useCallback(async () => {
    try {
      const res = await fetch("/api/quotes");
      if (!res.ok) return;
      const data: Record<string, Quote> = await res.json();

      // Detect if we got real data by checking if any value differs from mock
      const hasDiff = Object.entries(data).some(([sym, q]) => {
        const mock = ALL_MOCK[sym];
        return mock && q.ask !== mock.ask;
      });
      if (hasDiff) setIsLive(true);

      setQuotes(prev => {
        const next = { ...prev };
        for (const [sym, q] of Object.entries(data)) {
          const hist = sparklines.current[sym] ?? [];
          const price = parseFloat(q.ask ?? q.last ?? "0");
          if (price > 0) {
            hist.push(price);
            if (hist.length > SPARKLINE_LENGTH) hist.shift();
            sparklines.current[sym] = hist;
          }
          next[sym] = { ...prev[sym], ...q, sparkline: [...(sparklines.current[sym] ?? [])] };
        }
        return next;
      });
    } catch {
      // silently fall back to current state
    }
  }, []);

  useEffect(() => {
    fetchQuotes();
    const id = setInterval(fetchQuotes, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [fetchQuotes]);

  return { quotes, isLive };
}
