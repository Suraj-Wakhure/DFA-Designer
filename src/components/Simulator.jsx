export default function Simulator({
  dfa, testInput, setTestInput,
  simSteps, simIdx, running, speed, setSpeed,
  isDone, accepted, curStateId, curStep,
  onRun, onStep, onReset,
}) {
  const displayInput = testInput === "" ? "ε (empty string)" : testInput;

  return (
    <div>
      {/* Controls row */}
      <div style={styles.controlRow}>
        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={styles.fieldLabel}>Input String</div>
          <input
            value={testInput}
            onChange={(e) => setTestInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onRun()}
            placeholder={`Enter a string over {${dfa.alphabet.join(",")}}`}
            style={styles.input}
          />
        </div>

        <div style={styles.speedWrap}>
          <span style={{ color: "#4b5563", fontSize: 11 }}>Speed</span>
          <input
            type="range" min={150} max={1400} step={50}
            value={speed}
            onChange={(e) => setSpeed(+e.target.value)}
            style={{ width: 80, accentColor: "#6366f1" }}
          />
          <span style={{ color: "#6366f1", minWidth: 40, fontSize: 11 }}>{speed}ms</span>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <Btn onClick={onRun}   bg="#10b981" disabled={running}>▶ Run</Btn>
          <Btn onClick={onStep}  bg="#6366f1" disabled={running || isDone}>Step →</Btn>
          <Btn onClick={onReset} bg="#1e1e35" textColor="#9ca3af">↺ Reset</Btn>
        </div>
      </div>

      {/* Character tape */}
      {testInput.length > 0 && (
        <div style={styles.tape}>
          <span style={styles.tapeLabel}>INPUT</span>
          {testInput.split("").map((ch, i) => {
            const done   = simIdx >= 0 && i < simIdx;
            const active = simIdx >= 0 && i === simIdx - 1;
            return (
              <span key={i} style={{
                ...styles.tapeChar,
                background: active ? "#1e1b4b" : done ? "#0e1117" : "#13131f",
                border: `1.5px solid ${active ? "#6366f1" : done ? "#1a2a1a" : "#1e1e35"}`,
                color: active ? "#a5b4fc" : done ? "#2d3748" : "#e2e2f0",
              }}>
                {ch}
              </span>
            );
          })}
        </div>
      )}

      {/* Path trace */}
      <div style={styles.pathBox}>
        {simIdx < 0 ? (
          <span style={{ color: "#1e1e35", fontSize: 12 }}>trace will appear here…</span>
        ) : (
          simSteps.slice(0, simIdx + 1).map((step, i) => {
            const isLast = i === simIdx;
            const stateObj = dfa.states.find((s) => s.id === step.state);
            let bg = "#13131f", border = "#1e1e35", color = "#4b5563";
            if (isLast) {
              if (isDone && accepted) { bg = "rgba(16,185,129,0.14)"; border = "#10b981"; color = "#6ee7b7"; }
              else if (isDone)        { bg = "rgba(239,68,68,0.1)";   border = "#ef4444"; color = "#f87171"; }
              else                    { bg = "rgba(99,102,241,0.17)";  border = "#6366f1"; color = "#a5b4fc"; }
            }
            return (
              <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                {i > 0 && step.symbol && (
                  <span style={styles.symBadge}>{step.symbol}</span>
                )}
                {i > 0 && <span style={{ color: "#1e1e35", fontSize: 11 }}>→</span>}
                <span style={{ background: bg, border: `1.5px solid ${border}`, borderRadius: 6, padding: "2px 8px", color, fontSize: 12, fontWeight: 700, transition: "all 0.2s" }}>
                  {step.state || "∅"}
                </span>
              </span>
            );
          })
        )}
      </div>

      {/* Result banner */}
      {isDone && (
        <div style={{
          padding: "10px 16px", borderRadius: 10,
          display: "flex", alignItems: "center", gap: 10,
          fontWeight: 700, fontSize: 13,
          background: accepted ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.07)",
          border: `1px solid ${accepted ? "#10b981" : "#ef4444"}`,
          color: accepted ? "#6ee7b7" : "#f87171",
        }}>
          <span style={{ fontSize: 18 }}>{accepted ? "✓" : "✗"}</span>
          {accepted
            ? `ACCEPTED — "${testInput || "ε"}" ends in accept state ${curStateId}`
            : `REJECTED — "${testInput || "ε"}" ends in non-accept state ${curStateId || "∅"}`}
        </div>
      )}
    </div>
  );
}

function Btn({ onClick, bg, textColor = "#fff", disabled, children }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: disabled ? "#0f0f1e" : bg,
        border: "none", borderRadius: 8,
        padding: "8px 14px",
        color: disabled ? "#374151" : textColor,
        fontFamily: "'Courier New', monospace",
        fontWeight: 700, fontSize: 12,
        cursor: disabled ? "not-allowed" : "pointer",
        letterSpacing: "0.04em",
        transition: "all 0.15s",
        boxShadow: disabled ? "none" : `0 2px 14px ${bg}55`,
      }}
    >
      {children}
    </button>
  );
}

const styles = {
  controlRow: {
    display: "flex", gap: 12, flexWrap: "wrap",
    alignItems: "flex-end", marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 10, color: "#4b5563",
    letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6,
  },
  input: {
    width: "100%",
    background: "#13131f",
    border: "1px solid #2a2a42",
    borderRadius: 8, padding: "8px 12px",
    color: "#e2e2f0",
    fontFamily: "'Courier New', monospace",
    fontSize: 14,
  },
  speedWrap: {
    display: "flex", alignItems: "center", gap: 8,
  },
  tape: {
    display: "flex", gap: 4, flexWrap: "wrap",
    alignItems: "center", marginBottom: 14,
  },
  tapeLabel: {
    fontSize: 10, color: "#374151",
    letterSpacing: "0.08em", marginRight: 6,
  },
  tapeChar: {
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    width: 30, height: 30, borderRadius: 6,
    fontFamily: "'Courier New', monospace",
    fontWeight: 700, fontSize: 14,
    transition: "all 0.2s",
  },
  pathBox: {
    background: "#0a0a16",
    border: "1px solid #1a1a2e",
    borderRadius: 10,
    padding: "10px 14px",
    minHeight: 50,
    display: "flex", flexWrap: "wrap",
    gap: 4, alignItems: "center",
    marginBottom: 14,
  },
  symBadge: {
    background: "rgba(245,158,11,0.12)",
    border: "1px solid rgba(245,158,11,0.2)",
    borderRadius: 5, padding: "1px 6px",
    color: "#f59e0b", fontSize: 11, fontWeight: 700,
  },
};
