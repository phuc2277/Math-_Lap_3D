import React, { useMemo, useRef, useState, useEffect, useLayoutEffect, useCallback } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { ModelType, ModelParams, SectionPlaneParams, DisplayOptions } from '../../types/geometry';
import {
  createCuttingPlane,
  solveCrossSection,
  IntersectionResult,
} from './CrossSectionMath';
import { soundEffects } from '../../utils/audioEffects';

// Import base 3D solid renderers to render clipped halves
import { Cuboid3D } from '../geometry/Cuboid3D';
import { Cube3D } from '../geometry/Cube3D';
import { Cylinder3D } from '../geometry/Cylinder3D';
import { Cone3D } from '../geometry/Cone3D';
import { Sphere3D } from '../geometry/Sphere3D';
import { Prism3D } from '../geometry/Prism3D';
import { PrismQuad3D } from '../geometry/PrismQuad3D';
import { Pyramid3D } from '../geometry/Pyramid3D';
import { PyramidTriangular3D } from '../geometry/PyramidTriangular3D';

interface ClippedGroupProps {
  clipPlane: THREE.Plane;
  position?: [number, number, number];
  children: React.ReactNode;
  onPointerDown?: (e: any) => void;
  onPointerOver?: (e: any) => void;
  onPointerOut?: (e: any) => void;
}

const ClippedGroup: React.FC<ClippedGroupProps> = ({
  clipPlane,
  position = [0, 0, 0],
  children,
  onPointerDown,
  onPointerOver,
  onPointerOut,
}) => {
  const groupRef = useRef<THREE.Group>(null);

  useLayoutEffect(() => {
    if (!groupRef.current) return;
    groupRef.current.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.isMesh && mesh.material) {
        // Only apply clipping planes to solid meshes that are NOT explicitly exempt
        if (mesh.userData?.exemptFromClipping) return;

        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m) => {
            m.clippingPlanes = [clipPlane];
            m.clipShadows = true;
            m.needsUpdate = true;
          });
        } else {
          mesh.material.clippingPlanes = [clipPlane];
          mesh.material.clipShadows = true;
          mesh.material.needsUpdate = true;
        }
      }
    });
  }, [clipPlane, children]);

  useFrame(() => {
    if (!groupRef.current) return;
    groupRef.current.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.isMesh && mesh.material && !mesh.userData?.exemptFromClipping) {
        const mat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
        if (!mat.clippingPlanes || mat.clippingPlanes[0] !== clipPlane) {
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((m) => {
              m.clippingPlanes = [clipPlane];
              m.clipShadows = true;
            });
          } else {
            mesh.material.clippingPlanes = [clipPlane];
            mesh.material.clipShadows = true;
          }
        }
      }
    });
  });

  return (
    <group
      ref={groupRef}
      position={position}
      onPointerDown={onPointerDown}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
    >
      {children}
    </group>
  );
};

interface UniversalCrossSection3DProps {
  modelType: ModelType;
  params: ModelParams;
  sectionParams: SectionPlaneParams;
  displayOptions?: DisplayOptions;
  onSectionChange?: (updates: Partial<SectionPlaneParams>) => void;
  controlsRef?: React.RefObject<OrbitControlsImpl | null>;
}

