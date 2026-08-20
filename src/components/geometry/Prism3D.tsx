import React from 'react';
import { ModelParams, DisplayOptions } from '../../types/geometry';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import { DimensionLine, Label3D } from './3DHelpers';

interface Prism3DProps {
  params: ModelParams;
  displayOptions: DisplayOptions;
}

export const Prism3D: React.FC<Prism3DProps> = ({ params, displayOptions }) => {
  const a = params.a ?? 4; // Base edge length
  const b = params.b ?? 3; // Base depth
  const h = params.h ?? 5; // Height

  const { showDimensions, showLabels, showWireframe, transparentSolid, solidOpacity, showDiagonals } = displayOptions;
  const isDiagonalsEnabled = showDiagonals ?? true;

  // Create custom triangular prism geometry
  const shape = new THREE.Shape();
  shape.moveTo(-a / 2, -b / 2);
  shape.lineTo(a / 2, -b / 2);
  shape.lineTo(0, b / 2);
  shape.closePath();

  const extrudeSettings = {
    steps: 1,
    depth: h,
    bevelEnabled: false,
  };

  const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  // Center extrusion vertically along Y
  geometry.center();

  // Wireframe edges points
  const p1: [number, number, number] = [-a / 2, -h / 2, -b / 2]; // A
  const p2: [number, number, number] = [a / 2, -h / 2, -b / 2];  // B
  const p3: [number, number, number] = [0, -h / 2, b / 2];       // C

  const p4: [number, number, number] = [-a / 2, h / 2, -b / 2];  // A'
  const p5: [number, number, number] = [a / 2, h / 2, -b / 2];   // B'
  const p6: [number, number, number] = [0, h / 2, b / 2];        // C'

  const lateralDiagonalLength = Math.sqrt(a * a + h * h).toFixed(2);

  return (
    <group position={[0, h / 2, 0]}>
      {/* Solid Prism */}
      <mesh geometry={geometry} rotation={[Math.PI / 2, 0, 0]}>
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

      {/* Outlined Edges */}
      <group>
        {/* Bottom base */}
        <Line points={[p1, p2, p3, p1]} color="#0284c7" lineWidth={3} />
        {/* Top base */}
        <Line points={[p4, p5, p6, p4]} color="#0284c7" lineWidth={3} />
        {/* Vertical edges */}
        <Line points={[p1, p4]} color="#0284c7" lineWidth={3} />
        <Line points={[p2, p5]} color="#0284c7" lineWidth={3} />
        <Line points={[p3, p6]} color="#0284c7" lineWidth={3} />
      </group>

      {/* Lateral Face Diagonals (Đường chéo các mặt bên lăng trụ đứng) */}
      {isDiagonalsEnabled && (
        <group>
          {/* Main Front Face Diagonal (A -> B') */}
          <Line points={[p1, p5]} color="#fbbf24" lineWidth={5} />

          {/* Front Face Counter Diagonal (B -> A') */}
          <Line points={[p2, p4]} color="#f43f5e" lineWidth={4} dashed dashSize={0.2} gapSize={0.1} />

          {/* Right Face Diagonal (B -> C') */}
          <Line points={[p2, p6]} color="#a855f7" lineWidth={4} />

          {/* Left Face Diagonal (A -> C') */}
          <Line points={[p1, p6]} color="#10b981" lineWidth={4} />

          {/* Glowing Vertex Spheres */}
          <mesh position={p1}>
            <sphereGeometry args={[0.12, 16, 16]} />
            <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.4} />
          </mesh>
          <mesh position={p5}>
            <sphereGeometry args={[0.12, 16, 16]} />
            <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.4} />
          </mesh>
          <mesh position={p2}>
            <sphereGeometry args={[0.1, 16, 16]} />
            <meshStandardMaterial color="#f43f5e" emissive="#f43f5e" emissiveIntensity={0.4} />
          </mesh>
          <mesh position={p4}>
            <sphereGeometry args={[0.1, 16, 16]} />
            <meshStandardMaterial color="#f43f5e" emissive="#f43f5e" emissiveIntensity={0.4} />
          </mesh>
          <mesh position={p3}>
            <sphereGeometry args={[0.1, 16, 16]} />
            <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={0.4} />
          </mesh>
          <mesh position={p6}>
            <sphereGeometry args={[0.1, 16, 16]} />
            <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={0.4} />
          </mesh>

          {/* Vertex Labels */}
          {showLabels && (
            <>
              <Label3D position={[-a / 2 - 0.2, -h / 2 - 0.2, -b / 2]} text="A" color="text-amber-300" />
              <Label3D position={[a / 2 + 0.2, -h / 2 - 0.2, -b / 2]} text="B" color="text-rose-300" />
              <Label3D position={[0, -h / 2 - 0.2, b / 2 + 0.2]} text="C" color="text-sky-300" />
              <Label3D position={[-a / 2 - 0.2, h / 2 + 0.2, -b / 2]} text="A'" color="text-rose-300" />
              <Label3D position={[a / 2 + 0.2, h / 2 + 0.2, -b / 2]} text="B'" color="text-amber-300" />
              <Label3D position={[0, h / 2 + 0.2, b / 2 + 0.2]} text="C'" color="text-emerald-300" />
            </>
          )}

          {/* Diagonal Label */}
          {showDimensions && showLabels && (
            <Label3D
              position={[0, 0, -b / 2 - 0.25]}
              text={`Đường chéo mặt bên d = ${lateralDiagonalLength} cm`}
              subtext="d = √(a² + h²) (AB')"
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
            start={[-a / 2, -h / 2, -b / 2 - 0.25]}
            end={[a / 2, -h / 2, -b / 2 - 0.25]}
            color="#38bdf8"
            label={showLabels ? `a = ${a} cm` : undefined}
            subtext="Cạnh đáy"
          />
          <DimensionLine
            start={[-a / 2 - 0.25, -h / 2, -b / 2]}
            end={[-a / 2 - 0.25, h / 2, -b / 2]}
            color="#10b981"
            label={showLabels ? `h = ${h} cm` : undefined}
            subtext="Chiều cao"
          />
        </>
      )}
    </group>
  );
};

