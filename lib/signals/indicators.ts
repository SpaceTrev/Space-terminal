import type { Bar } from "@/lib/types";

// ── Average True Range ──────────────────────────────────────────────
export function computeATR(bars: Bar[], period: number = 14): number {
  if (bars.length < 2) return 0;

  const trueRanges: number[] = [];
  for (let i = 1; i < bars.length; i++) {
    const high = bars[i].high;
    const low = bars[i].low;
    const prevClose = bars[i - 1].close;
    const tr = Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));
    trueRanges.push(tr);
  }

  if (trueRanges.length === 0) return 0;

  // Simple average for the first period, then EMA-style smoothing
  const usable = Math.min(trueRanges.length, period);
  let atr = trueRanges.slice(0, usable).reduce((s, v) => s + v, 0) / usable;

  for (let i = usable; i < trueRanges.length; i++) {
    atr = (atr * (period - 1) + trueRanges[i]) / period;
  }

  return atr;
}

// ── Swing-point helpers ─────────────────────────────────────────────
interface SwingPoint {
  type: "high" | "low";
  value: number;
  index: number;
}

function findSwingPoints(bars: Bar[], lookback: number = 3): SwingPoint[] {
  const swings: SwingPoint[] = [];
  for (let i = lookback; i < bars.length - lookback; i++) {
    let isSwingHigh = true;
    let isSwingLow = true;
    for (let j = 1; j <= lookback; j++) {
      if (bars[i].high <= bars[i - j].high || bars[i].high <= bars[i + j].high) {
        isSwingHigh = false;
      }
      if (bars[i].low >= bars[i - j].low || bars[i].low >= bars[i + j].low) {
        isSwingLow = false;
      }
    }
    if (isSwingHigh) swings.push({ type: "high", value: bars[i].high, index: i });
    if (isSwingLow) swings.push({ type: "low", value: bars[i].low, index: i });
  }
  return swings;
}

// ── Market Structure ────────────────────────────────────────────────
export type MarketStructure = "HH/HL" | "LH/LL" | "RANGE";

export function detectStructure(bars: Bar[]): MarketStructure {
  const swings = findSwingPoints(bars);
  const highs = swings.filter((s) => s.type === "high");
  const lows = swings.filter((s) => s.type === "low");

  if (highs.length < 2 || lows.length < 2) return "RANGE";

  const lastTwoHighs = highs.slice(-2);
  const lastTwoLows = lows.slice(-2);

  const higherHigh = lastTwoHighs[1].value > lastTwoHighs[0].value;
  const higherLow = lastTwoLows[1].value > lastTwoLows[0].value;
  const lowerHigh = lastTwoHighs[1].value < lastTwoHighs[0].value;
  const lowerLow = lastTwoLows[1].value < lastTwoLows[0].value;

  if (higherHigh && higherLow) return "HH/HL";
  if (lowerHigh && lowerLow) return "LH/LL";
  return "RANGE";
}

// ── Fair Value Gap Detection ────────────────────────────────────────
export interface FVG {
  type: "bullish" | "bearish";
  high: number;
  low: number;
  index: number;
}

export function detectFVG(bars: Bar[]): FVG[] {
  const gaps: FVG[] = [];
  // Need at least 3 bars: bar[i-1], bar[i], bar[i+1]
  for (let i = 1; i < bars.length - 1; i++) {
    const prev = bars[i - 1];
    const next = bars[i + 1];

    // Bullish FVG: gap between prev.high and next.low (price jumps up)
    if (next.low > prev.high) {
      gaps.push({
        type: "bullish",
        high: next.low,
        low: prev.high,
        index: i,
      });
    }

    // Bearish FVG: gap between next.high and prev.low (price drops down)
    if (next.high < prev.low) {
      gaps.push({
        type: "bearish",
        high: prev.low,
        low: next.high,
        index: i,
      });
    }
  }
  return gaps;
}

// ── Momentum Shift Detection ────────────────────────────────────────
export function detectMomentumShift(bars: Bar[]): boolean {
  if (bars.length < 5) return false;

  const recent = bars.slice(-5);

  // Check if the last 3 bars reverse the direction of the prior 2
  const priorDirection =
    recent[1].close > recent[0].close ? "up" : "down";
  const bar3 = recent[2].close > recent[2].open ? "up" : "down";
  const bar4 = recent[3].close > recent[3].open ? "up" : "down";
  const bar5 = recent[4].close > recent[4].open ? "up" : "down";

  if (priorDirection === "up") {
    // Reversal to bearish: last 3 bars are predominantly down
    const downCount = [bar3, bar4, bar5].filter((d) => d === "down").length;
    return downCount >= 2;
  } else {
    // Reversal to bullish: last 3 bars are predominantly up
    const upCount = [bar3, bar4, bar5].filter((d) => d === "up").length;
    return upCount >= 2;
  }
}

// ── Liquidity Sweep Detection ───────────────────────────────────────
export function detectLiquiditySweep(bars: Bar[], atr: number): boolean {
  if (bars.length < 10 || atr <= 0) return false;

  const swings = findSwingPoints(bars.slice(0, -1)); // exclude last bar
  const lastBar = bars[bars.length - 1];
  const threshold = atr * 0.5;

  // Check if the last bar's wick swept a prior swing high then closed below it
  const swingHighs = swings.filter((s) => s.type === "high");
  for (const sh of swingHighs) {
    if (
      lastBar.high > sh.value + threshold &&
      lastBar.close < sh.value
    ) {
      return true;
    }
  }

  // Check if the last bar's wick swept a prior swing low then closed above it
  const swingLows = swings.filter((s) => s.type === "low");
  for (const sl of swingLows) {
    if (
      lastBar.low < sl.value - threshold &&
      lastBar.close > sl.value
    ) {
      return true;
    }
  }

  return false;
}

// ── Session Detection ───────────────────────────────────────────────
export type Session = "LONDON" | "NY" | "ASIAN" | "OVERLAP" | "CLOSED";

export function getSessionFromUTC(hour: number): Session {
  // London: 07-16 UTC, NY: 12-21 UTC, Asian: 23-08 UTC
  // Overlap (London+NY): 12-16 UTC
  if (hour >= 12 && hour < 16) return "OVERLAP";
  if (hour >= 7 && hour < 16) return "LONDON";
  if (hour >= 12 && hour < 21) return "NY";
  if (hour >= 23 || hour < 8) return "ASIAN";
  return "CLOSED";
}
