import React, { useEffect, useRef, useState } from 'react';
import {
  Compass,
  Play,
  RotateCcw,
  Download,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  PlusCircle,
  Move,
  Layers,
  Sparkles,
  ChevronRight,
  Code2,
  Activity,
  Circle,
  Square,
  Triangle,
  Spline,
  Table,
  Zap,
  Terminal,
  Send,
  CheckCircle2,
  HelpCircle,
  PanelLeftClose,
  PanelLeftOpen,
  Minus,
  X,
  GripHorizontal,
  RefreshCw,
} from 'lucide-react';
import { parseVietnameseGeoGebraCommand, parseVietnameseGeoGebraCommandWithAI, ParsedGeoGebraResult } from '../../utils/vietnameseGeoGebraParser';

declare global {
  interface Window {
    GGBApplet?: any;
    ggbApplet?: any;
  }
}

export type GeoGebraAppName = 'geometry' | 'graphing' | '3d' | 'classic' | 'cas';

interface GeoGebraCanvasProps {
  initialAppName?: GeoGebraAppName;
  width?: number | string;
  height?: number | string;
  onObjectAdd?: (name: string, type: string) => void;
  onObjectUpdate?: (name: string, coords: { x?: number; y?: number; value?: number }) => void;
}

export const GeoGebraCanvas: React.FC<GeoGebraCanvasProps> = ({
  initialAppName = 'geometry',
  width = '100%',
  height = 620,
}) => {
  const [appName, setAppName] = useState<GeoGebraAppName>(initialAppName);
  const [isScriptLoaded, setIsScriptLoaded] = useState<boolean>(false);
  const [isAppletReady, setIsAppletReady] = useState<boolean>(false);
  const [scriptError, setScriptError] = useState<boolean>(false);

  // Applet API Instance reference
  const apiRef = useRef<any>(null);
  const containerId = useRef<string>(`ggb-element-${Math.random().toString(36).substring(2, 9)}`);

  // Console Command Input
  const [commandInput, setCommandInput] = useState<string>('A = (2, 3)');
  const [commandHistory, setCommandHistory] = useState<string[]>([
    'A = (2, 3)',
    'B = (6, 5)',
    'C = (4, -1)',
    'Polygon(A, B, C)',
  ]);

  // Vietnamese Natural Language Prompt State
  const [vietnameseInput, setVietnameseInput] = useState<string>('vẽ đồ thị y = 3x + 1');
  const [lastParsedResult, setLastParsedResult] = useState<ParsedGeoGebraResult | null>(null);

  // Object Inspection & Event Log State
  const [objectsList, setObjectsList] = useState<Array<{ name: string; type: string; valueString: string; visible: boolean }>>([]);
  const [eventLogs, setEventLogs] = useState<Array<{ time: string; event: string; details: string }>>([]);
  const [showLogPanel, setShowLogPanel] = useState<boolean>(true);
  const [activeTabPanel, setActiveTabPanel] = useState<'vietnamese' | 'construction' | 'commands' | 'objects' | 'logs'>('vietnamese');

  // AI Natural Language Prompt Parsing State
  const [isAnalyzingPrompt, setIsAnalyzingPrompt] = useState<boolean>(false);

  // Command input panel state: Minimize (-) and Close (x) and Vertical Resizing
  const [isVietnamesePanelMinimized, setIsVietnamesePanelMinimized] = useState<boolean>(false);
  const [isVietnamesePanelClosed, setIsVietnamesePanelClosed] = useState<boolean>(false);
  const [vietnamesePanelHeight, setVietnamesePanelHeight] = useState<number>(240);
  const [isResizingVietnamese, setIsResizingVietnamese] = useState<boolean>(false);

  const [isJsConsoleMinimized, setIsJsConsoleMinimized] = useState<boolean>(false);
  const [isJsConsoleClosed, setIsJsConsoleClosed] = useState<boolean>(false);
  const [jsConsolePanelHeight, setJsConsolePanelHeight] = useState<number>(220);
  const [isResizingJsConsole, setIsResizingJsConsole] = useState<boolean>(false);

  // Resize pointer event handling for Vietnamese Panel
  const isResizingVietnameseRef = useRef<boolean>(false);
  const startYVietnameseRef = useRef<number>(0);
  const startHeightVietnameseRef = useRef<number>(240);

  const handleVietnamesePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    isResizingVietnameseRef.current = true;
    setIsResizingVietnamese(true);
    startYVietnameseRef.current = e.clientY;
    startHeightVietnameseRef.current = vietnamesePanelHeight;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleVietnamesePointerMove = (e: React.PointerEvent) => {
    if (!isResizingVietnameseRef.current) return;
    const deltaY = e.clientY - startYVietnameseRef.current;
    const newHeight = Math.max(130, Math.min(550, startHeightVietnameseRef.current + deltaY));
    setVietnamesePanelHeight(newHeight);
  };

  const handleVietnamesePointerUp = (e: React.PointerEvent) => {
    if (isResizingVietnameseRef.current) {
      isResizingVietnameseRef.current = false;
      setIsResizingVietnamese(false);
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch (_) {}
    }
  };

  // Resize pointer event handling for JS Console Panel
  const isResizingJsConsoleRef = useRef<boolean>(false);
  const startYJsConsoleRef = useRef<number>(0);
  const startHeightJsConsoleRef = useRef<number>(220);

  const handleJsConsolePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    isResizingJsConsoleRef.current = true;
    setIsResizingJsConsole(true);
    startYJsConsoleRef.current = e.clientY;
    startHeightJsConsoleRef.current = jsConsolePanelHeight;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleJsConsolePointerMove = (e: React.PointerEvent) => {
    if (!isResizingJsConsoleRef.current) return;
    const deltaY = e.clientY - startYJsConsoleRef.current;
    const newHeight = Math.max(130, Math.min(550, startHeightJsConsoleRef.current + deltaY));
    setJsConsolePanelHeight(newHeight);
  };

  const handleJsConsolePointerUp = (e: React.PointerEvent) => {
    if (isResizingJsConsoleRef.current) {
      isResizingJsConsoleRef.current = false;
      setIsResizingJsConsole(false);
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch (_) {}
    }
  };

  // Sidebar Collapse & Expand State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  // Fullscreen State
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Toggle Fullscreen Handler
  const toggleFullscreen = () => {
    if (!document.fullscreenElement && !isFullscreen) {
      if (wrapperRef.current?.requestFullscreen) {
        wrapperRef.current.requestFullscreen().catch(() => {
          setIsFullscreen(true);
        });
      } else {
        setIsFullscreen(true);
      }
    } else {
      if (document.exitFullscreen && document.fullscreenElement) {
        document.exitFullscreen().catch(() => {
          setIsFullscreen(false);
        });
      } else {
        setIsFullscreen(false);
      }
    }
  };

  // Sync Fullscreen state with browser event
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Load GeoGebra Script dynamically
  useEffect(() => {
    let script = document.getElementById('ggb-script') as HTMLScriptElement;

    const onScriptLoad = () => {
      setIsScriptLoaded(true);
      setScriptError(false);
    };

    const onScriptErr = () => {
      setScriptError(true);
    };

    if (!script) {
      script = document.createElement('script');
      script.id = 'ggb-script';
      script.src = 'https://www.geogebra.org/apps/deployggb.js';
      script.async = true;
      script.onload = onScriptLoad;
      script.onerror = onScriptErr;
      document.body.appendChild(script);
    } else {
      if (window.GGBApplet) {
        setIsScriptLoaded(true);
      } else {
        script.addEventListener('load', onScriptLoad);
        script.addEventListener('error', onScriptErr);
      }
    }

    return () => {
      if (script) {
        script.removeEventListener('load', onScriptLoad);
        script.removeEventListener('error', onScriptErr);
      }
    };
  }, []);

  // Initialize Applet when script is ready or appName changes
  useEffect(() => {
    if (!isScriptLoaded || !window.GGBApplet) return;

    setIsAppletReady(false);
    const container = document.getElementById(containerId.current);
    if (container) {
      container.innerHTML = '';
    }

    const wrapper = document.querySelector('.ggb-canvas-wrapper');
    const initialWidth = wrapper?.clientWidth || 1200;
    const initialHeight = wrapper?.clientHeight || 720;

    const params = {
      appName: appName,
      width: initialWidth,
      height: initialHeight,
      allowScale: false,
      showToolBar: true,
      showAlgebraInput: true,
      showMenuBar: true,
      showResetIcon: true,
      enableLabelDrags: true,
      enableShiftDragZoom: true,
      enableRightClick: true,
      playButton: true,
      showToolBarHelp: true,
      errorDialogsActive: true,
      useBrowserForJS: true,
      appletOnLoad: (api: any) => {
        apiRef.current = api;
        setIsAppletReady(true);
        logEvent('SYSTEM', `Bảng vẽ GeoGebra (${appName.toUpperCase()}) đã khởi tạo thành công.`);

        // Register GeoGebra Event Listeners
        try {
          api.registerAddListener((objName: string) => {
            const type = api.getObjectType(objName);
            const val = api.getValueString(objName);
            logEvent('ADD', `Tạo mới ${type}: ${val}`);
            refreshObjectsList(api);
          });

          api.registerUpdateListener((objName: string) => {
            refreshObjectsList(api);
          });

          api.registerRemoveListener((objName: string) => {
            logEvent('REMOVE', `Đã xóa đối tượng: ${objName}`);
            refreshObjectsList(api);
          });
        } catch (err) {
          console.warn('GeoGebra Event Listeners registration notice:', err);
        }

        refreshObjectsList(api);
      },
    };

    const applet = new window.GGBApplet(params, true);
    applet.inject(containerId.current);
  }, [isScriptLoaded, appName]);

  // Dynamically resize GeoGebra applet when container dimensions change (Fullscreen / Sidebar toggle)
  useEffect(() => {
    if (!isAppletReady || !apiRef.current) return;

    const handleResize = () => {
      const wrapper = document.querySelector('.ggb-canvas-wrapper');
      if (wrapper && apiRef.current && typeof apiRef.current.setSize === 'function') {
        const w = wrapper.clientWidth;
        const h = wrapper.clientHeight;
        if (w > 100 && h > 100) {
          try {
            apiRef.current.setSize(Math.floor(w), Math.floor(h));
          } catch (e) {
            console.warn('GeoGebra resize notice:', e);
          }
        }
      }
    };

    handleResize();
    const t1 = setTimeout(handleResize, 100);
    const t2 = setTimeout(handleResize, 350);

    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener('resize', handleResize);
    };
  }, [isAppletReady, isFullscreen, isSidebarCollapsed]);

  const logEvent = (type: string, details: string) => {
    const time = new Date().toLocaleTimeString('vi-VN');
    setEventLogs((prev) => [{ time, event: type, details }, ...prev.slice(0, 49)]);
  };

  const refreshObjectsList = (apiOverride?: any) => {
    const api = apiOverride || apiRef.current;
    if (!api || typeof api.getAllObjectNames !== 'function') return;

    try {
      const names = api.getAllObjectNames();
      const list = names.map((name: string) => ({
        name,
        type: api.getObjectType(name),
        valueString: api.getValueString(name),
        visible: api.getVisible(name),
      }));
      setObjectsList(list);
    } catch (e) {
      // Ignore background sync errors
    }
  };

  // Run GeoGebra JS Command
  const runCommand = (cmd: string) => {
    if (!cmd.trim()) return;
    const api = apiRef.current;

    if (api && typeof api.evalCommand === 'function') {
      try {
        const success = api.evalCommand(cmd);
        logEvent('COMMAND', `Thực thi: "${cmd}" ${success ? '✓' : ''}`);
        if (!commandHistory.includes(cmd)) {
          setCommandHistory((prev) => [cmd, ...prev.slice(0, 19)]);
        }
        refreshObjectsList(api);
      } catch (err) {
        logEvent('ERROR', `Lỗi lệnh "${cmd}": ${String(err)}`);
      }
    } else {
      // Fallback iframe posting or alert
      logEvent('WARN', 'GGB API chưa kết nối hoàn toàn, vui lòng thử lại sau giây lát.');
    }
  };

  // Execute Vietnamese Natural Language Prompt (using Gemini 2.5 Flash AI with local fallback)
  const handleExecuteVietnamesePrompt = async (promptText?: string) => {
    const textToParse = promptText !== undefined ? promptText : vietnameseInput;
    if (!textToParse.trim() || isAnalyzingPrompt) return;

    setIsAnalyzingPrompt(true);
    try {
      const parsed = await parseVietnameseGeoGebraCommandWithAI(textToParse);
      setLastParsedResult(parsed);

      if (parsed.isClearCommand) {
        executeMacro('clear_all');
        return;
      }

      if (parsed.commands.length > 0) {
        parsed.commands.forEach((cmd) => {
          runCommand(cmd);
        });
        logEvent('VIETNAMESE', `[Lệnh Tiếng Việt AI] "${textToParse}" ➔ ${parsed.commands.join(' | ')}`);
      } else {
        logEvent('WARN', `Không thể phân tích cú pháp Tiếng Việt: "${textToParse}"`);
      }
    } catch (error) {
      console.warn('[Vietnamese Prompt Error]', error);
    } finally {
      setIsAnalyzingPrompt(false);
    }
  };

  // Quick Macro Construction Helpers
  const executeMacro = (macroType: string) => {
    switch (macroType) {
      case 'euler_line':
        runCommand('A = (1, 1)');
        runCommand('B = (7, 2)');
        runCommand('C = (3, 6)');
        runCommand('polyABC = Polygon(A, B, C)');
        runCommand('M_a = Midpoint(B, C)');
        runCommand('M_b = Midpoint(A, C)');
        runCommand('G = Intersect(Segment(A, M_a), Segment(B, M_b))');
        runCommand('SetColor(G, "orange")');
        runCommand('SetCaption(G, "G (Trọng tâm)")');
        runCommand('h_A = PerpendicularLine(A, Line(B, C))');
        runCommand('h_B = PerpendicularLine(B, Line(A, C))');
        runCommand('H = Intersect(h_A, h_B)');
        runCommand('SetColor(H, "red")');
        runCommand('SetCaption(H, "H (Trực tâm)")');
        runCommand('c_ngoai = Circumcircle(A, B, C)');
        runCommand('O = Center(c_ngoai)');
        runCommand('SetColor(O, "green")');
        runCommand('SetCaption(O, "O (Tâm ngoại tiếp)")');
        runCommand('d_Euler = Line(H, O)');
        runCommand('SetColor(d_Euler, "magenta")');
        runCommand('SetLineStyle(d_Euler, 1)');
        break;

      case 'feuerbach_circle':
        runCommand('A = (0, 0)');
        runCommand('B = (8, 0)');
        runCommand('C = (2, 6)');
        runCommand('t = Polygon(A, B, C)');
        runCommand('M1 = Midpoint(B, C)');
        runCommand('M2 = Midpoint(A, C)');
        runCommand('M3 = Midpoint(A, B)');
        runCommand('c_9pts = Circumcircle(M1, M2, M3)');
        runCommand('SetColor(c_9pts, "red")');
        runCommand('SetLineThickness(c_9pts, 3)');
        break;

      case 'incircle_incenter':
        runCommand('A = (1, 1)');
        runCommand('B = (8, 2)');
        runCommand('C = (4, 7)');
        runCommand('poly = Polygon(A, B, C)');
        runCommand('bA = AngleBisector(B, A, C)');
        runCommand('bB = AngleBisector(A, B, C)');
        runCommand('I = Intersect(bA, bB)');
        runCommand('SetColor(I, "magenta")');
        runCommand('SetCaption(I, "I (Tâm nội tiếp)")');
        runCommand('d_vuong = PerpendicularLine(I, Line(A, B))');
        runCommand('D = Intersect(d_vuong, Line(A, B))');
        runCommand('c_noitiep = Circle(I, D)');
        runCommand('SetColor(c_noitiep, "magenta")');
        runCommand('SetLineThickness(c_noitiep, 2)');
        break;

      case 'tangents_circle':
        runCommand('O = (3, 3)');
        runCommand('c = Circle(O, 2.5)');
        runCommand('P = (8, 5)');
        runCommand('t1 = Tangent(P, c)');
        runCommand('SetColor(t1, "blue")');
        break;

      case 'cube_3d':
        setAppName('3d');
        setTimeout(() => {
          runCommand('A = (0, 0, 0)');
          runCommand('B = (4, 0, 0)');
          runCommand('cube1 = Cube(A, B)');
          runCommand('SetColor(cube1, "cyan")');
        }, 300);
        break;

      case 'tetrahedron_3d':
        setAppName('3d');
        setTimeout(() => {
          runCommand('A = (0, 0, 0)');
          runCommand('B = (4, 0, 0)');
          runCommand('tetra1 = Tetrahedron(A, B)');
          runCommand('SetColor(tetra1, "yellow")');
        }, 300);
        break;

      case 'pyramid_3d':
        setAppName('3d');
        setTimeout(() => {
          runCommand('A = (0, 0, 0)');
          runCommand('B = (4, 0, 0)');
          runCommand('C = (4, 4, 0)');
          runCommand('D = (0, 4, 0)');
          runCommand('polyBase = Polygon(A, B, C, D)');
          runCommand('pyr = Pyramid(polyBase, (2, 2, 5))');
          runCommand('SetColor(pyr, "orange")');
        }, 300);
        break;

      case 'sphere_3d':
        setAppName('3d');
        setTimeout(() => {
          runCommand('O = (0, 0, 0)');
          runCommand('sph = Sphere(O, 3)');
          runCommand('SetColor(sph, "purple")');
        }, 300);
        break;

      case 'cubic_function':
        setAppName('graphing');
        setTimeout(() => {
          runCommand('f(x) = x^3 - 3*x + 1');
          runCommand('E1 = Extremum(f)');
          runCommand('I = InflectionPoint(f)');
          runCommand('SetColor(f, "blue")');
          runCommand('SetColor(E1, "red")');
          runCommand('SetColor(I, "green")');
        }, 300);
        break;

      case 'rational_function':
        setAppName('graphing');
        setTimeout(() => {
          runCommand('f(x) = (2*x + 1) / (x - 1)');
          runCommand('asym = Asymptote(f)');
          runCommand('SetColor(f, "teal")');
          runCommand('SetColor(asym, "red")');
          runCommand('SetLineStyle(asym, 1)');
        }, 300);
        break;

      case 'tangent_curve':
        setAppName('graphing');
        setTimeout(() => {
          runCommand('f(x) = -0.5*x^2 + 3*x + 1');
          runCommand('x_0 = 2');
          runCommand('P = (x_0, f(x_0))');
          runCommand('t = Tangent(P, f)');
          runCommand('SetColor(t, "magenta")');
        }, 300);
        break;

      case 'integral_area':
        setAppName('graphing');
        setTimeout(() => {
          runCommand('f(x) = -x^2 + 4');
          runCommand('g(x) = x + 2');
          runCommand('A = IntegralBetween(f, g, -2, 1)');
          runCommand('SetColor(A, "amber")');
        }, 300);
        break;

      case 'ellipse':
        runCommand('F1 = (-3, 0)');
        runCommand('F2 = (3, 0)');
        runCommand('A = (5, 0)');
        runCommand('e1 = Ellipse(F1, F2, A)');
        runCommand('SetColor(e1, "emerald")');
        break;

      case 'parabola':
        runCommand('F = (0, 2)');
        runCommand('d = Line((0, -2), (4, -2))');
        runCommand('p1 = Parabola(F, d)');
        runCommand('SetColor(p1, "indigo")');
        break;

      case 'hyperbola':
        runCommand('F1 = (-4, 0)');
        runCommand('F2 = (4, 0)');
        runCommand('A = (2, 0)');
        runCommand('h1 = Hyperbola(F1, F2, A)');
        runCommand('SetColor(h1, "rose")');
        break;

      case 'points_abc':
        runCommand('A = (2, 3)');
        runCommand('B = (7, 6)');
        runCommand('C = (4, -1)');
        break;

      case 'triangle_abc':
        runCommand('A = (2, 3)');
        runCommand('B = (7, 6)');
        runCommand('C = (4, -1)');
        runCommand('t1 = Polygon(A, B, C)');
        break;

      case 'circle_center_radius':
        runCommand('O = (3, 3)');
        runCommand('c1 = Circle(O, 4)');
        break;

      case 'circumcircle':
        runCommand('A = (1, 2)');
        runCommand('B = (6, 5)');
        runCommand('C = (3, -2)');
        runCommand('c_ngoaitiep = Circumcircle(A, B, C)');
        break;

      case 'medians_centroid':
        runCommand('A = (0, 0)');
        runCommand('B = (6, 0)');
        runCommand('C = (2, 5)');
        runCommand('poly1 = Polygon(A, B, C)');
        runCommand('M_a = Midpoint(B, C)');
        runCommand('M_b = Midpoint(A, C)');
        runCommand('M_c = Midpoint(A, B)');
        runCommand('s_a = Segment(A, M_a)');
        runCommand('s_b = Segment(B, M_b)');
        runCommand('s_c = Segment(C, M_c)');
        runCommand('G = Intersect(s_a, s_b)');
        runCommand('SetColor(G, "red")');
        break;

      case 'bisectors':
        runCommand('A = (1, 1)');
        runCommand('B = (7, 2)');
        runCommand('C = (3, 6)');
        runCommand('Polygon(A, B, C)');
        runCommand('b_A = AngleBisector(B, A, C)');
        runCommand('b_B = AngleBisector(A, B, C)');
        runCommand('I = Intersect(b_A, b_B)');
        runCommand('SetColor(I, "magenta")');
        break;

      case 'perpendicular_bisector':
        runCommand('A = (2, 1)');
        runCommand('B = (8, 4)');
        runCommand('Segment(A, B)');
        runCommand('d_trungtruc = PerpendicularBisector(A, B)');
        runCommand('SetColor(d_trungtruc, "blue")');
        break;

      case 'reflect_line':
        runCommand('P = (2, 5)');
        runCommand('L = Line((0,0), (6,6))');
        runCommand('P_doi_xung = Reflect(P, L)');
        runCommand('SetColor(P_doi_xung, "orange")');
        break;

      case 'rotate_point':
        runCommand('Center = (3, 3)');
        runCommand('Point1 = (5, 3)');
        runCommand('RotatedPoint = Rotate(Point1, 60°, Center)');
        runCommand('Circle(Center, Point1)');
        break;

      case 'translate_vector':
        runCommand('A = (1, 2)');
        runCommand('u = Vector((3, 2))');
        runCommand('A_tinhtien = Translate(A, u)');
        break;

      case 'angle_measurement':
        runCommand('A = (1, 1)');
        runCommand('B = (5, 2)');
        runCommand('C = (2, 5)');
        runCommand('Segment(B, A)');
        runCommand('Segment(B, C)');
        runCommand('g1 = Angle(A, B, C)');
        break;

      case 'clear_all':
        if (apiRef.current && typeof apiRef.current.newConstruction === 'function') {
          apiRef.current.newConstruction();
          logEvent('CLEAR', 'Đã làm sạch bảng vẽ GeoGebra.');
        } else {
          runCommand('Delete(A)');
        }
        break;

      default:
        break;
    }
  };

  // Toggle Object Visibility via JS API
  const toggleVisibility = (objName: string, currentVisible: boolean) => {
    const api = apiRef.current;
    if (api && typeof api.setVisible === 'function') {
      api.setVisible(objName, !currentVisible);
      refreshObjectsList(api);
      logEvent('VISIBILITY', `Chuyển trạng thái ẩn/hiện đối tượng ${objName}`);
    }
  };

  // Export Canvas Image
  const exportImage = () => {
    const api = apiRef.current;
    if (api && typeof api.getPNGBase64 === 'function') {
      try {
        const pngBase64 = api.getPNGBase64(1, false, 300);
        const link = document.createElement('a');
        link.href = 'data:image/png;base64,' + pngBase64;
        link.download = `geogebra-dung-hinh-${Date.now()}.png`;
        link.click();
        logEvent('EXPORT', 'Đã xuất ảnh PNG bảng vẽ GeoGebra thành công.');
      } catch (err) {
        alert('Không thể xuất hình ảnh lúc này.');
      }
    } else {
      alert('Vui lòng chờ bảng vẽ khởi tạo hoàn tất.');
    }
  };

  return (
    <div
      ref={wrapperRef}
      className={`transition-all ${
        isFullscreen
          ? 'fixed inset-0 z-50 bg-slate-950 flex flex-col w-screen h-screen overflow-hidden p-2 sm:p-3'
          : 'w-full flex flex-col bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl'
      }`}
    >
      {/* GeoGebra Header Toolbar */}
      <div className="bg-slate-900 border-b border-slate-800 p-2.5 sm:p-3.5 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl text-white shadow-lg shadow-indigo-500/20">
            <Compass className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-extrabold text-sm sm:text-base text-white tracking-tight">
                BẢNG VẼ & DỰNG HÌNH GEOGEBRA
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-md">
                GeoGebra Web API
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Dựng điểm, đường thẳng, đường tròn, góc & phép biến hình điều khiển trực tiếp bằng JavaScript API
            </p>
          </div>
        </div>

        {/* Perspective / Mode Switcher & Fullscreen Button */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            {(
              [
                { id: 'geometry', label: '📐 Hình học 2D' },
                { id: 'graphing', label: '📈 Đồ thị Hàm số' },
                { id: '3d', label: '🧊 Hình học 3D' },
                { id: 'cas', label: '🧮 Đại số CAS' },
                { id: 'classic', label: '🛠️ GeoGebra Full' },
              ] as const
            ).map((mode) => (
              <button
                key={mode.id}
                onClick={() => setAppName(mode.id)}
                className={`px-2.5 py-1.2 rounded-lg font-bold transition-all ${
                  appName === mode.id
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-md ${
              isSidebarCollapsed
                ? 'bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-200 border border-emerald-500/40'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
            title={isSidebarCollapsed ? 'Mở lại bảng điều khiển' : 'Thu gọn bảng điều khiển'}
          >
            {isSidebarCollapsed ? (
              <>
                <PanelLeftOpen className="w-4 h-4 text-emerald-400" />
                <span className="hidden sm:inline">Mở bảng điều khiển</span>
              </>
            ) : (
              <>
                <PanelLeftClose className="w-4 h-4 text-indigo-300" />
                <span className="hidden sm:inline">Thu gọn điều khiển</span>
              </>
            )}
          </button>

          <button
            onClick={toggleFullscreen}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-md ${
              isFullscreen
                ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40'
                : 'bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40'
            }`}
            title={isFullscreen ? 'Thoát toàn màn hình (Esc)' : 'Mở toàn màn hình'}
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-4 h-4 text-amber-400" />
                <span>Thoát toàn màn hình</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-4 h-4 text-indigo-300" />
                <span>Toàn màn hình</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Content Workspace Grid */}
      <div className={`grid grid-cols-1 lg:grid-cols-12 gap-0 ${isFullscreen ? 'flex-1 min-h-0 h-[calc(100vh-80px)]' : 'min-h-[660px]'}`}>
        {/* LEFT SIDE: Control Panel & Vietnamese Command Interpreter */}
        {!isSidebarCollapsed && (
          <div className={`lg:col-span-4 xl:col-span-3.5 bg-slate-900/90 flex flex-col p-3 sm:p-4 gap-4 border-b lg:border-b-0 lg:border-r border-slate-800 overflow-y-auto ${isFullscreen ? 'h-full max-h-full' : 'max-h-[680px]'}`}>
          {/* Control Panel Navigation Tabs */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px] sm:text-xs w-full overflow-x-auto">
              <button
                onClick={() => setActiveTabPanel('vietnamese')}
                className={`flex-1 min-w-[110px] py-1.5 px-2 rounded-lg font-bold flex items-center justify-center gap-1 transition-all ${
                  activeTabPanel === 'vietnamese'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Terminal className="w-3.5 h-3.5 text-amber-300" />
                <span>Lệnh Tiếng Việt</span>
              </button>

              <button
                onClick={() => setActiveTabPanel('construction')}
                className={`flex-1 min-w-[85px] py-1.5 px-2 rounded-lg font-bold flex items-center justify-center gap-1 transition-all ${
                  activeTabPanel === 'construction'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Dựng Hình</span>
              </button>

              <button
                onClick={() => setActiveTabPanel('commands')}
                className={`flex-1 min-w-[80px] py-1.5 px-2 rounded-lg font-bold flex items-center justify-center gap-1 transition-all ${
                  activeTabPanel === 'commands'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>JS Console</span>
              </button>

              <button
                onClick={() => setActiveTabPanel('objects')}
                className={`flex-1 min-w-[75px] py-1.5 px-2 rounded-lg font-bold flex items-center justify-center gap-1 transition-all ${
                  activeTabPanel === 'objects'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Table className="w-3.5 h-3.5" />
                <span>Đối Tượng</span>
              </button>

              <button
                onClick={() => setActiveTabPanel('logs')}
                className={`flex-1 min-w-[65px] py-1.5 px-2 rounded-lg font-bold flex items-center justify-center gap-1 transition-all ${
                  activeTabPanel === 'logs'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Nhật Ký</span>
              </button>
            </div>
          </div>

          {/* TAB 0: VIETNAMESE NATURAL LANGUAGE COMMAND INTERPRETER */}
          {activeTabPanel === 'vietnamese' && (
            <div className="space-y-4 text-xs">
              {isVietnamesePanelClosed ? (
                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800/90 flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-slate-500" />
                    <span>Hộp lệnh Tiếng Việt đã đóng.</span>
                  </span>
                  <button
                    onClick={() => {
                      setIsVietnamesePanelClosed(false);
                      setIsVietnamesePanelMinimized(false);
                    }}
                    className="px-2.5 py-1 bg-indigo-600/80 hover:bg-indigo-600 text-white rounded-lg text-[11px] font-semibold transition-all flex items-center gap-1 shadow-sm"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Mở lại</span>
                  </button>
                </div>
              ) : (
                <div
                  className={`bg-slate-950 p-3.5 rounded-2xl border border-slate-800/90 space-y-3 shadow-inner relative transition-all flex flex-col ${
                    isResizingVietnamese ? 'select-none ring-1 ring-indigo-500/40' : ''
                  }`}
                  style={
                    !isVietnamesePanelMinimized
                      ? {
                          height: `${vietnamesePanelHeight}px`,
                          maxHeight: '550px',
                          minHeight: '130px',
                        }
                      : {}
                  }
                >
                  <div className="flex items-center justify-between shrink-0 border-b border-slate-800/60 pb-2">
                    <label className="font-bold text-slate-200 flex items-center gap-1.5">
                      <Terminal className="w-4 h-4 text-amber-400" />
                      <span>Nhập câu lệnh bằng Tiếng Việt:</span>
                    </label>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30 font-semibold hidden sm:inline-block">
                        Tự động bóc tách
                      </span>
                      {/* Minimize (-) Button */}
                      <button
                        type="button"
                        onClick={() => setIsVietnamesePanelMinimized(!isVietnamesePanelMinimized)}
                        title={isVietnamesePanelMinimized ? "Mở rộng hộp lệnh" : "Thu nhỏ hộp lệnh (-)"}
                        className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors flex items-center justify-center w-6 h-6"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      {/* Close (x) Button */}
                      <button
                        type="button"
                        onClick={() => setIsVietnamesePanelClosed(true)}
                        title="Đóng hộp lệnh (x)"
                        className="p-1 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors flex items-center justify-center w-6 h-6"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {!isVietnamesePanelMinimized && (
                    <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                      <div className="flex flex-col sm:flex-row items-stretch gap-2 pt-1">
                        <input
                          type="text"
                          value={vietnameseInput}
                          onChange={(e) => setVietnameseInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleExecuteVietnamesePrompt();
                          }}
                          placeholder="Ví dụ: vẽ đồ thị y = 3x + 1 hoặc vẽ đường tròn tâm A bán kính 4"
                          className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-amber-300 font-medium focus:outline-none focus:border-indigo-500 shadow-sm"
                        />
                        <button
                          onClick={() => handleExecuteVietnamesePrompt()}
                          disabled={isAnalyzingPrompt}
                          className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {isAnalyzingPrompt ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-300" />
                              <span>Đang chuyển đổi...</span>
                            </>
                          ) : (
                            <>
                              <Send className="w-3.5 h-3.5" />
                              <span>Thực thi</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Parsed Output Card */}
                      {lastParsedResult && (
                        <div className="bg-slate-900/90 border border-indigo-500/30 p-3 rounded-xl space-y-2 text-[11px] animate-fadeIn">
                          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                            <span className="font-bold text-slate-300 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Kết quả phân tích cú pháp Tiếng Việt:</span>
                            </span>
                            <span className="text-slate-500 font-mono text-[10px]">
                              ggbApplet.evalCommand()
                            </span>
                          </div>

                          <div className="font-mono text-indigo-300 bg-slate-950 p-2 rounded-lg border border-slate-800 space-y-1">
                            <p className="text-slate-400 text-[10px] font-sans">Lệnh GeoGebra Chuẩn (Tiếng Anh):</p>
                            {lastParsedResult.commands.length > 0 ? (
                              lastParsedResult.commands.map((cmd, idx) => (
                                <div key={idx} className="font-bold text-amber-300">
                                  ➔ {cmd}
                                </div>
                              ))
                            ) : (
                              <div className="text-slate-500 italic">
                                {lastParsedResult.isClearCommand ? 'Làm mới bảng vẽ' : 'Không có lệnh'}
                              </div>
                            )}
                          </div>

                          <p className="text-slate-300 italic">
                            💡 <strong>Mô tả:</strong> {lastParsedResult.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Resizable drag handle at bottom center */}
                  {!isVietnamesePanelMinimized && (
                    <div
                      onPointerDown={handleVietnamesePointerDown}
                      onPointerMove={handleVietnamesePointerMove}
                      onPointerUp={handleVietnamesePointerUp}
                      onPointerCancel={handleVietnamesePointerUp}
                      className={`absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-20 h-3.5 border rounded-full flex items-center justify-center cursor-ns-resize transition-all z-20 touch-none group shadow-md ${
                        isResizingVietnamese
                          ? 'bg-indigo-600 border-indigo-400 text-white opacity-100 scale-105 ring-2 ring-indigo-500/50'
                          : 'bg-slate-800 hover:bg-indigo-600 border-slate-700/90 text-slate-400 hover:text-white opacity-85 hover:opacity-100 hover:scale-105'
                      }`}
                      title="Kéo để thay đổi chiều cao hộp lệnh"
                    >
                      <GripHorizontal className="w-4 h-4 text-slate-300 group-hover:text-white" />
                    </div>
                  )}
                </div>
              )}

              {/* Category Sample Prompt Chips */}
              <div className="space-y-3">
                <span className="font-bold text-slate-300 text-[11px] flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Mẫu lệnh Tiếng Việt gợi ý sẵn (Bấm để thử ngay):</span>
                </span>

                <div className="space-y-2.5">
                  {/* Category 1: Đồ thị */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400">
                      📈 1. Đồ thị & Hàm số:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        'vẽ đồ thị y = 3x + 1',
                        'vẽ đồ thị y = x^2 - 4x + 3',
                        'vẽ hàm số f(x) = sin(x)',
                        'vẽ đồ thị x^2 + y^2 = 25',
                      ].map((sample) => (
                        <button
                          key={sample}
                          onClick={() => {
                            setVietnameseInput(sample);
                            handleExecuteVietnamesePrompt(sample);
                          }}
                          className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-[11px] text-slate-300 hover:text-amber-300 transition-colors text-left"
                        >
                          + "{sample}"
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Category 2: Đường tròn */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">
                      ⭕ 2. Đường tròn:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        'vẽ đường tròn tâm A bán kính 4',
                        'vẽ đường tròn tâm O bán kính 5',
                        'vẽ đường tròn qua 3 điểm A, B, C',
                      ].map((sample) => (
                        <button
                          key={sample}
                          onClick={() => {
                            setVietnameseInput(sample);
                            handleExecuteVietnamesePrompt(sample);
                          }}
                          className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-[11px] text-slate-300 hover:text-amber-300 transition-colors text-left"
                        >
                          + "{sample}"
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Category 3: Điểm & Hình */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                      🔺 3. Điểm, Tam giác & Đoạn thẳng:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        'vẽ điểm A(2, 3)',
                        'vẽ điểm B(7, 6)',
                        'vẽ tam giác A, B, C',
                        'vẽ đoạn thẳng AB',
                      ].map((sample) => (
                        <button
                          key={sample}
                          onClick={() => {
                            setVietnameseInput(sample);
                            handleExecuteVietnamesePrompt(sample);
                          }}
                          className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-[11px] text-slate-300 hover:text-amber-300 transition-colors text-left"
                        >
                          + "{sample}"
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Category 4: Đường đặc biệt */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                      📐 4. Đường đặc biệt & Phép biến hình:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        'vẽ trung điểm M của AB',
                        'vẽ đường trung trực của AB',
                        'vẽ đường phân giác góc ABC',
                        'phép quay A 60 độ quanh O',
                        'xóa tất cả',
                      ].map((sample) => (
                        <button
                          key={sample}
                          onClick={() => {
                            setVietnameseInput(sample);
                            handleExecuteVietnamesePrompt(sample);
                          }}
                          className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-[11px] text-slate-300 hover:text-amber-300 transition-colors text-left"
                        >
                          + "{sample}"
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: QUICK GEOMETRY CONSTRUCTION MACROS */}
          {activeTabPanel === 'construction' && (
            <div className="space-y-4 text-xs">
              {/* Group 1: Points, Lines & Triangles */}
              <div className="space-y-2">
                <span className="font-bold text-sky-400 uppercase tracking-wider text-[10px] flex items-center gap-1">
                  <PlusCircle className="w-3 h-3" />
                  <span>1. Điểm, Đoạn Thẳng & Tam Giác</span>
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => executeMacro('points_abc')}
                    className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-left font-semibold text-slate-200 hover:text-white transition-all flex items-center gap-1.5"
                  >
                    <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                    <span>3 Điểm A, B, C</span>
                  </button>

                  <button
                    onClick={() => executeMacro('triangle_abc')}
                    className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-left font-semibold text-slate-200 hover:text-white transition-all flex items-center gap-1.5"
                  >
                    <Triangle className="w-3.5 h-3.5 text-amber-400" />
                    <span>Tam Giác ABC</span>
                  </button>
                </div>
              </div>

              {/* Group 2: Classical Centers & Special Circles */}
              <div className="space-y-2">
                <span className="font-bold text-purple-400 uppercase tracking-wider text-[10px] flex items-center gap-1">
                  <Circle className="w-3 h-3" />
                  <span>2. Đường Tròn & Các Điểm Đồng Quy</span>
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => executeMacro('circumcircle')}
                    className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-left font-semibold text-slate-200 hover:text-white transition-all flex items-center gap-1.5"
                  >
                    <Compass className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Đ.Tròn Ngoại Tiếp</span>
                  </button>

                  <button
                    onClick={() => executeMacro('incircle_incenter')}
                    className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-left font-semibold text-slate-200 hover:text-white transition-all flex items-center gap-1.5"
                  >
                    <Circle className="w-3.5 h-3.5 text-pink-400" />
                    <span>Đ.Tròn Nội Tiếp (I)</span>
                  </button>

                  <button
                    onClick={() => executeMacro('euler_line')}
                    className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-left font-semibold text-slate-200 hover:text-white transition-all flex items-center gap-1.5 col-span-2 text-rose-300"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                    <span>⭐ Đường thẳng Euler (H, G, O - HG=2GO)</span>
                  </button>

                  <button
                    onClick={() => executeMacro('feuerbach_circle')}
                    className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-left font-semibold text-slate-200 hover:text-white transition-all flex items-center gap-1.5"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>Đ.Tròn 9 Điểm Feuerbach</span>
                  </button>

                  <button
                    onClick={() => executeMacro('medians_centroid')}
                    className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-left font-semibold text-slate-200 hover:text-white transition-all flex items-center gap-1.5"
                  >
                    <Zap className="w-3.5 h-3.5 text-red-400" />
                    <span>Trung Tuyến & G</span>
                  </button>

                  <button
                    onClick={() => executeMacro('bisectors')}
                    className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-left font-semibold text-slate-200 hover:text-white transition-all flex items-center gap-1.5"
                  >
                    <Spline className="w-3.5 h-3.5 text-pink-400" />
                    <span>Phân Giác & I</span>
                  </button>

                  <button
                    onClick={() => executeMacro('perpendicular_bisector')}
                    className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-left font-semibold text-slate-200 hover:text-white transition-all flex items-center gap-1.5"
                  >
                    <Layers className="w-3.5 h-3.5 text-sky-400" />
                    <span>Trung Trực Đoạn Thẳng</span>
                  </button>

                  <button
                    onClick={() => executeMacro('tangents_circle')}
                    className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-left font-semibold text-slate-200 hover:text-white transition-all flex items-center gap-1.5 col-span-2"
                  >
                    <Circle className="w-3.5 h-3.5 text-cyan-400" />
                    <span>2 Tiếp Tuyến Từ Điểm Đến Đ.Tròn</span>
                  </button>
                </div>
              </div>

              {/* Group 3: 3D Geometry */}
              <div className="space-y-2">
                <span className="font-bold text-amber-400 uppercase tracking-wider text-[10px] flex items-center gap-1">
                  <Square className="w-3 h-3" />
                  <span>3. Hình Học Không Gian 3D</span>
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => executeMacro('cube_3d')}
                    className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-left font-semibold text-slate-200 hover:text-white transition-all flex items-center gap-1.5"
                  >
                    <span>🧊 Khối Lập Phương</span>
                  </button>

                  <button
                    onClick={() => executeMacro('tetrahedron_3d')}
                    className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-left font-semibold text-slate-200 hover:text-white transition-all flex items-center gap-1.5"
                  >
                    <span>🔺 Tứ Diện Đều</span>
                  </button>

                  <button
                    onClick={() => executeMacro('pyramid_3d')}
                    className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-left font-semibold text-slate-200 hover:text-white transition-all flex items-center gap-1.5"
                  >
                    <span>⛺ Khối Chóp S.ABCD</span>
                  </button>

                  <button
                    onClick={() => executeMacro('sphere_3d')}
                    className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-left font-semibold text-slate-200 hover:text-white transition-all flex items-center gap-1.5"
                  >
                    <span>🌐 Mặt Cầu 3D</span>
                  </button>
                </div>
              </div>

              {/* Group 4: Calculus & Functions */}
              <div className="space-y-2">
                <span className="font-bold text-teal-400 uppercase tracking-wider text-[10px] flex items-center gap-1">
                  <Activity className="w-3 h-3" />
                  <span>4. Khảo Sát Hàm Số & Giải Tích</span>
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => executeMacro('cubic_function')}
                    className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-left font-semibold text-slate-200 hover:text-white transition-all flex items-center gap-1.5"
                  >
                    <span>📈 Hàm Bậc 3 & Cực Trị</span>
                  </button>

                  <button
                    onClick={() => executeMacro('rational_function')}
                    className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-left font-semibold text-slate-200 hover:text-white transition-all flex items-center gap-1.5"
                  >
                    <span>📊 Hàm Phân Thức & Tiệm Cận</span>
                  </button>

                  <button
                    onClick={() => executeMacro('tangent_curve')}
                    className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-left font-semibold text-slate-200 hover:text-white transition-all flex items-center gap-1.5"
                  >
                    <span>📏 Tiếp Tuyến Tại Điểm</span>
                  </button>

                  <button
                    onClick={() => executeMacro('integral_area')}
                    className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-left font-semibold text-slate-200 hover:text-white transition-all flex items-center gap-1.5"
                  >
                    <span>🎨 Tích Phân & Diện Tích</span>
                  </button>
                </div>
              </div>

              {/* Group 5: Conic Curves */}
              <div className="space-y-2">
                <span className="font-bold text-rose-400 uppercase tracking-wider text-[10px] flex items-center gap-1">
                  <Circle className="w-3 h-3" />
                  <span>5. Đường Conic (Elip, Parabol, Hypebol)</span>
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    onClick={() => executeMacro('ellipse')}
                    className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-center font-semibold text-slate-200 hover:text-emerald-300 transition-all text-[11px]"
                  >
                    <span>🟢 Elip</span>
                  </button>

                  <button
                    onClick={() => executeMacro('parabola')}
                    className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-center font-semibold text-slate-200 hover:text-indigo-300 transition-all text-[11px]"
                  >
                    <span>🔵 Parabol</span>
                  </button>

                  <button
                    onClick={() => executeMacro('hyperbola')}
                    className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-center font-semibold text-slate-200 hover:text-rose-300 transition-all text-[11px]"
                  >
                    <span>🔴 Hypebol</span>
                  </button>
                </div>
              </div>

              {/* Group 6: Transformations */}
              <div className="space-y-2">
                <span className="font-bold text-emerald-400 uppercase tracking-wider text-[10px] flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>6. Phép Biến Hình (Transformations)</span>
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => executeMacro('reflect_line')}
                    className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-left font-semibold text-slate-200 hover:text-white transition-all flex items-center gap-1.5"
                  >
                    <span>🪞 Đối Xứng Trục</span>
                  </button>

                  <button
                    onClick={() => executeMacro('rotate_point')}
                    className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-left font-semibold text-slate-200 hover:text-white transition-all flex items-center gap-1.5"
                  >
                    <span>🔄 Phép Quay 60°</span>
                  </button>

                  <button
                    onClick={() => executeMacro('translate_vector')}
                    className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-left font-semibold text-slate-200 hover:text-white transition-all flex items-center gap-1.5 col-span-2"
                  >
                    <span>➡️ Phép Tịnh Tiến Véctơ</span>
                  </button>
                </div>
              </div>

              {/* Group 7: Measurement */}
              <div className="space-y-2">
                <span className="font-bold text-amber-400 uppercase tracking-wider text-[10px] flex items-center gap-1">
                  <Activity className="w-3 h-3" />
                  <span>7. Đo Đạc Góc & Khoảng Cách</span>
                </span>
                <button
                  onClick={() => executeMacro('angle_measurement')}
                  className="w-full p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-left font-semibold text-amber-300 transition-all flex items-center gap-1.5"
                >
                  📐 Đo Góc ∠ABC & Hiển Thị Bằng JavaScript
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: JAVASCRIPT CONSOLE COMMAND RUNNER */}
          {activeTabPanel === 'commands' && (
            <div className="space-y-3 text-xs">
              {isJsConsoleClosed ? (
                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800/90 flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-slate-500" />
                    <span>JS Console đã đóng.</span>
                  </span>
                  <button
                    onClick={() => {
                      setIsJsConsoleClosed(false);
                      setIsJsConsoleMinimized(false);
                    }}
                    className="px-2.5 py-1 bg-indigo-600/80 hover:bg-indigo-600 text-white rounded-lg text-[11px] font-semibold transition-all flex items-center gap-1 shadow-sm"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Mở lại</span>
                  </button>
                </div>
              ) : (
                <div
                  className={`bg-slate-950 p-3.5 rounded-2xl border border-slate-800/90 space-y-3 shadow-inner relative transition-all flex flex-col ${
                    isResizingJsConsole ? 'select-none ring-1 ring-indigo-500/40' : ''
                  }`}
                  style={
                    !isJsConsoleMinimized
                      ? {
                          height: `${jsConsolePanelHeight}px`,
                          maxHeight: '550px',
                          minHeight: '130px',
                        }
                      : {}
                  }
                >
                  <div className="flex items-center justify-between shrink-0 border-b border-slate-800/60 pb-2">
                    <label className="font-bold text-slate-300 flex items-center gap-1.5">
                      <Code2 className="w-4 h-4 text-indigo-400" />
                      <span>Nhập lệnh GeoGebra JS Command:</span>
                    </label>
                    <div className="flex items-center gap-1.5">
                      {/* Minimize (-) Button */}
                      <button
                        type="button"
                        onClick={() => setIsJsConsoleMinimized(!isJsConsoleMinimized)}
                        title={isJsConsoleMinimized ? "Mở rộng" : "Thu nhỏ (-)"}
                        className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors flex items-center justify-center w-6 h-6"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      {/* Close (x) Button */}
                      <button
                        type="button"
                        onClick={() => setIsJsConsoleClosed(true)}
                        title="Đóng hộp lệnh (x)"
                        className="p-1 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors flex items-center justify-center w-6 h-6"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {!isJsConsoleMinimized && (
                    <div className="flex-1 overflow-y-auto space-y-3 pt-1 pr-1">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={commandInput}
                          onChange={(e) => setCommandInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') runCommand(commandInput);
                          }}
                          placeholder="Ví dụ: f(x) = x^2 - 4x + 3 hoặc Circle((0,0), 3)"
                          className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 font-mono text-xs text-amber-300 focus:outline-none focus:border-indigo-500"
                        />
                        <button
                          onClick={() => runCommand(commandInput)}
                          className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl flex items-center gap-1 transition-all"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>Chạy</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Visual drag-handle at center of bottom border with pointer events */}
                  {!isJsConsoleMinimized && (
                    <div
                      onPointerDown={handleJsConsolePointerDown}
                      onPointerMove={handleJsConsolePointerMove}
                      onPointerUp={handleJsConsolePointerUp}
                      onPointerCancel={handleJsConsolePointerUp}
                      className={`absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-20 h-3.5 border rounded-full flex items-center justify-center cursor-ns-resize transition-all z-20 touch-none group shadow-md ${
                        isResizingJsConsole
                          ? 'bg-indigo-600 border-indigo-400 text-white opacity-100 scale-105 ring-2 ring-indigo-500/50'
                          : 'bg-slate-800 hover:bg-indigo-600 border-slate-700/90 text-slate-400 hover:text-white opacity-85 hover:opacity-100 hover:scale-105'
                      }`}
                      title="Kéo để thay đổi chiều cao hộp lệnh"
                    >
                      <GripHorizontal className="w-4 h-4 text-slate-300 group-hover:text-white" />
                    </div>
                  )}
                </div>
              )}

              {/* Quick Sample Command Chips */}
              <div className="space-y-1.5">
                <span className="font-semibold text-slate-400 text-[11px]">Mẫu lệnh gợi ý nhanh:</span>
                <div className="flex flex-wrap gap-1">
                  {[
                    'y = 2x + 1',
                    'f(x) = sin(x)',
                    'Midpoint((1,2), (5,6))',
                    'Circle((0,0), 5)',
                    'Vector((2,4))',
                    'Tangent((2,2), f)',
                  ].map((sample) => (
                    <button
                      key={sample}
                      onClick={() => {
                        setCommandInput(sample);
                        runCommand(sample);
                      }}
                      className="px-2 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800/80 rounded-lg text-[11px] font-mono text-slate-300 transition-colors"
                    >
                      + {sample}
                    </button>
                  ))}
                </div>
              </div>

              {/* History Command List */}
              <div className="space-y-1 border-t border-slate-800 pt-3">
                <span className="font-bold text-slate-400 text-[11px]">Lịch sử lệnh đã thực thi:</span>
                <div className="bg-slate-950 p-2 rounded-xl border border-slate-800 max-h-48 overflow-y-auto space-y-1 font-mono text-[11px]">
                  {commandHistory.map((cmd, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        setCommandInput(cmd);
                        runCommand(cmd);
                      }}
                      className="p-1 hover:bg-slate-900 rounded cursor-pointer text-indigo-300 flex items-center justify-between group"
                    >
                      <span>{cmd}</span>
                      <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-indigo-400" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: OBJECT COORDINATE TABLE */}
          {activeTabPanel === 'objects' && (
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-300">Danh sách đối tượng hình học ({objectsList.length}):</span>
                <button
                  onClick={() => refreshObjectsList()}
                  className="px-2 py-1 bg-slate-950 hover:bg-slate-800 text-slate-400 text-[11px] rounded-lg border border-slate-800"
                >
                  Cập nhật
                </button>
              </div>

              <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden max-h-[420px] overflow-y-auto">
                {objectsList.length > 0 ? (
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-slate-900 text-slate-400 font-bold border-b border-slate-800">
                      <tr>
                        <th className="p-2">Tên</th>
                        <th className="p-2">Loại</th>
                        <th className="p-2">Giá trị / Tọa độ</th>
                        <th className="p-2 text-center">Ẩn/Hiện</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {objectsList.map((obj) => (
                        <tr key={obj.name} className="hover:bg-slate-900/50">
                          <td className="p-2 font-bold text-amber-300">{obj.name}</td>
                          <td className="p-2 text-slate-400">{obj.type}</td>
                          <td className="p-2 text-sky-300">{obj.valueString}</td>
                          <td className="p-2 text-center">
                            <button
                              onClick={() => toggleVisibility(obj.name, obj.visible)}
                              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
                            >
                              {obj.visible ? <Eye className="w-3.5 h-3.5 text-emerald-400" /> : <EyeOff className="w-3.5 h-3.5 text-slate-600" />}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-6 text-center text-slate-500 italic">
                    Chưa có đối tượng nào được tạo trên bảng vẽ.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: REAL-TIME EVENT LOGS */}
          {activeTabPanel === 'logs' && (
            <div className="space-y-3 text-xs">
              <span className="font-bold text-slate-300">Nhật ký sự kiện biến đổi realtime:</span>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 max-h-[420px] overflow-y-auto font-mono space-y-1.5 text-[11px]">
                {eventLogs.map((log, idx) => (
                  <div key={idx} className="border-b border-slate-900/80 pb-1 flex items-start gap-2">
                    <span className="text-slate-500 text-[10px] whitespace-nowrap">{log.time}</span>
                    <span
                      className={`font-bold px-1 py-0.2 text-[9px] rounded uppercase ${
                        log.event === 'ADD'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : log.event === 'REMOVE'
                          ? 'bg-red-950 text-red-400 border border-red-800'
                          : log.event === 'COMMAND'
                          ? 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {log.event}
                    </span>
                    <span className="text-slate-300 break-all">{log.details}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        )}

        {/* RIGHT SIDE: GeoGebra Interactive Applet Canvas Area */}
        <div className={`${isSidebarCollapsed ? 'lg:col-span-12' : 'lg:col-span-8 xl:col-span-8.5'} bg-slate-950 p-2 sm:p-3 flex flex-col justify-between relative ${isFullscreen ? 'h-full min-h-0' : 'min-h-[620px]'} transition-all`}>
          {/* Direct Embedded GeoGebra Applet */}
          {!scriptError ? (
            <div className={`w-full flex-1 flex items-center justify-center relative bg-slate-900/40 rounded-xl overflow-hidden border border-slate-800 ggb-canvas-wrapper ${isFullscreen ? 'h-full min-h-0' : 'min-h-[580px]'}`}>
              <div id={containerId.current} className="w-full h-full flex items-center justify-center [&_iframe]:!w-full [&_iframe]:!h-full [&_canvas]:!max-w-full [&_.appletParameters]:!w-full [&_.appletParameters]:!h-full [&_.geogebraweb]:!w-full [&_.geogebraweb]:!h-full [&_.GeoGebraFrame]:!w-full [&_.GeoGebraFrame]:!h-full" />

              {!isAppletReady && (
                <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3 z-10 text-center p-4">
                  <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-sm font-semibold text-slate-300">
                    Đang tải Bảng vẽ GeoGebra Interactive...
                  </p>
                  <p className="text-xs text-slate-500">
                    Khởi tạo GeoGebra Engine & Nạp các gói thư viện toán học.
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* Fallback GeoGebra iframe if script fails to load */
            <div className="w-full h-[580px] bg-slate-900 rounded-xl border border-slate-800 overflow-hidden relative">
              <iframe
                src={`https://www.geogebra.org/${appName === '3d' ? '3d' : appName === 'graphing' ? 'graphing' : 'geometry'}?embed`}
                className="w-full h-full border-0"
                title="GeoGebra Interactive Applet"
                allow="fullscreen; geolocation"
              />
            </div>
          )}

          {/* Quick Toolbar below Canvas */}
          <div className="w-full mt-3 flex flex-wrap items-center justify-between gap-2 text-xs bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-400">Thao tác nhanh Canvas:</span>
              <button
                onClick={() => executeMacro('clear_all')}
                className="px-2.5 py-1 bg-red-950/50 hover:bg-red-900/60 text-red-300 border border-red-800/60 rounded-lg flex items-center gap-1 font-semibold transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Xóa bảng</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleFullscreen}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-lg flex items-center gap-1.5 transition-all shadow-sm border border-slate-700"
              >
                {isFullscreen ? (
                  <>
                    <Minimize2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Thoát toàn màn hình</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Toàn màn hình</span>
                  </>
                )}
              </button>

              <button
                onClick={exportImage}
                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg flex items-center gap-1.5 transition-all shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Xuất Ảnh PNG</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
