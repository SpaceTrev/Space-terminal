"use client";

import { useState } from "react";
import { THEMES } from "@/lib/themes";
import type { ThemeKey } from "@/lib/themes";
import type { Provider } from "@/lib/types";
import BloombergDashboard from "@/components/terminal/BloombergDashboard";
import { TradingDashboard } from "@/components/trading/TradingDashboard";

const VIEWS = [
  { id: "terminal", label: "TERMINAL", icon: "◆" },
  { id: "trading",  label: "TRADING",  icon: "◇" },
] as const;

interface Props {
  availableProviders: Provider[];
}

export function AppShell({ availableProviders }: Props) {
  const [view, setView] = useState<"terminal" | "trading">("terminal");
  const [themeKey] = useState<ThemeKey>("dark");
  const t = THEMES[themeKey];

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: t.bg }}>
      {/* Top-level view switcher */}
      <div style={{
        display: "flex", alignItems: "center", gap: 0,
        background: t.bgHeader, borderBottom: `1px solid ${t.border}`,
        padding: "0 16px", flexShrink: 0,
      }}>
        {VIEWS.map(v => (
          <button key={v.id} onClick={() => setView(v.id)} style={{
            background: "none", border: "none", cursor: "pointer",
            padding: "8px 20px", fontSize: 11, letterSpacing: 2,
            fontFamily: "'IBM Plex Mono', monospace",
            color: view === v.id ? t.accent : t.textMuted,
            borderBottom: `2px solid ${view === v.id ? t.accent : "transparent"}`,
            transition: "all 0.15s", display: "flex", alignItems: "center", gap: 6,
          }}>
            {v.icon} {v.label}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 10, color: t.textMuted, letterSpacing: 1 }}>SPACE TERMINAL v2</span>
      </div>

      {/* View content */}
      <div style={{ flex: 1, overflow: "hidden" }}>
        {view === "terminal" ? (
          <BloombergDashboard availableProviders={availableProviders} />
        ) : (
          <TradingDashboard t={t} />
        )}
      </div>
    </div>
  );
}
