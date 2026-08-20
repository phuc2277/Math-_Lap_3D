import React, { useState, useRef, useEffect } from 'react';
import { ModelParams, DisplayOptions } from '../../../types/geometry';
import {
  Ruler,
  HelpCircle,
  Sparkles,
  Maximize2,
  Minimize2,
  RotateCcw,
  Eye,
  EyeOff,
  Sliders,
  Table,
  Check,
  ChevronRight,
  ChevronLeft,
  GraduationCap,
  Play,
  Pause,
  Layers,
  ArrowRight,
  BookOpen,
  Trophy,
  CheckCircle2,
  XCircle,
  Lightbulb,
  Move,
  FastForward,
  Mouse,
} from 'lucide-react';

interface PythagoreanTheoremEngineProps {
  params: ModelParams;
  displayOptions?: DisplayOptions;
  onParamChange?: (key: keyof ModelParams, value: number) => void;
}

export type MainTab = 'explore' | 'dissection' | 'four_triangles' | 'guided' | 'challenges' | 'presentation';

export const PythagoreanTheoremEngine: React.FC<PythagoreanTheoremEngineProps> = ({
  params,
  displayOptions,
  onParamChange,
}) => {
  // 1. Triangle Parameters (Right triangle at C, a = BC, b = AC)
  const [a, setA] = useState<number>(params.a ?? 3);
  const [b, setB] = useState<number>(params.b ?? 4);

  // Hypotenuse c = sqrt(a^2 + b^2)
  const c = Math.sqrt(a * a + b * b);
  const a2 = a * a;
  const b2 = b * b;
  const c2 = c * c;

  // 2. Navigation & View Modes
  const [activeTab, setActiveTab] = useState<MainTab>('explore');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [selectedElement, setSelectedElement] = useState<'a' | 'b' | 'c' | 'sqA' | 'sqB' | 'sqC' | null>(null);
  const [wheelToast, setWheelToast] = useState<{ message: string; key: string } | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 3. Display Toggles
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [showMeasurements, setShowMeasurements] = useState<boolean>(true);
  const [showAngle, setShowAngle] = useState<boolean>(true);
  const [showFormulaLaw, setShowFormulaLaw] = useState<boolean>(false);
  const [showComparison, setShowComparison] = useState<boolean>(false);
  const [showTheoremModal, setShowTheoremModal] = useState<boolean>(false);

  // 4. Dissection & Animation State (Ghép / Tách diện tích)
  const [dissectionProgress, setDissectionProgress] = useState<number>(0); // 0 = detached / origin, 1 = merged onto c²
  const [isAnimatingDissection, setIsAnimatingDissection] = useState<boolean>(false);
  const [animationSpeed, setAnimationSpeed] = useState<number>(1); // 0.5 to 2
  const animFrameRef = useRef<number | null>(null);

  // 5. Four Triangles Rearrangement State
  const [rearrangeMode, setRearrangeMode] = useState<'c_square' | 'ab_squares'>('c_square');
  const [rearrangeProgress, setRearrangeProgress] = useState<number>(0); // 0 = c_square, 1 = ab_squares

  // 6. Guided Discovery Step State (7 steps as required)
  const [guidedStep, setGuidedStep] = useState<number>(1);
  const [guidedSelectedOption, setGuidedSelectedOption] = useState<number | null>(null);
  const [guidedFeedback, setGuidedFeedback] = useState<string | null>(null);
  const [guidedCompleted, setGuidedCompleted] = useState<boolean>(false);

  // 7. Challenges State (4 tasks)
  const [currentChallenge, setCurrentChallenge] = useState<number>(1);
  const [challengeGuess, setChallengeGuess] = useState<string>('');
  const [challengeStatus, setChallengeStatus] = useState<'idle' | 'success' | 'fail'>('idle');
  const [challengeFeedback, setChallengeFeedback] = useState<string>('');

  // 8. Presentation Mode (7 steps)
  const [presentationStep, setPresentationStep] = useState<number>(1);

  // 9. Interactive Dragging on SVG
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [dragTarget, setDragTarget] = useState<'A' | 'B' | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);

  const showToast = (message: string, key: string) => {
    setWheelToast({ message, key });
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => {
      setWheelToast(null);
    }, 1400);
  };

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  const handleParamUpdate = (newA: number, newB: number) => {
    const clampedA = Math.max(1, Math.min(10, Math.round(newA * 10) / 10));
    const clampedB = Math.max(1, Math.min(10, Math.round(newB * 10) / 10));
    setA(clampedA);
    setB(clampedB);
    if (onParamChange) {
      onParamChange('a', clampedA);
      onParamChange('b', clampedB);
    }
  };

  // Scroll Wheel Handler for Resizing Shapes and Legs
  const handleWheel = (e: React.WheelEvent, target: 'a' | 'b' | 'both' | 'auto' = 'auto') => {
    e.stopPropagation();
    const isUp = e.deltaY < 0;
    const delta = isUp ? 0.5 : -0.5;

    let targetKey = target;
    if (targetKey === 'auto') {
      if (selectedElement === 'a' || selectedElement === 'sqA') {
        targetKey = 'a';
      } else if (selectedElement === 'b' || selectedElement === 'sqB') {
        targetKey = 'b';
      } else if (selectedElement === 'c' || selectedElement === 'sqC') {
        targetKey = 'both';
      } else {
        // By default adjust a
        targetKey = 'a';
      }
    }

    if (targetKey === 'a') {
      const nextA = Math.max(1, Math.min(10, Math.round((a + delta) * 10) / 10));
      if (nextA !== a) {
        handleParamUpdate(nextA, b);
        showToast(`Cạnh a (BC) = ${nextA} cm (${isUp ? '+0.5' : '-0.5'})`, 'a');
      }
    } else if (targetKey === 'b') {
      const nextB = Math.max(1, Math.min(10, Math.round((b + delta) * 10) / 10));
      if (nextB !== b) {
        handleParamUpdate(a, nextB);
        showToast(`Cạnh b (AC) = ${nextB} cm (${isUp ? '+0.5' : '-0.5'})`, 'b');
      }
    } else if (targetKey === 'both') {
      const nextA = Math.max(1, Math.min(10, Math.round((a + delta) * 10) / 10));
      const nextB = Math.max(1, Math.min(10, Math.round((b + delta) * 10) / 10));
      if (nextA !== a || nextB !== b) {
        handleParamUpdate(nextA, nextB);
        const newC = Math.sqrt(nextA * nextA + nextB * nextB);
        showToast(`Cạnh c (AB) = ${newC.toFixed(2)} cm`, 'c');
      }
    }
  };

  const handleReset = () => {
    handleParamUpdate(3, 4);
    setDissectionProgress(0);
    setIsAnimatingDissection(false);
    setShowFormulaLaw(false);
    setShowComparison(false);
    setSelectedElement(null);
    setGuidedStep(1);
    setGuidedSelectedOption(null);
    setGuidedFeedback(null);
    setGuidedCompleted(false);
    setCurrentChallenge(1);
    setChallengeStatus('idle');
    setPresentationStep(1);
    setRearrangeMode('c_square');
    setRearrangeProgress(0);
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Animation loop for Dissection (Ghép/Tách)
  useEffect(() => {
    if (!isAnimatingDissection) return;

    let target = 1;
    let stepDelta = 0.015 * animationSpeed;

    const animate = () => {
      setDissectionProgress((prev) => {
        const next = prev + stepDelta;
        if (next >= 1) {
          setIsAnimatingDissection(false);
          return 1;
        }
        return next;
      });
      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isAnimatingDissection, animationSpeed]);

  // Handle Dragging
  const handleMouseDown = (target: 'A' | 'B') => {
    setDragTarget(target);
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement> | React.TouchEvent<SVGSVGElement>) => {
    if (!dragTarget || !svgRef.current) return;

    const rect = svgRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const mouseX = clientX - rect.left;
    const mouseY = clientY - rect.top;

    // Convert SVG viewbox pixels to math units
    const svgW = isFullscreen ? 800 : 540;
    const svgH = isFullscreen ? 600 : 420;
    const scale = (svgW / rect.width);
    const originX = isFullscreen ? 320 : 220;
    const originY = isFullscreen ? 340 : 250;
    const unitScale = isFullscreen ? 26 : 20;

    const relX = (mouseX * scale - originX) / unitScale;
    const relY = (originY - mouseY * scale) / unitScale;

    if (dragTarget === 'B') {
      // Modifies a (horizontal)
      const newA = Math.max(1, Math.min(10, relX));
      handleParamUpdate(newA, b);
    } else if (dragTarget === 'A') {
      // Modifies b (vertical)
      const newB = Math.max(1, Math.min(10, relY));
      handleParamUpdate(a, newB);
    }
  };

  const handleMouseUp = () => {
    setDragTarget(null);
  };

  // Pythagorean Triples Library
  const pythagoreanPresets = [
    { label: '3 - 4 - 5', aVal: 3, bVal: 4 },
    { label: '6 - 8 - 10', aVal: 6, bVal: 8 },
    { label: '5 - 12 - 13 (scale 5-6.5)', aVal: 5, bVal: 6.5 },
    { label: 'Tam giác vuông cân 4 - 4', aVal: 4, bVal: 4 },
    { label: '8 - 6 - 10', aVal: 8, bVal: 6 },
  ];

  // Guided Questions Definition (7 Steps)
  const guidedQuestions = [
    {
      step: 1,
      title: 'Bước 1: Nhận diện đặc điểm tam giác ABC',
      question: 'Quan sát tam giác ABC với góc C được ký hiệu vuông. Tam giác ABC thuộc loại tam giác gì?',
      options: ['Tam giác đều', 'Tam giác vuông tại C (∠C = 90°)', 'Tam giác nhọn', 'Tam giác tù'],
      correct: 1,
      explanation: 'Chính xác! Tam giác ABC có ∠C = 90° nên là tam giác vuông tại C.',
    },
    {
      step: 2,
      title: 'Bước 2: Xác định cạnh huyền',
      question: 'Trong tam giác vuông ABC, cạnh nào đối diện với góc vuông C (cạnh dài nhất)?',
      options: ['Cạnh a (BC)', 'Cạnh b (AC)', 'Cạnh c (AB) - Cạnh huyền'],
      correct: 2,
      explanation: 'Chính xác! Cạnh AB (độ dài c) đối diện góc vuông 90° được gọi là CẠNH HUYỀN.',
    },
    {
      step: 3,
      title: 'Bước 3: Diện tích hình vuông trên cạnh góc vuông a',
      question: `Với cạnh a = ${a} cm, diện tích hình vuông S₁ dựng trên cạnh a bằng bao nhiêu?`,
      options: [`${(a * 2).toFixed(1)} cm²`, `${a2.toFixed(1)} cm² (a²)`, `${(a2 + 2).toFixed(1)} cm²`],
      correct: 1,
      explanation: `Chính xác! Diện tích hình vuông cạnh a là S₁ = a² = ${a}² = ${a2.toFixed(1)} cm².`,
    },
    {
      step: 4,
      title: 'Bước 4: Diện tích hình vuông trên cạnh góc vuông b',
      question: `Với cạnh b = ${b} cm, diện tích hình vuông S₂ dựng trên cạnh b bằng bao nhiêu?`,
      options: [`${b2.toFixed(1)} cm² (b²)`, `${(b * 4).toFixed(1)} cm²`, `${(b * b2).toFixed(1)} cm²`],
      correct: 0,
      explanation: `Chính xác! Diện tích hình vuông cạnh b là S₂ = b² = ${b}² = ${b2.toFixed(1)} cm².`,
    },
    {
      step: 5,
      title: 'Bước 5: Diện tích hình vuông trên cạnh huyền c',
      question: `Với cạnh huyền c = ${c.toFixed(2)} cm, diện tích hình vuông S₃ dựng trên cạnh huyền c bằng bao nhiêu?`,
      options: [`${(c * 2).toFixed(1)} cm²`, `${c2.toFixed(1)} cm² (c²)`, `${(c * 4).toFixed(1)} cm²`],
      correct: 1,
      explanation: `Chính xác! Diện tích hình vuông cạnh huyền c là S₃ = c² = (${c.toFixed(2)})² = ${c2.toFixed(1)} cm².`,
    },
    {
      step: 6,
      title: 'Bước 6: So sánh tổng diện tích 2 hình vuông nhỏ với hình vuông lớn',
      question: `Hãy so sánh (S₁ + S₂ = a² + b² = ${a2.toFixed(1)} + ${b2.toFixed(1)} = ${(a2 + b2).toFixed(1)}) với (S₃ = c² = ${c2.toFixed(1)}):`,
      options: ['a² + b² > c²', 'a² + b² < c²', 'a² + b² = c² (Tổng diện tích hai hình vuông nhỏ bằng diện tích hình vuông lớn)'],
      correct: 2,
      explanation: `Chính xác! Ta thấy rõ ràng ${(a2 + b2).toFixed(1)} = ${c2.toFixed(1)}, tức là a² + b² = c²!`,
    },
    {
      step: 7,
      title: 'Bước 7: Hình thành quy luật tổng quát',
      question: 'Khi thay đổi độ dài các cạnh a và b, đẳng thức a² + b² = c² có luôn luôn đúng với mọi tam giác vuông không?',
      options: ['Chỉ đúng với tam giác 3-4-5', 'Luôn luôn đúng với mọi tam giác vuông (Định lý Pythagore)', 'Không có quy luật'],
      correct: 1,
      explanation: 'Xuất sắc! Đây chính là ĐỊNH LÝ PYTHAGORE vĩ đại: Trong một tam giác vuông, bình phương cạnh huyền bằng tổng bình phương hai cạnh góc vuông!',
    },
  ];

  // Challenge Verifier
  const handleCheckChallenge = () => {
    const val = parseFloat(challengeGuess);
    if (currentChallenge === 1) {
      // Task 1: a=3, b=4 predict c -> 5
      if (Math.abs(val - 5) < 0.1) {
        setChallengeStatus('success');
        setChallengeFeedback('Chính xác! √(3² + 4²) = √(9 + 16) = √25 = 5 cm.');
      } else {
        setChallengeStatus('fail');
        setChallengeFeedback('Chưa đúng. Gợi ý: c = √(a² + b²) = √(9 + 16). Hãy tính lại nhé!');
      }
    } else if (currentChallenge === 2) {
      // Task 2: Change a and b to make c = 5 (e.g. 3,4 or 4,3)
      if (Math.abs(c - 5) < 0.05) {
        setChallengeStatus('success');
        setChallengeFeedback(`Tuyệt vời! Bạn đã chọn a = ${a} và b = ${b} để tạo ra cạnh huyền c = 5 cm!`);
      } else {
        setChallengeStatus('fail');
        setChallengeFeedback(`Hiện tại c = ${c.toFixed(2)} cm (chưa bằng 5 cm). Hãy chỉnh các thanh trượt a và b!`);
      }
    } else if (currentChallenge === 3) {
      // Task 3: Find a whole number Pythagorean triple (a and b integers, c integer)
      const isIntegerA = Math.abs(a - Math.round(a)) < 0.01;
      const isIntegerB = Math.abs(b - Math.round(b)) < 0.01;
      const isIntegerC = Math.abs(c - Math.round(c)) < 0.01;
      if (isIntegerA && isIntegerB && isIntegerC) {
        setChallengeStatus('success');
        setChallengeFeedback(`Chúc mừng! Bạn đã tìm thấy bộ ba số nguyên Pythagore: (${a}, ${b}, ${Math.round(c)}) vì ${a}² + ${b}² = ${Math.round(c)}²!`);
      } else {
        setChallengeStatus('fail');
        setChallengeFeedback(`Hiện tại cạnh huyền c = ${c.toFixed(2)} chưa phải số nguyên. Hãy thử các bộ số như (3, 4, 5) hoặc (6, 8, 10)!`);
      }
    } else if (currentChallenge === 4) {
      // Task 4: Adjust model so area of square on hypotenuse is 25 cm²
      if (Math.abs(c2 - 25) < 0.5) {
        setChallengeStatus('success');
        setChallengeFeedback(`Hoàn hảo! Diện tích hình vuông cạnh huyền c² = ${c2.toFixed(1)} cm² ≈ 25 cm²!`);
      } else {
        setChallengeStatus('fail');
        setChallengeFeedback(`Hiện tại c² = ${c2.toFixed(1)} cm². Cần điều chỉnh a và b để c² = 25 cm².`);
      }
    }
  };

  // SVG Geometry Computations
  const svgWidth = isFullscreen ? 820 : 540;
  const svgHeight = isFullscreen ? 580 : 420;
  const unitScale = isFullscreen ? 26 : 20;

  // Origin point for C (90-degree corner)
  const originX = isFullscreen ? 320 : 210;
  const originY = isFullscreen ? 330 : 245;

  // Coordinates of Triangle Vertices
  const Cx = originX;
  const Cy = originY;
  const Bx = Cx + a * unitScale;
  const By = Cy;
  const Ax = Cx;
  const Ay = Cy - b * unitScale;

  // 1. Square on AC (b) - Extends to the LEFT
  // Vertices: A, C, C_left, A_left
  const sqB_p1 = { x: Ax, y: Ay };
  const sqB_p2 = { x: Cx, y: Cy };
  const sqB_p3 = { x: Cx - b * unitScale, y: Cy };
  const sqB_p4 = { x: Ax - b * unitScale, y: Ay };

  // 2. Square on BC (a) - Extends DOWNWARDS
  // Vertices: C, B, B_down, C_down
  const sqA_p1 = { x: Cx, y: Cy };
  const sqA_p2 = { x: Bx, y: By };
  const sqA_p3 = { x: Bx, y: By + a * unitScale };
  const sqA_p4 = { x: Cx, y: Cy + a * unitScale };

  // 3. Square on Hypotenuse AB (c) - Extends UPWARDS-RIGHT
  // Normal vector: (b * unitScale, -a * unitScale)
  const normX = b * unitScale;
  const normY = -a * unitScale;
  const sqC_p1 = { x: Ax, y: Ay };
  const sqC_p2 = { x: Bx, y: By };
  const sqC_p3 = { x: Bx + normX, y: By + normY };
  const sqC_p4 = { x: Ax + normX, y: Ay + normY };

  // Dissection Interpolation coordinates for animated shifting
  // In dissection mode: sqA and sqB pieces translate to cover sqC
  const diss = dissectionProgress;
  const sqC_center = {
    x: (sqC_p1.x + sqC_p2.x + sqC_p3.x + sqC_p4.x) / 4,
    y: (sqC_p1.y + sqC_p2.y + sqC_p3.y + sqC_p4.y) / 4,
  };
  const sqA_center = {
    x: (sqA_p1.x + sqA_p2.x + sqA_p3.x + sqA_p4.x) / 4,
    y: (sqA_p1.y + sqA_p2.y + sqA_p3.y + sqA_p4.y) / 4,
  };
  const sqB_center = {
    x: (sqB_p1.x + sqB_p2.x + sqB_p3.x + sqB_p4.x) / 4,
    y: (sqB_p1.y + sqB_p2.y + sqB_p3.y + sqB_p4.y) / 4,
  };

  const shiftA_X = (sqC_center.x - sqA_center.x) * diss;
  const shiftA_Y = (sqC_center.y - sqA_center.y) * diss;
  const shiftB_X = (sqC_center.x - sqB_center.x) * diss;
  const shiftB_Y = (sqC_center.y - sqB_center.y) * diss;

  return (
    <div
      ref={containerRef}
      className={`w-full h-full flex flex-col bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative select-none ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''
      }`}
    >
      {/* 1. Header Toolbar */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-2.5 z-20">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shadow-inner">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-extrabold text-white tracking-wide">
                KHÁM PHÁ & XÂY DỰNG ĐỊNH LÝ PYTHAGORE
              </h2>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                Toán 8 - Hình học
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Quan sát trực quan diện tích 3 hình vuông trên các cạnh tam giác vuông: a² + b² = c²
            </p>
          </div>
        </div>

        {/* Action Controls in Header */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Theorem Explanation Modal Button */}
          <button
            onClick={() => setShowTheoremModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/15 border border-amber-500/40 text-amber-300 hover:bg-amber-500/25 transition-all shadow-sm"
            title="Đọc phát biểu Định lý Pythagore"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Định lý</span>
          </button>

          {/* Reset Button */}
          <button
            onClick={handleReset}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all flex items-center gap-1"
            title="Đặt lại trạng thái mặc định a = 3, b = 4"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Đặt lại</span>
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all flex items-center gap-1"
            title={isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình (Trình chiếu)'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}</span>
          </button>
        </div>
      </div>

      {/* 2. Navigation Tabs Bar */}
      <div className="bg-slate-900/60 border-b border-slate-800/80 px-4 py-2 flex items-center gap-1.5 overflow-x-auto scrollbar-none z-10 text-xs">
        <button
          onClick={() => setActiveTab('explore')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
            activeTab === 'explore'
              ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>🔬 Khám phá tự do</span>
        </button>

        <button
          onClick={() => setActiveTab('dissection')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
            activeTab === 'dissection'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>🧩 Ghép diện tích</span>
        </button>

        <button
          onClick={() => setActiveTab('four_triangles')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
            activeTab === 'four_triangles'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>📐 Chứng minh bằng 4 tam giác</span>
        </button>

        <button
          onClick={() => setActiveTab('guided')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
            activeTab === 'guided'
              ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5" />
          <span>📚 Hướng dẫn từng bước (7 bước)</span>
        </button>

        <button
          onClick={() => setActiveTab('challenges')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
            activeTab === 'challenges'
              ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Trophy className="w-3.5 h-3.5" />
          <span>🎯 Thử thách toán học</span>
        </button>

        <button
          onClick={() => setActiveTab('presentation')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
            activeTab === 'presentation'
              ? 'bg-purple-500 text-white shadow-md shadow-purple-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Play className="w-3.5 h-3.5" />
          <span>▶ Chế độ Trình chiếu</span>
        </button>
      </div>

      {/* 3. Main Split View Layout */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden p-3 sm:p-4 gap-4">
        
        {/* LEFT / CENTER: Interactive Visual Canvas */}
        <div className="flex-1 flex flex-col items-center justify-center bg-slate-900/90 p-3 sm:p-5 rounded-2xl border border-slate-800/80 w-full min-h-[380px] sm:min-h-[440px] relative overflow-hidden">
          
          {/* Floating Canvas Quick Toolbar */}
          <div className="w-full flex flex-wrap items-center justify-between gap-2 mb-2 z-10 text-xs">
            {/* Display Toggles */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setShowMeasurements(!showMeasurements)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1 text-[11px] ${
                  showMeasurements ? 'bg-sky-950 border border-sky-600 text-sky-300' : 'text-slate-400 hover:text-white'
                }`}
                title="Bật/Tắt hiển thị độ dài cạnh"
              >
                <Ruler className="w-3 h-3" />
                <span>Số đo</span>
              </button>

              <button
                onClick={() => setShowAngle(!showAngle)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1 text-[11px] ${
                  showAngle ? 'bg-amber-950 border border-amber-600 text-amber-300' : 'text-slate-400 hover:text-white'
                }`}
                title="Bật/Tắt góc vuông C = 90°"
              >
                <span>∠C = 90°</span>
              </button>

              <button
                onClick={() => setShowComparison(!showComparison)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1 text-[11px] ${
                  showComparison ? 'bg-emerald-950 border border-emerald-600 text-emerald-300' : 'text-slate-400 hover:text-white'
                }`}
                title="Mở bảng so sánh diện tích"
              >
                <span>🔬 So sánh S</span>
              </button>

              <div className="hidden sm:flex items-center gap-1 text-[11px] text-amber-300/85 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                <Mouse className="w-3 h-3 text-amber-400" />
                <span>Lăn chuột 🖱️ để đổi kích thước</span>
              </div>
            </div>

            {/* Hidden Formula Reveal Toggle */}
            <button
              onClick={() => setShowFormulaLaw(!showFormulaLaw)}
              className={`px-3 py-1 rounded-xl font-bold border transition-all text-xs flex items-center gap-1.5 ${
                showFormulaLaw
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                  : 'bg-slate-950 text-amber-300 border-amber-500/40 hover:bg-amber-950/40'
              }`}
            >
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
              <span>{showFormulaLaw ? 'Quy luật: a² + b² = c²' : '💡 Hiện quy luật'}</span>
            </button>
          </div>

          {/* Canvas SVG Area */}
          <div 
            className="w-full flex-1 flex items-center justify-center relative select-none"
            onWheel={(e) => handleWheel(e, 'auto')}
          >
            {/* Mouse Wheel Floating Notification Toast */}
            {wheelToast && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-amber-500 text-slate-950 px-3.5 py-1.5 rounded-full font-mono font-extrabold text-xs shadow-xl shadow-amber-500/30 border border-amber-300 animate-bounce">
                <Mouse className="w-3.5 h-3.5" />
                <span>{wheelToast.message}</span>
              </div>
            )}

            {activeTab !== 'four_triangles' ? (
              <svg
                ref={svgRef}
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="w-full h-full max-h-[460px] overflow-visible cursor-crosshair"
                onMouseMove={handleMouseMove}
                onTouchMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onTouchEnd={handleMouseUp}
                onWheel={(e) => handleWheel(e, 'auto')}
              >
                <defs>
                  {/* Subtle Grid Pattern */}
                  <pattern id="canvas-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#334155" strokeWidth="0.5" opacity="0.3" />
                  </pattern>

                  {/* Shading Gradients */}
                  <linearGradient id="gradSqA" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#0284c7" stopOpacity="0.6" />
                  </linearGradient>
                  <linearGradient id="gradSqB" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#d97706" stopOpacity="0.6" />
                  </linearGradient>
                  <linearGradient id="gradSqC" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#059669" stopOpacity="0.55" />
                  </linearGradient>
                </defs>

                {/* Background Grid */}
                <rect width={svgWidth} height={svgHeight} fill="url(#canvas-grid)" />

                {/* ============================================================ */}
                {/* 1. SQUARE ON LEG A (BC) - Size a x a */}
                {/* ============================================================ */}
                <g
                  transform={`translate(${shiftA_X}, ${shiftA_Y})`}
                  className="transition-transform duration-75"
                  onClick={() => setSelectedElement('sqA')}
                  onWheel={(e) => handleWheel(e, 'a')}
                >
                  <polygon
                    points={`${sqA_p1.x},${sqA_p1.y} ${sqA_p2.x},${sqA_p2.y} ${sqA_p3.x},${sqA_p3.y} ${sqA_p4.x},${sqA_p4.y}`}
                    fill="url(#gradSqA)"
                    stroke="#38bdf8"
                    strokeWidth={selectedElement === 'sqA' ? 3 : 2}
                    className="cursor-pointer hover:stroke-sky-300 transition-all filter drop-shadow-md"
                  />
                  {/* Square a² Area Label */}
                  <text
                    x={(sqA_p1.x + sqA_p2.x + sqA_p3.x + sqA_p4.x) / 4}
                    y={(sqA_p1.y + sqA_p2.y + sqA_p3.y + sqA_p4.y) / 4 - 4}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-sky-100 font-mono font-extrabold text-xs sm:text-sm pointer-events-none drop-shadow"
                  >
                    S₁ = a²
                  </text>
                  <text
                    x={(sqA_p1.x + sqA_p2.x + sqA_p3.x + sqA_p4.x) / 4}
                    y={(sqA_p1.y + sqA_p2.y + sqA_p3.y + sqA_p4.y) / 4 + 14}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-sky-200 font-mono font-bold text-[11px] pointer-events-none drop-shadow"
                  >
                    {a2.toFixed(1)} cm²
                  </text>
                </g>

                {/* ============================================================ */}
                {/* 2. SQUARE ON LEG B (AC) - Size b x b */}
                {/* ============================================================ */}
                <g
                  transform={`translate(${shiftB_X}, ${shiftB_Y})`}
                  className="transition-transform duration-75"
                  onClick={() => setSelectedElement('sqB')}
                  onWheel={(e) => handleWheel(e, 'b')}
                >
                  <polygon
                    points={`${sqB_p1.x},${sqB_p1.y} ${sqB_p2.x},${sqB_p2.y} ${sqB_p3.x},${sqB_p3.y} ${sqB_p4.x},${sqB_p4.y}`}
                    fill="url(#gradSqB)"
                    stroke="#f59e0b"
                    strokeWidth={selectedElement === 'sqB' ? 3 : 2}
                    className="cursor-pointer hover:stroke-amber-300 transition-all filter drop-shadow-md"
                  />
                  {/* Square b² Area Label */}
                  <text
                    x={(sqB_p1.x + sqB_p2.x + sqB_p3.x + sqB_p4.x) / 4}
                    y={(sqB_p1.y + sqB_p2.y + sqB_p3.y + sqB_p4.y) / 4 - 4}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-amber-100 font-mono font-extrabold text-xs sm:text-sm pointer-events-none drop-shadow"
                  >
                    S₂ = b²
                  </text>
                  <text
                    x={(sqB_p1.x + sqB_p2.x + sqB_p3.x + sqB_p4.x) / 4}
                    y={(sqB_p1.y + sqB_p2.y + sqB_p3.y + sqB_p4.y) / 4 + 14}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-amber-200 font-mono font-bold text-[11px] pointer-events-none drop-shadow"
                  >
                    {b2.toFixed(1)} cm²
                  </text>
                </g>

                {/* ============================================================ */}
                {/* 3. SQUARE ON HYPOTENUSE C (AB) - Size c x c */}
                {/* ============================================================ */}
                <g 
                  onClick={() => setSelectedElement('sqC')}
                  onWheel={(e) => handleWheel(e, 'both')}
                >
                  <polygon
                    points={`${sqC_p1.x},${sqC_p1.y} ${sqC_p2.x},${sqC_p2.y} ${sqC_p3.x},${sqC_p3.y} ${sqC_p4.x},${sqC_p4.y}`}
                    fill="url(#gradSqC)"
                    stroke="#10b981"
                    strokeWidth={selectedElement === 'sqC' ? 3 : 2}
                    className="cursor-pointer hover:stroke-emerald-300 transition-all filter drop-shadow-lg"
                  />
                  {/* Square c² Area Label */}
                  <text
                    x={sqC_center.x}
                    y={sqC_center.y - 6}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-emerald-100 font-mono font-extrabold text-sm sm:text-base pointer-events-none drop-shadow"
                  >
                    S₃ = c²
                  </text>
                  <text
                    x={sqC_center.x}
                    y={sqC_center.y + 14}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-emerald-200 font-mono font-bold text-xs sm:text-sm pointer-events-none drop-shadow"
                  >
                    {c2.toFixed(1)} cm²
                  </text>
                </g>

                {/* ============================================================ */}
                {/* 4. MAIN RIGHT TRIANGLE ABC (C = 90°) */}
                {/* ============================================================ */}
                <polygon
                  points={`${Ax},${Ay} ${Bx},${By} ${Cx},${Cy}`}
                  fill="#6366f1"
                  fillOpacity="0.55"
                  stroke="#a5b4fc"
                  strokeWidth="2.5"
                  className="filter drop-shadow-md"
                />

                {/* Right Angle Symbol at C (∠C = 90°) */}
                {showAngle && (
                  <g>
                    <path
                      d={`M ${Cx + 14} ${Cy} L ${Cx + 14} ${Cy - 14} L ${Cx} ${Cy - 14}`}
                      fill="none"
                      stroke="#facc15"
                      strokeWidth="2"
                    />
                    <circle cx={Cx + 6} cy={Cy - 6} r="1.5" fill="#facc15" />
                    <text
                      x={Cx + 18}
                      y={Cy - 18}
                      className="fill-amber-300 font-mono font-bold text-[10px] drop-shadow"
                    >
                      90°
                    </text>
                  </g>
                )}

                {/* Edge a (BC) Line & Label */}
                <g onWheel={(e) => handleWheel(e, 'a')} className="cursor-ew-resize">
                  <line
                    x1={Cx}
                    y1={Cy}
                    x2={Bx}
                    y2={By}
                    stroke={selectedElement === 'a' ? '#38bdf8' : '#7dd3fc'}
                    strokeWidth={selectedElement === 'a' ? 4 : 2.5}
                    className="cursor-pointer"
                    onClick={() => setSelectedElement('a')}
                  />
                  {showLabels && (
                    <text
                      x={(Cx + Bx) / 2}
                      y={Cy - 8}
                      textAnchor="middle"
                      className="fill-sky-300 font-mono font-extrabold text-xs sm:text-sm drop-shadow pointer-events-none"
                    >
                      {showMeasurements ? `a = ${a} cm` : 'a'}
                    </text>
                  )}
                </g>

                {/* Edge b (AC) Line & Label */}
                <g onWheel={(e) => handleWheel(e, 'b')} className="cursor-ns-resize">
                  <line
                    x1={Cx}
                    y1={Cy}
                    x2={Ax}
                    y2={Ay}
                    stroke={selectedElement === 'b' ? '#f59e0b' : '#fcd34d'}
                    strokeWidth={selectedElement === 'b' ? 4 : 2.5}
                    className="cursor-pointer"
                    onClick={() => setSelectedElement('b')}
                  />
                  {showLabels && (
                    <text
                      x={Cx + 12}
                      y={(Cy + Ay) / 2}
                      textAnchor="start"
                      dominantBaseline="middle"
                      className="fill-amber-300 font-mono font-extrabold text-xs sm:text-sm drop-shadow pointer-events-none"
                    >
                      {showMeasurements ? `b = ${b} cm` : 'b'}
                    </text>
                  )}
                </g>

                {/* Hypotenuse c (AB) Line & Label */}
                <g onWheel={(e) => handleWheel(e, 'both')} className="cursor-pointer">
                  <line
                    x1={Ax}
                    y1={Ay}
                    x2={Bx}
                    y2={By}
                    stroke={selectedElement === 'c' ? '#10b981' : '#6ee7b7'}
                    strokeWidth={selectedElement === 'c' ? 4 : 2.5}
                    className="cursor-pointer"
                    onClick={() => setSelectedElement('c')}
                  />
                  {showLabels && (
                    <text
                      x={(Ax + Bx) / 2 - 14}
                      y={(Ay + By) / 2 - 10}
                      textAnchor="middle"
                      className="fill-emerald-300 font-mono font-extrabold text-xs sm:text-sm drop-shadow pointer-events-none"
                    >
                      {showMeasurements ? `c = ${c.toFixed(2)} cm` : 'c (Cạnh huyền)'}
                    </text>
                  )}
                </g>

                {/* Triangle Vertices Circles & Names */}
                {/* Vertex C */}
                <circle cx={Cx} cy={Cy} r="5" fill="#facc15" stroke="#0f172a" strokeWidth="2" />
                <text x={Cx - 14} y={Cy + 14} className="fill-amber-300 font-bold text-xs sm:text-sm">
                  C
                </text>

                {/* Vertex B (Interactive Drag handle for a) */}
                <g
                  className="cursor-ew-resize"
                  onMouseDown={() => handleMouseDown('B')}
                  onTouchStart={() => handleMouseDown('B')}
                  onWheel={(e) => handleWheel(e, 'a')}
                >
                  <circle cx={Bx} cy={By} r="8" fill="#38bdf8" stroke="#ffffff" strokeWidth="2.5" className="animate-pulse" />
                  <circle cx={Bx} cy={By} r="16" fill="#38bdf8" fillOpacity="0.2" />
                  <text x={Bx + 12} y={By + 14} className="fill-sky-300 font-bold text-xs sm:text-sm">
                    B (kéo a)
                  </text>
                </g>

                {/* Vertex A (Interactive Drag handle for b) */}
                <g
                  className="cursor-ns-resize"
                  onMouseDown={() => handleMouseDown('A')}
                  onTouchStart={() => handleMouseDown('A')}
                  onWheel={(e) => handleWheel(e, 'b')}
                >
                  <circle cx={Ax} cy={Ay} r="8" fill="#f59e0b" stroke="#ffffff" strokeWidth="2.5" className="animate-pulse" />
                  <circle cx={Ax} cy={Ay} r="16" fill="#f59e0b" fillOpacity="0.2" />
                  <text x={Ax - 16} y={Ay - 12} className="fill-amber-300 font-bold text-xs sm:text-sm">
                    A (kéo b)
                  </text>
                </g>
              </svg>
            ) : (
              /* ============================================================ */
              /* 4-TRIANGLES REARRANGEMENT PROOF CANVAS */
              /* ============================================================ */
              <div className="w-full flex flex-col items-center justify-center p-2">
                <div className="mb-3 flex items-center gap-2 text-xs">
                  <span className="text-slate-400">Cách sắp xếp:</span>
                  <button
                    onClick={() => {
                      setRearrangeMode('c_square');
                      setRearrangeProgress(0);
                    }}
                    className={`px-3 py-1 rounded-lg font-bold border transition-all ${
                      rearrangeMode === 'c_square'
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                        : 'bg-slate-950 text-slate-300 border-slate-800'
                    }`}
                  >
                    Cách 1: Hình vuông c² + 4 tam giác
                  </button>
                  <button
                    onClick={() => {
                      setRearrangeMode('ab_squares');
                      setRearrangeProgress(1);
                    }}
                    className={`px-3 py-1 rounded-lg font-bold border transition-all ${
                      rearrangeMode === 'ab_squares'
                        ? 'bg-amber-500 text-slate-950 border-amber-400'
                        : 'bg-slate-950 text-slate-300 border-slate-800'
                    }`}
                  >
                    Cách 2: Hình vuông a² + b² + 4 tam giác
                  </button>
                </div>

                <svg viewBox="0 0 400 400" className="w-full max-w-[360px] max-h-[360px] bg-slate-950 rounded-2xl border border-slate-800 p-2">
                  {/* Outer Square of Side (a + b) */}
                  {(() => {
                    const side = 320;
                    const scaleFactor = side / (a + b);
                    const sA = a * scaleFactor;
                    const sB = b * scaleFactor;
                    const pX = 40;
                    const pY = 40;

                    if (rearrangeMode === 'c_square') {
                      return (
                        <g>
                          {/* Outer Border */}
                          <rect x={pX} y={pY} width={side} height={side} fill="none" stroke="#64748b" strokeWidth="2" strokeDasharray="4 4" />
                          
                          {/* 4 Corner Right Triangles */}
                          {/* T1 Top-Left */}
                          <polygon points={`${pX},${pY} ${pX + sB},${pY} ${pX},${pY + sA}`} fill="#6366f1" fillOpacity="0.6" stroke="#a5b4fc" strokeWidth="2" />
                          {/* T2 Top-Right */}
                          <polygon points={`${pX + sB},${pY} ${pX + side},${pY} ${pX + side},${pY + sB}`} fill="#6366f1" fillOpacity="0.6" stroke="#a5b4fc" strokeWidth="2" />
                          {/* T3 Bottom-Right */}
                          <polygon points={`${pX + side},${pY + sB} ${pX + side},${pY + side} ${pX + sA},${pY + side}`} fill="#6366f1" fillOpacity="0.6" stroke="#a5b4fc" strokeWidth="2" />
                          {/* T4 Bottom-Left */}
                          <polygon points={`${pX + sA},${pY + side} ${pX},${pY + side} ${pX},${pY + sA}`} fill="#6366f1" fillOpacity="0.6" stroke="#a5b4fc" strokeWidth="2" />

                          {/* Inner Tilted Square c² */}
                          <polygon
                            points={`${pX + sB},${pY} ${pX + side},${pY + sB} ${pX + sA},${pY + side} ${pX},${pY + sA}`}
                            fill="#10b981"
                            fillOpacity="0.65"
                            stroke="#34d399"
                            strokeWidth="2.5"
                          />
                          <text x={pX + side / 2} y={pY + side / 2} textAnchor="middle" dominantBaseline="middle" className="fill-emerald-100 font-mono font-extrabold text-base">
                            c² = {c2.toFixed(1)} cm²
                          </text>
                        </g>
                      );
                    } else {
                      return (
                        <g>
                          {/* Outer Border */}
                          <rect x={pX} y={pY} width={side} height={side} fill="none" stroke="#64748b" strokeWidth="2" strokeDasharray="4 4" />
                          
                          {/* Square a² (Top-Left) */}
                          <rect x={pX} y={pY} width={sA} height={sA} fill="#38bdf8" fillOpacity="0.6" stroke="#38bdf8" strokeWidth="2.5" />
                          <text x={pX + sA / 2} y={pY + sA / 2} textAnchor="middle" dominantBaseline="middle" className="fill-sky-100 font-mono font-extrabold text-sm">
                            a² = {a2.toFixed(1)}
                          </text>

                          {/* Square b² (Bottom-Right) */}
                          <rect x={pX + sA} y={pY + sA} width={sB} height={sB} fill="#f59e0b" fillOpacity="0.6" stroke="#f59e0b" strokeWidth="2.5" />
                          <text x={pX + sA + sB / 2} y={pY + sA + sB / 2} textAnchor="middle" dominantBaseline="middle" className="fill-amber-100 font-mono font-extrabold text-sm">
                            b² = {b2.toFixed(1)}
                          </text>

                          {/* Rectangle Top-Right (2 Triangles) */}
                          <polygon points={`${pX + sA},${pY} ${pX + side},${pY} ${pX + sA},${pY + sA}`} fill="#6366f1" fillOpacity="0.6" stroke="#a5b4fc" strokeWidth="1.5" />
                          <polygon points={`${pX + side},${pY} ${pX + side},${pY + sA} ${pX + sA},${pY + sA}`} fill="#6366f1" fillOpacity="0.6" stroke="#a5b4fc" strokeWidth="1.5" />

                          {/* Rectangle Bottom-Left (2 Triangles) */}
                          <polygon points={`${pX},${pY + sA} ${pX + sA},${pY + sA} ${pX},${pY + side}`} fill="#6366f1" fillOpacity="0.6" stroke="#a5b4fc" strokeWidth="1.5" />
                          <polygon points={`${pX + sA},${pY + sA} ${pX + sA},${pY + side} ${pX},${pY + side}`} fill="#6366f1" fillOpacity="0.6" stroke="#a5b4fc" strokeWidth="1.5" />
                        </g>
                      );
                    }
                  })()}
                </svg>

                {/* Proof Equation Breakdown */}
                <div className="w-full mt-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-center text-slate-300 font-mono">
                  {rearrangeMode === 'c_square' ? (
                    <p>
                      Diện tích hình vuông lớn: <strong className="text-amber-400">(a + b)² = c² + 4 × (ab/2) = c² + 2ab</strong>
                    </p>
                  ) : (
                    <p>
                      Diện tích hình vuông lớn: <strong className="text-amber-400">(a + b)² = a² + b² + 4 × (ab/2) = a² + b² + 2ab</strong>
                    </p>
                  )}
                  <p className="text-emerald-400 font-bold mt-1">
                    ⇒ Triệt tiêu 2ab ở cả hai cách ta được: a² + b² = c² (ĐPCM)
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Dissection Controls Toolbar (If in dissection tab) */}
          {activeTab === 'dissection' && (
            <div className="w-full mt-2 p-3 bg-slate-950/90 rounded-xl border border-amber-500/30 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-amber-300">Thao tác ghép:</span>
                <button
                  onClick={() => {
                    setDissectionProgress(0);
                    setIsAnimatingDissection(false);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>[ Tách ]</span>
                </button>
                <button
                  onClick={() => {
                    setDissectionProgress(0);
                    setIsAnimatingDissection(true);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold shadow-md flex items-center gap-1"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>[ Ghép ]</span>
                </button>
              </div>

              {/* Scrubber & Speed Slider */}
              <div className="flex items-center gap-3 flex-1 min-w-[200px] justify-end">
                <span className="text-slate-400 text-[11px]">Tiến trình:</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={dissectionProgress}
                  onChange={(e) => {
                    setIsAnimatingDissection(false);
                    setDissectionProgress(parseFloat(e.target.value));
                  }}
                  className="w-32 accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded"
                />
                <span className="font-mono text-amber-300 font-bold w-10 text-right">
                  {Math.round(dissectionProgress * 100)}%
                </span>

                <div className="hidden sm:flex items-center gap-1.5 ml-2">
                  <FastForward className="w-3 h-3 text-slate-400" />
                  <select
                    value={animationSpeed}
                    onChange={(e) => setAnimationSpeed(parseFloat(e.target.value))}
                    className="bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-[11px] text-slate-200"
                  >
                    <option value={0.5}>Chậm (0.5x)</option>
                    <option value={1}>Chuẩn (1x)</option>
                    <option value={1.5}>Nhanh (1.5x)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Presentation Mode Step Carousel */}
          {activeTab === 'presentation' && (
            <div className="w-full mt-2 p-3 bg-purple-950/40 rounded-xl border border-purple-500/40 flex items-center justify-between gap-3 text-xs">
              <button
                disabled={presentationStep <= 1}
                onClick={() => setPresentationStep((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Trước</span>
              </button>

              <div className="text-center">
                <span className="text-[10px] uppercase tracking-wider text-purple-300 font-bold block">
                  Slide {presentationStep} / 7
                </span>
                <span className="font-bold text-white text-xs sm:text-sm">
                  {presentationStep === 1 && '1. Tam giác vuông ABC (∠C = 90°)'}
                  {presentationStep === 2 && '2. Dựng 3 hình vuông trên 3 cạnh'}
                  {presentationStep === 3 && '3. Tính toán và hiển thị diện tích S₁, S₂, S₃'}
                  {presentationStep === 4 && '4. So sánh tổng S₁ + S₂ với S₃'}
                  {presentationStep === 5 && '5. Thí nghiệm cắt ghép diện tích'}
                  {presentationStep === 6 && '6. Phát hiện quy luật tổng quát'}
                  {presentationStep === 7 && '7. Phát biểu Định lý Pythagore'}
                </span>
              </div>

              <button
                disabled={presentationStep >= 7}
                onClick={() => setPresentationStep((p) => Math.min(7, p + 1))}
                className="p-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-bold flex items-center gap-1"
              >
                <span className="hidden sm:inline">Tiếp theo</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Interactive Controls, Calculations & Educational Guided Modes */}
        <div className="w-full lg:w-[340px] flex flex-col gap-3 overflow-y-auto pr-1">
          
          {/* TAB 1: EXPLORE & PARAMETERS */}
          {activeTab === 'explore' && (
            <div className="space-y-3">
              {/* Sliders Card */}
              <div className="bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800/80 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-xs font-bold text-slate-200 uppercase tracking-wider">
                  <span className="flex items-center gap-1.5 text-amber-400">
                    <Sliders className="w-4 h-4" />
                    KÍCH THƯỚC TAM GIÁC
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono">∠C = 90° (Cố định)</span>
                </div>

                {/* Slider Leg a */}
                <div 
                  className="space-y-1 p-1.5 rounded-xl hover:bg-slate-800/40 transition-colors"
                  onWheel={(e) => handleWheel(e, 'a')}
                >
                  <div className="flex justify-between text-xs">
                    <span className="text-sky-300 font-bold flex items-center gap-1">
                      <span>Cạnh góc vuông a (BC):</span>
                      <Mouse className="w-3 h-3 text-sky-400 opacity-60" />
                    </span>
                    <span className="font-mono font-bold text-sky-200 bg-sky-950 px-2 py-0.5 rounded border border-sky-800">
                      a = {a} cm
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    step={0.5}
                    value={a}
                    onChange={(e) => handleParamUpdate(parseFloat(e.target.value), b)}
                    className="w-full accent-sky-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>1 cm</span>
                    <span>10 cm</span>
                  </div>
                </div>

                {/* Slider Leg b */}
                <div 
                  className="space-y-1 p-1.5 rounded-xl hover:bg-slate-800/40 transition-colors"
                  onWheel={(e) => handleWheel(e, 'b')}
                >
                  <div className="flex justify-between text-xs">
                    <span className="text-amber-300 font-bold flex items-center gap-1">
                      <span>Cạnh góc vuông b (AC):</span>
                      <Mouse className="w-3 h-3 text-amber-400 opacity-60" />
                    </span>
                    <span className="font-mono font-bold text-amber-200 bg-amber-950 px-2 py-0.5 rounded border border-amber-800">
                      b = {b} cm
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    step={0.5}
                    value={b}
                    onChange={(e) => handleParamUpdate(a, parseFloat(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>1 cm</span>
                    <span>10 cm</span>
                  </div>
                </div>

                {/* Auto Calculated Hypotenuse c */}
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-emerald-300 font-bold">Cạnh huyền c (AB = √(a²+b²)):</span>
                  <span className="font-mono font-extrabold text-emerald-300 bg-emerald-950/80 px-2 py-1 rounded border border-emerald-700">
                    c = {c.toFixed(2)} cm
                  </span>
                </div>
              </div>

              {/* Realtime Area Table */}
              <div className="bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800/80 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-200 uppercase tracking-wider border-b border-slate-800 pb-1.5">
                  <span className="flex items-center gap-1.5 text-sky-400">
                    <Table className="w-4 h-4" />
                    BẢNG ĐỘ DÀI & DIỆN TÍCH
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left font-mono">
                    <thead className="text-[10px] uppercase text-slate-400 bg-slate-950/60 border-b border-slate-800">
                      <tr>
                        <th className="py-1.5 px-2">Cạnh</th>
                        <th className="py-1.5 px-2">Độ dài</th>
                        <th className="py-1.5 px-2">Diện tích hình vuông</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      <tr className="text-sky-300">
                        <td className="py-1.5 px-2 font-bold">Cạnh a</td>
                        <td className="py-1.5 px-2">{a} cm</td>
                        <td className="py-1.5 px-2 font-bold">S₁ = a² = {a2.toFixed(1)} cm²</td>
                      </tr>
                      <tr className="text-amber-300">
                        <td className="py-1.5 px-2 font-bold">Cạnh b</td>
                        <td className="py-1.5 px-2">{b} cm</td>
                        <td className="py-1.5 px-2 font-bold">S₂ = b² = {b2.toFixed(1)} cm²</td>
                      </tr>
                      <tr className="text-emerald-300 bg-emerald-950/30">
                        <td className="py-1.5 px-2 font-bold">Cạnh c</td>
                        <td className="py-1.5 px-2">{c.toFixed(2)} cm</td>
                        <td className="py-1.5 px-2 font-bold">S₃ = c² = {c2.toFixed(1)} cm²</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Area Comparison Experiment Panel (Requirement 7 & 10) */}
              <div className="bg-gradient-to-br from-amber-950/40 via-slate-900/90 to-slate-900/90 p-3.5 rounded-2xl border border-amber-500/40 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-300 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    SO SÁNH DIỆN TÍCH
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Thực nghiệm</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-center font-mono">
                  <div className="p-2 rounded-xl bg-slate-950 border border-sky-800/60 space-y-1">
                    <span className="text-[10px] text-slate-400 block">S₁ + S₂ (Hai hình vuông nhỏ)</span>
                    <span className="text-xs font-bold text-sky-300 block">
                      {a2.toFixed(1)} + {b2.toFixed(1)}
                    </span>
                    <span className="text-sm font-extrabold text-amber-300 block">
                      = {(a2 + b2).toFixed(1)} cm²
                    </span>
                  </div>

                  <div className="p-2 rounded-xl bg-slate-950 border border-emerald-800/60 space-y-1">
                    <span className="text-[10px] text-slate-400 block">S₃ (Hình vuông cạnh huyền)</span>
                    <span className="text-xs font-bold text-emerald-300 block">
                      ({c.toFixed(2)})²
                    </span>
                    <span className="text-sm font-extrabold text-emerald-300 block">
                      = {c2.toFixed(1)} cm²
                    </span>
                  </div>
                </div>

                {/* Conclusion Reveal */}
                <div className="p-2 rounded-xl bg-slate-950/90 border border-amber-500/30 text-center font-bold">
                  {showFormulaLaw ? (
                    <div className="space-y-0.5">
                      <span className="text-emerald-400 text-xs flex items-center justify-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Hai giá trị luôn luôn bằng nhau!
                      </span>
                      <p className="font-mono text-sm sm:text-base text-amber-300 tracking-wider">
                        a² + b² = c²
                      </p>
                    </div>
                  ) : (
                    <div className="text-slate-300 text-[11px]">
                      <span>Diện tích S₁ + S₂ = ? S₃</span>
                      <button
                        onClick={() => setShowFormulaLaw(true)}
                        className="block mx-auto mt-1 px-2.5 py-0.5 rounded bg-amber-500 text-slate-950 text-[10px] font-extrabold"
                      >
                        Bấm để phát hiện quy luật
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Pythagorean Presets Library (Requirement 14) */}
              <div className="bg-slate-900/90 p-3 rounded-2xl border border-slate-800/80 space-y-2 text-xs">
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                  Thư viện bộ ba Pythagore:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {pythagoreanPresets.map((pr, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleParamUpdate(pr.aVal, pr.bVal)}
                      className={`px-2.5 py-1 rounded-lg border text-[11px] font-mono transition-all ${
                        a === pr.aVal && b === pr.bVal
                          ? 'bg-sky-500 text-slate-950 font-bold border-sky-400'
                          : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
                      }`}
                    >
                      {pr.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: GUIDED DISCOVERY MODE (7 STEPS) */}
          {activeTab === 'guided' && (
            <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800/80 space-y-3.5 text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-indigo-300 flex items-center gap-1.5 text-xs uppercase tracking-wider">
                  <GraduationCap className="w-4 h-4" />
                  HƯỚNG DẪN KHÁM PHÁ (BƯỚC {guidedStep}/7)
                </span>
              </div>

              {/* Step Progress Bar */}
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="bg-indigo-500 h-full transition-all duration-300"
                  style={{ width: `${(guidedStep / 7) * 100}%` }}
                />
              </div>

              {/* Current Question Box */}
              {(() => {
                const q = guidedQuestions[guidedStep - 1];
                return (
                  <div className="space-y-3">
                    <h4 className="font-bold text-slate-200 text-sm">{q.title}</h4>
                    <p className="text-slate-300 bg-slate-950 p-2.5 rounded-xl border border-slate-800 leading-relaxed">
                      {q.question}
                    </p>

                    {/* Options List */}
                    <div className="space-y-2">
                      {q.options.map((opt, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setGuidedSelectedOption(idx);
                            if (idx === q.correct) {
                              setGuidedFeedback(q.explanation);
                            } else {
                              setGuidedFeedback('Chưa chính xác. Hãy quan sát kỹ mô hình và thử lại nhé!');
                            }
                          }}
                          className={`w-full text-left p-2.5 rounded-xl border transition-all font-medium ${
                            guidedSelectedOption === idx
                              ? idx === q.correct
                                ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200'
                                : 'bg-rose-950/80 border-rose-500 text-rose-200'
                              : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          <span className="font-bold mr-1.5">{String.fromCharCode(65 + idx)}.</span>
                          {opt}
                        </button>
                      ))}
                    </div>

                    {/* Feedback Alert */}
                    {guidedFeedback && (
                      <div
                        className={`p-3 rounded-xl border text-xs leading-relaxed ${
                          guidedSelectedOption === q.correct
                            ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-300'
                            : 'bg-rose-950/50 border-rose-500/50 text-rose-300'
                        }`}
                      >
                        {guidedFeedback}
                      </div>
                    )}

                    {/* Next Step Button */}
                    <div className="flex justify-between items-center pt-2">
                      <button
                        disabled={guidedStep <= 1}
                        onClick={() => {
                          setGuidedStep((s) => s - 1);
                          setGuidedSelectedOption(null);
                          setGuidedFeedback(null);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 disabled:opacity-40"
                      >
                        Quay lại
                      </button>

                      {guidedStep < 7 ? (
                        <button
                          disabled={guidedSelectedOption !== q.correct}
                          onClick={() => {
                            setGuidedStep((s) => s + 1);
                            setGuidedSelectedOption(null);
                            setGuidedFeedback(null);
                          }}
                          className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold flex items-center gap-1"
                        >
                          <span>Bước tiếp theo</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => setGuidedCompleted(true)}
                          className="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold flex items-center gap-1 shadow-lg"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Hoàn thành bài học</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* TAB 3: CHALLENGES MODE */}
          {activeTab === 'challenges' && (
            <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800/80 space-y-3.5 text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-rose-400 flex items-center gap-1.5 text-xs uppercase tracking-wider">
                  <Trophy className="w-4 h-4" />
                  THỬ THÁCH HÌNH HỌC (NHIỆM VỤ {currentChallenge}/4)
                </span>
              </div>

              {/* Task Selector */}
              <div className="grid grid-cols-4 gap-1.5">
                {[1, 2, 3, 4].map((taskNum) => (
                  <button
                    key={taskNum}
                    onClick={() => {
                      setCurrentChallenge(taskNum);
                      setChallengeStatus('idle');
                      setChallengeFeedback('');
                      setChallengeGuess('');
                    }}
                    className={`py-1 rounded-lg font-bold border text-center ${
                      currentChallenge === taskNum
                        ? 'bg-rose-500 text-white border-rose-400'
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    Nv {taskNum}
                  </button>
                ))}
              </div>

              {/* Challenge Description */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <h4 className="font-bold text-rose-300 text-sm">
                  {currentChallenge === 1 && 'Nhiệm vụ 1: Dự đoán cạnh huyền'}
                  {currentChallenge === 2 && 'Nhiệm vụ 2: Tạo tam giác có cạnh huyền c = 5 cm'}
                  {currentChallenge === 3 && 'Nhiệm vụ 3: Tìm bộ ba số nguyên Pythagore'}
                  {currentChallenge === 4 && 'Nhiệm vụ 4: Tạo hình vuông trên cạnh huyền S₃ = 25 cm²'}
                </h4>
                <p className="text-slate-300 leading-relaxed">
                  {currentChallenge === 1 && 'Cho tam giác vuông có a = 3 cm và b = 4 cm. Hãy tính và nhập độ dài cạnh huyền c:'}
                  {currentChallenge === 2 && 'Hãy điều chỉnh thanh trượt a và b ở màn hình để tạo thành tam giác vuông có cạnh huyền c = 5 cm.'}
                  {currentChallenge === 3 && 'Hãy chỉnh a và b sao cho cả 3 cạnh a, b, c đều là các số nguyên dương.'}
                  {currentChallenge === 4 && 'Hãy điều chỉnh các thanh trượt sao cho diện tích hình vuông cạnh huyền c² = 25 cm².'}
                </p>

                {currentChallenge === 1 && (
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="number"
                      placeholder="Nhập giá trị c (cm)..."
                      value={challengeGuess}
                      onChange={(e) => setChallengeGuess(e.target.value)}
                      className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono text-xs flex-1"
                    />
                  </div>
                )}

                <button
                  onClick={handleCheckChallenge}
                  className="w-full mt-2 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-extrabold shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Kiểm tra kết quả</span>
                </button>
              </div>

              {/* Challenge Feedback Message */}
              {challengeStatus !== 'idle' && (
                <div
                  className={`p-3 rounded-xl border leading-relaxed ${
                    challengeStatus === 'success'
                      ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200'
                      : 'bg-rose-950/80 border-rose-500 text-rose-200'
                  }`}
                >
                  {challengeFeedback}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: DISSECTION TAB DESCRIPTION & STEPS */}
          {activeTab === 'dissection' && (
            <div className="bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800/80 space-y-2.5 text-xs">
              <span className="font-bold text-amber-300 uppercase tracking-wider block">
                Ý NGHĨA SƯ PHẠM CỦA GHÉP DIỆN TÍCH:
              </span>
              <p className="text-slate-300 leading-relaxed">
                Khi kích hoạt thao tác <strong>Ghép</strong>, toàn bộ phần diện tích của hai hình vuông nhỏ (a² và b²) sẽ tịnh tiến và lấp đầy vừa khít diện tích hình vuông c² trên cạnh huyền.
              </p>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1 font-mono text-[11px]">
                <div className="text-sky-300">S₁ (Hình vuông a²) = {a2.toFixed(1)} cm²</div>
                <div className="text-amber-300">S₂ (Hình vuông b²) = {b2.toFixed(1)} cm²</div>
                <div className="text-emerald-400 font-bold pt-1 border-t border-slate-800">
                  Tổng S₁ + S₂ = {(a2 + b2).toFixed(1)} cm² ≡ S₃ (c² = {c2.toFixed(1)} cm²)
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. THEOREM POPUP MODAL (Requirement 17) */}
      {showTheoremModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/40 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-slate-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-amber-400">
                <BookOpen className="w-5 h-5" />
                <h3 className="text-base font-extrabold uppercase tracking-wide">Định Lý Pythagore</h3>
              </div>
              <button
                onClick={() => setShowTheoremModal(false)}
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/30 text-center space-y-2">
              <p className="text-sm sm:text-base font-bold text-amber-200 leading-relaxed italic">
                "Trong một tam giác vuông, bình phương độ dài cạnh huyền bằng tổng bình phương độ dài hai cạnh góc vuông."
              </p>
              <div className="py-2 px-4 rounded-xl bg-slate-950 border border-amber-500/40 font-mono text-xl sm:text-2xl font-extrabold text-amber-400 tracking-wider">
                a² + b² = c²
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-slate-300">
              <p>• <strong>a, b</strong>: Độ dài hai cạnh góc vuông (BC và AC).</p>
              <p>• <strong>c</strong>: Độ dài cạnh huyền (AB, đối diện góc vuông 90°).</p>
              <p>• <strong>Định lý đảo</strong>: Nếu một tam giác có a² + b² = c² thì tam giác đó là tam giác vuông tại đỉnh đối diện cạnh c.</p>
            </div>

            <button
              onClick={() => setShowTheoremModal(false)}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold shadow-lg transition-all"
            >
              Đã hiểu & Tiếp tục thực nghiệm
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
