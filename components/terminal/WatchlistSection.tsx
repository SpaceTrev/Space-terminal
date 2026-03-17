import { MiniSparkline } from "./MiniSparkline";
import type { Quote } from "@/lib/types";
import type { Theme } from "@/lib/themes";

interface Props {
  data: Record<string, Quote>;
  activeSymbol: string;
  onSelect: (symbol: string) => void;
  t: Theme;
}

export function WatchlistSection({ data, activeSymbol, onSelect, t }: Props) {
  return (
    <>
      {Object.entries(data).map(([symbol, p]) => {
        const isActive = symbol === activeSymbol;
        return (
          <div key={symbol}
            onClick={() => onSelect(symbol)}
            style={{
              padding: "9px 12px",
              borderBottom: `1px solid ${t.borderSub}`,
              cursor: "pointer",
              background: isActive ? t.activeRow : "transparent",
              borderLeft: `3px solid ${isActive ? t.accent : "transparent"}`,
              transition: "background 0.12s",
            }}
            onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLDivElement).style.background = t.bgHover; }}
            onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: isActive ? t.accent : t.textStrong, letterSpacing: 0.5 }}>{symbol}</span>
              <span style={{ fontSize: 11, color: p.up ? t.up : t.down }}>{p.changePct}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 10, color: t.textMuted }}>B <span style={{ color: t.text }}>{p.bid}</span></div>
                <div style={{ fontSize: 10, color: t.textMuted }}>A <span style={{ color: t.text }}>{p.ask}</span></div>
              </div>
              <MiniSparkline data={p.sparkline ?? [0]} up={p.up} t={t} />
            </div>
            {p.expiry ? (
              <div style={{ fontSize: 9, color: t.textMuted, marginTop: 3 }}>
                EXP <span style={{ color: t.accentBlue }}>{p.expiry}</span>
                <span style={{ marginLeft: 8 }}>SPD {p.spread}</span>
              </div>
            ) : (
              <div style={{ fontSize: 9, color: t.textMuted, marginTop: 3 }}>SPD {p.spread}</div>
            )}
          </div>
        );
      })}
    </>
  );
}
