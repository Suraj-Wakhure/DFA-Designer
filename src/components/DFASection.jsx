/**
 * DFA DIY Section
 * Users define a DFA via transition table and get
 * instant validation + visualization.
 */

import { useState, useMemo, useCallback } from "react";
import { validateDFA } from "../utils/nfaEngine.js";
import { computeAutomataLayout } from "../utils/nfaEngine.js";
import { simulateDFA } from "../utils/dfaEngine.js";
import AutomataCanvas from "./AutomataCanvas.jsx";

/* ── Shared style atoms ───────────────────────────────────── */
const SL = {
  input: {
    background: "#13131f",
    border: "1px solid #2a2a42",
    borderRadius: 8,
    padding: "7px 12px",
    color: "#e2e2f0",
    fontFamily: "'Courier New', monospace",
    fontSize: 13,
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  },
  label: {
    fontSize: 10,
    color: "#6366f1",
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    marginBottom: 5,
    display: "block",
  },
  sectionTitle: {
    fontSize: 10,
    color: "#6366f1",
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    marginBottom: 12,
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
};

function Label({ children }) {
  return <label style={SL.label}>{children}</label>;
}

function TextInput({ value, onChange, placeholder, style }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{ ...SL.input, ...style }}
    />
  );
}

/* ── Transition Table ─────────────────────────────────────── */
function TransitionTableEditor({ states, alphabet, table, setTable }) {
  if (states.length === 0 || alphabet.length === 0) {
    return (
      <div style={{ color: "#374151", fontSize: 13 }}>
        Define states and alphabet first.
      </div>
    );
  }

  function handleChange(stateId, sym, val) {
    setTable((prev) => ({
      ...prev,
      [`${stateId}__${sym}`]: val.trim(),
    }));
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table
        style={{
          borderCollapse: "collapse",
          fontFamily: "'Courier New', monospace",
          fontSize: 12,
          minWidth: 300,
        }}
      >
        <thead>
          <tr>
            <th
              style={{
                ...tdStyle,
                color: "#6366f1",
                background: "#0c0c1a",
                fontWeight: 700,
                textAlign: "left",
                minWidth: 70,
              }}
            >
              δ(q, σ)
            </th>
            {alphabet.map((sym) => (
              <th
                key={sym}
                style={{
                  ...tdStyle,
                  color: "#67e8f9",
                  background: "#0c0c1a",
                  minWidth: 80,
                }}
              >
                {sym}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {states.map((st) => (
            <tr key={st.id}>
              <td style={{ ...tdStyle, color: "#a5b4fc", background: "#0d0d1e" }}>
                {st.isStart ? "→ " : ""}
                {st.isAccept ? "* " : ""}
                {st.id}
              </td>
              {alphabet.map((sym) => (
                <td key={sym} style={{ ...tdStyle, padding: 4 }}>
                  <input
                    type="text"
                    value={table[`${st.id}__${sym}`] || ""}
                    onChange={(e) => handleChange(st.id, sym, e.target.value)}
                    placeholder="—"
                    style={{
                      ...SL.input,
                      padding: "5px 8px",
                      width: 80,
                      textAlign: "center",
                      fontSize: 12,
                    }}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p style={{ fontSize: 10, color: "#374151", marginTop: 8 }}>
        Enter the target state for each (state, symbol) pair. Prefix rows with
        <span style={{ color: "#a5b4fc" }}> → </span> for start and
        <span style={{ color: "#67e8f9" }}> * </span> for accept (controlled above).
      </p>
    </div>
  );
}

const tdStyle = {
  border: "1px solid #1e1e35",
  padding: "6px 10px",
  textAlign: "center",
  color: "#e2e2f0",
};

/* ── String Tester ────────────────────────────────────────── */
function StringTester({ dfa }) {
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);

  function test() {
    if (!dfa) return;
    try {
      const steps = simulateDFA(dfa, input);
      const lastStep = steps[steps.length - 1];
      const lastState = dfa.states.find((s) => s.id === lastStep?.state);
      const accepted =
        lastState?.isAccept && !lastStep?.dead;
      setResult({ accepted, steps, input });
    } catch {
      setResult({ accepted: false, steps: [], input });
    }
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ flex: 1, minWidth: 180 }}>
          <Label>Test String</Label>
          <TextInput
            value={input}
            onChange={setInput}
            placeholder="Enter an input string…"
          />
        </div>
        <button
          onClick={test}
          disabled={!dfa}
          style={{
            ...btnStyle,
            marginTop: 18,
            background: "linear-gradient(135deg,#4f46e5,#7c3aed)",
          }}
        >
          Test
        </button>
      </div>
      {result && (
        <div
          style={{
            marginTop: 12,
            padding: "10px 16px",
            borderRadius: 10,
            background: result.accepted
              ? "rgba(6,182,212,0.1)"
              : "rgba(239,68,68,0.1)",
            border: `1px solid ${result.accepted ? "#06b6d4" : "#ef4444"}`,
            fontSize: 13,
            fontFamily: "'Courier New', monospace",
            color: result.accepted ? "#67e8f9" : "#fca5a5",
          }}
        >
          <strong>"{result.input}"</strong> →{" "}
          {result.accepted ? "✓ ACCEPTED" : "✗ REJECTED"}
          {result.steps.length > 0 && (
            <div style={{ marginTop: 6, fontSize: 11, color: "#6b7280" }}>
              Path:{" "}
              {result.steps
                .map((s, i) =>
                  i === 0
                    ? s.state
                    : `→[${s.symbol}]→ ${s.dead ? "(dead)" : s.state}`
                )
                .join(" ")}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Main Component ───────────────────────────────────────── */
export default function DFASection() {
  const [rawStates, setRawStates] = useState("q0, q1, q2");
  const [rawAlpha, setRawAlpha] = useState("0, 1");
  const [startState, setStartState] = useState("q0");
  const [rawAccept, setRawAccept] = useState("q2");
  const [table, setTable] = useState({});
  const [validated, setValidated] = useState(null); // { valid, errors, warnings }
  const [dfa, setDfa] = useState(null);
  const [positions, setPositions] = useState({});

  // Parse helpers
  const states = useMemo(
    () =>
      rawStates
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .map((id) => ({
          id,
          label: id,
          isStart: id === startState.trim(),
          isAccept: rawAccept
            .split(",")
            .map((s) => s.trim())
            .includes(id),
        })),
    [rawStates, startState, rawAccept]
  );

  const alphabet = useMemo(
    () =>
      rawAlpha
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    [rawAlpha]
  );

  const acceptStates = useMemo(
    () =>
      rawAccept
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    [rawAccept]
  );

  const buildTransitions = useCallback(() => {
    const transitions = [];
    for (const st of states) {
      for (const sym of alphabet) {
        const val = table[`${st.id}__${sym}`];
        if (val) {
          transitions.push({ from: st.id, on: sym, to: val });
        }
      }
    }
    return transitions;
  }, [states, alphabet, table]);

  function handleValidate() {
    const transitions = buildTransitions();
    const result = validateDFA(
      states,
      alphabet,
      startState.trim(),
      acceptStates,
      transitions
    );
    setValidated(result);

    if (result.valid || result.errors.length === 0) {
      // Build DFA object compatible with simulateDFA
      const dfaObj = { states, alphabet, transitions };
      setDfa(dfaObj);
      setPositions(computeAutomataLayout(states, transitions));
    } else {
      setDfa(null);
      setPositions({});
    }
  }

  function handleReset() {
    setValidated(null);
    setDfa(null);
    setPositions({});
    setTable({});
  }

  function loadExample() {
    setRawStates("q0, q1, q2");
    setRawAlpha("0, 1");
    setStartState("q0");
    setRawAccept("q2");
    // Example: binary strings ending in "01"
    setTable({
      "q0__0": "q1",
      "q0__1": "q0",
      "q1__0": "q1",
      "q1__1": "q2",
      "q2__0": "q1",
      "q2__1": "q0",
    });
    setValidated(null);
    setDfa(null);
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#6366f1",
              boxShadow: "0 0 8px #6366f1",
            }}
          />
          <h2
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 800,
              letterSpacing: "-0.02em",
              background: "linear-gradient(135deg,#fff,#a5b4fc)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            DFA — Do It Yourself
          </h2>
        </div>
        <p style={{ color: "#6b7280", fontSize: 13, margin: 0 }}>
          Define your Deterministic Finite Automaton via a transition table. The
          system will validate well-formedness, determinism, and completeness, then
          draw the graph.
        </p>
      </div>

      {/* Theory box */}
      <div style={theoryBox}>
        <strong style={{ color: "#a5b4fc" }}>DFA Definition</strong>
        <p style={{ margin: "6px 0 0", fontSize: 12, color: "#6b7280", lineHeight: 1.7 }}>
          A DFA is a 5-tuple (Q, Σ, δ, q₀, F) where Q is a finite set of states,
          Σ is the input alphabet, δ: Q × Σ → Q is the total transition function,
          q₀ ∈ Q is the start state, and F ⊆ Q is the set of accept states. For
          each state and symbol, exactly one transition must exist.
        </p>
      </div>

      {/* Step 1 – Define */}
      <div style={card}>
        <SectionLabel step="1">Define States & Alphabet</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <Label>States Q (comma-separated)</Label>
            <TextInput value={rawStates} onChange={setRawStates} placeholder="q0, q1, q2" />
          </div>
          <div>
            <Label>Alphabet Σ (comma-separated)</Label>
            <TextInput value={rawAlpha} onChange={setRawAlpha} placeholder="0, 1" />
          </div>
          <div>
            <Label>Start state q₀</Label>
            <TextInput value={startState} onChange={setStartState} placeholder="q0" />
          </div>
          <div>
            <Label>Accept states F (comma-separated)</Label>
            <TextInput value={rawAccept} onChange={setRawAccept} placeholder="q1, q2" />
          </div>
        </div>
        <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button style={{ ...btnStyle, background: "#1e1e35", color: "#a5b4fc" }} onClick={loadExample}>
            Load Example (binary ending in 01)
          </button>
          <button style={{ ...btnStyle, background: "#1e1e35", color: "#ef4444" }} onClick={handleReset}>
            Reset
          </button>
        </div>
      </div>

      {/* Step 2 – Table */}
      <div style={card}>
        <SectionLabel step="2">Fill Transition Table δ(q, σ)</SectionLabel>
        <TransitionTableEditor
          states={states}
          alphabet={alphabet}
          table={table}
          setTable={setTable}
        />
      </div>

      {/* Step 3 – Validate */}
      <div style={card}>
        <SectionLabel step="3">Validate & Visualize</SectionLabel>
        <button
          onClick={handleValidate}
          style={{
            ...btnStyle,
            background: "linear-gradient(135deg,#4f46e5,#7c3aed)",
            fontSize: 13,
            padding: "10px 24px",
          }}
        >
          ✦ Validate DFA
        </button>

        {validated && (
          <div style={{ marginTop: 16 }}>
            {validated.errors.length === 0 ? (
              <ValidationBadge ok>
                ✓ DFA is valid{validated.warnings.length > 0 ? " (with warnings)" : ""}
              </ValidationBadge>
            ) : (
              <ValidationBadge ok={false}>
                ✗ DFA has {validated.errors.length} error
                {validated.errors.length > 1 ? "s" : ""}
              </ValidationBadge>
            )}

            {validated.errors.length > 0 && (
              <ul style={feedbackList("#ef4444")}>
                {validated.errors.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            )}
            {validated.warnings.length > 0 && (
              <ul style={feedbackList("#f59e0b")}>
                {validated.warnings.map((w, i) => (
                  <li key={i}>⚠ {w}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Diagram */}
      {dfa && (
        <div style={card}>
          <SectionLabel>DFA Diagram</SectionLabel>
          <AutomataCanvas
            automaton={dfa}
            positions={positions}
            mode="dfa"
            width={840}
            height={340}
          />
        </div>
      )}

      {/* String Tester */}
      {dfa && (
        <div style={card}>
          <SectionLabel>String Tester</SectionLabel>
          <StringTester dfa={dfa} />
        </div>
      )}
    </div>
  );
}

/* ── Sub-components ────────────────────────────────────────── */
function SectionLabel({ step, children }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        fontSize: 10,
        color: "#6366f1",
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        marginBottom: 14,
      }}
    >
      {step && (
        <span
          style={{
            background: "#6366f1",
            color: "#fff",
            borderRadius: 4,
            padding: "1px 6px",
            fontSize: 9,
          }}
        >
          {step}
        </span>
      )}
      {children}
      <div
        style={{
          flex: 1,
          height: 1,
          background: "linear-gradient(90deg,#1e1e35,transparent)",
        }}
      />
    </div>
  );
}

function ValidationBadge({ ok, children }) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "6px 14px",
        borderRadius: 8,
        background: ok ? "rgba(6,182,212,0.1)" : "rgba(239,68,68,0.1)",
        border: `1px solid ${ok ? "#06b6d4" : "#ef4444"}`,
        color: ok ? "#67e8f9" : "#fca5a5",
        fontSize: 13,
        fontFamily: "'Courier New', monospace",
        fontWeight: 700,
      }}
    >
      {children}
    </div>
  );
}

const card = {
  background: "#0c0c1a",
  border: "1px solid #1e1e35",
  borderRadius: 14,
  padding: "20px 22px",
  marginBottom: 16,
};

const theoryBox = {
  background: "#0a0a18",
  border: "1px solid #1e1e35",
  borderLeft: "3px solid #6366f1",
  borderRadius: 10,
  padding: "12px 16px",
  marginBottom: 16,
  fontSize: 12,
};

const btnStyle = {
  border: "none",
  borderRadius: 8,
  padding: "8px 18px",
  color: "#fff",
  fontFamily: "'Courier New', monospace",
  fontWeight: 700,
  fontSize: 12,
  cursor: "pointer",
  letterSpacing: "0.04em",
};

function feedbackList(color) {
  return {
    margin: "10px 0 0",
    padding: "0 0 0 18px",
    color,
    fontSize: 12,
    fontFamily: "'Courier New', monospace",
    lineHeight: 1.8,
  };
}
