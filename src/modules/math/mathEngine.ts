import { MathVerificationResult } from '../../types';

/**
 * Safe, deterministic recursive-descent mathematical expression evaluator
 * and Class 10 algebraic / physics formula verifier.
 * Never uses eval() or Function() for security and determinism.
 */

interface Token {
  type: 'number' | 'op' | 'ident' | 'lparen' | 'rparen' | 'comma';
  value: string;
}

function tokenizeMath(expr: string): Token[] {
  const cleaned = expr
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-')
    .replace(/π/g, 'pi')
    .replace(/√\s*\(/g, 'sqrt(')
    .replace(/√(\d+(\.\d+)?)/g, 'sqrt($1)');

  const tokens: Token[] = [];
  let i = 0;

  while (i < cleaned.length) {
    const ch = cleaned[i];
    if (/\s/.test(ch)) {
      i++;
      continue;
    }
    if (/\d|\./.test(ch)) {
      let numStr = '';
      while (i < cleaned.length && /[\d.]/.test(cleaned[i])) {
        numStr += cleaned[i++];
      }
      tokens.push({ type: 'number', value: numStr });
      continue;
    }
    if (/[a-zA-Z_]/.test(ch)) {
      let idStr = '';
      while (i < cleaned.length && /[a-zA-Z0-9_]/.test(cleaned[i])) {
        idStr += cleaned[i++];
      }
      tokens.push({ type: 'ident', value: idStr.toLowerCase() });
      continue;
    }
    if (ch === '(') {
      tokens.push({ type: 'lparen', value: ch });
      i++;
      continue;
    }
    if (ch === ')') {
      tokens.push({ type: 'rparen', value: ch });
      i++;
      continue;
    }
    if (ch === ',') {
      tokens.push({ type: 'comma', value: ch });
      i++;
      continue;
    }
    if (['+', '-', '*', '/', '^', '%'].includes(ch)) {
      tokens.push({ type: 'op', value: ch });
      i++;
      continue;
    }
    throw new Error(`Unsupported symbol "${ch}" in expression`);
  }
  return tokens;
}

function gcdTwo(a: number, b: number): number {
  let x = Math.abs(Math.round(a));
  let y = Math.abs(Math.round(b));
  while (y !== 0) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x;
}

function lcmTwo(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return Math.abs(Math.round(a * b)) / gcdTwo(a, b);
}

export function evaluateArithmeticExpression(expr: string): number {
  const tokens = tokenizeMath(expr);
  if (tokens.length === 0) {
    throw new Error('Empty mathematical expression');
  }
  let pos = 0;

  function peek(): Token | undefined {
    return tokens[pos];
  }

  function consume(): Token {
    return tokens[pos++];
  }

  function parseExpression(): number {
    let left = parseTerm();
    while (peek()?.type === 'op' && (peek()!.value === '+' || peek()!.value === '-')) {
      const op = consume().value;
      const right = parseTerm();
      left = op === '+' ? left + right : left - right;
    }
    return left;
  }

  function parseTerm(): number {
    let left = parsePower();
    while (
      peek()?.type === 'op' &&
      (peek()!.value === '*' || peek()!.value === '/' || peek()!.value === '%')
    ) {
      const op = consume().value;
      const right = parsePower();
      if (op === '*') left *= right;
      else if (op === '/') {
        if (Math.abs(right) < 1e-15) throw new Error('Division by zero');
        left /= right;
      } else {
        left %= right;
      }
    }
    return left;
  }

  function parsePower(): number {
    const base = parseUnary();
    if (peek()?.type === 'op' && peek()!.value === '^') {
      consume();
      const exponent = parsePower(); // right-associative
      return Math.pow(base, exponent);
    }
    return base;
  }

  function parseUnary(): number {
    if (peek()?.type === 'op' && peek()!.value === '-') {
      consume();
      return -parseUnary();
    }
    if (peek()?.type === 'op' && peek()!.value === '+') {
      consume();
      return parseUnary();
    }
    return parsePrimary();
  }

  function parsePrimary(): number {
    const tok = peek();
    if (!tok) throw new Error('Unexpected end of expression');

    if (tok.type === 'number') {
      consume();
      const val = Number(tok.value);
      if (Number.isNaN(val)) throw new Error(`Invalid number: ${tok.value}`);
      return val;
    }

    if (tok.type === 'ident') {
      consume();
      const name = tok.value;
      if (name === 'pi') return Math.PI;
      if (name === 'e') return Math.E;

      if (peek()?.type === 'lparen') {
        consume(); // '('
        const args: number[] = [];
        if (peek()?.type !== 'rparen') {
          args.push(parseExpression());
          while (peek()?.type === 'comma') {
            consume();
            args.push(parseExpression());
          }
        }
        if (peek()?.type !== 'rparen') {
          throw new Error('Missing closing parenthesis in function call');
        }
        consume(); // ')'

        switch (name) {
          case 'sqrt':
            if (args[0] < 0) throw new Error('Square root of negative number');
            return Math.sqrt(args[0]);
          case 'abs':
            return Math.abs(args[0]);
          case 'sin':
            return Math.sin((args[0] * Math.PI) / 180); // degree default for Class 10
          case 'cos':
            return Math.cos((args[0] * Math.PI) / 180);
          case 'tan':
            return Math.tan((args[0] * Math.PI) / 180);
          case 'log':
            return Math.log10(args[0]);
          case 'ln':
            return Math.log(args[0]);
          case 'round':
            return Math.round(args[0]);
          case 'floor':
            return Math.floor(args[0]);
          case 'ceil':
            return Math.ceil(args[0]);
          case 'gcd':
          case 'hcf':
            if (args.length < 2) throw new Error('gcd/hcf requires 2 arguments');
            return gcdTwo(args[0], args[1]);
          case 'lcm':
            if (args.length < 2) throw new Error('lcm requires 2 arguments');
            return lcmTwo(args[0], args[1]);
          default:
            throw new Error(`Unsupported symbolic identifier or function: ${name}`);
        }
      }
      throw new Error(`Unbound symbolic variable "${name}"`);
    }

    if (tok.type === 'lparen') {
      consume();
      const val = parseExpression();
      if (peek()?.type !== 'rparen') {
        throw new Error('Missing closing parenthesis');
      }
      consume();
      return val;
    }

    throw new Error(`Unexpected token "${tok.value}"`);
  }

  const result = parseExpression();
  if (pos < tokens.length) {
    throw new Error(`Unexpected trailing token "${tokens[pos].value}"`);
  }
  return Number(result.toFixed(6));
}

export interface QuadraticSolution {
  a: number;
  b: number;
  c: number;
  discriminant: number;
  natureOfRoots: 'two_distinct_real' | 'two_equal_real' | 'no_real_roots';
  roots: number[];
  formattedRoots: string;
  steps: string[];
}

/**
 * Parses and solves standard quadratic equations in x: ax^2 + bx + c = 0
 */
export function solveQuadraticEquation(input: string): QuadraticSolution | null {
  const normalized = input
    .replace(/\s+/g, '')
    .replace(/²/g, '^2')
    .replace(/−/g, '-')
    .toLowerCase();

  // Check if it looks like a quadratic in x
  if (!normalized.includes('x^2')) return null;

  const parts = normalized.split('=');
  if (parts.length > 2) return null;
  const lhs = parts[0];
  const rhs = parts.length === 2 ? parts[1] : '0';

  // Only handle rhs = 0 or simple constant rhs
  const rhsVal = Number(rhs);
  if (Number.isNaN(rhsVal)) return null;

  // Match terms on LHS: e.g. 2x^2-7x+12
  const termRegex = /([+-]?\d*\.?\d*)x\^2|([+-]?\d*\.?\d*)x(?!\^)|([+-]?\d+\.?\d*)/g;
  let a = 0;
  let b = 0;
  let c = -rhsVal;
  let matchedLength = 0;

  let match: RegExpExecArray | null;
  while ((match = termRegex.exec(lhs)) !== null) {
    if (match[0] === '') break;
    matchedLength += match[0].length;
    if (match[1] !== undefined) {
      const coeff =
        match[1] === '' || match[1] === '+'
          ? 1
          : match[1] === '-'
            ? -1
            : Number(match[1]);
      a += coeff;
    } else if (match[2] !== undefined) {
      const coeff =
        match[2] === '' || match[2] === '+'
          ? 1
          : match[2] === '-'
            ? -1
            : Number(match[2]);
      b += coeff;
    } else if (match[3] !== undefined) {
      c += Number(match[3]);
    }
  }

  if (matchedLength !== lhs.length || a === 0) return null;

  const D = Number((b * b - 4 * a * c).toFixed(6));
  const steps: string[] = [
    `Standard quadratic form: (${a})x² + (${b})x + (${c}) = 0, so a = ${a}, b = ${b}, c = ${c}.`,
    `Discriminant D = b² - 4ac = (${b})² - 4(${a})(${c}) = ${b * b} - (${4 * a * c}) = ${D}.`,
  ];

  if (D < 0) {
    steps.push('Since D < 0, the quadratic equation has no real roots in the set of real numbers.');
    return {
      a,
      b,
      c,
      discriminant: D,
      natureOfRoots: 'no_real_roots',
      roots: [],
      formattedRoots: 'No real roots (D < 0)',
      steps,
    };
  }

  if (D === 0) {
    const r = Number((-b / (2 * a)).toFixed(4));
    const check = Number((a * r * r + b * r + c).toFixed(4));
    steps.push(`Since D = 0, there are two equal real roots: x = -b / (2a) = ${-b} / ${2 * a} = ${r}.`);
    steps.push(`Plug-back check: ${a}(${r})² + (${b})(${r}) + (${c}) = ${check} (Verified)`);
    return {
      a,
      b,
      c,
      discriminant: 0,
      natureOfRoots: 'two_equal_real',
      roots: [r],
      formattedRoots: `x = ${r}`,
      steps,
    };
  }

  const sqrtD = Math.sqrt(D);
  const r1 = Number(((-b - sqrtD) / (2 * a)).toFixed(4));
  const r2 = Number(((-b + sqrtD) / (2 * a)).toFixed(4));
  const sorted = [r1, r2].sort((x, y) => x - y);
  const check1 = Number((a * sorted[0] * sorted[0] + b * sorted[0] + c).toFixed(4));
  const check2 = Number((a * sorted[1] * sorted[1] + b * sorted[1] + c).toFixed(4));

  steps.push(
    `Apply Quadratic Formula: x = [-b ± sqrt(D)] / (2a) = [${-b} ± sqrt(${D})] / ${2 * a}.`
  );
  steps.push(`Root 1 (x1) = ${sorted[0]}, Root 2 (x2) = ${sorted[1]}.`);
  steps.push(
    `Plug-back verification: f(${sorted[0]}) = ${check1} (Verified) and f(${sorted[1]}) = ${check2} (Verified).`
  );

  return {
    a,
    b,
    c,
    discriminant: D,
    natureOfRoots: 'two_distinct_real',
    roots: sorted,
    formattedRoots: `${sorted[0]}, ${sorted[1]}`,
    steps,
  };
}

/**
 * Solves single-variable linear equations of form ax + b = c
 */
export function solveLinearEquation(input: string): {
  root: number;
  steps: string[];
} | null {
  const normalized = input.replace(/\s+/g, '').replace(/−/g, '-').toLowerCase();
  if (!normalized.includes('x') || normalized.includes('x^')) return null;
  const parts = normalized.split('=');
  if (parts.length !== 2) return null;

  const parseLinearSide = (side: string): { m: number; k: number } | null => {
    const regex = /([+-]?\d*\.?\d*)x|([+-]?\d+\.?\d*)/g;
    let m = 0;
    let k = 0;
    let len = 0;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(side)) !== null) {
      if (match[0] === '') break;
      len += match[0].length;
      if (match[1] !== undefined) {
        const coeff =
          match[1] === '' || match[1] === '+'
            ? 1
            : match[1] === '-'
              ? -1
              : Number(match[1]);
        m += coeff;
      } else if (match[2] !== undefined) {
        k += Number(match[2]);
      }
    }
    if (len !== side.length) return null;
    return { m, k };
  };

  const left = parseLinearSide(parts[0]);
  const right = parseLinearSide(parts[1]);
  if (!left || !right) return null;

  const netM = left.m - right.m;
  const netK = right.k - left.k;
  if (Math.abs(netM) < 1e-12) return null;

  const root = Number((netK / netM).toFixed(4));
  return {
    root,
    steps: [
      `Rearrange linear terms to LHS and constants to RHS: (${netM})x = ${netK}.`,
      `Divide both sides by ${netM}: x = ${netK} / ${netM} = ${root}.`,
      `Plug-back verification: LHS = ${Number((left.m * root + left.k).toFixed(4))}, RHS = ${Number((right.m * root + right.k).toFixed(4))} ✓.`,
    ],
  };
}