export const UniversalCrossSection3D: React.FC<UniversalCrossSection3DProps> = ({
  modelType,
  params,
  sectionParams,
  displayOptions,
  onSectionChange,
  controlsRef,
}) => {
  const { gl, camera } = useThree();
  const [isDragging, setIsDragging] = useState(false);
  const [hoveredPart, setHoveredPart] = useState<'pos' | 'neg' | 'gizmo' | 'snapBtn' | null>(null);

  // References to keep drag calculations clean
  const dragInfoRef = useRef<{
    startX: number;
    startY: number;
    startSep: number;
    targetPart: 'pos' | 'neg' | 'gizmo';
    screenNorm: THREE.Vector2;
    lastSep: number;
  }>({
    startX: 0,
    startY: 0,
    startSep: 0,
    targetPart: 'pos',
    screenNorm: new THREE.Vector2(1, 0),
    lastSep: 0,
  });

  // Enable local clipping on WebGLRenderer
  useEffect(() => {
    gl.localClippingEnabled = true;
  }, [gl]);

  if (!sectionParams || !sectionParams.enabled) {
    return null;
  }

  const {
    position = 0,
    orientation = 'horizontal',
    pitch = 0,
    yaw = 0,
    roll = 0,
    isCut = false,
    separation = 0,
    extractSection = false,
    extractOffset = 3.5,
    showSectionFace = true,
    showContour = true,
    showCap = true,
    showDimensions = true,
  } = sectionParams;

  const h = params.h ?? (modelType === 'sphere' ? (params.r ?? 3) * 2 : 5);
  const r = params.r ?? 3;
  const a = params.a ?? 4;
  const solidCenter = useMemo(() => {
    if (modelType === 'sphere') {
      return new THREE.Vector3(0, r, 0);
    }
    return new THREE.Vector3(0, h / 2, 0);
  }, [h, r, modelType]);

  // Compute angles and offset based on orientation preset or custom angles
  const { effectivePitch, effectiveYaw, effectiveRoll, effectiveOffset } = useMemo(() => {
    let p = pitch;
    let y = yaw;
    let r_deg = roll;
    let off = position * (h / 2);

    if (orientation === 'horizontal') {
      p = 0;
      y = 0;
      r_deg = 0;
      off = position * (h / 2.2);
    } else if (orientation === 'vertical') {
      p = 90;
      y = 0;
      r_deg = 0;
      off = position * ((params.r ?? a / 2) * 0.85);
    } else if (orientation === 'diagonal_45') {
      p = 45;
      y = 0;
      r_deg = 0;
      off = position * (h / 2.5);
    } else if (orientation === 'apex_midpoint') {
      p = 60;
      y = 45;
      r_deg = 0;
      off = position * (h / 3);
    }

    return {
      effectivePitch: p,
      effectiveYaw: y,
      effectiveRoll: r_deg,
      effectiveOffset: off,
    };
  }, [orientation, pitch, yaw, roll, position, h, a, params.r]);

  // Generate Cutting Plane
  const { plane, normal, pointOnPlane } = useMemo(() => {
    return createCuttingPlane(
      effectivePitch,
      effectiveYaw,
      effectiveRoll,
      effectiveOffset,
      solidCenter
    );
  }, [effectivePitch, effectiveYaw, effectiveRoll, effectiveOffset, solidCenter]);

  // Solve exact intersection result
  const intersection = useMemo<IntersectionResult | null>(() => {
    return solveCrossSection(modelType, params, plane);
  }, [modelType, params, plane]);

  // Separation distance
  const effectiveSep = isCut ? Math.max(0, separation) : 0;

  // Separation vectors
  const sepPosVec = useMemo(() => normal.clone().multiplyScalar(effectiveSep), [normal, effectiveSep]);
  const sepNegVec = useMemo(() => normal.clone().multiplyScalar(-effectiveSep), [normal, effectiveSep]);

  // Correct Clipping Planes (taking separation into account so world-space clipping stays exact)
  const planePositive = useMemo(() => {
    // Positive half keeps: normal . p_world + (constant - effectiveSep) >= 0
    return new THREE.Plane(normal.clone(), plane.constant - effectiveSep);
  }, [normal, plane.constant, effectiveSep]);

  const planeNegative = useMemo(() => {
    // Negative half keeps: -normal . p_world + (-constant - effectiveSep) >= 0
    return new THREE.Plane(normal.clone().negate(), -plane.constant - effectiveSep);
  }, [normal, plane.constant, effectiveSep]);

  // Handle Drag Start
  const startDrag = useCallback(
    (e: any, target: 'pos' | 'neg' | 'gizmo') => {
      e.stopPropagation();
      if (!onSectionChange) return;

      // Project normal vector to 2D screen coordinates
      const p1 = pointOnPlane.clone().project(camera);
      const p2 = pointOnPlane.clone().add(normal).project(camera);
      const screenDx = (p2.x - p1.x) * gl.domElement.clientWidth * 0.5;
      const screenDy = -(p2.y - p1.y) * gl.domElement.clientHeight * 0.5;
      const screenVec = new THREE.Vector2(screenDx, screenDy);
      const len = screenVec.length();
      const normScreen = len > 0.001 ? screenVec.normalize() : new THREE.Vector2(1, 0);

      const currentSep = separation || 0;
      dragInfoRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        startSep: currentSep,
        targetPart: target,
        screenNorm: normScreen,
        lastSep: currentSep,
      };

      setIsDragging(true);

      // Disable OrbitControls while dragging
      if (controlsRef?.current) {
        controlsRef.current.enabled = false;
      }
      gl.domElement.style.cursor = 'grabbing';

      const handlePointerMove = (moveEvt: PointerEvent) => {
        const dx = moveEvt.clientX - dragInfoRef.current.startX;
        const dy = moveEvt.clientY - dragInfoRef.current.startY;
        const dot = dx * dragInfoRef.current.screenNorm.x + dy * dragInfoRef.current.screenNorm.y;

        const sensitivity = 0.016;
        const sign = dragInfoRef.current.targetPart === 'neg' ? -1 : 1;
        let newSep = dragInfoRef.current.startSep + dot * sensitivity * sign;

        // Clamp between 0 and 4.0 cm
        newSep = Math.max(0, Math.min(4.0, newSep));

        // Magnetic snap: if close to 0 (< 0.12), snap tightly to 0
        if (newSep < 0.12) {
          if (dragInfoRef.current.lastSep > 0.12) {
            soundEffects.playPopSound();
          }
          newSep = 0;
        } else if (dragInfoRef.current.lastSep === 0 && newSep >= 0.12) {
          soundEffects.playSeparateSound();
        }

        dragInfoRef.current.lastSep = newSep;

        onSectionChange({
          isCut: true,
          separation: Number(newSep.toFixed(2)),
          showSectionFace: true,
          showContour: true,
        });
      };

      const handlePointerUp = () => {
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
        setIsDragging(false);

        // Re-enable OrbitControls
        if (controlsRef?.current) {
          controlsRef.current.enabled = true;
        }
        gl.domElement.style.cursor = 'default';
      };

      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    },
    [camera, gl, normal, pointOnPlane, separation, onSectionChange, controlsRef]
  );

  // Quick snap together or separate button action
  const handleToggleSnap = useCallback(
    (e: any) => {
      e.stopPropagation();
      if (!onSectionChange) return;

      if (separation > 0.05) {
        // Snap together to 0 cm
        soundEffects.playPopSound();
        onSectionChange({ isCut: true, separation: 0 });
      } else {
        // Separate to 1.5 cm
        soundEffects.playSeparateSound();
        onSectionChange({ isCut: true, separation: 1.5, showSectionFace: true, showContour: true });
      }
    },
    [separation, onSectionChange]
  );

  // Create Cap Mesh Geometry for the Sliced Solid
  const capMeshGeometry = useMemo(() => {
    if (!intersection) return null;

    if (intersection.vertices3D && intersection.vertices3D.length >= 3) {
      const pts = intersection.vertices3D;
      const center = intersection.center3D;
      const positions: number[] = [];
      const normals: number[] = [];

      const n = pts.length;
      for (let i = 0; i < n; i++) {
        const curr = pts[i];
        const next = pts[(i + 1) % n];

        positions.push(center.x, center.y, center.z);
        positions.push(curr.x, curr.y, curr.z);
        positions.push(next.x, next.y, next.z);

        normals.push(normal.x, normal.y, normal.z);
        normals.push(normal.x, normal.y, normal.z);
        normals.push(normal.x, normal.y, normal.z);
      }

      const geom = new THREE.BufferGeometry();
      geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geom.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
      return geom;
    }

    return null;
  }, [intersection, normal]);

  // Extracted Cross-Section Transformation
  const extractedTransform = useMemo(() => {
    if (!extractSection || !intersection) return null;

    const outDirection = normal.clone().cross(new THREE.Vector3(0, 1, 0));
    if (outDirection.lengthSq() < 0.1) {
      outDirection.set(1, 0, 0);
    }
    outDirection.normalize();

    const targetPos = intersection.center3D
      .clone()
      .add(outDirection.multiplyScalar(extractOffset))
      .add(new THREE.Vector3(0, 1.2, 1.8));

    return {
      position: targetPos,
    };
  }, [extractSection, intersection, normal, extractOffset]);

  // Plane visual size
  const planeSize = Math.max(7, (params.r ?? a) * 2.8);

  // Render Base Solid Child Meshes
  const renderSolidChildren = () => {
    const optsWithClip: DisplayOptions = {
      ...(displayOptions || {
        showRadius: false,
        showHeight: false,
        showSlantHeight: false,
        showDimensions: false,
        showLabels: false,
        showGrid: true,
        showAxes: false,
        showWireframe: false,
        transparentSolid: false,
        solidOpacity: 0.95,
      }),
      showLabels: false,
      showDimensions: false,
    };

    switch (modelType) {
      case 'cuboid':
        return <Cuboid3D params={params} displayOptions={optsWithClip} />;
      case 'cube':
        return <Cube3D params={params} displayOptions={optsWithClip} />;
      case 'cylinder':
        return <Cylinder3D params={params} displayOptions={optsWithClip} />;
      case 'cone':
        return <Cone3D params={params} displayOptions={optsWithClip} />;
      case 'sphere':
        return <Sphere3D params={params} displayOptions={optsWithClip} />;
      case 'prism':
        return <Prism3D params={params} displayOptions={optsWithClip} />;
      case 'prism_quad':
        return <PrismQuad3D params={params} displayOptions={optsWithClip} />;
      case 'pyramid':
        return <Pyramid3D params={params} displayOptions={optsWithClip} />;
      case 'pyramid_triangular':
        return <PyramidTriangular3D params={params} displayOptions={optsWithClip} />;
      default:
        return null;
    }
  };

  // Positions for 3D Drag Gizmo Handles
  const posGizmoPos = useMemo(
    () => pointOnPlane.clone().add(normal.clone().multiplyScalar(effectiveSep + 0.45)),
    [pointOnPlane, normal, effectiveSep]
  );
  const negGizmoPos = useMemo(
    () => pointOnPlane.clone().add(normal.clone().multiplyScalar(-effectiveSep - 0.45)),
    [pointOnPlane, normal, effectiveSep]
  );

  return (
    <group name="universal-cross-section-engine">
      {/* 1. SEMI-TRANSPARENT 3D CUTTING PLANE (Mặt phẳng cắt alpha) */}
      {!isCut && (
        <group
          position={pointOnPlane.toArray()}
          onPointerDown={(e) => startDrag(e, 'pos')}
          onPointerOver={() => {
            gl.domElement.style.cursor = 'grab';
            setHoveredPart('gizmo');
          }}
          onPointerOut={() => {
            gl.domElement.style.cursor = 'default';
            setHoveredPart(null);
          }}
        >
          <group
            quaternion={new THREE.Quaternion().setFromUnitVectors(
              new THREE.Vector3(0, 0, 1),
              normal
            )}
          >
            {/* Plane Quad Mesh */}
            <mesh>
              <planeGeometry args={[planeSize, planeSize, 4, 4]} />
              <meshStandardMaterial
                color="#f43f5e"
                emissive="#f43f5e"
                emissiveIntensity={hoveredPart === 'gizmo' ? 0.45 : 0.25}
                roughness={0.2}
                metalness={0.1}
                transparent
                opacity={hoveredPart === 'gizmo' ? 0.35 : 0.22}
                side={THREE.DoubleSide}
                depthWrite={false}
              />
            </mesh>

            {/* Plane Outer Border */}
            <lineSegments>
              <edgesGeometry args={[new THREE.PlaneGeometry(planeSize, planeSize)]} />
              <lineBasicMaterial
                color="#f43f5e"
                linewidth={hoveredPart === 'gizmo' ? 3 : 2}
                transparent
                opacity={0.85}
              />
            </lineSegments>

            {/* Grid Lines on Cutting Plane */}
            <gridHelper
              args={[planeSize, 10, '#fb7185', '#fda4af']}
              rotation={[Math.PI / 2, 0, 0]}
              position={[0, 0, 0.005]}
            />
          </group>

          {/* Plane Name & Quick Action Label */}
          <group position={[normal.x * 1.5, normal.y * 1.5 + 0.3, normal.z * 1.5]}>
            <Text
              fontSize={0.24}
              color="#fda4af"
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.03}
              outlineColor="#0f172a"
            >
              Mặt phẳng cắt (α)
            </Text>
            <Text
              position={[0, -0.28, 0]}
              fontSize={0.18}
              color="#38bdf8"
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.02}
              outlineColor="#0f172a"
            >
              ✂️ Bấm "Cắt rời 2 phần" ở bảng bên phải để tách
            </Text>
          </group>
        </group>
      )}

      {/* 2. REAL SPLIT SOLID HALVES (When Cut is Executed) WITH DIRECT MOUSE SEPARATION */}
      {isCut && (
        <>
          {/* Positive Half (Nửa A - Kéo hướng dương) */}
          <ClippedGroup
            clipPlane={planePositive}
            position={sepPosVec.toArray()}
            onPointerDown={(e) => startDrag(e, 'pos')}
            onPointerOver={(e) => {
              e.stopPropagation();
              gl.domElement.style.cursor = 'grab';
              setHoveredPart('pos');
            }}
            onPointerOut={() => {
              if (!isDragging) gl.domElement.style.cursor = 'default';
              setHoveredPart(null);
            }}
          >
            {renderSolidChildren()}

            {/* Solid Capping Face on Half A (Exempt from clipping so it never clips itself) */}
            {showCap && capMeshGeometry && (
              <mesh geometry={capMeshGeometry} userData={{ exemptFromClipping: true }}>
                <meshStandardMaterial
                  color={hoveredPart === 'pos' ? '#fb7185' : '#f43f5e'}
                  emissive="#e11d48"
                  emissiveIntensity={hoveredPart === 'pos' ? 0.55 : 0.35}
                  roughness={0.3}
                  metalness={0.1}
                  side={THREE.DoubleSide}
                />
              </mesh>
            )}
          </ClippedGroup>

          {/* Negative Half (Nửa B - Kéo hướng âm) */}
          <ClippedGroup
            clipPlane={planeNegative}
            position={sepNegVec.toArray()}
            onPointerDown={(e) => startDrag(e, 'neg')}
            onPointerOver={(e) => {
              e.stopPropagation();
              gl.domElement.style.cursor = 'grab';
              setHoveredPart('neg');
            }}
            onPointerOut={() => {
              if (!isDragging) gl.domElement.style.cursor = 'default';
              setHoveredPart(null);
            }}
          >
            {renderSolidChildren()}

            {/* Solid Capping Face on Half B (Exempt from clipping) */}
            {showCap && capMeshGeometry && (
              <mesh geometry={capMeshGeometry} userData={{ exemptFromClipping: true }}>
                <meshStandardMaterial
                  color={hoveredPart === 'neg' ? '#38bdf8' : '#0284c7'}
                  emissive="#0369a1"
                  emissiveIntensity={hoveredPart === 'neg' ? 0.55 : 0.35}
                  roughness={0.3}
                  metalness={0.1}
                  side={THREE.DoubleSide}
                />
              </mesh>
            )}
          </ClippedGroup>

          {/* 3D INTERACTIVE SEPARATION GIZMO & DRAG HANDLES */}
          <group name="separation-interactive-gizmo">
            {/* Positive Arrow Gizmo Handle */}
            <group
              position={posGizmoPos.toArray()}
              onPointerDown={(e) => startDrag(e, 'pos')}
              onPointerOver={(e) => {
                e.stopPropagation();
                gl.domElement.style.cursor = 'grab';
                setHoveredPart('gizmo');
              }}
              onPointerOut={() => {
                if (!isDragging) gl.domElement.style.cursor = 'default';
                setHoveredPart(null);
              }}
            >
              <mesh>
                <sphereGeometry args={[0.2, 20, 20]} />
                <meshStandardMaterial
                  color="#f43f5e"
                  emissive="#fb7185"
                  emissiveIntensity={hoveredPart === 'pos' || hoveredPart === 'gizmo' ? 0.8 : 0.4}
                  roughness={0.2}
                  transparent
                  opacity={0.9}
                />
              </mesh>
              <mesh
                position={[normal.x * 0.28, normal.y * 0.28, normal.z * 0.28]}
                quaternion={new THREE.Quaternion().setFromUnitVectors(
                  new THREE.Vector3(0, 1, 0),
                  normal
                )}
              >
                <coneGeometry args={[0.14, 0.3, 16]} />
                <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.6} />
              </mesh>
            </group>

            {/* Negative Arrow Gizmo Handle */}
            <group
              position={negGizmoPos.toArray()}
              onPointerDown={(e) => startDrag(e, 'neg')}
              onPointerOver={(e) => {
                e.stopPropagation();
                gl.domElement.style.cursor = 'grab';
                setHoveredPart('gizmo');
              }}
              onPointerOut={() => {
                if (!isDragging) gl.domElement.style.cursor = 'default';
                setHoveredPart(null);
              }}
            >
              <mesh>
                <sphereGeometry args={[0.2, 20, 20]} />
                <meshStandardMaterial
                  color="#0284c7"
                  emissive="#38bdf8"
                  emissiveIntensity={hoveredPart === 'neg' || hoveredPart === 'gizmo' ? 0.8 : 0.4}
                  roughness={0.2}
                  transparent
                  opacity={0.9}
                />
              </mesh>
              <mesh
                position={[-normal.x * 0.28, -normal.y * 0.28, -normal.z * 0.28]}
                quaternion={new THREE.Quaternion().setFromUnitVectors(
                  new THREE.Vector3(0, 1, 0),
                  normal.clone().negate()
                )}
              >
                <coneGeometry args={[0.14, 0.3, 16]} />
                <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.6} />
              </mesh>
            </group>

            {/* Floating Interactive 3D Distance Display & Quick Button */}
            <group position={[pointOnPlane.x, pointOnPlane.y + (h > 5 ? 2.3 : 1.8), pointOnPlane.z]}>
              <Text
                position={[0, 0.4, 0]}
                fontSize={0.22}
                color={effectiveSep > 0.05 ? '#fbbf24' : '#34d399'}
                anchorX="center"
                anchorY="middle"
                outlineWidth={0.03}
                outlineColor="#0f172a"
              >
                {effectiveSep > 0.05
                  ? `↔️ Khoảng cách tách: d = ${(effectiveSep * 2).toFixed(2)} cm`
                  : '✨ Hai phần đang chập khít (0 cm)'}
              </Text>

              {/* Click to Snap / Separate Button */}
              <group
                onClick={handleToggleSnap}
                onPointerOver={(e) => {
                  e.stopPropagation();
                  gl.domElement.style.cursor = 'pointer';
                  setHoveredPart('snapBtn');
                }}
                onPointerOut={() => {
                  if (!isDragging) gl.domElement.style.cursor = 'default';
                  setHoveredPart(null);
                }}
              >
                <mesh position={[0, 0, -0.02]}>
                  <planeGeometry args={[3.4, 0.55]} />
                  <meshStandardMaterial
                    color={
                      hoveredPart === 'snapBtn'
                        ? effectiveSep > 0.05
                          ? '#0284c7'
                          : '#e11d48'
                        : effectiveSep > 0.05
                        ? '#0f172a'
                        : '#1e293b'
                    }
                    emissive={effectiveSep > 0.05 ? '#38bdf8' : '#fb7185'}
                    emissiveIntensity={hoveredPart === 'snapBtn' ? 0.5 : 0.2}
                    roughness={0.2}
                    metalness={0.8}
                    side={THREE.DoubleSide}
                  />
                </mesh>
                <lineSegments position={[0, 0, -0.01]}>
                  <edgesGeometry args={[new THREE.PlaneGeometry(3.4, 0.55)]} />
                  <lineBasicMaterial
                    color={effectiveSep > 0.05 ? '#38bdf8' : '#fb7185'}
                    linewidth={2}
                  />
                </lineSegments>

                <Text
                  position={[0, 0, 0.03]}
                  fontSize={0.2}
                  color={hoveredPart === 'snapBtn' ? '#ffffff' : '#f8fafc'}
                  anchorX="center"
                  anchorY="middle"
                  outlineWidth={0.02}
                  outlineColor="#0f172a"
                >
                  {effectiveSep > 0.05
                    ? '⏪ Bấm để NHẬP LẠI (0 cm)'
                    : '↔️ Bấm hoặc Kéo để TÁCH 2 PHẦN'}
                </Text>
              </group>
            </group>
          </group>
        </>
      )}

      {/* 3. HIGHLIGHTED CROSS-SECTION CONTOUR & PROFILE DIRECTLY ON SOLID (When not cut) */}
      {!isCut && showSectionFace && intersection && (
        <group position={[0, 0, 0]}>
          {/* Semi-transparent 3D Cap Mesh highlighting the cross-section plane area */}
          {capMeshGeometry && (
            <mesh geometry={capMeshGeometry}>
              <meshStandardMaterial
                color="#f43f5e"
                emissive="#f43f5e"
                emissiveIntensity={0.4}
                roughness={0.2}
                transparent
                opacity={0.85}
                side={THREE.DoubleSide}
              />
            </mesh>
          )}

          {/* Glowing Contour Edges & Corner Vertices */}
          {showContour && intersection.vertices3D && intersection.vertices3D.length >= 3 && (
            <group>
              {intersection.vertices3D.map((pt, idx) => {
                const nextPt = intersection.vertices3D[(idx + 1) % intersection.vertices3D.length];
                const edgeCenter = new THREE.Vector3().lerpVectors(pt, nextPt, 0.5);
                const sideLen = pt.distanceTo(nextPt);

                return (
                  <group key={`contour-edge-${idx}`}>
                    {/* Glowing Vertex Point Marker */}
                    <mesh position={pt.toArray()}>
                      <sphereGeometry args={[0.07, 16, 16]} />
                      <meshStandardMaterial
                        color="#ffffff"
                        emissive="#38bdf8"
                        emissiveIntensity={0.9}
                      />
                    </mesh>

                    {/* Edge Line Segment */}
                    <line>
                      <bufferGeometry>
                        <bufferAttribute
                          attach="attributes-position"
                          args={[new Float32Array([...pt.toArray(), ...nextPt.toArray()]), 3]}
                        />
                      </bufferGeometry>
                      <lineBasicMaterial color="#38bdf8" linewidth={3} />
                    </line>

                    {/* Side Length Label */}
                    {showDimensions && sideLen > 0.4 && (
                      <Text
                        position={[edgeCenter.x, edgeCenter.y + 0.15, edgeCenter.z]}
                        fontSize={0.19}
                        color="#38bdf8"
                        anchorX="center"
                        anchorY="middle"
                        outlineWidth={0.025}
                        outlineColor="#0284c7"
                      >
                        {`${sideLen.toFixed(2)} cm`}
                      </Text>
                    )}
                  </group>
                );
              })}
            </group>
          )}

          {/* Outer Perimeter Ring for Conics */}
          {intersection.isConic && intersection.vertices3D && intersection.vertices3D.length > 0 && (
            <lineLoop>
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  args={[
                    new Float32Array(intersection.vertices3D.flatMap((p) => [p.x, p.y, p.z])),
                    3,
                  ]}
                />
              </bufferGeometry>
              <lineBasicMaterial color="#38bdf8" linewidth={3} />
            </lineLoop>
          )}
        </group>
      )}

      {/* 4. EXTRACTED 2D CROSS SECTION (🎯 Tách mặt cắt ra ngoài & xoay trực diện) */}
      {extractSection && extractedTransform && intersection && (
        <group position={extractedTransform.position.toArray()}>
          <group quaternion={camera.quaternion} scale={1.15}>
            {/* Background 2D Presentation Board */}
            <mesh position={[0, 0, -0.05]}>
              <planeGeometry args={[4.4, 4.4]} />
              <meshStandardMaterial
                color="#0f172a"
                roughness={0.3}
                metalness={0.8}
                transparent
                opacity={0.88}
                side={THREE.DoubleSide}
              />
            </mesh>
            <lineSegments position={[0, 0, -0.04]}>
              <edgesGeometry args={[new THREE.PlaneGeometry(4.4, 4.4)]} />
              <lineBasicMaterial color="#38bdf8" linewidth={2} />
            </lineSegments>

            {/* Header Badge */}
            <Text
              position={[0, 1.8, 0]}
              fontSize={0.22}
              color="#38bdf8"
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.03}
              outlineColor="#0f172a"
            >
              {`✨ Thiết Diện: ${intersection.shapeNameVi}`}
            </Text>

            {/* 2D Flat Polygon Mesh */}
            {intersection.vertices2D && intersection.vertices2D.length >= 3 && (
              <mesh position={[0, 0.2, 0]}>
                <bufferGeometry>
                  <bufferAttribute
                    attach="attributes-position"
                    args={[
                      new Float32Array(
                        intersection.vertices2D.flatMap((p, i) => {
                          const next = intersection.vertices2D[(i + 1) % intersection.vertices2D.length];
                          return [0, 0, 0, p.x, p.y, 0, next.x, next.y, 0];
                        })
                      ),
                      3,
                    ]}
                  />
                </bufferGeometry>
                <meshStandardMaterial
                  color="#f43f5e"
                  emissive="#fb7185"
                  emissiveIntensity={0.4}
                  roughness={0.2}
                  side={THREE.DoubleSide}
                />
              </mesh>
            )}

            {/* Area & Perimeter Info */}
            <Text
              position={[0, -1.35, 0]}
              fontSize={0.19}
              color="#fbbf24"
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.02}
              outlineColor="#0f172a"
            >
              {`Diện tích: S = ${intersection.area.toFixed(2)} cm²`}
            </Text>
            <Text
              position={[0, -1.7, 0]}
              fontSize={0.17}
              color="#94a3b8"
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.02}
              outlineColor="#0f172a"
            >
              {`Chu vi: P = ${intersection.perimeter.toFixed(2)} cm`}
            </Text>
          </group>
        </group>
      )}
    </group>
  );
};
