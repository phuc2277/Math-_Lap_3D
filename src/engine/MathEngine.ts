/**
 * MATH ENGINE - Pure, deterministic mathematical calculation engine for Math Lab.
 * No AI is used for formula evaluations or calculations.
 */

export interface LinearFunction {
  a: number; // Slope
  b: number; // Y-intercept
}

export interface LinearIntersection {
  type: 'single' | 'parallel' | 'coincident';
  point?: { x: number; y: number };
  explanation: string;
}

export interface ParabolaLineIntersection {
  type: 'none' | 'tangent' | 'secant';
  discriminant: number; // Delta = m^2 + 4an
  points: { x: number; y: number }[];
  explanation: string;
}

export class MathEngine {
  // ----------------------------------------------------
  // LINEAR FUNCTIONS & GEOMETRY
  // ----------------------------------------------------

  /** Evaluate y = ax + b at x */
  public static evalLinear(a: number, b: number, x: number): number {
    return a * x + b;
  }

  /** Calculate slope a = (y2 - y1) / (x2 - x1) */
  public static calculateSlope(
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ): { slope: number; dx: number; dy: number } {
    const dx = x2 - x1;
    const dy = y2 - y1;
    if (Math.abs(dx) < 1e-9) {
      return { slope: Infinity, dx: 0, dy };
    }
    return { slope: dy / dx, dx, dy };
  }

  /** Calculate intersection point of d1: y = a1*x + b1 and d2: y = a2*x + b2 */
  public static calculateLinearIntersection(
    a1: number,
    b1: number,
    a2: number,
    b2: number
  ): LinearIntersection {
    const deltaA = a1 - a2;
    if (Math.abs(deltaA) < 1e-6) {
      if (Math.abs(b1 - b2) < 1e-6) {
        return {
          type: 'coincident',
          explanation: 'Hai đường thẳng trùng nhau hoàn toàn (a₁ = a₂, b₁ = b₂).',
        };
      }
      return {
        type: 'parallel',
        explanation: 'Hai đường thẳng song song với nhau (a₁ = a₂, b₁ ≠ b₂).',
      };
    }

    const x = (b2 - b1) / deltaA;
    const y = a1 * x + b1;
    return {
      type: 'single',
      point: { x: Number(x.toFixed(2)), y: Number(y.toFixed(2)) },
      explanation: `Hai đường thẳng cắt nhau tại điểm A(${x.toFixed(2)}, ${y.toFixed(2)}).`,
    };
  }

  /** Check if two lines are perpendicular (a1 * a2 = -1) */
  public static isPerpendicular(a1: number, a2: number): boolean {
    return Math.abs(a1 * a2 + 1) < 1e-4;
  }

  // ----------------------------------------------------
  // QUADRATIC & PARABOLA
  // ----------------------------------------------------

  /** Evaluate y = ax^2 */
  public static evalParabola(a: number, x: number): number {
    return a * x * x;
  }

  /** Evaluate y = a(x - h)^2 + k */
  public static evalParabolaShifted(
    a: number,
    h: number,
    k: number,
    x: number
  ): number {
    return a * Math.pow(x - h, 2) + k;
  }

  /**
   * Intersection of Parabola y = ax^2 and Line y = mx + n
   * ax^2 - mx - n = 0
   * Delta = (-m)^2 - 4 * a * (-n) = m^2 + 4an
   */
  public static calculateParabolaLineIntersection(
    a: number,
    m: number,
    n: number
  ): ParabolaLineIntersection {
    if (Math.abs(a) < 1e-6) {
      // Degenerates to line-line intersection
      const inter = MathEngine.calculateLinearIntersection(0, 0, m, n);
      return {
        type: inter.point ? 'tangent' : 'none',
        discriminant: 0,
        points: inter.point ? [inter.point] : [],
        explanation: inter.explanation,
      };
    }

    // Delta = m^2 + 4 * a * n
    const discriminant = m * m + 4 * a * n;

    if (discriminant < -1e-6) {
      return {
        type: 'none',
        discriminant: Number(discriminant.toFixed(2)),
        points: [],
        explanation: `Δ = ${discriminant.toFixed(2)} < 0: Đường thẳng và parabol không có điểm chung.`,
      };
    }

    if (Math.abs(discriminant) <= 1e-6) {
      const x = m / (2 * a);
      const y = a * x * x;
      return {
        type: 'tangent',
        discriminant: 0,
        points: [{ x: Number(x.toFixed(2)), y: Number(y.toFixed(2)) }],
        explanation: `Δ = 0: Đường thẳng tiếp xúc với parabol tại điểm (${x.toFixed(2)}, ${y.toFixed(2)}).`,
      };
    }

    // Delta > 0
    const sqrtDelta = Math.sqrt(discriminant);
    const x1 = (m + sqrtDelta) / (2 * a);
    const y1 = a * x1 * x1;
    const x2 = (m - sqrtDelta) / (2 * a);
    const y2 = a * x2 * x2;

    return {
      type: 'secant',
      discriminant: Number(discriminant.toFixed(2)),
      points: [
        { x: Number(x1.toFixed(2)), y: Number(y1.toFixed(2)) },
        { x: Number(x2.toFixed(2)), y: Number(y2.toFixed(2)) },
      ],
      explanation: `Δ = ${discriminant.toFixed(2)} > 0: Đường thẳng cắt parabol tại 2 điểm phân biệt (${x1.toFixed(2)}, ${y1.toFixed(2)}) và (${x2.toFixed(2)}, ${y2.toFixed(2)}).`,
    };
  }

