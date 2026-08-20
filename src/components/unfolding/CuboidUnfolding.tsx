import React from 'react';
import * as THREE from 'three';
import { ModelParams, DisplayOptions } from '../../types/geometry';
import { Label3D } from '../geometry/3DHelpers';

interface CuboidUnfoldingProps {
  params: ModelParams;
  progress: number; // 0 (3D block) to 1 (flattened 2D net)
  isCube?: boolean;
  displayOptions?: DisplayOptions;
}

export const CuboidUnfolding: React.FC<CuboidUnfoldingProps> = ({
  params,
  progress,
  isCube = false,
  displayOptions,
}) => {
  const showLabels = displayOptions?.showLabels ?? true;
  // Dimensions: l = chiều dài (a), w = chiều rộng (b), h = chiều cao (h)
  const l = params.a ?? (isCube ? 4 : 5);
  const w = isCube ? l : params.b ?? 3;
  const h = isCube ? l : params.h ?? 4;

  // Angle theta in radians from 0 to PI/2 (90 degrees)
  const angle = progress * (Math.PI / 2);

  // Colors matching the standard math textbook diagram:
  // Pink for l·w (mặt đáy), Blue for h·l (mặt bên trước/sau), Yellow/Orange for w·h (mặt bên trái/phải)
  const colorPink = '#ec4899';   // Pink/Magenta (mặt đáy l·w)
  const colorBlue = '#3b82f6';   // Blue (mặt bên h·l)
  const colorYellow = '#f59e0b'; // Amber/Yellow (mặt bên w·h)

  return (
    <group position={[0, 0, 0]}>
      {/* 1. MẶT ĐÁY TRUNG TÂM (l · w) - Cố định trên mặt phẳng y = 0 */}
      <group position={[0, 0, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[l, w]} />
          <meshStandardMaterial color={colorPink} side={THREE.DoubleSide} roughness={0.3} transparent opacity={0.9} />
        </mesh>
        <lineSegments rotation={[-Math.PI / 2, 0, 0]}>
          <wireframeGeometry args={[new THREE.PlaneGeometry(l, w)]} />
          <lineBasicMaterial color="#ffffff" linewidth={2} />
        </lineSegments>
        {showLabels && (
          <Label3D
            position={[0, 0.1, 0]}
            text={`mặt đáy l · w (${l}×${w})`}
            subtext={`S = ${(l * w).toFixed(1)} cm²`}
            color="text-pink-300"
          />
        )}
      </group>

      {/* 2. MẶT BÊN DƯỚI (h · l) - Gập từ cạnh z = +w/2 */}
      <group position={[0, 0, w / 2]} rotation={[angle, 0, 0]}>
        <mesh position={[0, h / 2, 0]}>
          <planeGeometry args={[l, h]} />
          <meshStandardMaterial color={colorBlue} side={THREE.DoubleSide} roughness={0.3} transparent opacity={0.9} />
        </mesh>
        <lineSegments position={[0, h / 2, 0]}>
          <wireframeGeometry args={[new THREE.PlaneGeometry(l, h)]} />
          <lineBasicMaterial color="#ffffff" linewidth={2} />
        </lineSegments>
        {showLabels && (
          <Label3D
            position={[0, h / 2, 0.1]}
            text={`mặt bên h · l (${h}×${l})`}
            subtext={`S = ${(h * l).toFixed(1)} cm²`}
            color="text-sky-300"
          />
        )}
      </group>

      {/* 3. MẶT BÊN TRÊN (h · l) - Gập từ cạnh z = -w/2 */}
      <group position={[0, 0, -w / 2]} rotation={[-angle, 0, 0]}>
        <mesh position={[0, h / 2, 0]}>
          <planeGeometry args={[l, h]} />
          <meshStandardMaterial color={colorBlue} side={THREE.DoubleSide} roughness={0.3} transparent opacity={0.9} />
        </mesh>
        <lineSegments position={[0, h / 2, 0]}>
          <wireframeGeometry args={[new THREE.PlaneGeometry(l, h)]} />
          <lineBasicMaterial color="#ffffff" linewidth={2} />
        </lineSegments>
        {showLabels && (
          <Label3D
            position={[0, h / 2, -0.1]}
            text={`mặt bên h · l (${h}×${l})`}
            subtext={`S = ${(h * l).toFixed(1)} cm²`}
            color="text-sky-300"
          />
        )}

        {/* 4. MẶT ĐÁY TRÊN CÙNG (l · w) - Gập nối tiếp từ cạnh ngoài của Mặt Bên Trên */}
        <group position={[0, h, 0]} rotation={[-(Math.PI / 2 - angle), 0, 0]}>
          <mesh position={[0, w / 2, 0]}>
            <planeGeometry args={[l, w]} />
            <meshStandardMaterial color={colorPink} side={THREE.DoubleSide} roughness={0.3} transparent opacity={0.9} />
          </mesh>
          <lineSegments position={[0, w / 2, 0]}>
            <wireframeGeometry args={[new THREE.PlaneGeometry(l, w)]} />
            <lineBasicMaterial color="#ffffff" linewidth={2} />
          </lineSegments>
          {showLabels && (
            <Label3D
              position={[0, w / 2, 0.1]}
              text={`mặt đáy l · w (${l}×${w})`}
              subtext={`S = ${(l * w).toFixed(1)} cm²`}
              color="text-pink-300"
            />
          )}
        </group>
      </group>

      {/* 5. MẶT BÊN TRÁI (w · h) - Gập từ cạnh trái x = -l/2 */}
      <group position={[-l / 2, 0, 0]} rotation={[0, 0, angle]}>
        <mesh position={[0, h / 2, 0]} rotation={[0, -Math.PI / 2, 0]}>
          <planeGeometry args={[w, h]} />
          <meshStandardMaterial color={colorYellow} side={THREE.DoubleSide} roughness={0.3} transparent opacity={0.9} />
        </mesh>
        <lineSegments position={[0, h / 2, 0]} rotation={[0, -Math.PI / 2, 0]}>
          <wireframeGeometry args={[new THREE.PlaneGeometry(w, h)]} />
          <lineBasicMaterial color="#ffffff" linewidth={2} />
        </lineSegments>
        {showLabels && (
          <Label3D
            position={[-0.1, h / 2, 0]}
            text={`mặt bên w · h (${w}×${h})`}
            subtext={`S = ${(w * h).toFixed(1)} cm²`}
            color="text-amber-300"
          />
        )}
      </group>

      {/* 6. MẶT BÊN PHẢI (w · h) - Gập từ cạnh phải x = +l/2 */}
      <group position={[l / 2, 0, 0]} rotation={[0, 0, -angle]}>
        <mesh position={[0, h / 2, 0]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[w, h]} />
          <meshStandardMaterial color={colorYellow} side={THREE.DoubleSide} roughness={0.3} transparent opacity={0.9} />
        </mesh>
        <lineSegments position={[0, h / 2, 0]} rotation={[0, Math.PI / 2, 0]}>
          <wireframeGeometry args={[new THREE.PlaneGeometry(w, h)]} />
          <lineBasicMaterial color="#ffffff" linewidth={2} />
        </lineSegments>
        {showLabels && (
          <Label3D
            position={[0.1, h / 2, 0]}
            text={`mặt bên w · h (${w}×${h})`}
            subtext={`S = ${(w * h).toFixed(1)} cm²`}
            color="text-amber-300"
          />
        )}
      </group>
    </group>
  );
};
