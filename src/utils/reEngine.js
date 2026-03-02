/**
 * Regular Expression Engine
 * - Syntax validation
 * - Thompson's Construction → ε-NFA
 */

export const EPSILON = "ε";

/* ── Tokenizer ───────────────────────────────────────────── */

const META = new Set(["(", ")", "|", "*", "+", "?", "."]);

function tokenize(re) {
  const tokens = [];
  let i = 0;
  while (i < re.length) {
    const ch = re[i];
    if (ch === "\\") {
      // escaped character
      if (i + 1 >= re.length) throw new SyntaxError("Trailing backslash.");
      tokens.push({ type: "CHAR", value: re[i + 1] });
      i += 2;
    } else if (META.has(ch)) {
      tokens.push({ type: ch });
      i++;
    } else if (ch === "ε" || ch === "𝜀") {
      // literal epsilon — treat as empty string acceptor
      tokens.push({ type: "EPSILON" });
      i++;
    } else {
      tokens.push({ type: "CHAR", value: ch });
      i++;
    }
  }
  return tokens;
}

/* ── Parser (recursive descent) ─────────────────────────── */

/*
  Grammar:
    expr   := term ('|' term)*
    term   := factor+
    factor := primary ('*' | '+' | '?')*
    primary := CHAR | EPSILON | '.' | '(' expr ')'
*/

class Parser {
  constructor(tokens) {
    this.tokens = tokens;
    this.pos = 0;
  }
  peek() {
    return this.tokens[this.pos];
  }
  consume(type) {
    const tok = this.tokens[this.pos];
    if (!tok) throw new SyntaxError(`Expected "${type}" but got end of input.`);
    if (type && tok.type !== type) {
      throw new SyntaxError(
        `Expected "${type}" but got "${tok.type}" at position ${this.pos}.`
      );
    }
    this.pos++;
    return tok;
  }

  parseExpr() {
    let node = this.parseTerm();
    while (this.peek()?.type === "|") {
      this.consume("|");
      const right = this.parseTerm();
      node = { type: "UNION", left: node, right };
    }
    return node;
  }

  parseTerm() {
    const factors = [];
    while (
      this.peek() &&
      this.peek().type !== "|" &&
      this.peek().type !== ")"
    ) {
      factors.push(this.parseFactor());
    }
    if (factors.length === 0)
      return { type: "EPSILON_NODE" };
    if (factors.length === 1) return factors[0];
    // left-fold concat
    return factors.reduce((acc, cur) => ({ type: "CONCAT", left: acc, right: cur }));
  }

  parseFactor() {
    let node = this.parsePrimary();
    while (
      this.peek()?.type === "*" ||
      this.peek()?.type === "+" ||
      this.peek()?.type === "?"
    ) {
      const op = this.consume(this.peek().type).type;
      if (op === "*") node = { type: "STAR", child: node };
      else if (op === "+") node = { type: "PLUS", child: node };
      else node = { type: "OPTIONAL", child: node };
    }
    return node;
  }

  parsePrimary() {
    const tok = this.peek();
    if (!tok) throw new SyntaxError("Unexpected end of expression.");
    if (tok.type === "CHAR") {
      this.consume("CHAR");
      return { type: "CHAR", value: tok.value };
    }
    if (tok.type === "EPSILON") {
      this.consume("EPSILON");
      return { type: "EPSILON_NODE" };
    }
    if (tok.type === ".") {
      this.consume(".");
      return { type: "ANY" }; // matches any single character
    }
    if (tok.type === "(") {
      this.consume("(");
      const inner = this.parseExpr();
      this.consume(")");
      return inner;
    }
    throw new SyntaxError(
      `Unexpected token "${tok.type}" at position ${this.pos}.`
    );
  }

  parse() {
    if (this.tokens.length === 0) return { type: "EPSILON_NODE" };
    const node = this.parseExpr();
    if (this.pos < this.tokens.length) {
      throw new SyntaxError(
        `Unexpected token "${this.tokens[this.pos].type}" at position ${this.pos}.`
      );
    }
    return node;
  }
}

/* ── Thompson's Construction ─────────────────────────────── */

let stateCounter = 0;

function freshState() {
  return `s${stateCounter++}`;
}

function resetCounter(n = 0) {
  stateCounter = n;
}

/**
 * NFA fragment: { start: stateId, end: stateId, transitions: [{from,on,to}] }
 */

function nfaSymbol(sym) {
  const s = freshState();
  const e = freshState();
  return { start: s, end: e, transitions: [{ from: s, on: sym, to: e }] };
}

function nfaEpsilon() {
  const s = freshState();
  const e = freshState();
  return { start: s, end: e, transitions: [{ from: s, on: EPSILON, to: e }] };
}

function nfaConcat(A, B) {
  // Connect A.end → B.start via ε
  const transitions = [
    ...A.transitions,
    { from: A.end, on: EPSILON, to: B.start },
    ...B.transitions,
  ];
  return { start: A.start, end: B.end, transitions };
}

function nfaUnion(A, B) {
  const s = freshState();
  const e = freshState();
  const transitions = [
    { from: s, on: EPSILON, to: A.start },
    { from: s, on: EPSILON, to: B.start },
    ...A.transitions,
    ...B.transitions,
    { from: A.end, on: EPSILON, to: e },
    { from: B.end, on: EPSILON, to: e },
  ];
  return { start: s, end: e, transitions };
}

