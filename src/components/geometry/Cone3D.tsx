import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Line } from '@react-three/drei';
import { ModelParams, DisplayOptions } from '../../types/geometry';
import { DimensionLine, Label3D } from './3DHelpers';

interface Cone3DProps {
  params: ModelParams;
  displayOptions: DisplayOptions;
}

export const Cone3D: React.FC<Cone3DProps> = ({ params, displayOptions }) => {
  const r = params.r ?? 3; // Radius
  const h = params.h ?? 5; // Height
  const l = useMemo(() => Math.sqrt(r * r + h * h), [r, h]); // Slant height

  const segments = displayOptions.performanceMode ? 24 : 64;
  const coneGeo = useMemo(() => new THREE.ConeGeometry(r, h, segments), [r, h, segments]);
  const edgesGeo = useMemo(() => new THREE.EdgesGeometry(coneGeo), [coneGeo]);

  const {
    showRadius,
    showHeight,
    showSlantHeight,
    showDimensions,
    showLabels,
    showWireframe,
    transparentSolid,
    solidOpacity,
    showDiagonals,
  } = displayOptions;

  const isDiagonalsEnabled = showDiagonals ?? true;
  const halfH = h / 2;

  const S: [number, number, number] = [0, halfH, 0];
  const O: [number, number, number] = [0, -halfH, 0];
  const A: [number, number, number] = [-r, -halfH, 0];
  const B: [number, number, number] = [r, -halfH, 0];

  return (
    <group position={[0, halfH, 0]}>
      {/* Main Cone Mesh */}
      <mesh geometry={coneGeo}>
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

      {/* Edges / Wireframe */}
      {(showWireframe || transparentSolid) && (
        <lineSegments geometry={edgesGeo}>
          <lineBasicMaterial color="#fde68a" linewidth={2} />
        </lineSegments>
      )}

      {/* Axial Triangle Section (Tam giác thiết diện qua trục SAB) */}
      {isDiagonalsEnabled && (
        <group>
          {/* Slant Height 1 SA: Đậm nét, màu tím neon */}
          <Line points={[S, A]} color="#a855f7" lineWidth={5} />

          {/* Slant Height 2 SB: Đậm nét, màu tím neon */}
          <Line points={[S, B]} color="#a855f7" lineWidth={5} />

          {/* Base Diameter AB: Đậm nét, màu xanh lam */}
          <Line points={[A, B]} color="#06b6d4" lineWidth={4} />

          {/* Axis / Height Line SO */}
          <Line points={[S, O]} color="#10b981" lineWidth={4.5} dashed dashSize={0.25} gapSize={0.12} />

          {/* Glowing Vertex Spheres */}
          <mesh position={A}>
            <sphereGeometry args={[0.12, 16, 16]} />
            <meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={0.4} />
          </mesh>
          <mesh position={B}>
            <sphereGeometry args={[0.12, 16, 16]} />
            <meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={0.4} />
          </mesh>

          {/* Section Badges */}
          {showDimensions && showLabels && (
            <Label3D
              position={[0, 0, 0]}
              text={`Đường kính đáy 2r = ${(2 * r).toFixed(1)} cm | Đường sinh l = ${l.toFixed(2)} cm`}
              subtext="Thiết diện qua trục là tam giác cân SAB"
              color="text-amber-300"
              badgeBg="bg-amber-950/95 border-amber-500 shadow-xl"
            />
          )}
        </group>
      )}

      {/* Apex S */}
      <mesh position={S}>
        <sphereGeometry args={[0.14, 20, 20]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.5} />
      </mesh>
      {showLabels && (
        <Label3D position={[0, halfH + 0.35, 0]} text="S" subtext="Đỉnh hình nón" color="text-red-400" />
      )}

      {/* Base Center O */}
      <mesh position={O}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={0.4} />
      </mesh>
      {showLabels && (
        <Label3D position={[0, -halfH - 0.3, 0]} text="O" subtext="Tâm đáy" color="text-emerald-400" />
      )}

      {/* Height line h (O -> S) */}
      {(showHeight || showDimensions) && !isDiagonalsEnabled && (
        <DimensionLine
          start={O}
          end={S}
          color="#10b981"
          label={showLabels ? `h = ${h} cm` : undefined}
          subtext="Chiều cao"
        />
      )}

      {/* Radius line r */}
      {(showRadius || showDimensions) && (
        <DimensionLine
          start={O}
          end={[r, -halfH, 0]}
          color="#38bdf8"
          label={showLabels ? `r = ${r} cm` : undefined}
          subtext="Bán kính đáy"
        />
      )}

      {/* Slant Height line l */}
      {(showSlantHeight || showDimensions) && !isDiagonalsEnabled && (
        <DimensionLine
          start={[r, -halfH, 0]}
          end={S}
          color="#a855f7"
          label={showLabels ? `l = ${l.toFixed(2)} cm` : undefined}
          subtext="Đường sinh"
        />
      )}
    </group>
  );
};

