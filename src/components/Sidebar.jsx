/**
 * Sidebar Navigation
 * Desktop : collapsible via ◀/▶ toggle (existing behaviour)
 * Mobile  : hidden by default; slides in as a fixed overlay when
 *           `mobileOpen` is true (triggered by hamburger in App.jsx)
 */

import { useState, useEffect } from "react";

const SECTIONS = [
  {
    id: "dfa",
    label: "DFA",
    sublabel: "Deterministic FA",
    icon: "◈",
    color: "#6366f1",
    glow: "rgba(99,102,241,0.3)",
  },
  {
    id: "nfa",
    label: "NFA",
    sublabel: "Nondeterministic FA",
    icon: "◉",
    color: "#06b6d4",
    glow: "rgba(6,182,212,0.3)",
  },
  {
    id: "enfa",
    label: "ε-NFA",
    sublabel: "Epsilon NFA",
    icon: "◎",
    color: "#a78bfa",
    glow: "rgba(167,139,250,0.3)",
  },
  {
    id: "re",
    label: "RE",
    sublabel: "Regular Expressions",
    icon: "✦",
    color: "#f472b6",
    glow: "rgba(244,114,182,0.3)",
  },
];

const MOBILE_BREAKPOINT = 768;

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth <= MOBILE_BREAKPOINT : false
  );
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
}

export default function Sidebar({
  active,
  onChange,
  collapsed,
  setCollapsed,
  mobileOpen = false,
  onMobileClose = () => {},
}) {
  const isMobile = useIsMobile();

  function handleChange(id) {
    onChange(id);
    if (isMobile) onMobileClose();
  }

  /* ── Mobile overlay ──────────────────────────────────── */
  if (isMobile) {
    return (
      <>
        {mobileOpen && (
          <div
            onClick={onMobileClose}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.65)",
              zIndex: 99,
              backdropFilter: "blur(2px)",
            }}
          />
        )}
        <aside
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            height: "100vh",
            width: 240,
            background: "#07071a",
            borderRight: "1px solid #1e1e35",
            display: "flex",
            flexDirection: "column",
            zIndex: 100,
            transform: mobileOpen ? "translateX(0)" : "translateX(-100%)",
            transition: "transform 0.26s cubic-bezier(0.4,0,0.2,1)",
            overflowY: "auto",
          }}
        >
          <div
            style={{
              padding: "20px 18px 16px",
              borderBottom: "1px solid #1e1e35",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              minHeight: 64,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 900,
                  letterSpacing: "0.12em",
                  background: "linear-gradient(135deg,#fff,#a5b4fc)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                AUTOMATA
              </div>
              <div style={{ fontSize: 9, color: "#374151", letterSpacing: "0.15em" }}>
                PRACTICE SYSTEM
              </div>
            </div>
            <button
              onClick={onMobileClose}
              style={{
                background: "none",
                border: "1px solid #1e1e35",
                borderRadius: 6,
                color: "#6b7280",
                cursor: "pointer",
                width: 28,
                height: 28,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 14,
                flexShrink: 0,
              }}
            >
              ✕
            </button>
          </div>
          <nav style={{ padding: "12px 8px", flex: 1 }}>
            <div
              style={{
                fontSize: 9,
                color: "#374151",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                padding: "0 8px",
                marginBottom: 8,
              }}
            >
              Sections
            </div>
            {SECTIONS.map((sec) => (
              <NavItem
                key={sec.id}
                section={sec}
                isActive={active === sec.id}
                collapsed={false}
                onClick={() => handleChange(sec.id)}
              />
            ))}
          </nav>
          <div
            style={{
              borderTop: "1px solid #1e1e35",
              padding: "14px 18px",
              fontSize: 10,
              color: "#374151",
              lineHeight: 1.7,
            }}
          >
            <div style={{ color: "#4b5563" }}>crafted by</div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                background: "linear-gradient(135deg,#a5b4fc,#67e8f9)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                letterSpacing: "0.02em",
              }}
            >
              Suraj Wakhure
            </div>
            <div style={{ marginTop: 2, fontSize: 9, color: "#374151" }}>
              React · Vite · © {new Date().getFullYear()}
            </div>
          </div>
        </aside>
      </>
    );
  }

  /* ── Desktop collapsible ─────────────────────────────── */
  const w = collapsed ? 60 : 220;

  return (
    <aside
      style={{
        width: w,
        minWidth: w,
        height: "100vh",
        background: "#07071a",
        borderRight: "1px solid #1e1e35",
        display: "flex",
        flexDirection: "column",
        transition: "width 0.25s ease, min-width 0.25s ease",
        overflow: "hidden",
        zIndex: 10,
        position: "relative",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          padding: collapsed ? "22px 0" : "22px 18px 16px",
          borderBottom: "1px solid #1e1e35",
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "space-between",
          gap: 8,
          minHeight: 64,
        }}
      >
        {!collapsed && (
          <div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 900,
                letterSpacing: "0.12em",
                background: "linear-gradient(135deg,#fff,#a5b4fc)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              AUTOMATA
            </div>
            <div style={{ fontSize: 9, color: "#374151", letterSpacing: "0.15em" }}>
              PRACTICE SYSTEM
            </div>
          </div>
        )}
        <button
          onClick={() => setCollapsed((v) => !v)}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          style={{
            background: "none",
            border: "1px solid #1e1e35",
            borderRadius: 6,
            color: "#374151",
            cursor: "pointer",
            width: 28,
            height: 28,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            flexShrink: 0,
            transition: "color 0.15s, border-color 0.15s",
          }}
        >
          {collapsed ? "▶" : "◀"}
        </button>
      </div>

      <nav style={{ padding: collapsed ? "12px 0" : "12px 8px", flex: 1 }}>
        {!collapsed && (
          <div
            style={{
              fontSize: 9,
              color: "#374151",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              padding: "0 8px",
              marginBottom: 8,
            }}
          >
            Sections
          </div>
        )}
        {SECTIONS.map((sec) => (
          <NavItem
            key={sec.id}
            section={sec}
            isActive={active === sec.id}
            collapsed={collapsed}
            onClick={() => handleChange(sec.id)}
          />
        ))}
      </nav>

      {!collapsed && (
        <div
          style={{
            borderTop: "1px solid #1e1e35",
            padding: "14px 18px",
            fontSize: 10,
            color: "#374151",
            lineHeight: 1.7,
          }}
        >
          <div style={{ color: "#4b5563" }}>crafted by</div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              background: "linear-gradient(135deg,#a5b4fc,#67e8f9)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              letterSpacing: "0.02em",
            }}
          >
            Suraj Wakhure
          </div>
          <div style={{ marginTop: 2, fontSize: 9, color: "#374151" }}>
            React · Vite · © {new Date().getFullYear()}
          </div>
        </div>
      )}
    </aside>
  );
}

