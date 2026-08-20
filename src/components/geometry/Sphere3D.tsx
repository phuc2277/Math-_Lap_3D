import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Line } from '@react-three/drei';
import { ModelParams, DisplayOptions } from '../../types/geometry';
import { DimensionLine, Label3D } from './3DHelpers';

interface Sphere3DProps {
  params: ModelParams;
  displayOptions: DisplayOptions;
}

export const Sphere3D: React.FC<Sphere3DProps> = ({ params, displayOptions }) => {
  const r = params.r ?? 4; // Radius

  const widthSegments = displayOptions.performanceMode ? 24 : 64;
  const heightSegments = displayOptions.performanceMode ? 16 : 32;
  const sphereGeo = useMemo(
    () => new THREE.SphereGeometry(r, widthSegments, heightSegments),
    [r, widthSegments, heightSegments]
  );
  const edgesGeo = useMemo(() => new THREE.WireframeGeometry(sphereGeo), [sphereGeo]);

  // Equatorial circle ring tuples for Drei Line (X-Z plane)
  const ringEquatorPoints = useMemo(() => {
    const pts: [number, number, number][] = [];
    const segments = displayOptions.performanceMode ? 24 : 64;
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      pts.push([r * Math.cos(theta), 0, r * Math.sin(theta)]);
    }
    return pts;
  }, [r, displayOptions.performanceMode]);

  // Meridian circle ring (X-Y plane)
  const ringMeridianPoints = useMemo(() => {
    const pts: [number, number, number][] = [];
    const segments = displayOptions.performanceMode ? 24 : 64;
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      pts.push([r * Math.cos(theta), r * Math.sin(theta), 0]);
    }
    return pts;
  }, [r, displayOptions.performanceMode]);

  const {
    showRadius,
    showDimensions,
    showLabels,
    showWireframe,
    transparentSolid,
    solidOpacity,
    showDiagonals,
  } = displayOptions;

  const isDiagonalsEnabled = showDiagonals ?? true;

  const A: [number, number, number] = [-r, 0, 0];
  const B: [number, number, number] = [r, 0, 0];
  const C: [number, number, number] = [0, -r, 0];
  const D: [number, number, number] = [0, r, 0];
  const O: [number, number, number] = [0, 0, 0];

  return (
    <group position={[0, r, 0]}>
      {/* Main Sphere Mesh */}
      <mesh geometry={sphereGeo}>
        <meshPhysicalMaterial
          color={displayOptions.modelColor || "#ec4899"}
          roughness={0.15}
          metalness={0.1}
          clearcoat={0.5}
          transmission={transparentSolid ? 0.7 : 0.0}
          opacity={transparentSolid ? solidOpacity : 0.88}
          transparent
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Wireframe Outline */}
      {(showWireframe || transparentSolid) && (
        <lineSegments geometry={edgesGeo}>
          <lineBasicMaterial color="#fbcfe8" linewidth={1} opacity={0.35} transparent />
        </lineSegments>
      )}

      {/* Great Circles (Đường tròn lớn xích đạo & kinh tuyến) */}
      <Line points={ringEquatorPoints} color="#38bdf8" lineWidth={3} />
      <Line points={ringMeridianPoints} color="#a855f7" lineWidth={2.5} dashed dashSize={0.25} gapSize={0.1} />

      {/* Diameters (Đường kính hình cầu d = 2R) */}
      {isDiagonalsEnabled && (
        <group>
          {/* Main Horizontal Diameter AB: Đậm nhất, màu vàng hổ phách */}
          <Line points={[A, B]} color="#fbbf24" lineWidth={5.5} />

          {/* Vertical Diameter CD: Đậm nét, màu xanh lá */}
          <Line points={[C, D]} color="#10b981" lineWidth={4} dashed dashSize={0.25} gapSize={0.1} />

          {/* Glowing Vertex Spheres */}
          <mesh position={A}>
            <sphereGeometry args={[0.13, 20, 20]} />
            <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.4} />
          </mesh>
          <mesh position={B}>
            <sphereGeometry args={[0.13, 20, 20]} />
            <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.4} />
          </mesh>
          <mesh position={C}>
            <sphereGeometry args={[0.11, 20, 20]} />
            <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={0.4} />
          </mesh>
          <mesh position={D}>
            <sphereGeometry args={[0.11, 20, 20]} />
            <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={0.4} />
          </mesh>

          {/* Vertex Labels */}
          {showLabels && (
            <>
              <Label3D position={[-r - 0.25, 0, 0]} text="A" color="text-amber-300" />
              <Label3D position={[r + 0.25, 0, 0]} text="B" color="text-amber-300" />
              <Label3D position={[0, -r - 0.25, 0]} text="S (Nam)" color="text-emerald-300" />
              <Label3D position={[0, r + 0.25, 0]} text="N (Bắc)" color="text-emerald-300" />
            </>
          )}

          {/* Diameter Badge */}
          {showDimensions && showLabels && (
            <Label3D
              position={[0, 0.4, 0]}
              text={`Đường kính d = ${(2 * r).toFixed(1)} cm`}
              subtext="d = 2R (AB)"
              color="text-amber-300"
              badgeBg="bg-amber-950/95 border-amber-500 shadow-xl ring-1 ring-amber-400/40"
            />
          )}
        </group>
      )}

      {/* Center Point O */}
      <mesh position={O}>
        <sphereGeometry args={[0.14, 20, 20]} />
        <meshStandardMaterial color="#f59e0b" emissive="#fbbf24" emissiveIntensity={0.6} />
      </mesh>
      {showLabels && (
        <Label3D position={[0, -0.35, 0]} text="O" subtext="Tâm hình cầu" color="text-amber-400" />
      )}

      {/* Radius line r */}
      {(showRadius || showDimensions) && !isDiagonalsEnabled && (
        <DimensionLine
          start={O}
          end={[r, 0, 0]}
          color="#38bdf8"
          label={showLabels ? `R = ${r} cm` : undefined}
          subtext="Bán kính hình cầu"
        />
      )}
    </group>
  );
};

