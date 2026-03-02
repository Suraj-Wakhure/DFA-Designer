import { useState } from "react";
import Sidebar from "./components/Sidebar.jsx";
import DFASection from "./components/DFASection.jsx";
import NFASection from "./components/NFASection.jsx";
import RESection from "./components/RESection.jsx";
import DFADesigner from "./components/DFADesigner.jsx";
import AIAutomataMode from "./components/AIAutomataMode.jsx";
import { NFA_EXAMPLES, RE_EXAMPLES } from "./constants.js";
import {
  generateNFAFromPrompt,
  generateENFAFromPrompt,
  generateREFromPrompt,
} from "./services/api.js";

export default function App() {
  const [activeSection, setActiveSection] = useState("dfa");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Per-section modes
  const [dfaMode, setDfaMode] = useState("diy");
  const [nfaMode, setNfaMode] = useState("diy");
  const [enfaMode, setEnfaMode] = useState("diy");
  const [reMode, setReMode] = useState("diy");

  const modeMap = {
    dfa: [dfaMode, setDfaMode],
    nfa: [nfaMode, setNfaMode],
    enfa: [enfaMode, setEnfaMode],
    re: [reMode, setReMode],
  };
  const [currentMode] = modeMap[activeSection];

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        background: "#06060f",
        color: "#e2e2f0",
        fontFamily: "'Courier New', Courier, monospace",
        overflow: "hidden",
      }}
    >
      {/* Ambient glow blobs */}
      <div style={blob1} />
      <div style={blob2} />

      {/* Sidebar */}
      <Sidebar
        active={activeSection}
        onChange={(id) => setActiveSection(id)}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* Main content */}
      <main
        style={{
          flex: 1,
          minWidth: 0,
          overflowY: "auto",
          overflowX: "hidden",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Top bar */}
        <div
          style={{
            borderBottom: "1px solid #1e1e35",
            padding: "0 clamp(14px, 3vw, 28px)",
            height: 56,
            display: "flex",
            alignItems: "center",
            gap: 12,
            background: "rgba(6,6,15,0.92)",
            backdropFilter: "blur(10px)",
            position: "sticky",
            top: 0,
            zIndex: 20,
          }}
        >
          {/* Hamburger (mobile only) */}
          <button
            onClick={() => setMobileOpen(true)}
            className="hamburger-btn"
            aria-label="Open menu"
            style={{
              background: "none",
              border: "1px solid #1e1e35",
              borderRadius: 6,
              color: "#9ca3af",
              cursor: "pointer",
              width: 32,
              height: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
              flexShrink: 0,
            }}
          >
            ☰
          </button>

          {/* Section label */}
          <div
            style={{
              fontSize: 11,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: SECTION_COLORS[activeSection],
              fontWeight: 700,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              flex: "0 1 auto",
            }}
          >
            <span className="section-title-full">{SECTION_TITLES[activeSection]}</span>
            <span className="section-title-short">{activeSection.toUpperCase()}</span>
          </div>

          {/* Divider */}
          <div
            style={{
              height: 1,
              flex: 1,
              minWidth: 16,
              background: `linear-gradient(90deg,${SECTION_COLORS[activeSection]}40,transparent)`,
            }}
          />

          {/* Mode toggle for active section */}
          <ModeToggle
            section={activeSection}
            mode={currentMode}
            setMode={modeMap[activeSection][1]}
            color={SECTION_COLORS[activeSection]}
          />
        </div>

        {/* Section content */}
        <div style={{ padding: "clamp(14px,3vw,28px) clamp(14px,3vw,28px) 80px" }}>
          {/* DFA */}
          {activeSection === "dfa" && dfaMode === "diy" && <DFASection />}
          {activeSection === "dfa" && dfaMode === "ai" && <DFADesignerWrapper />}

          {/* NFA */}
          {activeSection === "nfa" && nfaMode === "diy" && <NFASection isEpsilonNFA={false} />}
          {activeSection === "nfa" && nfaMode === "ai" && (
            <AIAutomataMode
              type="nfa"
              accentColor={SECTION_COLORS.nfa}
              examples={NFA_EXAMPLES}
              apiCall={generateNFAFromPrompt}
            />
          )}

          {/* ε-NFA */}
          {activeSection === "enfa" && enfaMode === "diy" && <NFASection isEpsilonNFA={true} />}
          {activeSection === "enfa" && enfaMode === "ai" && (
            <AIAutomataMode
              type="enfa"
              accentColor={SECTION_COLORS.enfa}
              examples={NFA_EXAMPLES}
              apiCall={generateENFAFromPrompt}
            />
          )}

          {/* RE */}
          {activeSection === "re" && reMode === "diy" && <RESection />}
          {activeSection === "re" && reMode === "ai" && (
            <AIAutomataMode
              type="re"
              accentColor={SECTION_COLORS.re}
              examples={RE_EXAMPLES}
              apiCall={generateREFromPrompt}
            />
          )}
        </div>
      </main>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse-dot {
          0%,100% { opacity:1; transform:scale(1); }
          50% { opacity:0.35; transform:scale(0.6); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes fade-in-up {
          from { opacity:0; transform:translateY(14px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .fade-in-up { animation: fade-in-up 0.35s ease both; }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #0c0c1a; }
        ::-webkit-scrollbar-thumb { background: #1e1e35; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #2a2a42; }
        input:focus, textarea:focus { border-color: inherit !important; }

        /* Hamburger: desktop hidden, mobile shown */
        .hamburger-btn { display: none !important; }
        @media (max-width: 768px) {
          .hamburger-btn { display: flex !important; }
        }

        /* Section title abbreviation on small screens */
        .section-title-short { display: none; }
        @media (max-width: 520px) {
          .section-title-full { display: none; }
          .section-title-short { display: inline; }
        }

        /* Touch-friendly tap targets */
        @media (max-width: 768px) {
          button { min-height: 36px; }
        }
      `}</style>
    </div>
  );
}

/* ── DFA Designer wrapper ─────────────────────────────── */
function DFADesignerWrapper() {
  return (
    <div style={{ marginTop: -8 }}>
      <DFADesigner embedded />
    </div>
  );
}

/* ── Mode Toggle ──────────────────────────────────────── */
function ModeToggle({ section, mode, setMode, color }) {
  return (
    <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
      <ModeBtn active={mode === "diy"} color={color} onClick={() => setMode("diy")}>
        DIY
      </ModeBtn>
      <ModeBtn active={mode === "ai"} color={color} onClick={() => setMode("ai")}>
        ✦ AI
      </ModeBtn>
    </div>
  );
}

function ModeBtn({ active, color, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? `${color}18` : "transparent",
        border: `1px solid ${active ? `${color}60` : "#1e1e35"}`,
        borderRadius: 6,
        padding: "4px 11px",
        color: active ? color : "#6b7280",
        fontFamily: "'Courier New', monospace",
        fontSize: 10,
        fontWeight: active ? 700 : 400,
        cursor: "pointer",
        letterSpacing: "0.06em",
        transition: "all 0.15s",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </button>
  );
}

/* ── Constants ────────────────────────────────────────── */
const SECTION_COLORS = {
  dfa: "#6366f1",
  nfa: "#06b6d4",
  enfa: "#a78bfa",
  re: "#f472b6",
};

const SECTION_TITLES = {
  dfa: "DFA — Deterministic Finite Automaton",
  nfa: "NFA — Nondeterministic Finite Automaton",
  enfa: "ε-NFA — Epsilon Nondeterministic Finite Automaton",
  re: "RE — Regular Expressions & Thompson's Construction",
};

const blob1 = {
  position: "fixed",
  width: 700,
  height: 700,
  borderRadius: "50%",
  background: "radial-gradient(circle,rgba(99,102,241,0.06) 0%,transparent 70%)",
  top: -250,
  left: -200,
  pointerEvents: "none",
  zIndex: 0,
};

const blob2 = {
  position: "fixed",
  width: 600,
  height: 600,
  borderRadius: "50%",
  background: "radial-gradient(circle,rgba(6,182,212,0.04) 0%,transparent 70%)",
  bottom: -200,
  right: -100,
  pointerEvents: "none",
  zIndex: 0,
};
