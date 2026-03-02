/**
 * Regular Expression Section
 * - Input a regex
 * - Validate syntax
 * - Convert to ε-NFA via Thompson's construction
 * - Visualize
 */

import { useState, useCallback } from "react";
import { validateRegex, regexToNFA, testRegex } from "../utils/reEngine.js";
import { computeAutomataLayout } from "../utils/nfaEngine.js";
import AutomataCanvas from "./AutomataCanvas.jsx";

const ACCENT = "#f472b6";
const GRAD_FROM = "#be185d";
const GRAD_TO = "#9d174d";

/* ── Examples ─────────────────────────────────────────────── */
const EXAMPLES = [
  { label: "(a|b)*abb", desc: "binary strings ending in abb" },
  { label: "a*b*", desc: "zero or more a's followed by zero or more b's" },
  { label: "(0|1)*01", desc: "bit strings ending in 01" },
  { label: "a(b|c)*d", desc: "starts with a, ends with d" },
  { label: "(ab)+", desc: "one or more repetitions of ab" },
  { label: "a?b*c", desc: "optional a, any b's, then c" },
];

/* ── Regex Cheatsheet ─────────────────────────────────────── */
const SYNTAX = [
  ["a, b, 0, …", "Literal character"],
  ["AB", "Concatenation: A followed by B"],
  ["A|B", "Union: A or B"],
  ["A*", "Kleene star: zero or more A"],
  ["A+", "Plus: one or more A"],
  ["A?", "Optional: zero or one A"],
  ["(A)", "Grouping"],
  [".", "Any single character"],
  ["ε or 𝜀", "The empty string"],
  ["\\*", "Escaped meta-character"],
];

