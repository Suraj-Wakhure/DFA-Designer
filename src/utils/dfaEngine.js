/**
 * Computes x/y positions for each state using BFS layering,
 * fitting within a given SVG viewBox.
 */
export function computeLayout(states, transitions, W = 840, H = 340) {
  if (!states || states.length === 0) return {};

  const startState = states.find((s) => s.isStart) || states[0];

  // BFS to assign layers
  const layerOf = new Map();
  const visited = new Set();
  const queue = [[startState.id, 0]];

  while (queue.length > 0) {
    const [id, depth] = queue.shift();
    if (visited.has(id)) continue;
    visited.add(id);
    layerOf.set(id, depth);

    const outgoing = [
      ...new Set(
        transitions.filter((t) => t.from === id).map((t) => t.to)
      ),
    ];
    outgoing.forEach((to) => {
      if (!visited.has(to)) queue.push([to, depth + 1]);
    });
  }

  // Any unreachable states get appended at the end
  states.forEach((s) => {
    if (!layerOf.has(s.id)) {
      layerOf.set(s.id, (Math.max(...layerOf.values()) || 0) + 1);
    }
  });

  // Group by layer
  const layers = new Map();
  layerOf.forEach((depth, id) => {
    if (!layers.has(depth)) layers.set(depth, []);
    layers.get(depth).push(id);
  });

  const sortedLayers = [...layers.entries()].sort((a, b) => a[0] - b[0]);
  const numLayers = sortedLayers.length;

  const xPad = 80;
  const yPad = 55;
  const xStep = numLayers > 1 ? (W - xPad * 2) / (numLayers - 1) : 0;

  const positions = {};
  sortedLayers.forEach(([, ids], li) => {
    const x = xPad + li * xStep;
    const count = ids.length;
    ids.forEach((id, i) => {
      const yStep = count > 1 ? (H - yPad * 2) / (count - 1) : 0;
      const y = count === 1 ? H / 2 : yPad + i * yStep;
      positions[id] = [Math.round(x), Math.round(y)];
    });
  });

  return positions;
}

/**
 * Runs the DFA on an input string.
 * Returns an array of steps: [{ state, symbol, charIdx }]
 * If a transition is missing, the last step has dead:true.
 */
export function simulateDFA(dfa, input) {
  const start = dfa.states.find((s) => s.isStart);
  if (!start) return [];

  const steps = [{ state: start.id, symbol: null, charIdx: -1 }];
  let current = start.id;

  for (let i = 0; i < input.length; i++) {
    const sym = input[i];
    const t = dfa.transitions.find((t) => t.from === current && t.on === sym);
    if (!t) {
      steps.push({ state: null, symbol: sym, charIdx: i, dead: true });
      return steps;
    }
    current = t.to;
    steps.push({ state: current, symbol: sym, charIdx: i });
  }

  return steps;
}
