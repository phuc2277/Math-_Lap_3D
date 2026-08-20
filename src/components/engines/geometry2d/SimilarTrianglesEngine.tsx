import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { ModelParams, DisplayOptions } from '../../../types/geometry';
import {
  Sparkles,
  HelpCircle,
  Trophy,
  Play,
  RotateCcw as ResetIcon,
  Maximize2,
  Minimize2,
  BookOpen,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  Layers,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Mouse,
  Target,
  ArrowRightLeft,
  Square,
  Circle as CircleIcon,
  RectangleHorizontal,
  ChevronRight,
  ChevronLeft,
  Check,
  X,
  Calculator,
  Sliders,
  Scale,
  RefreshCw,
} from 'lucide-react';

export type ShapeCategory = 'triangle' | 'square' | 'rectangle' | 'circle';
export type SimilarityCase =
  | 'auto_similar'
  | 'free_drag'
  | 'case_gg'
  | 'case_ccc'
  | 'case_cgc'
  | 'counter_ssa'
  | 'counter_arbitrary';
export type EngineMode = 'explore' | 'guide' | 'challenge' | 'presentation' | 'find_k';

interface SimilarTrianglesEngineProps {
  params?: ModelParams;
  displayOptions?: DisplayOptions;
  onParamChange?: (name: string, value: any) => void;
}

interface Point2D {
  x: number;
  y: number;
}

// Distance helper
const dist = (p1: Point2D, p2: Point2D) => Math.hypot(p2.x - p1.x, p2.y - p1.y);

// Angle in degrees between p1-p2 and p1-p3
const computeAngle = (p1: Point2D, p2: Point2D, p3: Point2D): number => {
  const d12 = dist(p1, p2);
  const d13 = dist(p1, p3);
  const d23 = dist(p2, p3);
  if (d12 === 0 || d13 === 0) return 0;
  const cosVal = (d12 * d12 + d13 * d13 - d23 * d23) / (2 * d12 * d13);
  const clamped = Math.max(-1, Math.min(1, cosVal));
  return (Math.acos(clamped) * 180) / Math.PI;
};

// Compute height foot H of A on BC
const projectPointOnLine = (P: Point2D, A: Point2D, B: Point2D): Point2D => {
  const dx = B.x - A.x;
  const dy = B.y - A.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return A;
  const t = ((P.x - A.x) * dx + (P.y - A.y) * dy) / lenSq;
  return { x: A.x + t * dx, y: A.y + t * dy };
};

