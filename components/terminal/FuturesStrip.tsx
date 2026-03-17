import type { Theme } from "@/lib/themes";

interface Props {
  t: Theme;
  onSelect: (symbol: string) => void;
  activeSymbol: string;
}

const KEY_FUTURES = [
  { sym: "ES1! (S&P 500)",   short: "ES1!", price: "5,609.25", pct: "+0.44%", up: true  },
  { sym: "NQ1! (Nasdaq)",    short: "NQ1!", price: "19,766",   pct: "-0.43%", up: false },
  { sym: "CL1! (Crude Oil)", short: "CL1!", price: "68.34",    pct: "-1.21%", up: false },
  { sym: "GC1! (Gold)",      short: "GC1!", price: "2,933.40", pct: "+0.40%", up: true  },
  { sym: "ZN1! (10Y T-Note)",short: "ZN1!", price: "109.219",  pct: "-0.26%", up: false },
];

export function FuturesStrip({ t, onSelect, activeSymbol }: Props) {
  return (
    <div style={{ display: "flex", gap: 1, borderBottom: `1px solid ${t.border}`, background: t.bgSidebar, flexShrink: 0 }}>
      {KEY_FUTURES.map((f) => {
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
            <div style={{ fontSize: 11, color: t.textStrong, fontWeight: 600 }}>{f.price}</div>
            <div style={{ fontSize: 10, color: f.up ? t.up : t.down }}>{f.pct}</div>
          </div>
        );
      })}
    </div>
  );
}
