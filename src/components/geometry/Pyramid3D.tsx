import React from 'react';
import { ModelParams, DisplayOptions } from '../../types/geometry';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import { DimensionLine, Label3D } from './3DHelpers';

interface Pyramid3DProps {
  params: ModelParams;
  displayOptions: DisplayOptions;
}

export const Pyramid3D: React.FC<Pyramid3DProps> = ({ params, displayOptions }) => {
  const a = params.a ?? 4; // Base length
  const b = params.b ?? 4; // Base width
  const h = params.h ?? 5; // Height

  const { showDimensions, showLabels, showWireframe, transparentSolid, solidOpacity, showDiagonals } = displayOptions;
  const isDiagonalsEnabled = showDiagonals ?? true;

  const halfA = a / 2;
  const halfB = b / 2;
  const halfH = h / 2;

  // Pyramid vertices
  const S: [number, number, number] = [0, halfH, 0];                  // Apex S
  const A: [number, number, number] = [-halfA, -halfH, halfB];         // Base A
  const B: [number, number, number] = [halfA, -halfH, halfB];          // Base B
  const C: [number, number, number] = [halfA, -halfH, -halfB];         // Base C
  const D: [number, number, number] = [-halfA, -halfH, -halfB];        // Base D
  const H_center: [number, number, number] = [0, -halfH, 0];          // Base Center H
  const M_mid: [number, number, number] = [0, -halfH, halfB];          // Midpoint of AB

  // Custom pyramid geometry using ConeGeometry with 4 radial segments
  const radius = Math.sqrt(halfA * halfA + halfB * halfB);
  const baseDiagonalLength = Math.sqrt(a * a + b * b).toFixed(2);
  const slantHeightLength = Math.sqrt(h * h + (b / 2) * (b / 2)).toFixed(2);

  return (
    <group position={[0, halfH, 0]}>
      {/* Solid Mesh */}
      <mesh position={[0, 0, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[radius, h, 4, 1]} />
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
        {/* Base */}
        <Line points={[A, B, C, D, A]} color="#d97706" lineWidth={3} />
        {/* Slant edges from base corners to apex */}
        <Line points={[A, S]} color="#d97706" lineWidth={3} />
        <Line points={[B, S]} color="#d97706" lineWidth={3} />
        <Line points={[C, S]} color="#d97706" lineWidth={3} />
        <Line points={[D, S]} color="#d97706" lineWidth={3} />
      </group>

      {/* Base Diagonals & Height & Slant Height (Đường chéo đáy, đường cao và trung đoạn) */}
      {isDiagonalsEnabled && (
        <group>
          {/* Base Diagonal 1 (A -> C): Đậm nét, màu vàng hổ phách */}
          <Line points={[A, C]} color="#fbbf24" lineWidth={5} />

          {/* Base Diagonal 2 (B -> D): Đậm nét, màu hồng đỏ */}
          <Line points={[B, D]} color="#f43f5e" lineWidth={4} />

          {/* Height Line (S -> H): Chiều cao SH vuông góc đáy */}
          <Line points={[S, H_center]} color="#10b981" lineWidth={4.5} dashed dashSize={0.25} gapSize={0.1} />

          {/* Apothem / Slant Height SM (Trung đoạn nối S với trung điểm M của AB) */}
          <Line points={[S, M_mid]} color="#a855f7" lineWidth={3.5} />

          {/* Glowing Vertex Spheres */}
          <mesh position={S}>
            <sphereGeometry args={[0.14, 20, 20]} />
            <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.5} />
          </mesh>
          <mesh position={H_center}>
            <sphereGeometry args={[0.13, 20, 20]} />
            <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={0.5} />
          </mesh>
          <mesh position={A}>
            <sphereGeometry args={[0.12, 16, 16]} />
            <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.4} />
          </mesh>
          <mesh position={C}>
            <sphereGeometry args={[0.12, 16, 16]} />
            <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.4} />
          </mesh>
          <mesh position={B}>
            <sphereGeometry args={[0.11, 16, 16]} />
            <meshStandardMaterial color="#f43f5e" emissive="#f43f5e" emissiveIntensity={0.4} />
          </mesh>
          <mesh position={D}>
            <sphereGeometry args={[0.11, 16, 16]} />
            <meshStandardMaterial color="#f43f5e" emissive="#f43f5e" emissiveIntensity={0.4} />
          </mesh>
          <mesh position={M_mid}>
            <sphereGeometry args={[0.1, 16, 16]} />
            <meshStandardMaterial color="#a855f7" emissive="#a855f7" emissiveIntensity={0.4} />
          </mesh>

          {/* Vertex Labels */}
          {showLabels && (
            <>
              <Label3D position={[0, halfH + 0.35, 0]} text="S" subtext="Đỉnh hình chóp" color="text-red-400" />
              <Label3D position={[-halfA - 0.2, -halfH - 0.2, halfB + 0.2]} text="A" color="text-amber-300" />
              <Label3D position={[halfA + 0.2, -halfH - 0.2, halfB + 0.2]} text="B" color="text-rose-300" />
              <Label3D position={[halfA + 0.2, -halfH - 0.2, -halfB - 0.2]} text="C" color="text-amber-300" />
              <Label3D position={[-halfA - 0.2, -halfH - 0.2, -halfB - 0.2]} text="D" color="text-rose-300" />
              <Label3D position={[0, -halfH - 0.3, 0]} text="H" subtext="Tâm đáy (Giao 2 đường chéo)" color="text-emerald-300" />
              <Label3D position={[0, -halfH - 0.2, halfB + 0.25]} text="M" subtext="Trung điểm AB" color="text-purple-300" />
            </>
          )}

          {/* Diagonal & Height Badges */}
          {showDimensions && showLabels && (
            <group>
              <Label3D
                position={[0, -halfH - 0.6, 0]}
                text={`Đường chéo đáy AC = ${baseDiagonalLength} cm`}
                subtext="d = √(a² + b²)"
                color="text-amber-300"
                badgeBg="bg-amber-950/95 border-amber-500 shadow-xl"
              />
              <Label3D
                position={[0, 0, 0]}
                text={`Chiều cao SH = ${h} cm`}
                subtext="SH ⊥ (ABCD)"
                color="text-emerald-300"
                badgeBg="bg-emerald-950/95 border-emerald-500 shadow-xl"
              />
              <Label3D
                position={[0, 0, halfB / 2 + 0.2]}
                text={`Trung đoạn SM = ${slantHeightLength} cm`}
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
          start={[-halfA, -halfH, halfB + 0.25]}
          end={[halfA, -halfH, halfB + 0.25]}
          color="#f59e0b"
          label={showLabels ? `a = ${a} cm` : undefined}
          subtext="Cạnh đáy"
        />
      )}
    </group>
  );
};