export const SimilarTrianglesEngine: React.FC<SimilarTrianglesEngineProps> = ({
  params,
  displayOptions,
  onParamChange,
}) => {
  // 1. Navigation & State
  const [engineMode, setEngineMode] = useState<EngineMode>('explore');
  const [shapeCategory, setShapeCategory] = useState<ShapeCategory>('triangle');
  const [activeCase, setActiveCase] = useState<SimilarityCase>('auto_similar');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showDefinitionModal, setShowDefinitionModal] = useState<boolean>(false);

  // 2. Scale Factor k (Tỉ số đồng dạng)
  const [scaleK, setScaleK] = useState<number>(1.5);

  // 3. Base Triangle ABC (Left side)
  const [vertA, setVertA] = useState<Point2D>({ x: 230, y: 150 });
  const [vertB, setVertB] = useState<Point2D>({ x: 100, y: 430 });
  const [vertC, setVertC] = useState<Point2D>({ x: 380, y: 430 });

  // 4. Free Mode Triangle A'B'C' Vertices (when in 'free_drag' mode)
  const [freeVertA, setFreeVertA] = useState<Point2D>({ x: 690, y: 120 });
  const [freeVertB, setFreeVertB] = useState<Point2D>({ x: 520, y: 460 });
  const [freeVertC, setFreeVertC] = useState<Point2D>({ x: 880, y: 460 });

  // 5. Rigid Motion for Shape 2 (Right side)
  const [transX, setTransX] = useState<number>(470);
  const [transY, setTransY] = useState<number>(0);
  const [rotationDeg, setRotationDeg] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [opacityB, setOpacityB] = useState<number>(85); // 0% - 100%

  // 6. Non-Triangle Shapes Parameters
  const [squareSide, setSquareSide] = useState<number>(120);
  const [rectW, setRectW] = useState<number>(160);
  const [rectH, setRectH] = useState<number>(100);
  const [rect2W, setRect2W] = useState<number>(240); // For rectangle custom test
  const [rect2H, setRect2H] = useState<number>(150);
  const [circleR, setCircleR] = useState<number>(75);

  // 7. Display Toggles
  const [showVertexLabels, setShowVertexLabels] = useState<boolean>(true);
  const [showEdgeLengths, setShowEdgeLengths] = useState<boolean>(true);
  const [showAngleMeasures, setShowAngleMeasures] = useState<boolean>(true);
  const [showCorrespondence, setShowCorrespondence] = useState<boolean>(true);
  const [showAreaComparison, setShowAreaComparison] = useState<boolean>(true);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [matchGlow, setMatchGlow] = useState<boolean>(false);

  // 8. Interaction State
  const [draggingTarget, setDraggingTarget] = useState<
    'A' | 'B' | 'C' | 'freeA' | 'freeB' | 'freeC' | 'shape2' | 'rotHandle' | null
  >(null);
  const [dragStartPos, setDragStartPos] = useState<Point2D>({ x: 0, y: 0 });
  const [initialTrans, setInitialTrans] = useState<Point2D>({ x: 0, y: 0 });

  // 9. Superposition & Animation
  const [isSuperposing, setIsSuperposing] = useState<boolean>(false);
  const animReqRef = useRef<number | null>(null);

  // 10. Toast Feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 11. Guided Mode Step (1 to 9)
  const [guideStep, setGuideStep] = useState<number>(1);

  // 12. Challenge Mode (8 tasks)
  const [challengeIdx, setChallengeIdx] = useState<number>(0);
  const [challengeUserK, setChallengeUserK] = useState<string>('');
  const [challengeSelectedOpt, setChallengeSelectedOpt] = useState<number | null>(null);
  const [challengeFeedback, setChallengeFeedback] = useState<{ isCorrect: boolean; text: string } | null>(null);

  // 13. Presentation Mode Slide (1 to 8)
  const [presentationSlide, setPresentationSlide] = useState<number>(1);

  // 14. "Find k" Guessing Game State
  const [guessTargetK, setGuessTargetK] = useState<number>(2);
  const [guessInput, setGuessInput] = useState<string>('');
  const [guessResult, setGuessResult] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Toast Helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToastMessage(null), 2500);
  };

  // Convert client coordinates to SVG coordinates
  const getSvgCoordinates = useCallback((e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent): Point2D => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    if ('touches' in e && e.touches.length > 0) {
      pt.x = e.touches[0].clientX;
      pt.y = e.touches[0].clientY;
    } else if ('clientX' in e) {
      pt.x = (e as MouseEvent).clientX;
      pt.y = (e as MouseEvent).clientY;
    }
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const svgP = pt.matrixTransform(ctm.inverse());
    return { x: svgP.x, y: svgP.y };
  }, []);

  // Geometry measurements of base triangle ABC
  const geoABC = useMemo(() => {
    const ab = dist(vertA, vertB) / 35; // scaled to cm
    const bc = dist(vertB, vertC) / 35;
    const ca = dist(vertC, vertA) / 35;

    const angleA = computeAngle(vertA, vertB, vertC);
    const angleB = computeAngle(vertB, vertA, vertC);
    const angleC = computeAngle(vertC, vertA, vertB);

    const centroid: Point2D = {
      x: (vertA.x + vertB.x + vertC.x) / 3,
      y: (vertA.y + vertB.y + vertC.y) / 3,
    };

    const footA = projectPointOnLine(vertA, vertB, vertC);
    const heightA = dist(vertA, footA) / 35;
    const area = 0.5 * bc * heightA;

    return {
      ab: parseFloat(ab.toFixed(2)),
      bc: parseFloat(bc.toFixed(2)),
      ca: parseFloat(ca.toFixed(2)),
      angleA: Math.round(angleA),
      angleB: Math.round(angleB),
      angleC: Math.round(angleC),
      centroid,
      footA,
      heightA: parseFloat(heightA.toFixed(2)),
      area: parseFloat(area.toFixed(2)),
    };
  }, [vertA, vertB, vertC]);

  // Geometry coordinates & calculations for Shape 2 (A'B'C' or other shapes)
  const geoTri2 = useMemo(() => {
    const c = geoABC.centroid;
    const rad = (rotationDeg * Math.PI) / 180;
    const cosR = Math.cos(rad);
    const sinR = Math.sin(rad);

    if (activeCase === 'free_drag') {
      // Free drag coordinates
      const A_prime = freeVertA;
      const B_prime = freeVertB;
      const C_prime = freeVertC;

      const ab_prime = dist(A_prime, B_prime) / 35;
      const bc_prime = dist(B_prime, C_prime) / 35;
      const ca_prime = dist(C_prime, A_prime) / 35;

      const angleA_prime = computeAngle(A_prime, B_prime, C_prime);
      const angleB_prime = computeAngle(B_prime, A_prime, C_prime);
      const angleC_prime = computeAngle(C_prime, A_prime, B_prime);

      const centroidPrime: Point2D = {
        x: (A_prime.x + B_prime.x + C_prime.x) / 3,
        y: (A_prime.y + B_prime.y + C_prime.y) / 3,
      };

      const footA_prime = projectPointOnLine(A_prime, B_prime, C_prime);
      const heightA_prime = dist(A_prime, footA_prime) / 35;
      const area_prime = 0.5 * bc_prime * heightA_prime;

      const ratioAB = geoABC.ab > 0 ? ab_prime / geoABC.ab : 0;
      const ratioBC = geoABC.bc > 0 ? bc_prime / geoABC.bc : 0;
      const ratioCA = geoABC.ca > 0 ? ca_prime / geoABC.ca : 0;

      // Check similarity condition: ratios are close and angles match
      const maxRatio = Math.max(ratioAB, ratioBC, ratioCA);
      const minRatio = Math.min(ratioAB, ratioBC, ratioCA);
      const ratioDiff = maxRatio - minRatio;
      const angleDiffA = Math.abs(geoABC.angleA - angleA_prime);
      const angleDiffB = Math.abs(geoABC.angleB - angleB_prime);
      const angleDiffC = Math.abs(geoABC.angleC - angleC_prime);

      const isSimilar = ratioDiff < 0.12 && angleDiffA <= 3 && angleDiffB <= 3 && angleDiffC <= 3;
      const effectiveK = parseFloat(((ratioAB + ratioBC + ratioCA) / 3).toFixed(2));

      return {
        A: A_prime,
        B: B_prime,
        C: C_prime,
        centroid: centroidPrime,
        ab: parseFloat(ab_prime.toFixed(2)),
        bc: parseFloat(bc_prime.toFixed(2)),
        ca: parseFloat(ca_prime.toFixed(2)),
        angleA: Math.round(angleA_prime),
        angleB: Math.round(angleB_prime),
        angleC: Math.round(angleC_prime),
        area: parseFloat(area_prime.toFixed(2)),
        ratioAB: parseFloat(ratioAB.toFixed(2)),
        ratioBC: parseFloat(ratioBC.toFixed(2)),
        ratioCA: parseFloat(ratioCA.toFixed(2)),
        isSimilar,
        effectiveK,
      };
    }

    // Auto-similar or Criteria cases: Scale base triangle by scaleK, then apply rigid motion
    let effectiveK = scaleK;
    let baseRelA = { x: (vertA.x - c.x) * effectiveK, y: (vertA.y - c.y) * effectiveK };
    let baseRelB = { x: (vertB.x - c.x) * effectiveK, y: (vertB.y - c.y) * effectiveK };
    let baseRelC = { x: (vertC.x - c.x) * effectiveK, y: (vertC.y - c.y) * effectiveK };

    let isSimilar = true;

    if (activeCase === 'counter_ssa') {
      // Counterexample SSA: 2 sides proportional, but non-included angle equal, shape mismatched
      isSimilar = false;
      baseRelA = { x: baseRelA.x * 0.85 + 40, y: baseRelA.y * 1.15 };
    } else if (activeCase === 'counter_arbitrary') {
      // Counterexample: arbitrary unequal scaling
      isSimilar = false;
      baseRelA = { x: baseRelA.x * 1.4, y: baseRelA.y * 0.7 };
      baseRelB = { x: baseRelB.x * 0.9, y: baseRelB.y * 1.2 };
    }

    const transformPoint = (rel: Point2D): Point2D => {
      let rx = rel.x;
      let ry = rel.y;
      if (isFlipped) rx = -rx;
      const rotX = rx * cosR - ry * sinR;
      const rotY = rx * sinR + ry * cosR;
      return {
        x: c.x + rotX + transX,
        y: c.y + rotY + transY,
      };
    };

    const A_prime = transformPoint(baseRelA);
    const B_prime = transformPoint(baseRelB);
    const C_prime = transformPoint(baseRelC);

    const centroidPrime: Point2D = {
      x: (A_prime.x + B_prime.x + C_prime.x) / 3,
      y: (A_prime.y + B_prime.y + C_prime.y) / 3,
    };

    const ab_prime = dist(A_prime, B_prime) / 35;
    const bc_prime = dist(B_prime, C_prime) / 35;
    const ca_prime = dist(C_prime, A_prime) / 35;

    const angleA_prime = computeAngle(A_prime, B_prime, C_prime);
    const angleB_prime = computeAngle(B_prime, A_prime, C_prime);
    const angleC_prime = computeAngle(C_prime, A_prime, B_prime);

    const footA_prime = projectPointOnLine(A_prime, B_prime, C_prime);
    const heightA_prime = dist(A_prime, footA_prime) / 35;
    const area_prime = 0.5 * bc_prime * heightA_prime;

    const ratioAB = geoABC.ab > 0 ? ab_prime / geoABC.ab : 0;
    const ratioBC = geoABC.bc > 0 ? bc_prime / geoABC.bc : 0;
    const ratioCA = geoABC.ca > 0 ? ca_prime / geoABC.ca : 0;

    return {
      A: A_prime,
      B: B_prime,
      C: C_prime,
      centroid: centroidPrime,
      ab: parseFloat(ab_prime.toFixed(2)),
      bc: parseFloat(bc_prime.toFixed(2)),
      ca: parseFloat(ca_prime.toFixed(2)),
      angleA: Math.round(angleA_prime),
      angleB: Math.round(angleB_prime),
      angleC: Math.round(angleC_prime),
      area: parseFloat(area_prime.toFixed(2)),
      ratioAB: parseFloat(ratioAB.toFixed(2)),
      ratioBC: parseFloat(ratioBC.toFixed(2)),
      ratioCA: parseFloat(ratioCA.toFixed(2)),
      isSimilar,
      effectiveK,
    };
  }, [
    activeCase,
    freeVertA,
    freeVertB,
    freeVertC,
    geoABC,
    scaleK,
    vertA,
    vertB,
    vertC,
    isFlipped,
    rotationDeg,
    transX,
    transY,
  ]);

  // Non-Triangle Shapes Geometry Calculations
  const geoNonTriangles = useMemo(() => {
    // 1. Squares
    const sq1_side = squareSide / 35;
    const sq2_side = (squareSide * scaleK) / 35;
    const sq1_area = sq1_side * sq1_side;
    const sq2_area = sq2_side * sq2_side;

    // 2. Rectangles
    const r1_w = rectW / 35;
    const r1_h = rectH / 35;
    const r1_area = r1_w * r1_h;

    const isRectCustomSimilar = Math.abs(rect2W / rectW - rect2H / rectH) < 0.05;
    const r2_w = (rectW * scaleK) / 35;
    const r2_h = (rectH * scaleK) / 35;
    const r2_area = r2_w * r2_h;

    // 3. Circles
    const c1_r = circleR / 35;
    const c2_r = (circleR * scaleK) / 35;
    const c1_area = Math.PI * c1_r * c1_r;
    const c2_area = Math.PI * c2_r * c2_r;

    return {
      square: {
        side1: parseFloat(sq1_side.toFixed(2)),
        side2: parseFloat(sq2_side.toFixed(2)),
        area1: parseFloat(sq1_area.toFixed(2)),
        area2: parseFloat(sq2_area.toFixed(2)),
        ratio: parseFloat(scaleK.toFixed(2)),
        areaRatio: parseFloat((scaleK * scaleK).toFixed(2)),
      },
      rectangle: {
        w1: parseFloat(r1_w.toFixed(2)),
        h1: parseFloat(r1_h.toFixed(2)),
        w2: parseFloat(r2_w.toFixed(2)),
        h2: parseFloat(r2_h.toFixed(2)),
        area1: parseFloat(r1_area.toFixed(2)),
        area2: parseFloat(r2_area.toFixed(2)),
        ratio: parseFloat(scaleK.toFixed(2)),
        areaRatio: parseFloat((scaleK * scaleK).toFixed(2)),
        isSimilar: isRectCustomSimilar,
      },
      circle: {
        r1: parseFloat(c1_r.toFixed(2)),
        r2: parseFloat(c2_r.toFixed(2)),
        area1: parseFloat(c1_area.toFixed(2)),
        area2: parseFloat(c2_area.toFixed(2)),
        ratio: parseFloat(scaleK.toFixed(2)),
        areaRatio: parseFloat((scaleK * scaleK).toFixed(2)),
      },
    };
  }, [squareSide, scaleK, rectW, rectH, rect2W, rect2H, circleR]);

  // Handle Scale Down to k=1 then Superpose
  const handleScaleToOneAndSuperpose = () => {
    if (isSuperposing) return;
    setIsSuperposing(true);

    const startK = scaleK;
    const startX = transX;
    const startY = transY;
    const startRot = rotationDeg;
    const targetK = 1.0;
    const targetX = 0;
    const targetY = 0;
    const targetRot = 0;

    let startTime: number | null = null;
    const duration = 1200;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(1, elapsed / duration);
      const ease = 1 - Math.pow(1 - progress, 3);

      setScaleK(parseFloat((startK + (targetK - startK) * ease).toFixed(2)));
      setTransX(startX + (targetX - startX) * ease);
      setTransY(startY + (targetY - startY) * ease);
      setRotationDeg(startRot + (targetRot - startRot) * ease);

      if (progress < 1) {
        animReqRef.current = requestAnimationFrame(step);
      } else {
        setScaleK(1.0);
        setTransX(0);
        setTransY(0);
        setRotationDeg(0);
        setIsFlipped(false);
        setIsSuperposing(false);
        setMatchGlow(true);
        showToast('🎯 Đã thu về k = 1 và Chồng khít hoàn toàn! Hai hình có cùng dạng.');
      }
    };

    animReqRef.current = requestAnimationFrame(step);
  };

  // Separate Shapes (Tách ra)
  const handleSeparate = () => {
    if (isSuperposing) return;
    setIsSuperposing(true);

    const startX = transX;
    const startY = transY;
    const targetX = 470;
    const targetY = 0;

    let startTime: number | null = null;
    const duration = 800;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(1, elapsed / duration);
      const ease = 1 - Math.pow(1 - progress, 3);

      setTransX(startX + (targetX - startX) * ease);
      setTransY(startY + (targetY - startY) * ease);

      if (progress < 1) {
        animReqRef.current = requestAnimationFrame(step);
      } else {
        setTransX(470);
        setTransY(0);
        setIsSuperposing(false);
        setMatchGlow(false);
        showToast('Đã tách hai hình về vị trí so sánh.');
      }
    };

    animReqRef.current = requestAnimationFrame(step);
  };

  // Dragging Handlers
  const handleMouseDown = (
    target: 'A' | 'B' | 'C' | 'freeA' | 'freeB' | 'freeC' | 'shape2' | 'rotHandle',
    e: React.MouseEvent | React.TouchEvent
  ) => {
    e.stopPropagation();
    const pt = getSvgCoordinates(e);
    setDraggingTarget(target);
    setDragStartPos(pt);
    setInitialTrans({ x: transX, y: transY });
  };

  const handleMouseMove = useCallback(
    (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
      if (!draggingTarget) return;
      const pt = getSvgCoordinates(e);

      if (draggingTarget === 'A') {
        setVertA({ x: Math.max(40, Math.min(460, pt.x)), y: Math.max(40, Math.min(360, pt.y)) });
      } else if (draggingTarget === 'B') {
        setVertB({ x: Math.max(40, Math.min(380, pt.x)), y: Math.max(200, Math.min(560, pt.y)) });
      } else if (draggingTarget === 'C') {
        setVertC({ x: Math.max(180, Math.min(480, pt.x)), y: Math.max(200, Math.min(560, pt.y)) });
      } else if (draggingTarget === 'freeA') {
        setFreeVertA({ x: Math.max(500, Math.min(960, pt.x)), y: Math.max(40, Math.min(400, pt.y)) });
      } else if (draggingTarget === 'freeB') {
        setFreeVertB({ x: Math.max(500, Math.min(850, pt.x)), y: Math.max(200, Math.min(560, pt.y)) });
      } else if (draggingTarget === 'freeC') {
        setFreeVertC({ x: Math.max(650, Math.min(960, pt.x)), y: Math.max(200, Math.min(560, pt.y)) });
      } else if (draggingTarget === 'shape2') {
        const dx = pt.x - dragStartPos.x;
        const dy = pt.y - dragStartPos.y;
        setTransX(initialTrans.x + dx);
        setTransY(initialTrans.y + dy);
      } else if (draggingTarget === 'rotHandle') {
        const cPrime = geoTri2.centroid;
        const angleRad = Math.atan2(pt.y - cPrime.y, pt.x - cPrime.x);
        setRotationDeg(Math.round((angleRad * 180) / Math.PI));
      }
    },
    [draggingTarget, dragStartPos, initialTrans, getSvgCoordinates, geoTri2.centroid]
  );

  const handleMouseUp = useCallback(() => {
    setDraggingTarget(null);
  }, []);

  useEffect(() => {
    const onUp = () => setDraggingTarget(null);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchend', onUp);
    };
  }, []);

  // Con lăn chuột (Scroll Wheel) to adjust scale factor k or rotate
  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
    if (e.shiftKey) {
      // Rotate
      const delta = e.deltaY < 0 ? 5 : -5;
      setRotationDeg((r) => (r + delta + 360) % 360);
    } else {
      // Scale k
      const delta = e.deltaY < 0 ? 0.1 : -0.1;
      const newK = Math.max(0.25, Math.min(3.5, parseFloat((scaleK + delta).toFixed(2))));
      setScaleK(newK);
      showToast(`Tỉ số k = ${newK}`);
    }
  };

  // Reset to default
  const handleReset = () => {
    setScaleK(1.5);
    setVertA({ x: 230, y: 150 });
    setVertB({ x: 100, y: 430 });
    setVertC({ x: 380, y: 430 });
    setTransX(470);
    setTransY(0);
    setRotationDeg(0);
    setIsFlipped(false);
    setActiveCase('auto_similar');
    setShapeCategory('triangle');
    setMatchGlow(false);
    showToast('Đã khôi phục trạng thái ban đầu.');
  };

  // Challenges Data
  const CHALLENGES = [
    {
      id: 1,
      title: 'Nhiệm vụ 1: Nhận biết hai tam giác đồng dạng',
      question: 'Khi nói △ABC ∼ △A\'B\'C\' với tỉ số đồng dạng k = 2, điều nào sau đây là ĐÚNG?',
      options: [
        'Mỗi cạnh của △A\'B\'C\' dài gấp 2 lần cạnh tương ứng của △ABC, các góc giữ nguyên.',
        'Cả cạnh và số đo các góc của △A\'B\'C\' đều gấp 2 lần của △ABC.',
        'Diện tích của △A\'B\'C\' gấp 2 lần diện tích của △ABC.',
      ],
      correct: 0,
      explanation: 'Đồng dạng bảo toàn số đo các góc và làm tăng/giảm độ dài các cạnh theo cùng tỉ số k. Diện tích sẽ tăng theo tỉ số k² = 4.',
    },
    {
      id: 2,
      title: 'Nhiệm vụ 2: Tính cạnh còn thiếu',
      question: 'Cho △ABC ∼ △A\'B\'C\' có k = 1.5. Biết cạnh AB = 6 cm. Hỏi độ dài cạnh tương ứng A\'B\' bằng bao nhiêu?',
      options: ['8 cm', '9 cm', '7.5 cm', '12 cm'],
      correct: 1,
      explanation: 'Ta có A\'B\' = k × AB = 1.5 × 6 = 9 cm.',
    },
    {
      id: 3,
      title: 'Nhiệm vụ 3: Trường hợp Góc - Góc (G-G)',
      question: 'Nếu △ABC và △A\'B\'C\' có ∠A = ∠A\' và ∠B = ∠B\', ta có thể kết luận chúng đồng dạng không?',
      options: [
        'Có, theo trường hợp Góc - Góc (G-G)',
        'Không, cần phải biết thêm độ dài ít nhất 1 cạnh',
        'Chỉ đồng dạng khi có thêm ∠C = 90°',
      ],
      correct: 0,
      explanation: 'Vì tổng 3 góc trong một tam giác bằng 180°, nếu 2 cặp góc bằng nhau thì cặp góc thứ ba tự động bằng nhau ⇒ hai tam giác đồng dạng theo trường hợp G-G.',
    },
    {
      id: 4,
      title: 'Nhiệm vụ 4: Quan hệ Tỉ số Diện tích (k²)',
      question: 'Nếu hai tam giác đồng dạng với tỉ số k = 3, thì tỉ số diện tích S(A\'B\'C\') / S(ABC) bằng bao nhiêu?',
      options: ['3', '6', '9 (k²)', '27'],
      correct: 2,
      explanation: 'Tỉ số diện tích của hai tam giác đồng dạng bằng BÌNH PHƯƠNG tỉ số đồng dạng: S\' / S = k² = 3² = 9.',
    },
    {
      id: 5,
      title: 'Nhiệm vụ 5: Đa giác đồng dạng - Hình vuông & Hình chữ nhật',
      question: 'Khẳng định nào sau đây là KHÔNG đúng về các hình đồng dạng?',
      options: [
        'Mọi hình vuông đều đồng dạng với nhau.',
        'Mọi hình tròn đều đồng dạng với nhau.',
        'Mọi hình chữ nhật đều đồng dạng với nhau.',
      ],
      correct: 2,
      explanation: 'Hình chữ nhật có các góc đều bằng 90° nhưng tỉ số chiều dài / chiều rộng có thể khác nhau (ví dụ: 4×6 không đồng dạng với 5×6).',
    },
    {
      id: 6,
      title: 'Nhiệm vụ 6: Trường hợp Cạnh - Góc - Cạnh (C-G-C)',
      question: 'Để △ABC ∼ △A\'B\'C\' theo trường hợp C-G-C với hai cặp cạnh AB/A\'B\' = AC/A\'C\', góc nào bắt buộc phải bằng nhau?',
      options: ['Góc A = Góc A\' (góc xen giữa)', 'Góc B = Góc B\'', 'Góc C = Góc C\''],
      correct: 0,
      explanation: 'Góc bằng nhau bắt buộc phải là góc xen giữa hai cặp cạnh tỉ lệ (đỉnh A xen giữa AB và AC).',
    },
    {
      id: 7,
      title: 'Nhiệm vụ 7: Đỉnh tương ứng trong ký hiệu',
      question: 'Từ ký hiệu △MNP ∼ △DEF, hãy chỉ ra cạnh tương ứng với NP:',
      options: ['Cạnh DE', 'Cạnh EF', 'Cạnh DF'],
      correct: 1,
      explanation: 'Trong ký hiệu △MNP ∼ △DEF: vị trí 2-3 là NP tương ứng với vị trí 2-3 là EF (NP ↔ EF).',
    },
    {
      id: 8,
      title: 'Nhiệm vụ 8: Ý nghĩa của tỉ số k = 1',
      question: 'Khi hai tam giác đồng dạng với tỉ số k = 1, chúng có quan hệ gì đặc biệt?',
      options: [
        'Hai tam giác đó bằng nhau (△ABC = △A\'B\'C\')',
        'Hai tam giác đó không đồng dạng',
        'Hai tam giác đó chỉ cùng diện tích',
      ],
      correct: 0,
      explanation: 'Khi k = 1, các cạnh tương ứng bằng nhau và các góc bằng nhau ⇒ hai tam giác bằng nhau. Tam giác bằng nhau là trường hợp đặc biệt của tam giác đồng dạng với k = 1.',
    },
  ];

  return (
    <div
      ref={containerRef}
      className={`flex flex-col bg-slate-950 text-slate-100 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden select-none transition-all duration-300 ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none' : 'w-full min-h-[630px]'
      }`}
    >
      {/* 1. TOP HEADER TOOLBAR */}
      <div className="flex flex-wrap items-center justify-between px-4 py-3 bg-slate-900/95 border-b border-slate-800/90 gap-2.5 backdrop-blur-md">
        {/* Title & Badge */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-amber-500 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white font-bold text-lg">
            ∼
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-extrabold text-base sm:text-lg tracking-tight text-white flex items-center gap-2">
                <span>Tam giác đồng dạng & Hình đồng dạng</span>
                <span className="text-xs font-mono font-normal px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  △ABC ∼ △A'B'C' (k = {geoTri2.effectiveK || scaleK})
                </span>
              </h2>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Quan sát • Phóng to/Thu nhỏ • So sánh góc & tỉ số cạnh • Quan hệ diện tích k²
            </p>
          </div>
        </div>

        {/* Engine Modes Nav: Explore | Guide | Challenge | Presentation | Find k */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800/80">
          <button
            onClick={() => setEngineMode('explore')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              engineMode === 'explore'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Khám phá</span>
          </button>

          <button
            onClick={() => setEngineMode('guide')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              engineMode === 'guide'
                ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Hướng dẫn ({guideStep}/9)</span>
          </button>

          <button
            onClick={() => setEngineMode('challenge')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              engineMode === 'challenge'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Thử thách ({challengeIdx + 1}/8)</span>
          </button>

          <button
            onClick={() => setEngineMode('presentation')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              engineMode === 'presentation'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            <span>Trình chiếu</span>
          </button>
        </div>

        {/* Global Utility Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowDefinitionModal(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-xs font-medium text-slate-300 transition-colors border border-slate-700"
            title="Khái niệm & Định lý hai tam giác đồng dạng"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">Định nghĩa</span>
          </button>

          <button
            onClick={handleReset}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
            title="Khôi phục trạng thái ban đầu"
          >
            <ResetIcon className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
            title={isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình (Fullscreen)'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 2. SECONDARY SUB-HEADER: Shape Selector & Similarity Cases */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2 bg-slate-900/60 border-b border-slate-800/60 gap-2 text-xs">
        {/* Shape Types: Triangle | Square | Rectangle | Circle */}
        <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => {
              setShapeCategory('triangle');
              showToast('Mô hình: Tam giác đồng dạng');
            }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all ${
              shapeCategory === 'triangle'
                ? 'bg-cyan-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>△ Tam giác</span>
          </button>

          <button
            onClick={() => {
              setShapeCategory('square');
              showToast('Mô hình: Hình vuông đồng dạng (luôn đồng dạng với mọi k)');
            }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all ${
              shapeCategory === 'square'
                ? 'bg-cyan-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Square className="w-3.5 h-3.5" />
            <span>Hình vuông</span>
          </button>

          <button
            onClick={() => {
              setShapeCategory('rectangle');
              showToast('Mô hình: Hình chữ nhật (đồng dạng khi tỉ lệ dài/rộng bằng nhau)');
            }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all ${
              shapeCategory === 'rectangle'
                ? 'bg-cyan-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <RectangleHorizontal className="w-3.5 h-3.5" />
            <span>Hình chữ nhật</span>
          </button>

          <button
            onClick={() => {
              setShapeCategory('circle');
              showToast('Mô hình: Hình tròn đồng dạng (bán kính R2 = k * R1)');
            }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all ${
              shapeCategory === 'circle'
                ? 'bg-cyan-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <CircleIcon className="w-3.5 h-3.5" />
            <span>Hình tròn</span>
          </button>
        </div>

        {/* Triangle Criteria / Modes */}
        {shapeCategory === 'triangle' && (
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
            <span className="text-slate-400 font-medium whitespace-nowrap mr-1">Chế độ:</span>

            <button
              onClick={() => {
                setActiveCase('auto_similar');
                showToast('Đồng dạng tự động: △A\'B\'C\' = k × △ABC');
              }}
              className={`px-2 py-1 rounded-lg font-bold transition-all whitespace-nowrap ${
                activeCase === 'auto_similar'
                  ? 'bg-cyan-500 text-slate-950'
                  : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span>✨ Tự động theo k</span>
            </button>

            <button
              onClick={() => {
                setActiveCase('free_drag');
                showToast('Chế độ Tự do: Kéo độc lập các đỉnh A\', B\', C\' để kiểm tra đồng dạng');
              }}
              className={`px-2 py-1 rounded-lg font-bold transition-all whitespace-nowrap ${
                activeCase === 'free_drag'
                  ? 'bg-indigo-500 text-white'
                  : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span>🖐 Kéo tự do thử nghiệm</span>
            </button>

            <button
              onClick={() => {
                setActiveCase('case_gg');
                showToast('Trường hợp G-G: Hai góc bằng nhau (∠A=∠A\', ∠B=∠B\')');
              }}
              className={`px-2 py-1 rounded-lg font-bold transition-all whitespace-nowrap ${
                activeCase === 'case_gg'
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span>📐 Góc - Góc (G-G)</span>
            </button>

            <button
              onClick={() => {
                setActiveCase('case_ccc');
                showToast('Trường hợp C-C-C: Ba cặp cạnh tương ứng tỉ lệ');
              }}
              className={`px-2 py-1 rounded-lg font-bold transition-all whitespace-nowrap ${
                activeCase === 'case_ccc'
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span>🔺 C-C-C</span>
            </button>

            <button
              onClick={() => {
                setActiveCase('case_cgc');
                showToast('Trường hợp C-G-C: Hai cạnh tỉ lệ và góc xen giữa bằng nhau');
              }}
              className={`px-2 py-1 rounded-lg font-bold transition-all whitespace-nowrap ${
                activeCase === 'case_cgc'
                  ? 'bg-sky-500 text-slate-950'
                  : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span>📏 C-G-C</span>
            </button>

            {/* Counterexample */}
            <button
              onClick={() => {
                setActiveCase('counter_ssa');
                showToast('⚠️ Phản ví dụ: C-C-G không xen giữa ⇒ KHÔNG đồng dạng');
              }}
              className={`px-2 py-1 rounded-lg font-bold transition-all whitespace-nowrap flex items-center gap-1 ${
                activeCase === 'counter_ssa'
                  ? 'bg-rose-500 text-white'
                  : 'bg-rose-950/40 text-rose-300 hover:bg-rose-900/50 border border-rose-800/50'
              }`}
            >
              <AlertTriangle className="w-3 h-3 text-rose-400" />
              <span>❌ Phản ví dụ</span>
            </button>
          </div>
        )}

        {/* Superposition Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleScaleToOneAndSuperpose}
            disabled={isSuperposing}
            className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-extrabold rounded-lg shadow-lg shadow-cyan-500/25 transition-all active:scale-95 disabled:opacity-50"
            title="Thu nhỏ về k = 1 rồi Chồng khít lên hình gốc"
          >
            <Target className="w-3.5 h-3.5" />
            <span>🎯 Co về k=1 & Chồng khít</span>
          </button>

          <button
            onClick={handleSeparate}
            disabled={isSuperposing}
            className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-lg border border-slate-700 transition-all active:scale-95 disabled:opacity-50"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>↔ Tách</span>
          </button>
        </div>
      </div>

      {/* 3. MAIN WORKSPACE: Canvas on Left, Side Panel on Right */}
      <div className="flex-1 flex flex-col lg:flex-row items-stretch justify-between p-3 sm:p-4 gap-4 overflow-hidden relative">
        {/* Left Column: Interactive Geometry Canvas */}
        <div
          className="flex-1 flex flex-col items-center justify-center bg-slate-900/90 rounded-2xl border border-slate-800/90 p-2 sm:p-3 relative overflow-hidden min-h-[420px]"
          onWheel={handleWheel}
        >
          {/* Toast Notification */}
          {toastMessage && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 bg-amber-500 text-slate-950 px-4 py-1.5 rounded-full font-mono font-extrabold text-xs shadow-xl shadow-amber-500/30 border border-amber-300 animate-bounce">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{toastMessage}</span>
            </div>
          )}

          {/* Canvas Floating Overlay Controls */}
          <div className="w-full flex items-center justify-between px-2 mb-2 z-10 text-xs">
            {/* Display Layer Toggles */}
            <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800 backdrop-blur">
              <button
                onClick={() => setShowVertexLabels(!showVertexLabels)}
                className={`px-2 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                  showVertexLabels
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Bật/tắt tên các đỉnh"
              >
                Đỉnh
              </button>

              <button
                onClick={() => setShowEdgeLengths(!showEdgeLengths)}
                className={`px-2 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                  showEdgeLengths
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Bật/tắt độ dài các cạnh"
              >
                Độ dài
              </button>

              <button
                onClick={() => setShowAngleMeasures(!showAngleMeasures)}
                className={`px-2 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                  showAngleMeasures
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Bật/tắt số đo các góc"
              >
                Góc
              </button>

              <button
                onClick={() => setShowCorrespondence(!showCorrespondence)}
                className={`px-2 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                  showCorrespondence
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Hiện cặp tương ứng (A ↔ A', B ↔ B', C ↔ C')"
              >
                🔗 Tương ứng
              </button>

              <button
                onClick={() => setShowAreaComparison(!showAreaComparison)}
                className={`px-2 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                  showAreaComparison
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="So sánh diện tích S2 = k² × S1"
              >
                Diện tích (k²)
              </button>
            </div>

            {/* Quick Zoom & Rotate Mini-Bar */}
            <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800 backdrop-blur">
              <button
                onClick={() => {
                  const newK = Math.min(3.5, parseFloat((scaleK + 0.25).toFixed(2)));
                  setScaleK(newK);
                  showToast(`🔍 Phóng to: k = ${newK}`);
                }}
                className="p-1 hover:bg-slate-800 rounded text-slate-300 hover:text-white"
                title="Phóng to (k + 0.25)"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => {
                  const newK = Math.max(0.25, parseFloat((scaleK - 0.25).toFixed(2)));
                  setScaleK(newK);
                  showToast(`🔎 Thu nhỏ: k = ${newK}`);
                }}
                className="p-1 hover:bg-slate-800 rounded text-slate-300 hover:text-white"
                title="Thu nhỏ (k - 0.25)"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => {
                  setRotationDeg((r) => (r - 15 + 360) % 360);
                  showToast('↺ Xoay trái -15°');
                }}
                className="p-1 hover:bg-slate-800 rounded text-slate-300 hover:text-white"
                title="Xoay trái 15°"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => {
                  setRotationDeg((r) => (r + 15) % 360);
                  showToast('↻ Xoay phải +15°');
                }}
                className="p-1 hover:bg-slate-800 rounded text-slate-300 hover:text-white"
                title="Xoay phải 15°"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>

              <div className="hidden sm:flex items-center gap-1 text-[10px] text-cyan-300/80 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                <Mouse className="w-3 h-3 text-cyan-400" />
                <span>Lăn chuột để chỉnh k</span>
              </div>
            </div>
          </div>

          {/* SVG Canvas */}
          <div
            className="w-full flex-1 flex items-center justify-center relative overflow-hidden cursor-default"
            onMouseMove={handleMouseMove}
            onTouchMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onTouchEnd={handleMouseUp}
          >
            <svg
              ref={svgRef}
              viewBox="0 0 1000 600"
              className="w-full h-full max-h-[560px] overflow-visible"
            >
              <defs>
                {/* Background Grid Pattern */}
                <pattern id="similarGridPattern" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.75" />
                </pattern>

                {/* Glow Filter for Superposition */}
                <filter id="glowCyan" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="8" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Grid Background */}
              {showGrid && <rect width="1000" height="600" fill="url(#similarGridPattern)" rx="16" />}

              {/* Vertical Reference Dividing Line */}
              <line
                x1="480"
                y1="30"
                x2="480"
                y2="570"
                stroke="#334155"
                strokeWidth="1.5"
                strokeDasharray="6 6"
                opacity="0.5"
              />

              {/* ======================================================= */}
              {/* CASE 1: TRIANGLES MODEL (△ABC and △A'B'C')             */}
              {/* ======================================================= */}
              {shapeCategory === 'triangle' && (
                <>
                  {/* Corresponding Link Lines between Vertices */}
                  {showCorrespondence && (
                    <g opacity="0.4" strokeDasharray="3 3">
                      <line x1={vertA.x} y1={vertA.y} x2={geoTri2.A.x} y2={geoTri2.A.y} stroke="#38bdf8" strokeWidth="1" />
                      <line x1={vertB.x} y1={vertB.y} x2={geoTri2.B.x} y2={geoTri2.B.y} stroke="#f59e0b" strokeWidth="1" />
                      <line x1={vertC.x} y1={vertC.y} x2={geoTri2.C.x} y2={geoTri2.C.y} stroke="#10b981" strokeWidth="1" />
                    </g>
                  )}

                  {/* 1. Base Triangle △ABC (Left Side - Cyan) */}
                  <g className="transition-all duration-75">
                    {/* Fill & Stroke */}
                    <polygon
                      points={`${vertA.x},${vertA.y} ${vertB.x},${vertB.y} ${vertC.x},${vertC.y}`}
                      fill="#0284c7"
                      fillOpacity="0.25"
                      stroke="#38bdf8"
                      strokeWidth="3"
                      className="transition-colors hover:fill-opacity-35"
                    />

                    {/* Edge Lengths of ABC */}
                    {showEdgeLengths && (
                      <>
                        <text
                          x={(vertA.x + vertB.x) / 2 - 14}
                          y={(vertA.y + vertB.y) / 2}
                          textAnchor="end"
                          className="fill-sky-300 font-mono text-xs font-extrabold drop-shadow"
                        >
                          c = {geoABC.ab} cm
                        </text>
                        <text
                          x={(vertB.x + vertC.x) / 2}
                          y={(vertB.y + vertC.y) / 2 + 18}
                          textAnchor="middle"
                          className="fill-sky-300 font-mono text-xs font-extrabold drop-shadow"
                        >
                          a = {geoABC.bc} cm
                        </text>
                        <text
                          x={(vertC.x + vertA.x) / 2 + 14}
                          y={(vertC.y + vertA.y) / 2}
                          textAnchor="start"
                          className="fill-sky-300 font-mono text-xs font-extrabold drop-shadow"
                        >
                          b = {geoABC.ca} cm
                        </text>
                      </>
                    )}

                    {/* Angle Measures of ABC */}
                    {showAngleMeasures && (
                      <>
                        <text
                          x={vertA.x}
                          y={vertA.y + 26}
                          textAnchor="middle"
                          className="fill-amber-300 font-mono text-[11px] font-bold"
                        >
                          {geoABC.angleA}°
                        </text>
                        <text
                          x={vertB.x + 28}
                          y={vertB.y - 10}
                          textAnchor="start"
                          className="fill-amber-300 font-mono text-[11px] font-bold"
                        >
                          {geoABC.angleB}°
                        </text>
                        <text
                          x={vertC.x - 28}
                          y={vertC.y - 10}
                          textAnchor="end"
                          className="fill-amber-300 font-mono text-[11px] font-bold"
                        >
                          {geoABC.angleC}°
                        </text>
                      </>
                    )}

                    {/* Interactive Draggable Vertices A, B, C */}
                    <g
                      className="cursor-move"
                      onMouseDown={(e) => handleMouseDown('A', e)}
                      onTouchStart={(e) => handleMouseDown('A', e)}
                    >
                      <circle cx={vertA.x} cy={vertA.y} r="8" fill="#0284c7" stroke="#ffffff" strokeWidth="2.5" />
                      {showVertexLabels && (
                        <text
                          x={vertA.x}
                          y={vertA.y - 12}
                          textAnchor="middle"
                          className="fill-sky-300 font-sans font-black text-sm"
                        >
                          A
                        </text>
                      )}
                    </g>

                    <g
                      className="cursor-move"
                      onMouseDown={(e) => handleMouseDown('B', e)}
                      onTouchStart={(e) => handleMouseDown('B', e)}
                    >
                      <circle cx={vertB.x} cy={vertB.y} r="8" fill="#0284c7" stroke="#ffffff" strokeWidth="2.5" />
                      {showVertexLabels && (
                        <text
                          x={vertB.x - 14}
                          y={vertB.y + 6}
                          textAnchor="end"
                          className="fill-sky-300 font-sans font-black text-sm"
                        >
                          B
                        </text>
                      )}
                    </g>

                    <g
                      className="cursor-move"
                      onMouseDown={(e) => handleMouseDown('C', e)}
                      onTouchStart={(e) => handleMouseDown('C', e)}
                    >
                      <circle cx={vertC.x} cy={vertC.y} r="8" fill="#0284c7" stroke="#ffffff" strokeWidth="2.5" />
                      {showVertexLabels && (
                        <text
                          x={vertC.x + 14}
                          y={vertC.y + 6}
                          textAnchor="start"
                          className="fill-sky-300 font-sans font-black text-sm"
                        >
                          C
                        </text>
                      )}
                    </g>

                    {/* Label at Bottom of Left */}
                    <text
                      x="240"
                      y="545"
                      textAnchor="middle"
                      className="fill-sky-400 font-bold text-xs"
                    >
                      Tam giác gốc △ABC (S₁ = {geoABC.area} cm²)
                    </text>
                  </g>

                  {/* 2. Scaled / Transformed Triangle △A'B'C' (Right Side - Amber) */}
                  <g
                    className="transition-all duration-75"
                    filter={matchGlow ? 'url(#glowCyan)' : undefined}
                  >
                    {/* Fill & Stroke */}
                    <polygon
                      points={`${geoTri2.A.x},${geoTri2.A.y} ${geoTri2.B.x},${geoTri2.B.y} ${geoTri2.C.x},${geoTri2.C.y}`}
                      fill={geoTri2.isSimilar ? '#f59e0b' : '#ef4444'}
                      fillOpacity={matchGlow ? 0.45 : (opacityB / 100) * 0.3}
                      stroke={geoTri2.isSimilar ? '#fbbf24' : '#f87171'}
                      strokeWidth={matchGlow ? 4 : 3}
                      className={activeCase !== 'free_drag' ? 'cursor-grab active:cursor-grabbing' : ''}
                      onMouseDown={activeCase !== 'free_drag' ? (e) => handleMouseDown('shape2', e) : undefined}
                      onTouchStart={activeCase !== 'free_drag' ? (e) => handleMouseDown('shape2', e) : undefined}
                    />

                    {/* Edge Lengths of A'B'C' */}
                    {showEdgeLengths && (
                      <>
                        <text
                          x={(geoTri2.A.x + geoTri2.B.x) / 2 - 14}
                          y={(geoTri2.A.y + geoTri2.B.y) / 2}
                          textAnchor="end"
                          className="fill-amber-300 font-mono text-xs font-extrabold drop-shadow"
                        >
                          c' = {geoTri2.ab} cm
                        </text>
                        <text
                          x={(geoTri2.B.x + geoTri2.C.x) / 2}
                          y={(geoTri2.B.y + geoTri2.C.y) / 2 + 18}
                          textAnchor="middle"
                          className="fill-amber-300 font-mono text-xs font-extrabold drop-shadow"
                        >
                          a' = {geoTri2.bc} cm
                        </text>
                        <text
                          x={(geoTri2.C.x + geoTri2.A.x) / 2 + 14}
                          y={(geoTri2.C.y + geoTri2.A.y) / 2}
                          textAnchor="start"
                          className="fill-amber-300 font-mono text-xs font-extrabold drop-shadow"
                        >
                          b' = {geoTri2.ca} cm
                        </text>
                      </>
                    )}

                    {/* Angle Measures of A'B'C' */}
                    {showAngleMeasures && (
                      <>
                        <text
                          x={geoTri2.A.x}
                          y={geoTri2.A.y + 26}
                          textAnchor="middle"
                          className="fill-cyan-300 font-mono text-[11px] font-bold"
                        >
                          {geoTri2.angleA}°
                        </text>
                        <text
                          x={geoTri2.B.x + 28}
                          y={geoTri2.B.y - 10}
                          textAnchor="start"
                          className="fill-cyan-300 font-mono text-[11px] font-bold"
                        >
                          {geoTri2.angleB}°
                        </text>
                        <text
                          x={geoTri2.C.x - 28}
                          y={geoTri2.C.y - 10}
                          textAnchor="end"
                          className="fill-cyan-300 font-mono text-[11px] font-bold"
                        >
                          {geoTri2.angleC}°
                        </text>
                      </>
                    )}

                    {/* Vertices of A'B'C' */}
                    {/* Vertex A' */}
                    <g
                      className={activeCase === 'free_drag' ? 'cursor-move' : ''}
                      onMouseDown={activeCase === 'free_drag' ? (e) => handleMouseDown('freeA', e) : undefined}
                      onTouchStart={activeCase === 'free_drag' ? (e) => handleMouseDown('freeA', e) : undefined}
                    >
                      <circle cx={geoTri2.A.x} cy={geoTri2.A.y} r="8" fill="#f59e0b" stroke="#ffffff" strokeWidth="2.5" />
                      {showVertexLabels && (
                        <text
                          x={geoTri2.A.x}
                          y={geoTri2.A.y - 12}
                          textAnchor="middle"
                          className="fill-amber-300 font-sans font-black text-sm"
                        >
                          A'
                        </text>
                      )}
                    </g>

                    {/* Vertex B' */}
                    <g
                      className={activeCase === 'free_drag' ? 'cursor-move' : ''}
                      onMouseDown={activeCase === 'free_drag' ? (e) => handleMouseDown('freeB', e) : undefined}
                      onTouchStart={activeCase === 'free_drag' ? (e) => handleMouseDown('freeB', e) : undefined}
                    >
                      <circle cx={geoTri2.B.x} cy={geoTri2.B.y} r="8" fill="#f59e0b" stroke="#ffffff" strokeWidth="2.5" />
                      {showVertexLabels && (
                        <text
                          x={geoTri2.B.x - 14}
                          y={geoTri2.B.y + 6}
                          textAnchor="end"
                          className="fill-amber-300 font-sans font-black text-sm"
                        >
                          B'
                        </text>
                      )}
                    </g>

                    {/* Vertex C' */}
                    <g
                      className={activeCase === 'free_drag' ? 'cursor-move' : ''}
                      onMouseDown={activeCase === 'free_drag' ? (e) => handleMouseDown('freeC', e) : undefined}
                      onTouchStart={activeCase === 'free_drag' ? (e) => handleMouseDown('freeC', e) : undefined}
                    >
                      <circle cx={geoTri2.C.x} cy={geoTri2.C.y} r="8" fill="#f59e0b" stroke="#ffffff" strokeWidth="2.5" />
                      {showVertexLabels && (
                        <text
                          x={geoTri2.C.x + 14}
                          y={geoTri2.C.y + 6}
                          textAnchor="start"
                          className="fill-amber-300 font-sans font-black text-sm"
                        >
                          C'
                        </text>
                      )}
                    </g>

                    {/* Rotation Handle (when not in free drag) */}
                    {activeCase !== 'free_drag' && (
                      <g
                        className="cursor-grab active:cursor-grabbing"
                        onMouseDown={(e) => handleMouseDown('rotHandle', e)}
                        onTouchStart={(e) => handleMouseDown('rotHandle', e)}
                      >
                        <line
                          x1={geoTri2.centroid.x}
                          y1={geoTri2.centroid.y}
                          x2={geoTri2.centroid.x + 45}
                          y2={geoTri2.centroid.y}
                          stroke="#fbbf24"
                          strokeWidth="1.5"
                          strokeDasharray="2 2"
                        />
                        <circle
                          cx={geoTri2.centroid.x + 45}
                          cy={geoTri2.centroid.y}
                          r="5"
                          fill="#fbbf24"
                          stroke="#ffffff"
                          strokeWidth="1.5"
                        />
                      </g>
                    )}

                    {/* Label at Bottom of Right */}
                    <text
                      x="730"
                      y="545"
                      textAnchor="middle"
                      className={`font-bold text-xs ${geoTri2.isSimilar ? 'fill-amber-400' : 'fill-rose-400'}`}
                    >
                      {geoTri2.isSimilar
                        ? `△A'B'C' đồng dạng (S₂ = ${geoTri2.area} cm² = ${(geoTri2.effectiveK ** 2).toFixed(2)} × S₁)`
                        : '⚠️ △A\'B\'C\' KHÔNG đồng dạng với △ABC'}
                    </text>
                  </g>
                </>
              )}

              {/* ======================================================= */}
              {/* CASE 2: SQUARES (HÌNH VUÔNG ĐỒNG DẠNG)                  */}
              {/* ======================================================= */}
              {shapeCategory === 'square' && (
                <g>
                  {/* Square 1 */}
                  <rect
                    x="160"
                    y="220"
                    width={squareSide}
                    height={squareSide}
                    fill="#0284c7"
                    fillOpacity="0.25"
                    stroke="#38bdf8"
                    strokeWidth="3"
                  />
                  <text x={160 + squareSide / 2} y="200" textAnchor="middle" className="fill-sky-300 font-bold text-xs">
                    Hình vuông 1 (Cạnh a = {geoNonTriangles.square.side1} cm)
                  </text>
                  <text x={160 + squareSide / 2} y={220 + squareSide / 2 + 5} textAnchor="middle" className="fill-sky-200 font-mono text-xs">
                    S₁ = {geoNonTriangles.square.area1} cm²
                  </text>

                  {/* Square 2 */}
                  <rect
                    x="580"
                    y="220"
                    width={squareSide * scaleK}
                    height={squareSide * scaleK}
                    fill="#f59e0b"
                    fillOpacity="0.3"
                    stroke="#fbbf24"
                    strokeWidth="3"
                  />
                  <text x={580 + (squareSide * scaleK) / 2} y="200" textAnchor="middle" className="fill-amber-300 font-bold text-xs">
                    Hình vuông 2 (Cạnh a' = {geoNonTriangles.square.side2} cm = {scaleK} × a)
                  </text>
                  <text x={580 + (squareSide * scaleK) / 2} y={220 + (squareSide * scaleK) / 2 + 5} textAnchor="middle" className="fill-amber-200 font-mono text-xs">
                    S₂ = {geoNonTriangles.square.area2} cm² = {geoNonTriangles.square.areaRatio} × S₁
                  </text>

                  {/* 90 deg angle marks on both */}
                  <text x="240" y="520" textAnchor="middle" className="fill-emerald-400 font-medium text-xs">
                    ✓ Mọi hình vuông luôn đồng dạng với nhau (4 góc đều bằng 90°, 4 cạnh bằng nhau).
                  </text>
                </g>
              )}

              {/* ======================================================= */}
              {/* CASE 3: RECTANGLES (HÌNH CHỮ NHẬT)                     */}
              {/* ======================================================= */}
              {shapeCategory === 'rectangle' && (
                <g>
                  {/* Rectangle 1 */}
                  <rect
                    x="140"
                    y="240"
                    width={rectW}
                    height={rectH}
                    fill="#0284c7"
                    fillOpacity="0.25"
                    stroke="#38bdf8"
                    strokeWidth="3"
                  />
                  <text x={140 + rectW / 2} y="220" textAnchor="middle" className="fill-sky-300 font-bold text-xs">
                    Hình chữ nhật 1: {geoNonTriangles.rectangle.w1} × {geoNonTriangles.rectangle.h1} cm
                  </text>
                  <text x={140 + rectW / 2} y={240 + rectH / 2 + 5} textAnchor="middle" className="fill-sky-200 font-mono text-xs">
                    S₁ = {geoNonTriangles.rectangle.area1} cm²
                  </text>

                  {/* Rectangle 2 */}
                  <rect
                    x="560"
                    y="240"
                    width={rectW * scaleK}
                    height={rectH * scaleK}
                    fill="#f59e0b"
                    fillOpacity="0.3"
                    stroke="#fbbf24"
                    strokeWidth="3"
                  />
                  <text x={560 + (rectW * scaleK) / 2} y="220" textAnchor="middle" className="fill-amber-300 font-bold text-xs">
                    Hình chữ nhật 2: {geoNonTriangles.rectangle.w2} × {geoNonTriangles.rectangle.h2} cm (k = {scaleK})
                  </text>
                  <text x={560 + (rectW * scaleK) / 2} y={240 + (rectH * scaleK) / 2 + 5} textAnchor="middle" className="fill-amber-200 font-mono text-xs">
                    S₂ = {geoNonTriangles.rectangle.area2} cm² = {geoNonTriangles.rectangle.areaRatio} × S₁
                  </text>

                  <text x="500" y="520" textAnchor="middle" className="fill-amber-300 font-medium text-xs">
                    💡 Hai hình chữ nhật đồng dạng khi và chỉ khi TỈ LỆ chiều dài / chiều rộng bằng nhau: w₂/w₁ = h₂/h₁.
                  </text>
                </g>
              )}

              {/* ======================================================= */}
              {/* CASE 4: CIRCLES (HÌNH TRÒN ĐỒNG DẠNG)                  */}
              {/* ======================================================= */}
              {shapeCategory === 'circle' && (
                <g>
                  {/* Circle 1 */}
                  <circle
                    cx="240"
                    cy="300"
                    r={circleR}
                    fill="#0284c7"
                    fillOpacity="0.25"
                    stroke="#38bdf8"
                    strokeWidth="3"
                  />
                  <line x1="240" y1="300" x2={240 + circleR} y2="300" stroke="#38bdf8" strokeWidth="2" strokeDasharray="3 3" />
                  <text x="240" y="190" textAnchor="middle" className="fill-sky-300 font-bold text-xs">
                    Hình tròn C₁ (Bán kính R₁ = {geoNonTriangles.circle.r1} cm)
                  </text>
                  <text x="240" y="305" textAnchor="middle" className="fill-sky-200 font-mono text-xs">
                    S₁ = {geoNonTriangles.circle.area1} cm²
                  </text>

                  {/* Circle 2 */}
                  <circle
                    cx="700"
                    cy="300"
                    r={circleR * scaleK}
                    fill="#f59e0b"
                    fillOpacity="0.3"
                    stroke="#fbbf24"
                    strokeWidth="3"
                  />
                  <line x1="700" y1="300" x2={700 + circleR * scaleK} y2="300" stroke="#fbbf24" strokeWidth="2" strokeDasharray="3 3" />
                  <text x="700" y="150" textAnchor="middle" className="fill-amber-300 font-bold text-xs">
                    Hình tròn C₂ (Bán kính R₂ = {geoNonTriangles.circle.r2} cm = {scaleK} × R₁)
                  </text>
                  <text x="700" y="305" textAnchor="middle" className="fill-amber-200 font-mono text-xs">
                    S₂ = {geoNonTriangles.circle.area2} cm² = {geoNonTriangles.circle.areaRatio} × S₁
                  </text>

                  <text x="500" y="520" textAnchor="middle" className="fill-emerald-400 font-medium text-xs">
                    ✓ Mọi hình tròn đều đồng dạng với nhau theo tỉ số bán kính k = R₂ / R₁.
                  </text>
                </g>
              )}
            </svg>
          </div>
        </div>

        {/* Right Column: Measurement Tables & Pedagogical Control Panel */}
        <div className="w-full lg:w-[380px] flex flex-col gap-3 max-h-[640px] overflow-y-auto pr-1">
          {/* 1. SCALE FACTOR (TỈ SỐ k) CONTROLLER */}
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800/90 p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-cyan-400" />
                <span className="font-bold text-xs text-white uppercase tracking-wider">
                  Tỉ số đồng dạng k
                </span>
              </div>
              <span className="font-mono font-extrabold text-sm px-2.5 py-0.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                k = {scaleK}
              </span>
            </div>

            {/* Slider for k */}
            <div className="space-y-1.5">
              <input
                type="range"
                min="0.25"
                max="3.5"
                step="0.05"
                value={scaleK}
                onChange={(e) => setScaleK(parseFloat(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>0.25x (Thu nhỏ)</span>
                <span>1.0x (Bằng nhau)</span>
                <span>2.0x</span>
                <span>3.5x (Phóng to)</span>
              </div>
            </div>

            {/* Quick k Buttons */}
            <div className="grid grid-cols-5 gap-1.5 pt-1">
              {[0.5, 0.75, 1.0, 1.5, 2.0].map((presetK) => (
                <button
                  key={presetK}
                  onClick={() => {
                    setScaleK(presetK);
                    showToast(`Tỉ số k = ${presetK}`);
                  }}
                  className={`py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                    scaleK === presetK
                      ? 'bg-cyan-500 text-slate-950 shadow'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {presetK}x
                </button>
              ))}
            </div>
          </div>

          {/* 2. REAL-TIME MEASUREMENT COMPARISON TABLE */}
          {shapeCategory === 'triangle' && (
            <div className="bg-slate-900/90 rounded-2xl border border-slate-800/90 p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-amber-400" />
                  <span className="font-bold text-xs text-white uppercase tracking-wider">
                    Bảng đo đạc & Tỉ số cạnh
                  </span>
                </div>
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    geoTri2.isSimilar
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  {geoTri2.isSimilar ? '✓ ĐỒNG DẠNG' : '✗ KHÔNG ĐỒNG DẠNG'}
                </span>
              </div>

              {/* Sides Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60 text-xs">
                <table className="w-full text-center">
                  <thead>
                    <tr className="bg-slate-900/90 text-slate-400 border-b border-slate-800 text-[11px]">
                      <th className="py-1.5 px-2 text-left">Cạnh tương ứng</th>
                      <th className="py-1.5 px-2 text-sky-300">△ABC</th>
                      <th className="py-1.5 px-2 text-amber-300">△A'B'C'</th>
                      <th className="py-1.5 px-2 text-emerald-300">Tỉ số (Cạnh'/Cạnh)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                    <tr>
                      <td className="py-1 px-2 text-left text-slate-300 font-sans">AB ↔ A'B'</td>
                      <td className="py-1 px-2 text-sky-200">{geoABC.ab}</td>
                      <td className="py-1 px-2 text-amber-200">{geoTri2.ab}</td>
                      <td className="py-1 px-2 font-bold text-emerald-300">{geoTri2.ratioAB}</td>
                    </tr>
                    <tr>
                      <td className="py-1 px-2 text-left text-slate-300 font-sans">BC ↔ B'C'</td>
                      <td className="py-1 px-2 text-sky-200">{geoABC.bc}</td>
                      <td className="py-1 px-2 text-amber-200">{geoTri2.bc}</td>
                      <td className="py-1 px-2 font-bold text-emerald-300">{geoTri2.ratioBC}</td>
                    </tr>
                    <tr>
                      <td className="py-1 px-2 text-left text-slate-300 font-sans">CA ↔ C'A'</td>
                      <td className="py-1 px-2 text-sky-200">{geoABC.ca}</td>
                      <td className="py-1 px-2 text-amber-200">{geoTri2.ca}</td>
                      <td className="py-1 px-2 font-bold text-emerald-300">{geoTri2.ratioCA}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Angles Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60 text-xs">
                <table className="w-full text-center">
                  <thead>
                    <tr className="bg-slate-900/90 text-slate-400 border-b border-slate-800 text-[11px]">
                      <th className="py-1.5 px-2 text-left">Góc tương ứng</th>
                      <th className="py-1.5 px-2 text-sky-300">∠ABC</th>
                      <th className="py-1.5 px-2 text-amber-300">∠A'B'C'</th>
                      <th className="py-1.5 px-2 text-cyan-300">So sánh</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                    <tr>
                      <td className="py-1 px-2 text-left text-slate-300 font-sans">Góc A ↔ A'</td>
                      <td className="py-1 px-2 text-sky-200">{geoABC.angleA}°</td>
                      <td className="py-1 px-2 text-amber-200">{geoTri2.angleA}°</td>
                      <td className="py-1 px-2 text-emerald-400 font-bold">
                        {Math.abs(geoABC.angleA - geoTri2.angleA) <= 1 ? '=' : '≠'}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1 px-2 text-left text-slate-300 font-sans">Góc B ↔ B'</td>
                      <td className="py-1 px-2 text-sky-200">{geoABC.angleB}°</td>
                      <td className="py-1 px-2 text-amber-200">{geoTri2.angleB}°</td>
                      <td className="py-1 px-2 text-emerald-400 font-bold">
                        {Math.abs(geoABC.angleB - geoTri2.angleB) <= 1 ? '=' : '≠'}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1 px-2 text-left text-slate-300 font-sans">Góc C ↔ C'</td>
                      <td className="py-1 px-2 text-sky-200">{geoABC.angleC}°</td>
                      <td className="py-1 px-2 text-amber-200">{geoTri2.angleC}°</td>
                      <td className="py-1 px-2 text-emerald-400 font-bold">
                        {Math.abs(geoABC.angleC - geoTri2.angleC) <= 1 ? '=' : '≠'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Area Scaling Ratio Highlight */}
              <div className="p-2.5 rounded-xl bg-gradient-to-r from-cyan-950/60 to-indigo-950/60 border border-cyan-800/40 text-xs space-y-1">
                <div className="flex justify-between font-bold text-cyan-300">
                  <span>Tỉ số diện tích:</span>
                  <span className="font-mono text-amber-300">
                    S₂ / S₁ = k² = {(geoTri2.effectiveK ** 2).toFixed(2)}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Khi độ dài cạnh gấp <strong className="text-white">{geoTri2.effectiveK}</strong> lần thì diện tích gấp{' '}
                  <strong className="text-amber-300">{(geoTri2.effectiveK ** 2).toFixed(2)}</strong> lần ($k^2$).
                </p>
              </div>
            </div>
          )}

          {/* 3. MODE: GUIDED DISCOVERY (9 STEPS) */}
          {engineMode === 'guide' && (
            <div className="bg-indigo-950/40 rounded-2xl border border-indigo-800/60 p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-indigo-300 font-bold text-xs">
                  <HelpCircle className="w-4 h-4" />
                  <span>HƯỚNG DẪN KHÁM PHÁ (BƯỚC {guideStep}/9)</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setGuideStep((s) => Math.max(1, s - 1))}
                    disabled={guideStep === 1}
                    className="p-1 rounded bg-slate-800 text-slate-300 hover:text-white disabled:opacity-30"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setGuideStep((s) => Math.min(9, s + 1))}
                    disabled={guideStep === 9}
                    className="p-1 rounded bg-slate-800 text-slate-300 hover:text-white disabled:opacity-30"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {guideStep === 1 && (
                <div className="space-y-1.5 text-xs text-slate-300">
                  <p className="font-bold text-white">Bước 1: Quan sát hai tam giác</p>
                  <p>Nhìn hai tam giác △ABC và △A'B'C'. Chúng có hình dạng thế nào với nhau? Kích thước có bằng nhau không?</p>
                </div>
              )}

              {guideStep === 2 && (
                <div className="space-y-1.5 text-xs text-slate-300">
                  <p className="font-bold text-white">Bước 2: Đo số đo các góc</p>
                  <p>Quan sát số đo ∠A, ∠B, ∠C và ∠A', ∠B', ∠C'. Các góc tương ứng có bằng nhau không?</p>
                </div>
              )}

              {guideStep === 3 && (
                <div className="space-y-1.5 text-xs text-slate-300">
                  <p className="font-bold text-white">Bước 3: Đo độ dài các cạnh</p>
                  <p>Xem độ dài 3 cạnh của △ABC và 3 cạnh của △A'B'C' trên bảng số đo.</p>
                </div>
              )}

              {guideStep === 4 && (
                <div className="space-y-1.5 text-xs text-slate-300">
                  <p className="font-bold text-white">Bước 4: Tính tỉ số các cạnh tương ứng</p>
                  <p className="font-mono text-cyan-300">A'B'/AB = B'C'/BC = C'A'/CA = k</p>
                  <p>Ba tỉ số này có bằng nhau không?</p>
                </div>
              )}

              {guideStep === 5 && (
                <div className="space-y-1.5 text-xs text-slate-300">
                  <p className="font-bold text-white">Bước 5: Thử kéo đỉnh A, B hoặc C</p>
                  <p>Khi tam giác ABC đổi dạng, tam giác A'B'C' tự động đổi theo đúng tỉ số k.</p>
                </div>
              )}

              {guideStep === 6 && (
                <div className="space-y-1.5 text-xs text-slate-300">
                  <p className="font-bold text-white">Bước 6: Thay đổi tỉ số k (Phóng to / Thu nhỏ)</p>
                  <p>Kéo thanh trượt k từ 0.5 đến 2.5 và nhận xét: Các góc có thay đổi không? Cạnh thay đổi thế nào?</p>
                </div>
              )}

              {guideStep === 7 && (
                <div className="space-y-1.5 text-xs text-slate-300">
                  <p className="font-bold text-white">Bước 7: Quan sát tỉ số diện tích (k²)</p>
                  <p>Khi k = 2, diện tích S' gấp mấy lần S? (Trả lời: gấp 4 lần vì 2² = 4).</p>
                </div>
              )}

              {guideStep === 8 && (
                <div className="space-y-1.5 text-xs text-slate-300">
                  <p className="font-bold text-white">Bước 8: Thử co về k = 1 và Chồng khít</p>
                  <p>Bấm nút [ 🎯 Co về k=1 & Chồng khít ] để chứng kiến sự đồng dạng bản chất là cùng dạng sau khi phóng to/thu nhỏ.</p>
                </div>
              )}

              {guideStep === 9 && (
                <div className="space-y-1.5 text-xs text-slate-300">
                  <p className="font-bold text-emerald-300">Bước 9: Rút ra định nghĩa Đồng dạng</p>
                  <p>
                    Hai tam giác đồng dạng là hai tam giác có các góc tương ứng bằng nhau và các cạnh tương ứng tỉ lệ. Ký hiệu:{' '}
                    <strong className="text-white font-mono">△ABC ∼ △A'B'C'</strong>.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 4. MODE: CHALLENGES (8 TASKS) */}
          {engineMode === 'challenge' && (
            <div className="bg-amber-950/40 rounded-2xl border border-amber-800/60 p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-amber-300 font-bold text-xs">
                  <Trophy className="w-4 h-4" />
                  <span>{CHALLENGES[challengeIdx].title}</span>
                </div>
                <span className="text-[11px] font-mono text-amber-400">
                  {challengeIdx + 1}/{CHALLENGES.length}
                </span>
              </div>

              <p className="text-xs text-slate-200 leading-relaxed font-medium">
                {CHALLENGES[challengeIdx].question}
              </p>

              <div className="space-y-1.5">
                {CHALLENGES[challengeIdx].options.map((opt, oIdx) => (
                  <button
                    key={oIdx}
                    onClick={() => {
                      setChallengeSelectedOpt(oIdx);
                      const isCorrect = oIdx === CHALLENGES[challengeIdx].correct;
                      setChallengeFeedback({
                        isCorrect,
                        text: isCorrect
                          ? '✓ Chính xác! ' + CHALLENGES[challengeIdx].explanation
                          : '✗ Chưa đúng, hãy thử lại! ' + CHALLENGES[challengeIdx].explanation,
                      });
                    }}
                    className={`w-full text-left p-2 rounded-xl text-xs transition-all border ${
                      challengeSelectedOpt === oIdx
                        ? oIdx === CHALLENGES[challengeIdx].correct
                          ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200 font-bold'
                          : 'bg-rose-950/80 border-rose-500 text-rose-200 font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>

              {challengeFeedback && (
                <div
                  className={`p-2.5 rounded-xl text-xs font-medium border ${
                    challengeFeedback.isCorrect
                      ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700/50'
                      : 'bg-rose-950/60 text-rose-300 border-rose-700/50'
                  }`}
                >
                  {challengeFeedback.text}
                </div>
              )}

              {/* Challenge Navigation */}
              <div className="flex justify-between pt-1">
                <button
                  onClick={() => {
                    setChallengeIdx((i) => Math.max(0, i - 1));
                    setChallengeSelectedOpt(null);
                    setChallengeFeedback(null);
                  }}
                  disabled={challengeIdx === 0}
                  className="px-3 py-1 bg-slate-800 text-slate-300 rounded-lg text-xs font-bold hover:bg-slate-700 disabled:opacity-30"
                >
                  ← Câu trước
                </button>
                <button
                  onClick={() => {
                    setChallengeIdx((i) => Math.min(CHALLENGES.length - 1, i + 1));
                    setChallengeSelectedOpt(null);
                    setChallengeFeedback(null);
                  }}
                  disabled={challengeIdx === CHALLENGES.length - 1}
                  className="px-3 py-1 bg-amber-500 text-slate-950 rounded-lg text-xs font-bold hover:bg-amber-400 disabled:opacity-30"
                >
                  Câu tiếp theo →
                </button>
              </div>
            </div>
          )}

          {/* 5. MODE: PRESENTATION (8 SLIDES) */}
          {engineMode === 'presentation' && (
            <div className="bg-emerald-950/40 rounded-2xl border border-emerald-800/60 p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-emerald-300 font-bold text-xs">
                  <Play className="w-4 h-4" />
                  <span>TRÌNH CHIẾU BÀI GIẢNG ({presentationSlide}/8)</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPresentationSlide((s) => Math.max(1, s - 1))}
                    disabled={presentationSlide === 1}
                    className="p-1 rounded bg-slate-800 text-slate-300 hover:text-white disabled:opacity-30"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setPresentationSlide((s) => Math.min(8, s + 1))}
                    disabled={presentationSlide === 8}
                    className="p-1 rounded bg-slate-800 text-slate-300 hover:text-white disabled:opacity-30"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-1.5">
                {presentationSlide === 1 && (
                  <>
                    <h4 className="font-bold text-emerald-300">Slide 1: Hiện tượng Hình đồng dạng trong thực tế</h4>
                    <p className="text-slate-300">
                      Bản đồ thu nhỏ, ảnh phóng to, mô hình kiến trúc đều là các hình có cùng hình dạng nhưng khác kích thước.
                    </p>
                  </>
                )}
                {presentationSlide === 2 && (
                  <>
                    <h4 className="font-bold text-emerald-300">Slide 2: Định nghĩa Hai tam giác đồng dạng</h4>
                    <p className="text-slate-300 font-mono text-cyan-300">
                      ∠A = ∠A', ∠B = ∠B', ∠C = ∠C'
                      <br />
                      A'B'/AB = B'C'/BC = C'A'/CA = k
                    </p>
                  </>
                )}
                {presentationSlide === 3 && (
                  <>
                    <h4 className="font-bold text-emerald-300">Slide 3: Trường hợp đồng dạng thứ nhất (C-C-C)</h4>
                    <p className="text-slate-300">
                      Nếu 3 cạnh của tam giác này tỉ lệ với 3 cạnh của tam giác kia thì hai tam giác đó đồng dạng.
                    </p>
                  </>
                )}
                {presentationSlide === 4 && (
                  <>
                    <h4 className="font-bold text-emerald-300">Slide 4: Trường hợp đồng dạng thứ hai (C-G-C)</h4>
                    <p className="text-slate-300">
                      Nếu hai cạnh của tam giác này tỉ lệ với hai cạnh của tam giác kia và hai góc tạo bởi các cặp cạnh đó bằng nhau.
                    </p>
                  </>
                )}
                {presentationSlide === 5 && (
                  <>
                    <h4 className="font-bold text-emerald-300">Slide 5: Trường hợp đồng dạng thứ ba (G-G)</h4>
                    <p className="text-slate-300">
                      Nếu hai góc của tam giác này lần lượt bằng hai góc của tam giác kia thì hai tam giác đó đồng dạng.
                    </p>
                  </>
                )}
                {presentationSlide === 6 && (
                  <>
                    <h4 className="font-bold text-emerald-300">Slide 6: Tỉ số Diện tích (S' / S = k²)</h4>
                    <p className="text-slate-300">
                      Tỉ số diện tích của hai tam giác đồng dạng bằng bình phương tỉ số đồng dạng.
                    </p>
                  </>
                )}
                {presentationSlide === 7 && (
                  <>
                    <h4 className="font-bold text-emerald-300">Slide 7: Mở rộng Hình vuông & Hình tròn</h4>
                    <p className="text-slate-300">
                      Tất cả các hình vuông đều đồng dạng. Tất cả các hình tròn đều đồng dạng.
                    </p>
                  </>
                )}
                {presentationSlide === 8 && (
                  <>
                    <h4 className="font-bold text-emerald-300">Slide 8: Tổng kết & Ghi nhớ</h4>
                    <p className="text-slate-300">
                      Khi viết ký hiệu đồng dạng, tên các đỉnh tương ứng phải được viết theo đúng thứ tự.
                    </p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. DEFINITION & PROPERTIES MODAL */}
      {showDefinitionModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-5 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-cyan-400" />
                <h3 className="font-extrabold text-base text-white">
                  Định nghĩa & Tính chất Tam giác Đồng dạng
                </h3>
              </div>
              <button
                onClick={() => setShowDefinitionModal(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300 max-h-[400px] overflow-y-auto pr-1">
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                <h4 className="font-bold text-cyan-300 uppercase tracking-wide">1. Định nghĩa</h4>
                <p>
                  Tam giác $A'B'C'$ gọi là đồng dạng với tam giác $ABC$ nếu:
                </p>
                <ul className="list-disc list-inside text-slate-200 space-y-1 font-mono pl-2">
                  <li>∠A' = ∠A, ∠B' = ∠B, ∠C' = ∠C</li>
                  <li>A'B' / AB = B'C' / BC = C'A' / CA = k (với k là tỉ số đồng dạng)</li>
                </ul>
                <p className="text-amber-300 font-bold">Ký hiệu: △A'B'C' ∼ △ABC</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                <h4 className="font-bold text-cyan-300 uppercase tracking-wide">2. Ba trường hợp đồng dạng</h4>
                <ul className="list-disc list-inside space-y-1 text-slate-200">
                  <li><strong>Trường hợp 1 (C-C-C):</strong> Ba cặp cạnh tương ứng tỉ lệ.</li>
                  <li><strong>Trường hợp 2 (C-G-C):</strong> Hai cặp cạnh tương ứng tỉ lệ và góc xen giữa bằng nhau.</li>
                  <li><strong>Trường hợp 3 (G-G):</strong> Hai cặp góc tương ứng bằng nhau.</li>
                </ul>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                <h4 className="font-bold text-cyan-300 uppercase tracking-wide">3. Tính chất quan trọng</h4>
                <ul className="list-disc list-inside space-y-1 text-slate-200">
                  <li>Mỗi tam giác đồng dạng với chính nó theo tỉ số k = 1.</li>
                  <li>Tỉ số hai đường cao tương ứng bằng tỉ số đồng dạng k.</li>
                  <li>Tỉ số diện tích bằng bình phương tỉ số đồng dạng: S' / S = k².</li>
                  <li>Thể tích trong không gian (3D) tỉ lệ theo k³.</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowDefinitionModal(false)}
                className="px-4 py-1.5 rounded-xl bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400 text-xs shadow-lg shadow-cyan-500/20"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
