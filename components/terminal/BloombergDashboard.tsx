"use client";

import { useState, useEffect } from "react";
import { THEMES } from "@/lib/themes";
import type { ThemeKey } from "@/lib/themes";
import { FX_DATA, FUTURES_DATA } from "@/lib/mockData";
import { TickerBar } from "./TickerBar";
import { WatchlistSection } from "./WatchlistSection";
import { FuturesStrip } from "./FuturesStrip";
import { LightweightChart } from "./LightweightChart";
import { AITerminal } from "./AITerminal";
import { IntelPanel } from "./IntelPanel";
import { useQuotes } from "@/hooks/useQuotes";
import { useBars } from "@/hooks/useBars";
import { useNews } from "@/hooks/useNews";
import { useSessionIntel } from "@/hooks/useSessionIntel";
import type { Provider } from "@/lib/types";

const PANELS = [
  { id: "ai",    label: "AI TERMINAL", icon: "⬡" },
  { id: "intel", label: "INTEL",       icon: "◈" },
  { id: "news",  label: "NEWS",        icon: "◉" },
];
const TIMEFRAMES = ["1M", "5M", "15M", "1H", "4H", "D"];

// Session windows in UTC hours (start inclusive, end exclusive)
const SESSIONS = [
  { name: "CME FUTURES",  start: 22, end: 47 }, // 22:00–23:00 + 00:00–21:00 (near 24h)
  { name: "LONDON FX",    start:  7, end: 16 },
  { name: "NEW YORK FX",  start: 13, end: 22 },
  { name: "TOKYO",        start:  0, end:  9 },
] as const;

function isSessionOpen(start: number, end: number, utcHour: number): boolean {
  // CME is almost always open — handle wrap-around
  if (end > 24) {
    return utcHour >= start || utcHour < (end - 24);
  }
  return utcHour >= start && utcHour < end;
}

interface Props {
  availableProviders: Provider[];
}

