/**
 * AutomataCanvas
 * Generic SVG canvas for DFA / NFA / ε-NFA visualization.
 *
 * Props:
 *   automaton  — { states:[{id,label?,isStart,isAccept}], transitions:[{from,on,to}] }
 *   positions  — { [stateId]: [x, y] }
 *   mode       — "dfa" | "nfa"    (affects highlighting)
 *   activeStateId  — (DFA) currently highlighted state id
 *   activeStateIds — (NFA) set/array of currently highlighted state ids
 *   activeEdge     — { from, to, symbol } currently highlighted edge
 *   width, height  — SVG dimensions (default 840 × 340)
 */

import { useState } from "react";

const R = 26; // state circle radius
const ACCEPT_R = 22; // inner accept ring radius
const ARROW_SIZE = 8;
const SELF_LOOP_SIZE = 34;
const COLORS = {
  state: "#1e1e35",
  stateBorder: "#3b3b5c",
  stateActive: "#4f46e5",
  stateAccept: "#06b6d4",
  stateStart: "#7c3aed",
  label: "#e2e2f0",
  edge: "#3b3b5c",
  edgeActive: "#f59e0b",
  edgeLabel: "#9ca3af",
  edgeLabelActive: "#f59e0b",
  accept: "rgba(6,182,212,0.18)",
  start: "rgba(124,58,237,0.18)",
};

/* ── Arrow ────────────────────────────────────────────────── */
function ArrowMarker({ id, color }) {
  return (
    <marker
      id={id}
      markerWidth={ARROW_SIZE + 2}
      markerHeight={ARROW_SIZE + 2}
      refX={ARROW_SIZE}
      refY={(ARROW_SIZE + 2) / 2}
      orient="auto"
    >
      <path
        d={`M0,0 L0,${ARROW_SIZE + 2} L${ARROW_SIZE + 2},${(ARROW_SIZE + 2) / 2} z`}
        fill={color}
      />
    </marker>
  );
}

/* ── Utilities ────────────────────────────────────────────── */
function vec(ax, ay, bx, by) {
  return [bx - ax, by - ay];
}
function len([dx, dy]) {
  return Math.sqrt(dx * dx + dy * dy);
}
function unit([dx, dy]) {
  const l = len([dx, dy]) || 1;
  return [dx / l, dy / l];
}
function perp([dx, dy]) {
  return [-dy, dx];
}

/* ── Edge ─────────────────────────────────────────────────── */
function StraightEdge({ x1, y1, x2, y2, label, isActive, isBi }) {
  const d = vec(x1, y1, x2, y2);
  const u = unit(d);
  const l = len(d);
  const p = perp(u);

  // Offset for bidirectional edges
  const off = isBi ? 14 : 0;
  const ox = p[0] * off;
  const oy = p[1] * off;

  // Arrow tip endpoint (stop at circle edge)
  const ex = x2 - u[0] * R + ox;
  const ey = y2 - u[1] * R + oy;
  const sx = x1 + u[0] * R + ox;
  const sy = y1 + u[1] * R + oy;

  // Midpoint label
  const mx = (sx + ex) / 2 + p[0] * (off ? 0 : 6) - u[1] * 8;
  const my = (sy + ey) / 2 + p[1] * (off ? 0 : 6) + u[0] * 8;

  // Curve control
  const cx = (sx + ex) / 2 + p[0] * (off + 20);
  const cy = (sy + ey) / 2 + p[1] * (off + 20);

  const strokeColor = isActive ? COLORS.edgeActive : COLORS.edge;
  const markerId = isActive ? "arrowActive" : "arrow";

  return (
    <g>
      <path
        d={`M${sx},${sy} Q${cx},${cy} ${ex},${ey}`}
        fill="none"
        stroke={strokeColor}
        strokeWidth={isActive ? 2.5 : 1.5}
        markerEnd={`url(#${markerId})`}
        opacity={isActive ? 1 : 0.7}
      />
      <text
        x={mx}
        y={my}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={11}
        fill={isActive ? COLORS.edgeLabelActive : COLORS.edgeLabel}
        fontFamily="'Courier New', monospace"
        fontWeight={isActive ? "700" : "400"}
      >
        {label}
      </text>
    </g>
  );
}

