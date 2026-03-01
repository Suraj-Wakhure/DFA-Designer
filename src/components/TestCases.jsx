import { useState } from "react";

export default function TestCases({ cases, onSelect }) {
  if (!cases?.length) return null;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(190px,1fr))", gap: 10 }}>
      {cases.map((tc, i) => (
        <TestCard key={i} tc={tc} onSelect={onSelect} />
      ))}
    </div>
  );
}

function TestCard({ tc, onSelect }) {
  const [hovered, setHovered] = useState(false);
  const borderColor = hovered
    ? (tc.accept ? "#10b981" : "#ef4444")
    : (tc.accept ? "#064e3b" : "#1f1b1b");

  return (
    <button
      onClick={() => onSelect(tc.input)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "#0f0f1e",
        border: `1px solid ${borderColor}`,
        borderRadius: 10,
        padding: "10px 14px",
        cursor: "pointer",
        textAlign: "left",
        fontFamily: "'Courier New', monospace",
        transition: "border-color 0.15s",
        display: "flex", flexDirection: "column", gap: 5,
      }}
    >
      <div style={{
        fontSize: 16, fontWeight: 800,
        color: tc.accept ? "#6ee7b7" : "#f87171",
        wordBreak: "break-all",
        letterSpacing: "-0.01em",
      }}>
        {tc.input === "" ? "ε" : tc.input}
      </div>
      <div style={{
        display: "inline-block",
        fontSize: 10, fontWeight: 700,
        color: tc.accept ? "#6ee7b7" : "#f87171",
        background: tc.accept ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.08)",
        borderRadius: 4, padding: "2px 6px",
        textTransform: "uppercase", letterSpacing: "0.06em",
        width: "fit-content",
      }}>
        {tc.accept ? "ACCEPT" : "REJECT"}
      </div>
      <div style={{ fontSize: 11, color: "#374151", lineHeight: 1.5 }}>
        {tc.reason}
      </div>
    </button>
  );
}
