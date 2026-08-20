import React, { useMemo } from 'react';
import * as THREE from 'three';
import { ModelParams, DisplayOptions } from '../../types/geometry';
import { Label3D } from '../geometry/3DHelpers';

interface PrismQuadUnfoldingProps {
  params: ModelParams;
  progress: number; // 0 (3D block) to 1 (flattened 2D net)
  displayOptions?: DisplayOptions;
}

export const PrismQuadUnfolding: React.FC<PrismQuadUnfoldingProps> = ({
  params,
  progress,
  displayOptions,
}) => {
  const showLabels = displayOptions?.showLabels ?? true;
  const a = params.a ?? 6; // Đáy lớn hình thang
  const b = Math.min(params.b ?? 3, a - 0.2); // Đáy nhỏ hình thang
  const d = params.d ?? 4; // Chiều cao hình thang đáy
  const h = params.h ?? 5; // Chiều cao lăng trụ

  // Độ dài cạnh bên hình thang cân
  const c = Math.sqrt(Math.pow((a - b) / 2, 2) + d * d);

  // Góc gập: progress = 1 (mặt phẳng 0 rad), progress = 0 (gập 90 độ = PI/2)
  const angle = (1 - progress) * (Math.PI / 2);
  const borderColor = "#0284c7";
  const faceColor = "#0ea5e9";

  // Geometry hình thang cân (đáy lớn a, đáy nhỏ b, chiều cao d)
  const trapezoidGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const vertices = new Float32Array([
      -a / 2, 0, 0,
      a / 2, 0, 0,
      b / 2, d, 0,

      -a / 2, 0, 0,
      b / 2, d, 0,
      -b / 2, d, 0,
    ]);
    geo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geo.computeVertexNormals();
    return geo;
  }, [a, b, d]);

  const baseArea = ((a + b) * d) / 2;

  return (
    <group position={[0, -h / 2, 0]}>
      {/* 1. MẶT BÊN CHÍNH 1 (Mặt trung tâm: a x h - Đáy lớn) */}
      <group position={[0, h / 2, 0]}>
        <mesh>
          <planeGeometry args={[a, h]} />
          <meshStandardMaterial color={faceColor} transparent opacity={0.6} side={THREE.DoubleSide} />
        </mesh>
        <lineSegments>
          <wireframeGeometry args={[new THREE.PlaneGeometry(a, h)]} />
          <lineBasicMaterial color={borderColor} linewidth={3} />
        </lineSegments>
        {showLabels && (
          <Label3D
            position={[0, 0, 0.1]}
            text={`Mặt bên 1 (${a}×${h})`}
            subtext={`S = ${(a * h).toFixed(1)} cm²`}
            color="text-sky-300"
          />
        )}

        {/* MẶT ĐÁY DƯỚI (Hình thang cân, nối từ cạnh dưới của mặt 1, y = -h/2) */}
        <group position={[0, -h / 2, 0]} rotation={[-angle, 0, 0]}>
          <group rotation={[Math.PI, 0, 0]}>
            <mesh geometry={trapezoidGeo}>
              <meshStandardMaterial color="#f59e0b" transparent opacity={0.7} side={THREE.DoubleSide} />
            </mesh>
            <lineSegments>
              <wireframeGeometry args={[trapezoidGeo]} />
              <lineBasicMaterial color="#d97706" linewidth={3} />
            </lineSegments>
            {showLabels && (
              <Label3D
                position={[0, d / 2, 0.1]}
                text={`Đáy dưới (Hình thang)`}
                subtext={`S_đáy = ${baseArea.toFixed(1)} cm²`}
                color="text-amber-300"
              />
            )}
          </group>
        </group>

        {/* MẶT ĐÁY TRÊN (Hình thang cân, nối từ cạnh trên của mặt 1, y = +h/2) */}
        <group position={[0, h / 2, 0]} rotation={[angle, 0, 0]}>
          <mesh geometry={trapezoidGeo}>
            <meshStandardMaterial color="#f59e0b" transparent opacity={0.7} side={THREE.DoubleSide} />
          </mesh>
          <lineSegments>
            <wireframeGeometry args={[trapezoidGeo]} />
            <lineBasicMaterial color="#d97706" linewidth={3} />
          </lineSegments>
          {showLabels && (
            <Label3D
              position={[0, d / 2, 0.1]}
              text={`Đáy trên (Hình thang)`}
              subtext={`S_đáy = ${baseArea.toFixed(1)} cm²`}
              color="text-amber-300"
            />
          )}
        </group>

        {/* 2. MẶT BÊN 2 (Bên phải: c x h, gập ở x = +a/2) */}
        <group position={[a / 2, 0, 0]} rotation={[0, -angle, 0]}>
          <group position={[c / 2, 0, 0]}>
            <mesh>
              <planeGeometry args={[c, h]} />
              <meshStandardMaterial color={faceColor} transparent opacity={0.6} side={THREE.DoubleSide} />
            </mesh>
            <lineSegments>
              <wireframeGeometry args={[new THREE.PlaneGeometry(c, h)]} />
              <lineBasicMaterial color={borderColor} linewidth={3} />
            </lineSegments>
            {showLabels && (
              <Label3D
                position={[0, 0, 0.1]}
                text={`Mặt bên 2 (${c.toFixed(1)}×${h})`}
                subtext={`S = ${(c * h).toFixed(1)} cm²`}
                color="text-sky-300"
              />
            )}

            {/* 3. MẶT BÊN 3 (Bên phải tiếp: b x h - Đáy nhỏ, gập từ mặt bên 2 ở x = +c/2) */}
            <group position={[c / 2, 0, 0]} rotation={[0, -angle, 0]}>
              <group position={[b / 2, 0, 0]}>
                <mesh>
                  <planeGeometry args={[b, h]} />
                  <meshStandardMaterial color={faceColor} transparent opacity={0.6} side={THREE.DoubleSide} />
                </mesh>
                <lineSegments>
                  <wireframeGeometry args={[new THREE.PlaneGeometry(b, h)]} />
                  <lineBasicMaterial color={borderColor} linewidth={3} />
                </lineSegments>
                {showLabels && (
                  <Label3D
                    position={[0, 0, 0.1]}
                    text={`Mặt bên 3 (${b}×${h})`}
                    subtext={`S = ${(b * h).toFixed(1)} cm²`}
                    color="text-sky-300"
                  />
                )}

                {/* 4. MẶT BÊN 4 (Cuối cùng: c x h, gập từ mặt bên 3 ở x = +b/2) */}
                <group position={[b / 2, 0, 0]} rotation={[0, -angle, 0]}>
                  <group position={[c / 2, 0, 0]}>
                    <mesh>
                      <planeGeometry args={[c, h]} />
                      <meshStandardMaterial color={faceColor} transparent opacity={0.6} side={THREE.DoubleSide} />
                    </mesh>
                    <lineSegments>
                      <wireframeGeometry args={[new THREE.PlaneGeometry(c, h)]} />
                      <lineBasicMaterial color={borderColor} linewidth={3} />
                    </lineSegments>
                    {showLabels && (
                      <Label3D
                        position={[0, 0, 0.1]}
                        text={`Mặt bên 4 (${c.toFixed(1)}×${h})`}
                        subtext={`S = ${(c * h).toFixed(1)} cm²`}
                        color="text-sky-300"
                      />
                    )}
                  </group>
                </group>
              </group>
            </group>
          </group>
        </group>
      </group>
    </group>
  );
};
