import React from 'react';
import * as THREE from 'three';
import { ModelType, ModelParams, SectionPlaneParams, DisplayOptions } from '../../types/geometry';

interface SectionPlane3DProps {
  modelType: ModelType;
  params: ModelParams;
  sectionParams: SectionPlaneParams;
  displayOptions?: DisplayOptions;
}

export const SectionPlane3D: React.FC<SectionPlane3DProps> = ({
  modelType,
  params,
  sectionParams,
}) => {
  if (!sectionParams || !sectionParams.enabled) return null;

  const { position = 0, orientation = 'horizontal', showSectionFace = true } = sectionParams;

  // 1. CYLINDER (Hình Trụ)
  if (modelType === 'cylinder') {
    const r = params.r ?? 3;
    const h = params.h ?? 5;
    const planeY = (position * h) / 2; // -h/2 to +h/2 from center
    const yCut = h / 2 + planeY;

    if (orientation === 'horizontal') {
      const planeSize = r * 2.8;
      return (
        <group position={[0, yCut, 0]}>
          {/* Sliced Cutting Plane Overlay Quad */}
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[planeSize, planeSize]} />
            <meshBasicMaterial color="#f43f5e" transparent opacity={0.18} side={THREE.DoubleSide} />
          </mesh>
          <lineSegments rotation={[-Math.PI / 2, 0, 0]}>
            <edgesGeometry args={[new THREE.PlaneGeometry(planeSize, planeSize)]} />
            <lineBasicMaterial color="#f43f5e" transparent opacity={0.6} />
          </lineSegments>

          {/* Sliced Circular Section Face */}
          {showSectionFace && (
            <>
              <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[r, 64]} />
                <meshStandardMaterial
                  color="#f43f5e"
                  emissive="#f43f5e"
                  emissiveIntensity={0.3}
                  roughness={0.2}
                  transparent
                  opacity={0.85}
                  side={THREE.DoubleSide}
                />
              </mesh>
              {/* Highlighted Boundary Ring */}
              <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[r - 0.04, r + 0.04, 64]} />
                <meshBasicMaterial color="#ffffff" side={THREE.DoubleSide} />
              </mesh>
            </>
          )}
        </group>
      );
    } else {
      // Vertical section plane
      const offsetZ = position * (r * 0.85);
      const d = Math.abs(offsetZ);
      const rectWidth = 2 * Math.sqrt(Math.max(0, r * r - d * d));

      return (
        <group position={[0, h / 2, offsetZ]}>
          {/* Vertical Cutting Plane Overlay */}
          <mesh rotation={[0, 0, 0]}>
            <planeGeometry args={[r * 2.8, h * 1.3]} />
            <meshBasicMaterial color="#a855f7" transparent opacity={0.18} side={THREE.DoubleSide} />
          </mesh>

          {showSectionFace && rectWidth > 0 && (
            <>
              <mesh rotation={[0, 0, 0]}>
                <planeGeometry args={[rectWidth, h]} />
                <meshStandardMaterial
                  color="#a855f7"
                  emissive="#a855f7"
                  emissiveIntensity={0.3}
                  roughness={0.2}
                  transparent
                  opacity={0.85}
                  side={THREE.DoubleSide}
                />
              </mesh>
              <lineSegments rotation={[0, 0, 0]}>
                <edgesGeometry args={[new THREE.PlaneGeometry(rectWidth, h)]} />
                <lineBasicMaterial color="#ffffff" linewidth={2} />
              </lineSegments>
            </>
          )}
        </group>
      );
    }
  }

  // 2. CONE (Hình Nón)
  if (modelType === 'cone') {
    const r = params.r ?? 3;
    const h = params.h ?? 5;

    if (orientation === 'horizontal') {
      // Height of cut plane from base
      const yCut = Math.max(0.1, Math.min(h - 0.1, h / 2 + (position * h) / 2));
      const cutR = Math.max(0.01, r * (1 - yCut / h));
      const planeSize = r * 2.8;

      return (
        <group position={[0, yCut, 0]}>
          {/* Cutting Plane Grid */}
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[planeSize, planeSize]} />
            <meshBasicMaterial color="#f43f5e" transparent opacity={0.18} side={THREE.DoubleSide} />
          </mesh>
          <lineSegments rotation={[-Math.PI / 2, 0, 0]}>
            <edgesGeometry args={[new THREE.PlaneGeometry(planeSize, planeSize)]} />
            <lineBasicMaterial color="#f43f5e" transparent opacity={0.6} />
          </lineSegments>

          {/* Circle Section Face */}
          {showSectionFace && cutR > 0 && (
            <>
              <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[cutR, 64]} />
                <meshStandardMaterial
                  color="#f43f5e"
                  emissive="#f43f5e"
                  emissiveIntensity={0.3}
                  transparent
                  opacity={0.85}
                  side={THREE.DoubleSide}
                />
              </mesh>
              <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[Math.max(0, cutR - 0.04), cutR + 0.04, 64]} />
                <meshBasicMaterial color="#ffffff" side={THREE.DoubleSide} />
              </mesh>
            </>
          )}
        </group>
      );
    } else {
      // Vertical plane cut passing through cone apex
      const offsetZ = position * (r * 0.8);
      const d = Math.abs(offsetZ);
      const baseWidth = 2 * Math.sqrt(Math.max(0, r * r - d * d));

      // Triangle geometry for cross-section
      const triangleShape = new THREE.Shape();
      triangleShape.moveTo(-baseWidth / 2, 0);
      triangleShape.lineTo(baseWidth / 2, 0);
      triangleShape.lineTo(0, h);
      triangleShape.closePath();

      return (
        <group position={[0, 0, offsetZ]}>
          <mesh rotation={[0, 0, 0]}>
            <planeGeometry args={[r * 2.8, h * 1.3]} />
            <meshBasicMaterial color="#a855f7" transparent opacity={0.18} side={THREE.DoubleSide} />
          </mesh>

          {showSectionFace && baseWidth > 0 && (
            <>
              <mesh rotation={[0, 0, 0]}>
                <shapeGeometry args={[triangleShape]} />
                <meshStandardMaterial
                  color="#a855f7"
                  emissive="#a855f7"
                  emissiveIntensity={0.3}
                  transparent
                  opacity={0.85}
                  side={THREE.DoubleSide}
                />
              </mesh>
            </>
          )}
        </group>
      );
    }
  }

  // 3. CUBOID & CUBE (Hình Hộp Chữ Nhật & Lập Phương)
  if (modelType === 'cuboid' || modelType === 'cube') {
    const a = params.a ?? (modelType === 'cube' ? 4 : 5);
    const b = modelType === 'cube' ? a : params.b ?? 3;
    const h = modelType === 'cube' ? a : params.h ?? 4;

    if (orientation === 'horizontal') {
      const planeY = (position * h) / 2;
      const yCut = h / 2 + planeY;
      const planeSizeX = a * 1.5;
      const planeSizeZ = b * 1.5;

      return (
        <group position={[0, yCut, 0]}>
          {/* Plane Overlay */}
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[planeSizeX, planeSizeZ]} />
            <meshBasicMaterial color="#10b981" transparent opacity={0.18} side={THREE.DoubleSide} />
          </mesh>
          <lineSegments rotation={[-Math.PI / 2, 0, 0]}>
            <edgesGeometry args={[new THREE.PlaneGeometry(planeSizeX, planeSizeZ)]} />
            <lineBasicMaterial color="#10b981" transparent opacity={0.6} />
          </lineSegments>

          {showSectionFace && (
            <>
              <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[a, b]} />
                <meshStandardMaterial
                  color="#10b981"
                  emissive="#10b981"
                  emissiveIntensity={0.3}
                  transparent
                  opacity={0.85}
                  side={THREE.DoubleSide}
                />
              </mesh>
              <lineSegments rotation={[-Math.PI / 2, 0, 0]}>
                <edgesGeometry args={[new THREE.PlaneGeometry(a, b)]} />
                <lineBasicMaterial color="#ffffff" linewidth={2} />
              </lineSegments>
            </>
          )}
        </group>
      );
    } else {
      // Vertical cut along X plane
      const planeX = (position * a) / 2;
      return (
        <group position={[planeX, h / 2, 0]}>
          <mesh rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[b * 1.5, h * 1.3]} />
            <meshBasicMaterial color="#38bdf8" transparent opacity={0.18} side={THREE.DoubleSide} />
          </mesh>

          {showSectionFace && (
            <>
              <mesh rotation={[0, Math.PI / 2, 0]}>
                <planeGeometry args={[b, h]} />
                <meshStandardMaterial
                  color="#38bdf8"
                  emissive="#38bdf8"
                  emissiveIntensity={0.3}
                  transparent
                  opacity={0.85}
                  side={THREE.DoubleSide}
                />
              </mesh>
              <lineSegments rotation={[0, Math.PI / 2, 0]}>
                <edgesGeometry args={[new THREE.PlaneGeometry(b, h)]} />
                <lineBasicMaterial color="#ffffff" linewidth={2} />
              </lineSegments>
            </>
          )}
        </group>
      );
    }
  }

  // 4. SPHERE (Hình Cầu)
  if (modelType === 'sphere') {
    const R = params.r ?? 4;
    const planeY = position * R * 0.88;
    const yCut = R + planeY;
    const d = Math.abs(planeY);
    const cutR = Math.sqrt(Math.max(0, R * R - d * d));
    const planeSize = R * 2.8;

    return (
      <group position={[0, yCut, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[planeSize, planeSize]} />
          <meshBasicMaterial color="#ec4899" transparent opacity={0.18} side={THREE.DoubleSide} />
        </mesh>
        <lineSegments rotation={[-Math.PI / 2, 0, 0]}>
          <edgesGeometry args={[new THREE.PlaneGeometry(planeSize, planeSize)]} />
          <lineBasicMaterial color="#ec4899" transparent opacity={0.6} />
        </lineSegments>

        {showSectionFace && cutR > 0 && (
          <>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[cutR, 64]} />
              <meshStandardMaterial
                color="#ec4899"
                emissive="#ec4899"
                emissiveIntensity={0.3}
                transparent
                opacity={0.85}
                side={THREE.DoubleSide}
              />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[Math.max(0, cutR - 0.04), cutR + 0.04, 64]} />
              <meshBasicMaterial color="#ffffff" side={THREE.DoubleSide} />
            </mesh>
          </>
        )}
      </group>
    );
  }

  // 5. PRISM (Hình Lăng Trụ Tam Giác)
  if (modelType === 'prism') {
    const a = params.a ?? 4; // Base width along X
    const b = params.b ?? 3; // Base depth along Z
    const h = params.h ?? 5; // Height along Y

    if (orientation === 'horizontal') {
      const planeY = (position * h) / 2;
      const yCut = h / 2 + planeY;
      const planeSize = Math.max(a, b) * 2.2;

      // Base triangle in XZ plane: (-a/2, -b/2), (a/2, -b/2), (0, b/2)
      const triShape = new THREE.Shape();
      triShape.moveTo(-a / 2, -b / 2);
      triShape.lineTo(a / 2, -b / 2);
      triShape.lineTo(0, b / 2);
      triShape.closePath();

      return (
        <group position={[0, yCut, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[planeSize, planeSize]} />
            <meshBasicMaterial color="#f59e0b" transparent opacity={0.18} side={THREE.DoubleSide} />
          </mesh>

          {showSectionFace && (
            <>
              <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <shapeGeometry args={[triShape]} />
                <meshStandardMaterial
                  color="#f59e0b"
                  emissive="#f59e0b"
                  emissiveIntensity={0.3}
                  transparent
                  opacity={0.85}
                  side={THREE.DoubleSide}
                />
              </mesh>
              <lineSegments rotation={[-Math.PI / 2, 0, 0]}>
                <edgesGeometry args={[new THREE.ShapeGeometry(triShape)]} />
                <lineBasicMaterial color="#ffffff" linewidth={2} />
              </lineSegments>
            </>
          )}
        </group>
      );
    } else {
      // Vertical cut parallel to front face: z = offsetZ
      const offsetZ = position * (b / 2 * 0.88);
      const cutWidth = Math.max(0.01, a * (0.5 - offsetZ / b));

      return (
        <group position={[0, h / 2, offsetZ]}>
          <mesh rotation={[0, 0, 0]}>
            <planeGeometry args={[a * 1.8, h * 1.3]} />
            <meshBasicMaterial color="#f59e0b" transparent opacity={0.18} side={THREE.DoubleSide} />
          </mesh>

          {showSectionFace && cutWidth > 0 && (
            <>
              <mesh rotation={[0, 0, 0]}>
                <planeGeometry args={[cutWidth, h]} />
                <meshStandardMaterial
                  color="#f59e0b"
                  emissive="#f59e0b"
                  emissiveIntensity={0.3}
                  transparent
                  opacity={0.85}
                  side={THREE.DoubleSide}
                />
              </mesh>
              <lineSegments rotation={[0, 0, 0]}>
                <edgesGeometry args={[new THREE.PlaneGeometry(cutWidth, h)]} />
                <lineBasicMaterial color="#ffffff" linewidth={2} />
              </lineSegments>
            </>
          )}
        </group>
      );
    }
  }

  // 5b. PRISM QUAD (Hình Lăng Trụ Đứng Tứ Giác - Đáy Hình Thang Cân)
  if (modelType === 'prism_quad') {
    const a = params.a ?? 6; // Đáy lớn
    const b = Math.min(params.b ?? 3, a - 0.1); // Đáy nhỏ
    const d = params.d ?? 4; // Chiều cao đáy hình thang
    const h = params.h ?? 5; // Chiều cao lăng trụ

    if (orientation === 'horizontal') {
      const planeY = (position * h) / 2;
      const yCut = h / 2 + planeY;
      const planeSize = Math.max(a, d) * 2.2;

      // Base trapezoid in XZ plane:
      // Front large base a at z = -d/2: (-a/2, -d/2) to (a/2, -d/2)
      // Back small base b at z = +d/2: (b/2, d/2) to (-b/2, d/2)
      const quadShape = new THREE.Shape();
      quadShape.moveTo(-a / 2, -d / 2);
      quadShape.lineTo(a / 2, -d / 2);
      quadShape.lineTo(b / 2, d / 2);
      quadShape.lineTo(-b / 2, d / 2);
      quadShape.closePath();

      return (
        <group position={[0, yCut, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[planeSize, planeSize]} />
            <meshBasicMaterial color="#f59e0b" transparent opacity={0.18} side={THREE.DoubleSide} />
          </mesh>

          {showSectionFace && (
            <>
              <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <shapeGeometry args={[quadShape]} />
                <meshStandardMaterial
                  color="#f59e0b"
                  emissive="#f59e0b"
                  emissiveIntensity={0.3}
                  transparent
                  opacity={0.85}
                  side={THREE.DoubleSide}
                />
              </mesh>
              <lineSegments rotation={[-Math.PI / 2, 0, 0]}>
                <edgesGeometry args={[new THREE.ShapeGeometry(quadShape)]} />
                <lineBasicMaterial color="#ffffff" linewidth={2} />
              </lineSegments>
            </>
          )}
        </group>
      );
    } else {
      // Vertical cut parallel to bases edges: z = offsetZ
      const offsetZ = position * (d / 2 * 0.88);
      const t = (offsetZ + d / 2) / d; // 0 (front) to 1 (back)
      const cutWidth = Math.max(0.01, a + (b - a) * t);

      return (
        <group position={[0, h / 2, offsetZ]}>
          <mesh rotation={[0, 0, 0]}>
            <planeGeometry args={[a * 1.8, h * 1.3]} />
            <meshBasicMaterial color="#f59e0b" transparent opacity={0.18} side={THREE.DoubleSide} />
          </mesh>

          {showSectionFace && cutWidth > 0 && (
            <>
              <mesh rotation={[0, 0, 0]}>
                <planeGeometry args={[cutWidth, h]} />
                <meshStandardMaterial
                  color="#f59e0b"
                  emissive="#f59e0b"
                  emissiveIntensity={0.3}
                  transparent
                  opacity={0.85}
                  side={THREE.DoubleSide}
                />
              </mesh>
              <lineSegments rotation={[0, 0, 0]}>
                <edgesGeometry args={[new THREE.PlaneGeometry(cutWidth, h)]} />
                <lineBasicMaterial color="#ffffff" linewidth={2} />
              </lineSegments>
            </>
          )}
        </group>
      );
    }
  }

  // 6. PYRAMID (Hình Chóp Tứ Giác & Chóp Tam Giác)
  if (modelType === 'pyramid' || modelType === 'pyramid_triangular') {
    const a = params.a ?? 4;
    const h = params.h ?? 5;

    if (orientation === 'horizontal') {
      const yCut = Math.max(0.1, Math.min(h - 0.1, h / 2 + (position * h) / 2));
      const cutA = Math.max(0.01, a * (1 - yCut / h));
      const planeSize = a * 2.2;

      return (
        <group position={[0, yCut, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[planeSize, planeSize]} />
            <meshBasicMaterial color="#6366f1" transparent opacity={0.18} side={THREE.DoubleSide} />
          </mesh>

          {showSectionFace && cutA > 0 && (
            <>
              <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[cutA, cutA]} />
                <meshStandardMaterial
                  color="#6366f1"
                  emissive="#6366f1"
                  emissiveIntensity={0.3}
                  transparent
                  opacity={0.85}
                  side={THREE.DoubleSide}
                />
              </mesh>
              <lineSegments rotation={[-Math.PI / 2, 0, 0]}>
                <edgesGeometry args={[new THREE.PlaneGeometry(cutA, cutA)]} />
                <lineBasicMaterial color="#ffffff" linewidth={2} />
              </lineSegments>
            </>
          )}
        </group>
      );
    } else {
      // Vertical cut through apex
      const triangleShape = new THREE.Shape();
      triangleShape.moveTo(-a / 2, 0);
      triangleShape.lineTo(a / 2, 0);
      triangleShape.lineTo(0, h);
      triangleShape.closePath();

      return (
        <group position={[0, 0, 0]}>
          <mesh rotation={[0, 0, 0]}>
            <planeGeometry args={[a * 2.2, h * 1.3]} />
            <meshBasicMaterial color="#6366f1" transparent opacity={0.18} side={THREE.DoubleSide} />
          </mesh>

          {showSectionFace && (
            <mesh rotation={[0, 0, 0]}>
              <shapeGeometry args={[triangleShape]} />
              <meshStandardMaterial
                color="#6366f1"
                emissive="#6366f1"
                emissiveIntensity={0.3}
                transparent
                opacity={0.85}
                side={THREE.DoubleSide}
              />
            </mesh>
          )}
        </group>
      );
    }
  }

  // 7. PARABOL (Hình Paraboloid)
  if (modelType === 'parabol') {
    const r = params.r ?? 3;
    const h = params.h ?? 5;
    const yCut = Math.max(0.1, Math.min(h - 0.1, h / 2 + (position * h) / 2));
    const cutR = Math.max(0.01, r * Math.sqrt(yCut / h));
    const planeSize = r * 2.8;

    return (
      <group position={[0, yCut, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[planeSize, planeSize]} />
          <meshBasicMaterial color="#10b981" transparent opacity={0.18} side={THREE.DoubleSide} />
        </mesh>

        {showSectionFace && cutR > 0 && (
          <>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[cutR, 64]} />
              <meshStandardMaterial
                color="#10b981"
                emissive="#10b981"
                emissiveIntensity={0.3}
                transparent
                opacity={0.85}
                side={THREE.DoubleSide}
              />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[Math.max(0, cutR - 0.04), cutR + 0.04, 64]} />
              <meshBasicMaterial color="#ffffff" side={THREE.DoubleSide} />
            </mesh>
          </>
        )}
      </group>
    );
  }

  return null;
};



