/**
 * NFA / ε-NFA Engine
 * Handles: simulation, ε-closure, validation, layout
 */

export const EPSILON = "ε";

/* ── ε-Closure ───────────────────────────────────────────── */

/**
 * Compute the ε-closure of a set of NFA states.
 * transitions: [{ from, on, to: string|string[] }]
 * Returns a Set of state IDs.
 */
export function epsilonClosure(stateSet, transitions) {
  const closure = new Set(stateSet);
  const stack = [...stateSet];

  while (stack.length > 0) {
    const s = stack.pop();
    for (const t of transitions) {
      if (t.from !== s || t.on !== EPSILON) continue;
      const targets = Array.isArray(t.to) ? t.to : [t.to];
      for (const target of targets) {
        if (!closure.has(target)) {
          closure.add(target);
          stack.push(target);
        }
      }
    }
  }

  return closure;
}

/* ── NFA Simulation ──────────────────────────────────────── */

/**
 * Simulate an NFA/ε-NFA on an input string.
 * Returns: { accepted: bool, steps: [{states, symbol, charIdx}] }
 */
export function simulateNFA(nfa, input) {
  const start = nfa.states.find((s) => s.isStart);
  if (!start) return { accepted: false, steps: [] };

  let current = epsilonClosure([start.id], nfa.transitions);

  const steps = [{ states: [...current], symbol: null, charIdx: -1 }];

  for (let i = 0; i < input.length; i++) {
    const sym = input[i];
    const moved = new Set();

    for (const s of current) {
      for (const t of nfa.transitions) {
        if (t.from !== s || t.on !== sym) continue;
        const targets = Array.isArray(t.to) ? t.to : [t.to];
        targets.forEach((x) => moved.add(x));
      }
    }

    current = epsilonClosure([...moved], nfa.transitions);
    steps.push({ states: [...current], symbol: sym, charIdx: i });
  }

  const accepted = [...current].some(
    (id) => nfa.states.find((s) => s.id === id)?.isAccept
  );

  return { accepted, steps };
}

/* ── NFA Validation ──────────────────────────────────────── */

/**
 * Validate NFA / ε-NFA structure.
 * Returns { valid, errors: string[], warnings: string[] }
 */
