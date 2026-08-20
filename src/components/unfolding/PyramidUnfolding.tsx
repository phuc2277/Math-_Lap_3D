import React from 'react';
import * as THREE from 'three';
import { ModelParams, DisplayOptions } from '../../types/geometry';
import { Label3D } from '../geometry/3DHelpers';

interface PyramidUnfoldingProps {
  params: ModelParams;
  progress: number; // 0 to 1
  displayOptions?: DisplayOptions;
}

export const PyramidUnfolding: React.FC<PyramidUnfoldingProps> = ({ params, progress, displayOptions }) => {
  const showLabels = displayOptions?.showLabels ?? true;
  const a = params.a ?? 4; // Cạnh đáy a
  const b = params.b ?? 4; // Cạnh đáy b
  const h = params.h ?? 5; // Chiều cao khối chóp

  // Angle from 0 to 90 degrees (PI/2)
  const angle = progress * (Math.PI / 2);

  // Chiều cao mặt bên (đường cao của tam giác mặt bên): d = sqrt((b/2)^2 + h^2) đối với mặt trước/sau
  const hSideFront = Math.sqrt((b / 2) * (b / 2) + h * h);
  const hSideLeft = Math.sqrt((a / 2) * (a / 2) + h * h);

  const colorBase = '#f59e0b';   // Amber - Đáy hình vuông/chữ nhật
  const colorFront = '#f43f5e';  // Rose - Mặt tam giác trước
  const colorBack = '#10b981';   // Emerald - Mặt tam giác sau
  const colorLeft = '#38bdf8';   // Sky - Mặt tam giác trái
  const colorRight = '#a855f7';  // Purple - Mặt tam giác phải

  // Tạo geometry tam giác cho các mặt bên
  const createTriangleGeometry = (baseWidth: number, triHeight: number) => {
    const shape = new THREE.Shape();
    shape.moveTo(-baseWidth / 2, 0);
    shape.lineTo(baseWidth / 2, 0);
    shape.lineTo(0, triHeight);
    shape.closePath();
    return new THREE.ShapeGeometry(shape);
  };

  const frontTriGeo = createTriangleGeometry(a, hSideFront);
  const sideTriGeo = createTriangleGeometry(b, hSideLeft);

  return (
    <group position={[0, 0, 0]}>
      {/* 1. MẶT ĐÁY (Tứ giác cố định) */}
      <group position={[0, 0, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[a, b]} />
          <meshStandardMaterial color={colorBase} side={THREE.DoubleSide} roughness={0.3} transparent opacity={0.9} />
        </mesh>
        <lineSegments rotation={[-Math.PI / 2, 0, 0]}>
          <wireframeGeometry args={[new THREE.PlaneGeometry(a, b)]} />
          <lineBasicMaterial color="#ffffff" linewidth={2} />
        </lineSegments>
        {showLabels && (
          <Label3D
            position={[0, 0.1, 0]}
            text={`Mặt đáy S_đáy (${a}×${b})`}
            subtext={`Diện tích = ${(a * b).toFixed(1)} cm²`}
            color="text-amber-300"
          />
        )}
      </group>

      {/* 2. MẶT BÊN TRƯỚC (Hinged at z = +b/2) */}
      <group position={[0, 0, b / 2]} rotation={[angle, 0, 0]}>
        <mesh position={[0, 0, 0]}>
          <primitive object={frontTriGeo} />
          <meshStandardMaterial color={colorFront} side={THREE.DoubleSide} roughness={0.3} transparent opacity={0.9} />
        </mesh>
        <lineSegments>
          <wireframeGeometry args={[frontTriGeo]} />
          <lineBasicMaterial color="#ffffff" linewidth={2} />
        </lineSegments>
        {showLabels && (
          <Label3D
            position={[0, hSideFront / 2, 0.1]}
            text="Mặt bên trước S1"
            subtext={`S = ${(0.5 * a * hSideFront).toFixed(1)} cm²`}
            color="text-rose-300"
          />
        )}
      </group>

      {/* 3. MẶT BÊN SAU (Hinged at z = -b/2) */}
      <group position={[0, 0, -b / 2]} rotation={[-angle, 0, 0]}>
        <mesh position={[0, 0, 0]} rotation={[0, Math.PI, 0]}>
          <primitive object={frontTriGeo} />
          <meshStandardMaterial color={colorBack} side={THREE.DoubleSide} roughness={0.3} transparent opacity={0.9} />
        </mesh>
        <lineSegments rotation={[0, Math.PI, 0]}>
          <wireframeGeometry args={[frontTriGeo]} />
          <lineBasicMaterial color="#ffffff" linewidth={2} />
        </lineSegments>
        {showLabels && (
          <Label3D
            position={[0, hSideFront / 2, -0.1]}
            text="Mặt bên sau S2"
            subtext={`S = ${(0.5 * a * hSideFront).toFixed(1)} cm²`}
            color="text-emerald-300"
          />
        )}
      </group>

      {/* 4. MẶT BÊN TRÁI (Hinged at x = -a/2) */}
      <group position={[-a / 2, 0, 0]} rotation={[0, 0, angle]}>
        <mesh position={[0, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
          <primitive object={sideTriGeo} />
          <meshStandardMaterial color={colorLeft} side={THREE.DoubleSide} roughness={0.3} transparent opacity={0.9} />
        </mesh>
        <lineSegments rotation={[0, -Math.PI / 2, 0]}>
          <wireframeGeometry args={[sideTriGeo]} />
          <lineBasicMaterial color="#ffffff" linewidth={2} />
        </lineSegments>
        {showLabels && (
          <Label3D
            position={[-0.1, hSideLeft / 2, 0]}
            text="Mặt bên trái S3"
            subtext={`S = ${(0.5 * b * hSideLeft).toFixed(1)} cm²`}
            color="text-sky-300"
          />
        )}
      </group>

      {/* 5. MẶT BÊN PHẢI (Hinged at x = +a/2) */}
      <group position={[a / 2, 0, 0]} rotation={[0, 0, -angle]}>
        <mesh position={[0, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <primitive object={sideTriGeo} />
          <meshStandardMaterial color={colorRight} side={THREE.DoubleSide} roughness={0.3} transparent opacity={0.9} />
        </mesh>
        <lineSegments rotation={[0, Math.PI / 2, 0]}>
          <wireframeGeometry args={[sideTriGeo]} />
          <lineBasicMaterial color="#ffffff" linewidth={2} />
        </lineSegments>
        {showLabels && (
          <Label3D
            position={[0.1, hSideLeft / 2, 0]}
            text="Mặt bên phải S4"
            subtext={`S = ${(0.5 * b * hSideLeft).toFixed(1)} cm²`}
            color="text-purple-300"
          />
        )}
      </group>
    </group>
  );
};
