"use client";

import { useState, useEffect } from "react";
import type { Theme } from "@/lib/themes";

interface SummaryData {
  total_signals: number;
  avg_score: number;
  active: number;
  pending: number;
}

interface BreakdownRow {
  key: string;
  count: number;
  avg_score: number;
  win_rate: number;
  avg_r: number;
}

const DIMENSIONS = ["setup_type", "instrument", "session", "score_bucket"] as const;
type Dimension = (typeof DIMENSIONS)[number];

const DIMENSION_LABELS: Record<Dimension, string> = {
  setup_type: "BY SETUP",
  instrument: "BY INSTRUMENT",
  session: "BY SESSION",
  score_bucket: "BY SCORE BUCKET",
};

export function AnalyticsPanel({ t }: { t: Theme }) {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [breakdowns, setBreakdowns] = useState<Record<Dimension, BreakdownRow[]>>(
    { setup_type: [], instrument: [], session: [], score_bucket: [] }
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/analytics/summary").then((r) => r.json()),
      ...DIMENSIONS.map((d) =>
        fetch(`/api/analytics/breakdown?dimension=${d}`).then((r) => r.json())
      ),
    ])
      .then(([summaryData, ...breakdownData]) => {
        setSummary(summaryData.summary ?? summaryData ?? null);
        const bd: Record<string, BreakdownRow[]> = {};
        DIMENSIONS.forEach((d, i) => {
          bd[d] = breakdownData[i].breakdown ?? breakdownData[i] ?? [];
        });
        setBreakdowns(bd as Record<Dimension, BreakdownRow[]>);
      })
      .catch(() => {
        setSummary(null);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div style={{ padding: 24, textAlign: "center", color: t.textMuted, fontSize: 11 }}>Loading...</div>;
  }

  const summaryCards = summary
    ? [
        { label: "TOTAL SIGNALS", value: summary.total_signals, color: t.textStrong },
        { label: "AVG SCORE", value: summary.avg_score.toFixed(1), color: t.accentBlue },
        { label: "ACTIVE", value: summary.active, color: t.up },
        { label: "PENDING", value: summary.pending, color: t.accent },
      ]
    : [];

  const renderBreakdownTable = (dim: Dimension) => {
    const rows = breakdowns[dim];
    const maxCount = Math.max(...rows.map((r) => r.count), 1);

    return (
      <div
        style={{
          background: t.bgCard,
          border: `1px solid ${t.border}`,
          borderRadius: 4,
          overflow: "hidden",
        }}
      >
        <div style={{ padding: "8px 12px", borderBottom: `1px solid ${t.border}`, fontSize: 9, letterSpacing: 2, color: t.textMuted }}>
          {DIMENSION_LABELS[dim]}
        </div>
        {rows.length === 0 ? (
          <div style={{ padding: 16, textAlign: "center", color: t.textMuted, fontSize: 10 }}>No data</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${t.borderSub}` }}>
                {["KEY", "COUNT", "AVG SCORE", "WIN RATE", "AVG R"].map((h) => (
                  <th key={h} style={{ padding: "6px 8px", textAlign: "left", fontSize: 8, letterSpacing: 1, color: t.textMuted, fontWeight: 400 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.key} style={{ borderBottom: `1px solid ${t.borderSub}` }}>
                  <td style={{ padding: "6px 8px", color: t.textStrong, fontWeight: 600 }}>{row.key}</td>
                  <td style={{ padding: "6px 8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 50, height: 4, background: t.border, borderRadius: 2, overflow: "hidden", flexShrink: 0 }}>
                        <div
                          style={{
                            width: `${(row.count / maxCount) * 100}%`,
                            height: "100%",
                            background: t.accentBlue,
                            borderRadius: 2,
                          }}
                        />
                      </div>
                      <span style={{ color: t.text }}>{row.count}</span>
                    </div>
                  </td>
                  <td style={{ padding: "6px 8px", color: t.accentBlue }}>{row.avg_score.toFixed(1)}</td>
                  <td style={{ padding: "6px 8px", color: row.win_rate >= 0.5 ? t.up : t.down }}>{(row.win_rate * 100).toFixed(1)}%</td>
                  <td style={{ padding: "6px 8px", color: row.avg_r >= 0 ? t.up : t.down }}>{row.avg_r.toFixed(2)}R</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflowY: "auto" }}>
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
              <div style={{ fontSize: 15, fontWeight: 700, color: card.color }}>{card.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Breakdown Tables 2x2 Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, padding: "0 16px 16px" }}>
        {DIMENSIONS.map((dim) => (
          <div key={dim}>{renderBreakdownTable(dim)}</div>
        ))}
      </div>
    </div>
  );
}
