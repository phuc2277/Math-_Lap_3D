import React, { useMemo } from 'react';
import * as THREE from 'three';
import { ModelParams, DisplayOptions } from '../../types/geometry';
import { DimensionLine, Label3D } from '../geometry/3DHelpers';

interface ConeUnfoldingProps {
  params: ModelParams;
  progress: number; // 0 to 1
  displayOptions?: DisplayOptions;
}

export const ConeUnfolding: React.FC<ConeUnfoldingProps> = ({ params, progress, displayOptions }) => {
  const showLabels = displayOptions?.showLabels ?? true;
  const r = params.r ?? 3;
  const h = params.h ?? 5;
  const l = Math.sqrt(r * r + h * h);

  // Sector angle in radians: theta = 2 * PI * (r / l)
  const sectorAngleRad = (2 * Math.PI * r) / l;
  const sectorAngleDeg = (sectorAngleRad * 180) / Math.PI;

  const isNearlyFlat = progress > 0.95;

  // 1. Cone 3D Geometry (for progress < 0.95)
  const thetaLength = Math.max(0.01, (1 - progress) * Math.PI * 2);
  const coneGeo = useMemo(() => {
    return new THREE.ConeGeometry(r, h, 64, 1, true, -thetaLength / 2, thetaLength);
  }, [r, h, thetaLength]);

  // 2. Circular sector shape for 2D flat state
  const sectorGeo = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.absarc(0, 0, l, -sectorAngleRad / 2, sectorAngleRad / 2, false);
    shape.lineTo(0, 0);
    return new THREE.ShapeGeometry(shape, 64);
  }, [l, sectorAngleRad]);

  return (
    <group position={[0, h / 2, 0]}>
      {/* LATERAL SURFACE (CONE 3D TO SECTOR 2D) */}
      {!isNearlyFlat ? (
        <group>
          <mesh geometry={coneGeo}>
            <meshStandardMaterial
              color="#a855f7"
              side={THREE.DoubleSide}
              roughness={0.2}
              metalness={0.1}
              transparent
              opacity={0.85}
            />
          </mesh>
          <lineSegments>
            <wireframeGeometry args={[coneGeo]} />
            <lineBasicMaterial color="#f3e8ff" linewidth={1} opacity={0.4} transparent />
          </lineSegments>
        </group>
      ) : (
        /* Flat 2D Sector */
        <group>
          <mesh geometry={sectorGeo} rotation={[-Math.PI / 2, 0, 0]}>
            <meshStandardMaterial
              color="#a855f7"
              side={THREE.DoubleSide}
              roughness={0.2}
              transparent
              opacity={0.9}
            />
          </mesh>
          <lineSegments rotation={[-Math.PI / 2, 0, 0]}>
            <wireframeGeometry args={[sectorGeo]} />
            <lineBasicMaterial color="#ffffff" linewidth={2} />
          </lineSegments>

          {/* Sector Center Apex S */}
          <mesh position={[0, 0.1, 0]}>
            <sphereGeometry args={[0.1, 16, 16]} />
            <meshBasicMaterial color="#f59e0b" />
          </mesh>
          {showLabels && (
            <>
              <Label3D position={[0, 0.3, 0]} text="Đỉnh S" color="text-amber-400" />

              {/* Slant Height l Label */}
              <DimensionLine
                start={[0, 0.1, 0]}
                end={[l * Math.cos(sectorAngleRad / 2), 0.1, l * Math.sin(sectorAngleRad / 2)]}
                color="#ec4899"
                label={`Bán kính quạt = Đường sinh l = ${l.toFixed(2)} cm`}
                subtext={`Góc quạt α = ${sectorAngleDeg.toFixed(1)}°`}
              />

              <Label3D
                position={[l / 2, 0.1, 0]}
                text={`Mặt xung quanh (Hình quạt tròn)`}
                subtext={`S_xq = πrl = ${(Math.PI * r * l).toFixed(1)} cm²`}
                color="text-purple-300"
              />
            </>
          )}
        </group>
      )}

      {/* BASE CIRCLE (ATTACHED TO ARC AT FLAT STATE) */}
      <group
        position={[
          0,
          -h / 2 - (isNearlyFlat ? r : 0),
          isNearlyFlat ? l + r : 0,
        ]}
        rotation={[
          progress * (-Math.PI / 2),
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
            text={`Hình tròn đáy (r = ${r} cm)`}
            subtext={`S_đáy = πr² = ${(Math.PI * r * r).toFixed(1)} cm²`}
            color="text-rose-300"
          />
        )}
      </group>
    </group>
  );
};
