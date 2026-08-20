export interface Point2D {
  x: number;
  y: number;
}

export type LineCircleStatus = 'outside' | 'tangent' | 'secant';

export interface LineCircleAnalysis {
  O: Point2D;
  R: number;
  h: number;
  angleDeg: number;
  footH: Point2D;
  status: LineCircleStatus;
  statusLabel: string;
  pointsCount: 0 | 1 | 2;
  intersections: Point2D[];
  chordLength: number;
  tangentPoint: Point2D | null;
  lineP1: Point2D;
  lineP2: Point2D;
}

export type TwoCirclesStatus =
  | 'outside'
  | 'tangent_external'
  | 'intersecting'
  | 'tangent_internal'
  | 'inside'
  | 'concentric'
  | 'coincident';

export interface TwoCirclesAnalysis {
  O1: Point2D;
  O2: Point2D;
  R1: number;
  R2: number;
  d: number;
  status: TwoCirclesStatus;
  statusLabel: string;
  pointsCount: number; // 0, 1, 2, or Infinity (used as 999 for coincident)
  intersections: Point2D[];
  chordLength: number;
  tangentPoint: Point2D | null;
  collinearLine: { p1: Point2D; p2: Point2D };
}

export const EPSILON = 0.08; // Threshold tolerance for snap / smooth geometry state detection

/**
 * Calculates analysis for Line and Circle position relative to each other.
 * @param O Center point of circle
 * @param R Radius of circle
 * @param h Distance from O to line d
 * @param angleDeg Angle of line d in degrees (0 to 180)
 */
export function analyzeLineCircle(
  O: Point2D,
  R: number,
  h: number,
  angleDeg: number
): LineCircleAnalysis {
  const rad = (angleDeg * Math.PI) / 180;
  // Direction vector along line d
  const dirX = Math.cos(rad);
  const dirY = Math.sin(rad);

  // Normal unit vector pointing from O towards line d
  const normX = -Math.sin(rad);
  const normY = Math.cos(rad);

  // Foot of perpendicular H on line d from O
  const footH: Point2D = {
    x: O.x + h * normX,
    y: O.y + h * normY,
  };

  // Line points for rendering (long enough segment)
  const lineExtent = Math.max(R * 3, 15);
  const lineP1: Point2D = {
    x: footH.x - lineExtent * dirX,
    y: footH.y - lineExtent * dirY,
  };
  const lineP2: Point2D = {
    x: footH.x + lineExtent * dirX,
    y: footH.y + lineExtent * dirY,
  };

  const diff = h - R;

  let status: LineCircleStatus = 'outside';
  let statusLabel = 'Đường thẳng không cắt đường tròn';
  let pointsCount: 0 | 1 | 2 = 0;
  let intersections: Point2D[] = [];
  let chordLength = 0;
  let tangentPoint: Point2D | null = null;

  if (diff > EPSILON) {
    // Case 1: h > R -> Outside
    status = 'outside';
    statusLabel = 'Đường thẳng không cắt đường tròn (h > R)';
    pointsCount = 0;
  } else if (Math.abs(diff) <= EPSILON) {
    // Case 2: h ≈ R -> Tangent
    status = 'tangent';
    statusLabel = 'Đường thẳng tiếp xúc đường tròn (h = R)';
    pointsCount = 1;
    tangentPoint = {
      x: O.x + R * normX,
      y: O.y + R * normY,
    };
    intersections = [tangentPoint];
  } else {
    // Case 3: h < R -> Secant (cắt tại 2 điểm)
    status = 'secant';
    statusLabel = 'Đường thẳng cắt đường tròn tại hai điểm (h < R)';
    pointsCount = 2;
    const halfChord = Math.sqrt(Math.max(0, R * R - h * h));
    chordLength = 2 * halfChord;

    const ptA: Point2D = {
      x: footH.x - halfChord * dirX,
      y: footH.y - halfChord * dirY,
    };
    const ptB: Point2D = {
      x: footH.x + halfChord * dirX,
      y: footH.y + halfChord * dirY,
    };
    intersections = [ptA, ptB];
  }

  return {
    O,
    R,
    h,
    angleDeg,
    footH,
    status,
    statusLabel,
    pointsCount,
    intersections,
    chordLength,
    tangentPoint,
    lineP1,
    lineP2,
  };
}

