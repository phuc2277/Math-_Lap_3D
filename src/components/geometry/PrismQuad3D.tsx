import React, { useMemo } from 'react';
import { ModelParams, DisplayOptions } from '../../types/geometry';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import { DimensionLine, Label3D } from './3DHelpers';

interface PrismQuad3DProps {
  params: ModelParams;
  displayOptions: DisplayOptions;
}

export const PrismQuad3D: React.FC<PrismQuad3DProps> = ({ params, displayOptions }) => {
  const a = params.a ?? 6; // Đáy lớn hình thang
  const b = Math.min(params.b ?? 3, a - 0.2); // Đáy nhỏ hình thang
  const d = params.d ?? 4; // Chiều cao hình thang đáy
  const h = params.h ?? 5; // Chiều cao lăng trụ

  const { showDimensions, showLabels, showWireframe, transparentSolid, solidOpacity, showDiagonals } = displayOptions;
  const isDiagonalsEnabled = showDiagonals ?? true;

  const halfA = a / 2;
  const halfB = b / 2;
  const halfD = d / 2;
  const halfH = h / 2;

  // Vertices of bottom trapezoid base (y = -halfH)
  const p1: [number, number, number] = [-halfA, -halfH, -halfD]; // A
  const p2: [number, number, number] = [halfA, -halfH, -halfD];  // B
  const p3: [number, number, number] = [halfB, -halfH, halfD];   // C
  const p4: [number, number, number] = [-halfB, -halfH, halfD];  // D

  // Vertices of top trapezoid base (y = +halfH)
  const p5: [number, number, number] = [-halfA, halfH, -halfD];  // A'
  const p6: [number, number, number] = [halfA, halfH, -halfD];   // B'
  const p7: [number, number, number] = [halfB, halfH, halfD];    // C'
  const p8: [number, number, number] = [-halfB, halfH, halfD];   // D'

  // Custom 3D geometry for trapezoidal prism
  const geom = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    
    // 12 triangles (2 per 6 faces)
    const vertices = new Float32Array([
      // Bottom base (facing -Y)
      ...p1, ...p3, ...p2,
      ...p1, ...p4, ...p3,

      // Top base (facing +Y)
      ...p5, ...p6, ...p7,
      ...p5, ...p7, ...p8,

      // Front face (large base a, facing -Z)
      ...p1, ...p2, ...p6,
      ...p1, ...p6, ...p5,

      // Back face (small base b, facing +Z)
      ...p4, ...p8, ...p7,
      ...p4, ...p7, ...p3,

      // Right side face (slanted leg)
      ...p2, ...p3, ...p7,
      ...p2, ...p7, ...p6,

      // Left side face (slanted leg)
      ...p4, ...p1, ...p5,
      ...p4, ...p5, ...p8,
    ]);

    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.computeVertexNormals();
    return geometry;
  }, [a, b, d, h]);

  return (
    <group position={[0, halfH, 0]}>
      {/* Solid Trapezoidal Prism Mesh */}
      <mesh geometry={geom}>
        <meshPhysicalMaterial
          color={displayOptions.modelColor || "#0ea5e9"}
          roughness={0.2}
          metalness={0.1}
          clearcoat={0.3}
          transmission={transparentSolid ? 0.65 : 0.0}
          opacity={transparentSolid ? solidOpacity : 0.88}
          transparent
          side={THREE.DoubleSide}
          flatShading={true}
        />
      </mesh>

      {/* Outlined Edges */}
      <group>
        {/* Bottom base loop */}
        <Line points={[p1, p2, p3, p4, p1]} color="#0284c7" lineWidth={3} />
        {/* Top base loop */}
        <Line points={[p5, p6, p7, p8, p5]} color="#0284c7" lineWidth={3} />
        {/* Vertical side edges */}
        <Line points={[p1, p5]} color="#0284c7" lineWidth={3} />
        <Line points={[p2, p6]} color="#0284c7" lineWidth={3} />
        <Line points={[p3, p7]} color="#0284c7" lineWidth={3} />
        <Line points={[p4, p8]} color="#0284c7" lineWidth={3} />
      </group>

      {/* Space Diagonals & Base Diagonals */}
      {isDiagonalsEnabled && (
        <group>
          {/* Main Space Diagonal 1 (A -> C') */}
          <Line points={[p1, p7]} color="#fbbf24" lineWidth={5} />

          {/* Space Diagonal 2 (B -> D') */}
          <Line points={[p2, p8]} color="#f43f5e" lineWidth={4} />

          {/* Base Diagonal 1 (A -> C) */}
          <Line points={[p1, p3]} color="#06b6d4" lineWidth={3.5} dashed dashSize={0.2} gapSize={0.1} />

          {/* Base Diagonal 2 (B -> D) */}
          <Line points={[p2, p4]} color="#10b981" lineWidth={3.5} dashed dashSize={0.2} gapSize={0.1} />

          {/* Glowing Vertex Spheres */}
          <mesh position={p1}>
            <sphereGeometry args={[0.13, 20, 20]} />
            <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.4} />
          </mesh>
          <mesh position={p7}>
            <sphereGeometry args={[0.13, 20, 20]} />
            <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.4} />
          </mesh>
          <mesh position={p2}>
            <sphereGeometry args={[0.11, 20, 20]} />
            <meshStandardMaterial color="#f43f5e" emissive="#f43f5e" emissiveIntensity={0.4} />
          </mesh>
          <mesh position={p8}>
            <sphereGeometry args={[0.11, 20, 20]} />
            <meshStandardMaterial color="#f43f5e" emissive="#f43f5e" emissiveIntensity={0.4} />
          </mesh>

          {/* Vertex Labels */}
          {showLabels && (
            <>
              <Label3D position={[-halfA - 0.2, -halfH - 0.2, -halfD]} text="A" color="text-amber-300" />
              <Label3D position={[halfA + 0.2, -halfH - 0.2, -halfD]} text="B" color="text-rose-300" />
              <Label3D position={[halfB + 0.2, -halfH - 0.2, halfD]} text="C" color="text-cyan-300" />
              <Label3D position={[-halfB - 0.2, -halfH - 0.2, halfD]} text="D" color="text-emerald-300" />
              <Label3D position={[-halfA - 0.2, halfH + 0.2, -halfD]} text="A'" color="text-rose-300" />
              <Label3D position={[halfA + 0.2, halfH + 0.2, -halfD]} text="B'" color="text-emerald-300" />
              <Label3D position={[halfB + 0.2, halfH + 0.2, halfD]} text="C'" color="text-amber-300" />
              <Label3D position={[-halfB - 0.2, halfH + 0.2, halfD]} text="D'" color="text-rose-300" />
            </>
          )}

          {/* Diagonal Label */}
          {showDimensions && showLabels && (
            <Label3D
              position={[0, 0, 0]}
              text="Đường chéo không gian lăng trụ tứ giác (AC')"
              subtext="Nối 2 đỉnh đối diện thuộc 2 đáy"
              color="text-amber-300"
              badgeBg="bg-amber-950/95 border-amber-500 shadow-xl ring-1 ring-amber-400/40"
            />
          )}
        </group>
      )}

      {/* Dimensions */}
      {showDimensions && (
        <>
          <DimensionLine
            start={[-halfA, -halfH, -halfD - 0.25]}
            end={[halfA, -halfH, -halfD - 0.25]}
            color="#38bdf8"
            label={showLabels ? `a = ${a} cm` : undefined}
            subtext="Đáy lớn"
          />
          <DimensionLine
            start={[-halfB, -halfH, halfD + 0.25]}
            end={[halfB, -halfH, halfD + 0.25]}
            color="#f43f5e"
            label={showLabels ? `b = ${b} cm` : undefined}
            subtext="Đáy nhỏ"
          />
          <DimensionLine
            start={[-halfA - 0.25, -halfH, -halfD]}
            end={[-halfA - 0.25, halfH, -halfD]}
            color="#10b981"
            label={showLabels ? `h = ${h} cm` : undefined}
            subtext="Chiều cao"
          />
        </>
      )}
    </group>
  );
};

