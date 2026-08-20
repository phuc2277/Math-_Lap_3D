/**
 * Casio fx-580 VNX / MS Mathematical Engine
 * Accurate math evaluation for COMP, COMPLEX, EQUATION, INEQ, MATRIX, VECTOR, STAT, TABLE, BASE-N
 */

export interface ComplexNumber {
  re: number;
  im: number;
}

export interface EquationResult {
  type: 'linear_system' | 'polynomial';
  degree?: number;
  variables?: string[];
  roots: Array<{
    label: string;
    real: number;
    imag?: number;
    exact?: string;
  }>;
  extrema?: Array<{
    label: string;
    x: number;
    y: number;
  }>;
  message?: string;
}

export interface StatResult {
  n: number;
  mean: number;
  sum: number;
  sumSq: number;
  variance: number;
  stdDev: number;
  sampleVariance: number;
  sampleStdDev: number;
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
}

export interface MatrixData {
  rows: number;
  cols: number;
  data: number[][];
}

export interface VectorData {
  dim: 2 | 3;
  data: number[];
}

export interface InequalityResult {
  degree: 2 | 3 | 4;
  operator: '>' | '>=' | '<' | '<=';
  intervals: Array<{ start?: number; end?: number; includeStart?: boolean; includeEnd?: boolean }>;
  solutionText: string;
  roots: number[];
}

export interface DistributionResult {
  type: 'normal' | 'binomial' | 'poisson';
  label: string;
  result: number;
  formula: string;
  details?: Record<string, number | string>;
}

export interface DiceSimulationResult {
  trials: number;
  diceCount: number;
  rolls: number[];
  frequencies: Record<number, number>;
  probabilities: Record<number, number>;
  mean: number;
  mode: number[];
}

export interface CoinSimulationResult {
  trials: number;
  coinCount: number;
  headsTotal: number;
  tailsTotal: number;
  headsProb: number;
  tailsProb: number;
  results: Array<{ heads: number; tails: number }>;
}

export interface UnitCircleResult {
  angleDeg: number;
  angleRad: number;
  angleRadStr: string;
  quadrant: 1 | 2 | 3 | 4 | 'axis';
  sin: number;
  cos: number;
  tan: number | null;
  cot: number | null;
  exactSin?: string;
  exactCos?: string;
  pointM: { x: number; y: number };
}

export interface VectorOperationResult {
  v1: number[];
  v2: number[];
  dotProduct: number;
  crossProduct?: number[];
  magnitude1: number;
  magnitude2: number;
  angleDeg: number;
  angleRad: number;
  unitVector1: number[];
  unitVector2: number[];
  triangleArea?: number;
}

export class CasioEngine {
  /**
   * Evaluate arithmetic & scientific expressions in COMP mode
   */
  static evaluateExpression(
    rawExpr: string,
    angleMode: 'DEG' | 'RAD' = 'DEG',
    variables: Record<string, number> = {}
  ): { value: number; displayExact?: string; error?: string } {
    try {
      if (!rawExpr || !rawExpr.trim()) {
        return { value: 0 };
      }

      // Handle multi-statement execution separated by ':'
      if (rawExpr.includes(':')) {
        const statements = rawExpr.split(':').map((s) => s.trim()).filter(Boolean);
        let currentVars = { ...variables };
        let lastResult: { value: number; displayExact?: string; error?: string } = { value: 0 };

        for (const stmt of statements) {
          // Check for variable assignment e.g. "A = 5" or "A = A + 1"
          const assignMatch = stmt.match(/^([A-Fa-fxyM])\s*=\s*(.+)$/i);
          if (assignMatch) {
            const varName = assignMatch[1];
            const exprToEval = assignMatch[2];
            const evalRes = CasioEngine.evaluateExpression(exprToEval, angleMode, currentVars);
            if (evalRes.error) return evalRes;
            currentVars[varName] = evalRes.value;
            lastResult = evalRes;
          } else {
            const evalRes = CasioEngine.evaluateExpression(stmt, angleMode, currentVars);
            if (evalRes.error) return evalRes;
            lastResult = evalRes;
          }
        }
        return lastResult;
      }

      let expr = rawExpr;

      // Replace constants
      expr = expr.replace(/π/g, `(${Math.PI})`);
      expr = expr.replace(/\be\b/g, `(${Math.E})`);

      // Replace Random Functions
      expr = expr.replace(/RanInt#\(([^,]+),\s*([^)]+)\)/g, 'CasioEngine.ranInt($1, $2)');
      expr = expr.replace(/Ran#/g, '(Math.floor(Math.random()*1000)/1000)');

      // Replace GCD & LCM
      expr = expr.replace(/GCD\(([^,]+),\s*([^)]+)\)/g, 'CasioEngine.gcd($1, $2)');
      expr = expr.replace(/LCM\(([^,]+),\s*([^)]+)\)/g, 'CasioEngine.lcm($1, $2)');

      // Replace Int and Intg
      expr = expr.replace(/Intg\(([^)]+)\)/g, 'Math.floor($1)');
      expr = expr.replace(/Int\(([^)]+)\)/g, 'Math.trunc($1)');

      // Replace variables
      for (const [v, val] of Object.entries(variables)) {
        const regex = new RegExp(`\\b${v}\\b`, 'g');
        expr = expr.replace(regex, `(${val})`);
      }

      // Replace custom mathematical functions
      // Factorial: n!
      expr = expr.replace(/(\d+)!/g, (_, n) => `CasioEngine._fact(${n})`);

      // Percentage: n%
      expr = expr.replace(/(\d+(\.\d+)?)%/g, '($1/100)');

      // Powers: x² -> x^2, x³ -> x^3
      expr = expr.replace(/²/g, '^2');
      expr = expr.replace(/³/g, '^3');