/**
 * Calculates analysis for relative positions of two circles (O1, R1) and (O2, R2).
 */
export function analyzeTwoCircles(
  O1: Point2D,
  R1: number,
  O2: Point2D,
  R2: number
): TwoCirclesAnalysis {
  const dx = O2.x - O1.x;
  const dy = O2.y - O1.y;
  const d = Math.sqrt(dx * dx + dy * dy);

  // Unit vector along centers line O1 -> O2
  const ux = d > 0 ? dx / d : 1;
  const uy = d > 0 ? dy / d : 0;

  const Rmax = Math.max(R1, R2);
  const Rmin = Math.min(R1, R2);
  const Rsum = R1 + R2;
  const Rdiff = Math.abs(R1 - R2);

  let status: TwoCirclesStatus = 'outside';
  let statusLabel = '';
  let pointsCount = 0;
  let intersections: Point2D[] = [];
  let chordLength = 0;
  let tangentPoint: Point2D | null = null;

  const collinearLine = {
    p1: { x: O1.x - (ux * (Rmax + 2)), y: O1.y - (uy * (Rmax + 2)) },
    p2: { x: O2.x + (ux * (Rmax + 2)), y: O2.y + (uy * (Rmax + 2)) },
  };

  if (d <= EPSILON) {
    // Concentric or Coincident
    if (Math.abs(R1 - R2) <= EPSILON) {
      status = 'coincident';
      statusLabel = 'Hai đường tròn trùng nhau (d = 0, R = r)';
      pointsCount = Infinity;
    } else {
      status = 'concentric';
      statusLabel = 'Hai đường tròn đồng tâm (d = 0, R ≠ r)';
      pointsCount = 0;
    }
  } else if (d > Rsum + EPSILON) {
    // 1. Outside
    status = 'outside';
    statusLabel = 'Hai đường tròn ở ngoài nhau (d > R + r)';
    pointsCount = 0;
  } else if (Math.abs(d - Rsum) <= EPSILON) {
    // 2. External tangent
    status = 'tangent_external';
    statusLabel = 'Hai đường tròn tiếp xúc ngoài (d = R + r)';
    pointsCount = 1;
    tangentPoint = {
      x: O1.x + ux * R1,
      y: O1.y + uy * R1,
    };
    intersections = [tangentPoint];
  } else if (Math.abs(d - Rdiff) <= EPSILON) {
    // 4. Internal tangent
    status = 'tangent_internal';
    statusLabel = 'Hai đường tròn tiếp xúc trong (d = |R - r|)';
    pointsCount = 1;
    if (R1 >= R2) {
      tangentPoint = {
        x: O1.x + ux * R1,
        y: O1.y + uy * R1,
      };
    } else {
      tangentPoint = {
        x: O2.x - ux * R2,
        y: O2.y - uy * R2,
      };
    }
    intersections = [tangentPoint];
  } else if (d < Rdiff - EPSILON) {
    // 5. Inside
    status = 'inside';
    statusLabel = 'Một đường tròn nằm trong đường tròn kia (d < |R - r|)';
    pointsCount = 0;
  } else {
    // 3. Intersecting at 2 points: |R - r| < d < R + r
    status = 'intersecting';
    statusLabel = 'Hai đường tròn cắt nhau tại hai điểm (|R - r| < d < R + r)';
    pointsCount = 2;

    // Distance from O1 to the radical axis line segment
    const a = (R1 * R1 - R2 * R2 + d * d) / (2 * d);
    const h = Math.sqrt(Math.max(0, R1 * R1 - a * a));
    chordLength = 2 * h;

    // Point P on O1O2 line
    const Px = O1.x + ux * a;
    const Py = O1.y + uy * a;

    // Perpendicular vector to O1O2 line
    const perpX = -uy;
    const perpY = ux;

    const ptA: Point2D = {
      x: Px + perpX * h,
      y: Py + perpY * h,
    };
    const ptB: Point2D = {
      x: Px - perpX * h,
      y: Py - perpY * h,
    };
    intersections = [ptA, ptB];
  }

  return {
    O1,
    O2,
    R1,
    R2,
    d,
    status,
    statusLabel,
    pointsCount,
    intersections,
    chordLength,
    tangentPoint,
    collinearLine,
  };
}
