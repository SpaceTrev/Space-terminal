"use client";

import { useState, useEffect } from "react";
import type { Theme } from "@/lib/themes";

interface Agent {
  role: string;
  status: "idle" | "running" | "completed";
  current_task?: string;
}

interface TaskRecord {
  id: string;
  role: string;
  prompt: string;
  status: string;
  created_at: string;
  completed_at?: string;
}

const AGENT_ROLES = ["research", "context", "architect", "engineer", "quant", "content"];

const ROLE_ICONS: Record<string, string> = {
  research: "\u25C8",
  context: "\u25CE",
  architect: "\u25C7",
  engineer: "\u2699",
  quant: "\u25B3",
  content: "\u25A1",
};

export function AgentsPanel({ t }: { t: Theme }) {
  const [agents, setAgents] = useState<Agent[]>(
    AGENT_ROLES.map((r) => ({ role: r, status: "idle" }))
  );
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [dispatchRole, setDispatchRole] = useState(AGENT_ROLES[0]);
  const [dispatchPrompt, setDispatchPrompt] = useState("");
  const [dispatching, setDispatching] = useState(false);

  const fetchAgents = () => {
    setLoading(true);
    fetch("/api/agents")
      .then((r) => r.json())
      .then((d) => {
        if (d.agents) setAgents(d.agents);
        if (d.tasks) setTasks(d.tasks);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  const handleDispatch = () => {
    if (!dispatchPrompt.trim()) return;
    setDispatching(true);
    fetch("/api/agents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: dispatchRole, prompt: dispatchPrompt }),
    })
      .then(() => {
        setDispatchPrompt("");
        setShowForm(false);
        fetchAgents();
      })
      .catch(() => {})
      .finally(() => setDispatching(false));
  };

  const statusColor = (status: string) => {
    if (status === "running") return t.accent;
    if (status === "completed") return t.up;
    return t.textMuted;
  };

  const statusDot = (status: string) => (
    <span
      style={{
        width: 6,
        height: 6,
        borderRadius: "50%",
        background: statusColor(status),
        display: "inline-block",
        boxShadow: status === "running" ? `0 0 6px ${t.accent}` : "none",
      }}
    />
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", borderBottom: `1px solid ${t.border}` }}>
        <span style={{ fontSize: 10, letterSpacing: 2, color: t.textMuted }}>AGENT SWARM</span>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            background: t.accent,
            color: t.bg,
            border: "none",
            padding: "5px 14px",
            fontSize: 10,
            fontFamily: "inherit",
            fontWeight: 700,
            letterSpacing: 1,
            borderRadius: 3,
            cursor: "pointer",
          }}
        >
          {showForm ? "CANCEL" : "DISPATCH TASK"}
        </button>
      </div>

      {/* Dispatch Form */}
      {showForm && (
        <div style={{ padding: 16, borderBottom: `1px solid ${t.border}`, background: t.bgCard }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <select
              value={dispatchRole}
              onChange={(e) => setDispatchRole(e.target.value)}
              style={{
                background: t.bgInput,
                border: `1px solid ${t.border}`,
                color: t.text,
                fontSize: 10,
                fontFamily: "inherit",
                padding: "5px 10px",
                borderRadius: 3,
              }}
            >
              {AGENT_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
          <textarea
            value={dispatchPrompt}
            onChange={(e) => setDispatchPrompt(e.target.value)}
            placeholder="Describe the task for this agent..."
            style={{
              width: "100%",
              minHeight: 50,
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
          <button
            onClick={handleDispatch}
            disabled={!dispatchPrompt.trim() || dispatching}
            style={{
              marginTop: 8,
              background: dispatchPrompt.trim() ? t.accentBlue : t.bgCard,
              color: dispatchPrompt.trim() ? t.bg : t.textMuted,
              border: "none",
              padding: "5px 16px",
              fontSize: 10,
              fontFamily: "inherit",
              fontWeight: 700,
              letterSpacing: 1,
              borderRadius: 3,
              cursor: dispatchPrompt.trim() ? "pointer" : "not-allowed",
            }}
          >
            {dispatching ? "DISPATCHING..." : "SEND"}
          </button>
        </div>
      )}

      {/* Agent Grid */}
      <div style={{ padding: 16, flexShrink: 0 }}>
        {loading ? (
          <div style={{ textAlign: "center", color: t.textMuted, fontSize: 11, padding: 16 }}>Loading...</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
            {agents.map((agent) => (
              <div
                key={agent.role}
                style={{
                  background: t.bgCard,
                  border: `1px solid ${agent.status === "running" ? t.accent : t.border}`,
                  borderRadius: 4,
                  padding: 12,
                  transition: "border-color 0.2s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: t.textStrong, letterSpacing: 0.5 }}>
                    {ROLE_ICONS[agent.role] ?? "\u25CB"} {agent.role.toUpperCase()}
                  </span>
                  {statusDot(agent.status)}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}>
                  <span style={{ fontSize: 9, color: statusColor(agent.status), letterSpacing: 1, textTransform: "uppercase" }}>
                    {agent.status}
                  </span>
                </div>
                {agent.current_task && (
                  <div style={{ fontSize: 10, color: t.textSub, lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {agent.current_task}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Task History */}
      <div style={{ flex: 1, overflowY: "auto", borderTop: `1px solid ${t.border}` }}>
        <div style={{ padding: "8px 16px", fontSize: 9, letterSpacing: 2, color: t.textMuted, borderBottom: `1px solid ${t.border}` }}>
          TASK HISTORY ({tasks.length})
        </div>
        {tasks.length === 0 ? (
          <div style={{ padding: 24, textAlign: "center", color: t.textMuted, fontSize: 11 }}>No tasks dispatched yet</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${t.border}` }}>
                {["ROLE", "PROMPT", "STATUS", "CREATED", "COMPLETED"].map((h) => (
                  <th key={h} style={{ padding: "8px 10px", textAlign: "left", fontSize: 9, letterSpacing: 1, color: t.textMuted, fontWeight: 400 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr
                  key={task.id}
                  style={{ borderBottom: `1px solid ${t.borderSub}` }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLTableRowElement).style.background = t.bgHover)}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLTableRowElement).style.background = "transparent")}
                >
                  <td style={{ padding: "7px 10px", color: t.accentBlue, fontWeight: 600, textTransform: "uppercase", fontSize: 10 }}>{task.role}</td>
                  <td style={{ padding: "7px 10px", color: t.text, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{task.prompt}</td>
                  <td style={{ padding: "7px 10px" }}>
                    <span style={{ color: statusColor(task.status), fontSize: 9, letterSpacing: 1 }}>{task.status.toUpperCase()}</span>
                  </td>
                  <td style={{ padding: "7px 10px", color: t.textMuted, fontSize: 10 }}>{task.created_at}</td>
                  <td style={{ padding: "7px 10px", color: t.textMuted, fontSize: 10 }}>{task.completed_at ?? "\u2014"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