function NavItem({ section, isActive, collapsed, onClick }) {
  const [hovered, setHovered] = useState(false);
  const active = isActive || hovered;

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={collapsed ? `${section.label} — ${section.sublabel}` : undefined}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        width: "100%",
        padding: collapsed ? "10px 0" : "9px 12px",
        justifyContent: collapsed ? "center" : "flex-start",
        background: isActive ? `${section.color}14` : "transparent",
        border: `1px solid ${isActive ? `${section.color}40` : "transparent"}`,
        borderRadius: 10,
        cursor: "pointer",
        marginBottom: 4,
        transition: "all 0.15s",
        textAlign: "left",
        boxShadow: isActive ? `0 0 12px ${section.glow}` : "none",
        color: active ? section.color : "#6b7280",
      }}
    >
      <span
        style={{
          fontSize: 18,
          lineHeight: 1,
          color: active ? section.color : "#4b5563",
          textShadow: isActive ? `0 0 8px ${section.glow}` : "none",
          flexShrink: 0,
          width: 22,
          textAlign: "center",
          transition: "color 0.15s",
        }}
      >
        {section.icon}
      </span>

      {!collapsed && (
        <div style={{ overflow: "hidden" }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: isActive ? 700 : 500,
              letterSpacing: "0.04em",
              fontFamily: "'Courier New', monospace",
              color: active ? section.color : "#9ca3af",
              transition: "color 0.15s",
            }}
          >
            {section.label}
          </div>
          <div
            style={{
              fontSize: 9,
              color: active ? `${section.color}aa` : "#374151",
              letterSpacing: "0.06em",
              transition: "color 0.15s",
            }}
          >
            {section.sublabel}
          </div>
        </div>
      )}

      {isActive && !collapsed && (
        <div
          style={{
            marginLeft: "auto",
            width: 4,
            height: 4,
            borderRadius: "50%",
            background: section.color,
            boxShadow: `0 0 6px ${section.color}`,
            flexShrink: 0,
          }}
        />
      )}
    </button>
  );
}
