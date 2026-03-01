const R = 28; // state circle radius
const SVG_W = 880;
const SVG_H = 360;

export default function DFACanvas({ dfa, positions, curStateId, activeEdge, isDone, accepted }) {
  if (!dfa) return null;

  // Group transitions by (from, to) so we can display combined labels
  const edgeMap = {};
  dfa.transitions.forEach((t) => {
    const key = `${t.from}||${t.to}`;
    if (!edgeMap[key]) edgeMap[key] = { from: t.from, to: t.to, symbols: [] };
    edgeMap[key].symbols.push(t.on);
  });

  // Legend
  const legendItems = [
    { label: "Regular", stroke: "#2a2a42", fill: "#0f0f1e" },
    { label: "Accept",  stroke: "#10b981", fill: "#052e16" },
    { label: "Current", stroke: "#6366f1", fill: "#1e1b4b" },
    { label: "Trap",    stroke: "#374151", fill: "#0d0d17" },
  ];

  return (
    <div>
      {/* Legend */}
      <div style={{ display: "flex", gap: 18, marginBottom: 12, flexWrap: "wrap" }}>
        {legendItems.map(({ label, stroke, fill }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, color: "#4b5563" }}>
            <svg width={18} height={18}>
              <circle cx={9} cy={9} r={7} fill={fill} stroke={stroke} strokeWidth={1.5} />
            </svg>
            {label}
          </div>
        ))}
      </div>

      <svg
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        style={{ width: "100%", display: "block", background: "#06060f", borderRadius: 10, border: "1px solid #12121e" }}
      >
        <defs>
          <ArrowMarker id="arr-normal"  color="#3a3a60" />
          <ArrowMarker id="arr-active"  color="#6366f1" />
          <ArrowMarker id="arr-accept"  color="#10b981" />
          <ArrowMarker id="arr-done-ok" color="#10b981" />
          <ArrowMarker id="arr-done-no" color="#ef4444" />
          <filter id="glow-blue">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Grid */}
        {Array.from({ length: 16 }, (_, i) => (
          <line key={"gx" + i} x1={i * 60} y1={0} x2={i * 60} y2={SVG_H} stroke="#0e0e1c" strokeWidth={0.5} />
        ))}
        {Array.from({ length: 7 }, (_, i) => (
          <line key={"gy" + i} x1={0} y1={i * 60} x2={SVG_W} y2={i * 60} stroke="#0e0e1c" strokeWidth={0.5} />
        ))}

        {/* Edges */}
        {Object.values(edgeMap).map((edge) => (
          <Edge
            key={`${edge.from}||${edge.to}`}
            edge={edge}
            positions={positions}
            edgeMap={edgeMap}
            activeEdge={activeEdge}
            isDone={isDone}
            accepted={accepted}
          />
        ))}

        {/* States */}
        {dfa.states.map((state) => (
          <StateNode
            key={state.id}
            state={state}
            pos={positions[state.id]}
            isCurrent={state.id === curStateId}
            isDone={isDone}
            accepted={accepted}
          />
        ))}
      </svg>
    </div>
  );
}

/* ── Arrow marker defs ── */
function ArrowMarker({ id, color }) {
  return (
    <marker id={id} markerWidth={9} markerHeight={7} refX={8} refY={3.5} orient="auto">
      <polygon points="0 0, 9 3.5, 0 7" fill={color} />
    </marker>
  );
}

/* ── State node ── */
function StateNode({ state, pos, isCurrent, isDone, accepted }) {
  if (!pos) return null;
  const [cx, cy] = pos;

  let strokeColor = "#2a2a42";
  let fillColor   = "#0f0f1e";
  let textColor   = "#e2e2f0";

  if (state.isTrap) { strokeColor = "#374151"; fillColor = "#0d0d17"; textColor = "#374151"; }
  if (state.isAccept) { strokeColor = "#10b981"; fillColor = "#052e16"; }
  if (isCurrent) {
    strokeColor = isDone ? (accepted ? "#10b981" : "#ef4444") : "#6366f1";
    fillColor   = isDone ? (accepted ? "#052e16" : "#2d0a0a") : "#1e1b4b";
    textColor   = isDone ? (accepted ? "#6ee7b7" : "#f87171") : "#a5b4fc";
  }

  return (
    <g>
      {/* Outer glow ring for current */}
      {isCurrent && (
        <circle cx={cx} cy={cy} r={R + 10} fill="none"
          stroke={isDone ? (accepted ? "#10b981" : "#ef4444") : "#6366f1"}
          strokeWidth={1} opacity={0.25}
        />
      )}

      {/* Accept double-ring */}
      {state.isAccept && (
        <circle cx={cx} cy={cy} r={R} fill={fillColor} stroke={strokeColor} strokeWidth={2.5}
          style={{ transition: "all 0.25s" }}
        />
      )}
      {state.isAccept && (
        <circle cx={cx} cy={cy} r={R - 6} fill="none" stroke={strokeColor} strokeWidth={1} opacity={0.45} />
      )}

      {/* Regular circle */}
      {!state.isAccept && (
        <circle cx={cx} cy={cy} r={R} fill={fillColor} stroke={strokeColor}
          strokeWidth={isCurrent ? 2.5 : 2}
          style={{ transition: "all 0.25s" }}
        />
      )}

      {/* Label */}
      <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle"
        fill={textColor} fontSize={13} fontFamily="'Courier New',monospace" fontWeight={700}
        style={{ transition: "fill 0.25s" }}
      >
        {state.label}
      </text>

      {/* Desc below */}
      {state.desc && (
        <text x={cx} y={cy + R + 13} textAnchor="middle"
          fill="#242438" fontSize={9} fontFamily="'Courier New',monospace"
        >
          {state.desc.length > 22 ? state.desc.slice(0, 20) + "…" : state.desc}
        </text>
      )}

      {/* Start arrow */}
      {state.isStart && (
        <>
          <defs>
            <marker id="arr-start" markerWidth={9} markerHeight={7} refX={8} refY={3.5} orient="auto">
              <polygon points="0 0, 9 3.5, 0 7" fill="#3a3a55" />
            </marker>
          </defs>
          <line x1={cx - R - 28} y1={cy} x2={cx - R - 2} y2={cy}
            stroke="#3a3a55" strokeWidth={1.5} markerEnd="url(#arr-start)"
          />
          <text x={cx - R - 30} y={cy - 7} textAnchor="end"
            fill="#2a2a42" fontSize={9} fontFamily="'Courier New',monospace"
          >
            start
          </text>
        </>
      )}
    </g>
  );
}