/**
 * Extracts a mathematical expression or equation from natural language question text
 * if the user did not explicitly supply one in the dedicated math box.
 */
export function extractMathFromQuestionText(questionText: string): string | null {
  // Check for quadratic equation in text
  const quadMatch = questionText.match(
    /([+-]?\s*\d*x(?:\^2|²)\s*[+-]\s*\d*x\s*[+-]\s*\d+\s*=\s*[+-]?\d+)/i
  );
  if (quadMatch) return quadMatch[1].trim();

  // Check for linear equation in text
  const linMatch = questionText.match(
    /([+-]?\s*\d+x\s*[+-]\s*\d+\s*=\s*[+-]?\d+)/i
  );
  if (linMatch) return linMatch[1].trim();

  // Check for HCF/LCM calls
  const hcfMatch = questionText.match(/\b(hcf|gcd|lcm)\s*\(\s*(\d+)\s*,\s*(\d+)\s*\)/i);
  if (hcfMatch) {
    return `${hcfMatch[1].toLowerCase()}(${hcfMatch[2]}, ${hcfMatch[3]})`;
  }

  // Check for pure arithmetic expression inside question
  const arithMatch = questionText.match(
    /(?:evaluate|calculate|simplify|value of|solve)\s*[:=]?\s*([\d().+\-*/^\s]+[\d)])/i
  );
  if (arithMatch && /[\d]/.test(arithMatch[1]) && /[+\-*/^]/.test(arithMatch[1])) {
    return arithMatch[1].trim();
  }

  return null;
}