export default function BloombergDashboard({ availableProviders }: Props) {
  const [themeKey, setThemeKey]         = useState<ThemeKey>("dark");
  const [activePanel, setActivePanel]   = useState("ai");
  const [watchlistTab, setWatchlistTab] = useState<"fx" | "futures">("fx");
  const [activeSymbol, setActiveSymbol] = useState("EUR/USD");
  const [activeTF, setActiveTF]         = useState("4H");
  const [time, setTime]                 = useState(new Date());

  const t           = THEMES[themeKey];
  const { quotes, isLive } = useQuotes();
  const bars        = useBars(activeSymbol, activeTF);
  const news        = useNews();
  const sessionIntel = useSessionIntel(activeSymbol, bars);

  const sym      = quotes[activeSymbol] ?? FX_DATA["EUR/USD"];
  const isFutures = sym?.type === "futures";

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const formatTime = (d: Date) => d.toUTCString().slice(17, 25) + " UTC";
  const utcHour = time.getUTCHours();

  const handleSymbolClick = (symbol: string) => {
    setActiveSymbol(symbol);
  };

  return (
    <div style={{ fontFamily: "'IBM Plex Mono','Courier New',monospace", background: t.bg, color: t.text, minHeight: "100vh", display: "flex", flexDirection: "column", transition: "background 0.25s, color 0.25s" }}>

      {/* HEADER */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 16px", background: t.bgHeader, borderBottom: `1px solid ${t.border}`, transition: "background 0.25s" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", gap: 8 }}>
            {["#ff6b35", "#ffd700", "#00d4aa"].map((c, i) => (
              <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: c, boxShadow: `0 0 6px ${c}` }} />
            ))}
          </div>
          <span style={{ color: t.accent, fontSize: 13, fontWeight: 700, letterSpacing: 3 }}>SPACE</span>
          <span style={{ color: t.textMuted, fontSize: 13, letterSpacing: 2 }}>TERMINAL</span>
        </div>
        <div style={{ display: "flex", gap: 16, alignItems: "center", fontSize: 11, color: t.textMuted }}>
          {/* LIVE / DEMO badge */}
          <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{
              width: 7, height: 7, borderRadius: "50%",
              background: isLive ? "#00d4aa" : t.textMuted,
              boxShadow: isLive ? "0 0 6px #00d4aa" : "none",
              display: "inline-block",
              animation: isLive ? "pulse 2s infinite" : "none",
            }} />
            <span style={{ color: isLive ? "#00d4aa" : t.textMuted, letterSpacing: 1 }}>
              {isLive ? "LIVE" : "DEMO"}
            </span>
          </span>
          <span>{formatTime(time)}</span>
          <span style={{ color: t.accentBlue }}>FX · FUTURES · METALS · CRYPTO</span>
          <button onClick={() => setThemeKey(k => k === "dark" ? "light" : "dark")} style={{
            background: t.bgCard, border: `1px solid ${t.border}`, color: t.textSub,
            borderRadius: 4, padding: "3px 10px", fontSize: 11, fontFamily: "inherit",
            cursor: "pointer", letterSpacing: 1, transition: "all 0.2s",
          }}>
            {themeKey === "dark" ? "☀ LIGHT" : "☾ DARK"}
          </button>
        </div>
      </div>

      {/* TICKER */}
      <TickerBar t={t} />

      {/* NAV */}
      <div style={{ display: "flex", background: t.bgHeader, borderBottom: `1px solid ${t.border}`, padding: "0 16px", transition: "background 0.25s" }}>
        {PANELS.map(p => (
          <button key={p.id} onClick={() => setActivePanel(p.id)} style={{
            background: "none", border: "none", cursor: "pointer", padding: "10px 20px",
            fontSize: 11, letterSpacing: 2, fontFamily: "inherit",
            color: activePanel === p.id ? t.accent : t.textMuted,
            borderBottom: `2px solid ${activePanel === p.id ? t.accent : "transparent"}`,
            transition: "all 0.15s", display: "flex", alignItems: "center", gap: 6,
          }}>
            {p.icon} {p.label}
          </button>
        ))}
      </div>

      {/* BODY */}
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "280px 1fr", overflow: "hidden", maxHeight: "calc(100vh - 118px)" }}>

        {/* SIDEBAR */}
        <div style={{ borderRight: `1px solid ${t.border}`, overflow: "hidden", background: t.bgSidebar, display: "flex", flexDirection: "column", transition: "background 0.25s" }}>

          {/* Watchlist tabs */}
          <div style={{ display: "flex", borderBottom: `1px solid ${t.border}`, flexShrink: 0 }}>
            {[
              { id: "fx",      label: "FX / CRYPTO", count: Object.keys(FX_DATA).length },
              { id: "futures", label: "FUTURES",      count: Object.keys(FUTURES_DATA).length },
            ].map(tab => (
              <button key={tab.id} onClick={() => setWatchlistTab(tab.id as "fx" | "futures")} style={{
                flex: 1, padding: "8px 6px", background: "none", border: "none", cursor: "pointer",
                fontFamily: "inherit", fontSize: 10, letterSpacing: 1,
                color: watchlistTab === tab.id ? t.accent : t.textMuted,
                borderBottom: `2px solid ${watchlistTab === tab.id ? t.accent : "transparent"}`,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                transition: "all 0.15s",
              }}>
                {tab.label}
                <span style={{ background: t.badge, color: t.badgeText, fontSize: 9, padding: "1px 5px", borderRadius: 3, fontWeight: 700 }}>{tab.count}</span>
              </button>
            ))}
          </div>

          {/* Scrollable watchlist */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {watchlistTab === "fx" ? (
              <WatchlistSection
                data={Object.fromEntries(Object.keys(FX_DATA).map(k => [k, quotes[k] ?? FX_DATA[k]]))}
                activeSymbol={activeSymbol} onSelect={handleSymbolClick} t={t}
              />
            ) : (
              <WatchlistSection
                data={Object.fromEntries(Object.keys(FUTURES_DATA).map(k => [k, quotes[k] ?? FUTURES_DATA[k]]))}
                activeSymbol={activeSymbol} onSelect={handleSymbolClick} t={t}
              />
            )}
          </div>

          {/* Session Status — real-time from UTC clock */}
          <div style={{ padding: 12, borderTop: `1px solid ${t.border}`, flexShrink: 0 }}>
            <div style={{ fontSize: 10, letterSpacing: 2, color: t.textMuted, marginBottom: 8 }}>SESSION STATUS</div>
            {SESSIONS.map(s => {
              const open = isSessionOpen(s.start, s.end, utcHour);
              return (
                <div key={s.name} style={{ display: "flex", justifyContent: "space-between", fontSize: 10, marginBottom: 3 }}>
                  <span style={{ color: t.textSub }}>{s.name}</span>
                  <span style={{ color: open ? t.up : t.textMuted }}>● {open ? "OPEN" : "CLOSED"}</span>
                </div>
              );
            })}
            {/* Active session from intel */}
            <div style={{ marginTop: 6, paddingTop: 6, borderTop: `1px solid ${t.borderSub ?? t.border}`, fontSize: 10 }}>
              <span style={{ color: t.textMuted }}>ACTIVE: </span>
              <span style={{
                color: sessionIntel.session === "LONDON" ? "#a78bfa" :
                       sessionIntel.session === "NY"     ? "#fb923c" :
                       sessionIntel.session === "ASIAN"  ? "#60a5fa" : t.textMuted,
                fontWeight: 700,
              }}>
                {sessionIntel.session}
              </span>
              {sessionIntel.session !== "CLOSED" && (
                <span style={{ color: t.textMuted, marginLeft: 4 }}>
                  {Math.floor(sessionIntel.timeInSession / 60)}h{sessionIntel.timeInSession % 60}m
                </span>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div style={{ overflow: "hidden", display: "flex", flexDirection: "column" }}>

          {/* CHART HEADER */}
          <div style={{ padding: "8px 16px 0", borderBottom: `1px solid ${t.border}`, flexShrink: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <div style={{ display: "flex", gap: 12, alignItems: "baseline" }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: t.accent, letterSpacing: 0.5 }}>{activeSymbol}</span>
                {isFutures && (
                  <span style={{ fontSize: 9, background: t.badge, color: t.badgeText, padding: "2px 6px", borderRadius: 3, letterSpacing: 1, fontWeight: 700 }}>
                    FUTURES · {sym.expiry}
                  </span>
                )}
                <span style={{ fontSize: 19, fontWeight: 700, color: t.textStrong }}>{sym.ask}</span>
                <span style={{ fontSize: 12, color: sym.up ? t.up : t.down }}>
                  {sym.up ? "▲" : "▼"} {sym.change} ({sym.changePct})
                </span>
              </div>
              <div style={{ display: "flex", gap: 5 }}>
                {TIMEFRAMES.map(tf => (
                  <button key={tf} onClick={() => setActiveTF(tf)} style={{
                    background: tf === activeTF ? t.bgActiveTF : "none",
                    border: `1px solid ${tf === activeTF ? t.accentBlue : "transparent"}`,
                    color: tf === activeTF ? t.accentBlue : t.textMuted,
                    cursor: "pointer", padding: "2px 7px", borderRadius: 3,
                    fontSize: 10, fontFamily: "inherit", letterSpacing: 1, transition: "all 0.12s",
                  }}>{tf}</button>
                ))}
              </div>
            </div>

            <LightweightChart bars={bars} t={t} />

            <div style={{ display: "flex", gap: 16, padding: "4px 0 8px", fontSize: 10, color: t.textMuted }}>
              <span>O <span style={{ color: t.text }}>{sym.O}</span></span>
              <span>H <span style={{ color: t.up }}>{sym.H}</span></span>
              <span>L <span style={{ color: t.down }}>{sym.L}</span></span>
              <span>C <span style={{ color: t.text }}>{sym.C}</span></span>
              <span>VOL <span style={{ color: t.text }}>{sym.volume}</span></span>
              {isFutures && <span style={{ color: t.accentBlue }}>EXP {sym.expiry}</span>}
            </div>
          </div>

          {/* FUTURES STRIP */}
          <FuturesStrip t={t} onSelect={handleSymbolClick} activeSymbol={activeSymbol} />

          {/* PANEL CONTENT */}
          {activePanel === "news" ? (
            <div style={{ flex: 1, overflow: "auto" }}>
              <div style={{ padding: "8px 16px", fontSize: 10, letterSpacing: 2, color: t.textMuted, borderBottom: `1px solid ${t.border}` }}>MARKET NEWS FEED — {isLive ? "LIVE" : "DEMO"}</div>
              {news.map((n, i) => (
                <div key={i}
                  style={{ display: "flex", gap: 12, padding: "10px 16px", borderBottom: `1px solid ${t.borderSub ?? t.border}`, cursor: "pointer", transition: "background 0.12s" }}
                  onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = t.bgHover}
                  onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = "transparent"}>
                  <span style={{ color: t.textMuted, fontSize: 11, minWidth: 36 }}>{n.time}</span>
                  <span style={{ color: t.accent, fontSize: 10, fontWeight: 700, minWidth: 36, letterSpacing: 1 }}>{n.source}</span>
                  {n.hot && <span style={{ color: t.down, fontSize: 10 }}>●</span>}
                  <span style={{ fontSize: 12, color: t.text, lineHeight: 1.4 }}>{n.headline}</span>
                </div>
              ))}
            </div>
          ) : activePanel === "intel" ? (
            <IntelPanel
              t={t}
              intel={sessionIntel}
              bars={bars}
              symbol={activeSymbol}
              quote={sym}
            />
          ) : (
            <AITerminal
              t={t}
              activeSymbol={activeSymbol}
              activeTF={activeTF}
              isFutures={isFutures}
              availableProviders={availableProviders}
            />
          )}
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600;700&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width:4px; height:4px; }
        ::-webkit-scrollbar-track { background:${t.scrollTrack}; }
        ::-webkit-scrollbar-thumb { background:${t.scrollThumb}; border-radius:2px; }
        @keyframes pulse {
          0%,100% { opacity:0.6; transform:scale(0.9); }
          50%      { opacity:1;   transform:scale(1.1); }
        }
        input::placeholder { color:${t.textMuted}; opacity:1; }
      `}</style>
    </div>
  );
}
