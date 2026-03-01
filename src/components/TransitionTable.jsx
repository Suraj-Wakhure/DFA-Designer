export default function TransitionTable({ dfa, curStateId, curStep }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={styles.table}>
        <thead>
          <tr>
            {["State", "Description", ...dfa.alphabet, "Accept?"].map((h) => (
              <th key={h} style={styles.th}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dfa.states.map((state) => {
            const isCur = state.id === curStateId;
            return (
              <tr key={state.id} style={{ background: isCur ? "rgba(99,102,241,0.08)" : "transparent", transition: "background 0.2s" }}>
                <td style={{ ...styles.td, fontWeight: 700, color: state.isAccept ? "#6ee7b7" : "#e2e2f0" }}>
                  {state.isStart ? "→ " : ""}{state.id}
                </td>
                <td style={{ ...styles.td, color: "#374151", fontSize: 11, textAlign: "left", maxWidth: 180 }}>
                  {state.desc}
                </td>
                {dfa.alphabet.map((sym) => {
                  const t = dfa.transitions.find((t) => t.from === state.id && t.on === sym);
                  const isActiveCell = isCur && curStep?.symbol === sym;
                  return (
                    <td key={sym} style={{
                      ...styles.td,
                      color: isActiveCell ? "#a5b4fc" : t ? "#e2e2f0" : "#ef4444",
                      fontWeight: isActiveCell ? 800 : 400,
                      background: isActiveCell ? "rgba(99,102,241,0.18)" : "transparent",
                    }}>
                      {t ? t.to : "—"}
                    </td>
                  );
                })}
                <td style={{ ...styles.td, color: state.isAccept ? "#6ee7b7" : "#374151", fontWeight: 700 }}>
                  {state.isAccept ? "✓" : "✗"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const styles = {
  table: { width: "100%", borderCollapse: "collapse", fontSize: 12 },
  th: {
    background: "#0a0a16",
    color: "#67e8f9",
    padding: "8px 14px",
    border: "1px solid #1a1a2e",
    fontWeight: 700,
    letterSpacing: "0.06em",
    textAlign: "center",
    fontFamily: "'Courier New', monospace",
  },
  td: {
    padding: "7px 14px",
    border: "1px solid #111124",
    textAlign: "center",
    fontFamily: "'Courier New', monospace",
    transition: "background 0.2s, color 0.2s",
  },
};
