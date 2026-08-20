import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Html, Line } from '@react-three/drei';
import { ModelParams, DisplayOptions } from '../../types/geometry';

interface Parabol3DProps {
  params: ModelParams;
  displayOptions: DisplayOptions;
}

export const Parabol3D: React.FC<Parabol3DProps> = ({ params, displayOptions }) => {
  // Parameters: a = coefficient (default 0.5), h = height limit (default 5)
  const a = params.a ?? 0.5;
  const height = params.h ?? 5;
  const radius = Math.sqrt(height / Math.max(0.1, a));

  // Generate 3D Paraboloid Geometry (Surface z = a * (x^2 + y^2))
  const geometry = useMemo(() => {
    const segments = displayOptions.performanceMode ? 24 : 48;
    const geom = new THREE.BufferGeometry();
    const positions: number[] = [];
    const indices: number[] = [];
    const uvs: number[] = [];

    for (let i = 0; i <= segments; i++) {
      const r = (i / segments) * radius;
      const y = a * r * r; // height along Y axis

      for (let j = 0; j <= segments; j++) {
        const theta = (j / segments) * Math.PI * 2;
        const x = r * Math.cos(theta);
        const z = r * Math.sin(theta);

        positions.push(x, y, z);
        uvs.push(i / segments, j / segments);
      }
    }

    for (let i = 0; i < segments; i++) {
      for (let j = 0; j < segments; j++) {
        const p1 = i * (segments + 1) + j;
        const p2 = p1 + 1;
        const p3 = (i + 1) * (segments + 1) + j;
        const p4 = p3 + 1;

        indices.push(p1, p3, p2);
        indices.push(p2, p3, p4);
      }
    }

    geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geom.setIndex(indices);
    geom.computeVertexNormals();
    return geom;
  }, [a, radius]);

  // Generate 2D/3D Parabola Curve Points
  const curveVectorPoints = useMemo(() => {
    const points: [number, number, number][] = [];
    const steps = 100;
    for (let i = -steps; i <= steps; i++) {
      const x = (i / steps) * radius;
      const y = a * x * x;
      points.push([x, y, 0]);
    }
    return points;
  }, [a, radius]);

  return (
    <group position={[0, 0, 0]}>
      {/* 3D Paraboloid Surface */}
      <mesh geometry={geometry}>
        <meshStandardMaterial
          color={displayOptions.modelColor || "#6366f1"}
          roughness={0.2}
          metalness={0.1}
          transparent={displayOptions.transparentSolid || true}
          opacity={displayOptions.solidOpacity || 0.7}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Wireframe overlay */}
      {displayOptions.showWireframe && (
        <mesh geometry={geometry}>
          <meshBasicMaterial color="#a5b4fc" wireframe />
        </mesh>
      )}

      {/* Highlighted Parabola Curve Line */}
      <Line points={curveVectorPoints} color="#f59e0b" lineWidth={3} />

      {/* Vertex Point at Origin (0,0,0) */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial color="#ef4444" emissive="#f87171" emissiveIntensity={0.5} />
      </mesh>

      {/* Labels */}
      {displayOptions.showLabels && (
        <>
          <Html position={[0, -0.3, 0]} center>
            <div className="bg-slate-900/90 text-amber-400 font-mono text-xs px-2 py-0.5 rounded border border-amber-500/40 shadow-lg pointer-events-none">
              Đỉnh O(0,0)
            </div>
          </Html>

          <Html position={[radius * 0.7, a * (radius * 0.7) ** 2, 0]} center>
            <div className="bg-indigo-950/90 text-indigo-200 font-mono text-xs px-2 py-0.5 rounded border border-indigo-400/40 shadow-lg pointer-events-none">
              y = {a}x²
            </div>
          </Html>
        </>
      )}
    </group>
  );
};
