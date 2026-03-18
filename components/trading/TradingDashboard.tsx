"use client";

import { useState } from "react";
import type { Theme } from "@/lib/themes";
import { SignalsPanel } from "./SignalsPanel";
import { GhostTradesPanel } from "./GhostTradesPanel";
import { JournalPanel } from "./JournalPanel";
import { AgentsPanel } from "./AgentsPanel";
import { AnalyticsPanel } from "./AnalyticsPanel";

const TABS = [
  { id: "signals",      label: "SIGNALS",      icon: "\u25C9" },
  { id: "ghost-trades", label: "GHOST TRADES",  icon: "\u25CB" },
  { id: "journal",      label: "JOURNAL",       icon: "\u25A0" },
  { id: "agents",       label: "AGENTS",        icon: "\u2699" },
  { id: "analytics",    label: "ANALYTICS",     icon: "\u25B3" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function TradingDashboard({ t }: { t: Theme }) {
  const [activeTab, setActiveTab] = useState<TabId>("signals");

  const renderPanel = () => {
    switch (activeTab) {
      case "signals":
        return <SignalsPanel t={t} />;
      case "ghost-trades":
        return <GhostTradesPanel t={t} />;
      case "journal":
        return <JournalPanel t={t} />;
      case "agents":
        return <AgentsPanel t={t} />;
      case "analytics":
        return <AnalyticsPanel t={t} />;
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", fontFamily: "'IBM Plex Mono','Courier New',monospace", background: t.bg, color: t.text }}>
      {/* Tab Bar */}
      <div style={{ display: "flex", background: t.bgHeader, borderBottom: `1px solid ${t.border}`, padding: "0 16px", flexShrink: 0 }}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "10px 20px",
              fontSize: 11,
              letterSpacing: 2,
              fontFamily: "inherit",
              color: activeTab === tab.id ? t.accent : t.textMuted,
              borderBottom: `2px solid ${activeTab === tab.id ? t.accent : "transparent"}`,
              transition: "all 0.15s",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Panel Content */}
      <div style={{ flex: 1, overflow: "hidden" }}>
        {renderPanel()}
      </div>
    </div>
  );
}
