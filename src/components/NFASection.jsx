/**
 * NFA / ε-NFA DIY Section
 * Users define an NFA or ε-NFA via transition table.
 */

import { useState, useMemo, useCallback } from "react";
import {
  validateNFA,
  computeAutomataLayout,
  simulateNFA,
  EPSILON,
} from "../utils/nfaEngine.js";
import AutomataCanvas from "./AutomataCanvas.jsx";

/* ── Shared atoms ─────────────────────────────────────────── */
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
    color: "#06b6d4",
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    marginBottom: 5,
    display: "block",
  },
};

function Label({ children, color }) {
  return (
    <label style={{ ...SL.label, color: color || "#06b6d4" }}>{children}</label>
  );
}
function TextInput({ value, onChange, placeholder }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={SL.input}
    />
  );
}

/* ── Transition Table for NFA ─────────────────────────────── */
/**
 * Each cell accepts comma-separated target states (or empty for ∅).
 * For ε-NFA an extra ε column is shown.
 */
function NFATableEditor({ states, alphabet, isEpsilonNFA, table, setTable }) {
  if (states.length === 0 || alphabet.length === 0) {
    return (
      <div style={{ color: "#374151", fontSize: 13 }}>
        Define states and alphabet first.
      </div>
    );
  }

  const cols = isEpsilonNFA ? [...alphabet, EPSILON] : alphabet;

  function handle(stateId, sym, val) {
    setTable((prev) => ({ ...prev, [`${stateId}__${sym}`]: val }));
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={tblStyle}>
        <thead>
          <tr>
            <th style={{ ...thStyle, textAlign: "left" }}>δ(q, σ)</th>
            {cols.map((sym) => (
              <th key={sym} style={{ ...thStyle, color: "#67e8f9" }}>
                {sym}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {states.map((st) => (
            <tr key={st.id}>
              <td style={{ ...tdStyle, color: "#a5b4fc" }}>
                {st.isStart ? "→ " : ""}
                {st.isAccept ? "* " : ""}
                {st.id}
              </td>
              {cols.map((sym) => (
                <td key={sym} style={{ ...tdStyle, padding: 4 }}>
                  <input
                    type="text"
                    value={table[`${st.id}__${sym}`] || ""}
                    onChange={(e) => handle(st.id, sym, e.target.value)}
                    placeholder="∅"
                    style={{
                      ...SL.input,
                      padding: "5px 8px",
                      width: 100,
                      textAlign: "center",
                      fontSize: 11,
                    }}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p style={{ fontSize: 10, color: "#374151", marginTop: 8 }}>
        Enter comma-separated target states per cell (e.g.{" "}
        <span style={{ color: "#a5b4fc" }}>q1, q2</span>). Leave empty for ∅
        (no transition).
        {isEpsilonNFA && (
          <>
            {" "}
            The <span style={{ color: "#67e8f9" }}>ε</span> column is for
            epsilon transitions.
          </>
        )}
      </p>
    </div>
  );
}

/* ── String Tester ────────────────────────────────────────── */
function NFAStringTester({ nfa }) {
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);

  function test() {
    if (!nfa) return;
    const { accepted, steps } = simulateNFA(nfa, input);
    setResult({ accepted, steps, input });
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
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
          disabled={!nfa}
          style={{
            ...btnStyle,
            background: "linear-gradient(135deg,#0891b2,#0e7490)",
          }}
        >
          Test
        </button>
      </div>
      {result && (
        <div style={{ marginTop: 12 }}>
          <div
            style={{
              padding: "8px 14px",
              borderRadius: 8,
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
          </div>
          {result.steps.length > 0 && (
            <div style={{ marginTop: 8, overflowX: "auto" }}>
              <table style={tblStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Step</th>
                    <th style={thStyle}>Symbol read</th>
                    <th style={{ ...thStyle, textAlign: "left" }}>
                      Active states (after ε-closure)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {result.steps.map((step, i) => (
                    <tr key={i}>
                      <td style={tdStyle}>{i}</td>
                      <td style={tdStyle}>{step.symbol ?? " — "}</td>
                      <td style={{ ...tdStyle, textAlign: "left", color: "#a5b4fc" }}>
                        {"{"}
                        {step.states.join(", ")}
                        {"}"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Main Component ───────────────────────────────────────── */
export default function NFASection({ isEpsilonNFA = false }) {
  const accentColor = isEpsilonNFA ? "#a78bfa" : "#06b6d4";
  const gradFrom = isEpsilonNFA ? "#7c3aed" : "#0891b2";
  const gradTo = isEpsilonNFA ? "#a855f7" : "#0e7490";

  const [rawStates, setRawStates] = useState("");
  const [rawAlpha, setRawAlpha] = useState("");
  const [startState, setStartState] = useState("");
  const [rawAccept, setRawAccept] = useState("");
  const [table, setTable] = useState({});
  const [validated, setValidated] = useState(null);
  const [nfa, setNfa] = useState(null);
  const [positions, setPositions] = useState({});

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
    const cols = isEpsilonNFA ? [...alphabet, EPSILON] : alphabet;
    const transitions = [];
    for (const st of states) {
      for (const sym of cols) {
        const val = table[`${st.id}__${sym}`] || "";
        const targets = val
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        if (targets.length > 0) {
          // Flatten to individual transitions
          for (const target of targets) {
            transitions.push({ from: st.id, on: sym, to: target });
          }
        }
      }
    }
    return transitions;
  }, [states, alphabet, isEpsilonNFA, table]);

  function handleValidate() {
    const transitions = buildTransitions();
    const result = validateNFA(
      states,
      alphabet,
      startState.trim(),
      acceptStates,
      transitions,
      isEpsilonNFA
    );
    setValidated(result);

    const nfaObj = {
      states,
      alphabet,
      transitions,
      isEpsilonNFA,
    };
    setNfa(nfaObj);
    setPositions(computeAutomataLayout(states, transitions));
  }

  function handleReset() {
    setValidated(null);
    setNfa(null);
    setPositions({});
    setTable({});
    setRawStates("");
    setRawAlpha("");
    setStartState("");
    setRawAccept("");
  }

  function loadExample() {
    if (isEpsilonNFA) {
      // ε-NFA for (a|b)*abb
      setRawStates("q0, q1, q2, q3");
      setRawAlpha("a, b");
      setStartState("q0");
      setRawAccept("q3");
      setTable({
        "q0__a": "q0, q1",
        "q0__b": "q0",
        "q1__b": "q2",
        "q2__b": "q3",
      });
    } else {
      // NFA that accepts strings ending in "01"
      setRawStates("q0, q1, q2");
      setRawAlpha("0, 1");
      setStartState("q0");
      setRawAccept("q2");
      setTable({
        "q0__0": "q0, q1",
        "q0__1": "q0",
        "q1__1": "q2",
      });
    }
    setValidated(null);
    setNfa(null);
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
              background: accentColor,
              boxShadow: `0 0 8px ${accentColor}`,
            }}
          />
          <h2
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 800,
              letterSpacing: "-0.02em",
              background: `linear-gradient(135deg,#fff,${accentColor})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {isEpsilonNFA ? "ε-NFA — Do It Yourself" : "NFA — Do It Yourself"}
          </h2>
        </div>
        <p style={{ color: "#6b7280", fontSize: 13, margin: 0 }}>
          {isEpsilonNFA
            ? "Define your ε-NFA with epsilon transitions. The ε column accepts states reachable by spontaneous (no-input) moves."
            : "Define your Nondeterministic Finite Automaton. Each cell may list multiple target states separated by commas."}
        </p>
      </div>

      {/* Theory */}
      <div style={{ ...theoryBox, borderLeftColor: accentColor }}>
        <strong style={{ color: accentColor }}>
          {isEpsilonNFA ? "ε-NFA" : "NFA"} Definition
        </strong>
        <p style={{ margin: "6px 0 0", fontSize: 12, color: "#6b7280", lineHeight: 1.7 }}>
          {isEpsilonNFA
            ? "An ε-NFA extends the NFA by allowing transitions on the empty string ε. The ε-closure of a state is the set of all states reachable via zero or more ε-transitions. The transition function is δ: Q × (Σ ∪ {ε}) → 2^Q."
            : "An NFA is a 5-tuple (Q, Σ, δ, q₀, F) where δ: Q × Σ → 2^Q maps each (state, symbol) to a set of next states. A string is accepted if any computation path leads to an accept state."}
        </p>
      </div>

      {/* Step 1 */}
      <div style={card}>
        <SectionLabel step="1" color={accentColor}>
          Define States & Alphabet
        </SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <Label color={accentColor}>States Q</Label>
            <TextInput
              value={rawStates}
              onChange={setRawStates}
              placeholder="q0, q1, q2"
            />
          </div>
          <div>
            <Label color={accentColor}>Alphabet Σ (no ε — use ε column in table)</Label>
            <TextInput
              value={rawAlpha}
              onChange={setRawAlpha}
              placeholder="a, b"
            />
          </div>
          <div>
            <Label color={accentColor}>Start state q₀</Label>
            <TextInput
              value={startState}
              onChange={setStartState}
              placeholder="q0"
            />
          </div>
          <div>
            <Label color={accentColor}>Accept states F</Label>
            <TextInput
              value={rawAccept}
              onChange={setRawAccept}
              placeholder="q2"
            />
          </div>
        </div>
        <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            style={{ ...btnStyle, background: "#1e1e35", color: accentColor }}
            onClick={loadExample}
          >
            Load Example
          </button>
          <button
            style={{ ...btnStyle, background: "#1e1e35", color: "#ef4444" }}
            onClick={handleReset}
          >
            Reset
          </button>
        </div>
      </div>

      {/* Step 2 */}
      <div style={card}>
        <SectionLabel step="2" color={accentColor}>
          Fill Transition Table
        </SectionLabel>
        <NFATableEditor
          states={states}
          alphabet={alphabet}
          isEpsilonNFA={isEpsilonNFA}
          table={table}
          setTable={setTable}
        />
      </div>

      {/* Step 3 */}
      <div style={card}>
        <SectionLabel step="3" color={accentColor}>
          Validate & Visualize
        </SectionLabel>
        <button
          onClick={handleValidate}
          style={{
            ...btnStyle,
            background: `linear-gradient(135deg,${gradFrom},${gradTo})`,
            fontSize: 13,
            padding: "10px 24px",
          }}
        >
          ✦ Validate {isEpsilonNFA ? "ε-NFA" : "NFA"}
        </button>

        {validated && (
          <div style={{ marginTop: 16 }}>
            <ValidationBadge ok={validated.valid} accentColor={accentColor}>
              {validated.valid
                ? `✓ ${isEpsilonNFA ? "ε-NFA" : "NFA"} is valid${
                    validated.warnings.length > 0 ? " (with warnings)" : ""
                  }`
                : `✗ ${validated.errors.length} error${
                    validated.errors.length > 1 ? "s" : ""
                  } found`}
            </ValidationBadge>
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
      {nfa && (
        <div style={card}>
          <SectionLabel color={accentColor}>
            {isEpsilonNFA ? "ε-NFA" : "NFA"} Diagram
          </SectionLabel>
          <AutomataCanvas
            automaton={nfa}
            positions={positions}
            mode="nfa"
            width={840}
            height={340}
          />
        </div>
      )}

      {/* String tester */}
      {nfa && (
        <div style={card}>
          <SectionLabel color={accentColor}>String Tester</SectionLabel>
          <NFAStringTester nfa={nfa} />
        </div>
      )}
    </div>
  );
}

/* ── Sub-components ────────────────────────────────────────── */
function SectionLabel({ step, children, color = "#06b6d4" }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        fontSize: 10,
        color,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        marginBottom: 14,
      }}
    >
      {step && (
        <span
          style={{
            background: color,
            color: "#000",
            borderRadius: 4,
            padding: "1px 6px",
            fontSize: 9,
            fontWeight: 700,
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
          background: `linear-gradient(90deg,${color}33,transparent)`,
        }}
      />
    </div>
  );
}

function ValidationBadge({ ok, children, accentColor }) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "6px 14px",
        borderRadius: 8,
        background: ok ? `${accentColor}18` : "rgba(239,68,68,0.1)",
        border: `1px solid ${ok ? accentColor : "#ef4444"}`,
        color: ok ? accentColor : "#fca5a5",
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
  borderLeft: "3px solid #06b6d4",
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

const tblStyle = {
  borderCollapse: "collapse",
  fontFamily: "'Courier New', monospace",
  fontSize: 12,
  minWidth: 300,
};

const thStyle = {
  border: "1px solid #1e1e35",
  padding: "6px 10px",
  textAlign: "center",
  background: "#0c0c1a",
  color: "#6366f1",
  fontWeight: 700,
};

const tdStyle = {
  border: "1px solid #1e1e35",
  padding: "6px 10px",
  textAlign: "center",
  color: "#e2e2f0",
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
