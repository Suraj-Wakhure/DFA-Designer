import { useState, useEffect, useRef, useCallback } from "react";
import { EXAMPLES } from "../constants.js";
import { computeLayout, simulateDFA } from "../utils/dfaEngine.js";
import { generateDFAFromPrompt } from "../services/api.js";
import DFACanvas from "./DFACanvas.jsx";
import Simulator from "./Simulator.jsx";
import TransitionTable from "./TransitionTable.jsx";
import TestCases from "./TestCases.jsx";

export default function DFADesigner() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [dfa, setDfa] = useState(null);
  const [positions, setPositions] = useState({});
  const [error, setError] = useState("");

  // Simulator state
  const [testInput, setTestInput] = useState("");
  const [simSteps, setSimSteps] = useState([]);
  const [simIdx, setSimIdx] = useState(-1);
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(600);
  const timerRef = useRef(null);

  /* ── Generate DFA ─────────────────────────────────────── */
  const generate = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    setDfa(null);
    clearInterval(timerRef.current);
    setSimSteps([]);
    setSimIdx(-1);
    setRunning(false);
    setTestInput("");

    try {
      const result = await generateDFAFromPrompt(query);
      setDfa(result);
      setPositions(computeLayout(result.states, result.transitions));
    } catch (e) {
      setError(e.message || "Failed to generate DFA.");
    } finally {
      setLoading(false);
    }
  }, [query]);

  /* ── Simulator controls ───────────────────────────────── */
  const startSim = useCallback(() => {
    if (!dfa) return;
    clearInterval(timerRef.current);
    const steps = simulateDFA(dfa, testInput);
    setSimSteps(steps);
    setSimIdx(0);
    setRunning(true);
  }, [dfa, testInput]);

  // Auto-advance when running
  useEffect(() => {
    if (!running || simIdx < 0) return;
    if (simIdx >= simSteps.length - 1) {
      setRunning(false);
      return;
    }
    timerRef.current = setTimeout(
      () => setSimIdx((i) => i + 1),
      speed
    );
    return () => clearTimeout(timerRef.current);
  }, [running, simIdx, simSteps, speed]);

  const stepForward = () => {
    if (simIdx < 0) {
      const steps = simulateDFA(dfa, testInput);
      setSimSteps(steps);
      setSimIdx(0);
    } else if (simIdx < simSteps.length - 1) {
      setSimIdx((i) => i + 1);
    }
  };

  const resetSim = useCallback(() => {
    clearInterval(timerRef.current);
    setSimSteps([]);
    setSimIdx(-1);
    setRunning(false);
  }, []);

  const loadTestCase = (inputStr) => {
    setTestInput(inputStr);
    resetSim();
  };

  // Derived sim values
  const curStep = simIdx >= 0 ? simSteps[simIdx] : null;
  const curStateId = curStep?.state ?? null;
  const prevStep = simIdx > 0 ? simSteps[simIdx - 1] : null;
  const isDone = simSteps.length > 0 && simIdx === simSteps.length - 1;
  const finalStateObj = isDone
    ? dfa?.states.find((s) => s.id === curStateId)
    : null;
  const accepted = isDone && !!finalStateObj?.isAccept && !curStep?.dead;

  // Active edge: which (from, to, symbol) is currently highlighted
  const activeEdge = prevStep && curStep
    ? { from: prevStep.state, to: curStep.state, symbol: curStep.symbol }
    : null;

  return (
    <div style={styles.page}>
      {/* Ambient glow blobs */}
      <div style={styles.blob1} />
      <div style={styles.blob2} />

      <div style={styles.inner}>
        {/* ── Header ── */}
        <header style={styles.header}>
          <div style={styles.badge}>
            <span style={styles.badgeDot} />
            AI-Powered
          </div>
          <h1 style={styles.title}>DFA DESIGNER</h1>
          <p style={styles.subtitle}>
            describe a language → get an animated deterministic finite automaton
          </p>
        </header>

        {/* ── Query input ── */}
        <div style={styles.card}>
          <div style={styles.cardTopLine} />
          <label style={styles.inputLabel}>Language Description</label>
          <div style={styles.inputRow}>
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && e.ctrlKey && generate()}
              placeholder={
                "e.g. strings over {0,1} that begin or end with 01\n" +
                "e.g. binary strings with even number of 0s\n" +
                "e.g. strings over {a,b} not containing 'aa'"
              }
              rows={3}
              style={styles.textarea}
            />
            <button
              onClick={generate}
              disabled={loading || !query.trim()}
              style={{
                ...styles.generateBtn,
                opacity: loading || !query.trim() ? 0.55 : 1,
                cursor: loading || !query.trim() ? "not-allowed" : "pointer",
                background: loading
                  ? "#1e1e35"
                  : "linear-gradient(135deg,#4f46e5,#7c3aed)",
              }}
            >
              {loading ? (
                <>
                  <span style={styles.spinner} />
                  Building…
                </>
              ) : (
                "✦ Generate"
              )}
            </button>
          </div>

          {/* Example chips */}
          <div style={styles.examplesRow}>
            <span style={styles.examplesLabel}>TRY →</span>
            {EXAMPLES.map((ex) => (
              <ExampleChip key={ex} label={ex} onClick={() => setQuery(ex)} />
            ))}
          </div>

          {error && <div style={styles.errorBox}>⚠ {error}</div>}
        </div>

        {/* ── Loading skeleton ── */}
        {loading && (
          <div style={{ ...styles.card, textAlign: "center", padding: 48 }}>
            <div style={styles.bigSpinner} />
            <p style={{ color: "#4b5563", fontSize: 13, marginTop: 16 }}>
              Designing your DFA…
            </p>
          </div>
        )}

        {/* ── Output ── */}
        {dfa && !loading && (
          <div className="fade-in-up">
            {/* Info row */}
            <div style={styles.card}>
              <div style={styles.dfaTitle}>{dfa.title}</div>
              <div style={styles.dfaLang}>{dfa.language}</div>
              <div style={styles.pillRow}>
                {[
                  ["States", dfa.states.length],
                  ["Alphabet", "{" + dfa.alphabet.join(", ") + "}"],
                  ["Accept states", dfa.states.filter((s) => s.isAccept).length],
                  ["Start state", dfa.states.find((s) => s.isStart)?.id],
                ].map(([k, v]) => (
                  <span key={k} style={styles.pill}>
                    {k}:{" "}
                    <strong style={{ color: "#67e8f9" }}>{v}</strong>
                  </span>
                ))}
              </div>
            </div>

            {/* DFA Diagram */}
            <div style={styles.card}>
              <SectionLabel>DFA Diagram</SectionLabel>
              <DFACanvas
                dfa={dfa}
                positions={positions}
                curStateId={curStateId}
                activeEdge={activeEdge}
                isDone={isDone}
                accepted={accepted}
              />
            </div>

            {/* Simulator */}
            <div style={styles.card}>
              <SectionLabel>Simulator</SectionLabel>
              <Simulator
                dfa={dfa}
                testInput={testInput}
                setTestInput={(v) => { setTestInput(v); resetSim(); }}
                simSteps={simSteps}
                simIdx={simIdx}
                running={running}
                speed={speed}
                setSpeed={setSpeed}
                isDone={isDone}
                accepted={accepted}
                curStateId={curStateId}
                curStep={curStep}
                onRun={startSim}
                onStep={stepForward}
                onReset={resetSim}
              />
            </div>

            {/* Test cases */}
            <div style={styles.card}>
              <SectionLabel>Example Test Cases</SectionLabel>
              <TestCases
                cases={dfa.testCases}
                onSelect={loadTestCase}
              />
            </div>

            {/* Transition table */}
            <div style={styles.card}>
              <SectionLabel>Transition Table δ(state, symbol)</SectionLabel>
              <TransitionTable
                dfa={dfa}
                curStateId={curStateId}
                curStep={curStep}
              />
            </div>

            {/* Explanation */}
            <div style={styles.explanationCard}>
              <SectionLabel>How it works</SectionLabel>
              <p style={{ color: "#6b7280", fontSize: 13, lineHeight: 1.9 }}>
                {dfa.explanation}
              </p>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse-dot {
          0%,100% { opacity:1; transform:scale(1); }
          50% { opacity:0.35; transform:scale(0.6); }
        }
      `}</style>
    </div>
  );
}

/* ── Small sub-components ── */
function SectionLabel({ children }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      fontSize: 10, color: "#6366f1", letterSpacing: "0.14em",
      textTransform: "uppercase", marginBottom: 16,
    }}>
      {children}
      <div style={{
        flex: 1, height: 1,
        background: "linear-gradient(90deg,#1e1e35,transparent)",
      }} />
    </div>
  );
}

function ExampleChip({ label, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "#13131f",
        border: `1px solid ${hovered ? "#6366f1" : "#1e1e35"}`,
        borderRadius: 100,
        padding: "3px 10px",
        fontSize: 10,
        color: hovered ? "#a5b4fc" : "#6b7280",
        cursor: "pointer",
        fontFamily: "inherit",
        transition: "all 0.15s",
      }}
    >
      {label}
    </button>
  );
}

/* ── Styles ── */
const styles = {
  page: {
    minHeight: "100vh",
    background: "#06060f",
    color: "#e2e2f0",
    fontFamily: "'Courier New', Courier, monospace",
    position: "relative",
    overflowX: "hidden",
  },
  blob1: {
    position: "fixed", width: 700, height: 700, borderRadius: "50%",
    background: "radial-gradient(circle,rgba(99,102,241,0.07) 0%,transparent 70%)",
    top: -250, left: -200, pointerEvents: "none", zIndex: 0,
  },
  blob2: {
    position: "fixed", width: 600, height: 600, borderRadius: "50%",
    background: "radial-gradient(circle,rgba(6,182,212,0.05) 0%,transparent 70%)",
    bottom: -200, right: -100, pointerEvents: "none", zIndex: 0,
  },
  inner: {
    position: "relative", zIndex: 1,
    maxWidth: 1100, margin: "0 auto",
    padding: "28px 20px 80px",
  },
  header: { textAlign: "center", marginBottom: 36 },
  badge: {
    display: "inline-flex", alignItems: "center", gap: 8,
    background: "rgba(99,102,241,0.1)",
    border: "1px solid rgba(99,102,241,0.25)",
    borderRadius: 100, padding: "4px 14px",
    fontSize: 11, color: "#a5b4fc",
    letterSpacing: "0.12em", textTransform: "uppercase",
    marginBottom: 16,
  },
  badgeDot: {
    width: 6, height: 6, borderRadius: "50%",
    background: "#6366f1", boxShadow: "0 0 8px #6366f1",
    animation: "pulse-dot 2s infinite",
    display: "inline-block",
  },
  title: {
    fontSize: "clamp(2rem,5vw,3rem)",
    fontWeight: 900,
    letterSpacing: "-0.03em",
    background: "linear-gradient(135deg,#fff 0%,#a5b4fc 55%,#67e8f9 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    marginBottom: 8,
  },
  subtitle: { color: "#374151", fontSize: 13, letterSpacing: "0.05em" },

  card: {
    background: "#0c0c1a",
    border: "1px solid #1e1e35",
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    position: "relative",
    overflow: "hidden",
  },
  cardTopLine: {
    position: "absolute", top: 0, left: 0, right: 0, height: 1,
    background: "linear-gradient(90deg,transparent,#6366f1,#67e8f9,transparent)",
    opacity: 0.5,
  },
  explanationCard: {
    background: "#0c0c1a",
    border: "1px solid #1e1e35",
    borderLeft: "3px solid #6366f1",
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
  },
  inputLabel: {
    display: "block", fontSize: 10, color: "#6366f1",
    letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 10,
  },
  inputRow: { display: "flex", gap: 12 },
  textarea: {
    flex: 1,
    background: "#13131f",
    border: "1px solid #2a2a42",
    borderRadius: 10,
    padding: "10px 14px",
    color: "#e2e2f0",
    fontFamily: "'Courier New', Courier, monospace",
    fontSize: 13,
    resize: "vertical",
    lineHeight: 1.6,
    minHeight: 80,
  },
  generateBtn: {
    border: "none", borderRadius: 10,
    padding: "0 22px",
    color: "#fff",
    fontFamily: "'Courier New', Courier, monospace",
    fontWeight: 700, fontSize: 13,
    whiteSpace: "nowrap",
    letterSpacing: "0.04em",
    minWidth: 130,
    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
    boxShadow: "0 4px 24px rgba(99,102,241,0.3)",
    transition: "opacity 0.2s",
  },
  spinner: {
    width: 14, height: 14,
    border: "2px solid rgba(255,255,255,0.25)",
    borderTopColor: "#fff",
    borderRadius: "50%",
    animation: "spin 0.75s linear infinite",
    display: "inline-block",
  },
  bigSpinner: {
    width: 40, height: 40,
    border: "3px solid #1e1e35",
    borderTopColor: "#6366f1",
    borderRadius: "50%",
    animation: "spin 0.85s linear infinite",
    margin: "0 auto",
  },
  examplesRow: {
    display: "flex", gap: 8, flexWrap: "wrap",
    marginTop: 12, alignItems: "center",
  },
  examplesLabel: {
    fontSize: 10, color: "#374151",
    letterSpacing: "0.06em", marginRight: 2,
  },
  errorBox: {
    marginTop: 12, padding: "8px 14px",
    background: "rgba(239,68,68,0.08)",
    border: "1px solid rgba(239,68,68,0.2)",
    borderRadius: 8, color: "#f87171", fontSize: 12,
  },

  dfaTitle: {
    fontSize: 18, fontWeight: 800,
    color: "#fff", letterSpacing: "-0.02em", marginBottom: 5,
  },
  dfaLang: {
    fontSize: 12, color: "#818cf8",
    fontFamily: "'Courier New', monospace", marginBottom: 14,
  },
  pillRow: { display: "flex", gap: 10, flexWrap: "wrap" },
  pill: {
    background: "#13131f",
    border: "1px solid #1e1e35",
    borderRadius: 7, padding: "4px 12px",
    fontSize: 11, color: "#6b7280",
  },
};
