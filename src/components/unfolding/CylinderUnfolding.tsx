import React, { useMemo } from 'react';
import * as THREE from 'three';
import { ModelParams, DisplayOptions } from '../../types/geometry';
import { DimensionLine, Label3D } from '../geometry/3DHelpers';

interface CylinderUnfoldingProps {
  params: ModelParams;
  progress: number; // 0 (3D) to 1 (Flat 2D Net)
  displayOptions?: DisplayOptions;
}

export const CylinderUnfolding: React.FC<CylinderUnfoldingProps> = ({ params, progress, displayOptions }) => {
  const showLabels = displayOptions?.showLabels ?? true;
  const r = params.r ?? 3;
  const h = params.h ?? 5;
  const perimeter = 2 * Math.PI * r;

  // Unrolling angle: from full 3D cylinder (2*PI arc) to flat plane (0 arc)
  // At progress = 0: arcAngle = 2*PI (closed cylinder)
  // At progress = 1: arcAngle = 0.001 (flat rectangle)
  const thetaLength = Math.max(0.01, (1 - progress) * Math.PI * 2);
  const isNearlyFlat = progress > 0.95;

  // Cylinder surface mesh geometry
  const lateralGeo = useMemo(() => {
    // Height h, radius r, segments 64
    return new THREE.CylinderGeometry(r, r, h, 64, 1, true, -thetaLength / 2, thetaLength);
  }, [r, h, thetaLength]);

  // Flat rectangle mesh for fully unfolded state
  const flatRectWidth = perimeter * progress;

  // Hinged top/bottom circles translation positions
  const baseOffsetZ = (1 - progress) * 0 + progress * (r + h / 2);

  return (
    <group position={[0, h / 2, 0]}>
      {/* 1. LATERAL SURFACE (UNROLLING / RECTANGLE) */}
      {!isNearlyFlat ? (
        <group>
          <mesh geometry={lateralGeo}>
            <meshStandardMaterial
              color="#38bdf8"
              side={THREE.DoubleSide}
              roughness={0.2}
              metalness={0.1}
              transparent
              opacity={0.85}
            />
          </mesh>
          <lineSegments>
            <wireframeGeometry args={[lateralGeo]} />
            <lineBasicMaterial color="#bae6fd" linewidth={1} opacity={0.4} transparent />
          </lineSegments>
        </group>
      ) : (
        /* Flat 2D Rectangle (2PI*r x h) */
        <group>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[perimeter, h]} />
            <meshStandardMaterial
              color="#38bdf8"
              side={THREE.DoubleSide}
              roughness={0.2}
              transparent
              opacity={0.9}
            />
          </mesh>
          <lineSegments rotation={[-Math.PI / 2, 0, 0]}>
            <wireframeGeometry args={[new THREE.PlaneGeometry(perimeter, h)]} />
            <lineBasicMaterial color="#ffffff" linewidth={2} />
          </lineSegments>

          {/* Labels for Flat Rectangle */}
          {showLabels && (
            <>
              <Label3D
                position={[0, 0.1, 0]}
                text={`Mặt xung quanh (${perimeter.toFixed(2)} cm × ${h} cm)`}
                subtext={`S_xq = 2πrh = ${(perimeter * h).toFixed(1)} cm²`}
                color="text-sky-300"
              />

              <DimensionLine
                start={[-perimeter / 2, 0.1, -h / 2]}
                end={[perimeter / 2, 0.1, -h / 2]}
                color="#f59e0b"
                label={`Chu vi đáy: 2πr = ${perimeter.toFixed(2)} cm`}
                subtext="Chiều dài hình chữ nhật"
              />
            </>
          )}
        </group>
      )}

      {/* 2. BOTTOM BASE CIRCLE */}
      <group
        position={[0, -h / 2 - (isNearlyFlat ? r : 0), (1 - progress) * 0 + progress * 0]}
        rotation={[
          progress * (-Math.PI / 2) + (1 - progress) * 0,
          0,
          0,
        ]}
      >
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[r, 64]} />
          <meshStandardMaterial color="#f43f5e" side={THREE.DoubleSide} transparent opacity={0.9} />
        </mesh>
        <lineSegments rotation={[-Math.PI / 2, 0, 0]}>
          <wireframeGeometry args={[new THREE.CircleGeometry(r, 64)]} />
          <lineBasicMaterial color="#ffffff" linewidth={1.5} />
        </lineSegments>
        {showLabels && (
          <Label3D
            position={[0, 0.1, 0]}
            text={`Đáy 1 (r = ${r} cm)`}
            subtext={`S_đáy = πr² = ${(Math.PI * r * r).toFixed(1)} cm²`}
            color="text-rose-300"
          />
        )}
      </group>

      {/* 3. TOP BASE CIRCLE */}
      <group
        position={[0, h / 2 + (isNearlyFlat ? r : 0), 0]}
        rotation={[
          progress * (Math.PI / 2) + (1 - progress) * 0,
          0,
          0,
        ]}
      >
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[r, 64]} />
          <meshStandardMaterial color="#10b981" side={THREE.DoubleSide} transparent opacity={0.9} />
        </mesh>
        <lineSegments rotation={[-Math.PI / 2, 0, 0]}>
          <wireframeGeometry args={[new THREE.CircleGeometry(r, 64)]} />
          <lineBasicMaterial color="#ffffff" linewidth={1.5} />
        </lineSegments>
        {showLabels && (
          <Label3D
            position={[0, 0.1, 0]}
            text={`Đáy 2 (r = ${r} cm)`}
            subtext={`S_đáy = πr² = ${(Math.PI * r * r).toFixed(1)} cm²`}
            color="text-emerald-300"
          />
        )}
      </group>
    </group>
  );
};
