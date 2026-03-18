"use client";

import { useState, useEffect } from "react";
import type { Theme } from "@/lib/themes";

interface Signal {
  id: string;
  instrument: string;
  direction: "LONG" | "SHORT";
  setup_type: string;
  score: number;
  session: string;
  status: string;
  created_at: string;
}

export function SignalsPanel({ t }: { t: Theme }) {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [filterInstrument, setFilterInstrument] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterMinScore, setFilterMinScore] = useState("");

  const fetchSignals = () => {
    setLoading(true);
    fetch("/api/signals")
      .then((r) => r.json())
      .then((d) => setSignals(d.signals ?? d ?? []))
      .catch(() => setSignals([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSignals();
  }, []);

  const runScanner = () => {
    setScanning(true);
    fetch("/api/signals/scan", { method: "POST" })
      .then(() => fetchSignals())
      .catch(() => {})
      .finally(() => setScanning(false));
  };

  const scoreColor = (score: number) => {
    if (score >= 8) return t.up;
    if (score >= 6) return t.accentBlue;
    if (score >= 4) return t.accent;
    return t.down;
  };

  const instruments = Array.from(new Set(signals.map((s) => s.instrument)));
  const statuses = Array.from(new Set(signals.map((s) => s.status)));

  const filtered = signals.filter((s) => {
    if (filterInstrument && s.instrument !== filterInstrument) return false;
    if (filterStatus && s.status !== filterStatus) return false;
    if (filterMinScore && s.score < Number(filterMinScore)) return false;
    return true;
  });

  const selectStyle: React.CSSProperties = {
    background: t.bgInput,
    border: `1px solid ${t.border}`,
    color: t.text,
    fontSize: 10,
    fontFamily: "inherit",
    padding: "4px 8px",
    borderRadius: 3,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", borderBottom: `1px solid ${t.border}` }}>
        <span style={{ fontSize: 10, letterSpacing: 2, color: t.textMuted }}>SIGNAL SCANNER</span>
        <button
          onClick={runScanner}
          disabled={scanning}
          style={{
            background: scanning ? t.bgCard : t.accent,
            color: scanning ? t.textMuted : t.bg,
            border: "none",
            padding: "5px 14px",
            fontSize: 10,
            fontFamily: "inherit",
            fontWeight: 700,
            letterSpacing: 1,
            borderRadius: 3,
            cursor: scanning ? "not-allowed" : "pointer",
          }}
        >
          {scanning ? "SCANNING..." : "RUN SCANNER"}
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 8, padding: "8px 16px", borderBottom: `1px solid ${t.border}`, alignItems: "center" }}>
        <span style={{ fontSize: 9, color: t.textMuted, letterSpacing: 1 }}>FILTER:</span>
        <select value={filterInstrument} onChange={(e) => setFilterInstrument(e.target.value)} style={selectStyle}>
          <option value="">All Instruments</option>
          {instruments.map((i) => (
            <option key={i} value={i}>{i}</option>
          ))}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={selectStyle}>
          <option value="">All Status</option>
          {statuses.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <input
          type="number"
          placeholder="Min Score"
          value={filterMinScore}
          onChange={(e) => setFilterMinScore(e.target.value)}
          style={{ ...selectStyle, width: 80 }}
        />
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {loading ? (
          <div style={{ padding: 24, textAlign: "center", color: t.textMuted, fontSize: 11 }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 24, textAlign: "center", color: t.textMuted, fontSize: 11 }}>No signals found</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${t.border}` }}>
                {["INSTRUMENT", "DIR", "SETUP", "SCORE", "SESSION", "STATUS", "TIME"].map((h) => (
                  <th key={h} style={{ padding: "8px 10px", textAlign: "left", fontSize: 9, letterSpacing: 1, color: t.textMuted, fontWeight: 400 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr
                  key={s.id}
                  style={{ borderBottom: `1px solid ${t.borderSub}`, transition: "background 0.12s" }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLTableRowElement).style.background = t.bgHover)}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLTableRowElement).style.background = "transparent")}
                >
                  <td style={{ padding: "7px 10px", color: t.textStrong, fontWeight: 600 }}>{s.instrument}</td>
                  <td style={{ padding: "7px 10px", color: s.direction === "LONG" ? t.up : t.down, fontWeight: 700 }}>{s.direction}</td>
                  <td style={{ padding: "7px 10px", color: t.text }}>{s.setup_type}</td>
                  <td style={{ padding: "7px 10px" }}>
                    <span style={{ color: scoreColor(s.score), fontWeight: 700 }}>{s.score}</span>
                  </td>
                  <td style={{ padding: "7px 10px", color: t.textSub }}>{s.session}</td>
                  <td style={{ padding: "7px 10px" }}>
                    <span style={{ background: t.badge, color: t.badgeText, fontSize: 9, padding: "2px 6px", borderRadius: 3, letterSpacing: 1 }}>
                      {s.status}
                    </span>
                  </td>
                  <td style={{ padding: "7px 10px", color: t.textMuted, fontSize: 10 }}>{s.created_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
