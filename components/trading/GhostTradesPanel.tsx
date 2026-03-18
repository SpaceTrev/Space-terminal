"use client";

import { useState, useEffect } from "react";
import type { Theme } from "@/lib/themes";

interface GhostTrade {
  id: string;
  instrument: string;
  direction: "LONG" | "SHORT";
  outcome: "WIN" | "LOSS" | "BE" | "OPEN";
  r_multiple: number;
  mfe: number;
  mae: number;
  entry: number;
  exit?: number;
  created_at: string;
}

interface Summary {
  total: number;
  fill_rate: number;
  win_rate: number;
  expectancy: number;
  median_r: number;
}

interface LeaderboardRow {
  key: string;
  trades: number;
  win_rate: number;
  avg_r: number;
  expectancy: number;
}

export function GhostTradesPanel({ t }: { t: Theme }) {
  const [subTab, setSubTab] = useState<"trades" | "leaderboard">("trades");

  // Ghost Trades state
  const [trades, setTrades] = useState<GhostTrade[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loadingTrades, setLoadingTrades] = useState(true);

  // Leaderboard state
  const [lbView, setLbView] = useState<"strategies" | "symbols" | "checklist">("strategies");
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
  const [loadingLb, setLoadingLb] = useState(false);

  useEffect(() => {
    setLoadingTrades(true);
    Promise.all([
      fetch("/api/ghost-trades").then((r) => r.json()),
      fetch("/api/ghost-trades/summary").then((r) => r.json()),
    ])
      .then(([tradesData, summaryData]) => {
        setTrades(tradesData.trades ?? tradesData ?? []);
        setSummary(summaryData.summary ?? summaryData ?? null);
      })
      .catch(() => {
        setTrades([]);
        setSummary(null);
      })
      .finally(() => setLoadingTrades(false));
  }, []);

  useEffect(() => {
    if (subTab !== "leaderboard") return;
    setLoadingLb(true);
    fetch(`/api/ghost-trades/leaderboard?view=${lbView}`)
      .then((r) => r.json())
      .then((d) => setLeaderboard(d.rankings ?? d ?? []))
      .catch(() => setLeaderboard([]))
      .finally(() => setLoadingLb(false));
  }, [subTab, lbView]);

  const outcomeColor = (outcome: string) => {
    if (outcome === "WIN") return t.up;
    if (outcome === "LOSS") return t.down;
    if (outcome === "BE") return t.textMuted;
    return t.accentBlue;
  };

  const summaryCards = summary
    ? [
        { label: "TOTAL", value: summary.total },
        { label: "FILL RATE", value: `${(summary.fill_rate * 100).toFixed(1)}%` },
        { label: "WIN RATE", value: `${(summary.win_rate * 100).toFixed(1)}%`, color: summary.win_rate >= 0.5 ? t.up : t.down },
        { label: "EXPECTANCY", value: summary.expectancy.toFixed(2), color: summary.expectancy >= 0 ? t.up : t.down },
        { label: "MEDIAN R", value: summary.median_r.toFixed(2), color: summary.median_r >= 0 ? t.up : t.down },
      ]
    : [];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Sub-tabs */}
      <div style={{ display: "flex", borderBottom: `1px solid ${t.border}`, flexShrink: 0 }}>
        {(["trades", "leaderboard"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setSubTab(tab)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "10px 20px",
              fontSize: 10,
              letterSpacing: 2,
              fontFamily: "inherit",
              color: subTab === tab ? t.accent : t.textMuted,
              borderBottom: `2px solid ${subTab === tab ? t.accent : "transparent"}`,
              transition: "all 0.15s",
            }}
          >
            {tab === "trades" ? "GHOST TRADES" : "LEADERBOARD"}
          </button>
        ))}
      </div>

      {subTab === "trades" ? (
        <div style={{ flex: 1, overflowY: "auto" }}>
          {loadingTrades ? (
            <div style={{ padding: 24, textAlign: "center", color: t.textMuted, fontSize: 11 }}>Loading...</div>
          ) : (
            <>
              {/* Summary Cards */}
              {summary && (
                <div style={{ display: "flex", gap: 8, padding: 16 }}>
                  {summaryCards.map((card) => (
                    <div
                      key={card.label}
                      style={{
                        flex: 1,
                        background: t.bgCard,
                        border: `1px solid ${t.border}`,
                        borderRadius: 4,
                        padding: "10px 12px",
                        textAlign: "center",
                      }}
                    >
                      <div style={{ fontSize: 9, color: t.textMuted, letterSpacing: 1, marginBottom: 4 }}>{card.label}</div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: (card as { color?: string }).color ?? t.textStrong }}>{card.value}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Trades Table */}
              {trades.length === 0 ? (
                <div style={{ padding: 24, textAlign: "center", color: t.textMuted, fontSize: 11 }}>No ghost trades yet</div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${t.border}` }}>
                      {["INSTRUMENT", "DIR", "OUTCOME", "R-MULT", "MFE", "MAE", "ENTRY", "EXIT", "TIME"].map((h) => (
                        <th key={h} style={{ padding: "8px 10px", textAlign: "left", fontSize: 9, letterSpacing: 1, color: t.textMuted, fontWeight: 400 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {trades.map((tr) => (
                      <tr
                        key={tr.id}
                        style={{ borderBottom: `1px solid ${t.borderSub}`, transition: "background 0.12s" }}
                        onMouseEnter={(e) => ((e.currentTarget as HTMLTableRowElement).style.background = t.bgHover)}
                        onMouseLeave={(e) => ((e.currentTarget as HTMLTableRowElement).style.background = "transparent")}
                      >
                        <td style={{ padding: "7px 10px", color: t.textStrong, fontWeight: 600 }}>{tr.instrument}</td>
                        <td style={{ padding: "7px 10px", color: tr.direction === "LONG" ? t.up : t.down, fontWeight: 700 }}>{tr.direction}</td>
                        <td style={{ padding: "7px 10px" }}>
                          <span style={{ color: outcomeColor(tr.outcome), fontWeight: 700 }}>{tr.outcome}</span>
                        </td>
                        <td style={{ padding: "7px 10px", color: tr.r_multiple >= 0 ? t.up : t.down, fontWeight: 600 }}>{tr.r_multiple.toFixed(2)}R</td>
                        <td style={{ padding: "7px 10px", color: t.up, fontSize: 10 }}>{tr.mfe.toFixed(2)}</td>
                        <td style={{ padding: "7px 10px", color: t.down, fontSize: 10 }}>{tr.mae.toFixed(2)}</td>
                        <td style={{ padding: "7px 10px", color: t.text }}>{tr.entry}</td>
                        <td style={{ padding: "7px 10px", color: t.text }}>{tr.exit ?? "\u2014"}</td>
                        <td style={{ padding: "7px 10px", color: t.textMuted, fontSize: 10 }}>{tr.created_at}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: "auto" }}>
          {/* View Toggles */}
          <div style={{ display: "flex", gap: 6, padding: "12px 16px", borderBottom: `1px solid ${t.border}` }}>
            {(["strategies", "symbols", "checklist"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setLbView(v)}
                style={{
                  background: lbView === v ? t.bgActiveTF : "transparent",
                  border: `1px solid ${lbView === v ? t.accentBlue : "transparent"}`,
                  color: lbView === v ? t.accentBlue : t.textMuted,
                  cursor: "pointer",
                  padding: "4px 12px",
                  borderRadius: 3,
                  fontSize: 10,
                  fontFamily: "inherit",
                  letterSpacing: 1,
                  transition: "all 0.12s",
                }}
              >
                {v.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Leaderboard Table */}
          {loadingLb ? (
            <div style={{ padding: 24, textAlign: "center", color: t.textMuted, fontSize: 11 }}>Loading...</div>
          ) : leaderboard.length === 0 ? (
            <div style={{ padding: 24, textAlign: "center", color: t.textMuted, fontSize: 11 }}>No leaderboard data</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${t.border}` }}>
                  {["#", "KEY", "TRADES", "WIN RATE", "AVG R", "EXPECTANCY"].map((h) => (
                    <th key={h} style={{ padding: "8px 10px", textAlign: "left", fontSize: 9, letterSpacing: 1, color: t.textMuted, fontWeight: 400 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((row, i) => (
                  <tr
                    key={row.key}
                    style={{ borderBottom: `1px solid ${t.borderSub}`, transition: "background 0.12s" }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLTableRowElement).style.background = t.bgHover)}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLTableRowElement).style.background = "transparent")}
                  >
                    <td style={{ padding: "7px 10px", color: i < 3 ? t.accent : t.textMuted, fontWeight: 700 }}>{i + 1}</td>
                    <td style={{ padding: "7px 10px", color: t.textStrong, fontWeight: 600 }}>{row.key}</td>
                    <td style={{ padding: "7px 10px", color: t.text }}>{row.trades}</td>
                    <td style={{ padding: "7px 10px", color: row.win_rate >= 0.5 ? t.up : t.down }}>{(row.win_rate * 100).toFixed(1)}%</td>
                    <td style={{ padding: "7px 10px", color: row.avg_r >= 0 ? t.up : t.down }}>{row.avg_r.toFixed(2)}R</td>
                    <td style={{ padding: "7px 10px", color: row.expectancy >= 0 ? t.up : t.down, fontWeight: 600 }}>{row.expectancy.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
