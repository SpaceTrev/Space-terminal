"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { Theme } from "@/lib/themes";
import type { ChatMessage, Provider } from "@/lib/types";
import { PROVIDER_LABELS } from "@/lib/aiConfig";

interface Props {
  t: Theme;
  activeSymbol: string;
  activeTF: string;
  isFutures: boolean;
  availableProviders: Provider[];
}

const STORAGE_KEY = "space-terminal-provider";

function renderMarkdown(text: string, accentBlue: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, `<strong style="color:${accentBlue}">$1</strong>`)
    .replace(/\n\n/g, "<br/><br/>")
    .replace(/\n/g, "<br/>");
}

export function AITerminal({ t, activeSymbol, activeTF, isFutures, availableProviders }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([{
    role: "assistant",
    content: "**SPACE TERMINAL ONLINE** — AI-powered market intelligence. Ask me anything: macro analysis, pair correlations, futures term structure, risk-off flows, central bank divergence...",
  }]);
  const [query, setQuery]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [provider, setProvider] = useState<Provider>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY) as Provider | null;
      if (saved && availableProviders.includes(saved)) return saved;
    }
    return availableProviders[0] ?? "gemini";
  });
  const [showProviderMenu, setShowProviderMenu] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const changeProvider = (p: Provider) => {
    setProvider(p);
    localStorage.setItem(STORAGE_KEY, p);
    setShowProviderMenu(false);
  };

  const askAI = useCallback(async () => {
    if (!query.trim() || loading) return;
    const userMsg = query.trim();
    setQuery("");
    setMessages(m => [...m, { role: "user", content: userMsg }]);
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, { role: "user", content: userMsg }], activeSymbol, activeTF, provider }),
      });
      const data = await res.json();
      setMessages(m => [...m, { role: "assistant", content: data.text ?? "No response." }]);
    } catch {
      setMessages(m => [...m, { role: "assistant", content: "Connection error. Terminal reconnecting..." }]);
    } finally {
      setLoading(false);
    }
  }, [query, messages, loading, activeSymbol, activeTF, provider]);

  const quickQueries = [
    `${activeSymbol} outlook this week`,
    `${activeSymbol} key levels`,
    isFutures ? "ES1! vs SPY divergence" : "DXY impact on majors",
    "Risk-off signals today",
    "Rates vs equities correlation",
  ];

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ flex: 1, overflow: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <div style={{
              minWidth: 28, height: 28, borderRadius: "50%",
              background: m.role === "user" ? t.bgUserBubble : t.bgAIBubble,
              border: `1px solid ${m.role === "user" ? t.accentBlue : t.accent}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 10, color: m.role === "user" ? t.accentBlue : t.accent, flexShrink: 0,
            }}>
              {m.role === "user" ? "U" : "AI"}
            </div>
            <div style={{
              fontSize: 12, lineHeight: 1.7,
              color: m.role === "user" ? t.accentBlue : t.text,
              background: m.role === "user" ? t.bgUserBubble : "transparent",
              padding: m.role === "user" ? "8px 12px" : 0,
              border: m.role === "user" ? `1px solid ${t.border}` : "none",
              borderRadius: 4, flex: 1,
            }} dangerouslySetInnerHTML={{ __html: renderMarkdown(m.content, t.accentBlue) }} />
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <div style={{ minWidth: 28, height: 28, borderRadius: "50%", background: t.bgAIBubble, border: `1px solid ${t.accent}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: t.accent }}>AI</div>
            <div style={{ display: "flex", gap: 4, padding: "10px 0", alignItems: "center" }}>
              {[0, 1, 2].map(d => (
                <div key={d} style={{ width: 6, height: 6, borderRadius: "50%", background: t.accent, animation: "pulse 1.2s ease-in-out infinite", animationDelay: `${d * 0.2}s`, opacity: 0.7 }} />
              ))}
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Quick queries */}
      <div style={{ padding: "8px 16px", display: "flex", gap: 6, flexWrap: "wrap", borderTop: `1px solid ${t.border}` }}>
        {quickQueries.map((q, i) => (
          <button key={i} onClick={() => setQuery(q)} style={{
            background: t.bgCard, border: `1px solid ${t.border}`,
            color: t.textSub, fontSize: 10, padding: "4px 10px",
            borderRadius: 2, cursor: "pointer", fontFamily: "inherit",
            letterSpacing: 0.5, transition: "all 0.15s",
          }}
            onMouseEnter={e => { (e.target as HTMLButtonElement).style.borderColor = t.accent; (e.target as HTMLButtonElement).style.color = t.accent; }}
            onMouseLeave={e => { (e.target as HTMLButtonElement).style.borderColor = t.border; (e.target as HTMLButtonElement).style.color = t.textSub; }}>
            {q}
          </button>
        ))}
      </div>

      {/* Input bar */}
      <div style={{ padding: "12px 16px", background: t.bgSidebar, borderTop: `1px solid ${t.border}`, display: "flex", gap: 10, transition: "background 0.25s", position: "relative" }}>
        {/* Provider selector */}
        <div style={{ position: "relative", flexShrink: 0 }}>
          <button onClick={() => setShowProviderMenu(v => !v)} style={{
            background: t.bgCard, border: `1px solid ${t.border}`, color: t.accentBlue,
            padding: "0 10px", height: "100%", fontSize: 10, fontFamily: "inherit",
            fontWeight: 700, letterSpacing: 1, cursor: "pointer", borderRadius: 3,
            display: "flex", alignItems: "center", gap: 4, whiteSpace: "nowrap",
          }}>
            {PROVIDER_LABELS[provider] ?? provider.toUpperCase()} ▾
          </button>
          {showProviderMenu && (
            <div style={{
              position: "absolute", bottom: "calc(100% + 4px)", left: 0,
              background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 4,
              zIndex: 50, minWidth: 130, boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
            }}>
              {availableProviders.map(p => (
                <div key={p} onClick={() => changeProvider(p)} style={{
                  padding: "8px 12px", fontSize: 10, letterSpacing: 1, cursor: "pointer",
                  color: p === provider ? t.accent : t.textSub, fontWeight: p === provider ? 700 : 400,
                  background: p === provider ? t.activeRow : "transparent", transition: "background 0.1s",
                }}
                  onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = t.bgHover}
                  onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = p === provider ? t.activeRow : "transparent"}>
                  {PROVIDER_LABELS[p]}
                </div>
              ))}
              {availableProviders.length === 0 && (
                <div style={{ padding: "8px 12px", fontSize: 10, color: t.textMuted }}>No providers configured</div>
              )}
            </div>
          )}
        </div>

        {/* Text input */}
        <div style={{ flex: 1, position: "relative" }}>
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: t.accent, fontSize: 12, pointerEvents: "none" }}>⬡</span>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && askAI()}
            placeholder={`Ask about ${activeSymbol}... or any macro / futures question`}
            style={{
              width: "100%", background: t.bgInput, border: `1px solid ${t.border}`,
              color: t.text, padding: "10px 12px 10px 30px",
              fontSize: 12, fontFamily: "inherit", borderRadius: 3,
              outline: "none", boxSizing: "border-box", transition: "border-color 0.15s, background 0.25s",
            }}
            onFocus={e => (e.target as HTMLInputElement).style.borderColor = t.accent}
            onBlur={e  => (e.target as HTMLInputElement).style.borderColor = t.border}
          />
        </div>

        <button onClick={askAI} disabled={loading} style={{
          background: loading ? t.sendDisabled : t.accent, border: "none",
          color: loading ? t.sendDisabledTxt : t.sendBtnText,
          padding: "0 20px", fontSize: 11, fontFamily: "inherit", fontWeight: 700,
          letterSpacing: 2, cursor: loading ? "not-allowed" : "pointer", borderRadius: 3, transition: "all 0.15s",
        }}>
          {loading ? "..." : "SEND ↵"}
        </button>
      </div>
    </div>
  );
}