function SelfLoop({ cx, cy, label, isActive }) {
  const strokeColor = isActive ? COLORS.edgeActive : COLORS.edge;
  const markerId = isActive ? "arrowActive" : "arrow";

  // Draw a loop above the state
  const lx = cx;
  const ly = cy - R;
  const loopPath = `M${lx - 12},${ly} C${lx - 28},${ly - SELF_LOOP_SIZE} ${lx + 28},${
    ly - SELF_LOOP_SIZE
  } ${lx + 12},${ly}`;

  return (
    <g>
      <path
        d={loopPath}
        fill="none"
        stroke={strokeColor}
        strokeWidth={isActive ? 2.5 : 1.5}
        markerEnd={`url(#${markerId})`}
        opacity={isActive ? 1 : 0.7}
      />
      <text
        x={lx}
        y={ly - SELF_LOOP_SIZE - 4}
        textAnchor="middle"
        dominantBaseline="auto"
        fontSize={11}
        fill={isActive ? COLORS.edgeLabelActive : COLORS.edgeLabel}
        fontFamily="'Courier New', monospace"
        fontWeight={isActive ? "700" : "400"}
      >
        {label}
      </text>
    </g>
  );
}

/* ── State ────────────────────────────────────────────────── */
function StateCircle({ state, x, y, isActive, isAccepting, isStart }) {
  const [hovered, setHovered] = useState(false);

  let fill = COLORS.state;
  let stroke = COLORS.stateBorder;
  if (isActive) {
    fill = "rgba(79,70,229,0.25)";
    stroke = COLORS.stateActive;
  } else if (isStart && isAccepting) {
    stroke = "#a855f7";
  } else if (isAccepting) {
    stroke = COLORS.stateAccept;
  } else if (isStart) {
    stroke = "#7c3aed";
  } else if (hovered) {
    stroke = "#6366f1";
  }

  return (
    <g
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ cursor: "default" }}
    >
      {/* Glow for active */}
      {isActive && (
        <circle cx={x} cy={y} r={R + 8} fill="rgba(99,102,241,0.15)" />
      )}
      {/* Accept ring background */}
      {isAccepting && (
        <circle
          cx={x}
          cy={y}
          r={R + 3}
          fill={isActive ? "rgba(79,70,229,0.25)" : COLORS.accept}
          stroke={stroke}
          strokeWidth={1.2}
          strokeDasharray="3,2"
        />
      )}
      {/* Main circle */}
      <circle
        cx={x}
        cy={y}
        r={R}
        fill={fill}
        stroke={stroke}
        strokeWidth={isActive ? 2.5 : 1.8}
      />
      {/* Label */}
      <text
        x={x}
        y={y}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={state.label?.length > 3 ? 9 : 11}
        fill={isActive ? "#c7d2fe" : COLORS.label}
        fontFamily="'Courier New', monospace"
        fontWeight={isActive ? "700" : "500"}
      >
        {state.label || state.id}
      </text>
    </g>
  );
}

