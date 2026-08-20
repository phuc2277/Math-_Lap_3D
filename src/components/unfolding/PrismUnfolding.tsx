import React from 'react';
import * as THREE from 'three';
import { Line } from '@react-three/drei';
import { ModelParams, DisplayOptions } from '../../types/geometry';
import { Label3D } from '../geometry/3DHelpers';

interface PrismUnfoldingProps {
  params: ModelParams;
  progress: number; // 0 (3D block) to 1 (flattened 2D net)
  displayOptions?: DisplayOptions;
}

// Helper for single tick mark on equal length edges
const SingleTick: React.FC<{
  p1: [number, number, number];
  p2: [number, number, number];
  color?: string;
}> = ({ p1, p2, color = '#64748b' }) => {
  const mid: [number, number, number] = [
    (p1[0] + p2[0]) / 2,
    (p1[1] + p2[1]) / 2,
    (p1[2] + p2[2]) / 2,
  ];
  const dx = p2[0] - p1[0];
  const dy = p2[1] - p1[1];
  const len = Math.hypot(dx, dy) || 1;
  const tickLen = 0.15;
  const nx = (-dy / len) * tickLen;
  const ny = (dx / len) * tickLen;

  return (
    <Line
      points={[
        [mid[0] - nx, mid[1] - ny, mid[2] + 0.01],
        [mid[0] + nx, mid[1] + ny, mid[2] + 0.01],
      ]}
      color={color}
      lineWidth={2}
    />
  );
};

// Helper for double tick mark on equal height edges
const DoubleTick: React.FC<{
  p1: [number, number, number];
  p2: [number, number, number];
  color?: string;
}> = ({ p1, p2, color = '#64748b' }) => {
  const mid: [number, number, number] = [
    (p1[0] + p2[0]) / 2,
    (p1[1] + p2[1]) / 2,
    (p1[2] + p2[2]) / 2,
  ];
  const dx = p2[0] - p1[0];
  const dy = p2[1] - p1[1];
  const len = Math.hypot(dx, dy) || 1;
  const ux = (dx / len) * 0.06;
  const uy = (dy / len) * 0.06;
  const tickLen = 0.15;
  const nx = (-dy / len) * tickLen;
  const ny = (dx / len) * tickLen;

  return (
    <group>
      <Line
        points={[
          [mid[0] - ux - nx, mid[1] - uy - ny, mid[2] + 0.01],
          [mid[0] - ux + nx, mid[1] - uy + ny, mid[2] + 0.01],
        ]}
        color={color}
        lineWidth={2}
      />
      <Line
        points={[
          [mid[0] + ux - nx, mid[1] + uy - ny, mid[2] + 0.01],
          [mid[0] + ux + nx, mid[1] + uy + ny, mid[2] + 0.01],
        ]}
        color={color}
        lineWidth={2}
      />
    </group>
  );
};

