"use client";

import { useMemo } from "react";
import type { Theme } from "@/lib/themes";
import type { SessionIntel } from "@/hooks/useSessionIntel";
import type { Bar, Quote } from "@/lib/types";

interface Props {
  t: Theme;
  intel: SessionIntel;
  bars: Bar[];
  symbol: string;
  quote: Quote;
}

function fmt(n: number | null | undefined, decimals = 2): string {
  if (n == null || isNaN(n)) return "—";
  return n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function Row({ label, value, valueColor, t }: { label: string; value: string; valueColor?: string; t: Theme }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "3px 0", fontSize: 11 }}>
      <span style={{ color: t.textMuted }}>{label}</span>
      <span style={{ color: valueColor ?? t.text, fontWeight: 600, fontFamily: "inherit" }}>{value}</span>
    </div>
  );
}

function SectionHeader({ label, t }: { label: string; t: Theme }) {
  return (
    <div style={{ fontSize: 9, letterSpacing: 2, color: t.textMuted, padding: "8px 0 4px", textTransform: "uppercase" as const }}>
      {label}
    </div>
  );
}

function Divider({ t }: { t: Theme }) {
  return <div style={{ borderTop: `1px solid ${t.border}`, margin: "4px 0" }} />;
}

export function IntelPanel({ t, intel, bars, symbol, quote }: Props) {
  const {
    session, timeInSession, profile, participation, structure,
    atr, atrRatio, sessionHigh, sessionLow, prevHigh, prevLow, dailyRangePct,
  } = intel;

  const derived = useMemo(() => {
    const sessColor = session === "LONDON" ? "#a78bfa" :
                      session === "NY"     ? "#fb923c" :
                      session === "ASIAN"  ? "#60a5fa" : t.textMuted;

    const partColor = participation === "CLIMAX" ? t.down :
                      participation === "HIGH"   ? "#fb923c" :
                      participation === "LOW"    ? t.accentBlue : t.up;

    const structColor = structure === "HH/HL" ? t.up :
                        structure === "LH/LL" ? t.down : t.textMuted;

    const profileColor = profile === "TREND"    ? t.up :
                         profile === "BREAKOUT" ? t.down : t.accentBlue;

    const hh = Math.floor(timeInSession / 60);
    const mm = timeInSession % 60;
    const timeStr = session !== "CLOSED"
      ? (hh > 0 ? `${hh}h ${mm}m` : `${mm}m`)
      : "—";

    const rvolPct = Math.min(atrRatio * 50, 100);
    const rvolColor = atrRatio >= 2.0 ? t.down :
                      atrRatio >= 1.3 ? "#fb923c" :
                      atrRatio <= 0.7 ? t.accentBlue : t.up;

    const currentPrice = parseFloat(quote.ask ?? quote.last ?? "0");

    const distHigh = sessionHigh && currentPrice ? sessionHigh - currentPrice : null;
    const distLow  = sessionLow  && currentPrice ? currentPrice - sessionLow  : null;

    return { sessColor, partColor, structColor, profileColor, timeStr, rvolPct, rvolColor, currentPrice, distHigh, distLow };
  }, [session, timeInSession, profile, participation, structure, atrRatio, sessionHigh, sessionLow, quote.ask, quote.last, t]);

  const { sessColor, partColor, structColor, profileColor, timeStr, rvolPct, rvolColor, distHigh, distLow } = derived;

  return (
    <div style={{ flex: 1, overflow: "auto", padding: "12px 16px" }}>

      {/* SESSION BLOCK */}
      <SectionHeader label="Session Context" t={t} />

      <div style={{
        background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 6,
        padding: "10px 12px", marginBottom: 10,
      }}>
        {/* Session badge */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <div style={{
            width: 8, height: 8, borderRadius: "50%",
            background: session !== "CLOSED" ? sessColor : t.textMuted,
            boxShadow: session !== "CLOSED" ? `0 0 8px ${sessColor}` : "none",
            animation: session !== "CLOSED" ? "pulse 2s infinite" : "none",
          }} />
          <span style={{ fontSize: 15, fontWeight: 700, color: sessColor, letterSpacing: 1 }}>{session}</span>
          {session !== "CLOSED" && (
            <span style={{ fontSize: 10, color: t.textMuted, marginLeft: 4 }}>{timeStr}</span>
          )}
          <div style={{ marginLeft: "auto" }}>
            <span style={{
              fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 3,
              background: profileColor + "22", border: `1px solid ${profileColor}44`,
              color: profileColor, letterSpacing: 1,
            }}>{profile}</span>
          </div>
        </div>

        <Row label="PARTICIPATION" value={participation} valueColor={partColor} t={t} />
        <Row label="STRUCTURE"     value={structure}      valueColor={structColor} t={t} />

        {/* RVOL bar */}
        <div style={{ marginTop: 6 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, marginBottom: 3 }}>
            <span style={{ color: t.textMuted }}>ATR RATIO</span>
            <span style={{ color: rvolColor, fontWeight: 700 }}>{atrRatio.toFixed(2)}×</span>
          </div>
          <div style={{ height: 4, background: t.border, borderRadius: 2, overflow: "hidden" }}>
            <div style={{
              height: "100%", width: `${rvolPct}%`,
              background: rvolColor, borderRadius: 2,
              transition: "width 0.4s ease",
            }} />
          </div>
        </div>
      </div>

      {/* MARKET STRUCTURE BLOCK */}
      <SectionHeader label="Market Structure" t={t} />

      <div style={{
        background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 6,
        padding: "10px 12px", marginBottom: 10,
      }}>
        <Row label="ATR (14)"       value={fmt(atr, 4)}               t={t} />
        <Row label="DAILY RANGE %"  value={`${dailyRangePct.toFixed(0)}% of avg`}
             valueColor={dailyRangePct > 120 ? t.down : dailyRangePct > 80 ? "#fb923c" : t.up}
             t={t} />
        {bars.length > 0 && (() => {
          const last = bars[bars.length - 1];
          const barRange = last.high - last.low;
          return <Row label="BAR RANGE" value={fmt(barRange, 4)} t={t} />;
        })()}
      </div>

      {/* KEY LEVELS BLOCK */}
      <SectionHeader label="Key Levels" t={t} />

      <div style={{
        background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 6,
        padding: "10px 12px", marginBottom: 10,
      }}>
        <div style={{ fontSize: 9, color: t.textMuted, letterSpacing: 1, marginBottom: 4 }}>SESSION HI/LO</div>
        <Row
          label="Session High"
          value={sessionHigh ? fmt(sessionHigh, 4) : "—"}
          valueColor={distHigh !== null && distHigh < atr * 0.3 ? t.down : t.up}
          t={t}
        />
        <Row
          label="Session Low"
          value={sessionLow ? fmt(sessionLow, 4) : "—"}
          valueColor={distLow !== null && distLow < atr * 0.3 ? t.down : t.up}
          t={t}
        />

        <Divider t={t} />

        <div style={{ fontSize: 9, color: t.textMuted, letterSpacing: 1, marginBottom: 4 }}>PRIOR SESSION</div>
        <Row label="Prior High" value={prevHigh ? fmt(prevHigh, 4) : "—"} valueColor={t.accentBlue} t={t} />
        <Row label="Prior Low"  value={prevLow  ? fmt(prevLow,  4) : "—"} valueColor={t.accentBlue} t={t} />

        {(distHigh !== null || distLow !== null) && (
          <>
            <Divider t={t} />
            <div style={{ fontSize: 9, color: t.textMuted, letterSpacing: 1, marginBottom: 4 }}>PROXIMITY</div>
            {distHigh !== null && (
              <Row label="→ Sess High" value={fmt(distHigh, 4)} valueColor={t.textSub} t={t} />
            )}
            {distLow !== null && (
              <Row label="→ Sess Low"  value={fmt(distLow, 4)}  valueColor={t.textSub} t={t} />
            )}
          </>
        )}
      </div>

      {/* QUICK STATS BLOCK */}
      <SectionHeader label="Quick Stats" t={t} />

      <div style={{
        background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 6,
        padding: "10px 12px",
      }}>
        <Row label={`${symbol}`}  value={quote.ask ?? "—"} valueColor={t.textStrong} t={t} />
        <Row label="CHANGE"       value={`${quote.change} (${quote.changePct})`}
             valueColor={quote.up ? t.up : t.down} t={t} />
        <Row label="VOLUME"       value={quote.volume ?? "—"} t={t} />
        {quote.O && <Row label="OPEN"    value={quote.O} t={t} />}
        {quote.H && <Row label="HIGH"    value={quote.H} valueColor={t.up}   t={t} />}
        {quote.L && <Row label="LOW"     value={quote.L} valueColor={t.down} t={t} />}
        {quote.spread && <Row label="SPREAD" value={quote.spread} t={t} />}
      </div>

    </div>
  );
}