/* ── Main Component ───────────────────────────────────────── */
export default function AutomataCanvas({
  automaton,
  positions = {},
  mode = "dfa",
  activeStateId = null,
  activeStateIds = null,
  activeEdge = null,
  width = 840,
  height = 340,
}) {
  if (!automaton || !automaton.states || automaton.states.length === 0) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 160,
          color: "#374151",
          fontSize: 13,
          border: "1px dashed #1e1e35",
          borderRadius: 12,
        }}
      >
        No automaton to display.
      </div>
    );
  }

  const { states, transitions } = automaton;

  // Group transitions by (from, to) for label concatenation
  const edgeMap = new Map(); // key "from|to" → [labels]
  for (const t of transitions) {
    const key = `${t.from}|${t.to}`;
    if (!edgeMap.has(key)) edgeMap.set(key, []);
    edgeMap.get(key).push(t.on);
  }

  // Check which pairs are bidirectional
  const biSet = new Set();
  for (const [key] of edgeMap) {
    const [f, t] = key.split("|");
    if (edgeMap.has(`${t}|${f}`)) {
      biSet.add(key);
    }
  }

  // Active set
  const activeSet =
    mode === "nfa" && activeStateIds
      ? new Set(activeStateIds)
      : activeStateId
      ? new Set([activeStateId])
      : new Set();

  const svgW = width;
  const svgH = height;
  const viewBox = `0 0 ${svgW} ${svgH}`;

  return (
    <div style={{ overflowX: "auto" }}>
      <svg
        viewBox={viewBox}
        width="100%"
        style={{ display: "block", maxWidth: svgW, margin: "0 auto" }}
      >
        <defs>
          <ArrowMarker id="arrow" color={COLORS.edge} />
          <ArrowMarker id="arrowActive" color={COLORS.edgeActive} />
        </defs>

        {/* ── Edges ── */}
        {[...edgeMap.entries()].map(([key, symbols]) => {
          const [fromId, toId] = key.split("|");
          const pos1 = positions[fromId];
          const pos2 = positions[toId];
          if (!pos1 || !pos2) return null;

          const label = symbols.join(",");
          const isBi = biSet.has(key);

          // Check if active edge
          let isActive = false;
          if (activeEdge) {
            isActive =
              activeEdge.from === fromId &&
              activeEdge.to === toId &&
              symbols.includes(activeEdge.symbol);
          }

          if (fromId === toId) {
            return (
              <SelfLoop
                key={key}
                cx={pos1[0]}
                cy={pos1[1]}
                label={label}
                isActive={isActive}
              />
            );
          }
          return (
            <StraightEdge
              key={key}
              x1={pos1[0]}
              y1={pos1[1]}
              x2={pos2[0]}
              y2={pos2[1]}
              label={label}
              isActive={isActive}
              isBi={isBi}
            />
          );
        })}

        {/* ── States ── */}
        {states.map((state) => {
          const pos = positions[state.id];
          if (!pos) return null;
          const [x, y] = pos;
          const isActive = activeSet.has(state.id);

          // Start state arrow
          const startArrow = state.isStart ? (
            <g key={`start_${state.id}`}>
              <line
                x1={x - R - 30}
                y1={y}
                x2={x - R - 2}
                y2={y}
                stroke="#7c3aed"
                strokeWidth={1.8}
                markerEnd="url(#arrow)"
              />
            </g>
          ) : null;

          return (
            <g key={state.id}>
              {startArrow}
              <StateCircle
                state={state}
                x={x}
                y={y}
                isActive={isActive}
                isAccepting={state.isAccept}
                isStart={state.isStart}
              />
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div
        style={{
          display: "flex",
          gap: 20,
          flexWrap: "wrap",
          justifyContent: "center",
          marginTop: 10,
          fontSize: 10,
          color: "#6b7280",
          fontFamily: "'Courier New', monospace",
        }}
      >
        <LegendItem color="#7c3aed" dashed={false} label="Start state" />
        <LegendItem color="#06b6d4" dashed={true} label="Accept state (double ring)" />
        <LegendItem color="#4f46e5" dashed={false} label="Active state" />
        <LegendItem color="#f59e0b" dashed={false} label="Active transition" />
      </div>
    </div>
  );
}

function LegendItem({ color, dashed, label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
      <svg width={18} height={14}>
        <circle
          cx={9}
          cy={7}
          r={6}
          fill="none"
          stroke={color}
          strokeWidth={1.5}
          strokeDasharray={dashed ? "2,2" : "none"}
        />
      </svg>
      <span>{label}</span>
    </div>
  );
}
