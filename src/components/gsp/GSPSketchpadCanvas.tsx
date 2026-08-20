import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  MousePointer,
  Circle as CircleIcon,
  Minus,
  ArrowUpRight,
  Type,
  Ruler,
  Calculator,
  Compass,
  Play,
  Pause,
  RotateCcw as ResetIcon,
  RotateCw,
  Maximize2,
  Minimize2,
  Download,
  Upload,
  Layers,
  Sparkles,
  Eye,
  EyeOff,
  Trash2,
  Undo2,
  Redo2,
  Sliders,
  CheckCircle2,
  ChevronDown,
  Info,
  BookOpen,
  Share2,
  FolderOpen,
  Plus,
  Activity,
  Move,
  Scissors,
  FilePlus,
  CheckSquare,
  Eraser,
  Copy,
  Edit3,
  Check,
  X,
  FileText,
  Boxes,
  Keyboard,
  HelpCircle,
  Command,
  PlaySquare,
  ExternalLink,
  FastForward,
  Zap,
  MousePointerClick,
  Brain,
  Wand2,
} from 'lucide-react';
import { AIMathService } from '../../services/aiMathService';

// ============================================================================
// TYPES & DATA STRUCTURES FOR GSP ENGINE
// ============================================================================

export interface GSPPageItem {
  id: string;
  title: string;
  state: GSPSketchState;
  history: GSPSketchState[];
  historyIndex: number;
}

export type GSPTool =
  | 'select'
  | 'point'
  | 'circle'
  | 'segment'
  | 'ray'
  | 'line'
  | 'polygon'
  | 'text'
  | 'action_button'
  | 'compass'
  | 'measure';

export interface GSPPoint {
  id: string;
  name: string;
  x: number;
  y: number;
  color: string;
  size: number;
  pinned?: boolean;
  hidden?: boolean;
  onSegmentId?: string; // Point restricted on a line/segment
  onCircleId?: string; // Point restricted on circle (angle parameter)
  angleParam?: number; // radians if on circle
  tParam?: number; // 0 to 1 if on segment
  isAnimating?: boolean;
  animSpeed?: number;
}

export interface GSPSegment {
  id: string;
  name?: string;
  p1Id: string;
  p2Id: string;
  type: 'segment' | 'ray' | 'line';
  color: string;
  strokeWidth: number;
  lineStyle: 'solid' | 'dashed' | 'dotted';
  hidden?: boolean;
  isTraced?: boolean;
}

export interface GSPCircle {
  id: string;
  name?: string;
  centerId: string;
  radiusPointId?: string;
  radius?: number; // In canvas units
  color: string;
  strokeWidth: number;
  lineStyle: 'solid' | 'dashed';
  hidden?: boolean;
}

export interface GSPPolygon {
  id: string;
  pointIds: string[];
  color: string;
  opacity: number;
  hidden?: boolean;
}

export interface GSPMeasurement {
  id: string;
  type: 'distance' | 'angle' | 'area' | 'perimeter' | 'radius' | 'slope';
  targetIds: string[];
  label: string;
  value: number;
  unit: string;
  x: number;
  y: number;
}

export interface GSPTextLabel {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
}

export interface GSPActionButton {
  id: string;
  type: 'animate' | 'hide_show' | 'movement' | 'link';
  label: string;
  x: number;
  y: number;
  targetPointIds?: string[];
  targetSegmentIds?: string[];
  targetCircleIds?: string[];
  targetPolyIds?: string[];
  sourcePointId?: string;
  destinationPointId?: string;
  targetPageId?: string;
  isActive?: boolean;
}

export interface GSPSketchState {
  points: GSPPoint[];
  segments: GSPSegment[];
  circles: GSPCircle[];
  polygons: GSPPolygon[];
  measurements: GSPMeasurement[];
  texts: GSPTextLabel[];
  actionButtons?: GSPActionButton[];
  markedCenterId?: string | null;
  markedMirrorId?: string | null;
  markedAngle?: number | null;
  markedRatio?: number | null;
}

export interface GSPPreset {
  id: string;
  title: string;
  category: 'tam-giac' | 'duong-tron' | 'dinh-ly' | 'quy-tich';
  description: string;
  state: GSPSketchState;
}

// Preset Library for GSP
const GSP_PRESETS: GSPPreset[] = [
  {
    id: 'euler-line',
    title: 'Đường thẳng Euler & 3 Đường đồng quy',
    category: 'tam-giac',
    description: 'Trực tâm H, Trọng tâm G, và Tâm đường tròn ngoại tiếp O thẳng hàng trên đường thẳng Euler (HG = 2GO).',
    state: {
      points: [
        { id: 'pA', name: 'A', x: 420, y: 110, color: '#38bdf8', size: 6 },
        { id: 'pB', name: 'B', x: 220, y: 440, color: '#38bdf8', size: 6 },
        { id: 'pC', name: 'C', x: 680, y: 440, color: '#38bdf8', size: 6 },
        { id: 'pG', name: 'G (Trọng tâm)', x: 440, y: 330, color: '#f59e0b', size: 6 },
        { id: 'pO', name: 'O (Ngoại tiếp)', x: 450, y: 360, color: '#10b981', size: 6 },
        { id: 'pH', name: 'H (Trực tâm)', x: 420, y: 270, color: '#ec4899', size: 6 },
      ],
      segments: [
        { id: 'sAB', p1Id: 'pA', p2Id: 'pB', type: 'segment', color: '#94a3b8', strokeWidth: 2.5, lineStyle: 'solid' },
        { id: 'sBC', p1Id: 'pB', p2Id: 'pC', type: 'segment', color: '#94a3b8', strokeWidth: 2.5, lineStyle: 'solid' },
        { id: 'sCA', p1Id: 'pC', p2Id: 'pA', type: 'segment', color: '#94a3b8', strokeWidth: 2.5, lineStyle: 'solid' },
        { id: 'sEuler', p1Id: 'pH', p2Id: 'pO', type: 'line', color: '#e11d48', strokeWidth: 2, lineStyle: 'dashed' },
      ],
      circles: [
        { id: 'cCircum', centerId: 'pO', radiusPointId: 'pA', color: '#10b981', strokeWidth: 1.5, lineStyle: 'dashed' },
      ],
      polygons: [
        { id: 'polyABC', pointIds: ['pA', 'pB', 'pC'], color: '#0284c7', opacity: 0.15 },
      ],
      measurements: [
        { id: 'm1', type: 'distance', targetIds: ['pH', 'pG'], label: 'HG', value: 3.42, unit: 'cm', x: 740, y: 120 },
        { id: 'm2', type: 'distance', targetIds: ['pG', 'pO'], label: 'GO', value: 1.71, unit: 'cm', x: 740, y: 155 },
        { id: 'm3', type: 'slope', targetIds: ['pH', 'pO'], label: 'Tỉ số HG/GO = 2.0 (Euler)', value: 2.0, unit: '', x: 740, y: 190 },
      ],
      texts: [
        { id: 't1', text: 'Đường thẳng Euler đi qua H, G, O với HG = 2GO', x: 260, y: 530, fontSize: 13, color: '#f43f5e' },
      ],
      actionButtons: [
        {
          id: 'btn_hs_circ',
          type: 'hide_show',
          label: '👁️ Ẩn/Hiện đường tròn ngoại tiếp',
          x: 230,
          y: 475,
          targetCircleIds: ['cCircum'],
        },
      ],
    },
  },
  {
    id: 'pythagoras-proof',
    title: 'Định lý Pythagore & 3 Hình vuông',
    category: 'dinh-ly',
    description: 'Minh họa chứng minh định lý Pythagore với tam giác vuông và 3 hình vuông dựng trên các cạnh a² + b² = c².',
    state: {
      points: [
        { id: 'pA', name: 'A (90°)', x: 420, y: 250, color: '#f43f5e', size: 6 },
        { id: 'pB', name: 'B', x: 420, y: 430, color: '#38bdf8', size: 6 },
        { id: 'pC', name: 'C', x: 660, y: 430, color: '#38bdf8', size: 6 },
        { id: 'pB1', name: 'B1', x: 240, y: 430, color: '#64748b', size: 4 },
        { id: 'pA1', name: 'A1', x: 240, y: 250, color: '#64748b', size: 4 },
        { id: 'pC1', name: 'C1', x: 660, y: 670, color: '#64748b', size: 4 },
        { id: 'pB2', name: 'B2', x: 420, y: 670, color: '#64748b', size: 4 },
      ],
      segments: [
        { id: 'sAB', p1Id: 'pA', p2Id: 'pB', type: 'segment', color: '#38bdf8', strokeWidth: 3, lineStyle: 'solid' },
        { id: 'sBC', p1Id: 'pB', p2Id: 'pC', type: 'segment', color: '#10b981', strokeWidth: 3, lineStyle: 'solid' },
        { id: 'sCA', p1Id: 'pC', p2Id: 'pA', type: 'segment', color: '#f59e0b', strokeWidth: 3, lineStyle: 'solid' },
        { id: 'sSq1', p1Id: 'pA', p2Id: 'pA1', type: 'segment', color: '#38bdf8', strokeWidth: 1.5, lineStyle: 'dashed' },
        { id: 'sSq2', p1Id: 'pA1', p2Id: 'pB1', type: 'segment', color: '#38bdf8', strokeWidth: 1.5, lineStyle: 'dashed' },
        { id: 'sSq3', p1Id: 'pB1', p2Id: 'pB', type: 'segment', color: '#38bdf8', strokeWidth: 1.5, lineStyle: 'dashed' },
        { id: 'sSq4', p1Id: 'pB', p2Id: 'pB2', type: 'segment', color: '#10b981', strokeWidth: 1.5, lineStyle: 'dashed' },
        { id: 'sSq5', p1Id: 'pB2', p2Id: 'pC1', type: 'segment', color: '#10b981', strokeWidth: 1.5, lineStyle: 'dashed' },
        { id: 'sSq6', p1Id: 'pC1', p2Id: 'pC', type: 'segment', color: '#10b981', strokeWidth: 1.5, lineStyle: 'dashed' },
      ],
      circles: [],
      polygons: [
        { id: 'polyABC', pointIds: ['pA', 'pB', 'pC'], color: '#ec4899', opacity: 0.3 },
        { id: 'polySqA', pointIds: ['pA', 'pA1', 'pB1', 'pB'], color: '#0284c7', opacity: 0.25 },
        { id: 'polySqB', pointIds: ['pB', 'pB2', 'pC1', 'pC'], color: '#10b981', opacity: 0.25 },
      ],
      measurements: [
        { id: 'm1', type: 'distance', targetIds: ['pA', 'pB'], label: 'b (AB)', value: 5.14, unit: 'cm', x: 740, y: 120 },
        { id: 'm2', type: 'distance', targetIds: ['pB', 'pC'], label: 'a (BC)', value: 6.86, unit: 'cm', x: 740, y: 155 },
        { id: 'm3', type: 'distance', targetIds: ['pC', 'pA'], label: 'c (Cạnh huyền)', value: 8.57, unit: 'cm', x: 740, y: 190 },
        { id: 'm4', type: 'area', targetIds: ['polySqA'], label: 'b² = 26.4', value: 26.4, unit: 'cm²', x: 740, y: 230 },
        { id: 'm5', type: 'area', targetIds: ['polySqB'], label: 'a² = 47.1', value: 47.1, unit: 'cm²', x: 740, y: 265 },
        { id: 'm6', type: 'area', targetIds: ['polyABC'], label: 'a² + b² = c² = 73.5 cm²', value: 73.5, unit: '', x: 740, y: 300 },
      ],
      texts: [
        { id: 't1', text: 'Định lý Pythagore: a² + b² = c²', x: 380, y: 80, fontSize: 16, color: '#f59e0b' },
      ],
      actionButtons: [
        {
          id: 'btn_hs_sq',
          type: 'hide_show',
          label: '👁️ Ẩn / Hiện các hình vuông',
          x: 240,
          y: 190,
          targetPolyIds: ['polySqA', 'polySqB'],
          targetSegmentIds: ['sSq1', 'sSq2', 'sSq3', 'sSq4', 'sSq5', 'sSq6'],
        },
      ],
    },
  },
  {
    id: 'inscribed-angle',
    title: 'Góc nội tiếp & Góc ở tâm cùng chắn một cung',
    category: 'duong-tron',
    description: 'Kéo điểm M trên đường tròn để thấy số đo góc nội tiếp ∠AMB luôn bằng 1/2 số đo góc ở tâm ∠AOB.',
    state: {
      points: [
        { id: 'pO', name: 'O (Tâm)', x: 450, y: 320, color: '#f59e0b', size: 6 },
        { id: 'pA', name: 'A', x: 270, y: 320, color: '#38bdf8', size: 6 },
        { id: 'pB', name: 'B', x: 570, y: 440, color: '#38bdf8', size: 6 },
        { id: 'pM', name: 'M (Di động)', x: 360, y: 150, color: '#ec4899', size: 7, isAnimating: true, animSpeed: 0.01 },
      ],
      segments: [
        { id: 'sOA', p1Id: 'pO', p2Id: 'pA', type: 'segment', color: '#f59e0b', strokeWidth: 2, lineStyle: 'dashed' },
        { id: 'sOB', p1Id: 'pO', p2Id: 'pB', type: 'segment', color: '#f59e0b', strokeWidth: 2, lineStyle: 'dashed' },
        { id: 'sMA', p1Id: 'pM', p2Id: 'pA', type: 'segment', color: '#ec4899', strokeWidth: 2.5, lineStyle: 'solid' },
        { id: 'sMB', p1Id: 'pM', p2Id: 'pB', type: 'segment', color: '#ec4899', strokeWidth: 2.5, lineStyle: 'solid' },
        { id: 'sAB', p1Id: 'pA', p2Id: 'pB', type: 'segment', color: '#64748b', strokeWidth: 1.5, lineStyle: 'dotted' },
      ],
      circles: [
        { id: 'c1', centerId: 'pO', radiusPointId: 'pA', color: '#0284c7', strokeWidth: 2.5, lineStyle: 'solid' },
      ],
      polygons: [
        { id: 'polyMAB', pointIds: ['pM', 'pA', 'pB'], color: '#ec4899', opacity: 0.1 },
      ],
      measurements: [
        { id: 'm1', type: 'angle', targetIds: ['pA', 'pO', 'pB'], label: '∠AOB (Góc ở tâm)', value: 124, unit: '°', x: 740, y: 120 },
        { id: 'm2', type: 'angle', targetIds: ['pA', 'pM', 'pB'], label: '∠AMB (Góc nội tiếp)', value: 62, unit: '°', x: 740, y: 155 },
        { id: 'm3', type: 'slope', targetIds: ['pM', 'pO'], label: '∠AMB = 1/2 ∠AOB = 62°', value: 0.5, unit: '', x: 740, y: 190 },
      ],
      texts: [
        { id: 't1', text: 'Số đo góc nội tiếp bằng nửa số đo góc ở tâm cùng chắn cung AB', x: 260, y: 80, fontSize: 14, color: '#38bdf8' },
      ],
      actionButtons: [
        {
          id: 'btn_anim_m',
          type: 'animate',
          label: '🎬 Hoạt họa điểm M',
          x: 240,
          y: 520,
          targetPointIds: ['pM'],
        },
        {
          id: 'btn_hs_oaob',
          type: 'hide_show',
          label: '👁️ Ẩn/Hiện góc tâm OA, OB',
          x: 430,
          y: 520,
          targetSegmentIds: ['sOA', 'sOB'],
        },
      ],
    },
  },
  {
    id: 'thales-similarity',
    title: 'Định lý Thales & Tam giác đồng dạng GSP',
    category: 'dinh-ly',
    description: 'Đường thẳng song song với cạnh BC cắt AB, AC tại D, E tạo ra △ADE ∼ △ABC và các tỉ số AD/AB = AE/AC = DE/BC.',
    state: {
      points: [
        { id: 'pA', name: 'A', x: 450, y: 110, color: '#38bdf8', size: 6 },
        { id: 'pB', name: 'B', x: 220, y: 470, color: '#38bdf8', size: 6 },
        { id: 'pC', name: 'C', x: 680, y: 470, color: '#38bdf8', size: 6 },
        { id: 'pD', name: 'D (Trên AB)', x: 335, y: 290, color: '#f59e0b', size: 6 },
        { id: 'pE', name: 'E (Trên AC)', x: 565, y: 290, color: '#f59e0b', size: 6 },
      ],
      segments: [
        { id: 'sAB', p1Id: 'pA', p2Id: 'pB', type: 'segment', color: '#94a3b8', strokeWidth: 2.5, lineStyle: 'solid' },
        { id: 'sBC', p1Id: 'pB', p2Id: 'pC', type: 'segment', color: '#94a3b8', strokeWidth: 2.5, lineStyle: 'solid' },
        { id: 'sCA', p1Id: 'pC', p2Id: 'pA', type: 'segment', color: '#94a3b8', strokeWidth: 2.5, lineStyle: 'solid' },
        { id: 'sDE', p1Id: 'pD', p2Id: 'pE', type: 'segment', color: '#e11d48', strokeWidth: 2.5, lineStyle: 'solid' },
      ],
      circles: [],
      polygons: [
        { id: 'polyADE', pointIds: ['pA', 'pD', 'pE'], color: '#f59e0b', opacity: 0.25 },
        { id: 'polyBCED', pointIds: ['pD', 'pB', 'pC', 'pE'], color: '#0284c7', opacity: 0.12 },
      ],
      measurements: [
        { id: 'm1', type: 'distance', targetIds: ['pA', 'pD'], label: 'AD', value: 3.5, unit: 'cm', x: 740, y: 120 },
        { id: 'm2', type: 'distance', targetIds: ['pA', 'pB'], label: 'AB', value: 7.0, unit: 'cm', x: 740, y: 155 },
        { id: 'm3', type: 'distance', targetIds: ['pD', 'pE'], label: 'DE', value: 3.3, unit: 'cm', x: 740, y: 190 },
        { id: 'm4', type: 'distance', targetIds: ['pB', 'pC'], label: 'BC', value: 6.6, unit: 'cm', x: 740, y: 225 },
        { id: 'm5', type: 'slope', targetIds: ['pA', 'pD'], label: 'Tỉ số Thales k = AD/AB = 0.50', value: 0.5, unit: '', x: 740, y: 260 },
      ],
      texts: [
        { id: 't1', text: 'Định lý Thales: DE // BC ⇒ AD/AB = AE/AC = DE/BC = 1/2', x: 270, y: 70, fontSize: 14, color: '#f59e0b' },
      ],
      actionButtons: [
        {
          id: 'btn_move_d',
          type: 'movement',
          label: '🚀 Dịch chuyển D → B',
          x: 230,
          y: 520,
          sourcePointId: 'pD',
          destinationPointId: 'pB',
        },
      ],
    },
  },
  {
    id: 'ellipse-locus',
    title: 'Quỹ tích Elip & Chuyển động động học GSP',
    category: 'quy-tich',
    description: 'Minh họa định nghĩa elip: Tập hợp các điểm M sao cho MF₁ + MF₂ = 2a không đổi khi M chuyển động trên quỹ đạo.',
    state: {
      points: [
        { id: 'pF1', name: 'F₁ (Tiêu điểm)', x: 330, y: 300, color: '#e11d48', size: 6 },
        { id: 'pF2', name: 'F₂ (Tiêu điểm)', x: 570, y: 300, color: '#e11d48', size: 6 },
        { id: 'pO', name: 'O (Tâm)', x: 450, y: 300, color: '#64748b', size: 5 },
        { id: 'pM', name: 'M (Vẽ quỹ tích)', x: 450, y: 170, color: '#10b981', size: 7, isAnimating: true, animSpeed: 0.015 },
      ],
      segments: [
        { id: 'sF1M', p1Id: 'pF1', p2Id: 'pM', type: 'segment', color: '#38bdf8', strokeWidth: 2, lineStyle: 'solid', isTraced: true },
        { id: 'sF2M', p1Id: 'pF2', p2Id: 'pM', type: 'segment', color: '#f59e0b', strokeWidth: 2, lineStyle: 'solid', isTraced: true },
        { id: 'sF1F2', p1Id: 'pF1', p2Id: 'pF2', type: 'segment', color: '#64748b', strokeWidth: 1.5, lineStyle: 'dashed' },
      ],
      circles: [],
      polygons: [],
      measurements: [
        { id: 'm1', type: 'distance', targetIds: ['pF1', 'pM'], label: 'MF₁', value: 4.8, unit: 'cm', x: 740, y: 120 },
        { id: 'm2', type: 'distance', targetIds: ['pF2', 'pM'], label: 'MF₂', value: 4.8, unit: 'cm', x: 740, y: 155 },
        { id: 'm3', type: 'distance', targetIds: ['pF1', 'pF2'], label: '2c (F₁F₂)', value: 6.8, unit: 'cm', x: 740, y: 190 },
        { id: 'm4', type: 'slope', targetIds: ['pF1', 'pM'], label: 'Tổng MF₁ + MF₂ = 9.6 cm (Không đổi)', value: 9.6, unit: '', x: 740, y: 225 },
      ],
      texts: [
        { id: 't1', text: 'Quỹ tích Elip: Tổng khoảng cách từ M tới hai tiêu điểm F₁, F₂ là hằng số', x: 220, y: 80, fontSize: 13, color: '#10b981' },
      ],
      actionButtons: [
        {
          id: 'btn_anim_elip',
          type: 'animate',
          label: '🎬 Hoạt họa điểm M trên Elip',
          x: 230,
          y: 520,
          targetPointIds: ['pM'],
        },
        {
          id: 'btn_hs_f1f2',
          type: 'hide_show',
          label: '👁️ Ẩn / Hiện trục F₁F₂',
          x: 470,
          y: 520,
          targetSegmentIds: ['sF1F2'],
        },
      ],
    },
  },
  {
    id: 'centroid-medians-gsp',
    title: '3 Đường Trung Tuyến & Trọng Tâm G (2/3)',
    category: 'tam-giac',
    description: 'Minh họa tính chất 3 đường trung tuyến của tam giác đồng quy tại Trọng tâm G với tỉ số GA/MA = GB/MB = GC/MC = 2/3.',
    state: {
      points: [
        { id: 'pA', name: 'A', x: 420, y: 120, color: '#38bdf8', size: 6 },
        { id: 'pB', name: 'B', x: 200, y: 440, color: '#38bdf8', size: 6 },
        { id: 'pC', name: 'C', x: 680, y: 440, color: '#38bdf8', size: 6 },
        { id: 'pM', name: 'M (T.Điểm BC)', x: 440, y: 440, color: '#10b981', size: 5 },
        { id: 'pN', name: 'N (T.Điểm AC)', x: 550, y: 280, color: '#10b981', size: 5 },
        { id: 'pP', name: 'P (T.Điểm AB)', x: 310, y: 280, color: '#10b981', size: 5 },
        { id: 'pG', name: 'G (Trọng tâm)', x: 433, y: 333, color: '#e11d48', size: 7 },
      ],
      segments: [
        { id: 'sAB', p1Id: 'pA', p2Id: 'pB', type: 'segment', color: '#94a3b8', strokeWidth: 2.5, lineStyle: 'solid' },
        { id: 'sBC', p1Id: 'pB', p2Id: 'pC', type: 'segment', color: '#94a3b8', strokeWidth: 2.5, lineStyle: 'solid' },
        { id: 'sCA', p1Id: 'pC', p2Id: 'pA', type: 'segment', color: '#94a3b8', strokeWidth: 2.5, lineStyle: 'solid' },
        { id: 'sAM', p1Id: 'pA', p2Id: 'pM', type: 'segment', color: '#e11d48', strokeWidth: 2, lineStyle: 'dashed' },
        { id: 'sBN', p1Id: 'pB', p2Id: 'pN', type: 'segment', color: '#e11d48', strokeWidth: 2, lineStyle: 'dashed' },
        { id: 'sCP', p1Id: 'pC', p2Id: 'pP', type: 'segment', color: '#e11d48', strokeWidth: 2, lineStyle: 'dashed' },
      ],
      circles: [],
      polygons: [
        { id: 'polyABC', pointIds: ['pA', 'pB', 'pC'], color: '#0284c7', opacity: 0.15 },
      ],
      measurements: [
        { id: 'm1', type: 'distance', targetIds: ['pA', 'pG'], label: 'AG', value: 4.26, unit: 'cm', x: 740, y: 120 },
        { id: 'm2', type: 'distance', targetIds: ['pA', 'pM'], label: 'AM', value: 6.40, unit: 'cm', x: 740, y: 155 },
        { id: 'm3', type: 'slope', targetIds: ['pA', 'pG'], label: 'Tỉ số AG/AM = 0.67 = 2/3 (Trọng tâm)', value: 0.67, unit: '', x: 740, y: 190 },
      ],
      texts: [
        { id: 't1', text: 'Ba đường trung tuyến đồng quy tại Trọng tâm G (AG = 2/3 AM)', x: 260, y: 70, fontSize: 13, color: '#e11d48' },
      ],
      actionButtons: [
        {
          id: 'btn_hs_medians',
          type: 'hide_show',
          label: '👁️ Ẩn/Hiện 3 đường trung tuyến',
          x: 240,
          y: 490,
          targetSegmentIds: ['sAM', 'sBN', 'sCP'],
        },
      ],
    },
  },
  {
    id: 'cycloid-wheel-gsp',
    title: 'Chuyển Động Lăn Của Bánh Xe & Đường Xicloit (Cycloid)',
    category: 'quy-tich',
    description: 'Khi bánh xe lăn không trượt trên đường thẳng, điểm đánh dấu P trên vành bánh xe vạch ra đường cong Cycloid tuyệt đẹp.',
    state: {
      points: [
        { id: 'pGround1', name: 'Mặt đất 1', x: 150, y: 450, color: '#64748b', size: 4 },
        { id: 'pGround2', name: 'Mặt đất 2', x: 750, y: 450, color: '#64748b', size: 4 },
        { id: 'pCenter', name: 'O (Tâm bánh xe)', x: 350, y: 350, color: '#f59e0b', size: 6, isAnimating: true, animSpeed: 0.02 },
        { id: 'pRim', name: 'P (Vành xe - Vết)', x: 350, y: 450, color: '#e11d48', size: 7, isAnimating: true, animSpeed: 0.02 },
        { id: 'pRimTop', name: 'Top', x: 350, y: 250, color: '#38bdf8', size: 4 },
      ],
      segments: [
        { id: 'sGround', p1Id: 'pGround1', p2Id: 'pGround2', type: 'line', color: '#475569', strokeWidth: 3, lineStyle: 'solid' },
        { id: 'sSpoke1', p1Id: 'pCenter', p2Id: 'pRim', type: 'segment', color: '#e11d48', strokeWidth: 2.5, lineStyle: 'solid', isTraced: true },
        { id: 'sSpoke2', p1Id: 'pCenter', p2Id: 'pRimTop', type: 'segment', color: '#38bdf8', strokeWidth: 1.5, lineStyle: 'dashed' },
      ],
      circles: [
        { id: 'cWheel', centerId: 'pCenter', radiusPointId: 'pRim', color: '#f59e0b', strokeWidth: 3, lineStyle: 'solid' },
      ],
      polygons: [],
      measurements: [
        { id: 'm1', type: 'radius', targetIds: ['cWheel'], label: 'Bán kính R', value: 2.5, unit: 'cm', x: 740, y: 120 },
        { id: 'm2', type: 'perimeter', targetIds: ['cWheel'], label: 'Chu vi 2πR', value: 15.7, unit: 'cm', x: 740, y: 155 },
      ],
      texts: [
        { id: 't1', text: 'Đường Xicloit: Quỹ tích điểm P trên vành bánh xe lăn không trượt', x: 240, y: 70, fontSize: 13, color: '#f59e0b' },
      ],
      actionButtons: [
        {
          id: 'btn_anim_wheel',
          type: 'animate',
          label: '🎬 Bật / Tắt Lăn Bánh Xe',
          x: 230,
          y: 500,
          targetPointIds: ['pCenter', 'pRim'],
        },
      ],
    },
  },
];

