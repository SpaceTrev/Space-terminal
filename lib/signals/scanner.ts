import type { Bar } from "@/lib/types";
import {
  computeATR,
  detectStructure,
  detectFVG,
  detectMomentumShift,
  detectLiquiditySweep,
  getSessionFromUTC,
  type MarketStructure,
  type FVG,
  type Session,
} from "./indicators";
import { scoreSignal, type Grade } from "./scoring";

// ── Signal Types ────────────────────────────────────────────────────

export type Direction = "LONG" | "SHORT";

export interface Signal {
  instrument: string;
  direction: Direction;
  setup_type: string;
  session: Session;
  confluence_score: number;
  score_grade: Grade;
  entry_ref: number;
  stop_loss: number;
  tp1: number;
  tp2: number;
  tp3: number;
  htf_aligned: boolean;
  liquidity_swept: boolean;
  momentum_shift: boolean;
}

// ── Session Strength Mapping ────────────────────────────────────────

function sessionStrength(session: Session): number {
  switch (session) {
    case "OVERLAP":
      return 10;
    case "LONDON":
      return 8;
    case "NY":
      return 7;
    case "ASIAN":
      return 4;
    case "CLOSED":
      return 1;
  }
}

// ── FVG Proximity Check ─────────────────────────────────────────────

function isFVGProximate(
  fvgs: FVG[],
  price: number,
  direction: Direction
): boolean {
  for (const fvg of fvgs) {
    if (direction === "LONG" && fvg.type === "bullish") {
      // Price is near or within the bullish FVG zone
      if (price >= fvg.low && price <= fvg.high * 1.005) return true;
    }
    if (direction === "SHORT" && fvg.type === "bearish") {
      // Price is near or within the bearish FVG zone
      if (price <= fvg.high && price >= fvg.low * 0.995) return true;
    }
  }
  return false;
}

// ── Setup Type Label ────────────────────────────────────────────────

function deriveSetupType(
  structure: MarketStructure,
  hasFVG: boolean,
  liquiditySweep: boolean
): string {
  const parts: string[] = [];
  if (structure === "HH/HL") parts.push("Bullish Structure");
  else if (structure === "LH/LL") parts.push("Bearish Structure");
  else parts.push("Range");

  if (hasFVG) parts.push("FVG");
  if (liquiditySweep) parts.push("Liquidity Sweep");

  return parts.join(" + ") || "Confluence";
}

// ── Single Instrument Scanner ───────────────────────────────────────

export function scanInstrument(
  instrument: string,
  bars: Bar[],
  currentHour: number
): Signal | null {
  if (bars.length < 20) return null;

  // Core analysis
  const atr = computeATR(bars);
  const structure = detectStructure(bars);
  const fvgs = detectFVG(bars);
  const momentumShift = detectMomentumShift(bars);
  const liquiditySweep = detectLiquiditySweep(bars, atr);
  const session = getSessionFromUTC(currentHour);

  // Determine direction
  const hasBullishFVG = fvgs.some((f) => f.type === "bullish");
  const hasBearishFVG = fvgs.some((f) => f.type === "bearish");

  let direction: Direction | null = null;
  if (structure === "HH/HL" && hasBullishFVG) direction = "LONG";
  else if (structure === "LH/LL" && hasBearishFVG) direction = "SHORT";
  else return null; // No clear directional bias

  const lastBar = bars[bars.length - 1];
  const entryRef = lastBar.close;

  // Score confluence
  const structureAligned = direction === "LONG"
    ? structure === "HH/HL"
    : structure === "LH/LL";

  const fvgProximity = isFVGProximate(fvgs, entryRef, direction);

  // Bias confluence: structure + FVG agree on direction + session is active
  const biasConfluence =
    structureAligned &&
    (direction === "LONG" ? hasBullishFVG : hasBearishFVG) &&
    session !== "CLOSED";

  const { score, grade } = scoreSignal({
    structureAligned,
    biasConfluence,
    fvgProximity,
    momentumShift,
    sessionStrength: sessionStrength(session),
  });

  if (score < 50) return null;

  // Entry, SL, TP calculations
  const risk = atr * 1.5;
  const stopLoss =
    direction === "LONG" ? entryRef - risk : entryRef + risk;
  const tp1 =
    direction === "LONG" ? entryRef + risk : entryRef - risk;
  const tp2 =
    direction === "LONG" ? entryRef + risk * 2 : entryRef - risk * 2;
  const tp3 =
    direction === "LONG" ? entryRef + risk * 3 : entryRef - risk * 3;

  return {
    instrument,
    direction,
    setup_type: deriveSetupType(
      structure,
      fvgProximity,
      liquiditySweep
    ),
    session,
    confluence_score: score,
    score_grade: grade,
    entry_ref: entryRef,
    stop_loss: stopLoss,
    tp1,
    tp2,
    tp3,
    htf_aligned: structureAligned,
    liquidity_swept: liquiditySweep,
    momentum_shift: momentumShift,
  };
}

// ── Multi-Instrument Scanner ────────────────────────────────────────

export function scanAllInstruments(
  instrumentBars: Record<string, Bar[]>,
  currentHour?: number
): Signal[] {
  const hour = currentHour ?? new Date().getUTCHours();
  const signals: Signal[] = [];

  for (const [instrument, bars] of Object.entries(instrumentBars)) {
    const signal = scanInstrument(instrument, bars, hour);
    if (signal) signals.push(signal);
  }

  // Sort by confluence score descending
  signals.sort((a, b) => b.confluence_score - a.confluence_score);

  return signals;
}
