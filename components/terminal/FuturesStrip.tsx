"use client";

import type { Theme } from "@/lib/themes";
import type { Quote } from "@/lib/types";

interface Props {
  t: Theme;
  onSelect: (symbol: string) => void;
  activeSymbol: string;
  quotes: Record<string, Quote>;
}

const KEY_FUTURES = [
  { sym: "ES1! (S&P 500)",    short: "ES1!", fallbackPrice: "5,609.25", fallbackPct: "+0.44%", fallbackUp: true  },
  { sym: "NQ1! (Nasdaq)",     short: "NQ1!", fallbackPrice: "19,766",   fallbackPct: "-0.43%", fallbackUp: false },
  { sym: "CL1! (Crude Oil)",  short: "CL1!", fallbackPrice: "68.34",    fallbackPct: "-1.21%", fallbackUp: false },
  { sym: "GC1! (Gold)",       short: "GC1!", fallbackPrice: "2,933.40", fallbackPct: "+0.40%", fallbackUp: true  },
  { sym: "ZN1! (10Y T-Note)", short: "ZN1!", fallbackPrice: "109.219",  fallbackPct: "-0.26%", fallbackUp: false },
];

export function FuturesStrip({ t, onSelect, activeSymbol, quotes }: Props) {
  return (
    <div style={{ display: "flex", gap: 1, borderBottom: `1px solid ${t.border}`, background: t.bgSidebar, flexShrink: 0 }}>
      {KEY_FUTURES.map((f) => {
        const q = quotes[f.sym];
        const price = q?.ask ?? f.fallbackPrice;
        const pct   = q?.changePct ?? f.fallbackPct;
        const up    = q?.up ?? f.fallbackUp;
        const isActive = activeSymbol === f.sym;

        return (
          <div key={f.short}
            onClick={() => onSelect(f.sym)}
            style={{
              flex: 1, padding: "6px 10px", cursor: "pointer",
              background: isActive ? t.activeRow : t.bgSidebar,
              borderBottom: isActive ? `2px solid ${t.accent}` : "2px solid transparent",
              transition: "all 0.12s",
              borderRight: `1px solid ${t.border}`,
            }}
            onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = t.bgHover}
            onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = isActive ? t.activeRow : t.bgSidebar}
          >
            <div style={{ fontSize: 10, fontWeight: 700, color: isActive ? t.accent : t.textSub, letterSpacing: 0.5 }}>{f.short}</div>
            <div style={{ fontSize: 11, color: t.textStrong, fontWeight: 600 }}>{price}</div>
            <div style={{ fontSize: 10, color: up ? t.up : t.down }}>{pct}</div>
          </div>
        );
      })}
    </div>
  );
}