export const PrismUnfolding: React.FC<PrismUnfoldingProps> = ({ params, progress, displayOptions }) => {
  const showLabels = displayOptions?.showLabels ?? true;
  const a = params.a ?? 3; // Cạnh đáy giữa (e.g. 3 cm)
  const b = params.b ?? 2.6; // Chiều cao tam giác đáy
  const h = params.h ?? 4; // Chiều cao lăng trụ (e.g. 4 cm)

  // Độ dài cạnh bên tam giác
  const sideLen = Math.hypot(a / 2, b);

  // Góc gấp theo tiến trình 3D -> 2D (progress: 0 = 3D solid, 1 = 2D net)
  const phi = Math.atan2(b, a / 2);
  const foldAngleY = (1 - progress) * (Math.PI - phi);
  const foldAngleX = (1 - progress) * (Math.PI / 2);

  // Màu sắc nhẹ nhàng hiện đại
  const faceColorMid = '#38bdf8';    // Mặt chữ nhật giữa
  const faceColorSide = '#818cf8';   // Mặt chữ nhật hai bên
  const faceColorTriangle = '#f43f5e'; // Hai đáy tam giác
  const outlineColor = '#0f172a';    // Nét viền chính
  const dashedColor = '#475569';     // Nét nếp gấp (nét đứt)

  // Hình dạng tam giác đỉnh hướng UP (cho đáy trên)
  const topTriangleShape = new THREE.Shape();
  topTriangleShape.moveTo(-a / 2, 0);
  topTriangleShape.lineTo(a / 2, 0);
  topTriangleShape.lineTo(0, b);
  topTriangleShape.closePath();

  // Hình dạng tam giác đỉnh hướng DOWN (cho đáy dưới)
  const bottomTriangleShape = new THREE.Shape();
  bottomTriangleShape.moveTo(-a / 2, 0);
  bottomTriangleShape.lineTo(a / 2, 0);
  bottomTriangleShape.lineTo(0, -b);
  bottomTriangleShape.closePath();

  return (
    <group position={[0, 0, 0]}>
      {/* 1. MẶT CHỮ NHẬT GIỮA (Cố định ở tâm) */}
      <group position={[0, 0, 0]}>
        <mesh position={[0, 0, 0]}>
          <planeGeometry args={[a, h]} />
          <meshStandardMaterial color={faceColorMid} side={THREE.DoubleSide} roughness={0.3} transparent opacity={0.85} />
        </mesh>

        {/* Nếp gấp đứt nét xung quanh mặt giữa */}
        <Line points={[[ -a / 2, -h / 2, 0.01 ], [ -a / 2, h / 2, 0.01 ]]} color={dashedColor} lineWidth={2} dashed dashScale={12} dashSize={0.2} gapSize={0.1} />
        <Line points={[[ a / 2, -h / 2, 0.01 ], [ a / 2, h / 2, 0.01 ]]} color={dashedColor} lineWidth={2} dashed dashScale={12} dashSize={0.2} gapSize={0.1} />
        <Line points={[[ -a / 2, h / 2, 0.01 ], [ a / 2, h / 2, 0.01 ]]} color={dashedColor} lineWidth={2} dashed dashScale={12} dashSize={0.2} gapSize={0.1} />
        <Line points={[[ -a / 2, -h / 2, 0.01 ], [ a / 2, -h / 2, 0.01 ]]} color={dashedColor} lineWidth={2} dashed dashScale={12} dashSize={0.2} gapSize={0.1} />

        {/* Vạch chia & Nhãn ở mặt giữa */}
        <SingleTick p1={[-a / 2, h / 2, 0]} p2={[a / 2, h / 2, 0]} />
        <SingleTick p1={[-a / 2, -h / 2, 0]} p2={[a / 2, -h / 2, 0]} />
        <DoubleTick p1={[-a / 2, -h / 2, 0]} p2={[-a / 2, h / 2, 0]} />
        <DoubleTick p1={[a / 2, -h / 2, 0]} p2={[a / 2, h / 2, 0]} />

        {showLabels && progress > 0.6 && (
          <Label3D position={[0, h / 2 + 0.25, 0]} text={`${a} cm`} color="text-sky-300" badgeBg="bg-slate-900/90 border-slate-700" />
        )}
      </group>

      {/* 2. MẶT CHỮ NHẬT BÊN TRÁI (Gấp tại x = -a/2) */}
      <group position={[-a / 2, 0, 0]} rotation={[0, -foldAngleY, 0]}>
        <mesh position={[-sideLen / 2, 0, 0]}>
          <planeGeometry args={[sideLen, h]} />
          <meshStandardMaterial color={faceColorSide} side={THREE.DoubleSide} roughness={0.3} transparent opacity={0.85} />
        </mesh>

        {/* Đường viền nét liền bên ngoài */}
        <Line points={[[0, h / 2, 0], [-sideLen, h / 2, 0]]} color={outlineColor} lineWidth={2.5} />
        <Line points={[[0, -h / 2, 0], [-sideLen, -h / 2, 0]]} color={outlineColor} lineWidth={2.5} />
        <Line points={[[-sideLen, -h / 2, 0], [-sideLen, h / 2, 0]]} color={outlineColor} lineWidth={2.5} />

        <SingleTick p1={[0, h / 2, 0]} p2={[-sideLen, h / 2, 0]} />
        <SingleTick p1={[0, -h / 2, 0]} p2={[-sideLen, -h / 2, 0]} />
        <DoubleTick p1={[-sideLen, -h / 2, 0]} p2={[-sideLen, h / 2, 0]} />

        {showLabels && progress > 0.6 && (
          <>
            <Label3D position={[-sideLen / 2, h / 2 + 0.25, 0]} text={`${sideLen.toFixed(0)} cm`} color="text-indigo-300" badgeBg="bg-slate-900/90 border-slate-700" />
            <Label3D position={[-sideLen - 0.35, 0, 0]} text={`${h} cm`} color="text-slate-300" badgeBg="bg-slate-900/90 border-slate-700" />
          </>
        )}
      </group>

      {/* 3. MẶT CHỮ NHẬT BÊN PHẢI (Gấp tại x = a/2) */}
      <group position={[a / 2, 0, 0]} rotation={[0, foldAngleY, 0]}>
        <mesh position={[sideLen / 2, 0, 0]}>
          <planeGeometry args={[sideLen, h]} />
          <meshStandardMaterial color={faceColorSide} side={THREE.DoubleSide} roughness={0.3} transparent opacity={0.85} />
        </mesh>

        {/* Đường viền nét liền bên ngoài */}
        <Line points={[[0, h / 2, 0], [sideLen, h / 2, 0]]} color={outlineColor} lineWidth={2.5} />
        <Line points={[[0, -h / 2, 0], [sideLen, -h / 2, 0]]} color={outlineColor} lineWidth={2.5} />
        <Line points={[[sideLen, -h / 2, 0], [sideLen, h / 2, 0]]} color={outlineColor} lineWidth={2.5} />

        <SingleTick p1={[0, h / 2, 0]} p2={[sideLen, h / 2, 0]} />
        <SingleTick p1={[0, -h / 2, 0]} p2={[sideLen, -h / 2, 0]} />
        <DoubleTick p1={[sideLen, -h / 2, 0]} p2={[sideLen, h / 2, 0]} />

        {showLabels && progress > 0.6 && (
          <Label3D position={[sideLen / 2, h / 2 + 0.25, 0]} text={`${sideLen.toFixed(0)} cm`} color="text-indigo-300" badgeBg="bg-slate-900/90 border-slate-700" />
        )}
      </group>

      {/* 4. ĐÁY TRÊN (Tam giác gấp tại y = h/2) */}
      <group position={[0, h / 2, 0]} rotation={[-foldAngleX, 0, 0]}>
        <mesh position={[0, 0, 0]}>
          <shapeGeometry args={[topTriangleShape]} />
          <meshStandardMaterial color={faceColorTriangle} side={THREE.DoubleSide} roughness={0.3} transparent opacity={0.85} />
        </mesh>

        {/* Đường viền nét liền hai cạnh bên tam giác */}
        <Line points={[[-a / 2, 0, 0], [0, b, 0]]} color={outlineColor} lineWidth={2.5} />
        <Line points={[[a / 2, 0, 0], [0, b, 0]]} color={outlineColor} lineWidth={2.5} />

        <SingleTick p1={[-a / 2, 0, 0]} p2={[0, b, 0]} />
        <SingleTick p1={[a / 2, 0, 0]} p2={[0, b, 0]} />

        {showLabels && progress > 0.6 && (
          <>
            <Label3D position={[-a / 4 - 0.2, b / 2 + 0.1, 0]} text={`${sideLen.toFixed(0)} cm`} color="text-rose-300" badgeBg="bg-slate-900/90 border-slate-700" />
            <Label3D position={[a / 4 + 0.2, b / 2 + 0.1, 0]} text={`${sideLen.toFixed(0)} cm`} color="text-rose-300" badgeBg="bg-slate-900/90 border-slate-700" />
          </>
        )}
      </group>

      {/* 5. ĐÁY DƯỚI (Tam giác gấp tại y = -h/2) */}
      <group position={[0, -h / 2, 0]} rotation={[foldAngleX, 0, 0]}>
        <mesh position={[0, 0, 0]}>
          <shapeGeometry args={[bottomTriangleShape]} />
          <meshStandardMaterial color={faceColorTriangle} side={THREE.DoubleSide} roughness={0.3} transparent opacity={0.85} />
        </mesh>

        {/* Đường viền nét liền hai cạnh bên tam giác */}
        <Line points={[[-a / 2, 0, 0], [0, -b, 0]]} color={outlineColor} lineWidth={2.5} />
        <Line points={[[a / 2, 0, 0], [0, -b, 0]]} color={outlineColor} lineWidth={2.5} />

        <SingleTick p1={[-a / 2, 0, 0]} p2={[0, -b, 0]} />
        <SingleTick p1={[a / 2, 0, 0]} p2={[0, -b, 0]} />
      </group>
    </group>
  );
};