/* ── Test String Tester ───────────────────────────────────── */
function RegexTester({ re, isValid }) {
  const [input, setInput] = useState("");
  const [results, setResults] = useState([]);
  const [batch, setBatch] = useState("");
  const [showBatch, setShowBatch] = useState(false);

  function testSingle() {
    if (!re || !isValid) return;
    const r = testRegex(re, input);
    setResults((prev) => [
      { input, ...r, id: Date.now() },
      ...prev.slice(0, 9),
    ]);
  }

  function testBatch() {
    if (!re || !isValid) return;
    const lines = batch
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    const newResults = lines.map((inp) => ({
      input: inp,
      ...testRegex(re, inp),
      id: Math.random(),
    }));
    setResults(newResults);
  }

  return (
    <div>
      {/* Single tester */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <label style={{ ...labelStyle, color: ACCENT }}>Test a string</label>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && testSingle()}
            placeholder="Enter string to test…"
            style={inputStyle}
          />
        </div>
        <button
          onClick={testSingle}
          disabled={!isValid}
          style={{
            ...btnStyle,
            background: isValid
              ? `linear-gradient(135deg,${GRAD_FROM},${GRAD_TO})`
              : "#1e1e35",
            opacity: isValid ? 1 : 0.5,
          }}
        >
          Test
        </button>
        <button
          onClick={() => setShowBatch((v) => !v)}
          style={{ ...btnStyle, background: "#1e1e35", color: ACCENT }}
        >
          {showBatch ? "Hide" : "Batch Test"}
        </button>
      </div>

      {/* Batch */}
      {showBatch && (
        <div style={{ marginTop: 12 }}>
          <label style={{ ...labelStyle, color: ACCENT }}>
            Batch test (one string per line)
          </label>
          <textarea
            value={batch}
            onChange={(e) => setBatch(e.target.value)}
            rows={5}
            placeholder={"abc\nab\na\n"}
            style={{ ...inputStyle, resize: "vertical" }}
          />
          <button
            onClick={testBatch}
            disabled={!isValid}
            style={{
              ...btnStyle,
              marginTop: 8,
              background: `linear-gradient(135deg,${GRAD_FROM},${GRAD_TO})`,
            }}
          >
            Run Batch
          </button>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div style={{ marginTop: 12 }}>
          {results.map((r) => (
            <div
              key={r.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "6px 12px",
                borderRadius: 6,
                marginBottom: 4,
                background: r.accepted ? "rgba(244,114,182,0.08)" : "rgba(239,68,68,0.06)",
                border: `1px solid ${r.accepted ? "#f472b680" : "#ef444440"}`,
                fontFamily: "'Courier New', monospace",
                fontSize: 12,
              }}
            >
              <span style={{ color: "#e2e2f0" }}>
                "{r.input === "" ? <em>ε</em> : r.input}"
              </span>
              <span
                style={{
                  color: r.accepted ? ACCENT : "#fca5a5",
                  fontWeight: 700,
                }}
              >
                {r.accepted ? "✓ ACCEPTED" : "✗ REJECTED"}
              </span>
            </div>
          ))}
          {results.length > 1 && (
            <button
              style={{ ...btnStyle, background: "#1e1e35", color: "#374151", fontSize: 10, marginTop: 4 }}
              onClick={() => setResults([])}
            >
              Clear results
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Main Component ───────────────────────────────────────── */
export default function RESection() {
  const [re, setRe] = useState("");
  const [validation, setValidation] = useState(null);
  const [nfa, setNfa] = useState(null);
  const [positions, setPositions] = useState({});
  const [showCheatsheet, setShowCheatsheet] = useState(false);
  const [converting, setConverting] = useState(false);

  const handleValidate = useCallback(() => {
    if (!re.trim()) {
      setValidation({ valid: false, error: "Expression is empty." });
      setNfa(null);
      return;
    }
    const result = validateRegex(re);
    setValidation(result);
    setNfa(null);
    setPositions({});
  }, [re]);

  const handleConvert = useCallback(() => {
    if (!re.trim()) return;
    const vr = validateRegex(re);
    setValidation(vr);
    if (!vr.valid) { setNfa(null); return; }

    setConverting(true);
    try {
      const nfaObj = regexToNFA(re);
      setNfa(nfaObj);
      setPositions(computeAutomataLayout(nfaObj.states, nfaObj.transitions, 960, 380));
    } catch (e) {
      setValidation({ valid: false, error: `Conversion failed: ${e.message}` });
      setNfa(null);
    }
    setConverting(false);
  }, [re]);

  function handleKeyDown(e) {
    if (e.key === "Enter" && e.ctrlKey) handleConvert();
  }

  function loadExample(ex) {
    setRe(ex.label);
    setValidation(null);
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
              background: ACCENT,
              boxShadow: `0 0 8px ${ACCENT}`,
            }}
          />
          <h2
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 800,
              letterSpacing: "-0.02em",
              background: `linear-gradient(135deg,#fff,${ACCENT})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Regular Expressions
          </h2>
        </div>
        <p style={{ color: "#6b7280", fontSize: 13, margin: 0 }}>
          Enter a regular expression, validate its syntax, then convert it to an
          ε-NFA using Thompson's construction.
        </p>
      </div>

      {/* Theory */}
      <div style={{ ...theoryBox, borderLeftColor: ACCENT }}>
        <strong style={{ color: ACCENT }}>Thompson's Construction</strong>
        <p style={{ margin: "6px 0 0", fontSize: 12, color: "#6b7280", lineHeight: 1.7 }}>
          Thompson's algorithm inductively builds an ε-NFA from a regular
          expression. Base cases: ∅, ε, and each literal character. Inductive
          steps: union (A|B), concatenation (AB), and Kleene star (A*). The
          resulting automaton has exactly one start and one accept state and
          recognises the same language as the regular expression.
        </p>
      </div>

      {/* Syntax Reference toggle */}
      <div style={{ marginBottom: 16 }}>
        <button
          style={{ ...btnStyle, background: "#1e1e35", color: ACCENT, fontSize: 11 }}
          onClick={() => setShowCheatsheet((v) => !v)}
        >
          {showCheatsheet ? "▲ Hide" : "▼ Syntax Reference"}
        </button>
        {showCheatsheet && (
          <div style={{ marginTop: 10, overflowX: "auto" }}>
            <table style={tblStyle}>
              <thead>
                <tr>
                  <th style={{ ...thStyle, textAlign: "left" }}>Syntax</th>
                  <th style={{ ...thStyle, textAlign: "left" }}>Meaning</th>
                </tr>
              </thead>
              <tbody>
                {SYNTAX.map(([syn, meaning]) => (
                  <tr key={syn}>
                    <td
                      style={{
                        ...tdStyle,
                        textAlign: "left",
                        color: ACCENT,
                        fontFamily: "'Courier New', monospace",
                      }}
                    >
                      {syn}
                    </td>
                    <td style={{ ...tdStyle, textAlign: "left", color: "#9ca3af" }}>
                      {meaning}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Input card */}
      <div style={card}>
        <SectionLabel step="1">Enter Regular Expression</SectionLabel>

        <div style={{ position: "relative" }}>
          <input
            type="text"
            value={re}
            onChange={(e) => { setRe(e.target.value); setValidation(null); }}
            onKeyDown={handleKeyDown}
            placeholder="e.g. (a|b)*abb   — Ctrl+Enter to convert"
            style={{
              ...inputStyle,
              fontSize: 16,
              padding: "12px 14px",
              letterSpacing: "0.05em",
              borderColor: validation
                ? validation.valid
                  ? "#a78bfa"
                  : "#ef4444"
                : "#2a2a42",
            }}
            spellCheck={false}
          />
        </div>

        {/* Validation feedback */}
        {validation && (
          <div style={{ marginTop: 10 }}>
            {validation.valid ? (
              <span style={{ color: "#a78bfa", fontSize: 12 }}>
                ✓ Syntax is valid
              </span>
            ) : (
              <span style={{ color: "#ef4444", fontSize: 12 }}>
                ✗ {validation.error}
              </span>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            onClick={handleValidate}
            style={{ ...btnStyle, background: "#2a1f3d", color: ACCENT, border: `1px solid ${ACCENT}40` }}
          >
            Validate Syntax
          </button>
          <button
            onClick={handleConvert}
            disabled={converting}
            style={{
              ...btnStyle,
              background: `linear-gradient(135deg,${GRAD_FROM},${GRAD_TO})`,
            }}
          >
            {converting ? "Converting…" : "✦ Convert to ε-NFA"}
          </button>
        </div>

        {/* Examples */}
        <div style={{ marginTop: 14 }}>
          <span
            style={{
              fontSize: 10,
              color: "#374151",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              marginRight: 8,
            }}
          >
            Examples →
          </span>
          {EXAMPLES.map((ex) => (
            <ExampleChip key={ex.label} label={ex.label} onClick={() => loadExample(ex)} />
          ))}
        </div>
      </div>

      {/* ε-NFA Diagram */}
      {nfa && (
        <div style={card}>
          <SectionLabel>Generated ε-NFA (Thompson's Construction)</SectionLabel>
          <div
            style={{
              marginBottom: 10,
              padding: "8px 12px",
              background: "#0a0a18",
              borderRadius: 8,
              border: "1px solid #1e1e35",
              fontSize: 12,
              color: "#6b7280",
              fontFamily: "'Courier New', monospace",
            }}
          >
            States: <span style={{ color: "#c7d2fe" }}>{nfa.states.length}</span>
            {"  ·  "}Alphabet: <span style={{ color: "#67e8f9" }}>
              {"{"}
              {nfa.alphabet.join(", ")}
              {"}"}
            </span>
            {"  ·  "}Transitions:{" "}
            <span style={{ color: "#fbbf24" }}>{nfa.transitions.length}</span>
            {"  ·  (includes ε-transitions)"}
          </div>
          <AutomataCanvas
            automaton={nfa}
            positions={positions}
            mode="nfa"
            width={960}
            height={380}
          />
          <div
            style={{
              marginTop: 10,
              fontSize: 11,
              color: "#374151",
              textAlign: "center",
            }}
          >
            States named s0, s1, … are Thompson's intermediate states. Double
            ring = accept state. Arrow = start state.
          </div>
        </div>
      )}

      {/* String Tester */}
      {(validation?.valid || nfa) && (
        <div style={card}>
          <SectionLabel>Test Strings Against RE</SectionLabel>
          <RegexTester re={re} isValid={!!validation?.valid || !!nfa} />
        </div>
      )}
    </div>
  );
}

/* ── Sub-components ───────────────────────────────────────── */
function SectionLabel({ step, children }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        fontSize: 10,
        color: ACCENT,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        marginBottom: 14,
      }}
    >
      {step && (
        <span
          style={{
            background: ACCENT,
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
          background: `linear-gradient(90deg,${ACCENT}33,transparent)`,
        }}
      />
    </div>
  );
}

function ExampleChip({ label, onClick }) {
  const [h, setH] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        background: "#13131f",
        border: `1px solid ${h ? ACCENT : "#1e1e35"}`,
        borderRadius: 100,
        padding: "3px 10px",
        fontSize: 11,
        color: h ? ACCENT : "#6b7280",
        cursor: "pointer",
        fontFamily: "'Courier New', monospace",
        transition: "all 0.15s",
        marginRight: 6,
        marginBottom: 4,
      }}
    >
      {label}
    </button>
  );
}

/* ── Styles ───────────────────────────────────────────────── */
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
  borderLeft: "3px solid",
  borderRadius: 10,
  padding: "12px 16px",
  marginBottom: 16,
  fontSize: 12,
};

const inputStyle = {
  background: "#13131f",
  border: "1px solid #2a2a42",
  borderRadius: 8,
  padding: "8px 12px",
  color: "#e2e2f0",
  fontFamily: "'Courier New', monospace",
  fontSize: 13,
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
};

const labelStyle = {
  fontSize: 10,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  marginBottom: 5,
  display: "block",
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
  padding: "6px 12px",
  background: "#0c0c1a",
  color: "#6366f1",
  fontWeight: 700,
};

const tdStyle = {
  border: "1px solid #1e1e35",
  padding: "6px 12px",
  color: "#e2e2f0",
};