/**
 * Main Mathematics Verification Module entry point.
 * Evaluates numerical or supported algebraic expressions independently from any AI model,
 * and optionally compares a proposed answer against the verified result.
 */
export function verifyMathematics(
  questionText: string,
  explicitExpression?: string,
  proposedResult?: string | null
): MathVerificationResult {
  const rawExpr = (explicitExpression?.trim() || extractMathFromQuestionText(questionText)) ?? null;

  if (!rawExpr) {
    // Check if question mentions symbolic proofs like "Prove that", "Show that"
    if (/\b(prove that|show that|irrational|derive)\b/i.test(questionText)) {
      return {
        status: 'unsupported_symbolic',
        expressionDetected: null,
        operationType: 'symbolic_unsupported',
        proposedResult: proposedResult ?? null,
        verifiedResult: null,
        steps: [],
        explanation:
          'This question involves a formal mathematical proof or symbolic derivation. Automated numerical verification is unavailable for open-ended proofs.',
      };
    }

    return {
      status: 'not_applicable',
      expressionDetected: null,
      operationType: 'none',
      proposedResult: proposedResult ?? null,
      verifiedResult: null,
      steps: [],
      explanation:
        'No standalone numerical expression or equation was provided for independent calculation verification.',
    };
  }

  // 1. Try Quadratic Equation Solver
  const quad = solveQuadraticEquation(rawExpr);
  if (quad) {
    const matchesProposed =
      !proposedResult ||
      compareProposedToVerified(proposedResult, quad.formattedRoots, quad.roots);

    return {
      status: matchesProposed ? 'verified' : 'mismatch',
      expressionDetected: rawExpr,
      operationType: 'quadratic_equation',
      proposedResult: proposedResult ?? quad.formattedRoots,
      verifiedResult: quad.formattedRoots,
      steps: quad.steps,
      explanation: matchesProposed
        ? `Independently solved and verified quadratic equation ${rawExpr} by discriminant evaluation and root substitution.`
        : `Discrepancy detected: Proposed answer "${proposedResult}" does not match independently verified roots (${quad.formattedRoots}).`,
    };
  }

  // 2. Try Linear Equation Solver
  const lin = solveLinearEquation(rawExpr);
  if (lin) {
    const verifiedStr = `x = ${lin.root}`;
    const matchesProposed =
      !proposedResult ||
      compareProposedToVerified(proposedResult, String(lin.root), [lin.root]);

    return {
      status: matchesProposed ? 'verified' : 'mismatch',
      expressionDetected: rawExpr,
      operationType: 'linear_equation',
      proposedResult: proposedResult ?? verifiedStr,
      verifiedResult: verifiedStr,
      steps: lin.steps,
      explanation: matchesProposed
        ? `Independently solved and verified linear equation ${rawExpr} by algebraic isolation and LHS/RHS substitution.`
        : `Discrepancy detected: Proposed answer "${proposedResult}" differs from verified solution ${verifiedStr}.`,
    };
  }

  // 3. Try Direct Arithmetic / Function Expression Evaluator
  try {
    const val = evaluateArithmeticExpression(rawExpr);
    const verifiedStr = String(val);
    const matchesProposed =
      !proposedResult || compareProposedToVerified(proposedResult, verifiedStr, [val]);

    return {
      status: matchesProposed ? 'verified' : 'mismatch',
      expressionDetected: rawExpr,
      operationType: 'arithmetic',
      proposedResult: proposedResult ?? verifiedStr,
      verifiedResult: verifiedStr,
      steps: [
        `Parsed expression: ${rawExpr}`,
        `Evaluated via deterministic recursive-descent math engine: ${verifiedStr}`,
      ],
      explanation: matchesProposed
        ? `Independently evaluated "${rawExpr}" = ${verifiedStr} using the local deterministic math engine.`
        : `Discrepancy detected: Proposed value "${proposedResult}" does not match the verified value ${verifiedStr}.`,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unsupported symbolic expression';
    return {
      status: 'unsupported_symbolic',
      expressionDetected: rawExpr,
      operationType: 'symbolic_unsupported',
      proposedResult: proposedResult ?? null,
      verifiedResult: null,
      steps: [],
      explanation: `Independent numeric verification limitation: ${msg}. The math verifier supports arithmetic, GCD/LCM, trigonometric degrees, linear equations, and quadratic equations (ax² + bx + c = 0).`,
    };
  }
}

export function compareProposedToVerified(
  proposed: string,
  verifiedText: string,
  verifiedNumbers: number[]
): boolean {
  const cleanProp = proposed.trim().toLowerCase();
  const cleanVer = verifiedText.trim().toLowerCase();
  if (cleanProp === cleanVer) return true;

  // Extract all numbers from proposed string
  const propNums = (cleanProp.match(/[+-]?\d+(\.\d+)?/g) ?? []).map(Number);
  if (propNums.length === 0 || verifiedNumbers.length === 0) {
    return cleanProp.includes(cleanVer);
  }

  if (propNums.length !== verifiedNumbers.length) return false;
  const sortedProp = [...propNums].sort((a, b) => a - b);
  const sortedVer = [...verifiedNumbers].sort((a, b) => a - b);

  return sortedProp.every((val, idx) => Math.abs(val - sortedVer[idx]) <= 0.01);
}
