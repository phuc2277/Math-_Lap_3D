import React from 'react';
import * as THREE from 'three';
import { ModelParams, DisplayOptions } from '../../types/geometry';
import { Label3D } from '../geometry/3DHelpers';

interface CubeUnfoldingProps {
  params: ModelParams;
  progress: number; // 0 (3D block) to 1 (flattened 2D net)
  displayOptions?: DisplayOptions;
}

export const CubeUnfolding: React.FC<CubeUnfoldingProps> = ({ params, progress, displayOptions }) => {
  const showLabels = displayOptions?.showLabels ?? true;
  // Dimension: a = cạnh hình lập phương
  const a = params.a ?? 4;

  // Angle theta in radians from 0 to PI/2 (90 degrees)
  const angle = progress * (Math.PI / 2);

  // Yellow color matching textbook image with red borders
  const colorYellow = '#fde047'; // Bright yellow
  const borderColor = '#dc2626'; // Red outline

  return (
    <group position={[0, 0, 0]}>
      {/* 1. MẶT TRUNG TÂM (ĐÁY) */}
      <group position={[0, 0, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[a, a]} />
          <meshStandardMaterial color={colorYellow} side={THREE.DoubleSide} roughness={0.3} transparent opacity={0.95} />
        </mesh>
        <lineSegments rotation={[-Math.PI / 2, 0, 0]}>
          <wireframeGeometry args={[new THREE.PlaneGeometry(a, a)]} />
          <lineBasicMaterial color={borderColor} linewidth={3} />
        </lineSegments>
        {showLabels && (
          <Label3D
            position={[0, 0.1, 0]}
            text={`Mặt 1 (Đáy) ${a}×${a}`}
            subtext={`S = ${(a * a).toFixed(1)} cm²`}
            color="text-amber-300"
          />
        )}
      </group>

      {/* 2. MẶT TRÊN (Hàng dọc - z = -a/2) */}
      <group position={[0, 0, -a / 2]} rotation={[-angle, 0, 0]}>
        <mesh position={[0, a / 2, 0]}>
          <planeGeometry args={[a, a]} />
          <meshStandardMaterial color={colorYellow} side={THREE.DoubleSide} roughness={0.3} transparent opacity={0.95} />
        </mesh>
        <lineSegments position={[0, a / 2, 0]}>
          <wireframeGeometry args={[new THREE.PlaneGeometry(a, a)]} />
          <lineBasicMaterial color={borderColor} linewidth={3} />
        </lineSegments>
        {showLabels && (
          <Label3D
            position={[0, a / 2, -0.1]}
            text={`Mặt 2 (${a}×${a})`}
            subtext={`S = ${(a * a).toFixed(1)} cm²`}
            color="text-amber-300"
          />
        )}
      </group>

      {/* 3. MẶT DƯỚI (Hàng dọc - z = +a/2) */}
      <group position={[0, 0, a / 2]} rotation={[angle, 0, 0]}>
        <mesh position={[0, a / 2, 0]}>
          <planeGeometry args={[a, a]} />
          <meshStandardMaterial color={colorYellow} side={THREE.DoubleSide} roughness={0.3} transparent opacity={0.95} />
        </mesh>
        <lineSegments position={[0, a / 2, 0]}>
          <wireframeGeometry args={[new THREE.PlaneGeometry(a, a)]} />
          <lineBasicMaterial color={borderColor} linewidth={3} />
        </lineSegments>
        {showLabels && (
          <Label3D
            position={[0, a / 2, 0.1]}
            text={`Mặt 3 (${a}×${a})`}
            subtext={`S = ${(a * a).toFixed(1)} cm²`}
            color="text-amber-300"
          />
        )}
      </group>

      {/* 4. MẶT TRÁI (Hàng ngang - x = -a/2) */}
      <group position={[-a / 2, 0, 0]} rotation={[0, 0, angle]}>
        <mesh position={[0, a / 2, 0]} rotation={[0, -Math.PI / 2, 0]}>
          <planeGeometry args={[a, a]} />
          <meshStandardMaterial color={colorYellow} side={THREE.DoubleSide} roughness={0.3} transparent opacity={0.95} />
        </mesh>
        <lineSegments position={[0, a / 2, 0]} rotation={[0, -Math.PI / 2, 0]}>
          <wireframeGeometry args={[new THREE.PlaneGeometry(a, a)]} />
          <lineBasicMaterial color={borderColor} linewidth={3} />
        </lineSegments>
        {showLabels && (
          <Label3D
            position={[-0.1, a / 2, 0]}
            text={`Mặt 4 (${a}×${a})`}
            subtext={`S = ${(a * a).toFixed(1)} cm²`}
            color="text-amber-300"
          />
        )}
      </group>

      {/* 5. MẶT PHẢI 1 (x = +a/2) */}
      <group position={[a / 2, 0, 0]} rotation={[0, 0, -angle]}>
        <mesh position={[0, a / 2, 0]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[a, a]} />
          <meshStandardMaterial color={colorYellow} side={THREE.DoubleSide} roughness={0.3} transparent opacity={0.95} />
        </mesh>
        <lineSegments position={[0, a / 2, 0]} rotation={[0, Math.PI / 2, 0]}>
          <wireframeGeometry args={[new THREE.PlaneGeometry(a, a)]} />
          <lineBasicMaterial color={borderColor} linewidth={3} />
        </lineSegments>
        {showLabels && (
          <Label3D
            position={[0.1, a / 2, 0]}
            text={`Mặt 5 (${a}×${a})`}
            subtext={`S = ${(a * a).toFixed(1)} cm²`}
            color="text-amber-300"
          />
        )}

        {/* 6. MẶT PHẢI 2 (Nối tiếp từ Mặt 5) */}
        <group position={[0, a, 0]} rotation={[0, 0, -(Math.PI / 2 - angle)]}>
          <mesh position={[0, a / 2, 0]} rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[a, a]} />
            <meshStandardMaterial color={colorYellow} side={THREE.DoubleSide} roughness={0.3} transparent opacity={0.95} />
          </mesh>
          <lineSegments position={[0, a / 2, 0]} rotation={[0, Math.PI / 2, 0]}>
            <wireframeGeometry args={[new THREE.PlaneGeometry(a, a)]} />
            <lineBasicMaterial color={borderColor} linewidth={3} />
          </lineSegments>
          {showLabels && (
            <Label3D
              position={[0.1, a / 2, 0]}
              text={`Mặt 6 (${a}×${a})`}
              subtext={`S = ${(a * a).toFixed(1)} cm²`}
              color="text-amber-300"
            />
          )}
        </group>
      </group>
    </group>
  );
};
