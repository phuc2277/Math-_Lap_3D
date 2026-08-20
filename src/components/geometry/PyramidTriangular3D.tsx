import React from 'react';
import { ModelParams, DisplayOptions } from '../../types/geometry';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import { DimensionLine, Label3D } from './3DHelpers';

interface PyramidTriangular3DProps {
  params: ModelParams;
  displayOptions: DisplayOptions;
}

export const PyramidTriangular3D: React.FC<PyramidTriangular3DProps> = ({ params, displayOptions }) => {
  const a = params.a ?? 4; // Cạnh đáy tam giác đều
  const h = params.h ?? 5; // Chiều cao hình chóp

  const { showDimensions, showLabels, showWireframe, transparentSolid, solidOpacity, showDiagonals } = displayOptions;
  const isDiagonalsEnabled = showDiagonals ?? true;

  const R = a / Math.sqrt(3); // Bán kính đường tròn ngoại tiếp đáy tam giác đều
  const rIn = a / (2 * Math.sqrt(3)); // Bán kính đường tròn nội tiếp (khoảng cách từ tâm đến cạnh)
  const halfH = h / 2;

  // Apex and base vertices
  const S: [number, number, number] = [0, halfH, 0];
  const A: [number, number, number] = [0, -halfH, R];
  const B: [number, number, number] = [a / 2, -halfH, -R / 2];
  const C: [number, number, number] = [-a / 2, -halfH, -R / 2];

  const G_centroid: [number, number, number] = [0, -halfH, 0]; // Trọng tâm đáy
  const M_BC: [number, number, number] = [0, -halfH, -R / 2];   // Trung điểm BC

  const slantHeight = Math.sqrt(h * h + rIn * rIn).toFixed(2);
  const baseAltitude = (a * Math.sqrt(3) / 2).toFixed(2);

  return (
    <group position={[0, halfH, 0]}>
      {/* Solid Mesh using ConeGeometry with 3 radial segments */}
      <mesh position={[0, 0, 0]} rotation={[0, 0, 0]}>
        <coneGeometry args={[R, h, 3, 1]} />
        <meshPhysicalMaterial
          color={displayOptions.modelColor || "#f59e0b"}
          roughness={0.2}
          metalness={0.1}
          clearcoat={0.3}
          transmission={transparentSolid ? 0.65 : 0.0}
          opacity={transparentSolid ? solidOpacity : 0.88}
          transparent
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Outlined Edges */}
      <group>
        {/* Base Equilateral Triangle */}
        <Line points={[A, B, C, A]} color="#d97706" lineWidth={3} />
        {/* Slant edges to apex */}
        <Line points={[A, S]} color="#d97706" lineWidth={3} />
        <Line points={[B, S]} color="#d97706" lineWidth={3} />
        <Line points={[C, S]} color="#d97706" lineWidth={3} />
      </group>

      {/* Medians / Altitudes & Height Line & Apothem */}
      {isDiagonalsEnabled && (
        <group>
          {/* Base Median / Altitude 1 (A -> M_BC through G): Đậm nét, màu vàng hổ phách */}
          <Line points={[A, M_BC]} color="#fbbf24" lineWidth={5} />

          {/* Base Median 2 (B -> Mid AC) */}
          <Line points={[B, [-a / 4, -halfH, (R - R / 2) / 2]]} color="#f43f5e" lineWidth={3.5} dashed dashSize={0.2} gapSize={0.1} />

          {/* Base Median 3 (C -> Mid AB) */}
          <Line points={[C, [a / 4, -halfH, (R - R / 2) / 2]]} color="#a855f7" lineWidth={3.5} dashed dashSize={0.2} gapSize={0.1} />

          {/* Height Line SG: Chiều cao vuông góc đáy */}
          <Line points={[S, G_centroid]} color="#10b981" lineWidth={4.5} dashed dashSize={0.25} gapSize={0.1} />

          {/* Apothem / Slant Height S -> M_BC */}
          <Line points={[S, M_BC]} color="#a855f7" lineWidth={3.5} />

          {/* Glowing Vertex Spheres */}
          <mesh position={S}>
            <sphereGeometry args={[0.14, 20, 20]} />
            <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.5} />
          </mesh>
          <mesh position={G_centroid}>
            <sphereGeometry args={[0.13, 20, 20]} />
            <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={0.5} />
          </mesh>
          <mesh position={A}>
            <sphereGeometry args={[0.12, 16, 16]} />
            <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.4} />
          </mesh>
          <mesh position={B}>
            <sphereGeometry args={[0.11, 16, 16]} />
            <meshStandardMaterial color="#f43f5e" emissive="#f43f5e" emissiveIntensity={0.4} />
          </mesh>
          <mesh position={C}>
            <sphereGeometry args={[0.11, 16, 16]} />
            <meshStandardMaterial color="#a855f7" emissive="#a855f7" emissiveIntensity={0.4} />
          </mesh>
          <mesh position={M_BC}>
            <sphereGeometry args={[0.1, 16, 16]} />
            <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.4} />
          </mesh>

          {/* Vertex Labels */}
          {showLabels && (
            <>
              <Label3D position={[0, halfH + 0.35, 0]} text="S" subtext="Đỉnh hình chóp" color="text-red-400" />
              <Label3D position={[0, -halfH - 0.25, R + 0.2]} text="A" color="text-amber-300" />
              <Label3D position={[a / 2 + 0.25, -halfH - 0.25, -R / 2]} text="B" color="text-rose-300" />
              <Label3D position={[-a / 2 - 0.25, -halfH - 0.25, -R / 2]} text="C" color="text-purple-300" />
              <Label3D position={[0, -halfH - 0.3, 0]} text="G" subtext="Trọng tâm đáy (Chân đường cao SG)" color="text-emerald-300" />
              <Label3D position={[0, -halfH - 0.25, -R / 2 - 0.25]} text="M" subtext="Trung điểm BC" color="text-amber-300" />
            </>
          )}

          {/* Badges */}
          {showDimensions && showLabels && (
            <group>
              <Label3D
                position={[0, -halfH - 0.6, 0]}
                text={`Đường cao đáy AM = ${baseAltitude} cm`}
                subtext="AM = a√3/2"
                color="text-amber-300"
                badgeBg="bg-amber-950/95 border-amber-500 shadow-xl"
              />
              <Label3D
                position={[0, 0, 0]}
                text={`Chiều cao chóp SG = ${h} cm`}
                subtext="SG ⊥ (ABC)"
                color="text-emerald-300"
                badgeBg="bg-emerald-950/95 border-emerald-500 shadow-xl"
              />
              <Label3D
                position={[0, 0, -R / 4 - 0.2]}
                text={`Trung đoạn SM = ${slantHeight} cm`}
                subtext="Đường cao mặt bên"
                color="text-purple-300"
                badgeBg="bg-purple-950/95 border-purple-500 shadow-xl"
              />
            </group>
          )}
        </group>
      )}

      {/* Dimensions */}
      {showDimensions && (
        <DimensionLine
          start={[-a / 2, -halfH, -R / 2 - 0.25]}
          end={[a / 2, -halfH, -R / 2 - 0.25]}
          color="#f59e0b"
          label={showLabels ? `a = ${a} cm` : undefined}
          subtext="Cạnh đáy tam giác đều"
        />
      )}
    </group>
  );
};

