"use client";

import { useState, useEffect } from "react";
import { THEMES } from "@/lib/themes";
import type { ThemeKey } from "@/lib/themes";
import { FX_DATA, FUTURES_DATA, MOCK_NEWS } from "@/lib/mockData";
import { TickerBar } from "./TickerBar";
import { WatchlistSection } from "./WatchlistSection";
import { FuturesStrip } from "./FuturesStrip";
import { CandleChart } from "./CandleChart";
import { AITerminal } from "./AITerminal";
import { useQuotes } from "@/hooks/useQuotes";
import { useBars } from "@/hooks/useBars";
import type { Provider } from "@/lib/types";

const PANELS = [
  { id: "ai",   label: "AI TERMINAL", icon: "⬡" },
  { id: "news", label: "NEWS",        icon: "◉" },
];
const TIMEFRAMES = ["1M", "5M", "15M", "1H", "4H", "D"];

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

  const t      = THEMES[themeKey];
  const quotes = useQuotes();
  const bars   = useBars(activeSymbol, activeTF);

  const sym      = quotes[activeSymbol] ?? FX_DATA["EUR/USD"];
  const isFutures = sym?.type === "futures";

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const formatTime = (d: Date) => d.toUTCString().slice(17, 25) + " UTC";

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
          <span>SESSION: <span style={{ color: t.up }}>LIVE</span></span>
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

          {/* Session Status */}
          <div style={{ padding: 12, borderTop: `1px solid ${t.border}`, flexShrink: 0 }}>
            <div style={{ fontSize: 10, letterSpacing: 2, color: t.textMuted, marginBottom: 8 }}>SESSION STATUS</div>
            {[
              { name: "CME FUTURES",  open: true  },
              { name: "LONDON FX",    open: true  },
              { name: "NEW YORK FX",  open: true  },
              { name: "TOKYO",        open: false },
            ].map(s => (
              <div key={s.name} style={{ display: "flex", justifyContent: "space-between", fontSize: 10, marginBottom: 3 }}>
                <span style={{ color: t.textSub }}>{s.name}</span>
                <span style={{ color: s.open ? t.up : t.textMuted }}>● {s.open ? "OPEN" : "CLOSED"}</span>
              </div>
            ))}
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

            <CandleChart bars={bars} t={t} />

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

          {/* NEWS */}
          {activePanel === "news" ? (
            <div style={{ flex: 1, overflow: "auto" }}>
              <div style={{ padding: "8px 16px", fontSize: 10, letterSpacing: 2, color: t.textMuted, borderBottom: `1px solid ${t.border}` }}>MARKET NEWS FEED — LIVE</div>
              {MOCK_NEWS.map((n, i) => (
                <div key={i}
                  style={{ display: "flex", gap: 12, padding: "10px 16px", borderBottom: `1px solid ${t.borderSub}`, cursor: "pointer", transition: "background 0.12s" }}
                  onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = t.bgHover}
                  onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = "transparent"}>
                  <span style={{ color: t.textMuted, fontSize: 11, minWidth: 36 }}>{n.time}</span>
                  <span style={{ color: t.accent, fontSize: 10, fontWeight: 700, minWidth: 36, letterSpacing: 1 }}>{n.source}</span>
                  {n.hot && <span style={{ color: t.down, fontSize: 10 }}>●</span>}
                  <span style={{ fontSize: 12, color: t.text, lineHeight: 1.4 }}>{n.headline}</span>
                </div>
              ))}
            </div>
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
          0%,100% { opacity:0.3; transform:scale(0.8); }
          50%      { opacity:1;   transform:scale(1.2); }
        }
        input::placeholder { color:${t.textMuted}; opacity:1; }
      `}</style>
    </div>
  );
}