export function validateNFA(
  states,
  alphabet,
  startState,
  acceptStates,
  transitions,
  isEpsilonNFA = false
) {
  const errors = [];
  const warnings = [];

  if (!states || states.length === 0) {
    errors.push("No states defined.");
    return { valid: false, errors, warnings };
  }

  const stateIds = new Set(states.map((s) => s.id));
  const validSymbols = new Set(alphabet);
  if (isEpsilonNFA) validSymbols.add(EPSILON);

  // Start state
  if (!startState) {
    errors.push("No start state designated.");
  } else if (!stateIds.has(startState)) {
    errors.push(`Start state "${startState}" is not in states list.`);
  }

  // Accept states
  if (!acceptStates || acceptStates.length === 0) {
    warnings.push("No accept states defined — the NFA accepts nothing.");
  }
  for (const a of acceptStates || []) {
    if (!stateIds.has(a)) {
      errors.push(`Accept state "${a}" is not in states list.`);
    }
  }

  // Alphabet
  if (!alphabet || alphabet.length === 0) {
    errors.push("Alphabet is empty.");
  }

  // Transitions
  const seen = new Set();
  for (const t of transitions) {
    const key = `${t.from}--${t.on}--${JSON.stringify(t.to)}`;
    if (seen.has(key)) {
      warnings.push(
        `Duplicate transition from "${t.from}" on "${t.on}" — ignored extra.`
      );
    }
    seen.add(key);

    if (!stateIds.has(t.from)) {
      errors.push(`Transition from unknown state "${t.from}".`);
    }
    if (t.on !== EPSILON && !validSymbols.has(t.on)) {
      errors.push(
        `Transition on symbol "${t.on}" which is not in the alphabet${
          isEpsilonNFA ? " (use ε for epsilon)" : ""
        }.`
      );
    }
    const targets = Array.isArray(t.to) ? t.to : [t.to];
    for (const target of targets) {
      if (!stateIds.has(target)) {
        errors.push(`Transition to unknown state "${target}".`);
      }
    }
  }

  // Reachability check
  if (startState && stateIds.has(startState)) {
    const reachable = new Set();
    const queue = [startState];
    while (queue.length > 0) {
      const s = queue.shift();
      if (reachable.has(s)) continue;
      reachable.add(s);
      transitions
        .filter((t) => t.from === s)
        .forEach((t) => {
          const targets = Array.isArray(t.to) ? t.to : [t.to];
          targets.forEach((x) => {
            if (!reachable.has(x)) queue.push(x);
          });
        });
    }
    for (const id of stateIds) {
      if (!reachable.has(id)) {
        warnings.push(`State "${id}" is unreachable from start state.`);
      }
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

/* ── DFA Validation ──────────────────────────────────────── */

/**
 * Validate a DFA.
 * Returns { valid, errors: string[], warnings: string[] }
 */
export function validateDFA(
  states,
  alphabet,
  startState,
  acceptStates,
  transitions
) {
  const errors = [];
  const warnings = [];

  if (!states || states.length === 0) {
    errors.push("No states defined.");
    return { valid: false, errors, warnings };
  }

  const stateIds = new Set(states.map((s) => s.id));
  const validSymbols = new Set(alphabet);

  // Start state
  if (!startState) {
    errors.push("No start state designated.");
  } else if (!stateIds.has(startState)) {
    errors.push(`Start state "${startState}" is not in states list.`);
  }

  // Accept states
  if (!acceptStates || acceptStates.length === 0) {
    warnings.push("No accept states defined.");
  }
  for (const a of acceptStates || []) {
    if (!stateIds.has(a)) {
      errors.push(`Accept state "${a}" is not in states list.`);
    }
  }

  if (!alphabet || alphabet.length === 0) {
    errors.push("Alphabet is empty.");
  }

  // Determinism + completeness
  const transMap = new Map(); // "state,symbol" → count
  const seen = new Set();

  for (const t of transitions) {
    if (!stateIds.has(t.from)) {
      errors.push(`Transition from unknown state "${t.from}".`);
    }
    if (!validSymbols.has(t.on)) {
      errors.push(`Transition uses symbol "${t.on}" not in alphabet.`);
    }
    if (!stateIds.has(t.to)) {
      errors.push(`Transition to unknown state "${t.to}".`);
    }

    const key = `${t.from},${t.on}`;
    if (seen.has(key)) {
      errors.push(
        `Non-deterministic: multiple transitions from "${t.from}" on "${t.on}". DFA requires exactly one.`
      );
    }
    seen.add(key);
    transMap.set(key, (transMap.get(key) || 0) + 1);
  }

  // Completeness
  const missing = [];
  for (const s of stateIds) {
    for (const sym of validSymbols) {
      const key = `${s},${sym}`;
      if (!transMap.has(key)) {
        missing.push(`δ(${s}, ${sym})`);
      }
    }
  }
  if (missing.length > 0) {
    warnings.push(
      `DFA is incomplete (partial function). Missing transitions: ${missing.slice(0, 8).join(", ")}${
        missing.length > 8 ? ` … and ${missing.length - 8} more` : ""
      }.`
    );
  }

  // Reachability
  if (startState && stateIds.has(startState)) {
    const reachable = new Set();
    const queue = [startState];
    while (queue.length > 0) {
      const s = queue.shift();
      if (reachable.has(s)) continue;
      reachable.add(s);
      transitions
        .filter((t) => t.from === s)
        .forEach((t) => {
          if (!reachable.has(t.to)) queue.push(t.to);
        });
    }
    for (const id of stateIds) {
      if (!reachable.has(id)) {
        warnings.push(`State "${id}" is unreachable from start state.`);
      }
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

/* ── Layout ──────────────────────────────────────────────── */

/**
 * Compute circular / BFS layout for any automaton.
 */
export function computeAutomataLayout(states, transitions, W = 840, H = 340) {
  if (!states || states.length === 0) return {};

  const startState = states.find((s) => s.isStart) || states[0];

  // BFS layers
  const layerOf = new Map();
  const visited = new Set();
  const queue = [[startState.id, 0]];

  while (queue.length > 0) {
    const [id, depth] = queue.shift();
    if (visited.has(id)) continue;
    visited.add(id);
    layerOf.set(id, depth);

    const nexts = [
      ...new Set(
        transitions
          .filter((t) => t.from === id)
          .flatMap((t) => (Array.isArray(t.to) ? t.to : [t.to]))
      ),
    ];
    nexts.forEach((to) => {
      if (!visited.has(to)) queue.push([to, depth + 1]);
    });
  }

  states.forEach((s) => {
    if (!layerOf.has(s.id)) {
      const max = layerOf.size > 0 ? Math.max(...layerOf.values()) : 0;
      layerOf.set(s.id, max + 1);
    }
  });

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
