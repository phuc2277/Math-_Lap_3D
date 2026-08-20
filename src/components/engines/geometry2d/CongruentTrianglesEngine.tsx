import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { ModelParams, DisplayOptions } from '../../../types/geometry';
import {
  RotateCw,
  RotateCcw,
  Move,
  FlipHorizontal,
  Layers,
  Sparkles,
  CheckCircle2,
  HelpCircle,
  Trophy,
  Play,
  RotateCcw as ResetIcon,
  Maximize2,
  Minimize2,
  Eye,
  EyeOff,
  BookOpen,
  ChevronRight,
  ChevronLeft,
  AlertTriangle,
  Mouse,
  Check,
  X,
  Target,
  ArrowRightLeft,
  Info,
} from 'lucide-react';

export type CongruenceCase = 'free' | 'ccc' | 'cgc' | 'gcg' | 'counter_ssa' | 'counter_aaa' | 'counter_insufficient';
export type EngineMode = 'explore' | 'guide' | 'challenge' | 'presentation';

interface CongruentTrianglesEngineProps {
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

export const CongruentTrianglesEngine: React.FC<CongruentTrianglesEngineProps> = ({
  params,
  displayOptions,
  onParamChange,
}) => {
  // 1. Navigation & State
  const [engineMode, setEngineMode] = useState<EngineMode>('explore');
  const [activeCase, setActiveCase] = useState<CongruenceCase>('ccc');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showDefinitionModal, setShowDefinitionModal] = useState<boolean>(false);

  // 2. Base Triangle ABC (Left Side in ViewBox 0 0 1000 650)
  // Origin coordinates for A, B, C
  const [vertA, setVertA] = useState<Point2D>({ x: 260, y: 160 });
  const [vertB, setVertB] = useState<Point2D>({ x: 120, y: 440 });
  const [vertC, setVertC] = useState<Point2D>({ x: 420, y: 440 });

  // 3. Rigid Motion for Triangle A'B'C' (Right Side Initial Position)
  const [transX, setTransX] = useState<number>(460); // Offset X from ABC
  const [transY, setTransY] = useState<number>(0);
  const [rotationDeg, setRotationDeg] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [opacityB, setOpacityB] = useState<number>(85); // 0% - 100%

  // 4. Display Toggles
  const [showVertexLabels, setShowVertexLabels] = useState<boolean>(true);
  const [showEdgeNames, setShowEdgeNames] = useState<boolean>(true);
  const [showEdgeLengths, setShowEdgeLengths] = useState<boolean>(true);
  const [showAngleNames, setShowAngleNames] = useState<boolean>(true);
  const [showAngleMeasures, setShowAngleMeasures] = useState<boolean>(true);
  const [showEqualTickMarks, setShowEqualTickMarks] = useState<boolean>(true);
  const [showAltitudes, setShowAltitudes] = useState<boolean>(false);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [matchGlow, setMatchGlow] = useState<boolean>(false);

  // 5. Interaction State
  const [draggingTarget, setDraggingTarget] = useState<'A' | 'B' | 'C' | 'tri2' | 'rotHandle' | null>(null);
  const [dragStartPos, setDragStartPos] = useState<Point2D>({ x: 0, y: 0 });
  const [initialTrans, setInitialTrans] = useState<Point2D>({ x: 0, y: 0 });
  const [initialRot, setInitialRot] = useState<number>(0);

  // 6. Superposition Animation
  const [isSuperposing, setIsSuperposing] = useState<boolean>(false);
  const [superposeProgress, setSuperposeProgress] = useState<number>(0); // 0 -> 1
  const [animSpeed, setAnimSpeed] = useState<number>(1);
  const animReqRef = useRef<number | null>(null);

  // 7. Toast & Feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 8. Guide Mode Step (1 to 7)
  const [guideStep, setGuideStep] = useState<number>(1);

  // 9. Challenge Mode
  const [challengeIdx, setChallengeIdx] = useState<number>(0);
  const [challengeAnswers, setChallengeAnswers] = useState<Record<number, any>>({});
  const [challengeFeedback, setChallengeFeedback] = useState<string | null>(null);

  // 10. Presentation Mode Slide (1 to 8)
  const [presentationSlide, setPresentationSlide] = useState<number>(1);

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

  // Compute ABC Geometry Measurements
  const geoABC = useMemo(() => {
    const ab = dist(vertA, vertB) / 35; // Scale to cm
    const bc = dist(vertB, vertC) / 35;
    const ca = dist(vertC, vertA) / 35;

    const angleA = computeAngle(vertA, vertB, vertC);
    const angleB = computeAngle(vertB, vertA, vertC);
    const angleC = computeAngle(vertC, vertA, vertB);

    const centroid: Point2D = {
      x: (vertA.x + vertB.x + vertC.x) / 3,
      y: (vertA.y + vertB.y + vertC.y) / 3,
    };

    // Height from A to BC
    const footA = projectPointOnLine(vertA, vertB, vertC);
    const heightA = dist(vertA, footA) / 35;

    // Area S = 1/2 * BC * heightA
    const area = 0.5 * bc * heightA;

    return {
      ab: parseFloat(ab.toFixed(1)),
      bc: parseFloat(bc.toFixed(1)),
      ca: parseFloat(ca.toFixed(1)),
      angleA: Math.round(angleA),
      angleB: Math.round(angleB),
      angleC: Math.round(angleC),
      centroid,
      footA,
      heightA: parseFloat(heightA.toFixed(1)),
      area: parseFloat(area.toFixed(1)),
    };
  }, [vertA, vertB, vertC]);

  // Base Vertices of Triangle 2 before rigid motion
  const baseTri2 = useMemo(() => {
    const c = geoABC.centroid;
    // Normalized centered coords of ABC
    const relA = { x: vertA.x - c.x, y: vertA.y - c.y };
    const relB = { x: vertB.x - c.x, y: vertB.y - c.y };
    const relC = { x: vertC.x - c.x, y: vertC.y - c.y };

    if (activeCase === 'counter_aaa') {
      // Scale by 1.35x (Similar but not congruent!)
      const scale = 1.35;
      return {
        A: { x: c.x + relA.x * scale, y: c.y + relA.y * scale },
        B: { x: c.x + relB.x * scale, y: c.y + relB.y * scale },
        C: { x: c.x + relC.x * scale, y: c.y + relC.y * scale },
      };
    }

    if (activeCase === 'counter_ssa') {
      // SSA counterexample: A'B' = AB, A'C' = AC, Angle C' = Angle C, but Angle A' != Angle A
      // We reflect A across the perpendicular bisector of BC or swing A around C
      const dAC = dist(vertC, vertA);
      // Altered position for A'
      const foot = geoABC.footA;
      const dxFootC = vertC.x - foot.x;
      const dyFootC = vertC.y - foot.y;
      // New A' reflected with different angle A
      const alteredA = {
        x: foot.x - (vertA.x - foot.x) * 0.4 + 40,
        y: vertA.y + 20,
      };
      return {
        A: alteredA,
        B: { ...vertB },
        C: { ...vertC },
      };
    }

    if (activeCase === 'counter_insufficient') {
      // 1 side equal, other sides arbitrary
      return {
        A: { x: vertA.x - 30, y: vertA.y - 40 },
        B: { ...vertB },
        C: { x: vertC.x + 20, y: vertC.y },
      };
    }

    // Default Congruent (CCC, CGC, GCG, free)
    return {
      A: { ...vertA },
      B: { ...vertB },
      C: { ...vertC },
    };
  }, [vertA, vertB, vertC, geoABC, activeCase]);

  // Transformed Vertices of Triangle A'B'C' in World Space
  const transformedTri2 = useMemo(() => {
    const c = geoABC.centroid;
    const rad = (rotationDeg * Math.PI) / 180;
    const cosR = Math.cos(rad);
    const sinR = Math.sin(rad);

    const transformPoint = (p: Point2D): Point2D => {
      // Relative to centroid of ABC
      let rx = p.x - c.x;
      let ry = p.y - c.y;

      // Flip horizontal if active
      if (isFlipped) {
        rx = -rx;
      }

      // Rotate
      const rotX = rx * cosR - ry * sinR;
      const rotY = rx * sinR + ry * cosR;

      // Translate
      return {
        x: c.x + rotX + transX,
        y: c.y + rotY + transY,
      };
    };

    const A_prime = transformPoint(baseTri2.A);
    const B_prime = transformPoint(baseTri2.B);
    const C_prime = transformPoint(baseTri2.C);

    const centroidPrime: Point2D = {
      x: (A_prime.x + B_prime.x + C_prime.x) / 3,
      y: (A_prime.y + B_prime.y + C_prime.y) / 3,
    };

    const footA_prime = projectPointOnLine(A_prime, B_prime, C_prime);
    const heightA_prime = dist(A_prime, footA_prime) / 35;

    const ab_prime = dist(A_prime, B_prime) / 35;
    const bc_prime = dist(B_prime, C_prime) / 35;
    const ca_prime = dist(C_prime, A_prime) / 35;

    const angleA_prime = computeAngle(A_prime, B_prime, C_prime);
    const angleB_prime = computeAngle(B_prime, A_prime, C_prime);
    const angleC_prime = computeAngle(C_prime, A_prime, B_prime);

    return {
      A: A_prime,
      B: B_prime,
      C: C_prime,
      centroid: centroidPrime,
      footA: footA_prime,
      heightA: parseFloat(heightA_prime.toFixed(1)),
      ab: parseFloat(ab_prime.toFixed(1)),
      bc: parseFloat(bc_prime.toFixed(1)),
      ca: parseFloat(ca_prime.toFixed(1)),
      angleA: Math.round(angleA_prime),
      angleB: Math.round(angleB_prime),
      angleC: Math.round(angleC_prime),
    };
  }, [baseTri2, geoABC.centroid, rotationDeg, isFlipped, transX, transY]);

