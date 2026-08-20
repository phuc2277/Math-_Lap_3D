import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Line } from '@react-three/drei';
import { ModelParams, DisplayOptions } from '../../types/geometry';
import { DimensionLine, Label3D } from './3DHelpers';

interface Cuboid3DProps {
  params: ModelParams;
  displayOptions: DisplayOptions;
}

export const Cuboid3D: React.FC<Cuboid3DProps> = ({ params, displayOptions }) => {
  const a = params.a ?? 5; // Length (X)
  const b = params.b ?? 3; // Width (Z)
  const h = params.h ?? 4; // Height (Y)

  // Edges geometry
  const boxGeo = useMemo(() => new THREE.BoxGeometry(a, h, b), [a, h, b]);
  const edgesGeo = useMemo(() => new THREE.EdgesGeometry(boxGeo), [boxGeo]);

  const { showDimensions, showLabels, showWireframe, transparentSolid, solidOpacity, showDiagonals } = displayOptions;
  const isDiagonalsEnabled = showDiagonals ?? true;
  const spaceDiagonalLength = Math.sqrt(a * a + b * b + h * h).toFixed(2);
  const baseDiagonalLength = Math.sqrt(a * a + b * b).toFixed(2);

  const halfA = a / 2;
  const halfB = b / 2;
  const halfH = h / 2;

  // 8 Corner Vertices of the Cuboid
  // Bottom face (y = -halfH)
  const A: [number, number, number] = [-halfA, -halfH, halfB];   // Front Left Bottom
  const B: [number, number, number] = [halfA, -halfH, halfB];    // Front Right Bottom
  const C: [number, number, number] = [halfA, -halfH, -halfB];   // Back Right Bottom
  const D: [number, number, number] = [-halfA, -halfH, -halfB];  // Back Left Bottom

  // Top face (y = +halfH)
  const A_top: [number, number, number] = [-halfA, halfH, halfB];  // Front Left Top
  const B_top: [number, number, number] = [halfA, halfH, halfB];   // Front Right Top
  const C_top: [number, number, number] = [halfA, halfH, -halfB];  // Back Right Top
  const D_top: [number, number, number] = [-halfA, halfH, -halfB]; // Back Left Top

  const centerO: [number, number, number] = [0, 0, 0];

  return (
    <group position={[0, halfH, 0]}>
      {/* Solid Box Mesh */}
      <mesh geometry={boxGeo}>
        <meshPhysicalMaterial
          color={displayOptions.modelColor || "#38bdf8"}
          roughness={0.2}
          metalness={0.1}
          clearcoat={0.3}
          transmission={transparentSolid ? 0.65 : 0.0}
          opacity={transparentSolid ? solidOpacity : 0.9}
          transparent
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Wireframe Outline */}
      {(showWireframe || transparentSolid) && (
        <lineSegments geometry={edgesGeo}>
          <lineBasicMaterial color="#bae6fd" linewidth={2.5} />
        </lineSegments>
      )}

      {/* Space Diagonals & Base Diagonals (Đường chéo đậm nét, nổi bật) */}
      {isDiagonalsEnabled && (
        <group>
          {/* Main Space Diagonal 1 (A -> C'): Đậm nhất, màu vàng cam sáng rực */}
          <Line
            points={[A, C_top]}
            color="#fbbf24"
            lineWidth={5.5}
          />

          {/* Space Diagonal 2 (B -> D'): Đậm nét, màu hồng đỏ neon */}
          <Line
            points={[B, D_top]}
            color="#f43f5e"
            lineWidth={4}
          />

          {/* Space Diagonal 3 (C -> A'): Đậm nét, màu tím neon */}
          <Line
            points={[C, A_top]}
            color="#a855f7"
            lineWidth={4}
          />

          {/* Space Diagonal 4 (D -> B'): Đậm nét, màu xanh ngọc lục bảo */}
          <Line
            points={[D, B_top]}
            color="#10b981"
            lineWidth={4}
          />

          {/* Base Diagonal (A -> C): Đường chéo mặt đáy */}
          <Line
            points={[A, C]}
            color="#06b6d4"
            lineWidth={3.5}
            dashed
            dashSize={0.25}
            gapSize={0.12}
          />

          {/* Center Point O of Cuboid (Intersection of 4 Space Diagonals) */}
          <mesh position={centerO}>
            <sphereGeometry args={[0.16, 24, 24]} />
            <meshStandardMaterial color="#f59e0b" emissive="#fbbf24" emissiveIntensity={0.6} />
          </mesh>

          {/* Glowing Vertex Spheres at the 8 Corners */}
          <mesh position={A}>
            <sphereGeometry args={[0.13, 20, 20]} />
            <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.4} />
          </mesh>
          <mesh position={C_top}>
            <sphereGeometry args={[0.13, 20, 20]} />
            <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.4} />
          </mesh>
          <mesh position={B}>
            <sphereGeometry args={[0.11, 20, 20]} />
            <meshStandardMaterial color="#f43f5e" emissive="#f43f5e" emissiveIntensity={0.4} />
          </mesh>
          <mesh position={D_top}>
            <sphereGeometry args={[0.11, 20, 20]} />
            <meshStandardMaterial color="#f43f5e" emissive="#f43f5e" emissiveIntensity={0.4} />
          </mesh>
          <mesh position={C}>
            <sphereGeometry args={[0.11, 20, 20]} />
            <meshStandardMaterial color="#a855f7" emissive="#a855f7" emissiveIntensity={0.4} />
          </mesh>
          <mesh position={A_top}>
            <sphereGeometry args={[0.11, 20, 20]} />
            <meshStandardMaterial color="#a855f7" emissive="#a855f7" emissiveIntensity={0.4} />
          </mesh>
          <mesh position={D}>
            <sphereGeometry args={[0.11, 20, 20]} />
            <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={0.4} />
          </mesh>
          <mesh position={B_top}>
            <sphereGeometry args={[0.11, 20, 20]} />
            <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={0.4} />
          </mesh>

          {/* Vertex Labels */}
          {showLabels && (
            <>
              <Label3D position={[-halfA - 0.2, -halfH - 0.2, halfB + 0.2]} text="A" color="text-amber-300" />
              <Label3D position={[halfA + 0.2, -halfH - 0.2, halfB + 0.2]} text="B" color="text-rose-300" />
              <Label3D position={[halfA + 0.2, -halfH - 0.2, -halfB - 0.2]} text="C" color="text-purple-300" />
              <Label3D position={[-halfA - 0.2, -halfH - 0.2, -halfB - 0.2]} text="D" color="text-emerald-300" />
              <Label3D position={[-halfA - 0.2, halfH + 0.2, halfB + 0.2]} text="A'" color="text-purple-300" />
              <Label3D position={[halfA + 0.2, halfH + 0.2, halfB + 0.2]} text="B'" color="text-emerald-300" />
              <Label3D position={[halfA + 0.2, halfH + 0.2, -halfB - 0.2]} text="C'" color="text-amber-300" />
              <Label3D position={[-halfA - 0.2, halfH + 0.2, -halfB - 0.2]} text="D'" color="text-rose-300" />
              <Label3D position={[0, 0.35, 0]} text="O" subtext="Tâm hình hộp chữ nhật" color="text-amber-300" />
            </>
          )}

          {/* Diagonal Labels & Formula Badges */}
          {showDimensions && showLabels && (
            <group>
              <Label3D
                position={[0, -0.4, 0]}
                text={`Đường chéo không gian d = ${spaceDiagonalLength} cm`}
                subtext="d = √(a² + b² + h²) (AC')"
                color="text-amber-300"
                badgeBg="bg-amber-950/95 border-amber-500 shadow-xl ring-1 ring-amber-400/40"
              />
              <Label3D
                position={[0, -halfH - 0.35, 0]}
                text={`Đường chéo đáy d_đáy = ${baseDiagonalLength} cm`}
                subtext="d_đáy = √(a² + b²) (AC)"
                color="text-cyan-300"
                badgeBg="bg-cyan-950/95 border-cyan-500 shadow-xl"
              />
            </group>
          )}
        </group>
      )}

      {/* Length Line (a) - Front bottom edge */}
      {showDimensions && (
        <DimensionLine
          start={[-halfA, -halfH, halfB + 0.25]}
          end={[halfA, -halfH, halfB + 0.25]}
          color="#38bdf8"
          label={showLabels ? `a = ${a} cm` : undefined}
          subtext="Chiều dài"
        />
      )}

      {/* Width Line (b) - Right bottom edge */}
      {showDimensions && (
        <DimensionLine
          start={[halfA + 0.25, -halfH, -halfB]}
          end={[halfA + 0.25, -halfH, halfB]}
          color="#f43f5e"
          label={showLabels ? `b = ${b} cm` : undefined}
          subtext="Chiều rộng"
        />
      )}

      {/* Height Line (h) - Left front vertical edge */}
      {showDimensions && showHeight && (
        <DimensionLine
          start={[-halfA - 0.25, -halfH, halfB]}
          end={[-halfA - 0.25, halfH, halfB]}
          color="#10b981"
          label={showLabels ? `h = ${h} cm` : undefined}
          subtext="Chiều cao"
        />
      )}
    </group>
  );
};

const showHeight = true; // Fallback helper check

