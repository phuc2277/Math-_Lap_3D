import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Line } from '@react-three/drei';
import { ModelParams, DisplayOptions } from '../../types/geometry';
import { DimensionLine, Label3D } from './3DHelpers';

interface Cylinder3DProps {
  params: ModelParams;
  displayOptions: DisplayOptions;
}

export const Cylinder3D: React.FC<Cylinder3DProps> = ({ params, displayOptions }) => {
  const r = params.r ?? 3; // Radius
  const h = params.h ?? 5; // Height

  const segments = displayOptions.performanceMode ? 24 : 64;
  const cylinderGeo = useMemo(() => new THREE.CylinderGeometry(r, r, h, segments), [r, h, segments]);
  const edgesGeo = useMemo(() => new THREE.EdgesGeometry(cylinderGeo), [cylinderGeo]);

  const {
    showRadius,
    showHeight,
    showDimensions,
    showLabels,
    showWireframe,
    transparentSolid,
    solidOpacity,
    showDiagonals,
  } = displayOptions;

  const isDiagonalsEnabled = showDiagonals ?? true;
  const axialDiagonalLength = Math.sqrt(4 * r * r + h * h).toFixed(2);
  const halfH = h / 2;

  // Key points for axial cross section (Thiết diện qua trục)
  const A: [number, number, number] = [-r, -halfH, 0];
  const B: [number, number, number] = [r, -halfH, 0];
  const B_top: [number, number, number] = [r, halfH, 0];
  const A_top: [number, number, number] = [-r, halfH, 0];

  const O_bottom: [number, number, number] = [0, -halfH, 0];
  const O_top: [number, number, number] = [0, halfH, 0];

  return (
    <group position={[0, halfH, 0]}>
      {/* Main Cylinder Mesh */}
      <mesh geometry={cylinderGeo}>
        <meshPhysicalMaterial
          color={displayOptions.modelColor || "#38bdf8"}
          roughness={0.2}
          metalness={0.1}
          clearcoat={0.3}
          transmission={transparentSolid ? 0.65 : 0.0}
          opacity={transparentSolid ? solidOpacity : 0.88}
          transparent
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Edges / Outlines */}
      {(showWireframe || transparentSolid) && (
        <lineSegments geometry={edgesGeo}>
          <lineBasicMaterial color="#bae6fd" linewidth={2} />
        </lineSegments>
      )}

      {/* Central Axis (Trục OO'): Đậm nét, màu xanh lá */}
      <Line
        points={[O_bottom, O_top]}
        color="#10b981"
        lineWidth={4.5}
        dashed
        dashSize={0.25}
        gapSize={0.12}
      />

      {/* Axial Cross Section Diagonals (Đường chéo thiết diện qua trục) */}
      {isDiagonalsEnabled && (
        <group>
          {/* Diagonal 1 (A -> B'): Đậm nhất, màu vàng hổ phách */}
          <Line points={[A, B_top]} color="#fbbf24" lineWidth={5} />

          {/* Diagonal 2 (B -> A'): Đậm nét, màu hồng đỏ */}
          <Line points={[B, A_top]} color="#f43f5e" lineWidth={4} dashed dashSize={0.2} gapSize={0.1} />

          {/* Base Diameters */}
          <Line points={[A, B]} color="#06b6d4" lineWidth={3.5} />
          <Line points={[A_top, B_top]} color="#06b6d4" lineWidth={3.5} />

          {/* Side Generators (Đường sinh) */}
          <Line points={[A, A_top]} color="#38bdf8" lineWidth={3} />
          <Line points={[B, B_top]} color="#38bdf8" lineWidth={3} />

          {/* Glowing Vertex Spheres */}
          <mesh position={A}>
            <sphereGeometry args={[0.12, 16, 16]} />
            <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.4} />
          </mesh>
          <mesh position={B_top}>
            <sphereGeometry args={[0.12, 16, 16]} />
            <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.4} />
          </mesh>
          <mesh position={B}>
            <sphereGeometry args={[0.11, 16, 16]} />
            <meshStandardMaterial color="#f43f5e" emissive="#f43f5e" emissiveIntensity={0.4} />
          </mesh>
          <mesh position={A_top}>
            <sphereGeometry args={[0.11, 16, 16]} />
            <meshStandardMaterial color="#f43f5e" emissive="#f43f5e" emissiveIntensity={0.4} />
          </mesh>

          {/* Diagonal Label */}
          {showDimensions && showLabels && (
            <Label3D
              position={[0, 0, 0]}
              text={`Đường chéo thiết diện trục d = ${axialDiagonalLength} cm`}
              subtext="d = √((2r)² + h²)"
              color="text-amber-300"
              badgeBg="bg-amber-950/95 border-amber-500 shadow-xl ring-1 ring-amber-400/40"
            />
          )}
        </group>
      )}

      {/* Base Center Points */}
      <mesh position={O_bottom}>
        <sphereGeometry args={[0.11, 16, 16]} />
        <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={0.4} />
      </mesh>
      {showLabels && (
        <Label3D position={[0, -halfH - 0.3, 0]} text="O" subtext="Tâm đáy dưới" color="text-emerald-400" />
      )}

      <mesh position={O_top}>
        <sphereGeometry args={[0.11, 16, 16]} />
        <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={0.4} />
      </mesh>
      {showLabels && (
        <Label3D position={[0, halfH + 0.3, 0]} text="O'" subtext="Tâm đáy trên" color="text-emerald-400" />
      )}

      {/* Radius Line (Bottom Base) */}
      {(showRadius || showDimensions) && (
        <DimensionLine
          start={[0, -halfH, 0]}
          end={[r, -halfH, 0]}
          color="#f43f5e"
          label={showLabels ? `r = ${r} cm` : undefined}
          subtext="Bán kính đáy"
        />
      )}

      {/* Height Line (Side) */}
      {(showHeight || showDimensions) && (
        <DimensionLine
          start={[-r - 0.4, -halfH, 0]}
          end={[-r - 0.4, halfH, 0]}
          color="#10b981"
          label={showLabels ? `h = ${h} cm` : undefined}
          subtext="Chiều cao"
        />
      )}
    </group>
  );
};

