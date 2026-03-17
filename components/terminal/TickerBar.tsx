"use client";

import { useState, useEffect, useRef } from "react";
import { TICKER_DATA } from "@/lib/mockData";
import type { Theme } from "@/lib/themes";

interface Props {
  t: Theme;
}

export function TickerBar({ t }: Props) {
  const [offset, setOffset] = useState(0);
  const ref  = useRef<HTMLDivElement>(null);
  const last = useRef(performance.now());

  useEffect(() => {
    let frame: number;
    const animate = (now: number) => {
      const dt = now - last.current; last.current = now;
      setOffset(o => {
        const next = o - dt * 0.055;
        return (ref.current && next < -(ref.current.scrollWidth / 2)) ? 0 : next;
      });
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  const items = [...TICKER_DATA, ...TICKER_DATA];
  return (
    <div style={{ overflow: "hidden", background: t.bg, borderBottom: `1px solid ${t.border}`, height: 28, transition: "background 0.25s" }}>
      <div ref={ref} style={{ display: "flex", transform: `translateX(${offset}px)`, whiteSpace: "nowrap", willChange: "transform" }}>
        {items.map((item, i) => (
          <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "0 16px", fontSize: 11, fontFamily: "'IBM Plex Mono',monospace", borderRight: `1px solid ${t.border}`, height: 28 }}>
            <span style={{ color: t.textSymbol, letterSpacing: 0.5 }}>{item.symbol}</span>
            <span style={{ color: t.textStrong, fontWeight: 600 }}>{item.price}</span>
            <span style={{ color: item.up ? t.up : t.down }}>{item.pct}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
