import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Line } from '@react-three/drei';
import { ModelParams, DisplayOptions } from '../../types/geometry';
import { DimensionLine, Label3D } from './3DHelpers';

interface Cube3DProps {
  params: ModelParams;
  displayOptions: DisplayOptions;
}

export const Cube3D: React.FC<Cube3DProps> = ({ params, displayOptions }) => {
  const a = params.a ?? 4; // Side length

  const boxGeo = useMemo(() => new THREE.BoxGeometry(a, a, a), [a]);
  const edgesGeo = useMemo(() => new THREE.EdgesGeometry(boxGeo), [boxGeo]);

  const { showDimensions, showLabels, showWireframe, transparentSolid, solidOpacity, showDiagonals } = displayOptions;
  const isDiagonalsEnabled = showDiagonals ?? true;
  const spaceDiagonalLength = (a * Math.sqrt(3)).toFixed(2);
  const faceDiagonalLength = (a * Math.sqrt(2)).toFixed(2);

  const halfA = a / 2;

  // 8 Vertices of the cube
  // Bottom face (y = -halfA)
  const A: [number, number, number] = [-halfA, -halfA, halfA];   // Front Left Bottom
  const B: [number, number, number] = [halfA, -halfA, halfA];    // Front Right Bottom
  const C: [number, number, number] = [halfA, -halfA, -halfA];   // Back Right Bottom
  const D: [number, number, number] = [-halfA, -halfA, -halfA];  // Back Left Bottom

  // Top face (y = +halfA)
  const A_top: [number, number, number] = [-halfA, halfA, halfA];  // Front Left Top
  const B_top: [number, number, number] = [halfA, halfA, halfA];   // Front Right Top
  const C_top: [number, number, number] = [halfA, halfA, -halfA];  // Back Right Top
  const D_top: [number, number, number] = [-halfA, halfA, -halfA]; // Back Left Top

  const centerO: [number, number, number] = [0, 0, 0];

  return (
    <group position={[0, halfA, 0]}>
      {/* Solid Cube Mesh */}
      <mesh geometry={boxGeo}>
        <meshPhysicalMaterial
          color={displayOptions.modelColor || "#818cf8"}
          roughness={0.15}
          metalness={0.1}
          clearcoat={0.4}
          transmission={transparentSolid ? 0.65 : 0.0}
          opacity={transparentSolid ? solidOpacity : 0.9}
          transparent
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Wireframe Outline */}
      {(showWireframe || transparentSolid) && (
        <lineSegments geometry={edgesGeo}>
          <lineBasicMaterial color="#c7d2fe" linewidth={2.5} />
        </lineSegments>
      )}

      {/* Space Diagonals & Face Diagonals (Đường chéo đậm nét, rõ ràng) */}
      {isDiagonalsEnabled && (
        <group>
          {/* Main Space Diagonal 1 (A -> C'): Đậm nhất, màu vàng hổ phách sáng */}
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

          {/* Base Face Diagonal (A -> C): Đường chéo mặt đáy */}
          <Line
            points={[A, C]}
            color="#06b6d4"
            lineWidth={3.5}
            dashed
            dashSize={0.25}
            gapSize={0.12}
          />

          {/* Center Point O of Cube (Intersection of 4 Space Diagonals) */}
          <mesh position={centerO}>
            <sphereGeometry args={[0.16, 24, 24]} />
            <meshStandardMaterial color="#f59e0b" emissive="#fbbf24" emissiveIntensity={0.6} />
          </mesh>

          {/* Glowing Vertex Spheres for all diagonal endpoints */}
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
              <Label3D position={[-halfA - 0.2, -halfA - 0.2, halfA + 0.2]} text="A" color="text-amber-300" />
              <Label3D position={[halfA + 0.2, -halfA - 0.2, halfA + 0.2]} text="B" color="text-rose-300" />
              <Label3D position={[halfA + 0.2, -halfA - 0.2, -halfA - 0.2]} text="C" color="text-purple-300" />
              <Label3D position={[-halfA - 0.2, -halfA - 0.2, -halfA - 0.2]} text="D" color="text-emerald-300" />
              <Label3D position={[-halfA - 0.2, halfA + 0.2, halfA + 0.2]} text="A'" color="text-purple-300" />
              <Label3D position={[halfA + 0.2, halfA + 0.2, halfA + 0.2]} text="B'" color="text-emerald-300" />
              <Label3D position={[halfA + 0.2, halfA + 0.2, -halfA - 0.2]} text="C'" color="text-amber-300" />
              <Label3D position={[-halfA - 0.2, halfA + 0.2, -halfA - 0.2]} text="D'" color="text-rose-300" />
              <Label3D position={[0, 0.35, 0]} text="O" subtext="Tâm hình lập phương" color="text-amber-300" />
            </>
          )}

          {/* Diagonal Labels & Formulas */}
          {showDimensions && showLabels && (
            <group>
              <Label3D
                position={[0, -0.4, 0]}
                text={`Đường chéo không gian d = ${spaceDiagonalLength} cm`}
                subtext="d = a√3 (AC')"
                color="text-amber-300"
                badgeBg="bg-amber-950/95 border-amber-500 shadow-xl ring-1 ring-amber-400/40"
              />
              <Label3D
                position={[0, -halfA - 0.35, 0]}
                text={`Đường chéo mặt d_đáy = ${faceDiagonalLength} cm`}
                subtext="d_mặt = a√2 (AC)"
                color="text-cyan-300"
                badgeBg="bg-cyan-950/95 border-cyan-500 shadow-xl"
              />
            </group>
          )}
        </group>
      )}

      {/* Side Dimension Line (a) */}
      {showDimensions && (
        <DimensionLine
          start={[-halfA, -halfA, halfA + 0.25]}
          end={[halfA, -halfA, halfA + 0.25]}
          color="#818cf8"
          label={showLabels ? `a = ${a} cm` : undefined}
          subtext="Cạnh hình lập phương"
        />
      )}

      {/* Height Edge Indicator */}
      {showDimensions && (
        <DimensionLine
          start={[-halfA - 0.25, -halfA, halfA]}
          end={[-halfA - 0.25, halfA, halfA]}
          color="#10b981"
          label={showLabels ? `a = ${a} cm` : undefined}
          subtext="Chiều cao (cạnh a)"
        />
      )}
    </group>
  );
};

