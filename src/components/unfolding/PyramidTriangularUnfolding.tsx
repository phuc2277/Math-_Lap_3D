import React, { useMemo } from 'react';
import * as THREE from 'three';
import { ModelParams, DisplayOptions } from '../../types/geometry';
import { Label3D } from '../geometry/3DHelpers';

interface PyramidTriangularUnfoldingProps {
  params: ModelParams;
  progress: number; // 0 to 1
  displayOptions?: DisplayOptions;
}

export const PyramidTriangularUnfolding: React.FC<PyramidTriangularUnfoldingProps> = ({
  params,
  progress,
  displayOptions,
}) => {
  const showLabels = displayOptions?.showLabels ?? true;
  const a = params.a ?? 4; // Cạnh đáy tam giác đều
  const h = params.h ?? 5; // Chiều cao hình chóp

  const rIn = a / (2 * Math.sqrt(3)); // Bán kính đường tròn nội tiếp đáy tam giác đều
  const R = a / Math.sqrt(3); // Bán kính đường tròn ngoại tiếp đáy
  const d = Math.sqrt(h * h + rIn * rIn); // Trung đoạn (chiều cao mặt bên)

  // Góc nghiêng mặt bên ở trạng thái 3D
  const angle3D = Math.atan2(h, rIn);
  // Góc gập mặt bên khi mở phẳng: 0 khi progress=1 (mặt phẳng), (PI/2 - angle3D) khi progress=0
  const foldAngle = (1 - progress) * (Math.PI / 2 - (Math.PI / 2 - angle3D));

  // Geometry tam giác đều đáy (a, chiều cao hBase = a*sqrt(3)/2)
  const baseTriGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const hBase = (a * Math.sqrt(3)) / 2;
    const vertices = new Float32Array([
      0, hBase * (2 / 3), 0,                   // Đỉnh trên
      -a / 2, -hBase * (1 / 3), 0,             // Đỉnh trái
      a / 2, -hBase * (1 / 3), 0,              // Đỉnh phải
    ]);
    geo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geo.computeVertexNormals();
    return geo;
  }, [a]);

  // Geometry tam giác mặt bên (đáy a, chiều cao d)
  const sideTriGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const vertices = new Float32Array([
      0, d, 0,        // Đỉnh S
      -a / 2, 0, 0,   // Đáy trái
      a / 2, 0, 0,    // Đáy phải
    ]);
    geo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geo.computeVertexNormals();
    return geo;
  }, [a, d]);

  const hBase = (a * Math.sqrt(3)) / 2;
  const baseArea = (a * a * Math.sqrt(3)) / 4;
  const sideArea = 0.5 * a * d;

  return (
    <group position={[0, -h / 3, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      {/* 1. MẶT ĐÁY TAM GIÁC ĐỀU (Trung tâm) */}
      <group>
        <mesh geometry={baseTriGeo}>
          <meshStandardMaterial color="#f59e0b" transparent opacity={0.7} side={THREE.DoubleSide} />
        </mesh>
        <lineSegments>
          <wireframeGeometry args={[baseTriGeo]} />
          <lineBasicMaterial color="#d97706" linewidth={3} />
        </lineSegments>
        {showLabels && (
          <Label3D
            position={[0, 0, 0.1]}
            text={`Đáy tam giác đều (cạnh ${a})`}
            subtext={`S_đáy = ${baseArea.toFixed(1)} cm²`}
            color="text-amber-300"
          />
        )}
      </group>

      {/* 2. MẶT BÊN 1 (Gập ở cạnh đáy dưới: y = -hBase/3) */}
      <group position={[0, -hBase * (1 / 3), 0]} rotation={[-foldAngle, 0, 0]}>
        <group rotation={[0, 0, Math.PI]}>
          <mesh geometry={sideTriGeo}>
            <meshStandardMaterial color="#ec4899" transparent opacity={0.6} side={THREE.DoubleSide} />
          </mesh>
          <lineSegments>
            <wireframeGeometry args={[sideTriGeo]} />
            <lineBasicMaterial color="#be185d" linewidth={2.5} />
          </lineSegments>
          {showLabels && (
            <Label3D
              position={[0, d / 2, 0.1]}
              text="Mặt bên 1"
              subtext={`S = ${sideArea.toFixed(1)} cm²`}
              color="text-rose-300"
            />
          )}
        </group>
      </group>

      {/* 3. MẶT BÊN 2 (Gập ở cạnh bên trái) */}
      <group
        position={[-a / 4, hBase * (1 / 6), 0]}
        rotation={[0, 0, (2 * Math.PI) / 3]}
      >
        <group rotation={[-foldAngle, 0, 0]}>
          <group rotation={[0, 0, Math.PI]}>
            <mesh geometry={sideTriGeo}>
              <meshStandardMaterial color="#10b981" transparent opacity={0.6} side={THREE.DoubleSide} />
            </mesh>
            <lineSegments>
              <wireframeGeometry args={[sideTriGeo]} />
              <lineBasicMaterial color="#047857" linewidth={2.5} />
            </lineSegments>
            {showLabels && (
              <Label3D
                position={[0, d / 2, 0.1]}
                text="Mặt bên 2"
                subtext={`S = ${sideArea.toFixed(1)} cm²`}
                color="text-emerald-300"
              />
            )}
          </group>
        </group>
      </group>

      {/* 4. MẶT BÊN 3 (Gập ở cạnh bên phải) */}
      <group
        position={[a / 4, hBase * (1 / 6), 0]}
        rotation={[0, 0, -(2 * Math.PI) / 3]}
      >
        <group rotation={[-foldAngle, 0, 0]}>
          <group rotation={[0, 0, Math.PI]}>
            <mesh geometry={sideTriGeo}>
              <meshStandardMaterial color="#38bdf8" transparent opacity={0.6} side={THREE.DoubleSide} />
            </mesh>
            <lineSegments>
              <wireframeGeometry args={[sideTriGeo]} />
              <lineBasicMaterial color="#0284c7" linewidth={2.5} />
            </lineSegments>
            {showLabels && (
              <Label3D
                position={[0, d / 2, 0.1]}
                text="Mặt bên 3"
                subtext={`S = ${sideArea.toFixed(1)} cm²`}
                color="text-sky-300"
              />
            )}
          </group>
        </group>
      </group>
    </group>
  );
};