function nfaStar(A) {
  const s = freshState();
  const e = freshState();
  const transitions = [
    { from: s, on: EPSILON, to: A.start },
    { from: s, on: EPSILON, to: e },
    ...A.transitions,
    { from: A.end, on: EPSILON, to: A.start },
    { from: A.end, on: EPSILON, to: e },
  ];
  return { start: s, end: e, transitions };
}

function nfaPlus(A) {
  // A followed by A*
  return nfaConcat(A, nfaStar(A));
}

function nfaOptional(A) {
  return nfaUnion(A, nfaEpsilon());
}

// Wildcard "." — for simplicity we represent as a special ANY symbol
// Real handling requires knowing the alphabet; here we mark it as "·"
function nfaAny() {
  const s = freshState();
  const e = freshState();
  return {
    start: s,
    end: e,
    transitions: [{ from: s, on: "·", to: e }],
  };
}

function buildNFA(node) {
  switch (node.type) {
    case "CHAR":
      return nfaSymbol(node.value);
    case "EPSILON_NODE":
      return nfaEpsilon();
    case "ANY":
      return nfaAny();
    case "CONCAT":
      return nfaConcat(buildNFA(node.left), buildNFA(node.right));
    case "UNION":
      return nfaUnion(buildNFA(node.left), buildNFA(node.right));
    case "STAR":
      return nfaStar(buildNFA(node.child));
    case "PLUS":
      return nfaPlus(buildNFA(node.child));
    case "OPTIONAL":
      return nfaOptional(buildNFA(node.child));
    default:
      throw new Error(`Unknown AST node type: ${node.type}`);
  }
}

/* ── Collect alphabet from AST ───────────────────────────── */

function collectAlphabet(node, set = new Set()) {
  if (!node) return set;
  if (node.type === "CHAR") set.add(node.value);
  if (node.type === "ANY") set.add("·");
  if (node.left) collectAlphabet(node.left, set);
  if (node.right) collectAlphabet(node.right, set);
  if (node.child) collectAlphabet(node.child, set);
  return set;
}

/* ── Public API ──────────────────────────────────────────── */

/**
 * Validate a regular expression.
 * Returns { valid: bool, error: string|null }
 */
export function validateRegex(re) {
  if (!re || re.trim() === "")
    return { valid: false, error: "Expression is empty." };
  try {
    const tokens = tokenize(re.trim());
    new Parser(tokens).parse();
    return { valid: true, error: null };
  } catch (e) {
    return { valid: false, error: e.message };
  }
}

/**
 * Convert a regular expression to an ε-NFA using Thompson's construction.
 * Returns an automaton object compatible with AutomataCanvas:
 * {
 *   states: [{id, label, isStart, isAccept}],
 *   alphabet: string[],
 *   transitions: [{from, on, to}],  // to is always a single string
 * }
 */
export function regexToNFA(re) {
  resetCounter(0);
  re = re.trim();
  if (!re) {
    // Empty regex — accept only ε
    const frag = nfaEpsilon();
    return _buildAutomaton(frag, []);
  }

  const tokens = tokenize(re);
  const ast = new Parser(tokens).parse();
  const alphSet = collectAlphabet(ast);
  const frag = buildNFA(ast);
  return _buildAutomaton(frag, [...alphSet]);
}

function _buildAutomaton(frag, alphabet) {
  // Collect all state IDs from transitions
  const allStateIds = new Set();
  allStateIds.add(frag.start);
  allStateIds.add(frag.end);
  for (const t of frag.transitions) {
    allStateIds.add(t.from);
    allStateIds.add(t.to);
  }

  const states = [...allStateIds].map((id) => ({
    id,
    label: id,
    isStart: id === frag.start,
    isAccept: id === frag.end,
  }));

  // Flatten transitions (to is always string here from Thompson's)
  const transitions = frag.transitions;

  return {
    states,
    alphabet: alphabet.filter((a) => a !== EPSILON),
    transitions,
    isEpsilonNFA: true,
  };
}

/**
 * Simulate a regex against an input string.
 * Returns { accepted: bool, matchedBy: string }
 */
export function testRegex(re, input) {
  try {
    const tokens = tokenize(re.trim());
    const ast = new Parser(tokens).parse();
    return _matchAST(ast, input, 0) === input.length
      ? { accepted: true }
      : { accepted: false };
  } catch {
    return { accepted: false };
  }
}

// Simple recursive matching (NFA-via-backtracking)
function _matchAST(node, input, pos) {
  switch (node.type) {
    case "CHAR":
      if (pos < input.length && input[pos] === node.value) return pos + 1;
      return -1;
    case "ANY":
      if (pos < input.length) return pos + 1;
      return -1;
    case "EPSILON_NODE":
      return pos;
    case "CONCAT": {
      const mid = _matchAST(node.left, input, pos);
      if (mid < 0) return -1;
      return _matchAST(node.right, input, mid);
    }
    case "UNION": {
      const r1 = _matchAST(node.left, input, pos);
      if (r1 >= 0) return r1;
      return _matchAST(node.right, input, pos);
    }
    case "STAR": {
      let cur = pos;
      while (true) {
        const next = _matchAST(node.child, input, cur);
        if (next <= cur) break;
        cur = next;
      }
      return cur;
    }
    case "PLUS": {
      const first = _matchAST(node.child, input, pos);
      if (first < 0) return -1;
      let cur = first;
      while (true) {
        const next = _matchAST(node.child, input, cur);
        if (next <= cur) break;
        cur = next;
      }
      return cur;
    }
    case "OPTIONAL": {
      const r1 = _matchAST(node.child, input, pos);
      return r1 >= 0 ? r1 : pos;
    }
    default:
      return -1;
  }
}