// Helper calculations
const getDistance = (p1: { x: number; y: number }, p2: { x: number; y: number }) =>
  Math.hypot(p2.x - p1.x, p2.y - p1.y);

export const GSPSketchpadCanvas: React.FC = () => {
  // 1. Current Tool & Selection State
  const [activeTool, setActiveTool] = useState<GSPTool>('select');
  const [selectedPointIds, setSelectedPointIds] = useState<string[]>([]);
  const [selectedSegmentIds, setSelectedSegmentIds] = useState<string[]>([]);
  const [selectedCircleIds, setSelectedCircleIds] = useState<string[]>([]);
  const [selectedPolyIds, setSelectedPolyIds] = useState<string[]>([]);
  const [selectedMeasurementIds, setSelectedMeasurementIds] = useState<string[]>([]);

  // 1b. Multi-page Sketchpad System
  const [pages, setPages] = useState<GSPPageItem[]>([
    {
      id: 'page_1',
      title: 'Trang 1: Euler Line',
      state: GSP_PRESETS[0].state,
      history: [GSP_PRESETS[0].state],
      historyIndex: 0,
    },
  ]);
  const [currentPageId, setCurrentPageId] = useState<string>('page_1');
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [editingTitleText, setEditingTitleText] = useState<string>('');

  // 2. Sketch Geometry State
  const [sketch, setSketch] = useState<GSPSketchState>(GSP_PRESETS[0].state);

  // 3. Undo / Redo History Stack
  const [history, setHistory] = useState<GSPSketchState[]>([GSP_PRESETS[0].state]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  // 4. Color & Style Palette
  const [activeColor, setActiveColor] = useState<string>('#38bdf8');
  const [activeStrokeWidth, setActiveStrokeWidth] = useState<number>(2.5);
  const [activeLineStyle, setActiveLineStyle] = useState<'solid' | 'dashed' | 'dotted'>('solid');

  // 5. Canvas & Viewport Settings
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [snapToGrid, setSnapToGrid] = useState<boolean>(false);
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // 6. Animation Controller
  const [isAnimationRunning, setIsAnimationRunning] = useState<boolean>(false);
  const [animSpeedMultiplier, setAnimSpeedMultiplier] = useState<number>(1);
  const animFrameRef = useRef<number | null>(null);

  // 7. Interactive Construction States (temporary points while drawing)
  const [tempStartPoint, setTempStartPoint] = useState<GSPPoint | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [draggedPointId, setDraggedPointId] = useState<string | null>(null);
  const [draggedOffset, setDraggedOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // 8. Transform Dialog State
  const [showTransformModal, setShowTransformModal] = useState<boolean>(false);
  const [transformType, setTransformType] = useState<'translate' | 'rotate' | 'dilate' | 'reflect'>('rotate');
  const [transformAngle, setTransformAngle] = useState<number>(60);
  const [transformDistX, setTransformDistX] = useState<number>(80);
  const [transformDistY, setTransformDistY] = useState<number>(0);
  const [transformRatio, setTransformRatio] = useState<number>(1.5);

  // 9. Calculator & Expression Dialog State
  const [showCalculator, setShowCalculator] = useState<boolean>(false);
  const [calcInput, setCalcInput] = useState<string>('');
  const [calcResult, setCalcResult] = useState<number | null>(null);

  // 10. Presets & Modal
  const [showPresetModal, setShowPresetModal] = useState<boolean>(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 11. Action Buttons (Nút Hành Động) Dialog & Drag State
  const [showActionButtonModal, setShowActionButtonModal] = useState<boolean>(false);
  const [actionButtonModalType, setActionButtonModalType] = useState<'animate' | 'hide_show' | 'movement' | 'link'>('animate');
  const [actionButtonLabel, setActionButtonLabel] = useState<string>('');
  const [actionButtonMovementSource, setActionButtonMovementSource] = useState<string>('');
  const [actionButtonMovementDest, setActionButtonMovementDest] = useState<string>('');
  const [actionButtonTargetPage, setActionButtonTargetPage] = useState<string>('');
  const [draggedActionButtonId, setDraggedActionButtonId] = useState<string | null>(null);

  // AI GSP Sketch Generator States (Gemini 3.1 Pro High Thinking)
  const [showAIGeneratorModal, setShowAIGeneratorModal] = useState<boolean>(false);
  const [aiPrompt, setAiPrompt] = useState<string>('Vẽ tam giác vuông ABC tại A có đường cao AH và đường tròn ngoại tiếp tam giác');
  const [aiGenerating, setAiGenerating] = useState<boolean>(false);
  const [aiGeneratedExplanation, setAiGeneratedExplanation] = useState<string | null>(null);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Handle AI GSP Sketch Generation
  const handleAIGenerateSketch = async (promptText?: string) => {
    const text = (promptText || aiPrompt).trim();
    if (!text) return;
    setAiGenerating(true);
    setAiGeneratedExplanation(null);

    try {
      const res = await AIMathService.generateGSPSketch(text);
      if (res.success && res.sketch && res.sketch.points && res.sketch.points.length > 0) {
        const newSketchState: GSPSketchState = {
          points: res.sketch.points.map((p) => ({
            id: p.id,
            name: p.name,
            x: p.x,
            y: p.y,
            color: p.color || '#38bdf8',
            size: p.size || 6,
          })),
          segments: (res.sketch.segments || []).map((s) => ({
            id: s.id,
            name: s.name,
            p1Id: s.p1Id,
            p2Id: s.p2Id,
            type: s.type || 'segment',
            color: s.color || '#60a5fa',
            strokeWidth: s.strokeWidth || 2,
            lineStyle: s.lineStyle || 'solid',
          })),
          circles: (res.sketch.circles || []).map((c) => ({
            id: c.id,
            name: c.name,
            centerId: c.centerId,
            radiusPointId: c.radiusPointId,
            radius: c.radius || 100,
            color: c.color || '#10b981',
            strokeWidth: c.strokeWidth || 2,
            lineStyle: c.lineStyle || 'solid',
          })),
          polygons: (res.sketch.polygons || []).map((poly) => ({
            id: poly.id,
            pointIds: poly.pointIds,
            color: poly.color || '#3b82f6',
            opacity: poly.opacity || 0.15,
          })),
          measurements: [],
          texts: [
            {
              id: 'ai_label',
              text: `✨ AI: ${text}`,
              x: 40,
              y: 540,
              fontSize: 13,
              color: '#38bdf8',
            },
          ],
          actionButtons: [],
        };

        pushState(newSketchState);
        setAiGeneratedExplanation(res.explanation || 'Đã dựng hình thành công theo yêu cầu!');
        showToast('✨ AI đã dựng hình thành công lên bản vẽ GSP!');
      } else {
        showToast('⚠️ AI không thể tạo hình cho yêu cầu này, vui lòng thử lại!');
      }
    } catch (err) {
      showToast('❌ Lỗi kết nối AI');
    } finally {
      setAiGenerating(false);
    }
  };

  // Toast notification helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Push new state into history
  const pushState = (newState: GSPSketchState) => {
    const newHist = history.slice(0, historyIndex + 1);
    newHist.push(newState);
    if (newHist.length > 40) newHist.shift();
    setHistory(newHist);
    setHistoryIndex(newHist.length - 1);
    setSketch(newState);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setSketch(history[historyIndex - 1]);
      showToast('Hoàn tác (Undo)');
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setSketch(history[historyIndex + 1]);
      showToast('Làm lại (Redo)');
    }
  };

  // Convert screen coordinates to SVG coordinates
  const getSvgCoordinates = useCallback(
    (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
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
      let finalX = svgP.x;
      let finalY = svgP.y;

      if (snapToGrid) {
        finalX = Math.round(finalX / 20) * 20;
        finalY = Math.round(finalY / 20) * 20;
      }
      return { x: finalX, y: finalY };
    },
    [snapToGrid]
  );

  // ============================================================================
  // SELECT ALL & PAGE MANAGEMENT
  // ============================================================================

  // 1. Select All Objects (Ctrl + A)
  const handleSelectAll = useCallback(() => {
    const allPtIds = sketch.points.map((p) => p.id);
    const allSegIds = sketch.segments.map((s) => s.id);
    const allCircIds = sketch.circles.map((c) => c.id);
    const allPolyIds = sketch.polygons.map((p) => p.id);
    const allMeasIds = sketch.measurements.map((m) => m.id);

    setSelectedPointIds(allPtIds);
    setSelectedSegmentIds(allSegIds);
    setSelectedCircleIds(allCircIds);
    setSelectedPolyIds(allPolyIds);
    setSelectedMeasurementIds(allMeasIds);

    const totalCount = allPtIds.length + allSegIds.length + allCircIds.length + allPolyIds.length;
    if (totalCount === 0) {
      showToast('Bản vẽ trang hiện tại chưa có đối tượng nào');
    } else {
      showToast(`✓ Đã chọn toàn bộ (${totalCount} đối tượng) - [Ctrl+A]`);
    }
  }, [sketch]);

  // 2. Create New Page (Bản vẽ mới / Trang mới)
  const handleCreateNewPage = (blank = true, presetState?: GSPSketchState, customTitle?: string) => {
    // Save current active page state into pages list
    setPages((prevPages) =>
      prevPages.map((pg) =>
        pg.id === currentPageId
          ? { ...pg, state: sketch, history, historyIndex }
          : pg
      )
    );

    const newPageNum = pages.length + 1;
    const newPageId = `page_${Date.now()}`;
    const emptyState: GSPSketchState = {
      points: [],
      segments: [],
      circles: [],
      polygons: [],
      measurements: [],
      texts: [],
    };

    const targetState = presetState || (blank ? emptyState : GSP_PRESETS[0].state);
    const targetTitle = customTitle || `Trang ${newPageNum}`;

    const newPage: GSPPageItem = {
      id: newPageId,
      title: targetTitle,
      state: targetState,
      history: [targetState],
      historyIndex: 0,
    };

    setPages((prev) => [...prev, newPage]);
    setCurrentPageId(newPageId);
    setSketch(targetState);
    setHistory([targetState]);
    setHistoryIndex(0);
    setSelectedPointIds([]);
    setSelectedSegmentIds([]);
    setSelectedCircleIds([]);
    setSelectedPolyIds([]);
    setSelectedMeasurementIds([]);
    showToast(`✓ Đã tạo trang mới: ${targetTitle}`);
  };

  // 3. Switch between pages
  const handleSwitchPage = (targetPageId: string) => {
    if (targetPageId === currentPageId) return;

    // Save current active page
    const updatedPages = pages.map((pg) =>
      pg.id === currentPageId
        ? { ...pg, state: sketch, history, historyIndex }
        : pg
    );
    setPages(updatedPages);

    const targetPage = updatedPages.find((pg) => pg.id === targetPageId);
    if (targetPage) {
      setCurrentPageId(targetPageId);
      setSketch(targetPage.state);
      setHistory(targetPage.history && targetPage.history.length > 0 ? targetPage.history : [targetPage.state]);
      setHistoryIndex(targetPage.historyIndex || 0);
      setSelectedPointIds([]);
      setSelectedSegmentIds([]);
      setSelectedCircleIds([]);
      setSelectedPolyIds([]);
      setSelectedMeasurementIds([]);
      showToast(`Đã chuyển sang: ${targetPage.title}`);
    }
  };

  // 4. Delete a page
  const handleDeletePage = (pageId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (pages.length <= 1) {
      handleClearCurrentPage();
      return;
    }

    const remainingPages = pages.filter((pg) => pg.id !== pageId);
    setPages(remainingPages);

    if (currentPageId === pageId) {
      const nextActive = remainingPages[0];
      setCurrentPageId(nextActive.id);
      setSketch(nextActive.state);
      setHistory(nextActive.history);
      setHistoryIndex(nextActive.historyIndex);
      setSelectedPointIds([]);
      setSelectedSegmentIds([]);
      setSelectedCircleIds([]);
      setSelectedPolyIds([]);
      setSelectedMeasurementIds([]);
    }
    showToast('Đã đóng trang.');
  };

  // 5. Clear current page canvas
  const handleClearCurrentPage = () => {
    const emptyState: GSPSketchState = {
      points: [],
      segments: [],
      circles: [],
      polygons: [],
      measurements: [],
      texts: [],
    };
    pushState(emptyState);
    setSelectedPointIds([]);
    setSelectedSegmentIds([]);
    setSelectedCircleIds([]);
    setSelectedPolyIds([]);
    setSelectedMeasurementIds([]);
    showToast('Đã xóa trắng bản vẽ trang hiện tại.');
  };

  // 6. Duplicate Current Page
  const handleDuplicatePage = () => {
    const newPageId = `page_${Date.now()}`;
    const currPage = pages.find((p) => p.id === currentPageId);
    const newTitle = currPage ? `${currPage.title} (Bản sao)` : `Trang ${pages.length + 1}`;

    const newPage: GSPPageItem = {
      id: newPageId,
      title: newTitle,
      state: JSON.parse(JSON.stringify(sketch)),
      history: [JSON.parse(JSON.stringify(sketch))],
      historyIndex: 0,
    };

    setPages((prev) => [...prev, newPage]);
    setCurrentPageId(newPageId);
    showToast(`✓ Đã nhân bản trang: ${newTitle}`);
  };

  // ============================================================================
  // GSP CONSTRUCT OPERATIONS (DỰNG HÌNH CHUẨN GSP)
  // ============================================================================

  // 1. Dựng Đoạn thẳng qua 2 điểm (Ctrl + L)
  const constructSegment = useCallback(() => {
    if (selectedPointIds.length < 2) {
      showToast('⚠️ Hãy chọn ít nhất 2 điểm để vẽ đoạn thẳng (Phím tắt: Ctrl + L)');
      return;
    }

    const newSegs: GSPSegment[] = [];
    for (let i = 0; i < selectedPointIds.length - 1; i++) {
      newSegs.push({
        id: `s_${Date.now()}_${i}`,
        p1Id: selectedPointIds[i],
        p2Id: selectedPointIds[i + 1],
        type: 'segment',
        color: activeColor,
        strokeWidth: activeStrokeWidth,
        lineStyle: activeLineStyle === 'dotted' ? 'dotted' : activeLineStyle,
      });
    }

    pushState({
      ...sketch,
      segments: [...sketch.segments, ...newSegs],
    });

    const p1 = sketch.points.find((p) => p.id === selectedPointIds[0]);
    const p2 = sketch.points.find((p) => p.id === selectedPointIds[1]);
    const nameLabel = p1 && p2 ? `${p1.name}${p2.name}` : '';
    showToast(`✓ Đã vẽ đoạn thẳng ${nameLabel} (Ctrl+L)`);
  }, [selectedPointIds, activeColor, activeStrokeWidth, activeLineStyle, sketch]);

  // 2. Dựng Đường thẳng vô hạn qua 2 điểm (Ctrl + Shift + L)
  const constructLine = useCallback(() => {
    if (selectedPointIds.length < 2) {
      showToast('⚠️ Hãy chọn 2 điểm để dựng đường thẳng (Ctrl + Shift + L)');
      return;
    }

    const newSeg: GSPSegment = {
      id: `s_line_${Date.now()}`,
      p1Id: selectedPointIds[0],
      p2Id: selectedPointIds[1],
      type: 'line',
      color: activeColor,
      strokeWidth: activeStrokeWidth,
      lineStyle: 'solid',
    };

    pushState({
      ...sketch,
      segments: [...sketch.segments, newSeg],
    });
    showToast('✓ Đã dựng đường thẳng qua 2 điểm (Ctrl+Shift+L)');
  }, [selectedPointIds, activeColor, activeStrokeWidth, sketch]);

  // 3. Dựng Tia qua 2 điểm (Ctrl + Shift + R)
  const constructRay = useCallback(() => {
    if (selectedPointIds.length < 2) {
      showToast('⚠️ Hãy chọn 2 điểm để dựng tia (Gốc tại điểm thứ nhất) (Ctrl + Shift + R)');
      return;
    }

    const newSeg: GSPSegment = {
      id: `s_ray_${Date.now()}`,
      p1Id: selectedPointIds[0],
      p2Id: selectedPointIds[1],
      type: 'ray',
      color: activeColor,
      strokeWidth: activeStrokeWidth,
      lineStyle: 'solid',
    };

    pushState({
      ...sketch,
      segments: [...sketch.segments, newSeg],
    });
    showToast('✓ Đã dựng tia qua 2 điểm (Ctrl+Shift+R)');
  }, [selectedPointIds, activeColor, activeStrokeWidth, sketch]);

  // 4. Dựng Đường tròn qua Tâm và Điểm bán kính (Ctrl + Shift + C)
  const constructCircleByPoints = useCallback(() => {
    if (selectedPointIds.length < 2) {
      showToast('⚠️ Hãy chọn 2 điểm: Điểm thứ 1 là Tâm, điểm thứ 2 là Bán kính (Ctrl + Shift + C)');
      return;
    }

    const centerPt = sketch.points.find((p) => p.id === selectedPointIds[0]);
    const radPt = sketch.points.find((p) => p.id === selectedPointIds[1]);
    if (!centerPt || !radPt) return;

    const newCircle: GSPCircle = {
      id: `c_${Date.now()}`,
      centerId: centerPt.id,
      radiusPointId: radPt.id,
      radius: getDistance(centerPt, radPt),
      color: activeColor,
      strokeWidth: activeStrokeWidth,
      lineStyle: 'solid',
    };

    pushState({
      ...sketch,
      circles: [...sketch.circles, newCircle],
    });
    showToast(`✓ Đã dựng đường tròn tâm ${centerPt.name} qua ${radPt.name} (Ctrl+Shift+C)`);
  }, [selectedPointIds, activeColor, activeStrokeWidth, sketch]);

  // 5. Dựng Trung điểm (Ctrl + M)
  const constructMidpoint = useCallback(() => {
    let p1: GSPPoint | undefined;
    let p2: GSPPoint | undefined;

    if (selectedPointIds.length === 2) {
      p1 = sketch.points.find((p) => p.id === selectedPointIds[0]);
      p2 = sketch.points.find((p) => p.id === selectedPointIds[1]);
    } else if (selectedSegmentIds.length === 1) {
      const seg = sketch.segments.find((s) => s.id === selectedSegmentIds[0]);
      if (seg) {
        p1 = sketch.points.find((p) => p.id === seg.p1Id);
        p2 = sketch.points.find((p) => p.id === seg.p2Id);
      }
    }

    if (!p1 || !p2) {
      showToast('⚠️ Vui lòng chọn 2 điểm hoặc 1 đoạn thẳng để dựng trung điểm! (Ctrl + M)');
      return;
    }

    const midPoint: GSPPoint = {
      id: `p_${Date.now()}`,
      name: `M_${p1.name}${p2.name}`,
      x: (p1.x + p2.x) / 2,
      y: (p1.y + p2.y) / 2,
      color: '#f59e0b',
      size: 5.5,
    };

    pushState({
      ...sketch,
      points: [...sketch.points, midPoint],
    });
    setSelectedPointIds([midPoint.id]);
    showToast(`✓ Đã dựng Trung điểm ${midPoint.name} (Ctrl+M)`);
  }, [selectedPointIds, selectedSegmentIds, sketch]);

  // 6. Dựng Đường vuông góc (Ctrl + Shift + P)
  const constructPerpendicular = useCallback(() => {
    if (selectedPointIds.length !== 1 || selectedSegmentIds.length !== 1) {
      showToast('⚠️ Chọn đúng 1 điểm và 1 đường thẳng để dựng đường vuông góc! (Ctrl + Shift + P)');
      return;
    }

    const pt = sketch.points.find((p) => p.id === selectedPointIds[0]);
    const seg = sketch.segments.find((s) => s.id === selectedSegmentIds[0]);
    if (!pt || !seg) return;

    const p1 = sketch.points.find((p) => p.id === seg.p1Id);
    const p2 = sketch.points.find((p) => p.id === seg.p2Id);
    if (!p1 || !p2) return;

    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.hypot(dx, dy);
    if (len === 0) return;
    const normX = -dy / len;
    const normY = dx / len;

    const pPerp: GSPPoint = {
      id: `p_${Date.now()}`,
      name: `${pt.name}'`,
      x: pt.x + normX * 180,
      y: pt.y + normY * 180,
      color: '#ec4899',
      size: 5,
    };

    const newSeg: GSPSegment = {
      id: `s_${Date.now()}`,
      p1Id: pt.id,
      p2Id: pPerp.id,
      type: 'line',
      color: '#ec4899',
      strokeWidth: 2,
      lineStyle: 'solid',
    };

    pushState({
      ...sketch,
      points: [...sketch.points, pPerp],
      segments: [...sketch.segments, newSeg],
    });
    showToast(`✓ Đã dựng đường vuông góc qua ${pt.name} (Ctrl+Shift+P)`);
  }, [selectedPointIds, selectedSegmentIds, sketch]);

  // 7. Dựng Đường song song (Ctrl + Shift + F)
  const constructParallel = useCallback(() => {
    if (selectedPointIds.length !== 1 || selectedSegmentIds.length !== 1) {
      showToast('⚠️ Chọn đúng 1 điểm và 1 đường thẳng để dựng đường song song! (Ctrl + Shift + F)');
      return;
    }

    const pt = sketch.points.find((p) => p.id === selectedPointIds[0]);
    const seg = sketch.segments.find((s) => s.id === selectedSegmentIds[0]);
    if (!pt || !seg) return;

    const p1 = sketch.points.find((p) => p.id === seg.p1Id);
    const p2 = sketch.points.find((p) => p.id === seg.p2Id);
    if (!p1 || !p2) return;

    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;

    const pPar: GSPPoint = {
      id: `p_${Date.now()}`,
      name: `${pt.name}//`,
      x: pt.x + dx,
      y: pt.y + dy,
      color: '#10b981',
      size: 5,
    };

    const newSeg: GSPSegment = {
      id: `s_${Date.now()}`,
      p1Id: pt.id,
      p2Id: pPar.id,
      type: 'line',
      color: '#10b981',
      strokeWidth: 2,
      lineStyle: 'solid',
    };

    pushState({
      ...sketch,
      points: [...sketch.points, pPar],
      segments: [...sketch.segments, newSeg],
    });
    showToast(`✓ Đã dựng đường song song qua ${pt.name} (Ctrl+Shift+F)`);
  }, [selectedPointIds, selectedSegmentIds, sketch]);

  // 8. Dựng Phân giác góc (Ctrl + Shift + B)
  const constructAngleBisector = useCallback(() => {
    if (selectedPointIds.length !== 3) {
      showToast('⚠️ Vui lòng chọn 3 điểm (Đỉnh ở giữa) để dựng phân giác góc! (Ctrl + Shift + B)');
      return;
    }

    const pA = sketch.points.find((p) => p.id === selectedPointIds[0]);
    const pB = sketch.points.find((p) => p.id === selectedPointIds[1]); // Vertex
    const pC = sketch.points.find((p) => p.id === selectedPointIds[2]);
    if (!pA || !pB || !pC) return;

    const v1 = { x: pA.x - pB.x, y: pA.y - pB.y };
    const v2 = { x: pC.x - pB.x, y: pC.y - pB.y };
    const l1 = Math.hypot(v1.x, v1.y);
    const l2 = Math.hypot(v2.x, v2.y);
    if (l1 === 0 || l2 === 0) return;

    const u1 = { x: v1.x / l1, y: v1.y / l1 };
    const u2 = { x: v2.x / l2, y: v2.y / l2 };
    const bisectV = { x: u1.x + u2.x, y: u1.y + u2.y };
    const bLen = Math.hypot(bisectV.x, bisectV.y);
    if (bLen === 0) return;

    const pBis: GSPPoint = {
      id: `p_${Date.now()}`,
      name: `D_pg`,
      x: pB.x + (bisectV.x / bLen) * 200,
      y: pB.y + (bisectV.y / bLen) * 200,
      color: '#f59e0b',
      size: 5,
    };

    const newSeg: GSPSegment = {
      id: `s_${Date.now()}`,
      p1Id: pB.id,
      p2Id: pBis.id,
      type: 'ray',
      color: '#f59e0b',
      strokeWidth: 2,
      lineStyle: 'dashed',
    };

    pushState({
      ...sketch,
      points: [...sketch.points, pBis],
      segments: [...sketch.segments, newSeg],
    });
    showToast(`✓ Đã dựng tia phân giác góc ∠${pA.name}${pB.name}${pC.name} (Ctrl+Shift+B)`);
  }, [selectedPointIds, sketch]);

  // 9. Dựng Miền trong đa giác (Ctrl + P)
  const constructPolygonInterior = useCallback(() => {
    if (selectedPointIds.length < 3) {
      showToast('⚠️ Vui lòng chọn ít nhất 3 điểm theo thứ tự vòng quanh đa giác! (Ctrl + P)');
      return;
    }

    const newPoly: GSPPolygon = {
      id: `poly_${Date.now()}`,
      pointIds: [...selectedPointIds],
      color: activeColor,
      opacity: 0.25,
    };

    pushState({
      ...sketch,
      polygons: [...sketch.polygons, newPoly],
    });
    showToast(`✓ Đã dựng miền trong đa giác (${selectedPointIds.length} đỉnh) [Ctrl+P]`);
  }, [selectedPointIds, activeColor, sketch]);

  // 10. Dựng Giao điểm (Ctrl + I)
  const constructIntersection = useCallback(() => {
    if (selectedSegmentIds.length !== 2) {
      showToast('⚠️ Hãy chọn 2 đường thẳng/đoạn thẳng để dựng giao điểm (Ctrl + I)');
      return;
    }

    const s1 = sketch.segments.find((s) => s.id === selectedSegmentIds[0]);
    const s2 = sketch.segments.find((s) => s.id === selectedSegmentIds[1]);
    if (!s1 || !s2) return;

    const p1 = sketch.points.find((p) => p.id === s1.p1Id);
    const p2 = sketch.points.find((p) => p.id === s1.p2Id);
    const p3 = sketch.points.find((p) => p.id === s2.p1Id);
    const p4 = sketch.points.find((p) => p.id === s2.p2Id);
    if (!p1 || !p2 || !p3 || !p4) return;

    const denom = (p1.x - p2.x) * (p3.y - p4.y) - (p1.y - p2.y) * (p3.x - p4.x);
    if (Math.abs(denom) < 1e-6) {
      showToast('⚠️ Hai đường này song song hoặc trùng nhau, không có 1 giao điểm duy nhất!');
      return;
    }

    const t = ((p1.x - p3.x) * (p3.y - p4.y) - (p1.y - p3.y) * (p3.x - p4.x)) / denom;
    const ix = Math.round(p1.x + t * (p2.x - p1.x));
    const iy = Math.round(p1.y + t * (p2.y - p1.y));

    const interPt: GSPPoint = {
      id: `p_${Date.now()}`,
      name: `I`,
      x: ix,
      y: iy,
      color: '#ec4899',
      size: 6,
    };

    pushState({
      ...sketch,
      points: [...sketch.points, interPt],
    });
    setSelectedPointIds([interPt.id]);
    showToast(`✓ Đã dựng Giao điểm I (${ix}, ${iy}) [Ctrl+I]`);
  }, [selectedSegmentIds, sketch]);

  // 10.5. Dựng Điểm Trên Đối Tượng (Đoạn thẳng, Tia, Đường thẳng, Đường tròn) (Ctrl + Shift + O)
  const constructPointOnObject = useCallback(() => {
    if (selectedSegmentIds.length === 1) {
      const seg = sketch.segments.find((s) => s.id === selectedSegmentIds[0]);
      if (!seg) return;
      const p1 = sketch.points.find((p) => p.id === seg.p1Id);
      const p2 = sketch.points.find((p) => p.id === seg.p2Id);
      if (!p1 || !p2) return;

      const t = 0.5;
      const px = Math.round(p1.x + t * (p2.x - p1.x));
      const py = Math.round(p1.y + t * (p2.y - p1.y));
      const typeLabel = seg.type === 'segment' ? 'đoạn thẳng' : seg.type === 'ray' ? 'tia' : 'đường thẳng';

      const newPt: GSPPoint = {
        id: `p_${Date.now()}`,
        name: getNextPointLabel(),
        x: px,
        y: py,
        color: '#f59e0b',
        size: 6,
        onSegmentId: seg.id,
        tParam: t,
        animSpeed: 0.008,
      };

      pushState({
        ...sketch,
        points: [...sketch.points, newPt],
      });
      setSelectedPointIds([newPt.id]);
      showToast(`✓ Đã dựng Điểm ${newPt.name} gắn trên ${typeLabel} (Ctrl+Shift+O)`);
      return;
    }

    if (selectedCircleIds.length === 1) {
      const circ = sketch.circles.find((c) => c.id === selectedCircleIds[0]);
      if (!circ) return;
      const center = sketch.points.find((p) => p.id === circ.centerId);
      if (!center) return;
      let radius = circ.radius || 100;
      if (circ.radiusPointId) {
        const rp = sketch.points.find((p) => p.id === circ.radiusPointId);
        if (rp) radius = getDistance(center, rp);
      }
      const theta = Math.PI / 4;
      const px = Math.round(center.x + radius * Math.cos(theta));
      const py = Math.round(center.y + radius * Math.sin(theta));

      const newPt: GSPPoint = {
        id: `p_${Date.now()}`,
        name: getNextPointLabel(),
        x: px,
        y: py,
        color: '#10b981',
        size: 6,
        onCircleId: circ.id,
        angleParam: theta,
        animSpeed: 0.015,
      };

      pushState({
        ...sketch,
        points: [...sketch.points, newPt],
      });
      setSelectedPointIds([newPt.id]);
      showToast(`✓ Đã dựng Điểm ${newPt.name} gắn trên Đường tròn (Ctrl+Shift+O)`);
      return;
    }

    showToast('⚠️ Hãy chọn 1 đoạn thẳng, tia, đường thẳng hoặc đường tròn để dựng điểm gắn! (Ctrl+Shift+O)');
  }, [selectedSegmentIds, selectedCircleIds, sketch]);

  // 11. Ẩn / Hiện đối tượng (Ctrl + H / Ctrl + Shift + H)
  const hideSelectedObjects = useCallback(() => {
    const hasSel =
      selectedPointIds.length > 0 ||
      selectedSegmentIds.length > 0 ||
      selectedCircleIds.length > 0 ||
      selectedPolyIds.length > 0;

    if (!hasSel) {
      showToast('Hãy chọn đối tượng cần ẩn (Ctrl + H)');
      return;
    }

    pushState({
      ...sketch,
      points: sketch.points.map((p) => (selectedPointIds.includes(p.id) ? { ...p, hidden: true } : p)),
      segments: sketch.segments.map((s) => (selectedSegmentIds.includes(s.id) ? { ...s, hidden: true } : s)),
      circles: sketch.circles.map((c) => (selectedCircleIds.includes(c.id) ? { ...c, hidden: true } : c)),
      polygons: sketch.polygons.map((poly) => (selectedPolyIds.includes(poly.id) ? { ...poly, hidden: true } : poly)),
    });

    setSelectedPointIds([]);
    setSelectedSegmentIds([]);
    setSelectedCircleIds([]);
    setSelectedPolyIds([]);
    showToast('✓ Đã ẩn đối tượng đã chọn (Ctrl+H). Nhấn Ctrl+Shift+H để hiện lại.');
  }, [selectedPointIds, selectedSegmentIds, selectedCircleIds, selectedPolyIds, sketch]);

  const showAllObjects = useCallback(() => {
    pushState({
      ...sketch,
      points: sketch.points.map((p) => ({ ...p, hidden: false })),
      segments: sketch.segments.map((s) => ({ ...s, hidden: false })),
      circles: sketch.circles.map((c) => ({ ...c, hidden: false })),
      polygons: sketch.polygons.map((poly) => ({ ...poly, hidden: false })),
    });
    showToast('✓ Đã hiện lại tất cả các đối tượng bị ẩn (Ctrl+Shift+H)');
  }, [sketch]);

  // 12. Đo khoảng cách & Số đo góc
  const measureDistance = useCallback(() => {
    if (selectedPointIds.length !== 2 && selectedSegmentIds.length !== 1) {
      showToast('⚠️ Hãy chọn 2 điểm hoặc 1 đoạn thẳng để đo khoảng cách! (Ctrl + Shift + D)');
      return;
    }

    let p1: GSPPoint | undefined;
    let p2: GSPPoint | undefined;

    if (selectedPointIds.length === 2) {
      p1 = sketch.points.find((p) => p.id === selectedPointIds[0]);
      p2 = sketch.points.find((p) => p.id === selectedPointIds[1]);
    } else {
      const seg = sketch.segments.find((s) => s.id === selectedSegmentIds[0]);
      if (seg) {
        p1 = sketch.points.find((p) => p.id === seg.p1Id);
        p2 = sketch.points.find((p) => p.id === seg.p2Id);
      }
    }

    if (!p1 || !p2) return;
    const d = parseFloat((getDistance(p1, p2) / 35).toFixed(2));

    const newM: GSPMeasurement = {
      id: `m_${Date.now()}`,
      type: 'distance',
      targetIds: [p1.id, p2.id],
      label: `${p1.name}${p2.name}`,
      value: d,
      unit: 'cm',
      x: 740,
      y: 120 + sketch.measurements.length * 35,
    };

    pushState({
      ...sketch,
      measurements: [...sketch.measurements, newM],
    });
    showToast(`✓ Đã đo ${p1.name}${p2.name} = ${d} cm (Ctrl+Shift+D)`);
  }, [selectedPointIds, selectedSegmentIds, sketch]);

  const measureAngle = useCallback(() => {
    if (selectedPointIds.length !== 3) {
      showToast('⚠️ Hãy chọn 3 điểm (Điểm đỉnh ở giữa) để đo số đo góc! (Ctrl + Shift + G)');
      return;
    }

    const pA = sketch.points.find((p) => p.id === selectedPointIds[0]);
    const pB = sketch.points.find((p) => p.id === selectedPointIds[1]); // Vertex
    const pC = sketch.points.find((p) => p.id === selectedPointIds[2]);
    if (!pA || !pB || !pC) return;

    const d12 = getDistance(pB, pA);
    const d23 = getDistance(pB, pC);
    const d13 = getDistance(pA, pC);
    if (d12 === 0 || d23 === 0) return;

    const cosV = (d12 * d12 + d23 * d23 - d13 * d13) / (2 * d12 * d23);
    const angleDeg = Math.round((Math.acos(Math.max(-1, Math.min(1, cosV))) * 180) / Math.PI);

    const newM: GSPMeasurement = {
      id: `m_${Date.now()}`,
      type: 'angle',
      targetIds: [pA.id, pB.id, pC.id],
      label: `∠${pA.name}${pB.name}${pC.name}`,
      value: angleDeg,
      unit: '°',
      x: 740,
      y: 120 + sketch.measurements.length * 35,
    };

    pushState({
      ...sketch,
      measurements: [...sketch.measurements, newM],
    });
    showToast(`✓ Đã đo ∠${pA.name}${pB.name}${pC.name} = ${angleDeg}° (Ctrl+Shift+G)`);
  }, [selectedPointIds, sketch]);

  // 13. Delete Selected
  const deleteSelected = useCallback(() => {
    if (
      selectedPointIds.length === 0 &&
      selectedSegmentIds.length === 0 &&
      selectedCircleIds.length === 0 &&
      selectedPolyIds.length === 0 &&
      selectedMeasurementIds.length === 0
    ) {
      showToast('Chưa chọn đối tượng nào để xóa.');
      return;
    }

    const newPoints = sketch.points.filter((p) => !selectedPointIds.includes(p.id));
    const newSegs = sketch.segments.filter(
      (s) =>
        !selectedSegmentIds.includes(s.id) &&
        !selectedPointIds.includes(s.p1Id) &&
        !selectedPointIds.includes(s.p2Id)
    );
    const newCircles = sketch.circles.filter(
      (c) =>
        !selectedCircleIds.includes(c.id) &&
        !selectedPointIds.includes(c.centerId) &&
        (!c.radiusPointId || !selectedPointIds.includes(c.radiusPointId))
    );
    const newPolys = sketch.polygons.filter(
      (poly) =>
        !selectedPolyIds.includes(poly.id) &&
        !poly.pointIds.some((pId) => selectedPointIds.includes(pId))
    );
    const newMeasurements = sketch.measurements.filter((m) => !selectedMeasurementIds.includes(m.id));

    pushState({
      ...sketch,
      points: newPoints,
      segments: newSegs,
      circles: newCircles,
      polygons: newPolys,
      measurements: newMeasurements,
    });

    setSelectedPointIds([]);
    setSelectedSegmentIds([]);
    setSelectedCircleIds([]);
    setSelectedPolyIds([]);
    setSelectedMeasurementIds([]);
    showToast('Đã xóa đối tượng đã chọn.');
  }, [selectedPointIds, selectedSegmentIds, selectedCircleIds, selectedPolyIds, selectedMeasurementIds, sketch]);

  // ============================================================================
  // GSP ACTION BUTTONS (Nút Hành Động) ENGINE
  // ============================================================================
  // 1. Tạo Nút Hoạt Họa (Animate Action Button)
  const createAnimateActionButton = (targetPtIds?: string[], customLabel?: string) => {
    const pts = targetPtIds || (selectedPointIds.length > 0 ? selectedPointIds : undefined);
    const label = customLabel || (pts && pts.length > 0
      ? `🎬 Hoạt họa điểm (${pts.map((id) => sketch.points.find((p) => p.id === id)?.name || id).join(', ')})`
      : '🎬 Bật/Tắt Hoạt họa (Animation)');
    const newBtn: GSPActionButton = {
      id: `act_${Date.now()}`,
      type: 'animate',
      label,
      x: 230,
      y: 520,
      targetPointIds: pts,
    };
    pushState({
      ...sketch,
      actionButtons: [...(sketch.actionButtons || []), newBtn],
    });
    showToast(`✓ Đã tạo Nút Hành Động Hoạt Họa: ${label}`);
  };

  // 2. Tạo Nút Ẩn/Hiện (Hide/Show Action Button)
  const createHideShowActionButton = (customLabel?: string) => {
    if (
      selectedPointIds.length === 0 &&
      selectedSegmentIds.length === 0 &&
      selectedCircleIds.length === 0 &&
      selectedPolyIds.length === 0
    ) {
      showToast('⚠️ Vui lòng chọn ít nhất 1 đối tượng để tạo nút Ẩn/Hiện!');
      return;
    }
    const count = selectedPointIds.length + selectedSegmentIds.length + selectedCircleIds.length + selectedPolyIds.length;
    const label = customLabel || `👁️ Ẩn / Hiện (${count} đối tượng)`;
    const newBtn: GSPActionButton = {
      id: `act_${Date.now()}`,
      type: 'hide_show',
      label,
      x: 230,
      y: 520,
      targetPointIds: [...selectedPointIds],
      targetSegmentIds: [...selectedSegmentIds],
      targetCircleIds: [...selectedCircleIds],
      targetPolyIds: [...selectedPolyIds],
    };
    pushState({
      ...sketch,
      actionButtons: [...(sketch.actionButtons || []), newBtn],
    });
    showToast(`✓ Đã tạo Nút Ẩn/Hiện cho ${count} đối tượng`);
  };

  // 3. Tạo Nút Dịch Chuyển (Movement Action Button)
  const createMovementActionButton = (sourceId: string, destId: string, customLabel?: string) => {
    const p1 = sketch.points.find((p) => p.id === sourceId);
    const p2 = sketch.points.find((p) => p.id === destId);
    if (!p1 || !p2) {
      showToast('⚠️ Cần chọn điểm gốc và điểm đích hợp lệ!');
      return;
    }
    const label = customLabel || `🚀 Dịch chuyển ${p1.name} → ${p2.name}`;
    const newBtn: GSPActionButton = {
      id: `act_${Date.now()}`,
      type: 'movement',
      label,
      x: 230,
      y: 520,
      sourcePointId: sourceId,
      destinationPointId: destId,
    };
    pushState({
      ...sketch,
      actionButtons: [...(sketch.actionButtons || []), newBtn],
    });
    showToast(`✓ Đã tạo Nút Dịch chuyển ${p1.name} → ${p2.name}`);
  };

  // 4. Tạo Nút Chuyển Trang (Link Action Button)
  const createLinkActionButton = (targetPageId: string, pageTitle: string, customLabel?: string) => {
    const label = customLabel || `📑 Chuyển tới: ${pageTitle}`;
    const newBtn: GSPActionButton = {
      id: `act_${Date.now()}`,
      type: 'link',
      label,
      x: 230,
      y: 520,
      targetPageId,
    };
    pushState({
      ...sketch,
      actionButtons: [...(sketch.actionButtons || []), newBtn],
    });
    showToast(`✓ Đã tạo Nút Chuyển Trang tới ${pageTitle}`);
  };

  // 5. Thực thi Nút Hành Động khi người dùng bấm chuột (Execute Action Button)
  const handleExecuteActionButton = (btn: GSPActionButton) => {
    if (btn.type === 'animate') {
      const ptIds = btn.targetPointIds || [];
      if (ptIds.length > 0) {
        setSketch((prev) => ({
          ...prev,
          points: prev.points.map((p) => (ptIds.includes(p.id) ? { ...p, isAnimating: !p.isAnimating } : p)),
        }));
        setIsAnimationRunning(true);
      } else {
        setIsAnimationRunning((prev) => !prev);
      }
      showToast(`🎬 [Nút Hành Động]: ${btn.label}`);
    } else if (btn.type === 'hide_show') {
      const ptIds = btn.targetPointIds || [];
      const segIds = btn.targetSegmentIds || [];
      const circIds = btn.targetCircleIds || [];
      const polyIds = btn.targetPolyIds || [];

      setSketch((prev) => {
        const isCurrentlyHidden =
          prev.points.some((p) => ptIds.includes(p.id) && p.hidden) ||
          prev.segments.some((s) => segIds.includes(s.id) && s.hidden) ||
          prev.circles.some((c) => circIds.includes(c.id) && c.hidden) ||
          prev.polygons.some((poly) => polyIds.includes(poly.id) && poly.hidden);

        const nextHidden = !isCurrentlyHidden;

        return {
          ...prev,
          points: prev.points.map((p) => (ptIds.includes(p.id) ? { ...p, hidden: nextHidden } : p)),
          segments: prev.segments.map((s) => (segIds.includes(s.id) ? { ...s, hidden: nextHidden } : s)),
          circles: prev.circles.map((c) => (circIds.includes(c.id) ? { ...c, hidden: nextHidden } : c)),
          polygons: prev.polygons.map((poly) => (polyIds.includes(poly.id) ? { ...poly, hidden: nextHidden } : poly)),
        };
      });
      showToast(`👁️ [Nút Hành Động]: Đã chuyển đổi trạng thái ẩn/hiện (${btn.label})`);
    } else if (btn.type === 'movement') {
      if (btn.sourcePointId && btn.destinationPointId) {
        animateMovement(btn.sourcePointId, btn.destinationPointId);
      }
    } else if (btn.type === 'link') {
      if (btn.targetPageId) {
        handleSwitchPage(btn.targetPageId);
        showToast(`📑 [Nút Hành Động]: Đã chuyển tới trang`);
      }
    }
  };

  // 6. Hiệu ứng Di chuyển mượt mà giữa 2 điểm (Smooth Point Interpolation)
  const animateMovement = (srcId: string, destId: string) => {
    const pSrc = sketch.points.find((p) => p.id === srcId);
    const pDest = sketch.points.find((p) => p.id === destId);
    if (!pSrc || !pDest) return;
    const startX = pSrc.x;
    const startY = pSrc.y;
    const targetX = pDest.x;
    const targetY = pDest.y;
    const startTime = performance.now();
    const duration = 1200;

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const ease = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      setSketch((prev) => ({
        ...prev,
        points: prev.points.map((p) =>
          p.id === srcId
            ? { ...p, x: Math.round(startX + (targetX - startX) * ease), y: Math.round(startY + (targetY - startY) * ease) }
            : p
        ),
      }));

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        showToast(`✓ Đã hoàn tất dịch chuyển ${pSrc.name} → ${pDest.name}`);
      }
    };
    requestAnimationFrame(step);
  };

  // 7. Xóa nút hành động
  const handleDeleteActionButton = (btnId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    pushState({
      ...sketch,
      actionButtons: (sketch.actionButtons || []).filter((b) => b.id !== btnId),
    });
    showToast('Đã xóa nút hành động.');
  };

  // ============================================================================
  // GSP STANDARD KEYBOARD SHORTCUTS ENGINE
  // ============================================================================
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      if (e.ctrlKey || e.metaKey) {
        const key = e.key.toUpperCase();

        if (key === 'L') {
          // CTRL + L (Đoạn thẳng) hoặc CTRL + SHIFT + L (Đường thẳng)
          e.preventDefault();
          if (e.shiftKey) {
            constructLine();
          } else {
            constructSegment();
          }
        } else if (key === 'M') {
          // CTRL + M (Trung điểm) hoặc CTRL + SHIFT + M (Đánh dấu tâm)
          e.preventDefault();
          if (e.shiftKey) {
            if (selectedPointIds.length === 1) {
              setSketch((prev) => ({ ...prev, markedCenterId: selectedPointIds[0] }));
              showToast(`✓ Đã đánh dấu tâm biến hình: ${selectedPointIds[0]} (Ctrl+Shift+M)`);
            } else {
              showToast('⚠️ Hãy chọn 1 điểm để đánh dấu tâm (Ctrl+Shift+M)');
            }
          } else {
            constructMidpoint();
          }
        } else if (key === 'P') {
          // CTRL + P (Miền trong đa giác) hoặc CTRL + SHIFT + P (Đường vuông góc)
          e.preventDefault();
          if (e.shiftKey) {
            constructPerpendicular();
          } else {
            constructPolygonInterior();
          }
        } else if (key === 'F') {
          // CTRL + SHIFT + F (Đường song song)
          if (e.shiftKey) {
            e.preventDefault();
            constructParallel();
          }
        } else if (key === 'B') {
          // CTRL + SHIFT + B (Đường phân giác góc)
          if (e.shiftKey) {
            e.preventDefault();
            constructAngleBisector();
          }
        } else if (key === 'O') {
          // CTRL + SHIFT + O (Dựng điểm gắn với đoạn thẳng, tia, đường thẳng hoặc đường tròn)
          if (e.shiftKey) {
            e.preventDefault();
            constructPointOnObject();
          }
        } else if (key === 'C') {
          // CTRL + SHIFT + C (Dựng đường tròn theo tâm & bán kính)
          if (e.shiftKey) {
            e.preventDefault();
            constructCircleByPoints();
          }
        } else if (key === 'I') {
          // CTRL + I (Dựng giao điểm 2 đường)
          e.preventDefault();
          constructIntersection();
        } else if (key === 'R') {
          // CTRL + R (Hộp thoại Phép quay) hoặc CTRL + SHIFT + R (Dựng Tia)
          e.preventDefault();
          if (e.shiftKey) {
            constructRay();
          } else {
            setTransformType('rotate');
            setShowTransformModal(true);
          }
        } else if (key === 'T') {
          // CTRL + T (Hộp thoại Phép tịnh tiến)
          e.preventDefault();
          setTransformType('translate');
          setShowTransformModal(true);
        } else if (key === 'D') {
          // CTRL + D (Hộp thoại Phép vị tự) hoặc CTRL + SHIFT + D (Đo khoảng cách)
          e.preventDefault();
          if (e.shiftKey) {
            measureDistance();
          } else {
            setTransformType('dilate');
            setShowTransformModal(true);
          }
        } else if (key === 'G') {
          // CTRL + G (Bật tắt lưới) hoặc CTRL + SHIFT + G (Đo số đo góc)
          e.preventDefault();
          if (e.shiftKey) {
            measureAngle();
          } else {
            setShowGrid((prev) => !prev);
            showToast('Đã chuyển đổi hiển thị lưới tọa độ (Ctrl+G)');
          }
        } else if (key === 'K') {
          // CTRL + K (Máy tính GSP)
          e.preventDefault();
          setShowCalculator((prev) => !prev);
        } else if (key === 'H') {
          // CTRL + H (Ẩn đối tượng) hoặc CTRL + SHIFT + H (Hiện tất cả đối tượng)
          e.preventDefault();
          if (e.shiftKey) {
            showAllObjects();
          } else {
            hideSelectedObjects();
          }
        } else if (key === 'A') {
          // CTRL + A (Chọn tất cả)
          e.preventDefault();
          handleSelectAll();
        } else if (key === 'N') {
          // CTRL + N (Trang mới)
          e.preventDefault();
          handleCreateNewPage(true);
        } else if (key === 'S') {
          // CTRL + S (Lưu file .gsp)
          e.preventDefault();
          handleExportGSP();
        } else if (key === 'Z') {
          // CTRL + Z (Undo) / CTRL + SHIFT + Z (Redo)
          e.preventDefault();
          if (e.shiftKey) handleRedo();
          else handleUndo();
        } else if (key === 'Y') {
          // CTRL + Y (Redo)
          e.preventDefault();
          handleRedo();
        }
      } else {
        // Phím không kèm CTRL:
        if (e.key === 'Delete' || e.key === 'Backspace') {
          deleteSelected();
        } else if (e.key === 'Escape' || e.key === '1' || e.key === 'v' || e.key === 'V') {
          setActiveTool('select');
        } else if (e.key === '2' || e.key === 'p' || e.key === 'P') {
          setActiveTool('point');
        } else if (e.key === '3' || e.key === 'c' || e.key === 'C') {
          setActiveTool('circle');
        } else if (e.key === '4' || e.key === 's' || e.key === 'S') {
          setActiveTool('segment');
        } else if (e.key === '5' || e.key === 't' || e.key === 'T') {
          setActiveTool('text');
        } else if (e.key === ' ' || e.code === 'Space') {
          e.preventDefault();
          setIsAnimationRunning((prev) => !prev);
          showToast(!isAnimationRunning ? '▶ Bắt đầu chuyển động hoạt họa' : '⏸ Đã tạm dừng hoạt họa');
        } else if (e.key === '?' || e.key === 'F1') {
          e.preventDefault();
          setShowShortcutsModal(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    constructSegment,
    constructLine,
    constructRay,
    constructCircleByPoints,
    constructMidpoint,
    constructPerpendicular,
    constructParallel,
    constructAngleBisector,
    constructPointOnObject,
    constructPolygonInterior,
    constructIntersection,
    hideSelectedObjects,
    showAllObjects,
    measureDistance,
    measureAngle,
    deleteSelected,
    handleSelectAll,
    selectedPointIds,
    isAnimationRunning,
  ]);

  // Generate unique letter for point (A, B, C... Z, A1, B1...)
  const getNextPointLabel = (): string => {
    const usedNames = new Set(sketch.points.map((p) => p.name.split(' ')[0]));
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let i = 0; i < alphabet.length; i++) {
      if (!usedNames.has(alphabet[i])) return alphabet[i];
    }
    for (let round = 1; round <= 10; round++) {
      for (let i = 0; i < alphabet.length; i++) {
        const candidate = `${alphabet[i]}${round}`;
        if (!usedNames.has(candidate)) return candidate;
      }
    }
    return `P${sketch.points.length + 1}`;
  };

  // Find nearest point within threshold
  const findNearPoint = (x: number, y: number, threshold = 16): GSPPoint | undefined => {
    return sketch.points.find((p) => Math.hypot(p.x - x, p.y - y) <= threshold);
  };

  // Find nearest segment, ray, or line within threshold
  const findNearSegment = (x: number, y: number, threshold = 14): GSPSegment | undefined => {
    return sketch.segments.find((seg) => {
      const p1 = sketch.points.find((p) => p.id === seg.p1Id);
      const p2 = sketch.points.find((p) => p.id === seg.p2Id);
      if (!p1 || !p2) return false;
      const l2 = (p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2;
      if (l2 === 0) return Math.hypot(x - p1.x, y - p1.y) <= threshold;
      let t = ((x - p1.x) * (p2.x - p1.x) + (y - p1.y) * (p2.y - p1.y)) / l2;
      if (seg.type === 'segment') {
        t = Math.max(0, Math.min(1, t));
      } else if (seg.type === 'ray') {
        t = Math.max(0, t);
      }
      const projX = p1.x + t * (p2.x - p1.x);
      const projY = p1.y + t * (p2.y - p1.y);
      return Math.hypot(x - projX, y - projY) <= threshold;
    });
  };

  // Find nearest circle perimeter within threshold
  const findNearCircle = (x: number, y: number, threshold = 14): GSPCircle | undefined => {
    return sketch.circles.find((circ) => {
      const center = sketch.points.find((p) => p.id === circ.centerId);
      if (!center) return false;
      let radius = circ.radius || 100;
      if (circ.radiusPointId) {
        const rp = sketch.points.find((p) => p.id === circ.radiusPointId);
        if (rp) radius = getDistance(center, rp);
      }
      const dist = Math.hypot(x - center.x, y - center.y);
      return Math.abs(dist - radius) <= threshold;
    });
  };

  // Helper to recompute constrained point position from parent segment / circle
  const computePointCoordinates = (
    p: GSPPoint,
    allPoints: GSPPoint[],
    allSegments: GSPSegment[],
    allCircles: GSPCircle[]
  ): { x: number; y: number } => {
    if (p.onSegmentId) {
      const seg = allSegments.find((s) => s.id === p.onSegmentId);
      if (seg) {
        const p1 = allPoints.find((pt) => pt.id === seg.p1Id);
        const p2 = allPoints.find((pt) => pt.id === seg.p2Id);
        if (p1 && p2) {
          let t = p.tParam ?? 0.5;
          if (seg.type === 'segment') t = Math.max(0, Math.min(1, t));
          else if (seg.type === 'ray') t = Math.max(0, t);
          return {
            x: Math.round(p1.x + t * (p2.x - p1.x)),
            y: Math.round(p1.y + t * (p2.y - p1.y)),
          };
        }
      }
    } else if (p.onCircleId) {
      const circ = allCircles.find((c) => c.id === p.onCircleId);
      if (circ) {
        const center = allPoints.find((pt) => pt.id === circ.centerId);
        if (center) {
          let radius = circ.radius || 100;
          if (circ.radiusPointId) {
            const rp = allPoints.find((pt) => pt.id === circ.radiusPointId);
            if (rp) radius = getDistance(center, rp);
          }
          const angle = p.angleParam ?? 0;
          return {
            x: Math.round(center.x + radius * Math.cos(angle)),
            y: Math.round(center.y + radius * Math.sin(angle)),
          };
        }
      }
    }
    return { x: p.x, y: p.y };
  };

  // Animation Loop for GSP animated points / traces
  useEffect(() => {
    if (!isAnimationRunning) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    let lastTime = performance.now();

    const animateLoop = (time: number) => {
      const delta = (time - lastTime) / 1000;
      lastTime = time;

      setSketch((prev) => {
        let hasChanges = false;
        const updatedPoints = prev.points.map((p) => {
          if (!p.isAnimating) return p;

          hasChanges = true;

          // 1. Point constrained to Segment / Ray / Line
          if (p.onSegmentId) {
            const seg = prev.segments.find((s) => s.id === p.onSegmentId);
            if (seg) {
              const p1 = prev.points.find((pt) => pt.id === seg.p1Id);
              const p2 = prev.points.find((pt) => pt.id === seg.p2Id);
              if (p1 && p2) {
                let t = p.tParam ?? 0.5;
                let step = (p.animSpeed || 0.008) * animSpeedMultiplier;
                let nextT = t + step;

                if (seg.type === 'segment') {
                  if (nextT > 1) {
                    nextT = 2 - nextT;
                    p.animSpeed = -Math.abs(p.animSpeed || 0.008);
                  } else if (nextT < 0) {
                    nextT = -nextT;
                    p.animSpeed = Math.abs(p.animSpeed || 0.008);
                  }
                } else if (seg.type === 'ray') {
                  if (nextT > 2.2) {
                    nextT = 2.2 - (nextT - 2.2);
                    p.animSpeed = -Math.abs(p.animSpeed || 0.008);
                  } else if (nextT < 0.05) {
                    nextT = 0.05 + (0.05 - nextT);
                    p.animSpeed = Math.abs(p.animSpeed || 0.008);
                  }
                } else {
                  if (nextT > 2.0) {
                    p.animSpeed = -Math.abs(p.animSpeed || 0.008);
                  } else if (nextT < -1.0) {
                    p.animSpeed = Math.abs(p.animSpeed || 0.008);
                  }
                }

                return {
                  ...p,
                  tParam: nextT,
                  x: Math.round(p1.x + nextT * (p2.x - p1.x)),
                  y: Math.round(p1.y + nextT * (p2.y - p1.y)),
                };
              }
            }
          }

          // 2. Point constrained to Circle
          if (p.onCircleId) {
            const circ = prev.circles.find((c) => c.id === p.onCircleId);
            if (circ) {
              const center = prev.points.find((pt) => pt.id === circ.centerId);
              if (center) {
                let radius = circ.radius || 100;
                if (circ.radiusPointId) {
                  const rp = prev.points.find((pt) => pt.id === circ.radiusPointId);
                  if (rp) radius = getDistance(center, rp);
                }
                const speed = (p.animSpeed || 0.015) * animSpeedMultiplier;
                const currentAngle = p.angleParam ?? 0;
                const nextAngle = (currentAngle + speed) % (2 * Math.PI);
                return {
                  ...p,
                  angleParam: nextAngle,
                  x: Math.round(center.x + radius * Math.cos(nextAngle)),
                  y: Math.round(center.y + radius * Math.sin(nextAngle)),
                };
              }
            }
          }

          // 3. Special case for ellipse locus preset
          if (p.id === 'pM' && prev.points.find((x) => x.id === 'pF1')) {
            const speed = (p.animSpeed || 0.015) * animSpeedMultiplier;
            const currentAngle = p.angleParam ?? Math.atan2(p.y - 320, p.x - 450);
            const nextAngle = currentAngle + speed;
            const a = 140; // Semi-major axis
            const b = 90; // Semi-minor axis
            const centerX = 450;
            const centerY = 300;
            return {
              ...p,
              angleParam: nextAngle,
              x: Math.round(centerX + a * Math.cos(nextAngle)),
              y: Math.round(centerY + b * Math.sin(nextAngle)),
            };
          }

          // 4. Default circular path
          const speed = (p.animSpeed || 0.015) * animSpeedMultiplier;
          const currentAngle = p.angleParam ?? Math.atan2(p.y - 320, p.x - 450);
          const nextAngle = currentAngle + speed;
          const cX = 450;
          const cY = 320;
          const radius = 180;
          return {
            ...p,
            angleParam: nextAngle,
            x: Math.round(cX + radius * Math.cos(nextAngle)),
            y: Math.round(cY + radius * Math.sin(nextAngle)),
          };
        });

        // Recalculate dynamic measurements based on new point locations
        const updatedMeasurements = prev.measurements.map((m) => {
          if (m.type === 'distance' && m.targetIds.length >= 2) {
            const p1 = updatedPoints.find((p) => p.id === m.targetIds[0]);
            const p2 = updatedPoints.find((p) => p.id === m.targetIds[1]);
            if (p1 && p2) {
              const d = parseFloat((getDistance(p1, p2) / 35).toFixed(2));
              return { ...m, value: d };
            }
          } else if (m.type === 'angle' && m.targetIds.length >= 3) {
            const p1 = updatedPoints.find((p) => p.id === m.targetIds[0]);
            const p2 = updatedPoints.find((p) => p.id === m.targetIds[1]); // Vertex
            const p3 = updatedPoints.find((p) => p.id === m.targetIds[2]);
            if (p1 && p2 && p3) {
              const d12 = getDistance(p2, p1);
              const d23 = getDistance(p2, p3);
              const d13 = getDistance(p1, p3);
              if (d12 > 0 && d23 > 0) {
                const cosV = (d12 * d12 + d23 * d23 - d13 * d13) / (2 * d12 * d23);
                const angleDeg = Math.round((Math.acos(Math.max(-1, Math.min(1, cosV))) * 180) / Math.PI);
                return { ...m, value: angleDeg };
              }
            }
          }
          return m;
        });

        return {
          ...prev,
          points: updatedPoints,
          measurements: updatedMeasurements,
        };
      });

      animFrameRef.current = requestAnimationFrame(animateLoop);
    };

    animFrameRef.current = requestAnimationFrame(animateLoop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isAnimationRunning, animSpeedMultiplier]);

  // Handle Canvas Click & Drag Operations
  const handleCanvasMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    const coords = getSvgCoordinates(e);
    const clickedPoint = findNearPoint(coords.x, coords.y);
    const clickedSeg = !clickedPoint ? findNearSegment(coords.x, coords.y) : undefined;
    const clickedCircle = !clickedPoint && !clickedSeg ? findNearCircle(coords.x, coords.y) : undefined;

    if (activeTool === 'select') {
      if (clickedPoint) {
        setIsDragging(true);
        setDraggedPointId(clickedPoint.id);
        setDraggedOffset({ x: coords.x - clickedPoint.x, y: coords.y - clickedPoint.y });

        if (e.shiftKey) {
          setSelectedPointIds((prev) =>
            prev.includes(clickedPoint.id) ? prev.filter((id) => id !== clickedPoint.id) : [...prev, clickedPoint.id]
          );
        } else {
          setSelectedPointIds([clickedPoint.id]);
          setSelectedSegmentIds([]);
          setSelectedCircleIds([]);
        }
      } else if (clickedSeg) {
        if (e.shiftKey) {
          setSelectedSegmentIds((prev) =>
            prev.includes(clickedSeg.id) ? prev.filter((id) => id !== clickedSeg.id) : [...prev, clickedSeg.id]
          );
        } else {
          setSelectedSegmentIds([clickedSeg.id]);
          setSelectedPointIds([]);
          setSelectedCircleIds([]);
        }
      } else if (clickedCircle) {
        if (e.shiftKey) {
          setSelectedCircleIds((prev) =>
            prev.includes(clickedCircle.id) ? prev.filter((id) => id !== clickedCircle.id) : [...prev, clickedCircle.id]
          );
        } else {
          setSelectedCircleIds([clickedCircle.id]);
          setSelectedPointIds([]);
          setSelectedSegmentIds([]);
        }
      } else {
        // Clear selections if clicked on empty background
        setSelectedPointIds([]);
        setSelectedSegmentIds([]);
        setSelectedCircleIds([]);
        setSelectedPolyIds([]);
      }
      return;
    }

    if (activeTool === 'point') {
      // 1. If clicked on/near a segment, ray, or line: create constrained point on that segment!
      if (clickedSeg) {
        const p1 = sketch.points.find((p) => p.id === clickedSeg.p1Id);
        const p2 = sketch.points.find((p) => p.id === clickedSeg.p2Id);
        if (p1 && p2) {
          const l2 = (p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2;
          let t = 0.5;
          if (l2 > 0) {
            t = ((coords.x - p1.x) * (p2.x - p1.x) + (coords.y - p1.y) * (p2.y - p1.y)) / l2;
            if (clickedSeg.type === 'segment') t = Math.max(0.02, Math.min(0.98, t));
            else if (clickedSeg.type === 'ray') t = Math.max(0.02, t);
          }
          const px = Math.round(p1.x + t * (p2.x - p1.x));
          const py = Math.round(p1.y + t * (p2.y - p1.y));
          const typeName = clickedSeg.type === 'segment' ? 'đoạn thẳng' : clickedSeg.type === 'ray' ? 'tia' : 'đường thẳng';

          const newPt: GSPPoint = {
            id: `p_${Date.now()}`,
            name: getNextPointLabel(),
            x: px,
            y: py,
            color: '#f59e0b',
            size: 6,
            onSegmentId: clickedSeg.id,
            tParam: t,
            animSpeed: 0.008,
          };
          pushState({
            ...sketch,
            points: [...sketch.points, newPt],
          });
          setSelectedPointIds([newPt.id]);
          showToast(`✓ Đã tạo điểm ${newPt.name} gắn trên ${typeName} (t = ${t.toFixed(2)})`);
          return;
        }
      }

      // 2. If clicked on/near a circle: create constrained point on circle!
      if (clickedCircle) {
        const center = sketch.points.find((p) => p.id === clickedCircle.centerId);
        if (center) {
          let radius = clickedCircle.radius || 100;
          if (clickedCircle.radiusPointId) {
            const rp = sketch.points.find((p) => p.id === clickedCircle.radiusPointId);
            if (rp) radius = getDistance(center, rp);
          }
          const angle = Math.atan2(coords.y - center.y, coords.x - center.x);
          const px = Math.round(center.x + radius * Math.cos(angle));
          const py = Math.round(center.y + radius * Math.sin(angle));

          const newPt: GSPPoint = {
            id: `p_${Date.now()}`,
            name: getNextPointLabel(),
            x: px,
            y: py,
            color: '#10b981',
            size: 6,
            onCircleId: clickedCircle.id,
            angleParam: angle,
            animSpeed: 0.015,
          };
          pushState({
            ...sketch,
            points: [...sketch.points, newPt],
          });
          setSelectedPointIds([newPt.id]);
          showToast(`✓ Đã tạo điểm ${newPt.name} gắn trên đường tròn`);
          return;
        }
      }

      // 3. Default free Point
      const newPt: GSPPoint = {
        id: `p_${Date.now()}`,
        name: getNextPointLabel(),
        x: coords.x,
        y: coords.y,
        color: activeColor,
        size: 6,
      };
      pushState({
        ...sketch,
        points: [...sketch.points, newPt],
      });
      setSelectedPointIds([newPt.id]);
      showToast(`Đã tạo điểm ${newPt.name}`);
      return;
    }

    if (activeTool === 'segment' || activeTool === 'ray' || activeTool === 'line') {
      let p1 = clickedPoint;
      if (!p1) {
        p1 = {
          id: `p_${Date.now()}`,
          name: getNextPointLabel(),
          x: coords.x,
          y: coords.y,
          color: activeColor,
          size: 6,
        };
        setSketch((prev) => ({ ...prev, points: [...prev.points, p1!] }));
      }
      setTempStartPoint(p1);
      setIsDragging(true);
      return;
    }

    if (activeTool === 'circle') {
      let center = clickedPoint;
      if (!center) {
        center = {
          id: `p_${Date.now()}`,
          name: getNextPointLabel(),
          x: coords.x,
          y: coords.y,
          color: activeColor,
          size: 6,
        };
        setSketch((prev) => ({ ...prev, points: [...prev.points, center!] }));
      }
      setTempStartPoint(center);
      setIsDragging(true);
      return;
    }

    if (activeTool === 'text') {
      const textVal = prompt('Nhập nội dung văn bản / ghi chú hình học:', '△ABC vuông tại A');
      if (textVal) {
        const newTxt: GSPTextLabel = {
          id: `txt_${Date.now()}`,
          text: textVal,
          x: coords.x,
          y: coords.y,
          fontSize: 14,
          color: activeColor,
        };
        pushState({
          ...sketch,
          texts: [...sketch.texts, newTxt],
        });
        showToast('Đã thêm nhãn văn bản');
      }
      return;
    }

    if (activeTool === 'action_button') {
      setShowActionButtonModal(true);
      return;
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    const coords = getSvgCoordinates(e);
    setMousePos(coords);

    if (isDragging && draggedActionButtonId) {
      setSketch((prev) => ({
        ...prev,
        actionButtons: (prev.actionButtons || []).map((b) =>
          b.id === draggedActionButtonId
            ? { ...b, x: Math.max(20, Math.min(940, coords.x - 40)), y: Math.max(20, Math.min(560, coords.y)) }
            : b
        ),
      }));
      return;
    }

    if (isDragging && draggedPointId) {
      setSketch((prev) => {
        const currentPt = prev.points.find((p) => p.id === draggedPointId);
        if (!currentPt || currentPt.pinned) return prev;

        let newX = coords.x - draggedOffset.x;
        let newY = coords.y - draggedOffset.y;
        let newTParam = currentPt.tParam;
        let newAngleParam = currentPt.angleParam;

        // Constrain point if attached to Segment / Ray / Line
        if (currentPt.onSegmentId) {
          const seg = prev.segments.find((s) => s.id === currentPt.onSegmentId);
          if (seg) {
            const p1 = prev.points.find((p) => p.id === seg.p1Id);
            const p2 = prev.points.find((p) => p.id === seg.p2Id);
            if (p1 && p2) {
              const l2 = (p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2;
              if (l2 > 0) {
                let t = ((coords.x - p1.x) * (p2.x - p1.x) + (coords.y - p1.y) * (p2.y - p1.y)) / l2;
                if (seg.type === 'segment') {
                  t = Math.max(0, Math.min(1, t));
                } else if (seg.type === 'ray') {
                  t = Math.max(0, t);
                }
                newTParam = t;
                newX = Math.round(p1.x + t * (p2.x - p1.x));
                newY = Math.round(p1.y + t * (p2.y - p1.y));
              }
            }
          }
        } else if (currentPt.onCircleId) {
          // Constrain point if attached to Circle
          const circ = prev.circles.find((c) => c.id === currentPt.onCircleId);
          if (circ) {
            const center = prev.points.find((p) => p.id === circ.centerId);
            if (center) {
              let radius = circ.radius || 100;
              if (circ.radiusPointId) {
                const rp = prev.points.find((p) => p.id === circ.radiusPointId);
                if (rp) radius = getDistance(center, rp);
              }
              const angle = Math.atan2(coords.y - center.y, coords.x - center.x);
              newAngleParam = angle;
              newX = Math.round(center.x + radius * Math.cos(angle));
              newY = Math.round(center.y + radius * Math.sin(angle));
            }
          }
        } else {
          newX = Math.max(30, Math.min(970, newX));
          newY = Math.max(30, Math.min(570, newY));
        }

        // 1. Update directly moved point
        let updatedPoints = prev.points.map((p) => {
          if (p.id !== draggedPointId) return p;
          return {
            ...p,
            x: newX,
            y: newY,
            tParam: newTParam,
            angleParam: newAngleParam,
          };
        });

        // 2. Cascade update all child points on segments/circles whose parents moved
        updatedPoints = updatedPoints.map((p) => {
          if (p.id === draggedPointId) return p;
          if (p.onSegmentId || p.onCircleId) {
            const pos = computePointCoordinates(p, updatedPoints, prev.segments, prev.circles);
            return { ...p, x: pos.x, y: pos.y };
          }
          return p;
        });

        // 3. Update dynamic measurements in real-time
        const updatedMeasurements = prev.measurements.map((m) => {
          if (m.type === 'distance' && m.targetIds.length >= 2) {
            const p1 = updatedPoints.find((p) => p.id === m.targetIds[0]);
            const p2 = updatedPoints.find((p) => p.id === m.targetIds[1]);
            if (p1 && p2) {
              const d = parseFloat((getDistance(p1, p2) / 35).toFixed(2));
              return { ...m, value: d };
            }
          } else if (m.type === 'angle' && m.targetIds.length >= 3) {
            const p1 = updatedPoints.find((p) => p.id === m.targetIds[0]);
            const p2 = updatedPoints.find((p) => p.id === m.targetIds[1]);
            const p3 = updatedPoints.find((p) => p.id === m.targetIds[2]);
            if (p1 && p2 && p3) {
              const d12 = getDistance(p2, p1);
              const d23 = getDistance(p2, p3);
              const d13 = getDistance(p1, p3);
              if (d12 > 0 && d23 > 0) {
                const cosV = (d12 * d12 + d23 * d23 - d13 * d13) / (2 * d12 * d23);
                const angleDeg = Math.round((Math.acos(Math.max(-1, Math.min(1, cosV))) * 180) / Math.PI);
                return { ...m, value: angleDeg };
              }
            }
          }
          return m;
        });

        return {
          ...prev,
          points: updatedPoints,
          measurements: updatedMeasurements,
        };
      });
    }
  };

  const handleCanvasMouseUp = (e: React.MouseEvent | React.TouchEvent) => {
    const coords = getSvgCoordinates(e);

    if (isDragging && draggedActionButtonId) {
      pushState(sketch);
      setDraggedActionButtonId(null);
    }

    if (isDragging && tempStartPoint) {
      const endPt = findNearPoint(coords.x, coords.y);
      let targetEnd = endPt;

      if (!targetEnd) {
        targetEnd = {
          id: `p_${Date.now()}`,
          name: getNextPointLabel(),
          x: coords.x,
          y: coords.y,
          color: activeColor,
          size: 6,
        };
      }

      if (activeTool === 'segment' || activeTool === 'ray' || activeTool === 'line') {
        if (targetEnd.id !== tempStartPoint.id) {
          const newSeg: GSPSegment = {
            id: `s_${Date.now()}`,
            p1Id: tempStartPoint.id,
            p2Id: targetEnd.id,
            type: activeTool,
            color: activeColor,
            strokeWidth: activeStrokeWidth,
            lineStyle: activeLineStyle,
          };

          const currentPoints = sketch.points.some((p) => p.id === targetEnd!.id)
            ? sketch.points
            : [...sketch.points, targetEnd];

          pushState({
            ...sketch,
            points: currentPoints,
            segments: [...sketch.segments, newSeg],
          });
          showToast(`Đã nối ${tempStartPoint.name}${targetEnd.name}`);
        }
      } else if (activeTool === 'circle') {
        const radiusVal = getDistance(tempStartPoint, targetEnd);
        if (radiusVal > 5) {
          const newCircle: GSPCircle = {
            id: `c_${Date.now()}`,
            centerId: tempStartPoint.id,
            radiusPointId: targetEnd.id,
            radius: radiusVal,
            color: activeColor,
            strokeWidth: activeStrokeWidth,
            lineStyle: activeLineStyle === 'dotted' ? 'dashed' : activeLineStyle,
          };

          const currentPoints = sketch.points.some((p) => p.id === targetEnd!.id)
            ? sketch.points
            : [...sketch.points, targetEnd];

          pushState({
            ...sketch,
            points: currentPoints,
            circles: [...sketch.circles, newCircle],
          });
          showToast(`Đã dựng đường tròn tâm ${tempStartPoint.name}`);
        }
      }
    }

    if (isDragging && draggedPointId) {
      pushState(sketch);
    }

    setIsDragging(false);
    setDraggedPointId(null);
    setTempStartPoint(null);
  };

  // ============================================================================
  // GSP TRANSFORM MENU (Biến hình GSP)
  // ============================================================================
  const executeTransform = () => {
    if (selectedPointIds.length === 0) {
      showToast('⚠️ Hãy chọn các điểm/đối tượng cần biến hình!');
      return;
    }

    let markedCenter = sketch.markedCenterId
      ? sketch.points.find((p) => p.id === sketch.markedCenterId)
      : sketch.points[0];

    if (!markedCenter) markedCenter = { id: 'c0', name: 'O', x: 450, y: 300, color: '#fff', size: 5 };

    const transformedPoints: GSPPoint[] = [];
    const newSegments: GSPSegment[] = [];

    const rad = (transformAngle * Math.PI) / 180;
    const cosA = Math.cos(rad);
    const sinA = Math.sin(rad);

    selectedPointIds.forEach((ptId) => {
      const orig = sketch.points.find((p) => p.id === ptId);
      if (!orig) return;

      let newX = orig.x;
      let newY = orig.y;

      if (transformType === 'rotate') {
        const relX = orig.x - markedCenter.x;
        const relY = orig.y - markedCenter.y;
        newX = markedCenter.x + relX * cosA - relY * sinA;
        newY = markedCenter.y + relX * sinA + relY * cosA;
      } else if (transformType === 'translate') {
        newX = orig.x + transformDistX;
        newY = orig.y + transformDistY;
      } else if (transformType === 'dilate') {
        newX = markedCenter.x + (orig.x - markedCenter.x) * transformRatio;
        newY = markedCenter.y + (orig.y - markedCenter.y) * transformRatio;
      } else if (transformType === 'reflect') {
        // Reflect over vertical center line by default
        newX = markedCenter.x - (orig.x - markedCenter.x);
        newY = orig.y;
      }

      const newPt: GSPPoint = {
        id: `p_${Date.now()}_${orig.name}`,
        name: `${orig.name}'`,
        x: Math.round(newX),
        y: Math.round(newY),
        color: '#f43f5e',
        size: orig.size,
      };
      transformedPoints.push(newPt);
    });

    // Reconstruct transformed segments if multiple connected points transformed
    if (transformedPoints.length >= 2) {
      for (let i = 0; i < transformedPoints.length - 1; i++) {
        newSegments.push({
          id: `s_trans_${Date.now()}_${i}`,
          p1Id: transformedPoints[i].id,
          p2Id: transformedPoints[i + 1].id,
          type: 'segment',
          color: '#f43f5e',
          strokeWidth: 2,
          lineStyle: 'solid',
        });
      }
      if (transformedPoints.length >= 3) {
        newSegments.push({
          id: `s_trans_close_${Date.now()}`,
          p1Id: transformedPoints[transformedPoints.length - 1].id,
          p2Id: transformedPoints[0].id,
          type: 'segment',
          color: '#f43f5e',
          strokeWidth: 2,
          lineStyle: 'solid',
        });
      }
    }

    pushState({
      ...sketch,
      points: [...sketch.points, ...transformedPoints],
      segments: [...sketch.segments, ...newSegments],
    });

    setShowTransformModal(false);
    showToast(`✓ Đã thực hiện phép biến hình (${transformType}) thành công!`);
  };

  // Export Sketch File (.gsp JSON)
  const handleExportGSP = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(sketch, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `sketchpad_${Date.now()}.gsp`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Đã xuất file bản vẽ .gsp thành công!');
  };

  // Import Sketch File
  const handleImportGSP = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string) as GSPSketchState;
        if (imported.points && imported.segments) {
          pushState(imported);
          showToast('Đã tải bản vẽ GSP thành công!');
        }
      } catch (err) {
        showToast('⚠️ File .gsp không hợp lệ.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div
      ref={containerRef}
      className={`flex flex-col bg-slate-950 text-slate-100 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden select-none transition-all duration-300 ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none' : 'w-full min-h-[660px]'
      }`}
    >
      {/* 1. TOP GSP WINDOW TITLE BAR & MENU BAR */}
      <div className="flex flex-col bg-slate-900 border-b border-slate-800">
        {/* Title Bar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950/80 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-amber-500/20 text-white font-black text-sm">
              GSP
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-sm sm:text-base text-white tracking-tight flex items-center gap-2">
                  <span>The Geometer's Sketchpad (GSP 5 Web)</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Sketchpad Dynamic Geometry Engine
                  </span>
                </h2>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Dựng hình động • Phép biến hình (Quay, Tịnh tiến, Vị tự, Đối xứng) • Quỹ tích & Hoạt họa
              </p>
            </div>
          </div>

          {/* Quick Actions in Title Bar */}
          <div className="flex items-center gap-1.5">
            {/* Nút Tạo Trang Mới Nổi Bật */}
            <button
              onClick={() => handleCreateNewPage(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-xs font-extrabold text-white transition-all shadow-md shadow-emerald-600/25 border border-emerald-400/30"
              title="Tạo một trang vẽ trắng mới (Ctrl+N)"
            >
              <FilePlus className="w-3.5 h-3.5" />
              <span>+ Trang mới</span>
            </button>

            {/* Nút Chọn Toàn Bộ */}
            <button
              onClick={handleSelectAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-amber-300 transition-all border border-amber-500/30 hover:border-amber-400"
              title="Chọn toàn bộ đối tượng trên bản vẽ (Ctrl+A)"
            >
              <CheckSquare className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Chọn toàn bộ</span>
              <span className="text-[10px] text-amber-400/70 font-mono">Ctrl+A</span>
            </button>

            <button
              onClick={() => setShowShortcutsModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-xs font-bold text-amber-300 transition-all border border-amber-500/40"
              title="Xem danh sách phím tắt GSP Sketchpad (F1 / ?)"
            >
              <Keyboard className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline">Phím tắt GSP</span>
              <span className="text-[10px] px-1 py-0.2 bg-amber-500/20 rounded font-mono">Ctrl+L...</span>
            </button>

            <button
              onClick={() => setShowPresetModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition-all shadow-md shadow-indigo-600/25"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>Mẫu ({GSP_PRESETS.length})</span>
            </button>

            <button
              onClick={handleExportGSP}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
              title="Lưu file .gsp (Ctrl+S)"
            >
              <Download className="w-4 h-4" />
            </button>

            <label className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700 cursor-pointer" title="Mở file .gsp">
              <Upload className="w-4 h-4" />
              <input type="file" accept=".gsp,.json" onChange={handleImportGSP} className="hidden" />
            </label>

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
              title={isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* GSP Classic Dropdown Menus: File | Edit | Display | Construct | Transform | Measure | Animate */}
        <div className="flex items-center gap-1 px-3 py-1 bg-slate-900 text-xs overflow-x-auto border-b border-slate-800/80">
          {/* Construct Menu Buttons */}
          <div className="flex items-center gap-1 border-r border-slate-800 pr-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">DỰNG HÌNH:</span>
            <button
              onClick={constructSegment}
              className="px-2 py-1 rounded hover:bg-slate-800 text-sky-300 font-medium transition-colors flex items-center gap-1"
              title="Vẽ đoạn thẳng nối các điểm đã chọn (Ctrl+L)"
            >
              <span>Đoạn thẳng</span>
              <span className="text-[9px] text-sky-400/60 font-mono">Ctrl+L</span>
            </button>
            <button
              onClick={constructLine}
              className="px-2 py-1 rounded hover:bg-slate-800 text-slate-200 font-medium transition-colors"
              title="Dựng đường thẳng qua 2 điểm (Ctrl+Shift+L)"
            >
              Đường thẳng
            </button>
            <button
              onClick={constructRay}
              className="px-2 py-1 rounded hover:bg-slate-800 text-slate-200 font-medium transition-colors"
              title="Dựng tia qua 2 điểm (Ctrl+Shift+R)"
            >
              Tia
            </button>
            <button
              onClick={constructCircleByPoints}
              className="px-2 py-1 rounded hover:bg-slate-800 text-slate-200 font-medium transition-colors"
              title="Dựng đường tròn qua tâm & bán kính (Ctrl+Shift+C)"
            >
              Đường tròn
            </button>
            <button
              onClick={constructMidpoint}
              className="px-2 py-1 rounded hover:bg-slate-800 text-amber-300 font-medium transition-colors flex items-center gap-1"
              title="Dựng trung điểm đoạn thẳng hoặc 2 điểm (Ctrl+M)"
            >
              <span>Trung điểm</span>
              <span className="text-[9px] text-amber-400/60 font-mono">Ctrl+M</span>
            </button>
            <button
              onClick={constructPointOnObject}
              className="px-2 py-1 rounded hover:bg-slate-800 text-amber-300 font-medium transition-colors flex items-center gap-1"
              title="Dựng điểm gắn trên Đoạn thẳng, Tia, Đường thẳng hoặc Đường tròn đã chọn (Ctrl+Shift+O)"
            >
              <span>Điểm trên đối tượng</span>
              <span className="text-[9px] text-amber-400/60 font-mono">Ctrl+Shift+O</span>
            </button>
            <button
              onClick={constructIntersection}
              className="px-2 py-1 rounded hover:bg-slate-800 text-pink-300 font-medium transition-colors"
              title="Dựng giao điểm 2 đường (Ctrl+I)"
            >
              Giao điểm
            </button>
            <button
              onClick={constructPerpendicular}
              className="px-2 py-1 rounded hover:bg-slate-800 text-slate-200 font-medium transition-colors"
              title="Dựng đường vuông góc qua 1 điểm và vuông góc với 1 đường (Ctrl+Shift+P)"
            >
              Vuông góc
            </button>
            <button
              onClick={constructParallel}
              className="px-2 py-1 rounded hover:bg-slate-800 text-slate-200 font-medium transition-colors"
              title="Dựng đường song song (Ctrl+Shift+F)"
            >
              Song song
            </button>
            <button
              onClick={constructAngleBisector}
              className="px-2 py-1 rounded hover:bg-slate-800 text-slate-200 font-medium transition-colors"
              title="Dựng tia phân giác góc 3 điểm (Ctrl+Shift+B)"
            >
              Phân giác
            </button>
            <button
              onClick={constructPolygonInterior}
              className="px-2 py-1 rounded hover:bg-slate-800 text-emerald-300 font-medium transition-colors"
              title="Tạo miền trong đa giác (Ctrl+P)"
            >
              Miền trong
            </button>
            <button
              onClick={hideSelectedObjects}
              className="px-2 py-1 rounded hover:bg-slate-800 text-slate-400 font-medium transition-colors"
              title="Ẩn đối tượng đã chọn (Ctrl+H)"
            >
              Ẩn
            </button>
            <button
              onClick={showAllObjects}
              className="px-2 py-1 rounded hover:bg-slate-800 text-slate-400 font-medium transition-colors"
              title="Hiện lại toàn bộ đối tượng ẩn (Ctrl+Shift+H)"
            >
              Hiện tất cả
            </button>
          </div>

          {/* Transform Menu */}
          <div className="flex items-center gap-1 border-r border-slate-800 px-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">BIẾN HÌNH:</span>
            <button
              onClick={() => {
                if (selectedPointIds.length === 1) {
                  setSketch((prev) => ({ ...prev, markedCenterId: selectedPointIds[0] }));
                  showToast(`✓ Đã đánh dấu tâm biến hình: ${selectedPointIds[0]} (Ctrl+Shift+M)`);
                } else {
                  showToast('Hãy chọn 1 điểm để đánh dấu tâm biến hình (Ctrl+Shift+M)');
                }
              }}
              className="px-2 py-1 rounded hover:bg-slate-800 text-amber-300 font-medium transition-colors"
              title="Đánh dấu tâm biến hình (Ctrl+Shift+M)"
            >
              Đánh dấu tâm
            </button>
            <button
              onClick={() => {
                setTransformType('rotate');
                setShowTransformModal(true);
              }}
              className="px-2 py-1 rounded hover:bg-slate-800 text-slate-200 font-medium transition-colors"
              title="Phép quay (Ctrl+R)"
            >
              Quay...
            </button>
            <button
              onClick={() => {
                setTransformType('translate');
                setShowTransformModal(true);
              }}
              className="px-2 py-1 rounded hover:bg-slate-800 text-slate-200 font-medium transition-colors"
              title="Phép tịnh tiến (Ctrl+T)"
            >
              Tịnh tiến...
            </button>
            <button
              onClick={() => {
                setTransformType('dilate');
                setShowTransformModal(true);
              }}
              className="px-2 py-1 rounded hover:bg-slate-800 text-slate-200 font-medium transition-colors"
              title="Phép vị tự (Ctrl+D)"
            >
              Vị tự...
            </button>
          </div>

          {/* Measure Menu */}
          <div className="flex items-center gap-1 border-r border-slate-800 px-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">ĐO LƯỜNG:</span>
            <button
              onClick={measureDistance}
              className="px-2 py-1 rounded hover:bg-slate-800 text-sky-300 font-medium transition-colors"
              title="Đo khoảng cách / Độ dài (Ctrl+Shift+D)"
            >
              Đo độ dài
            </button>
            <button
              onClick={measureAngle}
              className="px-2 py-1 rounded hover:bg-slate-800 text-sky-300 font-medium transition-colors"
              title="Đo số đo góc (Ctrl+Shift+G)"
            >
              Đo góc
            </button>
            <button
              onClick={() => setShowCalculator(true)}
              className="px-2 py-1 rounded hover:bg-slate-800 text-emerald-300 font-medium transition-colors flex items-center gap-1"
              title="Máy tính GSP (Ctrl+K)"
            >
              <Calculator className="w-3 h-3" />
              <span>Máy tính</span>
            </button>
          </div>

          {/* ANIMATE MENU (Nút Hoạt Họa & Điều khiển Chuyển động) */}
          <div className="flex items-center gap-1.5 border-r border-slate-800 px-2 bg-amber-500/5 py-0.5 rounded-lg">
            <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" />
              <span>HOẠT HỌA:</span>
            </span>

            {/* Main Animate Button Toggle */}
            <button
              onClick={() => {
                setIsAnimationRunning((prev) => !prev);
                showToast(isAnimationRunning ? '⏸ Đã tạm dừng hoạt họa' : '▶ Đang chạy hoạt họa chuyển động');
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-black text-xs transition-all ${
                isAnimationRunning
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30 animate-pulse'
                  : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40'
              }`}
              title="Bật/Tắt chạy hoạt họa các điểm chuyển động trên bản vẽ"
            >
              {isAnimationRunning ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span>{isAnimationRunning ? 'DỪNG' : 'ANIMATE'}</span>
            </button>

            {/* Animation Speed Selector */}
            <div className="flex items-center bg-slate-950 rounded-lg p-0.5 border border-slate-800 text-[10px]">
              {[0.5, 1, 2, 4].map((spd) => (
                <button
                  key={spd}
                  onClick={() => {
                    setAnimSpeedMultiplier(spd);
                    showToast(`Tốc độ hoạt họa: ${spd}x`);
                  }}
                  className={`px-1.5 py-0.5 rounded font-bold transition-colors ${
                    animSpeedMultiplier === spd
                      ? 'bg-amber-500 text-slate-950'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>

            {/* Toggle Point Animate State */}
            <button
              onClick={() => {
                if (selectedPointIds.length === 0) {
                  showToast('⚠️ Hãy chọn ít nhất 1 điểm để bật hoạt họa!');
                  return;
                }
                setSketch((prev) => ({
                  ...prev,
                  points: prev.points.map((p) =>
                    selectedPointIds.includes(p.id) ? { ...p, isAnimating: !p.isAnimating } : p
                  ),
                }));
                setIsAnimationRunning(true);
                showToast(`✓ Đã đảo trạng thái hoạt họa cho ${selectedPointIds.length} điểm đã chọn`);
              }}
              className="px-2 py-1 rounded hover:bg-slate-800 text-amber-300 text-xs font-semibold transition-colors"
              title="Gán/Hủy thuộc tính tự hoạt họa cho các điểm đang chọn"
            >
              + Điểm chọn
            </button>
          </div>

          {/* ACTION BUTTON MENU (Menu Tạo Nút Hành Động Action Button) */}
          <div className="flex items-center gap-1 border-r border-slate-800 px-2 bg-indigo-500/5 py-0.5 rounded-lg">
            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-wider flex items-center gap-1">
              <PlaySquare className="w-3 h-3 text-indigo-400" />
              <span>ACTION BUTTON:</span>
            </span>

            <button
              onClick={() => createAnimateActionButton()}
              className="px-2 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 transition-colors"
              title="Tạo Nút Hoạt Họa gắn trên bản vẽ"
            >
              + Nút Hoạt họa
            </button>

            <button
              onClick={() => createHideShowActionButton()}
              className="px-2 py-1 rounded bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 font-bold border border-sky-500/30 transition-colors"
              title="Tạo Nút Ẩn/Hiện cho các đối tượng đang chọn"
            >
              + Nút Ẩn/Hiện
            </button>

            <button
              onClick={() => {
                setActionButtonModalType('movement');
                setShowActionButtonModal(true);
              }}
              className="px-2 py-1 rounded bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30 transition-colors"
              title="Tạo Nút Dịch chuyển mượt mà giữa 2 điểm"
            >
              + Dịch chuyển
            </button>

            <button
              onClick={() => {
                setActionButtonModalType('link');
                setShowActionButtonModal(true);
              }}
              className="px-2 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 transition-colors"
              title="Tạo Nút Chuyển trang liên kết"
            >
              + Chuyển trang
            </button>

            <button
              onClick={() => setShowActionButtonModal(true)}
              className="px-2 py-1 rounded hover:bg-slate-800 text-slate-300 font-medium transition-colors"
              title="Mở bảng cấu hình tạo nút hành động tùy biến"
            >
              ⚙️ Tùy biến...
            </button>
          </div>

          {/* AI DỰNG HÌNH GSP (Gemini 3.1 Pro High Thinking) */}
          <div className="flex items-center pl-1 border-r border-slate-800 pr-2">
            <button
              onClick={() => setShowAIGeneratorModal(true)}
              className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs rounded-lg shadow-md shadow-purple-500/25 border border-purple-400/40 transition-all hover:scale-105"
              title="Vẽ hình bằng AI: Nhập ngôn ngữ tự nhiên, Gemini 3.1 Pro tự tính toán tọa độ và dựng lên canvas"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              <span>✨ AI Dựng Hình</span>
            </button>
          </div>

          {/* Actions & History Menu: Select All, New Page, Clear, Undo, Redo, Delete */}
          <div className="flex items-center gap-1.5 pl-1">
            <button
              onClick={handleSelectAll}
              className="flex items-center gap-1 px-2 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 transition-colors"
              title="Chọn toàn bộ đối tượng (Ctrl+A)"
            >
              <CheckSquare className="w-3.5 h-3.5 text-amber-400" />
              <span>Chọn tất cả</span>
            </button>

            <button
              onClick={() => handleCreateNewPage(true)}
              className="flex items-center gap-1 px-2 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 transition-colors"
              title="Tạo một trang vẽ mới"
            >
              <FilePlus className="w-3.5 h-3.5 text-emerald-400" />
              <span>Trang mới</span>
            </button>

            <button
              onClick={handleClearCurrentPage}
              className="flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-800 text-slate-300 font-medium transition-colors"
              title="Xóa trắng nội dung trang hiện tại"
            >
              <Eraser className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden lg:inline">Xóa trắng</span>
            </button>

            <div className="w-[1px] h-4 bg-slate-800 mx-0.5"></div>

            <button
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              className="p-1 rounded hover:bg-slate-800 text-slate-300 disabled:opacity-30"
              title="Hoàn tác (Undo - Ctrl+Z)"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              className="p-1 rounded hover:bg-slate-800 text-slate-300 disabled:opacity-30"
              title="Làm lại (Redo - Ctrl+Y)"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={deleteSelected}
              className="p-1 rounded hover:bg-rose-900/50 text-rose-300"
              title="Xóa đối tượng đang chọn (Delete)"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. MAIN WORKSPACE WITH GSP LEFT TOOL PALETTE & CANVAS */}
      <div className="flex-1 flex flex-row items-stretch overflow-hidden relative">
        {/* LEFT GSP TOOL PALETTE (Bảng công cụ dọc phong cách Sketchpad) */}
        <div className="w-14 sm:w-16 bg-slate-900/95 border-r border-slate-800 flex flex-col items-center py-3 gap-2 z-20 backdrop-blur">
          {/* Select Arrow Tool */}
          <button
            onClick={() => setActiveTool('select')}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
              activeTool === 'select'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/25 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Con trỏ chọn & Kéo di chuyển (Select Arrow Tool)"
          >
            <MousePointer className="w-5 h-5" />
          </button>

          {/* Point Tool */}
          <button
            onClick={() => setActiveTool('point')}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
              activeTool === 'point'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/25 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Công cụ vẽ Điểm (Point Tool)"
          >
            <div className="w-3.5 h-3.5 rounded-full bg-current"></div>
          </button>

          {/* Compass / Circle Tool */}
          <button
            onClick={() => setActiveTool('circle')}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
              activeTool === 'circle'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/25 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Compa vẽ Đường tròn (Compass / Circle Tool)"
          >
            <CircleIcon className="w-5 h-5" />
          </button>

          {/* Segment Tool */}
          <button
            onClick={() => setActiveTool('segment')}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
              activeTool === 'segment'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/25 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Đoạn thẳng (Straightedge Segment Tool)"
          >
            <Minus className="w-5 h-5 stroke-[3]" />
          </button>

          {/* Ray Tool */}
          <button
            onClick={() => setActiveTool('ray')}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
              activeTool === 'ray'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/25 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Tia (Ray Tool)"
          >
            <ArrowUpRight className="w-5 h-5" />
          </button>

          {/* Line Tool */}
          <button
            onClick={() => setActiveTool('line')}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
              activeTool === 'line'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/25 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Đường thẳng kéo dài vô hạn (Infinite Line Tool)"
          >
            <div className="w-5 h-0.5 bg-current rotate-45"></div>
          </button>

          {/* Text / Label Tool */}
          <button
            onClick={() => setActiveTool('text')}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
              activeTool === 'text'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/25 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Văn bản & Đặt nhãn (Text & Label Tool)"
          >
            <Type className="w-5 h-5" />
          </button>

          {/* Action Button Tool (Nút Hành Động) */}
          <button
            onClick={() => {
              setActiveTool('action_button');
              setShowActionButtonModal(true);
            }}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
              activeTool === 'action_button'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/25 font-bold'
                : 'text-indigo-400 hover:text-white hover:bg-indigo-500/20'
            }`}
            title="Tạo Nút Hành Động GSP (Action Button Tool)"
          >
            <PlaySquare className="w-5 h-5" />
          </button>

          {/* Measurement Tool */}
          <button
            onClick={measureDistance}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
            title="Đo khoảng cách (Ruler Measure Tool)"
          >
            <Ruler className="w-5 h-5" />
          </button>

          {/* AI Dựng Hình Tool */}
          <button
            onClick={() => setShowAIGeneratorModal(true)}
            className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-tr from-purple-600/30 to-indigo-600/30 border border-purple-500/40 text-amber-300 hover:text-white hover:from-purple-600/50 hover:to-indigo-600/50 transition-all shadow-md"
            title="Vẽ hình tự động bằng AI (AI Sketch Generator)"
          >
            <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
          </button>

          <div className="w-8 h-[1px] bg-slate-800 my-1"></div>

          {/* Color Selector */}
          <div className="flex flex-col gap-1.5">
            {['#38bdf8', '#f59e0b', '#10b981', '#ec4899', '#a855f7'].map((c) => (
              <button
                key={c}
                onClick={() => setActiveColor(c)}
                className={`w-5 h-5 rounded-full transition-transform ${
                  activeColor === c ? 'scale-125 ring-2 ring-white' : 'opacity-70 hover:opacity-100'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        {/* INTERACTIVE SVG GSP CANVAS */}
        <div
          className="flex-1 flex flex-col bg-slate-950 relative overflow-hidden"
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onTouchStart={handleCanvasMouseDown}
          onTouchMove={handleCanvasMouseMove}
          onTouchEnd={handleCanvasMouseUp}
        >
          {/* Toast Notice */}
          {toastMessage && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-amber-500 text-slate-950 px-4 py-1.5 rounded-full font-mono font-extrabold text-xs shadow-xl shadow-amber-500/30 border border-amber-300 animate-bounce">
              {toastMessage}
            </div>
          )}

          {/* Floating Canvas Top Overlay: Animation Controller & Grid Toggles */}
          <div className="absolute top-3 right-3 z-30 flex items-center gap-2">
            {/* Animation Play/Pause Controller */}
            <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-800 p-1 rounded-xl shadow-lg backdrop-blur">
              <button
                onClick={() => {
                  setIsAnimationRunning(!isAnimationRunning);
                  showToast(isAnimationRunning ? 'Đã tạm dừng hoạt họa' : '▶ Đang chạy hoạt họa GSP');
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  isAnimationRunning
                    ? 'bg-rose-500 text-white shadow-md'
                    : 'bg-emerald-500 text-slate-950 shadow-md'
                }`}
              >
                {isAnimationRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isAnimationRunning ? 'Dừng' : 'Chuyển động'}</span>
              </button>

              <button
                onClick={() => setShowGrid(!showGrid)}
                className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                  showGrid ? 'bg-slate-800 text-slate-200' : 'text-slate-500 hover:text-slate-300'
                }`}
                title="Bật/tắt lưới tọa độ"
              >
                Lưới
              </button>

              <button
                onClick={() => setShowLabels(!showLabels)}
                className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                  showLabels ? 'bg-slate-800 text-slate-200' : 'text-slate-500 hover:text-slate-300'
                }`}
                title="Bật/tắt nhãn tên A, B, C"
              >
                Tên đỉnh
              </button>
            </div>
          </div>

          {/* SVG DRAWING SURFACE */}
          <svg
            ref={svgRef}
            viewBox="0 0 1000 600"
            className="w-full h-full cursor-crosshair overflow-visible select-none"
          >
            <defs>
              <pattern id="gspGrid" width="30" height="30" patternUnits="userSpaceOnUse">
                <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#1e293b" strokeWidth="0.6" />
              </pattern>
            </defs>

            {/* Grid */}
            {showGrid && <rect width="1000" height="600" fill="url(#gspGrid)" />}

            {/* Polygons (Miền trong đa giác) */}
            {sketch.polygons.filter((poly) => !poly.hidden).map((poly) => {
              const pts = poly.pointIds
                .map((id) => sketch.points.find((p) => p.id === id))
                .filter(Boolean) as GSPPoint[];
              if (pts.length < 3) return null;
              const pointsStr = pts.map((p) => `${p.x},${p.y}`).join(' ');
              const isSel = selectedPolyIds.includes(poly.id);
              return (
                <polygon
                  key={poly.id}
                  points={pointsStr}
                  fill={poly.color}
                  fillOpacity={poly.opacity}
                  stroke={isSel ? '#f59e0b' : 'none'}
                  strokeWidth={isSel ? 2 : 0}
                  className="cursor-pointer hover:fill-opacity-40 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPolyIds([poly.id]);
                  }}
                />
              );
            })}

            {/* Circles (Đường tròn) */}
            {sketch.circles.filter((c) => !c.hidden).map((c) => {
              const center = sketch.points.find((p) => p.id === c.centerId);
              if (!center) return null;
              let radius = c.radius || 100;
              if (c.radiusPointId) {
                const rp = sketch.points.find((p) => p.id === c.radiusPointId);
                if (rp) radius = getDistance(center, rp);
              }
              const isSel = selectedCircleIds.includes(c.id);

              return (
                <circle
                  key={c.id}
                  cx={center.x}
                  cy={center.y}
                  r={radius}
                  fill="none"
                  stroke={isSel ? '#f59e0b' : c.color}
                  strokeWidth={isSel ? c.strokeWidth + 1.5 : c.strokeWidth}
                  strokeDasharray={c.lineStyle === 'dashed' ? '5 5' : 'none'}
                  className="cursor-pointer hover:stroke-opacity-80 transition-all"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedCircleIds([c.id]);
                  }}
                />
              );
            })}

            {/* Segments / Rays / Lines (Đoạn thẳng, Tia, Đường thẳng) */}
            {sketch.segments.filter((seg) => !seg.hidden).map((seg) => {
              const p1 = sketch.points.find((p) => p.id === seg.p1Id);
              const p2 = sketch.points.find((p) => p.id === seg.p2Id);
              if (!p1 || !p2) return null;

              let x1 = p1.x;
              let y1 = p1.y;
              let x2 = p2.x;
              let y2 = p2.y;

              if (seg.type === 'line') {
                const dx = p2.x - p1.x;
                const dy = p2.y - p1.y;
                const len = Math.hypot(dx, dy);
                if (len > 0) {
                  x1 = p1.x - (dx / len) * 1200;
                  y1 = p1.y - (dy / len) * 1200;
                  x2 = p2.x + (dx / len) * 1200;
                  y2 = p2.y + (dy / len) * 1200;
                }
              } else if (seg.type === 'ray') {
                const dx = p2.x - p1.x;
                const dy = p2.y - p1.y;
                const len = Math.hypot(dx, dy);
                if (len > 0) {
                  x2 = p1.x + (dx / len) * 1400;
                  y2 = p1.y + (dy / len) * 1400;
                }
              }

              const isSel = selectedSegmentIds.includes(seg.id);

              return (
                <line
                  key={seg.id}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={isSel ? '#f59e0b' : seg.color}
                  strokeWidth={isSel ? seg.strokeWidth + 1.5 : seg.strokeWidth}
                  strokeDasharray={seg.lineStyle === 'dashed' ? '6 6' : seg.lineStyle === 'dotted' ? '2 4' : 'none'}
                  className="cursor-pointer transition-all"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedSegmentIds([seg.id]);
                  }}
                />
              );
            })}

            {/* Temporary Dragging Segment/Circle Preview */}
            {isDragging && tempStartPoint && (
              <>
                {(activeTool === 'segment' || activeTool === 'ray' || activeTool === 'line') && (
                  <line
                    x1={tempStartPoint.x}
                    y1={tempStartPoint.y}
                    x2={mousePos.x}
                    y2={mousePos.y}
                    stroke={activeColor}
                    strokeWidth={activeStrokeWidth}
                    strokeDasharray="4 4"
                  />
                )}
                {activeTool === 'circle' && (
                  <circle
                    cx={tempStartPoint.x}
                    cy={tempStartPoint.y}
                    r={getDistance(tempStartPoint, mousePos)}
                    fill="none"
                    stroke={activeColor}
                    strokeWidth={activeStrokeWidth}
                    strokeDasharray="4 4"
                  />
                )}
              </>
            )}

            {/* Points (Các điểm đỉnh GSP) */}
            {sketch.points.filter((pt) => !pt.hidden).map((pt) => {
              const isSel = selectedPointIds.includes(pt.id);
              const isMarked = sketch.markedCenterId === pt.id;
              const isOnSegment = Boolean(pt.onSegmentId);
              const isOnCircle = Boolean(pt.onCircleId);

              return (
                <g key={pt.id} className="cursor-move group">
                  <title>
                    {isOnSegment
                      ? `Điểm ${pt.name} (Gắn trên Đoạn/Tia/Đường thẳng - t = ${(pt.tParam ?? 0.5).toFixed(2)})`
                      : isOnCircle
                      ? `Điểm ${pt.name} (Gắn trên Đường tròn - θ = ${Math.round(((pt.angleParam ?? 0) * 180) / Math.PI)}°)`
                      : `Điểm ${pt.name} (${pt.x}, ${pt.y})`}
                  </title>

                  {/* Marked Center Halo */}
                  {isMarked && (
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={pt.size + 8}
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="2"
                      strokeDasharray="3 3"
                      className="animate-spin"
                    />
                  )}

                  {/* Constrained Point Anchor Halo */}
                  {(isOnSegment || isOnCircle) && (
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={pt.size + 3.5}
                      fill="none"
                      stroke={isOnSegment ? '#f59e0b' : '#10b981'}
                      strokeWidth="1.2"
                      strokeDasharray="2 2"
                    />
                  )}

                  {/* Selection Ring */}
                  {isSel && (
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={pt.size + 4.5}
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="2"
                    />
                  )}

                  {/* Point Disk */}
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={pt.size}
                    fill={isOnSegment ? '#f59e0b' : isOnCircle ? '#10b981' : pt.color}
                    stroke="#0f172a"
                    strokeWidth="1.5"
                    className="transition-transform group-hover:scale-125"
                  />

                  {/* Point Label */}
                  {showLabels && (
                    <text
                      x={pt.x + 8}
                      y={pt.y - 8}
                      className="font-bold text-xs fill-white select-none drop-shadow pointer-events-none"
                    >
                      {pt.name}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Text Annotations */}
            {sketch.texts.map((txt) => (
              <text
                key={txt.id}
                x={txt.x}
                y={txt.y}
                fill={txt.color}
                fontSize={txt.fontSize}
                className="font-sans font-bold drop-shadow select-none cursor-pointer"
              >
                {txt.text}
              </text>
            ))}

            {/* Measurement Tags (Bảng số đo GSP) */}
            {sketch.measurements.map((m) => (
              <g key={m.id} transform={`translate(${m.x}, ${m.y})`} className="cursor-move">
                <rect
                  x="-8"
                  y="-16"
                  width="220"
                  height="26"
                  rx="6"
                  fill="#0f172a"
                  fillOpacity="0.85"
                  stroke="#334155"
                  strokeWidth="1"
                />
                <text
                  x="0"
                  y="2"
                  className="font-mono text-xs font-bold fill-amber-300 select-none"
                >
                  {m.label} = {m.value} {m.unit}
                </text>
              </g>
            ))}

            {/* GSP Action Buttons (Nút Hành Động Trên Bảng Vẽ) */}
            {(sketch.actionButtons || []).map((btn) => {
              const isAnim = btn.type === 'animate';
              const isHideShow = btn.type === 'hide_show';
              const isMove = btn.type === 'movement';
              const isLink = btn.type === 'link';
              const btnWidth = Math.max(160, btn.label.length * 8.2 + 36);

              return (
                <g
                  key={btn.id}
                  transform={`translate(${btn.x}, ${btn.y})`}
                  className="cursor-pointer group select-none"
                  onMouseDown={(e) => {
                    if (activeTool === 'select') {
                      e.stopPropagation();
                      setDraggedActionButtonId(btn.id);
                      setIsDragging(true);
                    }
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleExecuteActionButton(btn);
                  }}
                >
                  {/* Outer Bevel / Glow Frame */}
                  <rect
                    x="-6"
                    y="-16"
                    width={btnWidth}
                    height="32"
                    rx="8"
                    className={`transition-all ${
                      isAnim
                        ? isAnimationRunning
                          ? 'fill-amber-950/90 stroke-amber-400 stroke-2 filter drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                          : 'fill-slate-900/90 stroke-amber-500/60 stroke-1 hover:stroke-amber-400'
                        : isHideShow
                        ? 'fill-slate-900/90 stroke-sky-500/60 stroke-1 hover:stroke-sky-400'
                        : isMove
                        ? 'fill-slate-900/90 stroke-indigo-500/60 stroke-1 hover:stroke-indigo-400'
                        : 'fill-slate-900/90 stroke-emerald-500/60 stroke-1 hover:stroke-emerald-400'
                    }`}
                  />
                  {/* Button Icon badge */}
                  <circle
                    cx="10"
                    cy="0"
                    r="8"
                    className={`${
                      isAnim
                        ? isAnimationRunning
                          ? 'fill-amber-500'
                          : 'fill-amber-500/20'
                        : isHideShow
                        ? 'fill-sky-500/20'
                        : isMove
                        ? 'fill-indigo-500/20'
                        : 'fill-emerald-500/20'
                    }`}
                  />
                  {/* Button Text Label */}
                  <text
                    x="24"
                    y="4"
                    className={`font-bold text-xs ${
                      isAnim
                        ? 'fill-amber-300'
                        : isHideShow
                        ? 'fill-sky-300'
                        : isMove
                        ? 'fill-indigo-300'
                        : 'fill-emerald-300'
                    }`}
                  >
                    {btn.label}
                  </text>
                  {/* Delete button (X) on hover in select mode */}
                  {activeTool === 'select' && (
                    <g
                      transform={`translate(${btnWidth - 16}, 0)`}
                      className="opacity-40 group-hover:opacity-100 hover:scale-125 transition-all"
                      onClick={(e) => handleDeleteActionButton(btn.id, e)}
                    >
                      <circle cx="0" cy="0" r="7" fill="#e11d48" />
                      <text x="-3" y="3" fontSize="9" fill="#ffffff" fontWeight="bold">✕</text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>

          {/* 2.5 BOTTOM PAGE TABS & STATUS BAR (Quản lý Trang bản vẽ GSP) */}
          <div className="bg-slate-900/95 border-t border-slate-800 px-3 py-1.5 flex items-center justify-between text-xs z-30 select-none">
            {/* Left: Interactive Page Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 max-w-[70%]">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider hidden sm:inline mr-1">
                TRANG:
              </span>

              {pages.map((pg, idx) => {
                const isActive = pg.id === currentPageId;
                const isEditing = editingPageId === pg.id;

                return (
                  <div
                    key={pg.id}
                    onClick={() => handleSwitchPage(pg.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-all cursor-pointer ${
                      isActive
                        ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40 shadow-sm shadow-amber-500/10'
                        : 'bg-slate-950/60 hover:bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    <FileText className={`w-3.5 h-3.5 ${isActive ? 'text-amber-400' : 'text-slate-500'}`} />

                    {isEditing ? (
                      <input
                        type="text"
                        autoFocus
                        value={editingTitleText}
                        onChange={(e) => setEditingTitleText(e.target.value)}
                        onBlur={() => {
                          if (editingTitleText.trim()) {
                            setPages((prev) =>
                              prev.map((p) => (p.id === pg.id ? { ...p, title: editingTitleText.trim() } : p))
                            );
                          }
                          setEditingPageId(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            if (editingTitleText.trim()) {
                              setPages((prev) =>
                                prev.map((p) => (p.id === pg.id ? { ...p, title: editingTitleText.trim() } : p))
                              );
                            }
                            setEditingPageId(null);
                          } else if (e.key === 'Escape') {
                            setEditingPageId(null);
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-slate-900 border border-amber-400/50 rounded px-1 text-white text-xs w-24 outline-none"
                      />
                    ) : (
                      <span
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          setEditingPageId(pg.id);
                          setEditingTitleText(pg.title);
                        }}
                        className="truncate max-w-[120px]"
                        title={`${pg.title} (Nhấp đúp để đổi tên)`}
                      >
                        {pg.title}
                      </span>
                    )}

                    {/* Edit title icon */}
                    {!isEditing && isActive && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingPageId(pg.id);
                          setEditingTitleText(pg.title);
                        }}
                        className="opacity-60 hover:opacity-100 hover:text-white p-0.5"
                        title="Đổi tên trang"
                      >
                        <Edit3 className="w-2.5 h-2.5" />
                      </button>
                    )}

                    {/* Close / Delete Page button */}
                    {pages.length > 1 && (
                      <button
                        onClick={(e) => handleDeletePage(pg.id, e)}
                        className="opacity-50 hover:opacity-100 hover:text-rose-400 p-0.5 rounded ml-0.5"
                        title="Đóng trang này"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              })}

              {/* Nút + Thêm trang mới trong Tab bar */}
              <button
                onClick={() => handleCreateNewPage(true)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-xs border border-emerald-500/40 transition-colors shrink-0 shadow-sm"
                title="Tạo thêm trang vẽ trắng mới"
              >
                <Plus className="w-3 h-3" />
                <span>Thêm trang</span>
              </button>

              {/* Nút nhân bản trang */}
              <button
                onClick={handleDuplicatePage}
                className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs transition-colors shrink-0"
                title="Nhân bản trang hiện tại"
              >
                <Copy className="w-3 h-3" />
                <span className="hidden md:inline">Nhân bản</span>
              </button>
            </div>

            {/* Right: Object Stats & Selected Summary */}
            <div className="flex items-center gap-3 text-[11px] text-slate-400 shrink-0">
              {(selectedPointIds.length > 0 ||
                selectedSegmentIds.length > 0 ||
                selectedCircleIds.length > 0 ||
                selectedPolyIds.length > 0) && (
                <div className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-bold border border-amber-500/30">
                  Đã chọn: {selectedPointIds.length + selectedSegmentIds.length + selectedCircleIds.length + selectedPolyIds.length}
                </div>
              )}

              <div className="hidden lg:flex items-center gap-2 text-slate-500 font-mono">
                <span>{sketch.points.length} điểm</span>
                <span>•</span>
                <span>{sketch.segments.length} đường</span>
                <span>•</span>
                <span>{sketch.circles.length} tròn</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. TRANSFORM MODAL DIALOG */}
      {showTransformModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-white font-extrabold text-base">
                <RotateCw className="w-4 h-4 text-amber-400" />
                <span>Hộp thoại Biến hình GSP (Transform)</span>
              </div>
              <button
                onClick={() => setShowTransformModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Type selector */}
            <div className="grid grid-cols-4 gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setTransformType('rotate')}
                className={`py-1.5 rounded-lg font-bold ${
                  transformType === 'rotate' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'
                }`}
              >
                Quay
              </button>
              <button
                onClick={() => setTransformType('translate')}
                className={`py-1.5 rounded-lg font-bold ${
                  transformType === 'translate' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'
                }`}
              >
                Tịnh tiến
              </button>
              <button
                onClick={() => setTransformType('dilate')}
                className={`py-1.5 rounded-lg font-bold ${
                  transformType === 'dilate' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'
                }`}
              >
                Vị tự
              </button>
              <button
                onClick={() => setTransformType('reflect')}
                className={`py-1.5 rounded-lg font-bold ${
                  transformType === 'reflect' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'
                }`}
              >
                Đối xứng
              </button>
            </div>

            {/* Parameter Inputs */}
            {transformType === 'rotate' && (
              <div className="space-y-2 text-xs">
                <label className="text-slate-300 font-bold">Góc quay (°):</label>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  step="5"
                  value={transformAngle}
                  onChange={(e) => setTransformAngle(Number(e.target.value))}
                  className="w-full accent-amber-500"
                />
                <div className="text-right font-mono font-bold text-amber-400">{transformAngle}°</div>
              </div>
            )}

            {transformType === 'translate' && (
              <div className="space-y-2 text-xs">
                <label className="text-slate-300 font-bold">Khoảng cách dịch chuyển (dx, dy):</label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-400">dx (px):</span>
                    <input
                      type="number"
                      value={transformDistX}
                      onChange={(e) => setTransformDistX(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white"
                    />
                  </div>
                  <div>
                    <span className="text-slate-400">dy (px):</span>
                    <input
                      type="number"
                      value={transformDistY}
                      onChange={(e) => setTransformDistY(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {transformType === 'dilate' && (
              <div className="space-y-2 text-xs">
                <label className="text-slate-300 font-bold">Tỉ số vị tự k:</label>
                <input
                  type="number"
                  step="0.1"
                  value={transformRatio}
                  onChange={(e) => setTransformRatio(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white font-mono"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowTransformModal(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300"
              >
                Hủy
              </button>
              <button
                onClick={executeTransform}
                className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/25"
              >
                Áp dụng biến hình
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. PRESETS GALLERY MODAL */}
      {showPresetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <FolderOpen className="w-5 h-5 text-indigo-400" />
                <h3 className="font-extrabold text-lg text-white">Thư viện Mẫu Dựng Hình GSP Sketchpad</h3>
              </div>
              <button onClick={() => setShowPresetModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[420px] overflow-y-auto pr-1">
              {GSP_PRESETS.map((preset) => (
                <div
                  key={preset.id}
                  onClick={() => {
                    pushState(preset.state);
                    setShowPresetModal(false);
                    showToast(`Đã mở mẫu: ${preset.title}`);
                  }}
                  className="bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-4 cursor-pointer transition-all space-y-2 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 uppercase">
                      {preset.category}
                    </span>
                    <span className="text-xs text-indigo-400 group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                  <h4 className="font-bold text-sm text-white group-hover:text-indigo-300 transition-colors">
                    {preset.title}
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {preset.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 5. GSP CALCULATOR MODAL */}
      {showCalculator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-5 space-y-3 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2 text-emerald-400 font-extrabold text-sm">
                <Calculator className="w-4 h-4" />
                <span>Máy tính hình học GSP</span>
              </div>
              <button onClick={() => setShowCalculator(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-slate-300">Nhập biểu thức (vd: 3.5 * 2 + 1.2²):</label>
              <input
                type="text"
                placeholder="VD: 4 * 6 / 2"
                value={calcInput}
                onChange={(e) => setCalcInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-sm"
              />
              <button
                onClick={() => {
                  try {
                    // Safe basic math evaluator
                    const sanitized = calcInput.replace(/[^0-9+\-*/().\s^]/g, '');
                    // eslint-disable-next-line no-eval
                    const res = Function(`'use strict'; return (${sanitized.replace(/\^/g, '**')})`)();
                    setCalcResult(Number(res));
                  } catch (e) {
                    setCalcResult(null);
                    showToast('Biểu thức không hợp lệ');
                  }
                }}
                className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs"
              >
                Tính kết quả
              </button>

              {calcResult !== null && (
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center font-mono font-extrabold text-emerald-400 text-base">
                  Kết quả: {calcResult}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 6. GSP KEYBOARD SHORTCUTS REFERENCE MODAL */}
      {showShortcutsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Keyboard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-white">Bảng Phím Tắt The Geometer's Sketchpad (GSP)</h3>
                  <p className="text-xs text-slate-400">Quy chuẩn phím tắt tiêu chuẩn phần mềm hình học động GSP 5</p>
                </div>
              </div>
              <button
                onClick={() => setShowShortcutsModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Content List */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {/* Category 1: DỰNG HÌNH (CONSTRUCT) */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-amber-400 font-extrabold uppercase tracking-wider text-[11px]">
                  <Sparkles className="w-4 h-4" />
                  <span>1. Menu Dựng Hình (Construct Shortcuts)</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                    <div className="space-y-0.5">
                      <div className="font-bold text-white text-sm">Vẽ đoạn thẳng (Segment)</div>
                      <div className="text-slate-400">Chọn 2 điểm và nhấn phím tắt để nối đoạn thẳng</div>
                    </div>
                    <kbd className="px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-lg font-mono font-black text-xs shadow-sm">
                      Ctrl + L
                    </kbd>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                    <div className="space-y-0.5">
                      <div className="font-bold text-white text-sm">Dựng đường thẳng vô hạn (Line)</div>
                      <div className="text-slate-400">Dựng đường thẳng kéo dài vô tận qua 2 điểm</div>
                    </div>
                    <kbd className="px-2 py-1 bg-slate-800 text-sky-300 border border-slate-700 rounded-lg font-mono font-bold text-xs">
                      Ctrl + Shift + L
                    </kbd>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                    <div className="space-y-0.5">
                      <div className="font-bold text-white text-sm">Dựng tia (Ray)</div>
                      <div className="text-slate-400">Gốc tại điểm thứ nhất, kéo dài qua điểm thứ hai</div>
                    </div>
                    <kbd className="px-2 py-1 bg-slate-800 text-sky-300 border border-slate-700 rounded-lg font-mono font-bold text-xs">
                      Ctrl + Shift + R
                    </kbd>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                    <div className="space-y-0.5">
                      <div className="font-bold text-white text-sm">Dựng đường tròn (Circle)</div>
                      <div className="text-slate-400">Điểm 1 là Tâm, điểm 2 là Bán kính</div>
                    </div>
                    <kbd className="px-2 py-1 bg-slate-800 text-emerald-300 border border-slate-700 rounded-lg font-mono font-bold text-xs">
                      Ctrl + Shift + C
                    </kbd>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                    <div className="space-y-0.5">
                      <div className="font-bold text-white text-sm">Điểm trên đối tượng (Point on Object)</div>
                      <div className="text-slate-400">Gắn điểm chuyển động trên Đoạn thẳng, Tia, Đường thẳng hoặc Đường tròn</div>
                    </div>
                    <kbd className="px-2 py-1 bg-slate-800 text-amber-300 border border-slate-700 rounded-lg font-mono font-bold text-xs">
                      Ctrl + Shift + O
                    </kbd>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                    <div className="space-y-0.5">
                      <div className="font-bold text-white text-sm">Trung điểm (Midpoint)</div>
                      <div className="text-slate-400">Dựng trung điểm đoạn thẳng hoặc giữa 2 điểm</div>
                    </div>
                    <kbd className="px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-lg font-mono font-black text-xs">
                      Ctrl + M
                    </kbd>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                    <div className="space-y-0.5">
                      <div className="font-bold text-white text-sm">Giao điểm (Intersection)</div>
                      <div className="text-slate-400">Dựng giao điểm giữa 2 đường giao nhau</div>
                    </div>
                    <kbd className="px-2.5 py-1 bg-pink-500/20 text-pink-300 border border-pink-500/40 rounded-lg font-mono font-bold text-xs">
                      Ctrl + I
                    </kbd>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                    <div className="space-y-0.5">
                      <div className="font-bold text-white text-sm">Đường vuông góc (Perpendicular)</div>
                      <div className="text-slate-400">Chọn 1 điểm & 1 đường thẳng</div>
                    </div>
                    <kbd className="px-2 py-1 bg-slate-800 text-purple-300 border border-slate-700 rounded-lg font-mono font-bold text-xs">
                      Ctrl + Shift + P
                    </kbd>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                    <div className="space-y-0.5">
                      <div className="font-bold text-white text-sm">Đường song song (Parallel)</div>
                      <div className="text-slate-400">Chọn 1 điểm & 1 đường thẳng</div>
                    </div>
                    <kbd className="px-2 py-1 bg-slate-800 text-teal-300 border border-slate-700 rounded-lg font-mono font-bold text-xs">
                      Ctrl + Shift + F
                    </kbd>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                    <div className="space-y-0.5">
                      <div className="font-bold text-white text-sm">Phân giác góc (Angle Bisector)</div>
                      <div className="text-slate-400">Chọn 3 điểm (đỉnh ở giữa)</div>
                    </div>
                    <kbd className="px-2 py-1 bg-slate-800 text-amber-300 border border-slate-700 rounded-lg font-mono font-bold text-xs">
                      Ctrl + Shift + B
                    </kbd>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                    <div className="space-y-0.5">
                      <div className="font-bold text-white text-sm">Miền trong đa giác (Polygon Interior)</div>
                      <div className="text-slate-400">Tạo miền diện tích đa giác từ các điểm</div>
                    </div>
                    <kbd className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-lg font-mono font-bold text-xs">
                      Ctrl + P
                    </kbd>
                  </div>
                </div>
              </div>

              {/* Category 2: BIẾN HÌNH (TRANSFORM) */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-indigo-400 font-extrabold uppercase tracking-wider text-[11px]">
                  <RotateCw className="w-4 h-4" />
                  <span>2. Menu Biến Hình (Transform Shortcuts)</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                    <div className="space-y-0.5">
                      <div className="font-bold text-white text-sm">Đánh dấu tâm biến hình (Mark Center)</div>
                      <div className="text-slate-400">Chọn 1 điểm làm tâm xoay/vị tự</div>
                    </div>
                    <kbd className="px-2 py-1 bg-slate-800 text-amber-300 border border-slate-700 rounded-lg font-mono font-bold text-xs">
                      Ctrl + Shift + M
                    </kbd>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                    <div className="space-y-0.5">
                      <div className="font-bold text-white text-sm">Phép quay (Rotate)</div>
                      <div className="text-slate-400">Mở hộp thoại thiết lập góc quay</div>
                    </div>
                    <kbd className="px-2.5 py-1 bg-slate-800 text-indigo-300 border border-slate-700 rounded-lg font-mono font-bold text-xs">
                      Ctrl + R
                    </kbd>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                    <div className="space-y-0.5">
                      <div className="font-bold text-white text-sm">Phép tịnh tiến (Translate)</div>
                      <div className="text-slate-400">Mở hộp thoại vector tịnh tiến (dx, dy)</div>
                    </div>
                    <kbd className="px-2.5 py-1 bg-slate-800 text-indigo-300 border border-slate-700 rounded-lg font-mono font-bold text-xs">
                      Ctrl + T
                    </kbd>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                    <div className="space-y-0.5">
                      <div className="font-bold text-white text-sm">Phép vị tự (Dilate)</div>
                      <div className="text-slate-400">Mở hộp thoại tỉ số vị tự k</div>
                    </div>
                    <kbd className="px-2.5 py-1 bg-slate-800 text-indigo-300 border border-slate-700 rounded-lg font-mono font-bold text-xs">
                      Ctrl + D
                    </kbd>
                  </div>
                </div>
              </div>

              {/* Category 3: ĐO LƯỜNG & TÍNH TOÁN (MEASURE) */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sky-400 font-extrabold uppercase tracking-wider text-[11px]">
                  <Ruler className="w-4 h-4" />
                  <span>3. Menu Đo Lường & Máy Tính (Measure Shortcuts)</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                    <div className="space-y-0.5">
                      <div className="font-bold text-white text-sm">Đo khoảng cách / Độ dài (Distance)</div>
                      <div className="text-slate-400">Chọn 2 điểm hoặc 1 đoạn thẳng</div>
                    </div>
                    <kbd className="px-2 py-1 bg-slate-800 text-sky-300 border border-slate-700 rounded-lg font-mono font-bold text-xs">
                      Ctrl + Shift + D
                    </kbd>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                    <div className="space-y-0.5">
                      <div className="font-bold text-white text-sm">Đo góc (Angle)</div>
                      <div className="text-slate-400">Chọn 3 điểm (đỉnh góc ở giữa)</div>
                    </div>
                    <kbd className="px-2 py-1 bg-slate-800 text-sky-300 border border-slate-700 rounded-lg font-mono font-bold text-xs">
                      Ctrl + Shift + G
                    </kbd>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                    <div className="space-y-0.5">
                      <div className="font-bold text-white text-sm">Máy tính hình học GSP (Calculator)</div>
                      <div className="text-slate-400">Tính toán biểu thức toán học</div>
                    </div>
                    <kbd className="px-2.5 py-1 bg-slate-800 text-emerald-300 border border-slate-700 rounded-lg font-mono font-bold text-xs">
                      Ctrl + K
                    </kbd>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                    <div className="space-y-0.5">
                      <div className="font-bold text-white text-sm">Bật/tắt chuyển động hoạt họa</div>
                      <div className="text-slate-400">Chạy animation các điểm tự do</div>
                    </div>
                    <kbd className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-lg font-mono font-bold text-xs">
                      Space (Phím cách)
                    </kbd>
                  </div>
                </div>
              </div>

              {/* Category 4: HIỂN THỊ, QUẢN LÝ TRANG & HỆ THỐNG */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-rose-400 font-extrabold uppercase tracking-wider text-[11px]">
                  <Layers className="w-4 h-4" />
                  <span>4. Hiển Thị, Quản Lý Bản Vẽ & Công Cụ</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                    <div className="space-y-0.5">
                      <div className="font-bold text-white text-sm">Chọn toàn bộ đối tượng</div>
                      <div className="text-slate-400">Chọn tất cả điểm, đường, góc, diện tích</div>
                    </div>
                    <kbd className="px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-lg font-mono font-bold text-xs">
                      Ctrl + A
                    </kbd>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                    <div className="space-y-0.5">
                      <div className="font-bold text-white text-sm">Tạo trang vẽ mới</div>
                      <div className="text-slate-400">Thêm trang mới vào tệp đa trang GSP</div>
                    </div>
                    <kbd className="px-2.5 py-1 bg-slate-800 text-emerald-300 border border-slate-700 rounded-lg font-mono font-bold text-xs">
                      Ctrl + N
                    </kbd>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                    <div className="space-y-0.5">
                      <div className="font-bold text-white text-sm">Ẩn đối tượng đang chọn</div>
                      <div className="text-slate-400">Ẩn các điểm/đường phụ trong phép dựng</div>
                    </div>
                    <kbd className="px-2.5 py-1 bg-slate-800 text-slate-300 border border-slate-700 rounded-lg font-mono font-bold text-xs">
                      Ctrl + H
                    </kbd>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                    <div className="space-y-0.5">
                      <div className="font-bold text-white text-sm">Hiện lại toàn bộ đối tượng bị ẩn</div>
                      <div className="text-slate-400">Khôi phục hiển thị tất cả phần tử ẩn</div>
                    </div>
                    <kbd className="px-2 py-1 bg-slate-800 text-slate-300 border border-slate-700 rounded-lg font-mono font-bold text-xs">
                      Ctrl + Shift + H
                    </kbd>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                    <div className="space-y-0.5">
                      <div className="font-bold text-white text-sm">Bật/tắt lưới tọa độ</div>
                      <div className="text-slate-400">Ẩn hoặc hiện ô lưới milimet</div>
                    </div>
                    <kbd className="px-2.5 py-1 bg-slate-800 text-slate-300 border border-slate-700 rounded-lg font-mono font-bold text-xs">
                      Ctrl + G
                    </kbd>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                    <div className="space-y-0.5">
                      <div className="font-bold text-white text-sm">Hoàn tác & Làm lại (Undo / Redo)</div>
                      <div className="text-slate-400">Quay lại hoặc thực hiện lại bước trước</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <kbd className="px-2 py-1 bg-slate-800 text-slate-300 border border-slate-700 rounded-lg font-mono font-bold text-xs">
                        Ctrl+Z
                      </kbd>
                      <kbd className="px-2 py-1 bg-slate-800 text-slate-300 border border-slate-700 rounded-lg font-mono font-bold text-xs">
                        Ctrl+Y
                      </kbd>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                    <div className="space-y-0.5">
                      <div className="font-bold text-white text-sm">Xóa đối tượng đang chọn</div>
                      <div className="text-slate-400">Xóa các điểm và hình học liên đới</div>
                    </div>
                    <kbd className="px-2.5 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded-lg font-mono font-bold text-xs">
                      Delete / Backspace
                    </kbd>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                    <div className="space-y-0.5">
                      <div className="font-bold text-white text-sm">Chuyển công cụ nhanh</div>
                      <div className="text-slate-400">Chọn (1, V), Điểm (2, P), Compa (3, C), Thước (4, S), Nhãn (5, T)</div>
                    </div>
                    <kbd className="px-2 py-1 bg-slate-800 text-amber-300 border border-slate-700 rounded-lg font-mono font-bold text-xs">
                      1 ... 5
                    </kbd>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
              <div className="text-slate-400 text-xs">
                💡 Mẹo: Nhấn <kbd className="px-1.5 py-0.5 bg-slate-800 rounded font-mono text-white">F1</kbd> hoặc <kbd className="px-1.5 py-0.5 bg-slate-800 rounded font-mono text-white">?</kbd> bất cứ lúc nào để mở bảng phím tắt này.
              </div>
              <button
                onClick={() => setShowShortcutsModal(false)}
                className="px-5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs shadow-lg shadow-amber-500/20 transition-all"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. GSP ACTION BUTTON CONFIGURATION MODAL */}
      {showActionButtonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-indigo-400 font-extrabold text-base">
                <PlaySquare className="w-5 h-5" />
                <span>Tạo Nút Hành Động (Action Button)</span>
              </div>
              <button
                onClick={() => setShowActionButtonModal(false)}
                className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Type selector tabs */}
            <div className="grid grid-cols-4 gap-1 p-1 bg-slate-950 rounded-2xl border border-slate-800 text-[11px] font-bold">
              <button
                onClick={() => setActionButtonModalType('animate')}
                className={`py-2 rounded-xl transition-all ${
                  actionButtonModalType === 'animate'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Hoạt họa
              </button>
              <button
                onClick={() => setActionButtonModalType('hide_show')}
                className={`py-2 rounded-xl transition-all ${
                  actionButtonModalType === 'hide_show'
                    ? 'bg-sky-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Ẩn/Hiện
              </button>
              <button
                onClick={() => setActionButtonModalType('movement')}
                className={`py-2 rounded-xl transition-all ${
                  actionButtonModalType === 'movement'
                    ? 'bg-indigo-500 text-white shadow-md font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Dịch chuyển
              </button>
              <button
                onClick={() => setActionButtonModalType('link')}
                className={`py-2 rounded-xl transition-all ${
                  actionButtonModalType === 'link'
                    ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Trang liên kết
              </button>
            </div>

            {/* Form Fields */}
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Tên nhãn hiển thị trên nút:</label>
                <input
                  type="text"
                  placeholder={
                    actionButtonModalType === 'animate'
                      ? '🎬 Hoạt họa điểm M'
                      : actionButtonModalType === 'hide_show'
                      ? '👁️ Ẩn / Hiện đường phụ'
                      : actionButtonModalType === 'movement'
                      ? '🚀 Dịch chuyển A → B'
                      : '📑 Chuyển đến Trang 2'
                  }
                  value={actionButtonLabel}
                  onChange={(e) => setActionButtonLabel(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:border-indigo-500 focus:outline-none"
                />
              </div>

              {actionButtonModalType === 'movement' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Điểm bắt đầu:</label>
                    <select
                      value={actionButtonMovementSource || (sketch.points[0]?.id ?? '')}
                      onChange={(e) => setActionButtonMovementSource(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium"
                    >
                      {sketch.points.map((p) => (
                        <option key={p.id} value={p.id}>
                          Điểm {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Điểm đích tới:</label>
                    <select
                      value={actionButtonMovementDest || (sketch.points[1]?.id ?? sketch.points[0]?.id ?? '')}
                      onChange={(e) => setActionButtonMovementDest(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium"
                    >
                      {sketch.points.map((p) => (
                        <option key={p.id} value={p.id}>
                          Điểm {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {actionButtonModalType === 'link' && (
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Chọn trang liên kết:</label>
                  <select
                    value={actionButtonTargetPage || (pages[0]?.id ?? '')}
                    onChange={(e) => setActionButtonTargetPage(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium"
                  >
                    {pages.map((pg, idx) => (
                      <option key={pg.id} value={pg.id}>
                        Trang {idx + 1}: {pg.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {actionButtonModalType === 'hide_show' && (
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 text-slate-400 space-y-1">
                  <div className="font-bold text-slate-200">Đối tượng liên kết:</div>
                  <div>
                    {selectedPointIds.length + selectedSegmentIds.length + selectedCircleIds.length + selectedPolyIds.length > 0 ? (
                      <span className="text-emerald-400">
                        ✓ Đang chọn {selectedPointIds.length} điểm, {selectedSegmentIds.length} đoạn thẳng, {selectedCircleIds.length} đường tròn.
                      </span>
                    ) : (
                      <span className="text-amber-400">
                        ⚠️ Chưa có đối tượng nào được chọn trên bản vẽ. Nút sẽ áp dụng cho tất cả đối tượng hiện hành.
                      </span>
                    )}
                  </div>
                </div>
              )}

              {actionButtonModalType === 'animate' && (
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 text-slate-400 space-y-1">
                  <div className="font-bold text-slate-200">Hoạt họa đối tượng:</div>
                  <div>
                    {selectedPointIds.length > 0 ? (
                      <span className="text-amber-400">
                        ✓ Nút sẽ bật/tắt hoạt họa chuyển động cho {selectedPointIds.length} điểm đang chọn.
                      </span>
                    ) : (
                      <span>
                        Nút sẽ bật/tắt hoạt họa toàn cục trên bản vẽ.
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowActionButtonModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  if (actionButtonModalType === 'animate') {
                    createAnimateActionButton(
                      selectedPointIds.length > 0 ? selectedPointIds : undefined,
                      actionButtonLabel.trim() || undefined
                    );
                  } else if (actionButtonModalType === 'hide_show') {
                    createHideShowActionButton(actionButtonLabel.trim() || undefined);
                  } else if (actionButtonModalType === 'movement') {
                    const src = actionButtonMovementSource || sketch.points[0]?.id;
                    const dst = actionButtonMovementDest || sketch.points[1]?.id || sketch.points[0]?.id;
                    if (src && dst) {
                      createMovementActionButton(src, dst, actionButtonLabel.trim() || undefined);
                    }
                  } else if (actionButtonModalType === 'link') {
                    const targetPage = pages.find((p) => p.id === (actionButtonTargetPage || pages[0]?.id));
                    if (targetPage) {
                      createLinkActionButton(
                        targetPage.id,
                        targetPage.title,
                        actionButtonLabel.trim() || undefined
                      );
                    }
                  }
                  setShowActionButtonModal(false);
                  setActionButtonLabel('');
                }}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30"
              >
                Tạo Nút Hành Động
              </button>
            </div>
          </div>
        </div>
      )}
      {/* 8. AI GSP SKETCH GENERATOR MODAL (Gemini 3.1 Pro High Thinking) */}
      {showAIGeneratorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-400 to-purple-600 p-0.5 flex items-center justify-center">
                  <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                  </div>
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-white flex items-center gap-2">
                    <span>AI Dựng Hình GSP Sketchpad</span>
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
                      Gemini 3.1 Pro
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Nhập mô tả bài toán hình học, AI sẽ tính tọa độ và dựng trực tiếp lên bản vẽ
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAIGeneratorModal(false)}
                className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Prompt input */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">
                Mô tả hình học bằng tiếng Việt:
              </label>
              <textarea
                rows={3}
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="VD: Dựng tam giác ABC vuông tại A có AB=3, AC=4, đường cao AH và đường tròn ngoại tiếp tâm O..."
                disabled={aiGenerating}
                className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-3 text-xs sm:text-sm text-white focus:outline-none focus:border-purple-500 font-sans"
              />
            </div>

            {/* Quick Templates */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-400">Mẫu hình học thông dụng:</span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  {
                    label: '📐 Tam giác vuông & đường cao',
                    text: 'Vẽ tam giác vuông ABC tại A có đường cao AH và trung tuyến AM',
                  },
                  {
                    label: '⭕ Đường tròn & 2 tiếp tuyến',
                    text: 'Dựng đường tròn tâm O và hai tiếp tuyến MA, MB cắt nhau tại điểm M ngoài đường tròn',
                  },
                  {
                    label: '⬡ Hình bình hành & 2 đường chéo',
                    text: 'Vẽ hình bình hành ABCD có hai đường chéo AC và BD cắt nhau tại tâm O',
                  },
                  {
                    label: '🔺 Tam giác đều & đường tròn nội tiếp',
                    text: 'Dựng tam giác đều ABC và đường tròn nội tiếp tâm I',
                  },
                ].map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setAiPrompt(item.text);
                      handleAIGenerateSketch(item.text);
                    }}
                    disabled={aiGenerating}
                    className="px-2.5 py-1 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-[11px] text-slate-300 hover:text-white border border-slate-700 transition-colors"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* AI Explanation / Status */}
            {aiGenerating && (
              <div className="p-3 bg-purple-950/40 border border-purple-500/30 rounded-2xl text-xs text-purple-300 flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                <span>
                  <strong>Gemini 3.1 Pro</strong> đang giải toán và tính toán ma trận tọa độ phẳng...
                </span>
              </div>
            )}

            {aiGeneratedExplanation && !aiGenerating && (
              <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl text-xs text-emerald-300 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Kết quả dựng hình:</span>
                  <p className="text-slate-300 mt-0.5">{aiGeneratedExplanation}</p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowAIGeneratorModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
              >
                Đóng
              </button>
              <button
                onClick={() => handleAIGenerateSketch()}
                disabled={aiGenerating || !aiPrompt.trim()}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-purple-600/30 disabled:opacity-40 flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>{aiGenerating ? 'Đang dựng hình...' : 'Dựng hình ngay'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