  // Congruence Verification Check
  const congruenceStatus = useMemo(() => {
    const isCCC_congruent =
      activeCase !== 'counter_aaa' &&
      activeCase !== 'counter_ssa' &&
      activeCase !== 'counter_insufficient';

    const edgeDiffAB = Math.abs(geoABC.ab - transformedTri2.ab);
    const edgeDiffBC = Math.abs(geoABC.bc - transformedTri2.bc);
    const edgeDiffCA = Math.abs(geoABC.ca - transformedTri2.ca);

    const angleDiffA = Math.abs(geoABC.angleA - transformedTri2.angleA);
    const angleDiffB = Math.abs(geoABC.angleB - transformedTri2.angleB);
    const angleDiffC = Math.abs(geoABC.angleC - transformedTri2.angleC);

    const allEdgesMatch = edgeDiffAB < 0.15 && edgeDiffBC < 0.15 && edgeDiffCA < 0.15;
    const allAnglesMatch = angleDiffA <= 2 && angleDiffB <= 2 && angleDiffC <= 2;

    const isMathematicallyCongruent = isCCC_congruent && allEdgesMatch && allAnglesMatch;

    // Superposition Match Degree (Distance between A-A', B-B', C-C')
    const dA = dist(vertA, transformedTri2.A);
    const dB = dist(vertB, transformedTri2.B);
    const dC = dist(vertC, transformedTri2.C);
    const avgDist = (dA + dB + dC) / 3;

    // Matching percentage: 100% when avgDist = 0, 0% when avgDist >= 200
    const matchPercentage = Math.max(0, Math.min(100, Math.round(100 - avgDist * 0.5)));
    const isSuperposed = avgDist < 12;

    return {
      isMathematicallyCongruent,
      allEdgesMatch,
      allAnglesMatch,
      matchPercentage,
      isSuperposed,
      avgDist,
    };
  }, [geoABC, transformedTri2, activeCase, vertA, vertB, vertC]);

  // Glowing effect when superposition is achieved
  useEffect(() => {
    if (congruenceStatus.isSuperposed && congruenceStatus.isMathematicallyCongruent) {
      setMatchGlow(true);
    } else {
      setMatchGlow(false);
    }
  }, [congruenceStatus.isSuperposed, congruenceStatus.isMathematicallyCongruent]);

  // Smooth Superposition Animation
  const handleSuperpose = () => {
    if (isSuperposing) return;
    setIsSuperposing(true);

    const startX = transX;
    const startY = transY;
    const startRot = rotationDeg % 360;
    const startFlip = isFlipped;

    // Target is exactly 0 translation, 0 rotation, and correct flip
    const targetX = 0;
    const targetY = 0;
    const targetRot = 0;

    let startTime: number | null = null;
    const duration = 1400 / animSpeed;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(1, elapsed / duration);

      // Ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3);

      setTransX(startX + (targetX - startX) * ease);
      setTransY(startY + (targetY - startY) * ease);
      setRotationDeg(startRot + (targetRot - startRot) * ease);
      setSuperposeProgress(progress);

      if (progress >= 0.5 && startFlip) {
        setIsFlipped(false);
      }

      if (progress < 1) {
        animReqRef.current = requestAnimationFrame(step);
      } else {
        setTransX(0);
        setTransY(0);
        setRotationDeg(0);
        setIsFlipped(false);
        setIsSuperposing(false);
        setSuperposeProgress(1);

        if (congruenceStatus.isMathematicallyCongruent) {
          showToast('✓ Hai tam giác đã hoàn toàn CHỒNG KHÍT! △ABC = △A\'B\'C\'');
        } else {
          showToast('⚠️ Hai tam giác KHÔNG THỂ chồng khít hoàn toàn vì không bằng nhau!');
        }
      }
    };

