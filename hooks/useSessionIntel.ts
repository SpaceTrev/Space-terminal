"use client";

import { useState, useEffect } from "react";
import type { Bar } from "@/lib/types";

export type SessionName = "ASIAN" | "LONDON" | "NY" | "CLOSED";
export type Profile = "TREND" | "RANGE" | "BREAKOUT";
export type Participation = "CLIMAX" | "HIGH" | "NORMAL" | "LOW";
export type Structure = "HH/HL" | "LH/LL" | "UNCLEAR";

export interface SessionIntel {
  session: SessionName;
  timeInSession: number;    // minutes elapsed in current session
  profile: Profile;
  participation: Participation;
  structure: Structure;
  atr: number;              // current ATR
  atrRatio: number;         // current ATR / avg ATR (>1 = expansion)
  sessionHigh: number | null;
  sessionLow: number | null;
  prevHigh: number | null;
  prevLow: number | null;
  dailyRangePct: number;    // % of avg daily range already used
}

// UTC session windows [startHour, endHour)
const SESSION_WINDOWS: { name: SessionName; start: number; end: number }[] = [
  { name: "ASIAN",  start:  0, end:  9 },
  { name: "LONDON", start:  7, end: 16 },
  { name: "NY",     start: 13, end: 22 },
];

function getCurrentSession(utcH: number, utcM: number): { name: SessionName; minutesIn: number } {
  // Prefer NY > LONDON > ASIAN in overlap (most liquid)
  for (const s of [...SESSION_WINDOWS].reverse()) {
    if (utcH >= s.start && utcH < s.end) {
      const minutesIn = (utcH - s.start) * 60 + utcM;
      return { name: s.name, minutesIn };
    }
  }
  return { name: "CLOSED", minutesIn: 0 };
}

function computeATR(bars: Bar[], period = 14): number {
  if (bars.length < 2) return 0;
  const trs: number[] = [];
  for (let i = 1; i < bars.length; i++) {
    const b = bars[i];
    const prev = bars[i - 1];
    trs.push(Math.max(
      b.high - b.low,
      Math.abs(b.high - prev.close),
      Math.abs(b.low  - prev.close),
    ));
  }
  const slice = trs.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / slice.length;
}

function computeStructure(bars: Bar[]): Structure {
  if (bars.length < 6) return "UNCLEAR";
  const recent = bars.slice(-6);
  const highs = recent.map(b => b.high);
  const lows  = recent.map(b => b.low);

  const hhhl = highs[highs.length - 1] > highs[highs.length - 3] &&
               lows[lows.length   - 1] > lows[lows.length   - 3];
  const lhll = highs[highs.length - 1] < highs[highs.length - 3] &&
               lows[lows.length   - 1] < lows[lows.length   - 3];

  if (hhhl) return "HH/HL";
  if (lhll) return "LH/LL";
  return "UNCLEAR";
}

function computeParticipation(atrRatio: number): Participation {
  if (atrRatio >= 2.0) return "CLIMAX";
  if (atrRatio >= 1.3) return "HIGH";
  if (atrRatio <= 0.7) return "LOW";
  return "NORMAL";
}

function computeProfile(participation: Participation, structure: Structure): Profile {
  if (participation === "CLIMAX") return "BREAKOUT";
  if (participation === "HIGH" && structure !== "UNCLEAR") return "TREND";
  return "RANGE";
}

export function useSessionIntel(symbol: string, bars: Bar[]): SessionIntel {
  const [intel, setIntel] = useState<SessionIntel>(() => buildIntel(new Date(), bars));

  useEffect(() => {
    // Recompute whenever bars change
    setIntel(buildIntel(new Date(), bars));
  }, [bars, symbol]);

  useEffect(() => {
    // Update time-based fields every minute
    const id = setInterval(() => {
      setIntel(prev => buildIntel(new Date(), bars, prev));
    }, 60_000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bars]);

  return intel;
}

function buildIntel(now: Date, bars: Bar[], prev?: SessionIntel): SessionIntel {
  const utcH = now.getUTCHours();
  const utcM = now.getUTCMinutes();

  const { name: session, minutesIn: timeInSession } = getCurrentSession(utcH, utcM);

  // ATR computation
  const atr = computeATR(bars);
  // Average ATR over all bars
  const allATRs: number[] = [];
  for (let i = 1; i < bars.length; i++) {
    const b = bars[i];
    const p = bars[i - 1];
    allATRs.push(Math.max(b.high - b.low, Math.abs(b.high - p.close), Math.abs(b.low - p.close)));
  }
  const avgATR = allATRs.length > 0 ? allATRs.reduce((a, b) => a + b, 0) / allATRs.length : atr;
  const atrRatio = avgATR > 0 ? atr / avgATR : 1;

  const structure    = computeStructure(bars);
  const participation = computeParticipation(atrRatio);
  const profile      = computeProfile(participation, structure);

  // Session high/low from recent bars (last 6 bars approximates current session)
  const sessionBars = bars.slice(-6);
  const sessionHigh = sessionBars.length > 0 ? Math.max(...sessionBars.map(b => b.high)) : null;
  const sessionLow  = sessionBars.length > 0 ? Math.min(...sessionBars.map(b => b.low))  : null;

  // Previous day high/low from bars before last 6
  const prevBars = bars.slice(-12, -6);
  const prevHigh = prevBars.length > 0 ? Math.max(...prevBars.map(b => b.high)) : null;
  const prevLow  = prevBars.length > 0 ? Math.min(...prevBars.map(b => b.low))  : null;

  // Daily range % used
  const lastBar = bars[bars.length - 1];
  const dailyRange = lastBar ? lastBar.high - lastBar.low : 0;
  const dailyRangePct = avgATR > 0 ? Math.min((dailyRange / avgATR) * 100, 200) : 0;

  return {
    session,
    timeInSession,
    profile,
    participation,
    structure,
    atr,
    atrRatio,
    sessionHigh,
    sessionLow,
    prevHigh,
    prevLow,
    dailyRangePct,
    // preserve some stable values if bars haven't changed
    ...(prev && bars.length === 0 ? { sessionHigh: prev.sessionHigh, sessionLow: prev.sessionLow } : {}),
  };
}