/* ── Edge ── */
function Edge({ edge, positions, edgeMap, activeEdge, isDone, accepted }) {
  const { from, to, symbols } = edge;
  const fp = positions[from];
  const tp = positions[to];
  if (!fp || !tp) return null;

  const label = symbols.join(", ");
  const isSelf = from === to;
  const hasBidi = !isSelf && !!edgeMap[`${to}||${from}`];

  // Is this edge active?
  const isActive = activeEdge &&
    activeEdge.from === from &&
    activeEdge.to === to &&
    symbols.includes(activeEdge.symbol);

  const edgeColor = isActive
    ? (isDone ? (accepted ? "#10b981" : "#ef4444") : "#6366f1")
    : "#252535";
  const markerId = isActive
    ? (isDone ? (accepted ? "arr-done-ok" : "arr-done-no") : "arr-active")
    : "arr-normal";

  if (isSelf) {
    return <SelfLoop cx={fp[0]} cy={fp[1]} label={label} isActive={isActive} edgeColor={edgeColor} markerId={markerId} />;
  }

  return (
    <StraightOrCurvedEdge
      fp={fp} tp={tp}
      label={label}
      isBidi={hasBidi}
      isActive={isActive}
      edgeColor={edgeColor}
      markerId={markerId}
    />
  );
}

function SelfLoop({ cx, cy, label, isActive, edgeColor, markerId }) {
  const lx = cx, ly = cy - R - 32;
  const lw = Math.max(label.length * 7 + 12, 22);
  return (
    <g>
      <path
        d={`M${cx - 16},${cy - R} C${cx - 46},${cy - R - 58} ${cx + 46},${cy - R - 58} ${cx + 16},${cy - R}`}
        fill="none"
        stroke={edgeColor}
        strokeWidth={isActive ? 2.5 : 1.5}
        markerEnd={`url(#${markerId})`}
        style={{ transition: "stroke 0.25s, stroke-width 0.2s" }}
      />
      <rect x={lx - lw / 2} y={ly - 9} width={lw} height={17} rx={4} fill="#08081a" opacity={0.9} />
      <text x={lx} y={ly + 2} textAnchor="middle"
        fill="#f59e0b" fontSize={12} fontFamily="'Courier New',monospace" fontWeight={700}
      >
        {label}
      </text>
    </g>
  );
}

function StraightOrCurvedEdge({ fp, tp, label, isBidi, isActive, edgeColor, markerId }) {
  const [fx, fy] = fp, [tx, ty] = tp;
  const dx = tx - fx, dy = ty - fy;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const nx = -dy / len, ny = dx / len;

  let d, midX, midY;

  if (isBidi) {
    const curve = 42;
    const qx = (fx + tx) / 2 + nx * curve;
    const qy = (fy + ty) / 2 + ny * curve;
    d = `M${fx},${fy} Q${qx},${qy} ${tx},${ty}`;
    midX = qx; midY = qy;
  } else {
    const sx = fx + (dx / len) * R, sy = fy + (dy / len) * R;
    const ex = tx - (dx / len) * R, ey = ty - (dy / len) * R;
    d = `M${sx},${sy} L${ex},${ey}`;
    midX = (fx + tx) / 2 + nx * 16;
    midY = (fy + ty) / 2 + ny * 16;
  }

  const lw = Math.max(label.length * 7 + 12, 22);

  return (
    <g>
      <path
        d={d}
        fill="none"
        stroke={edgeColor}
        strokeWidth={isActive ? 2.5 : 1.5}
        markerEnd={`url(#${markerId})`}
        style={{ transition: "stroke 0.25s, stroke-width 0.2s" }}
      />
      <rect x={midX - lw / 2} y={midY - 9} width={lw} height={17} rx={4} fill="#08081a" opacity={0.9} />
      <text x={midX} y={midY + 2} textAnchor="middle"
        fill="#f59e0b" fontSize={12} fontFamily="'Courier New',monospace" fontWeight={700}
      >
        {label}
      </text>
    </g>
  );
}