    animReqRef.current = requestAnimationFrame(step);
  };

  // Separate Triangles Animation (Tách ra)
  const handleSeparate = () => {
    if (isSuperposing) return;
    setIsSuperposing(true);

    const startX = transX;
    const startY = transY;
    const startRot = rotationDeg;
    const targetX = 460;
    const targetY = 0;
    const targetRot = 0;

    let startTime: number | null = null;
    const duration = 900 / animSpeed;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(1, elapsed / duration);
      const ease = 1 - Math.pow(1 - progress, 3);

      setTransX(startX + (targetX - startX) * ease);
      setTransY(startY + (targetY - startY) * ease);
      setRotationDeg(startRot + (targetRot - startRot) * ease);

      if (progress < 1) {
        animReqRef.current = requestAnimationFrame(step);
      } else {
        setTransX(460);
        setTransY(0);
        setRotationDeg(0);
        setIsSuperposing(false);
        showToast('Đã tách hai tam giác về vị trí đối chứng ban đầu.');
      }
    };

    animReqRef.current = requestAnimationFrame(step);
  };

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (animReqRef.current) cancelAnimationFrame(animReqRef.current);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  // Mouse / Touch Dragging Handlers
  const handleMouseDown = (target: 'A' | 'B' | 'C' | 'tri2' | 'rotHandle', e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    const pt = getSvgCoordinates(e);
    setDraggingTarget(target);
    setDragStartPos(pt);
    setInitialTrans({ x: transX, y: transY });
    setInitialRot(rotationDeg);
  };

  const handleMouseMove = useCallback(
    (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
      if (!draggingTarget) return;
      const pt = getSvgCoordinates(e);

      if (draggingTarget === 'A') {
        const clampedX = Math.max(50, Math.min(500, pt.x));
        const clampedY = Math.max(50, Math.min(380, pt.y));
        setVertA({ x: clampedX, y: clampedY });
      } else if (draggingTarget === 'B') {
        const clampedX = Math.max(50, Math.min(400, pt.x));
        const clampedY = Math.max(220, Math.min(580, pt.y));
        setVertB({ x: clampedX, y: clampedY });
      } else if (draggingTarget === 'C') {
        const clampedX = Math.max(200, Math.min(600, pt.x));
        const clampedY = Math.max(220, Math.min(580, pt.y));
        setVertC({ x: clampedX, y: clampedY });
      } else if (draggingTarget === 'tri2') {
        // Drag entire Triangle A'B'C'
        const dx = pt.x - dragStartPos.x;
        const dy = pt.y - dragStartPos.y;
        const newTransX = initialTrans.x + dx;
        const newTransY = initialTrans.y + dy;
        setTransX(newTransX);
        setTransY(newTransY);

        // Snap Assist when close to 0, 0
        if (Math.abs(newTransX) < 18 && Math.abs(newTransY) < 18 && Math.abs(rotationDeg % 360) < 10) {
          setTransX(0);
          setTransY(0);
          setRotationDeg(0);
          showToast('🎯 Đã tự động bắt dính chồng khít!');
        }
      } else if (draggingTarget === 'rotHandle') {
        // Rotate around centroid of Triangle 2
        const cPrime = transformedTri2.centroid;
        const angleRad = Math.atan2(pt.y - cPrime.y, pt.x - cPrime.x);
        const deg = (angleRad * 180) / Math.PI;
        setRotationDeg(Math.round(deg));
      }
    },
    [draggingTarget, dragStartPos, initialTrans, getSvgCoordinates, rotationDeg, transformedTri2.centroid]
  );

  const handleMouseUp = useCallback(() => {
    setDraggingTarget(null);
  }, []);

  // Global mouse up listeners
  useEffect(() => {
    const onUp = () => setDraggingTarget(null);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchend', onUp);
    };
  }, []);

  // Scroll Wheel Support to Rotate Triangle 2 or resize
  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
    const delta = e.deltaY < 0 ? 5 : -5;
    const newRot = (rotationDeg + delta + 360) % 360;
    setRotationDeg(newRot);
    showToast(`Xoay △A'B'C': ${newRot}°`);
  };

  // Reset Everything to Default
  const handleReset = () => {
    setVertA({ x: 260, y: 160 });
    setVertB({ x: 120, y: 440 });
    setVertC({ x: 420, y: 440 });
    setTransX(460);
    setTransY(0);
    setRotationDeg(0);
    setIsFlipped(false);
    setActiveCase('ccc');
    setSuperposeProgress(0);
    showToast('Đã khôi phục trạng thái ban đầu.');
  };

  // Challenge List
  const CHALLENGES = [
    {
      id: 1,
      title: 'Nhiệm vụ 1: Nhận biết hai tam giác bằng nhau',
      question: 'Dựa vào bảng số đo cạnh và góc, hai tam giác hiện tại có bằng nhau không?',
      options: [
        'Có, vì 3 cặp cạnh và 3 cặp góc tương ứng đều bằng nhau.',
        'Không, vì vị trí và hướng của chúng khác nhau.',
        'Không thể xác định được nếu chưa chồng khít.',
      ],
      correct: 0,
      explanation: 'Hai tam giác có các cạnh và các góc tương ứng bằng nhau thì bằng nhau, không phụ thuộc vào vị trí trong mặt phẳng.',
    },
    {
      id: 2,
      title: 'Nhiệm vụ 2: Trường hợp Cạnh - Cạnh - Cạnh (C-C-C)',
      question: 'Để kết luận △ABC = △A\'B\'C\' theo trường hợp C-C-C, ta cần chỉ ra điều kiện gì?',
      options: [
        'AB = A\'B\', BC = B\'C\', CA = C\'A\' (3 cặp cạnh tương ứng bằng nhau)',
        'AB = A\'B\' và ∠A = ∠A\'',
        '∠A = ∠A\', ∠B = ∠B\', ∠C = ∠C\'',
      ],
      correct: 0,
      explanation: 'Trường hợp C-C-C: Nếu ba cạnh của tam giác này bằng ba cạnh của tam giác kia thì hai tam giác đó bằng nhau.',
    },
    {
      id: 3,
      title: 'Nhiệm vụ 3: Xác định đỉnh tương ứng',
      question: 'Khi viết kí hiệu △ABC = △MNP, đỉnh nào tương ứng với đỉnh B?',
      options: ['Đỉnh M', 'Đỉnh N', 'Đỉnh P', 'Cả 3 đều đúng'],
      correct: 1,
      explanation: 'Trong kí hiệu △ABC = △MNP, đỉnh thứ hai B tương ứng với đỉnh thứ hai N (B ↔ N).',
    },
    {
      id: 4,
      title: 'Nhiệm vụ 4: Thao tác biến đổi hình học',
      question: 'Khi ta XOAY hoặc TỊNH TIẾN hoặc LẤY ĐỐI XỨNG tam giác △A\'B\'C\', độ dài các cạnh và số đo các góc của nó có bị thay đổi không?',
      options: [
        'Không thay đổi (các phép biến hình bảo toàn khoảng cách và góc)',
        'Có thay đổi kích thước',
        'Góc thay đổi nhưng cạnh không đổi',
      ],
      correct: 0,
      explanation: 'Tịnh tiến, quay và đối xứng trục là các phép biến hình cứng (phép dời hình), bảo toàn nguyên vẹn độ dài và số đo góc.',
    },
    {
      id: 5,
      title: 'Nhiệm vụ 5: Phản ví dụ (Góc - Góc - Góc)',
      question: 'Nếu hai tam giác có 3 cặp góc tương ứng bằng nhau (∠A=∠A\', ∠B=∠B\', ∠C=∠C\'), ta có thể kết luận chúng bằng nhau không?',
      options: [
        'Chưa thể kết luận (chúng có thể chỉ đồng dạng, kích thước khác nhau)',
        'Chắc chắn bằng nhau theo trường hợp G-G-G',
        'Luôn luôn bằng nhau',
      ],
      correct: 0,
      explanation: '3 góc bằng nhau chỉ đảm bảo 2 tam giác có cùng hình dạng (đồng dạng) nhưng kích thước có thể to nhỏ khác nhau (G-G-G không phải trường hợp bằng nhau).',
    },
    {
      id: 6,
      title: 'Nhiệm vụ 6: Ký hiệu cạnh xen giữa (C-G-C)',
      question: 'Trong tam giác ABC, góc xen giữa hai cạnh AB và AC là góc nào?',
      options: ['Góc A (∠BAC)', 'Góc B (∠ABC)', 'Góc C (∠ACB)'],
      correct: 0,
      explanation: 'Góc xen giữa hai cạnh AB và AC là góc A (đỉnh chung A).',
    },
  ];

  return (
    <div
      ref={containerRef}
      className={`flex flex-col bg-slate-950 text-slate-100 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden select-none transition-all duration-300 ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none' : 'w-full min-h-[620px]'
      }`}
    >
      {/* 1. TOP HEADER TOOLBAR */}
      <div className="flex flex-wrap items-center justify-between px-4 py-3 bg-slate-900/95 border-b border-slate-800/90 gap-2.5 backdrop-blur-md">
        {/* Title & Badge */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 via-indigo-600 to-amber-500 flex items-center justify-center shadow-lg shadow-sky-500/20 text-white font-bold">
            △
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-extrabold text-base sm:text-lg tracking-tight text-white flex items-center gap-2">
                <span>Hai tam giác bằng nhau</span>
                <span className="text-xs font-mono font-normal px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  △ABC = △A'B'C'
                </span>
              </h2>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Quan sát • Đo cạnh & góc • Xoay • Tịnh tiến • Đối xứng • Chồng khít
            </p>
          </div>
        </div>

        {/* Engine Modes Nav: Explore | Guide | Challenge | Presentation */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800/80">
          <button
            onClick={() => setEngineMode('explore')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              engineMode === 'explore'
                ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
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
            <span>Hướng dẫn ({guideStep}/7)</span>
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
            <span>Thử thách ({challengeIdx + 1}/6)</span>
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
            title="Định nghĩa & Ký hiệu hai tam giác bằng nhau"
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

      {/* 2. SECONDARY SUB-HEADER: Congruence Cases Selector */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2 bg-slate-900/60 border-b border-slate-800/60 gap-2 text-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
          <span className="text-slate-400 font-medium whitespace-nowrap mr-1">Trường hợp:</span>

          <button
            onClick={() => {
              setActiveCase('ccc');
              showToast('Trường hợp C-C-C: Ba cặp cạnh tương ứng bằng nhau');
            }}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all whitespace-nowrap flex items-center gap-1 ${
              activeCase === 'ccc'
                ? 'bg-sky-500 text-slate-950 shadow'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <span>🔺 C-C-C</span>
          </button>

          <button
            onClick={() => {
              setActiveCase('cgc');
              showToast('Trường hợp C-G-C: Hai cạnh và góc xen giữa bằng nhau');
            }}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all whitespace-nowrap flex items-center gap-1 ${
              activeCase === 'cgc'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <span>📐 C-G-C</span>
          </button>

          <button
            onClick={() => {
              setActiveCase('gcg');
              showToast('Trường hợp G-C-G: Hai góc và cạnh xen giữa bằng nhau');
            }}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all whitespace-nowrap flex items-center gap-1 ${
              activeCase === 'gcg'
                ? 'bg-emerald-500 text-slate-950 shadow'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <span>📏 G-C-G</span>
          </button>

          <button
            onClick={() => {
              setActiveCase('free');
              showToast('Chế độ Tự do: Kéo đỉnh thoải mái');
            }}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all whitespace-nowrap flex items-center gap-1 ${
              activeCase === 'free'
                ? 'bg-indigo-500 text-white shadow'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <span>✨ Tự do kéo</span>
          </button>

          <div className="h-4 w-px bg-slate-700 mx-1" />

          {/* Counterexamples Tab */}
          <button
            onClick={() => {
              setActiveCase('counter_aaa');
              showToast('⚠️ Phản ví dụ G-G-G: 3 góc bằng nhau nhưng kích thước khác nhau!');
            }}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all whitespace-nowrap flex items-center gap-1 ${
              activeCase === 'counter_aaa'
                ? 'bg-rose-500 text-white shadow'
                : 'bg-rose-950/40 text-rose-300 hover:bg-rose-900/50 border border-rose-800/50'
            }`}
          >
            <AlertTriangle className="w-3 h-3 text-rose-400" />
            <span>❌ G-G-G (Khác cỡ)</span>
          </button>

          <button
            onClick={() => {
              setActiveCase('counter_ssa');
              showToast('⚠️ Phản ví dụ C-C-G không xen giữa: 2 cạnh và 1 góc không kẹp');
            }}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all whitespace-nowrap flex items-center gap-1 ${
              activeCase === 'counter_ssa'
                ? 'bg-rose-500 text-white shadow'
                : 'bg-rose-950/40 text-rose-300 hover:bg-rose-900/50 border border-rose-800/50'
            }`}
          >
            <AlertTriangle className="w-3 h-3 text-rose-400" />
            <span>❌ C-C-G (Không xen giữa)</span>
          </button>
        </div>

        {/* Superposition Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleSuperpose}
            disabled={isSuperposing}
            className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-extrabold rounded-lg shadow-lg shadow-sky-500/25 transition-all active:scale-95 disabled:opacity-50"
          >
            <Target className="w-3.5 h-3.5" />
            <span>🎯 Chồng khít</span>
          </button>

          <button
            onClick={handleSeparate}
            disabled={isSuperposing}
            className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-lg border border-slate-700 transition-all active:scale-95 disabled:opacity-50"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>↔ Tách ra</span>
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
                  showVertexLabels ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40' : 'text-slate-400 hover:text-white'
                }`}
                title="Bật/tắt tên các đỉnh A, B, C, A', B', C'"
              >
                Đỉnh
              </button>

              <button
                onClick={() => setShowEdgeLengths(!showEdgeLengths)}
                className={`px-2 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                  showEdgeLengths ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-slate-400 hover:text-white'
                }`}
                title="Bật/tắt độ dài cạnh"
              >
                Độ dài
              </button>

              <button
                onClick={() => setShowAngleMeasures(!showAngleMeasures)}
                className={`px-2 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                  showAngleMeasures ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'text-slate-400 hover:text-white'
                }`}
                title="Bật/tắt số đo góc"
              >
                Góc
              </button>

              <button
                onClick={() => setShowEqualTickMarks(!showEqualTickMarks)}
                className={`px-2 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                  showEqualTickMarks ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40' : 'text-slate-400 hover:text-white'
                }`}
                title="Ký hiệu vạch cạnh bằng nhau và cung góc"
              >
                Ký hiệu =
              </button>

              <button
                onClick={() => setShowAltitudes(!showAltitudes)}
                className={`px-2 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                  showAltitudes ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'text-slate-400 hover:text-white'
                }`}
                title="Hiển thị đường cao AH và A'H'"
              >
                Đường cao
              </button>
            </div>

            {/* Quick Rigid Motion Mini-Bar */}
            <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800 backdrop-blur">
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

              <button
                onClick={() => {
                  setIsFlipped(!isFlipped);
                  showToast(isFlipped ? 'Tắt đối xứng' : '⟷ Đã lật đối xứng trục Y');
                }}
                className={`p-1 rounded transition-colors ${
                  isFlipped ? 'bg-amber-500 text-slate-950 font-bold' : 'hover:bg-slate-800 text-slate-300 hover:text-white'
                }`}
                title="Phép đối xứng trục (Flip)"
              >
                <FlipHorizontal className="w-3.5 h-3.5" />
              </button>

              <div className="hidden sm:flex items-center gap-1 text-[10px] text-amber-300/80 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                <Mouse className="w-3 h-3 text-amber-400" />
                <span>Lăn chuột để xoay</span>
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
                <pattern id="gridPattern" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.75" />
                </pattern>

                {/* Glow Filter for Superposition Match */}
                <filter id="glowGold" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="8" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Grid Background */}
              {showGrid && <rect width="1000" height="600" fill="url(#gridPattern)" rx="16" />}

              {/* Vertical Reference Dividing Line (Left ABC, Right A'B'C') */}
              {!congruenceStatus.isSuperposed && (
                <line
                  x1="500"
                  y1="30"
                  x2="500"
                  y2="570"
                  stroke="#334155"
                  strokeWidth="1.5"
                  strokeDasharray="6 6"
                  opacity="0.6"
                />
              )}

              {/* ======================================================= */}
              {/* 1. TRIANGLE 1: △ABC (Left Side - Cyan Theme)            */}
              {/* ======================================================= */}
              <g className="transition-all duration-100">
                {/* Triangle Fill Body */}
                <polygon
                  points={`${vertA.x},${vertA.y} ${vertB.x},${vertB.y} ${vertC.x},${vertC.y}`}
                  fill="#0284c7"
                  fillOpacity="0.25"
                  stroke="#38bdf8"
                  strokeWidth="3"
                  className="transition-colors hover:fill-opacity-35"
                />

                {/* Altitudes AH */}
                {showAltitudes && (
                  <g>
                    <line
                      x1={vertA.x}
                      y1={vertA.y}
                      x2={geoABC.footA.x}
                      y2={geoABC.footA.y}
                      stroke="#f43f5e"
                      strokeWidth="2"
                      strokeDasharray="4 4"
                    />
                    <circle cx={geoABC.footA.x} cy={geoABC.footA.y} r="3" fill="#f43f5e" />
                    <text
                      x={geoABC.footA.x}
                      y={geoABC.footA.y + 14}
                      textAnchor="middle"
                      className="fill-rose-400 font-mono text-xs font-bold"
                    >
                      H
                    </text>
                  </g>
                )}

                {/* Edge Equal Tick Marks for ABC */}
                {showEqualTickMarks && (
                  <>
                    {/* Edge AB (1 tick) */}
                    <circle
                      cx={(vertA.x + vertB.x) / 2}
                      cy={(vertA.y + vertB.y) / 2}
                      r="4"
                      fill="#38bdf8"
                    />
                    {/* Edge BC (2 ticks) */}
                    <g transform={`translate(${(vertB.x + vertC.x) / 2}, ${(vertB.y + vertC.y) / 2})`}>
                      <line x1="-3" y1="-5" x2="-3" y2="5" stroke="#38bdf8" strokeWidth="2" />
                      <line x1="3" y1="-5" x2="3" y2="5" stroke="#38bdf8" strokeWidth="2" />
                    </g>
                    {/* Edge CA (3 ticks) */}
                    <g transform={`translate(${(vertC.x + vertA.x) / 2}, ${(vertC.y + vertA.y) / 2})`}>
                      <line x1="-5" y1="-5" x2="-5" y2="5" stroke="#38bdf8" strokeWidth="2" />
                      <line x1="0" y1="-5" x2="0" y2="5" stroke="#38bdf8" strokeWidth="2" />
                      <line x1="5" y1="-5" x2="5" y2="5" stroke="#38bdf8" strokeWidth="2" />
                    </g>
                  </>
                )}

                {/* Edge Length Labels */}
                {showEdgeLengths && (
                  <>
                    <text
                      x={(vertA.x + vertB.x) / 2 - 16}
                      y={(vertA.y + vertB.y) / 2}
                      textAnchor="end"
                      className="fill-sky-300 font-mono text-xs font-extrabold drop-shadow"
                    >
                      {geoABC.ab} cm
                    </text>
                    <text
                      x={(vertB.x + vertC.x) / 2}
                      y={(vertB.y + vertC.y) / 2 + 18}
                      textAnchor="middle"
                      className="fill-sky-300 font-mono text-xs font-extrabold drop-shadow"
                    >
                      {geoABC.bc} cm
                    </text>
                    <text
                      x={(vertC.x + vertA.x) / 2 + 16}
                      y={(vertC.y + vertA.y) / 2}
                      textAnchor="start"
                      className="fill-sky-300 font-mono text-xs font-extrabold drop-shadow"
                    >
                      {geoABC.ca} cm
                    </text>
                  </>
                )}

                {/* Angle Arcs & Measures */}
                {showAngleMeasures && (
                  <>
                    <text
                      x={vertA.x}
                      y={vertA.y + 28}
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

                {/* Interactive Vertices of Triangle ABC */}
                {/* Vertex A */}
                <g
                  className="cursor-move"
                  onMouseDown={(e) => handleMouseDown('A', e)}
                  onTouchStart={(e) => handleMouseDown('A', e)}
                >
                  <circle cx={vertA.x} cy={vertA.y} r="9" fill="#0284c7" stroke="#ffffff" strokeWidth="2.5" />
                  <circle cx={vertA.x} cy={vertA.y} r="18" fill="#0284c7" fillOpacity="0.2" className="animate-ping" />
                  {showVertexLabels && (
                    <text
                      x={vertA.x}
                      y={vertA.y - 14}
                      textAnchor="middle"
                      className="fill-sky-300 font-sans font-black text-base"
                    >
                      A
                    </text>
                  )}
                </g>

                {/* Vertex B */}
                <g
                  className="cursor-move"
                  onMouseDown={(e) => handleMouseDown('B', e)}
                  onTouchStart={(e) => handleMouseDown('B', e)}
                >
                  <circle cx={vertB.x} cy={vertB.y} r="9" fill="#0284c7" stroke="#ffffff" strokeWidth="2.5" />
                  {showVertexLabels && (
                    <text
                      x={vertB.x - 14}
                      y={vertB.y + 6}
                      textAnchor="end"
                      className="fill-sky-300 font-sans font-black text-base"
                    >
                      B
                    </text>
                  )}
                </g>

                {/* Vertex C */}
                <g
                  className="cursor-move"
                  onMouseDown={(e) => handleMouseDown('C', e)}
                  onTouchStart={(e) => handleMouseDown('C', e)}
                >
                  <circle cx={vertC.x} cy={vertC.y} r="9" fill="#0284c7" stroke="#ffffff" strokeWidth="2.5" />
                  {showVertexLabels && (
                    <text
                      x={vertC.x + 14}
                      y={vertC.y + 6}
                      textAnchor="start"
                      className="fill-sky-300 font-sans font-black text-base"
                    >
                      C
                    </text>
                  )}
                </g>

                {/* Label Title on Left */}
                {!congruenceStatus.isSuperposed && (
                  <text
                    x="270"
                    y="550"
                    textAnchor="middle"
                    className="fill-sky-400 font-bold text-sm bg-slate-900 px-3 py-1 rounded"
                  >
                    Tam giác cố định △ABC
                  </text>
                )}
              </g>

              {/* ======================================================= */}
              {/* 2. TRIANGLE 2: △A'B'C' (Right Side - Amber/Orange Theme)*/}
              {/* ======================================================= */}
              <g
                className="transition-all duration-75"
                filter={matchGlow ? 'url(#glowGold)' : undefined}
              >
                {/* Drag Handle on Triangle Body */}
                <polygon
                  points={`${transformedTri2.A.x},${transformedTri2.A.y} ${transformedTri2.B.x},${transformedTri2.B.y} ${transformedTri2.C.x},${transformedTri2.C.y}`}
                  fill={matchGlow ? '#eab308' : '#f59e0b'}
                  fillOpacity={matchGlow ? 0.45 : opacityB / 100 * 0.35}
                  stroke={matchGlow ? '#fef08a' : '#fbbf24'}
                  strokeWidth={matchGlow ? 4 : 3}
                  className="cursor-grab active:cursor-grabbing"
                  onMouseDown={(e) => handleMouseDown('tri2', e)}
                  onTouchStart={(e) => handleMouseDown('tri2', e)}
                />

                {/* Altitudes A'H' */}
                {showAltitudes && (
                  <g>
                    <line
                      x1={transformedTri2.A.x}
                      y1={transformedTri2.A.y}
                      x2={transformedTri2.footA.x}
                      y2={transformedTri2.footA.y}
                      stroke="#f43f5e"
                      strokeWidth="2"
                      strokeDasharray="4 4"
                    />
                    <circle cx={transformedTri2.footA.x} cy={transformedTri2.footA.y} r="3" fill="#f43f5e" />
                    <text
                      x={transformedTri2.footA.x}
                      y={transformedTri2.footA.y + 14}
                      textAnchor="middle"
                      className="fill-rose-400 font-mono text-xs font-bold"
                    >
                      H'
                    </text>
                  </g>
                )}

                {/* Equal Marks for Triangle A'B'C' */}
                {showEqualTickMarks && (
                  <>
                    <circle
                      cx={(transformedTri2.A.x + transformedTri2.B.x) / 2}
                      cy={(transformedTri2.A.y + transformedTri2.B.y) / 2}
                      r="4"
                      fill="#fbbf24"
                    />
                    <g
                      transform={`translate(${(transformedTri2.B.x + transformedTri2.C.x) / 2}, ${
                        (transformedTri2.B.y + transformedTri2.C.y) / 2
                      })`}
                    >
                      <line x1="-3" y1="-5" x2="-3" y2="5" stroke="#fbbf24" strokeWidth="2" />
                      <line x1="3" y1="-5" x2="3" y2="5" stroke="#fbbf24" strokeWidth="2" />
                    </g>
                    <g
                      transform={`translate(${(transformedTri2.C.x + transformedTri2.A.x) / 2}, ${
                        (transformedTri2.C.y + transformedTri2.A.y) / 2
                      })`}
                    >
                      <line x1="-5" y1="-5" x2="-5" y2="5" stroke="#fbbf24" strokeWidth="2" />
                      <line x1="0" y1="-5" x2="0" y2="5" stroke="#fbbf24" strokeWidth="2" />
                      <line x1="5" y1="-5" x2="5" y2="5" stroke="#fbbf24" strokeWidth="2" />
                    </g>
                  </>
                )}

                {/* Lengths on A'B'C' */}
                {showEdgeLengths && (
                  <>
                    <text
                      x={(transformedTri2.A.x + transformedTri2.B.x) / 2 - 16}
                      y={(transformedTri2.A.y + transformedTri2.B.y) / 2}
                      textAnchor="end"
                      className="fill-amber-300 font-mono text-xs font-extrabold drop-shadow pointer-events-none"
                    >
                      {transformedTri2.ab} cm
                    </text>
                    <text
                      x={(transformedTri2.B.x + transformedTri2.C.x) / 2}
                      y={(transformedTri2.B.y + transformedTri2.C.y) / 2 + 18}
                      textAnchor="middle"
                      className="fill-amber-300 font-mono text-xs font-extrabold drop-shadow pointer-events-none"
                    >
                      {transformedTri2.bc} cm
                    </text>
                    <text
                      x={(transformedTri2.C.x + transformedTri2.A.x) / 2 + 16}
                      y={(transformedTri2.C.y + transformedTri2.A.y) / 2}
                      textAnchor="start"
                      className="fill-amber-300 font-mono text-xs font-extrabold drop-shadow pointer-events-none"
                    >
                      {transformedTri2.ca} cm
                    </text>
                  </>
                )}

                {/* Angle Measures on A'B'C' */}
                {showAngleMeasures && (
                  <>
                    <text
                      x={transformedTri2.A.x}
                      y={transformedTri2.A.y + 28}
                      textAnchor="middle"
                      className="fill-emerald-300 font-mono text-[11px] font-bold pointer-events-none"
                    >
                      {transformedTri2.angleA}°
                    </text>
                    <text
                      x={transformedTri2.B.x + 28}
                      y={transformedTri2.B.y - 10}
                      textAnchor="start"
                      className="fill-emerald-300 font-mono text-[11px] font-bold pointer-events-none"
                    >
                      {transformedTri2.angleB}°
                    </text>
                    <text
                      x={transformedTri2.C.x - 28}
                      y={transformedTri2.C.y - 10}
                      textAnchor="end"
                      className="fill-emerald-300 font-mono text-[11px] font-bold pointer-events-none"
                    >
                      {transformedTri2.angleC}°
                    </text>
                  </>
                )}

                {/* Vertices of Triangle A'B'C' */}
                {/* Vertex A' */}
                <g>
                  <circle
                    cx={transformedTri2.A.x}
                    cy={transformedTri2.A.y}
                    r="8"
                    fill="#f59e0b"
                    stroke="#ffffff"
                    strokeWidth="2"
                  />
                  {showVertexLabels && (
                    <text
                      x={transformedTri2.A.x}
                      y={transformedTri2.A.y - 14}
                      textAnchor="middle"
                      className="fill-amber-300 font-sans font-black text-base"
                    >
                      A'
                    </text>
                  )}
                </g>

                {/* Vertex B' */}
                <g>
                  <circle
                    cx={transformedTri2.B.x}
                    cy={transformedTri2.B.y}
                    r="8"
                    fill="#f59e0b"
                    stroke="#ffffff"
                    strokeWidth="2"
                  />
                  {showVertexLabels && (
                    <text
                      x={transformedTri2.B.x - 14}
                      y={transformedTri2.B.y + 6}
                      textAnchor="end"
                      className="fill-amber-300 font-sans font-black text-base"
                    >
                      B'
                    </text>
                  )}
                </g>

                {/* Vertex C' */}
                <g>
                  <circle
                    cx={transformedTri2.C.x}
                    cy={transformedTri2.C.y}
                    r="8"
                    fill="#f59e0b"
                    stroke="#ffffff"
                    strokeWidth="2"
                  />
                  {showVertexLabels && (
                    <text
                      x={transformedTri2.C.x + 14}
                      y={transformedTri2.C.y + 6}
                      textAnchor="start"
                      className="fill-amber-300 font-sans font-black text-base"
                    >
                      C'
                    </text>
                  )}
                </g>

                {/* Interactive Rotation & Centroid Handle */}
                <g
                  className="cursor-grab active:cursor-grabbing"
                  onMouseDown={(e) => handleMouseDown('rotHandle', e)}
                  onTouchStart={(e) => handleMouseDown('rotHandle', e)}
                >
                  <circle
                    cx={transformedTri2.centroid.x}
                    cy={transformedTri2.centroid.y}
                    r="12"
                    fill="#1e293b"
                    stroke="#fbbf24"
                    strokeWidth="2"
                  />
                  <text
                    x={transformedTri2.centroid.x}
                    y={transformedTri2.centroid.y + 4}
                    textAnchor="middle"
                    className="fill-amber-300 font-bold text-xs pointer-events-none"
                  >
                    ↻
                  </text>
                </g>

                {/* Label Title on Right */}
                {!congruenceStatus.isSuperposed && (
                  <text
                    x="730"
                    y="550"
                    textAnchor="middle"
                    className="fill-amber-400 font-bold text-sm bg-slate-900 px-3 py-1 rounded"
                  >
                    Tam giác biến đổi △A'B'C'
                  </text>
                )}
              </g>

              {/* Match Congruence Celebration Banner Inside SVG */}
              {congruenceStatus.isSuperposed && congruenceStatus.isMathematicallyCongruent && (
                <g transform="translate(500, 80)">
                  <rect
                    x="-200"
                    y="-30"
                    width="400"
                    height="60"
                    rx="16"
                    fill="#0f172a"
                    stroke="#22c55e"
                    strokeWidth="3"
                    className="shadow-2xl"
                  />
                  <text
                    x="0"
                    y="-4"
                    textAnchor="middle"
                    className="fill-emerald-400 font-extrabold text-base"
                  >
                    ✓ HAI TAM GIÁC HOÀN TOÀN CHỒNG KHÍT
                  </text>
                  <text
                    x="0"
                    y="18"
                    textAnchor="middle"
                    className="fill-amber-300 font-mono font-bold text-sm"
                  >
                    △ABC = △A'B'C' (A↔A', B↔B', C↔C')
                  </text>
                </g>
              )}
            </svg>
          </div>

          {/* Bottom Bar: Matching Score & Quick Drag Helper */}
          <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-2 px-3 py-2 bg-slate-950/80 rounded-xl border border-slate-800 text-xs mt-2 backdrop-blur">
            <div className="flex items-center gap-3">
              <span className="text-slate-400">Mức độ trùng khớp:</span>
              <div className="w-32 bg-slate-800 h-2.5 rounded-full overflow-hidden border border-slate-700">
                <div
                  className={`h-full transition-all duration-300 ${
                    congruenceStatus.matchPercentage >= 90
                      ? 'bg-emerald-500'
                      : congruenceStatus.matchPercentage >= 50
                      ? 'bg-amber-500'
                      : 'bg-sky-500'
                  }`}
                  style={{ width: `${congruenceStatus.matchPercentage}%` }}
                />
              </div>
              <span
                className={`font-mono font-bold ${
                  congruenceStatus.matchPercentage >= 90
                    ? 'text-emerald-400'
                    : congruenceStatus.matchPercentage >= 50
                    ? 'text-amber-400'
                    : 'text-sky-400'
                }`}
              >
                {congruenceStatus.matchPercentage}%
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-[11px]">Độ trong suốt △A'B'C':</span>
              <input
                type="range"
                min="20"
                max="100"
                value={opacityB}
                onChange={(e) => setOpacityB(Number(e.target.value))}
                className="w-24 accent-amber-500 h-1.5 bg-slate-800 rounded cursor-pointer"
              />
              <span className="font-mono text-amber-300 text-[11px] w-8">{opacityB}%</span>
            </div>
          </div>
        </div>

        {/* Right Column: Pedagogical Dashboard & Control Tabs */}
        <div className="w-full lg:w-[380px] flex flex-col gap-3 overflow-y-auto max-h-[620px] pr-1">
          {/* A. EXPLORE / MEASUREMENT TAB */}
          {engineMode === 'explore' && (
            <>
              {/* Measurements Comparison Table (Edges & Angles) */}
              <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 shadow-md">
                <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-slate-800">
                  <h3 className="font-bold text-xs text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                    <span>📊 Bảng đối chiếu số đo</span>
                  </h3>
                  <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
                    {congruenceStatus.isMathematicallyCongruent ? 'BẰNG NHAU ✓' : 'KHÔNG BẰNG ❌'}
                  </span>
                </div>

                {/* 3 Pairs of Edges */}
                <div className="space-y-1.5 text-xs">
                  <div className="text-[11px] font-bold text-slate-400 uppercase">1. Ba cặp cạnh:</div>
                  <div className="grid grid-cols-3 gap-1 text-center font-mono bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <div className="text-sky-300">AB = {geoABC.ab}</div>
                    <div className="text-amber-400">↔ A'B' = {transformedTri2.ab}</div>
                    <div className={Math.abs(geoABC.ab - transformedTri2.ab) < 0.1 ? 'text-emerald-400 font-bold' : 'text-rose-400'}>
                      {Math.abs(geoABC.ab - transformedTri2.ab) < 0.1 ? 'AB = A\'B\'' : '≠'}
                    </div>

                    <div className="text-sky-300">BC = {geoABC.bc}</div>
                    <div className="text-amber-400">↔ B'C' = {transformedTri2.bc}</div>
                    <div className={Math.abs(geoABC.bc - transformedTri2.bc) < 0.1 ? 'text-emerald-400 font-bold' : 'text-rose-400'}>
                      {Math.abs(geoABC.bc - transformedTri2.bc) < 0.1 ? 'BC = B\'C\'' : '≠'}
                    </div>

                    <div className="text-sky-300">CA = {geoABC.ca}</div>
                    <div className="text-amber-400">↔ C'A' = {transformedTri2.ca}</div>
                    <div className={Math.abs(geoABC.ca - transformedTri2.ca) < 0.1 ? 'text-emerald-400 font-bold' : 'text-rose-400'}>
                      {Math.abs(geoABC.ca - transformedTri2.ca) < 0.1 ? 'CA = C\'A\'' : '≠'}
                    </div>
                  </div>

                  {/* 3 Pairs of Angles */}
                  <div className="text-[11px] font-bold text-slate-400 uppercase pt-2">2. Ba cặp góc:</div>
                  <div className="grid grid-cols-3 gap-1 text-center font-mono bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <div className="text-sky-300">∠A = {geoABC.angleA}°</div>
                    <div className="text-emerald-400">↔ ∠A' = {transformedTri2.angleA}°</div>
                    <div className={Math.abs(geoABC.angleA - transformedTri2.angleA) <= 1 ? 'text-emerald-400 font-bold' : 'text-rose-400'}>
                      {Math.abs(geoABC.angleA - transformedTri2.angleA) <= 1 ? '∠A = ∠A\'' : '≠'}
                    </div>

                    <div className="text-sky-300">∠B = {geoABC.angleB}°</div>
                    <div className="text-emerald-400">↔ ∠B' = {transformedTri2.angleB}°</div>
                    <div className={Math.abs(geoABC.angleB - transformedTri2.angleB) <= 1 ? 'text-emerald-400 font-bold' : 'text-rose-400'}>
                      {Math.abs(geoABC.angleB - transformedTri2.angleB) <= 1 ? '∠B = ∠B\'' : '≠'}
                    </div>

                    <div className="text-sky-300">∠C = {geoABC.angleC}°</div>
                    <div className="text-emerald-400">↔ ∠C' = {transformedTri2.angleC}°</div>
                    <div className={Math.abs(geoABC.angleC - transformedTri2.angleC) <= 1 ? 'text-emerald-400 font-bold' : 'text-rose-400'}>
                      {Math.abs(geoABC.angleC - transformedTri2.angleC) <= 1 ? '∠C = ∠C\'' : '≠'}
                    </div>
                  </div>

                  {/* Area Comparison */}
                  <div className="flex justify-between items-center bg-slate-950 p-2 rounded-lg border border-slate-800 font-mono text-xs mt-2">
                    <span className="text-slate-400">Diện tích S:</span>
                    <span className="text-sky-300">S(ABC) = {geoABC.area} cm²</span>
                    <span className="text-amber-300">S(A'B'C') = {geoABC.area} cm²</span>
                  </div>
                </div>
              </div>

              {/* Rigid Transformations Control Box */}
              <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 shadow-md space-y-3">
                <h3 className="font-bold text-xs text-amber-400 uppercase tracking-wider flex items-center justify-between">
                  <span>🕹️ Biến đổi hình học △A'B'C'</span>
                  <span className="text-[10px] text-slate-400 normal-case font-normal">(Phép dời hình)</span>
                </h3>

                {/* Rotation Slider */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300 font-medium">Góc xoay (θ):</span>
                    <span className="font-mono font-bold text-amber-300">{rotationDeg}°</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    value={rotationDeg}
                    onChange={(e) => setRotationDeg(Number(e.target.value))}
                    className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <button onClick={() => setRotationDeg(0)} className="hover:text-amber-400">0°</button>
                    <button onClick={() => setRotationDeg(90)} className="hover:text-amber-400">90°</button>
                    <button onClick={() => setRotationDeg(180)} className="hover:text-amber-400">180°</button>
                    <button onClick={() => setRotationDeg(270)} className="hover:text-amber-400">270°</button>
                    <button onClick={() => setRotationDeg(360)} className="hover:text-amber-400">360°</button>
                  </div>
                </div>

                {/* Translation X & Y */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="space-y-1">
                    <span className="text-slate-400 text-[11px]">Tịnh tiến ngang (X):</span>
                    <input
                      type="range"
                      min="-400"
                      max="600"
                      value={transX}
                      onChange={(e) => setTransX(Number(e.target.value))}
                      className="w-full accent-sky-500 h-1.5 bg-slate-800 rounded cursor-pointer"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-400 text-[11px]">Tịnh tiến dọc (Y):</span>
                    <input
                      type="range"
                      min="-300"
                      max="300"
                      value={transY}
                      onChange={(e) => setTransY(Number(e.target.value))}
                      className="w-full accent-sky-500 h-1.5 bg-slate-800 rounded cursor-pointer"
                    />
                  </div>
                </div>

                {/* Flip Button */}
                <button
                  onClick={() => setIsFlipped(!isFlipped)}
                  className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 border ${
                    isFlipped
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  <FlipHorizontal className="w-4 h-4" />
                  <span>{isFlipped ? 'Đang bật phép đối xứng trục Y ✓' : 'Bật phép đối xứng trục Y'}</span>
                </button>
              </div>

              {/* Corresponding Vertices Notation Card */}
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-xs space-y-1.5">
                <div className="font-bold text-sky-300">💡 Quy tắc ghi ký hiệu tam giác bằng nhau:</div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Khi viết <span className="text-white font-bold font-mono">△ABC = △A'B'C'</span>, các chữ cái chỉ tên các đỉnh phải được viết theo <strong>thứ tự các đỉnh tương ứng</strong>:
                </p>
                <div className="flex justify-around bg-slate-950 p-2 rounded-lg font-mono font-bold text-amber-300">
                  <span>A ↔ A'</span>
                  <span>B ↔ B'</span>
                  <span>C ↔ C'</span>
                </div>
              </div>
            </>
          )}

          {/* B. GUIDED MODE TAB */}
          {engineMode === 'guide' && (
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-md flex-1 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-wide">
                    🧭 Lộ trình khám phá sư phạm
                  </span>
                  <span className="text-xs font-mono font-extrabold text-amber-400 bg-amber-950 px-2 py-0.5 rounded border border-amber-800">
                    Bước {guideStep} / 7
                  </span>
                </div>

                {/* Step Content */}
                {guideStep === 1 && (
                  <div className="space-y-2">
                    <h4 className="font-bold text-sm text-white">Bước 1: Quan sát hai tam giác ban đầu</h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Quan sát tam giác <span className="text-sky-400 font-bold">△ABC</span> ở bên trái và{' '}
                      <span className="text-amber-400 font-bold">△A'B'C'</span> ở bên phải. Chúng đang nằm ở hai vị trí khác nhau trong mặt phẳng.
                    </p>
                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs text-slate-400">
                      👉 <strong>Câu hỏi:</strong> Liệu hai tam giác ở hai vị trí khác nhau có thể bằng nhau không?
                    </div>
                  </div>
                )}

                {guideStep === 2 && (
                  <div className="space-y-2">
                    <h4 className="font-bold text-sm text-white">Bước 2: Đo các cạnh tương ứng</h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Nhìn vào các số đo độ dài:
                    </p>
                    <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 font-mono text-xs space-y-1 text-sky-300">
                      <div>AB = {geoABC.ab} cm ↔ A'B' = {transformedTri2.ab} cm</div>
                      <div>BC = {geoABC.bc} cm ↔ B'C' = {transformedTri2.bc} cm</div>
                      <div>CA = {geoABC.ca} cm ↔ C'A' = {transformedTri2.ca} cm</div>
                    </div>
                    <p className="text-xs text-emerald-400 font-bold">✓ Ba cặp cạnh tương ứng đều bằng nhau!</p>
                  </div>
                )}

                {guideStep === 3 && (
                  <div className="space-y-2">
                    <h4 className="font-bold text-sm text-white">Bước 3: Đo các góc tương ứng</h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Kiểm tra số đo 3 góc của hai tam giác:
                    </p>
                    <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 font-mono text-xs space-y-1 text-amber-300">
                      <div>∠A = {geoABC.angleA}° ↔ ∠A' = {transformedTri2.angleA}°</div>
                      <div>∠B = {geoABC.angleB}° ↔ ∠B' = {transformedTri2.angleB}°</div>
                      <div>∠C = {geoABC.angleC}° ↔ ∠C' = {transformedTri2.angleC}°</div>
                    </div>
                    <p className="text-xs text-emerald-400 font-bold">✓ Ba cặp góc tương ứng đều bằng nhau!</p>
                  </div>
                )}

                {guideStep === 4 && (
                  <div className="space-y-2">
                    <h4 className="font-bold text-sm text-white">Bước 4: Thử xoay tam giác thứ hai</h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Kéo thanh trượt góc xoay hoặc dùng con lăn chuột để xoay tam giác △A'B'C'.
                    </p>
                    <button
                      onClick={() => setRotationDeg((r) => (r + 45) % 360)}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs"
                    >
                      ↻ Xoay thử △A'B'C' +45°
                    </button>
                    <p className="text-[11px] text-slate-400">
                      💡 Nhận xét: Dù xoay đi hướng nào, độ dài các cạnh và các góc vẫn được giữ nguyên!
                    </p>
                  </div>
                )}

                {guideStep === 5 && (
                  <div className="space-y-2">
                    <h4 className="font-bold text-sm text-white">Bước 5: Thử tịnh tiến (di chuyển)</h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Dùng chuột kéo thân tam giác △A'B'C' dịch chuyển lại gần △ABC.
                    </p>
                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs text-slate-300">
                      Phép tịnh tiến bảo toàn khoảng cách và hình dạng của tam giác.
                    </div>
                  </div>
                )}

                {guideStep === 6 && (
                  <div className="space-y-2">
                    <h4 className="font-bold text-sm text-white">Bước 6: Thực hiện Chồng khít</h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Bấm nút <strong className="text-sky-400">"🎯 Chồng khít"</strong> bên dưới để xem hai tam giác từ từ di chuyển và khớp hoàn toàn vào nhau:
                    </p>
                    <button
                      onClick={handleSuperpose}
                      className="w-full py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-extrabold rounded-lg text-xs shadow-lg shadow-indigo-500/25 active:scale-95"
                    >
                      🎯 Thực hiện Chồng khít ngay
                    </button>
                  </div>
                )}

                {guideStep === 7 && (
                  <div className="space-y-2">
                    <h4 className="font-bold text-sm text-emerald-400">Bước 7: Rút ra kết luận & Định lý</h4>
                    <div className="bg-slate-950 p-3 rounded-lg border border-emerald-800 text-xs space-y-2">
                      <p className="text-white font-bold">
                        🌟 Hai tam giác bằng nhau là hai tam giác có thể chồng khít hoàn toàn lên nhau.
                      </p>
                      <p className="text-slate-300">
                        Ta có 3 trường hợp bằng nhau cơ bản:
                      </p>
                      <ul className="list-disc list-inside text-amber-300 space-y-0.5">
                        <li><strong>C-C-C</strong>: Ba cạnh bằng nhau.</li>
                        <li><strong>C-G-C</strong>: Hai cạnh và góc xen giữa bằng nhau.</li>
                        <li><strong>G-C-G</strong>: Hai góc và cạnh xen giữa bằng nhau.</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation buttons for Guide */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <button
                  onClick={() => setGuideStep((s) => Math.max(1, s - 1))}
                  disabled={guideStep === 1}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 disabled:opacity-40"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Quay lại</span>
                </button>

                <button
                  onClick={() => setGuideStep((s) => Math.min(7, s + 1))}
                  disabled={guideStep === 7}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs text-white font-bold disabled:opacity-40"
                >
                  <span>Tiếp theo</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* C. CHALLENGE MODE TAB */}
          {engineMode === 'challenge' && (
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-md flex-1 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wide flex items-center gap-1.5">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <span>Nhiệm vụ kiểm tra kiến thức</span>
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-400">
                    Câu {challengeIdx + 1} / {CHALLENGES.length}
                  </span>
                </div>

                <div className="space-y-3">
                  <h4 className="font-bold text-sm text-white">{CHALLENGES[challengeIdx].title}</h4>
                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    {CHALLENGES[challengeIdx].question}
                  </p>

                  {/* Options */}
                  <div className="space-y-1.5">
                    {CHALLENGES[challengeIdx].options.map((opt, oIdx) => {
                      const isSelected = challengeAnswers[challengeIdx] === oIdx;
                      const isCorrect = oIdx === CHALLENGES[challengeIdx].correct;
                      const hasAnswered = challengeAnswers[challengeIdx] !== undefined;

                      return (
                        <button
                          key={oIdx}
                          onClick={() => {
                            setChallengeAnswers((prev) => ({ ...prev, [challengeIdx]: oIdx }));
                            if (oIdx === CHALLENGES[challengeIdx].correct) {
                              setChallengeFeedback('✓ Chính xác! ' + CHALLENGES[challengeIdx].explanation);
                            } else {
                              setChallengeFeedback('❌ Chưa chính xác. Hãy thử suy nghĩ lại.');
                            }
                          }}
                          className={`w-full text-left p-2.5 rounded-lg text-xs font-medium transition-all flex items-start gap-2 border ${
                            hasAnswered
                              ? isCorrect
                                ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200'
                                : isSelected
                                ? 'bg-rose-950/80 border-rose-500 text-rose-200'
                                : 'bg-slate-950 border-slate-800 text-slate-400'
                              : 'bg-slate-950 border-slate-800 text-slate-200 hover:bg-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-mono shrink-0">
                            {String.fromCharCode(65 + oIdx)}
                          </span>
                          <span className="leading-snug">{opt}</span>
                        </button>
                      );
                    })}
                  </div>

                  {challengeFeedback && (
                    <div
                      className={`p-2.5 rounded-lg text-xs leading-relaxed border ${
                        challengeAnswers[challengeIdx] === CHALLENGES[challengeIdx].correct
                          ? 'bg-emerald-950/60 border-emerald-700 text-emerald-300'
                          : 'bg-rose-950/60 border-rose-700 text-rose-300'
                      }`}
                    >
                      {challengeFeedback}
                    </div>
                  )}
                </div>
              </div>

              {/* Challenge Navigation */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <button
                  onClick={() => {
                    setChallengeIdx((i) => Math.max(0, i - 1));
                    setChallengeFeedback(null);
                  }}
                  disabled={challengeIdx === 0}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 disabled:opacity-40"
                >
                  Câu trước
                </button>

                <button
                  onClick={() => {
                    setChallengeIdx((i) => Math.min(CHALLENGES.length - 1, i + 1));
                    setChallengeFeedback(null);
                  }}
                  disabled={challengeIdx === CHALLENGES.length - 1}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-xs text-slate-950 font-bold disabled:opacity-40"
                >
                  Câu tiếp theo
                </button>
              </div>
            </div>
          )}

          {/* D. PRESENTATION MODE TAB */}
          {engineMode === 'presentation' && (
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-md flex-1 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide flex items-center gap-1.5">
                    <Play className="w-4 h-4 text-emerald-400" />
                    <span>Trình chiếu bài giảng giáo viên</span>
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-400">
                    Slide {presentationSlide} / 8
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  {presentationSlide === 1 && (
                    <div className="space-y-2">
                      <h4 className="font-bold text-sm text-white">1. Hai tam giác ở các vị trí khác nhau</h4>
                      <p className="text-slate-300 leading-relaxed">
                        Đặt vấn đề: Hai tam giác △ABC và △A'B'C' có thể có vị trí và hướng khác nhau nhưng liệu chúng có thể bằng nhau không?
                      </p>
                    </div>
                  )}

                  {presentationSlide === 2 && (
                    <div className="space-y-2">
                      <h4 className="font-bold text-sm text-white">2. Đo và so sánh 3 cặp cạnh</h4>
                      <p className="text-slate-300 leading-relaxed">
                        Chỉ ra trên màn hình: <strong className="text-sky-300">AB = A'B'</strong>,{' '}
                        <strong className="text-sky-300">BC = B'C'</strong>,{' '}
                        <strong className="text-sky-300">CA = C'A'</strong>.
                      </p>
                    </div>
                  )}

                  {presentationSlide === 3 && (
                    <div className="space-y-2">
                      <h4 className="font-bold text-sm text-white">3. Đo và so sánh 3 cặp góc</h4>
                      <p className="text-slate-300 leading-relaxed">
                        Chỉ ra: <strong className="text-amber-300">∠A = ∠A'</strong>,{' '}
                        <strong className="text-amber-300">∠B = ∠B'</strong>,{' '}
                        <strong className="text-amber-300">∠C = ∠C'</strong>.
                      </p>
                    </div>
                  )}

                  {presentationSlide === 4 && (
                    <div className="space-y-2">
                      <h4 className="font-bold text-sm text-white">4. Thao tác Xoay (Quay quanh tâm)</h4>
                      <p className="text-slate-300 leading-relaxed">
                        Thực hiện xoay △A'B'C'. Giáo viên giải thích: "Hướng khác nhau không làm thay đổi tính bằng nhau của hai tam giác".
                      </p>
                    </div>
                  )}

                  {presentationSlide === 5 && (
                    <div className="space-y-2">
                      <h4 className="font-bold text-sm text-white">5. Thao tác Tịnh tiến</h4>
                      <p className="text-slate-300 leading-relaxed">
                        Di chuyển tam giác △A'B'C' trong mặt phẳng lại gần △ABC mà không làm biến dạng cạnh hay góc.
                      </p>
                    </div>
                  )}

                  {presentationSlide === 6 && (
                    <div className="space-y-2">
                      <h4 className="font-bold text-sm text-white">6. Thực hiện Chồng khít hoàn toàn</h4>
                      <p className="text-slate-300 leading-relaxed">
                        Bấm nút Chồng khít để cả lớp quan sát hai tam giác trùng khít tuyệt đối vào nhau.
                      </p>
                      <button
                        onClick={handleSuperpose}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs"
                      >
                        🎯 Trình chiếu Chồng khít
                      </button>
                    </div>
                  )}

                  {presentationSlide === 7 && (
                    <div className="space-y-2">
                      <h4 className="font-bold text-sm text-white">7. Xác định các cặp đỉnh tương ứng</h4>
                      <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 font-mono text-center text-amber-300">
                        A ↔ A', B ↔ B', C ↔ C'
                      </div>
                      <p className="text-slate-300 text-[11px]">
                        Lưu ý học sinh quy tắc viết thứ tự đỉnh khi ghi ký hiệu △ABC = △A'B'C'.
                      </p>
                    </div>
                  )}

                  {presentationSlide === 8 && (
                    <div className="space-y-2">
                      <h4 className="font-bold text-sm text-emerald-400">8. Tổng kết 3 trường hợp bằng nhau</h4>
                      <div className="bg-slate-950 p-2.5 rounded-lg border border-emerald-800 space-y-1 text-slate-200">
                        <div>1. <strong>C-C-C</strong>: Ba cạnh bằng nhau</div>
                        <div>2. <strong>C-G-C</strong>: Hai cạnh và góc xen giữa</div>
                        <div>3. <strong>G-C-G</strong>: Hai góc và cạnh xen giữa</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Slide Navigation */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <button
                  onClick={() => setPresentationSlide((s) => Math.max(1, s - 1))}
                  disabled={presentationSlide === 1}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 disabled:opacity-40"
                >
                  Slide trước
                </button>

                <button
                  onClick={() => setPresentationSlide((s) => Math.min(8, s + 1))}
                  disabled={presentationSlide === 8}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-xs text-slate-950 font-bold disabled:opacity-40"
                >
                  Slide sau
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. DEFINITION MODAL DIALOG */}
      {showDefinitionModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-400" />
                <span>Định nghĩa & Ký hiệu Hai tam giác bằng nhau</span>
              </h3>
              <button
                onClick={() => setShowDefinitionModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-slate-300">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5">
                <div className="text-amber-300 font-bold text-sm">1. Định nghĩa:</div>
                <p>
                  Hai tam giác bằng nhau là hai tam giác có <strong>các cạnh tương ứng bằng nhau</strong> và{' '}
                  <strong>các góc tương ứng bằng nhau</strong>.
                </p>
                <p className="text-slate-400 text-[11px]">
                  Hai tam giác bằng nhau khi và chỉ khi có thể dùng các phép dời hình (tịnh tiến, quay, đối xứng) để chồng khít hoàn toàn lên nhau.
                </p>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5">
                <div className="text-sky-300 font-bold text-sm">2. Ký hiệu và quy ước đỉnh tương ứng:</div>
                <div className="font-mono text-center text-sm font-bold text-emerald-400 bg-slate-900 py-1.5 rounded">
                  △ABC = △A'B'C'
                </div>
                <p className="text-slate-400 text-[11px]">
                  Thứ tự các đỉnh phải tương ứng: Đỉnh thứ nhất A tương ứng với A', đỉnh thứ hai B tương ứng với B', đỉnh thứ ba C tương ứng với C'.
                </p>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                <div className="text-indigo-300 font-bold text-sm">3. Ba trường hợp bằng nhau cơ bản:</div>
                <ul className="list-disc list-inside space-y-0.5 text-slate-300">
                  <li><strong>C-C-C</strong>: Ba cạnh tương ứng bằng nhau.</li>
                  <li><strong>C-G-C</strong>: Hai cạnh và góc xen giữa tương ứng bằng nhau.</li>
                  <li><strong>G-C-G</strong>: Một cạnh và hai góc kề tương ứng bằng nhau.</li>
                </ul>
              </div>
            </div>

            <button
              onClick={() => setShowDefinitionModal(false)}
              className="w-full py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-xl text-xs transition-colors"
            >
              Đã hiểu & Đóng lại
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
