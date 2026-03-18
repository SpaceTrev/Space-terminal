"use client";

import { useState, useEffect } from "react";
import type { Theme } from "@/lib/themes";

interface JournalEntry {
  id: string;
  note: string;
  emotion: number;
  tags: string[];
  confidence: number;
  rule_adherence: "followed" | "broken" | "na";
  created_at: string;
}

const EMOTIONS = [
  { emoji: "\uD83D\uDE24", value: 1, label: "Frustrated" },
  { emoji: "\uD83D\uDE30", value: 3, label: "Anxious" },
  { emoji: "\uD83D\uDE10", value: 5, label: "Neutral" },
  { emoji: "\uD83D\uDE0A", value: 7, label: "Good" },
  { emoji: "\uD83D\uDD25", value: 9, label: "On Fire" },
];

const TAGS = ["followed-rules", "fomo", "revenge-trade", "oversize", "patience", "discipline"];

export function JournalPanel({ t }: { t: Theme }) {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const [note, setNote] = useState("");
  const [emotion, setEmotion] = useState<number | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [confidence, setConfidence] = useState(5);
  const [ruleAdherence, setRuleAdherence] = useState<"followed" | "broken" | "na">("na");
  const [submitting, setSubmitting] = useState(false);

  const fetchEntries = () => {
    setLoading(true);
    fetch("/api/journal")
      .then((r) => r.json())
      .then((d) => setEntries(d.entries ?? d ?? []))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const handleSubmit = () => {
    if (!note.trim()) return;
    setSubmitting(true);
    fetch("/api/journal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        note,
        emotion: emotion ?? 5,
        tags: selectedTags,
        confidence,
        rule_adherence: ruleAdherence,
      }),
    })
      .then(() => {
        setNote("");
        setEmotion(null);
        setSelectedTags([]);
        setConfidence(5);
        setRuleAdherence("na");
        fetchEntries();
      })
      .catch(() => {})
      .finally(() => setSubmitting(false));
  };

  const emotionEmoji = (val: number) => {
    const e = EMOTIONS.find((em) => em.value === val);
    return e ? e.emoji : "\uD83D\uDE10";
  };

  const adherenceLabel = (val: string) => {
    if (val === "followed") return { icon: "\u2705", label: "FOLLOWED" };
    if (val === "broken") return { icon: "\u274C", label: "BROKEN" };
    return { icon: "\u2014", label: "N/A" };
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* New Entry Form */}
      <div style={{ padding: 16, borderBottom: `1px solid ${t.border}`, flexShrink: 0 }}>
        <div style={{ fontSize: 10, letterSpacing: 2, color: t.textMuted, marginBottom: 10 }}>NEW JOURNAL ENTRY</div>

        {/* Note */}
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="What happened in this trade? How are you feeling?"
          style={{
            width: "100%",
            minHeight: 60,
            background: t.bgInput,
            border: `1px solid ${t.border}`,
            color: t.text,
            fontSize: 11,
            fontFamily: "inherit",
            padding: 10,
            borderRadius: 3,
            resize: "vertical",
            outline: "none",
          }}
        />

        {/* Emotion Picker */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
          <span style={{ fontSize: 9, color: t.textMuted, letterSpacing: 1, marginRight: 4 }}>MOOD:</span>
          {EMOTIONS.map((e) => (
            <button
              key={e.value}
              onClick={() => setEmotion(e.value)}
              title={e.label}
              style={{
                background: emotion === e.value ? t.bgActiveTF : "transparent",
                border: `1px solid ${emotion === e.value ? t.accentBlue : "transparent"}`,
                borderRadius: 4,
                padding: "4px 8px",
                cursor: "pointer",
                fontSize: 16,
                transition: "all 0.12s",
              }}
            >
              {e.emoji}
            </button>
          ))}
        </div>

        {/* Tags */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 8 }}>
          <span style={{ fontSize: 9, color: t.textMuted, letterSpacing: 1, marginRight: 4, lineHeight: "24px" }}>TAGS:</span>
          {TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              style={{
                background: selectedTags.includes(tag) ? t.badge : "transparent",
                color: selectedTags.includes(tag) ? t.badgeText : t.textMuted,
                border: `1px solid ${selectedTags.includes(tag) ? t.accentBlue : t.border}`,
                borderRadius: 3,
                padding: "3px 8px",
                fontSize: 9,
                fontFamily: "inherit",
                letterSpacing: 0.5,
                cursor: "pointer",
                transition: "all 0.12s",
              }}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Confidence + Rule Adherence */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 9, color: t.textMuted, letterSpacing: 1 }}>CONFIDENCE:</span>
            <input
              type="range"
              min={1}
              max={10}
              value={confidence}
              onChange={(e) => setConfidence(Number(e.target.value))}
              style={{ width: 80, accentColor: t.accentBlue }}
            />
            <span style={{ fontSize: 11, color: t.accentBlue, fontWeight: 700, minWidth: 16, textAlign: "center" }}>{confidence}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ fontSize: 9, color: t.textMuted, letterSpacing: 1 }}>RULES:</span>
            {(["followed", "broken", "na"] as const).map((val) => {
              const a = adherenceLabel(val);
              return (
                <button
                  key={val}
                  onClick={() => setRuleAdherence(val)}
                  style={{
                    background: ruleAdherence === val ? t.bgActiveTF : "transparent",
                    border: `1px solid ${ruleAdherence === val ? t.accentBlue : "transparent"}`,
                    borderRadius: 3,
                    padding: "3px 8px",
                    fontSize: 10,
                    fontFamily: "inherit",
                    cursor: "pointer",
                    color: t.text,
                    transition: "all 0.12s",
                  }}
                >
                  {a.icon} {a.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!note.trim() || submitting}
          style={{
            marginTop: 10,
            background: note.trim() ? t.accent : t.bgCard,
            color: note.trim() ? t.bg : t.textMuted,
            border: "none",
            padding: "6px 20px",
            fontSize: 10,
            fontFamily: "inherit",
            fontWeight: 700,
            letterSpacing: 1,
            borderRadius: 3,
            cursor: note.trim() ? "pointer" : "not-allowed",
          }}
        >
          {submitting ? "SAVING..." : "SAVE ENTRY"}
        </button>
      </div>

      {/* Entries Feed */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        <div style={{ padding: "8px 16px", fontSize: 9, letterSpacing: 2, color: t.textMuted, borderBottom: `1px solid ${t.border}` }}>
          JOURNAL ENTRIES ({entries.length})
        </div>
        {loading ? (
          <div style={{ padding: 24, textAlign: "center", color: t.textMuted, fontSize: 11 }}>Loading...</div>
        ) : entries.length === 0 ? (
          <div style={{ padding: 24, textAlign: "center", color: t.textMuted, fontSize: 11 }}>No journal entries yet</div>
        ) : (
          entries.map((entry) => (
            <div
              key={entry.id}
              style={{
                padding: "12px 16px",
                borderBottom: `1px solid ${t.borderSub}`,
                transition: "background 0.12s",
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.background = t.bgHover)}
              onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.background = "transparent")}
            >
              {/* Top row: date + emotion + adherence */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <span style={{ fontSize: 10, color: t.textMuted }}>{entry.created_at}</span>
                <span style={{ fontSize: 16 }}>{emotionEmoji(entry.emotion)}</span>
                <span style={{ fontSize: 9, color: entry.rule_adherence === "followed" ? t.up : entry.rule_adherence === "broken" ? t.down : t.textMuted }}>
                  {adherenceLabel(entry.rule_adherence).icon} {adherenceLabel(entry.rule_adherence).label}
                </span>
              </div>

              {/* Note */}
              <div style={{ fontSize: 11, color: t.text, lineHeight: 1.5, marginBottom: 6 }}>{entry.note}</div>

              {/* Tags + Confidence */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                {entry.tags.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      background: t.badge,
                      color: t.badgeText,
                      fontSize: 8,
                      padding: "2px 6px",
                      borderRadius: 3,
                      letterSpacing: 0.5,
                    }}
                  >
                    {tag}
                  </span>
                ))}
                <div style={{ display: "flex", alignItems: "center", gap: 4, marginLeft: "auto" }}>
                  <span style={{ fontSize: 9, color: t.textMuted }}>CONF:</span>
                  <div style={{ width: 50, height: 4, background: t.border, borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ width: `${entry.confidence * 10}%`, height: "100%", background: t.accentBlue, borderRadius: 2 }} />
                  </div>
                  <span style={{ fontSize: 9, color: t.accentBlue, fontWeight: 700 }}>{entry.confidence}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