  // ----------------------------------------------------
  // STATISTICS FORMULAS
  // ----------------------------------------------------

  public static calculateMean(data: number[]): number {
    if (data.length === 0) return 0;
    const sum = data.reduce((acc, val) => acc + val, 0);
    return Number((sum / data.length).toFixed(2));
  }

  public static calculateMedian(data: number[]): number {
    if (data.length === 0) return 0;
    const sorted = [...data].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    if (sorted.length % 2 === 0) {
      return Number(((sorted[mid - 1] + sorted[mid]) / 2).toFixed(2));
    }
    return sorted[mid];
  }

  public static calculateMode(data: number[]): number[] {
    if (data.length === 0) return [];
    const counts: Record<number, number> = {};
    let maxCount = 0;

    data.forEach((val) => {
      counts[val] = (counts[val] || 0) + 1;
      if (counts[val] > maxCount) maxCount = counts[val];
    });

    if (maxCount <= 1) return []; // No mode if all occur once

    return Object.keys(counts)
      .filter((key) => counts[Number(key)] === maxCount)
      .map(Number)
      .sort((a, b) => a - b);
  }

  public static calculateRange(data: number[]): number {
    if (data.length === 0) return 0;
    const min = Math.min(...data);
    const max = Math.max(...data);
    return Number((max - min).toFixed(2));
  }

  public static calculateFrequencies(data: number[]): { value: number; frequency: number; relativeFreq: number }[] {
    if (data.length === 0) return [];
    const counts: Record<number, number> = {};
    data.forEach((v) => {
      counts[v] = (counts[v] || 0) + 1;
    });

    const total = data.length;
    return Object.keys(counts)
      .map(Number)
      .sort((a, b) => a - b)
      .map((val) => ({
        value: val,
        frequency: counts[val],
        relativeFreq: Number((counts[val] / total).toFixed(4)),
      }));
  }

  // ----------------------------------------------------
  // PROBABILITY FORMULAS
  // ----------------------------------------------------

  public static calculateTheoreticalProbability(
    experimentType: 'coin' | 'dice' | 'two_dice' | 'marbles',
    targetEvent: string,
    params?: any
  ): number {
    switch (experimentType) {
      case 'coin':
        return 0.5; // P(Heads) = 0.5
      case 'dice':
        if (targetEvent === 'even') return 0.5; // 2, 4, 6 -> 3/6
        if (targetEvent === 'odd') return 0.5;
        return 1 / 6; // Single face (e.g., face 6)
      case 'two_dice':
        // Sum target (e.g. sum = 7)
        const targetSum = Number(targetEvent);
        if (isNaN(targetSum) || targetSum < 2 || targetSum > 12) return 1 / 11;
        // Count combinations summing to targetSum
        let ways = 0;
        for (let d1 = 1; d1 <= 6; d1++) {
          for (let d2 = 1; d2 <= 6; d2++) {
            if (d1 + d2 === targetSum) ways++;
          }
        }
        return Number((ways / 36).toFixed(4));
      case 'marbles':
        const red = params?.red || 0;
        const blue = params?.blue || 0;
        const yellow = params?.yellow || 0;
        const total = red + blue + yellow;
        if (total === 0) return 0;
        if (targetEvent === 'red') return Number((red / total).toFixed(4));
        if (targetEvent === 'blue') return Number((blue / total).toFixed(4));
        if (targetEvent === 'yellow') return Number((yellow / total).toFixed(4));
        return 0;
      default:
        return 0.5;
    }
  }

  public static calculateRelativeFrequency(
    successes: number,
    totalTrials: number
  ): number {
    if (totalTrials === 0) return 0;
    return Number((successes / totalTrials).toFixed(4));
  }
}