      // Square roots: √(x) -> sqrt(x)
      expr = expr.replace(/√\(([^)]+)\)/g, 'Math.sqrt($1)');
      expr = expr.replace(/√(\d+(\.\d+)?)/g, 'Math.sqrt($1)');
      expr = expr.replace(/∛\(([^)]+)\)/g, 'Math.cbrt($1)');
      expr = expr.replace(/∛(\d+(\.\d+)?)/g, 'Math.cbrt($1)');

      // Trigonometric conversion based on DEG / RAD
      const toRad = angleMode === 'DEG' ? (val: number) => (val * Math.PI) / 180 : (val: number) => val;
      const fromRad = angleMode === 'DEG' ? (val: number) => (val * 180) / Math.PI : (val: number) => val;

      // Sin, Cos, Tan
      expr = expr.replace(/sin\(([^)]+)\)/g, (_, arg) => `Math.sin(${angleMode === 'DEG' ? `((${arg}) * Math.PI / 180)` : arg})`);
      expr = expr.replace(/cos\(([^)]+)\)/g, (_, arg) => `Math.cos(${angleMode === 'DEG' ? `((${arg}) * Math.PI / 180)` : arg})`);
      expr = expr.replace(/tan\(([^)]+)\)/g, (_, arg) => `Math.tan(${angleMode === 'DEG' ? `((${arg}) * Math.PI / 180)` : arg})`);

      // Inverse Trig: sin⁻¹, cos⁻¹, tan⁻¹
      expr = expr.replace(/sin⁻¹\(([^)]+)\)/g, (_, arg) => `(${angleMode === 'DEG' ? `Math.asin(${arg}) * 180 / Math.PI` : `Math.asin(${arg})`})`);
      expr = expr.replace(/cos⁻¹\(([^)]+)\)/g, (_, arg) => `(${angleMode === 'DEG' ? `Math.acos(${arg}) * 180 / Math.PI` : `Math.acos(${arg})`})`);
      expr = expr.replace(/tan⁻¹\(([^)]+)\)/g, (_, arg) => `(${angleMode === 'DEG' ? `Math.atan(${arg}) * 180 / Math.PI` : `Math.atan(${arg})`})`);

      // Logs: ln, log
      expr = expr.replace(/ln\(([^)]+)\)/g, 'Math.log($1)');
      expr = expr.replace(/log\(([^)]+)\)/g, 'Math.log10($1)');
      expr = expr.replace(/log_([0-9.]+)\(([^)]+)\)/g, '(Math.log($2)/Math.log($1))');

      // Exponentials: e^x, 10^x
      expr = expr.replace(/\^/g, '**');
      expr = expr.replace(/×/g, '*');
      expr = expr.replace(/÷/g, '/');

      // Combinations & Permutations: nCr, nPr -> CasioEngine._nCr(n, r), CasioEngine._nPr(n, r)
      expr = expr.replace(/(\d+)\s*C\s*(\d+)/g, 'CasioEngine._nCr($1, $2)');
      expr = expr.replace(/(\d+)\s*P\s*(\d+)/g, 'CasioEngine._nPr($1, $2)');

      // Absolute value: Abs(x) -> Math.abs(x)
      expr = expr.replace(/Abs\(([^)]+)\)/g, 'Math.abs($1)');

      // Safe JS evaluation with math sandbox
      const fn = new Function('Math', 'CasioEngine', `return (${expr});`);
      const val = fn(Math, CasioEngine);

      if (typeof val !== 'number' || isNaN(val)) {
        return { value: NaN, error: 'Math ERROR' };
      }

      if (!isFinite(val)) {
        return { value: val, error: 'Math ERROR (Vô cực / Chia cho 0)' };
      }

      // Check for exact fraction representation
      const exactFrac = CasioEngine.toFraction(val);

      return {
        value: val,
        displayExact: exactFrac || undefined,
      };
    } catch (e: any) {
      return { value: NaN, error: 'Syntax ERROR' };
    }
  }

  /**
   * Random integer generator RanInt#(min, max)
   */
  static ranInt(min: number, max: number): number {
    const a = Math.round(min);
    const b = Math.round(max);
    const low = Math.min(a, b);
    const high = Math.max(a, b);
    return Math.floor(Math.random() * (high - low + 1)) + low;
  }

  /**
   * Rectangular to Polar conversion Pol(x, y)
   */
  static pol(x: number, y: number, angleMode: 'DEG' | 'RAD' = 'DEG'): { r: number; theta: number; text: string } {
    const r = Math.hypot(x, y);
    let theta = Math.atan2(y, x);
    if (angleMode === 'DEG') {
      theta = (theta * 180) / Math.PI;
    }
    return {
      r: Number(r.toFixed(4)),
      theta: Number(theta.toFixed(4)),
      text: `r = ${r.toFixed(4)}, θ = ${theta.toFixed(4)}${angleMode === 'DEG' ? '°' : ' rad'}`,
    };
  }

  /**
   * Polar to Rectangular conversion Rec(r, theta)
   */
  static rec(r: number, theta: number, angleMode: 'DEG' | 'RAD' = 'DEG'): { x: number; y: number; text: string } {
    const rad = angleMode === 'DEG' ? (theta * Math.PI) / 180 : theta;
    const x = r * Math.cos(rad);
    const y = r * Math.sin(rad);
    return {
      x: Number(x.toFixed(4)),
      y: Number(y.toFixed(4)),
      text: `x = ${x.toFixed(4)}, y = ${y.toFixed(4)}`,
    };
  }

  /**
   * Numerical Equation Solver (SOLVE - SHIFT + CALC)
   */
  static solveNumericalEquation(
    equationStr: string,
    initialGuess = 0,
    angleMode: 'DEG' | 'RAD' = 'DEG'
  ): { x: number; lMinusR: number; iterations: number } | null {
    let lhs = equationStr;
    let rhs = '0';
    if (equationStr.includes('=')) {
      const parts = equationStr.split('=');
      lhs = parts[0];
      rhs = parts[1] || '0';
    }

    const f = (xVal: number) => {
      const l = CasioEngine.evaluateExpression(lhs, angleMode, { x: xVal }).value;
      const r = CasioEngine.evaluateExpression(rhs, angleMode, { x: xVal }).value;
      return l - r;
    };

    let x = initialGuess;
    const tol = 1e-9;
    const maxIter = 80;

    for (let i = 0; i < maxIter; i++) {
      const fx = f(x);
      if (Math.abs(fx) < tol) {
        return { x: Number(x.toFixed(6)), lMinusR: Number(fx.toFixed(8)), iterations: i };
      }
      const h = 1e-6;
      const dfx = (f(x + h) - f(x - h)) / (2 * h);
      if (Math.abs(dfx) < 1e-12) {
        x += (Math.random() - 0.5) * 2;
        continue;
      }
      const nextX = x - fx / dfx;
      if (!isFinite(nextX)) break;
      if (Math.abs(nextX - x) < tol) {
        const finalFx = f(nextX);
        return { x: Number(nextX.toFixed(6)), lMinusR: Number(finalFx.toFixed(8)), iterations: i };
      }
      x = nextX;
    }
    return null;
  }

  /**
   * Helper: Factorial n!
   */
  static _fact(n: number): number {
    if (n < 0 || n !== Math.floor(n)) return NaN;
    if (n === 0 || n === 1) return 1;
    let res = 1;
    for (let i = 2; i <= Math.min(n, 170); i++) res *= i;
    return res;
  }

  /**
   * Helper: Combination nCr
   */
  static _nCr(n: number, r: number): number {
    if (r < 0 || r > n) return 0;
    if (r === 0 || r === n) return 1;
    let res = 1;
    for (let i = 1; i <= r; i++) {
      res = (res * (n - i + 1)) / i;
    }
    return Math.round(res);
  }

  /**
   * Helper: Permutation nPr
   */
  static _nPr(n: number, r: number): number {
    if (r < 0 || r > n) return 0;
    if (r === 0) return 1;
    let res = 1;
    for (let i = 0; i < r; i++) {
      res *= (n - i);
    }
    return Math.round(res);
  }

  /**
   * Helper: GCD and LCM
   */
  static gcd(a: number, b: number): number {
    a = Math.abs(Math.round(a));
    b = Math.abs(Math.round(b));
    while (b) {
      const t = b;
      b = a % b;
      a = t;
    }
    return a;
  }

  static lcm(a: number, b: number): number {
    if (a === 0 || b === 0) return 0;
    return Math.abs(Math.round((a * b) / CasioEngine.gcd(a, b)));
  }

  /**
   * Prime Factorization (FACT)
   */
  static primeFactorization(num: number): string {
    let n = Math.abs(Math.round(num));
    if (n <= 1) return `${n}`;
    const factors: { prime: number; count: number }[] = [];
    let d = 2;
    while (d * d <= n) {
      if (n % d === 0) {
        let count = 0;
        while (n % d === 0) {
          count++;
          n /= d;
        }
        factors.push({ prime: d, count });
      }
      d = d === 2 ? 3 : d + 2;
    }
    if (n > 1) {
      factors.push({ prime: n, count: 1 });
    }
    return factors
      .map((f) => (f.count > 1 ? `${f.prime}^${f.count}` : `${f.prime}`))
      .join(' × ');
  }

  /**
   * Convert float to exact fraction (if simple)
   */
  static toFraction(val: number, tolerance = 1.0e-7): string | null {
    if (!isFinite(val) || Math.abs(val) > 1e7) return null;
    if (Number.isInteger(val)) return null;

    let h1 = 1, h2 = 0, k1 = 0, k2 = 1;
    let b = val;
    do {
      const a = Math.floor(b);
      let aux = h1;
      h1 = a * h1 + h2;
      h2 = aux;
      aux = k1;
      k1 = a * k1 + k2;
      k2 = aux;
      b = 1 / (b - a);
    } while (Math.abs(val - h1 / k1) > val * tolerance && k1 <= 10000);

    if (k1 > 1 && k1 <= 10000 && Math.abs(val - h1 / k1) < 1e-5) {
      return `${h1}/${k1}`;
    }
    return null;
  }

  /**
   * Numerical Derivative d/dx[f(x)] at x = x0
   */
  static derivative(expr: string, x0: number, h = 1e-6): number {
    const fPlus = CasioEngine.evaluateExpression(expr, 'RAD', { x: x0 + h }).value;
    const fMinus = CasioEngine.evaluateExpression(expr, 'RAD', { x: x0 - h }).value;
    return (fPlus - fMinus) / (2 * h);
  }

  /**
   * Numerical Definite Integral ∫_a^b f(x) dx using Simpson's Rule
   */
  static integral(expr: string, a: number, b: number, n = 100): number {
    if (n % 2 !== 0) n++;
    const h = (b - a) / n;
    let sum = CasioEngine.evaluateExpression(expr, 'RAD', { x: a }).value +
      CasioEngine.evaluateExpression(expr, 'RAD', { x: b }).value;

    for (let i = 1; i < n; i++) {
      const x = a + i * h;
      const fx = CasioEngine.evaluateExpression(expr, 'RAD', { x }).value;
      sum += (i % 2 === 0 ? 2 : 4) * fx;
    }
    return (h / 3) * sum;
  }

  /**
   * Summation ∑_{x=a}^b f(x)
   */
  static summation(expr: string, a: number, b: number): number {
    let sum = 0;
    const start = Math.round(a);
    const end = Math.round(b);
    for (let x = start; x <= end; x++) {
      const val = CasioEngine.evaluateExpression(expr, 'RAD', { x }).value;
      if (!isNaN(val)) sum += val;
    }
    return sum;
  }

  /**
   * Solve Quadratic Equation: ax² + bx + c = 0
   */
  static solveQuadratic(a: number, b: number, c: number): EquationResult {
    if (a === 0) {
      if (b === 0) {
        return {
          type: 'polynomial',
          degree: 2,
          roots: [],
          message: c === 0 ? 'Vô số nghiệm' : 'Vô nghiệm',
        };
      }
      return {
        type: 'polynomial',
        degree: 1,
        roots: [{ label: 'x₁', real: -c / b, exact: CasioEngine.toFraction(-c / b) || undefined }],
      };
    }

    const delta = b * b - 4 * a * c;
    const xVertex = -b / (2 * a);
    const yVertex = -delta / (4 * a);

    if (delta > 0) {
      const r1 = (-b + Math.sqrt(delta)) / (2 * a);
      const r2 = (-b - Math.sqrt(delta)) / (2 * a);
      return {
        type: 'polynomial',
        degree: 2,
        roots: [
          { label: 'x₁', real: r1, exact: CasioEngine.toFraction(r1) || undefined },
          { label: 'x₂', real: r2, exact: CasioEngine.toFraction(r2) || undefined },
        ],
        extrema: [
          { label: a > 0 ? 'Cực tiểu Parabol (x)' : 'Cực đại Parabol (x)', x: xVertex, y: yVertex },
        ],
      };
    } else if (delta === 0) {
      const r = -b / (2 * a);
      return {
        type: 'polynomial',
        degree: 2,
        roots: [{ label: 'x₁ = x₂', real: r, exact: CasioEngine.toFraction(r) || undefined }],
        extrema: [
          { label: a > 0 ? 'Cực tiểu Parabol (x)' : 'Cực đại Parabol (x)', x: xVertex, y: yVertex },
        ],
      };
    } else {
      // Complex roots
      const real = -b / (2 * a);
      const imag = Math.sqrt(-delta) / (2 * a);
      return {
        type: 'polynomial',
        degree: 2,
        roots: [
          { label: 'x₁', real, imag, exact: `${real.toFixed(4)} + ${imag.toFixed(4)}i` },
          { label: 'x₂', real, imag: -imag, exact: `${real.toFixed(4)} - ${imag.toFixed(4)}i` },
        ],
        extrema: [
          { label: a > 0 ? 'Cực tiểu Parabol (x)' : 'Cực đại Parabol (x)', x: xVertex, y: yVertex },
        ],
      };
    }
  }

  /**
   * Solve Cubic Equation: ax³ + bx² + cx + d = 0 (Cardano Formula)
   */
  static solveCubic(a: number, b: number, c: number, d: number): EquationResult {
    if (a === 0) {
      return CasioEngine.solveQuadratic(b, c, d);
    }

    // Convert to depressed cubic t^3 + pt + q = 0
    const p = (3 * a * c - b * b) / (3 * a * a);
    const q = (2 * b * b * b - 9 * a * b * c + 27 * a * a * d) / (27 * a * a * a);
    const delta = (q * q) / 4 + (p * p * p) / 27;

    const shift = -b / (3 * a);
    const roots: Array<{ label: string; real: number; imag?: number; exact?: string }> = [];

    if (delta > 0) {
      const u = Math.cbrt(-q / 2 + Math.sqrt(delta));
      const v = Math.cbrt(-q / 2 - Math.sqrt(delta));
      const realRoot = u + v + shift;
      const realPart = -(u + v) / 2 + shift;
      const imagPart = ((u - v) * Math.sqrt(3)) / 2;

      roots.push({ label: 'x₁', real: realRoot });
      roots.push({ label: 'x₂', real: realPart, imag: imagPart });
      roots.push({ label: 'x₃', real: realPart, imag: -imagPart });
    } else if (delta === 0) {
      const u = Math.cbrt(-q / 2);
      const r1 = 2 * u + shift;
      const r2 = -u + shift;
      roots.push({ label: 'x₁', real: r1 });
      roots.push({ label: 'x₂ = x₃', real: r2 });
    } else {
      // 3 real roots
      const r = Math.sqrt(-(p * p * p) / 27);
      const phi = Math.acos(-q / (2 * r));
      const m = 2 * Math.cbrt(r);

      const r1 = m * Math.cos(phi / 3) + shift;
      const r2 = m * Math.cos((phi + 2 * Math.PI) / 3) + shift;
      const r3 = m * Math.cos((phi + 4 * Math.PI) / 3) + shift;

      roots.push({ label: 'x₁', real: r1 });
      roots.push({ label: 'x₂', real: r2 });
      roots.push({ label: 'x₃', real: r3 });
    }

    // Cubic Extrema derivative: 3ax² + 2bx + c = 0
    const quadDeriv = CasioEngine.solveQuadratic(3 * a, 2 * b, c);
    const extrema: Array<{ label: string; x: number; y: number }> = [];

    if (quadDeriv.roots.length > 0 && !quadDeriv.roots[0].imag) {
      for (let i = 0; i < quadDeriv.roots.length; i++) {
        const xEx = quadDeriv.roots[i].real;
        const yEx = a * xEx ** 3 + b * xEx ** 2 + c * xEx + d;
        extrema.push({
          label: i === 0 ? 'Cực đại / Cực tiểu 1' : 'Cực đại / Cực tiểu 2',
          x: xEx,
          y: yEx,
        });
      }
    }

    return {
      type: 'polynomial',
      degree: 3,
      roots,
      extrema,
    };
  }

  /**
   * Helper: Evaluate Polynomial with Complex Input
   */
  static _evalPolyComplex(coeffs: number[], z: ComplexNumber): ComplexNumber {
    // coeffs: [c0, c1, c2, ..., cn] for c0 + c1*z + c2*z^2 + ...
    let res: ComplexNumber = { re: 0, im: 0 };
    let zPow: ComplexNumber = { re: 1, im: 0 };

    for (let i = 0; i < coeffs.length; i++) {
      if (coeffs[i] !== 0) {
        res = {
          re: res.re + coeffs[i] * zPow.re,
          im: res.im + coeffs[i] * zPow.im,
        };
      }
      zPow = CasioEngine._cMul(zPow, z);
    }
    return res;
  }

  static _cMul(a: ComplexNumber, b: ComplexNumber): ComplexNumber {
    return {
      re: a.re * b.re - a.im * b.im,
      im: a.re * b.im + a.im * b.re,
    };
  }

  static _cDiv(a: ComplexNumber, b: ComplexNumber): ComplexNumber {
    const denom = b.re * b.re + b.im * b.im;
    if (denom === 0) return { re: 0, im: 0 };
    return {
      re: (a.re * b.re + a.im * b.im) / denom,
      im: (a.im * b.re - a.re * b.im) / denom,
    };
  }

  /**
   * Helper: Calculate Quartic Extrema (derivative = 4ax³ + 3bx² + 2cx + d = 0)
   */
  static _quarticExtrema(
    a: number,
    b: number,
    c: number,
    d: number,
    e: number
  ): Array<{ label: string; x: number; y: number }> {
    const derivCubic = CasioEngine.solveCubic(4 * a, 3 * b, 2 * c, d);
    const extrema: Array<{ label: string; x: number; y: number }> = [];

    const realExPoints = derivCubic.roots
      .filter((r) => !r.imag || Math.abs(r.imag) < 1e-5)
      .map((r) => r.real);

    // Unique coordinates
    const uniqueX: number[] = [];
    for (const x of realExPoints) {
      if (!uniqueX.some((ux) => Math.abs(ux - x) < 1e-4)) {
        uniqueX.push(x);
      }
    }
    uniqueX.sort((x1, x2) => x1 - x2);

    uniqueX.forEach((xEx, idx) => {
      const yEx = a * xEx ** 4 + b * xEx ** 3 + c * xEx ** 2 + d * xEx + e;
      // Second derivative: f''(x) = 12ax² + 6bx + 2c
      const fDoublePrime = 12 * a * xEx ** 2 + 6 * b * xEx + 2 * c;
      const typeLabel =
        fDoublePrime > 1e-5
          ? 'Cực tiểu (Min)'
          : fDoublePrime < -1e-5
          ? 'Cực đại (Max)'
          : `Điểm uốn / Cực trị ${idx + 1}`;

      extrema.push({
        label: `${typeLabel} (x${idx + 1})`,
        x: Number(xEx.toFixed(4)),
        y: Number(yEx.toFixed(4)),
      });
    });

    return extrema;
  }

  /**
   * Solve Quartic Equation: ax⁴ + bx³ + cx² + dx + e = 0
   * (Phương trình bậc 4 - Chuẩn Casio fx-580 VN X ClassWiz)
   */
  static solveQuartic(
    a: number,
    b: number,
    c: number,
    d: number,
    e: number
  ): EquationResult {
    if (a === 0) {
      return CasioEngine.solveCubic(b, c, d, e);
    }

    // Monic polynomial: x^4 + c3*x^3 + c2*x^2 + c1*x + c0 = 0
    const c3 = b / a;
    const c2 = c / a;
    const c1 = d / a;
    const c0 = e / a;
    const coeffs = [c0, c1, c2, c3, 1];

    // Special case 1: e === 0 (x = 0 is a root)
    if (Math.abs(e) < 1e-12) {
      const cubicRes = CasioEngine.solveCubic(a, b, c, d);
      const roots: Array<{ label: string; real: number; imag?: number; exact?: string }> = [
        { label: 'x₁', real: 0, exact: '0' },
      ];
      cubicRes.roots.forEach((r, idx) => {
        roots.push({
          label: `x${idx + 2}`,
          real: r.real,
          imag: r.imag,
          exact: r.exact,
        });
      });
      const extrema = CasioEngine._quarticExtrema(a, b, c, d, e);
      return {
        type: 'polynomial',
        degree: 4,
        roots,
        extrema,
      };
    }

    // Special case 2: b === 0 and d === 0 (Biquadratic / Phương trình trùng phương)
    if (Math.abs(b) < 1e-9 && Math.abs(d) < 1e-9) {
      const quad = CasioEngine.solveQuadratic(a, c, e);
      const roots: Array<{ label: string; real: number; imag?: number; exact?: string }> = [];
      let rIdx = 1;

      for (const qr of quad.roots) {
        if (!qr.imag || Math.abs(qr.imag) < 1e-9) {
          const u = qr.real;
          if (u >= 0) {
            const sq = Math.sqrt(u);
            roots.push({ label: `x${rIdx++}`, real: sq, exact: CasioEngine.toFraction(sq) || undefined });
            roots.push({ label: `x${rIdx++}`, real: -sq, exact: CasioEngine.toFraction(-sq) || undefined });
          } else {
            const sq = Math.sqrt(-u);
            roots.push({ label: `x${rIdx++}`, real: 0, imag: sq, exact: `${sq.toFixed(4)}i` });
            roots.push({ label: `x${rIdx++}`, real: 0, imag: -sq, exact: `-${sq.toFixed(4)}i` });
          }
        } else {
          // Complex u = r * e^(i theta)
          const re = qr.real;
          const im = qr.imag;
          const mag = Math.sqrt(re * re + im * im);
          const theta = Math.atan2(im, re);
          const rSqrt = Math.sqrt(mag);
          const u1_re = rSqrt * Math.cos(theta / 2);
          const u1_im = rSqrt * Math.sin(theta / 2);
          roots.push({
            label: `x${rIdx++}`,
            real: u1_re,
            imag: u1_im,
            exact: `${u1_re.toFixed(4)} + ${u1_im.toFixed(4)}i`,
          });
          roots.push({
            label: `x${rIdx++}`,
            real: -u1_re,
            imag: -u1_im,
            exact: `${(-u1_re).toFixed(4)} - ${u1_im.toFixed(4)}i`,
          });
        }
      }

      // Sort roots
      roots.sort((r1, r2) => r1.real - r2.real);
      roots.forEach((r, i) => (r.label = `x${i + 1}`));

      const extrema = CasioEngine._quarticExtrema(a, b, c, d, e);
      return {
        type: 'polynomial',
        degree: 4,
        roots,
        extrema,
      };
    }

    // General Quartic: Durand-Kerner (Weierstrass) iteration
    const maxCoeff = Math.max(Math.abs(c3), Math.abs(c2), Math.abs(c1), Math.abs(c0));
    const R = Math.max(1, 1 + maxCoeff);
    let z: ComplexNumber[] = [
      { re: R * 0.8, im: R * 0.1 },
      { re: -R * 0.3, im: R * 0.7 },
      { re: -R * 0.7, im: -R * 0.5 },
      { re: R * 0.2, im: -R * 0.8 },
    ];

    for (let iter = 0; iter < 120; iter++) {
      let maxDiff = 0;
      const nextZ: ComplexNumber[] = [];

      for (let k = 0; k < 4; k++) {
        const pzk = CasioEngine._evalPolyComplex(coeffs, z[k]);
        let denom: ComplexNumber = { re: 1, im: 0 };
        for (let j = 0; j < 4; j++) {
          if (j !== k) {
            const diff = { re: z[k].re - z[j].re, im: z[k].im - z[j].im };
            denom = CasioEngine._cMul(denom, diff);
          }
        }
        const correction = CasioEngine._cDiv(pzk, denom);
        const updated = {
          re: z[k].re - correction.re,
          im: z[k].im - correction.im,
        };
        const diffMag = Math.hypot(correction.re, correction.im);
        if (diffMag > maxDiff) maxDiff = diffMag;
        nextZ.push(updated);
      }
      z = nextZ;
      if (maxDiff < 1e-12) break;
    }

    // Sort and format roots
    z.sort((r1, r2) => {
      if (Math.abs(r1.re - r2.re) > 1e-4) return r1.re - r2.re;
      return r1.im - r2.im;
    });

    const formattedRoots: Array<{
      label: string;
      real: number;
      imag?: number;
      exact?: string;
    }> = [];

    z.forEach((root, idx) => {
      const isReal = Math.abs(root.im) < 1e-5;
      const realVal = isReal ? (Math.abs(root.re) < 1e-9 ? 0 : root.re) : root.re;
      const imagVal = isReal ? undefined : root.im;

      const exactFrac = isReal ? CasioEngine.toFraction(realVal) : null;
      let exactDisplay: string | undefined = exactFrac || undefined;

      if (!isReal && imagVal !== undefined) {
        const sign = imagVal >= 0 ? '+' : '-';
        exactDisplay = `${realVal.toFixed(4)} ${sign} ${Math.abs(imagVal).toFixed(4)}i`;
      }

      formattedRoots.push({
        label: `x${idx + 1}`,
        real: Number(realVal.toFixed(6)),
        imag: imagVal !== undefined ? Number(imagVal.toFixed(6)) : undefined,
        exact: exactDisplay,
      });
    });

    const extrema = CasioEngine._quarticExtrema(a, b, c, d, e);

    return {
      type: 'polynomial',
      degree: 4,
      roots: formattedRoots,
      extrema,
    };
  }

  /**
   * Solve 2x2 Linear System: a1*x + b1*y = c1; a2*x + b2*y = c2
   */
  static solveLinear2x2(
    a1: number, b1: number, c1: number,
    a2: number, b2: number, c2: number
  ): EquationResult {
    const D = a1 * b2 - a2 * b1;
    const Dx = c1 * b2 - c2 * b1;
    const Dy = a1 * c2 - a2 * c1;

    if (D !== 0) {
      const x = Dx / D;
      const y = Dy / D;
      return {
        type: 'linear_system',
        variables: ['x', 'y'],
        roots: [
          { label: 'x', real: x, exact: CasioEngine.toFraction(x) || undefined },
          { label: 'y', real: y, exact: CasioEngine.toFraction(y) || undefined },
        ],
      };
    } else {
      return {
        type: 'linear_system',
        variables: ['x', 'y'],
        roots: [],
        message: Dx === 0 && Dy === 0 ? 'Hệ vô số nghiệm' : 'Hệ vô nghiệm',
      };
    }
  }

  /**
   * Solve 3x3 Linear System (Cramer's Rule)
   */
  static solveLinear3x3(matrix: number[][]): EquationResult {
    const det3 = (m: number[][]) =>
      m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) -
      m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) +
      m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);

    const A = [
      [matrix[0][0], matrix[0][1], matrix[0][2]],
      [matrix[1][0], matrix[1][1], matrix[1][2]],
      [matrix[2][0], matrix[2][1], matrix[2][2]],
    ];
    const D = det3(A);

    if (Math.abs(D) < 1e-12) {
      return {
        type: 'linear_system',
        variables: ['x', 'y', 'z'],
        roots: [],
        message: 'Hệ vô nghiệm hoặc vô số nghiệm (det = 0)',
      };
    }

    const Ax = [
      [matrix[0][3], matrix[0][1], matrix[0][2]],
      [matrix[1][3], matrix[1][1], matrix[1][2]],
      [matrix[2][3], matrix[2][1], matrix[2][2]],
    ];
    const Ay = [
      [matrix[0][0], matrix[0][3], matrix[0][2]],
      [matrix[1][0], matrix[1][3], matrix[1][2]],
      [matrix[2][0], matrix[2][3], matrix[2][2]],
    ];
    const Az = [
      [matrix[0][0], matrix[0][1], matrix[0][3]],
      [matrix[1][0], matrix[1][1], matrix[1][3]],
      [matrix[2][0], matrix[2][1], matrix[2][3]],
    ];

    const x = det3(Ax) / D;
    const y = det3(Ay) / D;
    const z = det3(Az) / D;

    return {
      type: 'linear_system',
      variables: ['x', 'y', 'z'],
      roots: [
        { label: 'x', real: x, exact: CasioEngine.toFraction(x) || undefined },
        { label: 'y', real: y, exact: CasioEngine.toFraction(y) || undefined },
        { label: 'z', real: z, exact: CasioEngine.toFraction(z) || undefined },
      ],
    };
  }

  /**
   * Generate Table of values for f(x)
   */
  static generateTable(
    expr: string,
    start: number,
    end: number,
    step: number
  ): Array<{ x: number; fx: number; exact?: string }> {
    if (step <= 0 || start > end) return [];
    const maxRows = 50;
    const rows: Array<{ x: number; fx: number; exact?: string }> = [];

    let curX = start;
    let count = 0;
    while (curX <= end + 1e-9 && count < maxRows) {
      const xVal = Number(curX.toFixed(6));
      const res = CasioEngine.evaluateExpression(expr, 'RAD', { x: xVal });
      rows.push({
        x: xVal,
        fx: res.value,
        exact: res.displayExact,
      });
      curX += step;
      count++;
    }
    return rows;
  }

  /**
   * Statistics 1-Variable Calculation
   */
  static calculateStatistics(data: number[]): StatResult | null {
    if (!data || data.length === 0) return null;
    const n = data.length;
    const sorted = [...data].sort((a, b) => a - b);
    const sum = data.reduce((acc, v) => acc + v, 0);
    const mean = sum / n;
    const sumSq = data.reduce((acc, v) => acc + v * v, 0);

    const variance = data.reduce((acc, v) => acc + (v - mean) ** 2, 0) / n;
    const stdDev = Math.sqrt(variance);
    const sampleVariance = n > 1 ? data.reduce((acc, v) => acc + (v - mean) ** 2, 0) / (n - 1) : 0;
    const sampleStdDev = Math.sqrt(sampleVariance);

    const min = sorted[0];
    const max = sorted[n - 1];

    const getMedian = (arr: number[]) => {
      const mid = Math.floor(arr.length / 2);
      return arr.length % 2 !== 0 ? arr[mid] : (arr[mid - 1] + arr[mid]) / 2;
    };

    const median = getMedian(sorted);
    const half = Math.floor(n / 2);
    const lowerHalf = sorted.slice(0, half);
    const upperHalf = n % 2 === 0 ? sorted.slice(half) : sorted.slice(half + 1);

    const q1 = lowerHalf.length > 0 ? getMedian(lowerHalf) : min;
    const q3 = upperHalf.length > 0 ? getMedian(upperHalf) : max;

    return {
      n,
      mean,
      sum,
      sumSq,
      variance,
      stdDev,
      sampleVariance,
      sampleStdDev,
      min,
      q1,
      median,
      q3,
      max,
    };
  }

  /**
   * Matrix Operations: Addition, Subtraction, Multiplication, Inverse, Transpose, Trace, Determinant
   */
  static matrixAdd(A: number[][], B: number[][]): number[][] {
    return A.map((row, r) => row.map((val, c) => val + (B[r]?.[c] ?? 0)));
  }

  static matrixSub(A: number[][], B: number[][]): number[][] {
    return A.map((row, r) => row.map((val, c) => val - (B[r]?.[c] ?? 0)));
  }

  static matrixMul(A: number[][], B: number[][]): number[][] {
    const rowsA = A.length;
    const colsA = A[0].length;
    const colsB = B[0].length;
    const res: number[][] = Array.from({ length: rowsA }, () => Array(colsB).fill(0));

    for (let i = 0; i < rowsA; i++) {
      for (let j = 0; j < colsB; j++) {
        let sum = 0;
        for (let k = 0; k < colsA; k++) {
          sum += A[i][k] * (B[k]?.[j] ?? 0);
        }
        res[i][j] = Number(sum.toFixed(8));
      }
    }
    return res;
  }

  static matrixScalarMul(A: number[][], k: number): number[][] {
    return A.map((row) => row.map((val) => Number((val * k).toFixed(8))));
  }

  static matrixTranspose(A: number[][]): number[][] {
    const rows = A.length;
    const cols = A[0].length;
    const res: number[][] = Array.from({ length: cols }, () => Array(rows).fill(0));
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        res[c][r] = A[r][c];
      }
    }
    return res;
  }

  static matrixTrace(A: number[][]): number {
    const size = Math.min(A.length, A[0].length);
    let tr = 0;
    for (let i = 0; i < size; i++) tr += A[i][i];
    return Number(tr.toFixed(8));
  }

  /**
   * Matrix Determinant (2x2, 3x3, 4x4)
   */
  static matrixDeterminant(m: number[][]): number {
    const n = m.length;
    if (n === 1) return m[0][0];
    if (n === 2 && m[0].length === 2) {
      return m[0][0] * m[1][1] - m[0][1] * m[1][0];
    }
    if (n === 3 && m[0].length === 3) {
      return (
        m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) -
        m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) +
        m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0])
      );
    }
    if (n === 4 && m[0].length === 4) {
      let det = 0;
      for (let j = 0; j < 4; j++) {
        const sub = m.slice(1).map((row) => row.filter((_, colIdx) => colIdx !== j));
        const sign = j % 2 === 0 ? 1 : -1;
        det += sign * m[0][j] * CasioEngine.matrixDeterminant(sub);
      }
      return Number(det.toFixed(8));
    }
    return 0;
  }

  /**
   * Matrix Inverse (A^-1) for 2x2 and 3x3
   */
  static matrixInverse(m: number[][]): number[][] | null {
    const det = CasioEngine.matrixDeterminant(m);
    if (Math.abs(det) < 1e-9) return null;

    if (m.length === 2) {
      return [
        [m[1][1] / det, -m[0][1] / det],
        [-m[1][0] / det, m[0][0] / det],
      ].map((row) => row.map((v) => Number(v.toFixed(6))));
    }

    if (m.length === 3) {
      const cofactors: number[][] = Array.from({ length: 3 }, () => Array(3).fill(0));
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          const sub = m
            .filter((_, rowIdx) => rowIdx !== r)
            .map((row) => row.filter((_, colIdx) => colIdx !== c));
          const subDet = sub[0][0] * sub[1][1] - sub[0][1] * sub[1][0];
          const sign = (r + c) % 2 === 0 ? 1 : -1;
          cofactors[r][c] = sign * subDet;
        }
      }
      const adj = CasioEngine.matrixTranspose(cofactors);
      return adj.map((row) => row.map((val) => Number((val / det).toFixed(6))));
    }
    return null;
  }

  /**
   * Vector Operations: Dot Product, Cross Product, Magnitude, Angles & Area
   */
  static vectorDot(v1: number[], v2: number[]): number {
    return v1.reduce((acc, val, i) => acc + val * (v2[i] || 0), 0);
  }

  static vectorCross3D(v1: number[], v2: number[]): number[] {
    return [
      v1[1] * (v2[2] ?? 0) - (v1[2] ?? 0) * v2[1],
      (v1[2] ?? 0) * v2[0] - v1[0] * (v2[2] ?? 0),
      v1[0] * v2[1] - v1[1] * v2[0],
    ];
  }

  static vectorMagnitude(v: number[]): number {
    return Math.sqrt(v.reduce((acc, val) => acc + val * val, 0));
  }

  static vectorAngle(v1: number[], v2: number[]): { deg: number; rad: number } {
    const dot = CasioEngine.vectorDot(v1, v2);
    const mag1 = CasioEngine.vectorMagnitude(v1);
    const mag2 = CasioEngine.vectorMagnitude(v2);
    if (mag1 === 0 || mag2 === 0) return { deg: 0, rad: 0 };
    const cosTheta = Math.max(-1, Math.min(1, dot / (mag1 * mag2)));
    const rad = Math.acos(cosTheta);
    const deg = (rad * 180) / Math.PI;
    return { deg: Number(deg.toFixed(4)), rad: Number(rad.toFixed(6)) };
  }

  static vectorUnit(v: number[]): number[] {
    const mag = CasioEngine.vectorMagnitude(v);
    if (mag === 0) return v.map(() => 0);
    return v.map((x) => Number((x / mag).toFixed(6)));
  }

  /**
   * Complex Number Utilities: Modulus, Argument, Conjugate, Polar form
   */
  static complexModulus(z: ComplexNumber): number {
    return Math.hypot(z.re, z.im);
  }

  static complexArg(z: ComplexNumber, angleMode: 'DEG' | 'RAD' = 'DEG'): number {
    const rad = Math.atan2(z.im, z.re);
    return angleMode === 'DEG' ? Number(((rad * 180) / Math.PI).toFixed(4)) : Number(rad.toFixed(6));
  }

  static complexConjugate(z: ComplexNumber): ComplexNumber {
    return { re: z.re, im: -z.im };
  }

  static complexToPolar(z: ComplexNumber, angleMode: 'DEG' | 'RAD' = 'DEG'): { r: number; theta: number; text: string } {
    const r = CasioEngine.complexModulus(z);
    const theta = CasioEngine.complexArg(z, angleMode);
    return {
      r: Number(r.toFixed(4)),
      theta,
      text: `${r.toFixed(4)} ∠ ${theta}°`,
    };
  }

  static complexPower(z: ComplexNumber, n: number): ComplexNumber {
    const r = Math.hypot(z.re, z.im);
    const theta = Math.atan2(z.im, z.re);
    const rN = Math.pow(r, n);
    const thetaN = theta * n;
    return {
      re: Number((rN * Math.cos(thetaN)).toFixed(6)),
      im: Number((rN * Math.sin(thetaN)).toFixed(6)),
    };
  }

  /**
   * Solve Inequality (Bất phương trình Casio Mode A)
   * Degrees 2, 3, 4 with >, >=, <, <=
   */
  static solveInequality(
    degree: 2 | 3 | 4,
    coeffs: number[],
    op: '>' | '>=' | '<' | '<='
  ): InequalityResult {
    let roots: number[] = [];
    let evalFn: (x: number) => number;

    if (degree === 2) {
      const [a, b, c] = coeffs;
      evalFn = (x) => a * x * x + b * x + c;
      const res = CasioEngine.solveQuadratic(a, b, c);
      roots = res.roots.filter((r) => !r.imag).map((r) => r.real);
    } else if (degree === 3) {
      const [a, b, c, d] = coeffs;
      evalFn = (x) => a * x * x * x + b * x * x + c * x + d;
      const res = CasioEngine.solveCubic(a, b, c, d);
      roots = res.roots.filter((r) => !r.imag).map((r) => r.real);
    } else {
      const [a, b, c, d, e] = coeffs;
      evalFn = (x) => a * x ** 4 + b * x ** 3 + c * x ** 2 + d * x + e;
      const res = CasioEngine.solveQuartic(a, b, c, d, e);
      roots = res.roots.filter((r) => !r.imag).map((r) => r.real);
    }

    // Sort unique roots
    const uniqueRoots: number[] = [];
    for (const r of roots.sort((r1, r2) => r1 - r2)) {
      if (!uniqueRoots.some((ur) => Math.abs(ur - r) < 1e-4)) {
        uniqueRoots.push(Number(r.toFixed(4)));
      }
    }

    const testSatisfies = (val: number) => {
      const y = evalFn(val);
      if (op === '>') return y > 1e-7;
      if (op === '>=') return y >= -1e-7;
      if (op === '<') return y < -1e-7;
      if (op === '<=') return y <= 1e-7;
      return false;
    };

    // Construct Intervals
    const testPoints: { mid: number; isInfinityLeft?: boolean; isInfinityRight?: boolean; l?: number; r?: number }[] = [];
    if (uniqueRoots.length === 0) {
      testPoints.push({ mid: 0, isInfinityLeft: true, isInfinityRight: true });
    } else {
      testPoints.push({ mid: uniqueRoots[0] - 1, isInfinityLeft: true, r: uniqueRoots[0] });
      for (let i = 0; i < uniqueRoots.length - 1; i++) {
        testPoints.push({
          mid: (uniqueRoots[i] + uniqueRoots[i + 1]) / 2,
          l: uniqueRoots[i],
          r: uniqueRoots[i + 1],
        });
      }
      testPoints.push({
        mid: uniqueRoots[uniqueRoots.length - 1] + 1,
        isInfinityRight: true,
        l: uniqueRoots[uniqueRoots.length - 1],
      });
    }

    const validIntervals: Array<{ start?: number; end?: number; includeStart?: boolean; includeEnd?: boolean }> = [];
    const includeBound = op === '>=' || op === '<=';

    for (const seg of testPoints) {
      if (testSatisfies(seg.mid)) {
        validIntervals.push({
          start: seg.l,
          end: seg.r,
          includeStart: seg.l !== undefined ? includeBound : undefined,
          includeEnd: seg.r !== undefined ? includeBound : undefined,
        });
      }
    }

    // Format text
    let solutionText = '';
    if (validIntervals.length === 0) {
      solutionText = 'Vô nghiệm (No Solution)';
    } else if (uniqueRoots.length === 0 && validIntervals.length === 1) {
      solutionText = 'Tất cả các số thực ℝ (All Real Numbers)';
    } else {
      const parts = validIntervals.map((iv) => {
        if (iv.start === undefined && iv.end !== undefined) {
          return `x ${includeBound ? '≤' : '<'} ${iv.end}`;
        }
        if (iv.start !== undefined && iv.end === undefined) {
          return `x ${includeBound ? '≥' : '>'} ${iv.start}`;
        }
        if (iv.start !== undefined && iv.end !== undefined) {
          return `${iv.start} ${includeBound ? '≤' : '<'} x ${includeBound ? '≤' : '<'} ${iv.end}`;
        }
        return 'ℝ';
      });
      solutionText = parts.join(' hoặc ');
    }

    return {
      degree,
      operator: op,
      intervals: validIntervals,
      solutionText,
      roots: uniqueRoots,
    };
  }

  /**
   * Probability Distributions (Mode 7 / STAT-DIST)
   */
  static normalPD(x: number, mean = 0, stdDev = 1): number {
    if (stdDev <= 0) return 0;
    const exponent = -Math.pow(x - mean, 2) / (2 * stdDev * stdDev);
    return (1 / (stdDev * Math.sqrt(2 * Math.PI))) * Math.exp(exponent);
  }

  static normalCD(lower: number, upper: number, mean = 0, stdDev = 1): number {
    // Numerical integration of normalPD
    const steps = 100;
    const h = (upper - lower) / steps;
    let sum = CasioEngine.normalPD(lower, mean, stdDev) + CasioEngine.normalPD(upper, mean, stdDev);
    for (let i = 1; i < steps; i++) {
      const xi = lower + i * h;
      sum += (i % 2 === 0 ? 2 : 4) * CasioEngine.normalPD(xi, mean, stdDev);
    }
    return Number(((h / 3) * sum).toFixed(6));
  }

  static binomialPD(x: number, n: number, p: number): number {
    if (x < 0 || x > n || p < 0 || p > 1) return 0;
    const comb = CasioEngine._nCr(n, x);
    const prob = comb * Math.pow(p, x) * Math.pow(1 - p, n - x);
    return Number(prob.toFixed(6));
  }

  static binomialCD(x: number, n: number, p: number): number {
    let sum = 0;
    for (let k = 0; k <= Math.min(x, n); k++) {
      sum += CasioEngine.binomialPD(k, n, p);
    }
    return Number(sum.toFixed(6));
  }

  static poissonPD(x: number, lambda: number): number {
    if (x < 0 || lambda <= 0) return 0;
    const fact = CasioEngine._fact(x);
    const val = (Math.exp(-lambda) * Math.pow(lambda, x)) / fact;
    return Number(val.toFixed(6));
  }

  /**
   * Math Box: Dice Roll Simulation (fx-880BTG Math Box)
   */
  static rollDice(diceCount: 1 | 2 | 3, trials: number): DiceSimulationResult {
    const rolls: number[] = [];
    const minSum = diceCount;
    const maxSum = diceCount * 6;
    const frequencies: Record<number, number> = {};
    for (let s = minSum; s <= maxSum; s++) frequencies[s] = 0;

    for (let t = 0; t < trials; t++) {
      let sum = 0;
      for (let d = 0; d < diceCount; d++) {
        sum += Math.floor(Math.random() * 6) + 1;
      }
      rolls.push(sum);
      frequencies[sum] = (frequencies[sum] || 0) + 1;
    }

    const probabilities: Record<number, number> = {};
    for (let s = minSum; s <= maxSum; s++) {
      probabilities[s] = Number(((frequencies[s] / trials) * 100).toFixed(2));
    }

    const mean = Number((rolls.reduce((a, b) => a + b, 0) / trials).toFixed(3));
    let maxFreq = 0;
    for (const f of Object.values(frequencies)) {
      if (f > maxFreq) maxFreq = f;
    }
    const mode = Object.keys(frequencies)
      .map(Number)
      .filter((k) => frequencies[k] === maxFreq);

    return {
      trials,
      diceCount,
      rolls,
      frequencies,
      probabilities,
      mean,
      mode,
    };
  }

  /**
   * Math Box: Coin Toss Simulation (fx-880BTG Math Box)
   */
  static tossCoins(coinCount: 1 | 2 | 3, trials: number): CoinSimulationResult {
    let headsTotal = 0;
    let tailsTotal = 0;
    const results: Array<{ heads: number; tails: number }> = [];

    for (let t = 0; t < trials; t++) {
      let heads = 0;
      for (let c = 0; c < coinCount; c++) {
        if (Math.random() < 0.5) heads++;
      }
      const tails = coinCount - heads;
      headsTotal += heads;
      tailsTotal += tails;
      results.push({ heads, tails });
    }

    const totalFlips = trials * coinCount;
    return {
      trials,
      coinCount,
      headsTotal,
      tailsTotal,
      headsProb: Number(((headsTotal / totalFlips) * 100).toFixed(2)),
      tailsProb: Number(((tailsTotal / totalFlips) * 100).toFixed(2)),
      results,
    };
  }

  /**
   * Math Box: Unit Circle (Vòng tròn lượng giác tương tác fx-880)
   */
  static unitCircle(angleDeg: number): UnitCircleResult {
    const normalizedDeg = ((angleDeg % 360) + 360) % 360;
    const rad = (normalizedDeg * Math.PI) / 180;
    const sinVal = Math.sin(rad);
    const cosVal = Math.cos(rad);

    let quadrant: 1 | 2 | 3 | 4 | 'axis';
    if (normalizedDeg === 0 || normalizedDeg === 90 || normalizedDeg === 180 || normalizedDeg === 270) {
      quadrant = 'axis';
    } else if (normalizedDeg > 0 && normalizedDeg < 90) quadrant = 1;
    else if (normalizedDeg > 90 && normalizedDeg < 180) quadrant = 2;
    else if (normalizedDeg > 180 && normalizedDeg < 270) quadrant = 3;
    else quadrant = 4;

    const tanVal = Math.abs(cosVal) < 1e-9 ? null : sinVal / cosVal;
    const cotVal = Math.abs(sinVal) < 1e-9 ? null : cosVal / sinVal;

    // Exact string representation for common angles
    const exactMap: Record<number, { sin: string; cos: string }> = {
      0: { sin: '0', cos: '1' },
      30: { sin: '1/2', cos: '√3/2' },
      45: { sin: '√2/2', cos: '√2/2' },
      60: { sin: '√3/2', cos: '1/2' },
      90: { sin: '1', cos: '0' },
      120: { sin: '√3/2', cos: '-1/2' },
      135: { sin: '√2/2', cos: '-√2/2' },
      150: { sin: '1/2', cos: '-√3/2' },
      180: { sin: '0', cos: '-1' },
      210: { sin: '-1/2', cos: '-√3/2' },
      225: { sin: '-√2/2', cos: '-√2/2' },
      240: { sin: '-√3/2', cos: '-1/2' },
      270: { sin: '-1', cos: '0' },
      300: { sin: '-√3/2', cos: '1/2' },
      315: { sin: '-√2/2', cos: '√2/2' },
      330: { sin: '-1/2', cos: '√3/2' },
      360: { sin: '0', cos: '1' },
    };

    const exact = exactMap[normalizedDeg];

    return {
      angleDeg: normalizedDeg,
      angleRad: Number(rad.toFixed(4)),
      angleRadStr: `${(normalizedDeg / 180).toFixed(2)}π rad`,
      quadrant,
      sin: Number(sinVal.toFixed(6)),
      cos: Number(cosVal.toFixed(6)),
      tan: tanVal !== null ? Number(tanVal.toFixed(6)) : null,
      cot: cotVal !== null ? Number(cotVal.toFixed(6)) : null,
      exactSin: exact?.sin,
      exactCos: exact?.cos,
      pointM: { x: Number(cosVal.toFixed(4)), y: Number(sinVal.toFixed(4)) },
    };
  }

  /**
   * Base-N System Conversions and Bitwise Operations (Mode 3)
   */
  static convertBase(val: string, fromBase: 2 | 8 | 10 | 16): {
    dec: number;
    bin: string;
    oct: string;
    hex: string;
  } {
    const num = parseInt(val, fromBase) || 0;
    return {
      dec: num,
      bin: (num >>> 0).toString(2),
      oct: (num >>> 0).toString(8),
      hex: (num >>> 0).toString(16).toUpperCase(),
    };
  }

  static bitwiseOp(a: number, b: number, op: 'AND' | 'OR' | 'XOR' | 'NOT' | 'XNOR'): number {
    switch (op) {
      case 'AND': return a & b;
      case 'OR': return a | b;
      case 'XOR': return a ^ b;
      case 'NOT': return ~a;
      case 'XNOR': return ~(a ^ b);
      default: return 0;
    }
  }

  /**
   * Ratio Solver: A:B = X:D or A:B = C:X (Mode B)
   */
  static solveRatio(type: 'AXD' | 'ABCX', a: number, b: number, known: number): number {
    if (type === 'AXD') {
      // A : B = X : D  => X = (A * D) / B
      return b !== 0 ? (a * known) / b : 0;
    } else {
      // A : B = C : X  => X = (B * C) / A
      return a !== 0 ? (b * known) / a : 0;
    }
  }
}
