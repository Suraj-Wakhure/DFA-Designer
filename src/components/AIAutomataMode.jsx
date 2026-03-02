/**
 * AIAutomataMode — Shared AI-powered mode for NFA, ε-NFA, and RE sections.
 * Props:
 *   type        : "nfa" | "enfa" | "re"
 *   accentColor : hex string
 *   examples    : string[]
 *   apiCall     : async (query: string) => parsedResult
 */

import { useState } from "react";
import { EPSILON, computeAutomataLayout, simulateNFA } from "../utils/nfaEngine.js";
import { regexToNFA, testRegex } from "../utils/reEngine.js";
import AutomataCanvas from "./AutomataCanvas.jsx";

/* ── helpers ──────────────────────────────────────────────────── */
function normalizeTransitions(transitions = []) {
  const out = [];
  for (const t of transitions) {
    if (Array.isArray(t.to)) {
      t.to.forEach((target) => out.push({ from: t.from, on: t.on, to: String(target) }));
    } else {
      out.push({ ...t, to: String(t.to) });
    }
  }
  return out;
}

function buildAutomaton(data) {
  const transitions = normalizeTransitions(data.transitions);
  const startState = data.states.find((s) => s.isStart)?.id ?? data.states[0]?.id;
  const acceptStates = data.states.filter((s) => s.isAccept).map((s) => s.id);
  return {
    states: data.states,
    alphabet: data.alphabet,
    transitions,
    startState,
    acceptStates,
  };
}

/* ═══════════════════════════════════════════════════════════════ */
export default function AIAutomataMode({ type, accentColor, examples, apiCall }) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const isRE = type === "re";
  const typeLabel = type === "enfa" ? "ε-NFA" : type.toUpperCase();

  /* ── Generate ───────────────────────────────────────────── */
  async function generate() {
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const raw = await apiCall(q);
      if (isRE) {
        // Attach Thompson's ε-NFA for visualization
        let nfaData = null;
        try {
          const nfaObj = regexToNFA(raw.regex);
          const positions = computeAutomataLayout(nfaObj.states, nfaObj.transitions);
          nfaData = { nfaObj, positions };
        } catch {
          /* skip — regex may be complex */
        }
        setResult({ ...raw, nfaData });
      } else {
        const automaton = buildAutomaton(raw);
        const positions = computeAutomataLayout(automaton.states, automaton.transitions);
        setResult({ ...raw, automaton, positions });
      }
    } catch (e) {
      setError(e.message || `Failed to generate ${typeLabel}.`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ fontFamily: "'Courier New', monospace", maxWidth: 900 }}>
      {/* ── Prompt Card ─────────────────────────────────────── */}
      <Card accentColor={accentColor}>
        <SectionTitle color={accentColor}>
          ✦ Describe the Language
        </SectionTitle>

        {/* Example chips */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
          {examples.map((ex) => (
            <ExampleChip
              key={ex}
              label={ex}
              color={accentColor}
              onClick={() => setQuery(ex)}
            />
          ))}
        </div>

        {/* Textarea */}
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) generate();
          }}
          placeholder={
            isRE
              ? `e.g. "strings over {a,b} ending in 'abb'"   (Ctrl+Enter to generate)`
              : `e.g. "binary strings ending in '01'"   (Ctrl+Enter to generate)`
          }
          rows={3}
          style={{
            width: "100%",
            background: "#0c0c1a",
            border: `1.5px solid ${accentColor}40`,
            borderRadius: 10,
            color: "#e2e2f0",
            fontFamily: "'Courier New', monospace",
            fontSize: 13,
            padding: "12px 14px",
            resize: "vertical",
            outline: "none",
            lineHeight: 1.6,
            transition: "border-color 0.2s, box-shadow 0.2s",
            boxSizing: "border-box",
          }}
          onFocus={(e) => {
            e.target.style.borderColor = accentColor;
            e.target.style.boxShadow = `0 0 0 3px ${accentColor}18`;
          }}
          onBlur={(e) => {
            e.target.style.borderColor = `${accentColor}40`;
            e.target.style.boxShadow = "none";
          }}
        />

        {/* Generate button */}
        <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={generate}
            disabled={loading || !query.trim()}
            style={{
              background: loading
                ? `${accentColor}22`
                : `linear-gradient(135deg,${accentColor}22,${accentColor}11)`,
              border: `1.5px solid ${accentColor}60`,
              borderRadius: 10,
              color: loading ? `${accentColor}88` : accentColor,
              fontFamily: "'Courier New', monospace",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.08em",
              padding: "10px 22px",
              cursor: loading || !query.trim() ? "not-allowed" : "pointer",
              opacity: !query.trim() ? 0.5 : 1,
              transition: "all 0.2s",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            {loading ? (
              <>
                <Spinner color={accentColor} />
                Generating {typeLabel}…
              </>
            ) : (
              `⚡ Generate ${typeLabel}`
            )}
          </button>
          <span style={{ fontSize: 10, color: "#374151" }}>Ctrl+Enter</span>
        </div>

        {error && (
          <div
            style={{
              marginTop: 12,
              padding: "10px 14px",
              background: "#ff444411",
              border: "1px solid #ff444440",
              borderRadius: 8,
              color: "#ff6b6b",
              fontSize: 12,
            }}
          >
            ⚠ {error}
          </div>
        )}
      </Card>

      {/* ── Results ─────────────────────────────────────────── */}
      {result && (
        <div className="fade-in-up">
          {isRE ? (
            <REResult result={result} accentColor={accentColor} />
          ) : (
            <NFAResult result={result} accentColor={accentColor} type={type} />
          )}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
/* NFA / ε-NFA Result                                             */
/* ═══════════════════════════════════════════════════════════════ */
function NFAResult({ result, accentColor, type }) {
  const [testInput, setTestInput] = useState("");
  const [testResult, setTestResult] = useState(null);

  const { automaton, positions, title, language, explanation, testCases, alphabet } = result;
  const typeLabel = type === "enfa" ? "ε-NFA" : "NFA";

  function runTest() {
    const clean = testInput; // keep empty string possible
    try {
      const { accepted, steps } = simulateNFA(automaton, clean);
      setTestResult({ accepted, steps, input: clean });
    } catch (e) {
      setTestResult({ error: e.message });
    }
  }

  return (
    <>
      {/* Info pills */}
      <Card accentColor={accentColor}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
          <Pill color={accentColor} label={typeLabel} />
          <Pill color="#6b7280" label={`${automaton.states.length} states`} />
          <Pill color="#6b7280" label={`alphabet: {${alphabet?.join(", ")}}`} />
          <Pill color="#6b7280" label={`${automaton.transitions.length} transitions`} />
        </div>

        <div style={{ fontSize: 13, fontWeight: 700, color: "#e2e2f0", marginBottom: 4 }}>
          {title}
        </div>
        <div style={{ fontSize: 11, color: accentColor, marginBottom: 10, fontStyle: "italic" }}>
          {language}
        </div>
        {explanation && (
          <div style={{ fontSize: 12, color: "#9ca3af", lineHeight: 1.7 }}>{explanation}</div>
        )}
      </Card>

      {/* Canvas */}
      <Card accentColor={accentColor} style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "14px 18px 10px", borderBottom: "1px solid #1e1e35" }}>
          <SectionTitle color={accentColor} small>◈ {typeLabel} Diagram</SectionTitle>
        </div>
        <AutomataCanvas
          states={automaton.states}
          transitions={automaton.transitions}
          positions={positions}
          currentState={null}
          accentColor={accentColor}
        />
      </Card>

      {/* States legend */}
      <Card accentColor={accentColor}>
        <SectionTitle color={accentColor} small>◉ State Reference</SectionTitle>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
          {automaton.states.map((s) => (
            <div
              key={s.id}
              style={{
                background: "#0c0c1a",
                border: `1px solid ${accentColor}30`,
                borderRadius: 8,
                padding: "6px 12px",
                fontSize: 11,
              }}
            >
              <span style={{ color: accentColor, fontWeight: 700 }}>{s.label ?? s.id}</span>
              {s.isStart && (
                <span style={{ color: "#6b7280", marginLeft: 6 }}>▶ start</span>
              )}
              {s.isAccept && (
                <span style={{ color: "#22c55e", marginLeft: 6 }}>✓ accept</span>
              )}
              {s.desc && (
                <span style={{ color: "#6b7280", marginLeft: 6 }}>— {s.desc}</span>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* String tester */}
      <Card accentColor={accentColor}>
        <SectionTitle color={accentColor} small>▶ Test a String</SectionTitle>
        <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
          <input
            value={testInput}
            onChange={(e) => { setTestInput(e.target.value); setTestResult(null); }}
            onKeyDown={(e) => e.key === "Enter" && runTest()}
            placeholder={`e.g. ${alphabet?.slice(0, 2).join("") ?? "01"}01`}
            spellCheck={false}
            style={inputStyle(accentColor)}
          />
          <button onClick={runTest} style={btnStyle(accentColor)}>
            Run ↵
          </button>
        </div>

        {testResult && (
          <div
            className="fade-in-up"
            style={{
              marginTop: 12,
              padding: "12px 16px",
              borderRadius: 10,
              background: testResult.error
                ? "#ff444411"
                : testResult.accepted
                ? "#22c55e14"
                : "#ef444414",
              border: `1px solid ${
                testResult.error
                  ? "#ff444440"
                  : testResult.accepted
                  ? "#22c55e40"
                  : "#ef444440"
              }`,
            }}
          >
            {testResult.error ? (
              <span style={{ color: "#ff6b6b", fontSize: 12 }}>⚠ {testResult.error}</span>
            ) : (
              <>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: testResult.accepted ? "#22c55e" : "#ef4444",
                    marginBottom: 8,
                  }}
                >
                  {testResult.accepted ? "✓ ACCEPTED" : "✗ REJECTED"}
                  <span style={{ fontSize: 11, color: "#6b7280", fontWeight: 400, marginLeft: 8 }}>
                    "{testResult.input}"
                  </span>
                </div>
                {testResult.steps && testResult.steps.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4, fontSize: 11 }}>
                    {testResult.steps.map((step, i) => (
                      <span key={i} style={{ color: "#9ca3af" }}>
                        <span style={{ color: accentColor }}>
                          {`{${step.states.join(",")}}`}
                        </span>
                        {i < testResult.steps.length - 1 && (
                          <span style={{ color: "#4b5563" }}>
                            {" "}
                            ─
                            <span style={{ color: "#6b7280" }}>
                              {step.symbol === EPSILON ? "ε" : step.symbol ?? "ε"}
                            </span>
                            →{" "}
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </Card>

      {/* AI-generated test cases */}
      {testCases?.length > 0 && (
        <Card accentColor={accentColor}>
          <SectionTitle color={accentColor} small>✦ AI Test Cases</SectionTitle>
          <TestCaseTable cases={testCases} accentColor={accentColor} />
        </Card>
      )}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
/* RE Result                                                      */
/* ═══════════════════════════════════════════════════════════════ */
function REResult({ result, accentColor }) {
  const [testInput, setTestInput] = useState("");
  const [testResult, setTestResult] = useState(null);

  const { title, language, regex, explanation, alphabet, testCases, nfaData } = result;

  function runTest() {
    try {
      const { accepted } = testRegex(regex, testInput);
      setTestResult({ accepted, input: testInput });
    } catch (e) {
      setTestResult({ error: e.message });
    }
  }

  return (
    <>
      {/* Info + Regex display */}
      <Card accentColor={accentColor}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
          <Pill color={accentColor} label="RE" />
          <Pill color="#6b7280" label={`alphabet: {${alphabet?.join(", ")}}`} />
        </div>

        <div style={{ fontSize: 13, fontWeight: 700, color: "#e2e2f0", marginBottom: 4 }}>
          {title}
        </div>
        <div style={{ fontSize: 11, color: accentColor, marginBottom: 14, fontStyle: "italic" }}>
          {language}
        </div>

        {/* Regex big display */}
        <div
          style={{
            background: "#0c0c1a",
            border: `1.5px solid ${accentColor}50`,
            borderRadius: 10,
            padding: "16px 20px",
            marginBottom: 12,
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 10, color: "#4b5563", letterSpacing: "0.2em", marginBottom: 8 }}>
            REGULAR EXPRESSION
          </div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: accentColor,
              letterSpacing: "0.06em",
              wordBreak: "break-all",
              textShadow: `0 0 20px ${accentColor}40`,
            }}
          >
            {regex}
          </div>
        </div>

        {explanation && (
          <div style={{ fontSize: 12, color: "#9ca3af", lineHeight: 1.7 }}>{explanation}</div>
        )}
      </Card>

      {/* Thompson's ε-NFA visualization */}
      {nfaData && (
        <Card accentColor={accentColor} style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "14px 18px 10px", borderBottom: "1px solid #1e1e35" }}>
            <SectionTitle color={accentColor} small>◎ Thompson's ε-NFA Construction</SectionTitle>
          </div>
          <AutomataCanvas
            states={nfaData.nfaObj.states}
            transitions={nfaData.nfaObj.transitions}
            positions={nfaData.positions}
            currentState={null}
            accentColor={accentColor}
          />
        </Card>
      )}

      {/* String tester */}
      <Card accentColor={accentColor}>
        <SectionTitle color={accentColor} small>▶ Test a String</SectionTitle>
        <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
          <input
            value={testInput}
            onChange={(e) => { setTestInput(e.target.value); setTestResult(null); }}
            onKeyDown={(e) => e.key === "Enter" && runTest()}
            placeholder={`e.g. ${alphabet?.join("") ?? "ab"}...`}
            spellCheck={false}
            style={inputStyle(accentColor)}
          />
          <button onClick={runTest} style={btnStyle(accentColor)}>
            Test ↵
          </button>
        </div>
        {testResult && (
          <div
            className="fade-in-up"
            style={{
              marginTop: 12,
              padding: "12px 16px",
              borderRadius: 10,
              background: testResult.error
                ? "#ff444411"
                : testResult.accepted
                ? "#22c55e14"
                : "#ef444414",
              border: `1px solid ${
                testResult.error ? "#ff444440" : testResult.accepted ? "#22c55e40" : "#ef444440"
              }`,
            }}
          >
            {testResult.error ? (
              <span style={{ color: "#ff6b6b", fontSize: 12 }}>⚠ {testResult.error}</span>
            ) : (
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: testResult.accepted ? "#22c55e" : "#ef4444",
                }}
              >
                {testResult.accepted ? "✓ ACCEPTED" : "✗ REJECTED"}
                <span style={{ fontSize: 11, color: "#6b7280", fontWeight: 400, marginLeft: 8 }}>
                  "{testResult.input}"
                </span>
              </span>
            )}
          </div>
        )}
      </Card>

      {/* AI test cases */}
      {testCases?.length > 0 && (
        <Card accentColor={accentColor}>
          <SectionTitle color={accentColor} small>✦ AI Test Cases</SectionTitle>
          <TestCaseTable cases={testCases} accentColor={accentColor} />
        </Card>
      )}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
/* Shared UI atoms                                                */
/* ═══════════════════════════════════════════════════════════════ */
function Card({ accentColor, children, style }) {
  return (
    <div
      style={{
        background: "#07071a",
        border: `1px solid ${accentColor}28`,
        borderRadius: 14,
        padding: "18px 20px",
        marginBottom: 16,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function SectionTitle({ color, children, small }) {
  return (
    <div
      style={{
        fontSize: small ? 11 : 12,
        fontWeight: 700,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color,
        marginBottom: small ? 0 : 10,
      }}
    >
      {children}
    </div>
  );
}

function Pill({ color, label }) {
  return (
    <span
      style={{
        background: `${color}18`,
        border: `1px solid ${color}40`,
        borderRadius: 20,
        padding: "3px 10px",
        fontSize: 10,
        color,
        fontWeight: 700,
        letterSpacing: "0.08em",
      }}
    >
      {label}
    </span>
  );
}

function ExampleChip({ label, color, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? `${color}18` : "transparent",
        border: `1px solid ${hovered ? color + "60" : "#1e1e35"}`,
        borderRadius: 20,
        padding: "3px 10px",
        color: hovered ? color : "#6b7280",
        fontFamily: "'Courier New', monospace",
        fontSize: 10,
        cursor: "pointer",
        transition: "all 0.15s",
        letterSpacing: "0.04em",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );
}

function Spinner({ color }) {
  return (
    <span
      style={{
        width: 12,
        height: 12,
        border: `2px solid ${color}30`,
        borderTopColor: color,
        borderRadius: "50%",
        display: "inline-block",
        animation: "spin 0.7s linear infinite",
        flexShrink: 0,
      }}
    />
  );
}

function TestCaseTable({ cases, accentColor }) {
  return (
    <div
      style={{
        marginTop: 10,
        border: "1px solid #1e1e35",
        borderRadius: 10,
        overflow: "hidden",
        fontSize: 11,
      }}
    >
      {/* header */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 80px 1fr",
          background: "#0c0c1a",
          padding: "8px 14px",
          color: "#4b5563",
          fontWeight: 700,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          fontSize: 9,
          gap: 8,
        }}
      >
        <span>Input</span>
        <span style={{ textAlign: "center" }}>Result</span>
        <span>Reason</span>
      </div>
      {cases.map((tc, i) => (
        <div
          key={i}
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 80px 1fr",
            padding: "8px 14px",
            borderTop: "1px solid #1e1e35",
            gap: 8,
            alignItems: "center",
            background: i % 2 === 0 ? "transparent" : "#07071a",
          }}
        >
          <span style={{ color: accentColor, fontFamily: "'Courier New', monospace" }}>
            {tc.input === "" ? <span style={{ color: "#4b5563" }}>ε (empty)</span> : `"${tc.input}"`}
          </span>
          <span
            style={{
              textAlign: "center",
              color: tc.accept ? "#22c55e" : "#ef4444",
              fontWeight: 700,
            }}
          >
            {tc.accept ? "✓ YES" : "✗ NO"}
          </span>
          <span style={{ color: "#6b7280" }}>{tc.reason}</span>
        </div>
      ))}
    </div>
  );
}

/* ── inline style helpers ─────────────────────────────────── */
function inputStyle(accentColor) {
  return {
    flex: 1,
    minWidth: 180,
    background: "#0c0c1a",
    border: `1.5px solid ${accentColor}40`,
    borderRadius: 8,
    color: "#e2e2f0",
    fontFamily: "'Courier New', monospace",
    fontSize: 13,
    padding: "9px 12px",
    outline: "none",
    transition: "border-color 0.2s, box-shadow 0.2s",
  };
}

function btnStyle(accentColor) {
  return {
    background: `${accentColor}18`,
    border: `1.5px solid ${accentColor}50`,
    borderRadius: 8,
    color: accentColor,
    fontFamily: "'Courier New', monospace",
    fontSize: 12,
    fontWeight: 700,
    padding: "9px 18px",
    cursor: "pointer",
    letterSpacing: "0.06em",
    whiteSpace: "nowrap",
    transition: "all 0.15s",
  };
}
