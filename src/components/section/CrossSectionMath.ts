import * as THREE from 'three';
import { ModelType, ModelParams } from '../../types/geometry';

export interface IntersectionResult {
  shapeType: string;
  shapeNameVi: string;
  vertices3D: THREE.Vector3[];
  vertices2D: THREE.Vector2[];
  area: number;
  perimeter: number;
  sideLengths: number[];
  anglesDeg: number[];
  center3D: THREE.Vector3;
  normal: THREE.Vector3;
  planeConstant: number;
  descriptionVi: string;
  formulaVi: string;
  isConic?: boolean;
  conicType?: 'circle' | 'ellipse' | 'parabola' | 'hyperbola' | 'triangle' | 'rectangle';
  radii?: { r1: number; r2: number };
}

// Convert Euler angles in degrees (pitch, yaw, roll) and offset to THREE.Plane
export function createCuttingPlane(
  pitchDeg: number,
  yawDeg: number,
  rollDeg: number,
  offset: number,
  centerOrigin: THREE.Vector3 = new THREE.Vector3(0, 2, 0)
): { plane: THREE.Plane; normal: THREE.Vector3; pointOnPlane: THREE.Vector3 } {
  const pitch = THREE.MathUtils.degToRad(pitchDeg);
  const yaw = THREE.MathUtils.degToRad(yawDeg);
  const roll = THREE.MathUtils.degToRad(rollDeg);

  // Initial normal vector pointing UP (0, 1, 0) for horizontal plane
  const baseNormal = new THREE.Vector3(0, 1, 0);
  const euler = new THREE.Euler(pitch, yaw, roll, 'XYZ');
  const normal = baseNormal.clone().applyEuler(euler).normalize();

  // Point on plane = centerOrigin + offset * normal
  const pointOnPlane = centerOrigin.clone().add(normal.clone().multiplyScalar(offset));

  // Plane equation: normal . p + constant = 0 => constant = - normal . pointOnPlane
  const constant = -normal.dot(pointOnPlane);
  const plane = new THREE.Plane(normal, constant);

  return { plane, normal, pointOnPlane };
}

// Generate Polyhedron vertices and edges for 3D slicing
export function getPolyhedronModelData(
  modelType: ModelType,
  params: ModelParams
): { vertices: THREE.Vector3[]; edges: [number, number][]; faces: number[][] } {
  const a = params.a ?? 4;
  const b = params.b ?? (modelType === 'cube' ? a : 3);
  const h = params.h ?? (modelType === 'cube' ? a : 5);

  const vertices: THREE.Vector3[] = [];
  const edges: [number, number][] = [];
  const faces: number[][] = [];

  switch (modelType) {
    case 'cube':
    case 'cuboid': {
      const halfA = a / 2;
      const halfB = b / 2;
      // 8 Vertices: bottom 0-3 at y=0, top 4-7 at y=h
      vertices.push(
        new THREE.Vector3(-halfA, 0, -halfB), // 0: bottom-back-left
        new THREE.Vector3(halfA, 0, -halfB),  // 1: bottom-back-right
        new THREE.Vector3(halfA, 0, halfB),   // 2: bottom-front-right
        new THREE.Vector3(-halfA, 0, halfB),  // 3: bottom-front-left
        new THREE.Vector3(-halfA, h, -halfB), // 4: top-back-left
        new THREE.Vector3(halfA, h, -halfB),  // 5: top-back-right
        new THREE.Vector3(halfA, h, halfB),   // 6: top-front-right
        new THREE.Vector3(-halfA, h, halfB)   // 7: top-front-left
      );

      // 12 Edges
      edges.push(
        // Bottom
        [0, 1], [1, 2], [2, 3], [3, 0],
        // Top
        [4, 5], [5, 6], [6, 7], [7, 4],
        // Vertical pillars
        [0, 4], [1, 5], [2, 6], [3, 7]
      );

      // 6 Faces
      faces.push(
        [0, 3, 2, 1], // Bottom
        [4, 5, 6, 7], // Top
        [0, 1, 5, 4], // Back
        [2, 3, 7, 6], // Front
        [0, 4, 7, 3], // Left
        [1, 2, 6, 5]  // Right
      );
      break;
    }

    case 'prism': {
      // Regular Triangular Prism
      const r = (a / Math.sqrt(3));
      const p0 = new THREE.Vector3(0, 0, -r);
      const p1 = new THREE.Vector3(-a / 2, 0, r / 2);
      const p2 = new THREE.Vector3(a / 2, 0, r / 2);

      vertices.push(
        p0, p1, p2, // 0, 1, 2
        p0.clone().setY(h), p1.clone().setY(h), p2.clone().setY(h) // 3, 4, 5
      );

      edges.push(
        [0, 1], [1, 2], [2, 0],
        [3, 4], [4, 5], [5, 3],
        [0, 3], [1, 4], [2, 5]
      );

      faces.push(
        [0, 2, 1],
        [3, 4, 5],
        [0, 1, 4, 3],
        [1, 2, 5, 4],
        [2, 0, 3, 5]
      );
      break;
    }

    case 'prism_quad': {
      // Right Trapezoidal / Quadrilateral Prism
      const halfA = a / 2;
      const halfB = b / 2;
      vertices.push(
        new THREE.Vector3(-halfA, 0, -halfB),
        new THREE.Vector3(halfA, 0, -halfB),
        new THREE.Vector3(halfA * 0.7, 0, halfB),
        new THREE.Vector3(-halfA * 0.7, 0, halfB),
        new THREE.Vector3(-halfA, h, -halfB),
        new THREE.Vector3(halfA, h, -halfB),
        new THREE.Vector3(halfA * 0.7, h, halfB),
        new THREE.Vector3(-halfA * 0.7, h, halfB)
      );

      edges.push(
        [0, 1], [1, 2], [2, 3], [3, 0],
        [4, 5], [5, 6], [6, 7], [7, 4],
        [0, 4], [1, 5], [2, 6], [3, 7]
      );
      break;
    }

    case 'pyramid': {
      // Square / Rectangular Pyramid (Hình chóp tứ giác đều)
      const halfA = a / 2;
      const halfB = (params.b ?? a) / 2;
      const apex = new THREE.Vector3(0, h, 0); // Apex 4

      vertices.push(
        new THREE.Vector3(-halfA, 0, -halfB), // 0
        new THREE.Vector3(halfA, 0, -halfB),  // 1
        new THREE.Vector3(halfA, 0, halfB),   // 2
        new THREE.Vector3(-halfA, 0, halfB),  // 3
        apex                                  // 4
      );

      edges.push(
        [0, 1], [1, 2], [2, 3], [3, 0],
        [0, 4], [1, 4], [2, 4], [3, 4]
      );
      break;
    }

    case 'pyramid_triangular': {
      // Regular Triangular Pyramid (Hình chóp tam giác đều / Tứ diện)
      const r = (a / Math.sqrt(3));
      const p0 = new THREE.Vector3(0, 0, -r);
      const p1 = new THREE.Vector3(-a / 2, 0, r / 2);
      const p2 = new THREE.Vector3(a / 2, 0, r / 2);
      const apex = new THREE.Vector3(0, h, 0);

      vertices.push(p0, p1, p2, apex);
      edges.push(
        [0, 1], [1, 2], [2, 0],
        [0, 3], [1, 3], [2, 3]
      );
      break;
    }

    default:
      break;
  }

  return { vertices, edges, faces };
}

// Compute cross section for polyhedrons (Khối đa diện)
export function computePolyhedronCrossSection(
  vertices: THREE.Vector3[],
  edges: [number, number][],
  plane: THREE.Plane,
  modelType: ModelType,
  params: ModelParams
): IntersectionResult | null {
  const intersectionPoints: THREE.Vector3[] = [];
  const normal = plane.normal.clone().normalize();
  const d = plane.constant;

  // Find intersection on each edge
  for (const [i1, i2] of edges) {
    const v1 = vertices[i1];
    const v2 = vertices[i2];
    if (!v1 || !v2) continue;

    const val1 = normal.dot(v1) + d;
    const val2 = normal.dot(v2) + d;

    // Check if edge touches or crosses plane
    if (Math.abs(val1) < 1e-4) {
      if (!intersectionPoints.some((p) => p.distanceTo(v1) < 0.02)) {
        intersectionPoints.push(v1.clone());
      }
      continue;
    }
    if (Math.abs(val2) < 1e-4) {
      if (!intersectionPoints.some((p) => p.distanceTo(v2) < 0.02)) {
        intersectionPoints.push(v2.clone());
      }
      continue;
    }

    if ((val1 > 0 && val2 < 0) || (val1 < 0 && val2 > 0)) {
      const t = -val1 / (val2 - val1);
      const interPt = new THREE.Vector3().lerpVectors(v1, v2, t);
      if (!intersectionPoints.some((p) => p.distanceTo(interPt) < 0.02)) {
        intersectionPoints.push(interPt);
      }
    }
  }

  if (intersectionPoints.length < 3) {
    return null;
  }

  // Calculate centroid
  const center3D = new THREE.Vector3();
  for (const pt of intersectionPoints) {
    center3D.add(pt);
  }
  center3D.divideScalar(intersectionPoints.length);

  // Define 2D coordinate system on plane (u, v)
  let u = new THREE.Vector3(1, 0, 0);
  if (Math.abs(normal.dot(u)) > 0.9) {
    u = new THREE.Vector3(0, 0, 1);
  }
  u.sub(normal.clone().multiplyScalar(normal.dot(u))).normalize();
  const v = new THREE.Vector3().crossVectors(normal, u).normalize();

  // Project points to 2D on plane and sort by angle around center
  const projected = intersectionPoints.map((pt) => {
    const rel = pt.clone().sub(center3D);
    const x = rel.dot(u);
    const y = rel.dot(v);
    const angle = Math.atan2(y, x);
    return { pt, x, y, angle };
  });

  projected.sort((a, b) => a.angle - b.angle);

  const sorted3D = projected.map((p) => p.pt);
  const sorted2D = projected.map((p) => new THREE.Vector2(p.x, p.y));

  // Compute Area (Shoelace formula) and Perimeter
  let area = 0;
  let perimeter = 0;
  const sideLengths: number[] = [];
  const n = sorted2D.length;

  for (let i = 0; i < n; i++) {
    const curr = sorted2D[i];
    const next = sorted2D[(i + 1) % n];
    area += curr.x * next.y - next.x * curr.y;

    const curr3D = sorted3D[i];
    const next3D = sorted3D[(i + 1) % n];
    const sideLen = curr3D.distanceTo(next3D);
    sideLengths.push(sideLen);
    perimeter += sideLen;
  }
  area = Math.abs(area) * 0.5;

  // Compute interior angles in degrees
  const anglesDeg: number[] = [];
  for (let i = 0; i < n; i++) {
    const prev = sorted3D[(i - 1 + n) % n];
    const curr = sorted3D[i];
    const next = sorted3D[(i + 1) % n];
    const vec1 = prev.clone().sub(curr).normalize();
    const vec2 = next.clone().sub(curr).normalize();
    const dot = THREE.MathUtils.clamp(vec1.dot(vec2), -1, 1);
    const angle = THREE.MathUtils.radToDeg(Math.acos(dot));
    anglesDeg.push(angle);
  }

  // Classify shape
  let shapeType = 'polygon';
  let shapeNameVi = `${n}-giác`;
  let descriptionVi = `Mặt cắt là đa giác ${n} cạnh`;
  let formulaVi = `S = ${area.toFixed(2)} \\text{ cm}^2, \\quad P = ${perimeter.toFixed(2)} \\text{ cm}`;

  if (n === 3) {
    const [s1, s2, s3] = sideLengths;
    const isEqui = Math.abs(s1 - s2) < 0.08 && Math.abs(s2 - s3) < 0.08;
    const isIso = Math.abs(s1 - s2) < 0.08 || Math.abs(s2 - s3) < 0.08 || Math.abs(s3 - s1) < 0.08;
    const hasRightAngle = anglesDeg.some((ang) => Math.abs(ang - 90) < 2);

    if (isEqui) {
      shapeType = 'equilateral_triangle';
      shapeNameVi = 'Tam giác đều';
      descriptionVi = 'Mặt cắt là tam giác đều với 3 cạnh bằng nhau và 3 góc 60°.';
    } else if (hasRightAngle && isIso) {
      shapeType = 'right_isosceles_triangle';
      shapeNameVi = 'Tam giác vuông cân';
      descriptionVi = 'Mặt cắt là tam giác vuông cân có góc 90° và 2 cạnh góc vuông bằng nhau.';
    } else if (hasRightAngle) {
      shapeType = 'right_triangle';
      shapeNameVi = 'Tam giác vuông';
      descriptionVi = 'Mặt cắt là tam giác vuông.';
    } else if (isIso) {
      shapeType = 'isosceles_triangle';
      shapeNameVi = 'Tam giác cân';
      descriptionVi = 'Mặt cắt là tam giác cân với 2 cạnh bên bằng nhau.';
    } else {
      shapeType = 'scalene_triangle';
      shapeNameVi = 'Tam giác thường';
      descriptionVi = 'Mặt cắt là tam giác với 3 cạnh độ dài khác nhau.';
    }
  } else if (n === 4) {
    const isAllRight = anglesDeg.every((ang) => Math.abs(ang - 90) < 2.5);
    const [s1, s2, s3, s4] = sideLengths;
    const isAllSidesEqual = Math.abs(s1 - s2) < 0.08 && Math.abs(s2 - s3) < 0.08 && Math.abs(s3 - s4) < 0.08;
    const isOppositeEqual = Math.abs(s1 - s3) < 0.08 && Math.abs(s2 - s4) < 0.08;

    if (isAllRight && isAllSidesEqual) {
      shapeType = 'square';
      shapeNameVi = 'Hình vuông';
      descriptionVi = 'Mặt cắt là hình vuông hoàn hảo (4 cạnh bằng nhau, 4 góc vuông 90°).';
    } else if (isAllRight && isOppositeEqual) {
      shapeType = 'rectangle';
      shapeNameVi = 'Hình chữ nhật';
      descriptionVi = 'Mặt cắt là hình chữ nhật với 2 cặp cạnh đối song song và bằng nhau.';
    } else if (isOppositeEqual) {
      shapeType = 'parallelogram';
      shapeNameVi = 'Hình bình hành';
      descriptionVi = 'Mặt cắt là hình bình hành.';
    } else {
      shapeType = 'trapezoid';
      shapeNameVi = 'Hình thang / Tứ giác';
      descriptionVi = 'Mặt cắt là tứ giác lồi phẳng.';
    }
  } else if (n === 5) {
    shapeType = 'pentagon';
    shapeNameVi = 'Hình ngũ giác (5 cạnh)';
    descriptionVi = 'Mặt cắt đi qua 5 mặt của khối tạo thành đa giác 5 cạnh.';
  } else if (n === 6) {
    shapeType = 'hexagon';
    shapeNameVi = 'Hình lục giác (6 cạnh)';
    descriptionVi = 'Mặt cắt đi qua cả 6 mặt của khối lập phương/hộp tạo thành hình lục giác.';
  }

  return {
    shapeType,
    shapeNameVi,
    vertices3D: sorted3D,
    vertices2D: sorted2D,
    area,
    perimeter,
    sideLengths,
    anglesDeg,
    center3D,
    normal,
    planeConstant: d,
    descriptionVi,
    formulaVi,
  };
}

// Compute Cross-Section for Curved Solids: Cylinder, Cone, Sphere
export function computeCurvedSolidCrossSection(
  modelType: 'cylinder' | 'cone' | 'sphere' | 'parabol',
  params: ModelParams,
  plane: THREE.Plane
): IntersectionResult | null {
  const r = params.r ?? 3;
  const h = params.h ?? 5;
  const normal = plane.normal.clone().normalize();
  const d = plane.constant;

  const solidCenter = new THREE.Vector3(0, h / 2, 0);
  if (modelType === 'sphere') {
    solidCenter.set(0, r, 0);
  }

  // Distance from solid center to plane
  const distFromCenter = normal.dot(solidCenter) + d;

  // 1. SPHERE (Hình Cầu) - Section is ALWAYS a circle (or empty if dist > r)
  if (modelType === 'sphere') {
    const sphereR = r;
    if (Math.abs(distFromCenter) >= sphereR * 0.99) {
      return null;
    }

    const cutRadius = Math.sqrt(Math.max(0, sphereR * sphereR - distFromCenter * distFromCenter));
    const center3D = solidCenter.clone().sub(normal.clone().multiplyScalar(distFromCenter));
    const area = Math.PI * cutRadius * cutRadius;
    const perimeter = 2 * Math.PI * cutRadius;

    // Generate 64 vertices on circle
    let u = new THREE.Vector3(1, 0, 0);
    if (Math.abs(normal.dot(u)) > 0.9) u = new THREE.Vector3(0, 0, 1);
    u.sub(normal.clone().multiplyScalar(normal.dot(u))).normalize();
    const v = new THREE.Vector3().crossVectors(normal, u).normalize();

    const vertices3D: THREE.Vector3[] = [];
    const vertices2D: THREE.Vector2[] = [];
    const segments = 64;
    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const p3 = center3D.clone().add(u.clone().multiplyScalar(cutRadius * cos)).add(v.clone().multiplyScalar(cutRadius * sin));
      vertices3D.push(p3);
      vertices2D.push(new THREE.Vector2(cutRadius * cos, cutRadius * sin));
    }

    return {
      shapeType: 'circle',
      shapeNameVi: 'Hình tròn',
      vertices3D,
      vertices2D,
      area,
      perimeter,
      sideLengths: [],
      anglesDeg: [],
      center3D,
      normal,
      planeConstant: d,
      descriptionVi: `Mọi thiết diện của hình cầu cắt bởi mặt phẳng đều là hình tròn có bán kính r' = √(R² - d²) = ${cutRadius.toFixed(2)} cm.`,
      formulaVi: `S = \\pi \\cdot r'^2 = \\pi \\cdot ${cutRadius.toFixed(2)}^2 \\approx ${area.toFixed(2)} \\text{ cm}^2`,
      isConic: true,
      conicType: 'circle',
      radii: { r1: cutRadius, r2: cutRadius },
    };
  }

  // 2. CYLINDER (Hình Trụ)
  if (modelType === 'cylinder') {
    const isHorizontal = Math.abs(normal.y) > 0.98; // Plane is parallel to base
    const isVertical = Math.abs(normal.y) < 0.05;   // Plane is perpendicular to base

    if (isHorizontal) {
      // Cut height y
      const yCut = -d / normal.y;
      if (yCut < -0.01 || yCut > h + 0.01) return null;

      const center3D = new THREE.Vector3(0, Math.max(0, Math.min(h, yCut)), 0);
      const area = Math.PI * r * r;
      const perimeter = 2 * Math.PI * r;

      const vertices3D: THREE.Vector3[] = [];
      const vertices2D: THREE.Vector2[] = [];
      for (let i = 0; i < 64; i++) {
        const ang = (i / 64) * Math.PI * 2;
        vertices3D.push(new THREE.Vector3(r * Math.cos(ang), center3D.y, r * Math.sin(ang)));
        vertices2D.push(new THREE.Vector2(r * Math.cos(ang), r * Math.sin(ang)));
      }

      return {
        shapeType: 'circle',
        shapeNameVi: 'Hình tròn (Song song đáy)',
        vertices3D,
        vertices2D,
        area,
        perimeter,
        sideLengths: [],
        anglesDeg: [],
        center3D,
        normal,
        planeConstant: d,
        descriptionVi: `Khi cắt hình trụ bởi mặt phẳng song song với đáy, thiết diện là hình tròn bằng hình tròn đáy (bán kính R = ${r} cm).`,
        formulaVi: `S = \\pi R^2 = \\pi \\cdot ${r}^2 \\approx ${area.toFixed(2)} \\text{ cm}^2`,
        isConic: true,
        conicType: 'circle',
        radii: { r1: r, r2: r },
      };
    } else if (isVertical) {
      // Plane is vertical => Rectangular cross-section
      const normH = Math.sqrt(normal.x * normal.x + normal.z * normal.z);
      const distFromAxis = normH > 0.001 ? Math.abs(d) / normH : Math.abs(d);
      if (distFromAxis >= r * 0.99) return null;

      const chordHalfWidth = Math.sqrt(r * r - distFromAxis * distFromAxis);
      const width = 2 * chordHalfWidth;
      const area = width * h;
      const perimeter = 2 * (width + h);

      // Horizontal normal and tangent vectors
      const nh = new THREE.Vector3(normal.x, 0, normal.z).normalize();
      const uh = new THREE.Vector3(-normal.z, 0, normal.x).normalize();
      const pCenterH = nh.clone().multiplyScalar(-d / normH);

      const v0 = pCenterH.clone().add(uh.clone().multiplyScalar(-chordHalfWidth)).setY(0);
      const v1 = pCenterH.clone().add(uh.clone().multiplyScalar(chordHalfWidth)).setY(0);
      const v2 = pCenterH.clone().add(uh.clone().multiplyScalar(chordHalfWidth)).setY(h);
      const v3 = pCenterH.clone().add(uh.clone().multiplyScalar(-chordHalfWidth)).setY(h);

      const center3D = pCenterH.clone().setY(h / 2);

      return {
        shapeType: 'rectangle',
        shapeNameVi: distFromAxis < 0.1 ? 'Hình chữ nhật qua trục' : 'Hình chữ nhật song song trục',
        vertices3D: [v0, v1, v2, v3],
        vertices2D: [
          new THREE.Vector2(-chordHalfWidth, -h / 2),
          new THREE.Vector2(chordHalfWidth, -h / 2),
          new THREE.Vector2(chordHalfWidth, h / 2),
          new THREE.Vector2(-chordHalfWidth, h / 2),
        ],
        area,
        perimeter,
        sideLengths: [width, h, width, h],
        anglesDeg: [90, 90, 90, 90],
        center3D,
        normal,
        planeConstant: d,
        descriptionVi: `Khi cắt hình trụ bởi mặt phẳng song song hoặc chứa trục, thiết diện nhận được là hình chữ nhật kích thước ${width.toFixed(2)} × ${h} cm.`,
        formulaVi: `S = 2\\sqrt{R^2 - d^2} \\cdot h = ${width.toFixed(2)} \\cdot ${h} = ${area.toFixed(2)} \\text{ cm}^2`,
        isConic: true,
        conicType: 'rectangle',
      };
    } else {
      // Oblique Plane => Ellipse
      const cosAngle = Math.max(0.1, Math.abs(normal.y));
      const semiMinor = r;
      const semiMajor = r / cosAngle;
      const area = Math.PI * semiMajor * semiMinor;
      const perimeter = Math.PI * (3 * (semiMajor + semiMinor) - Math.sqrt((3 * semiMajor + semiMinor) * (semiMajor + 3 * semiMinor)));

      const yCutCenter = THREE.MathUtils.clamp(-d / normal.y, h * 0.1, h * 0.9);
      const center3D = new THREE.Vector3(0, yCutCenter, 0);

      let u = new THREE.Vector3(-normal.z, 0, normal.x);
      if (u.lengthSq() < 0.01) {
        u.set(1, 0, 0);
      }
      u.normalize();
      const v = new THREE.Vector3().crossVectors(normal, u).normalize();

      const vertices3D: THREE.Vector3[] = [];
      const vertices2D: THREE.Vector2[] = [];
      for (let i = 0; i < 64; i++) {
        const ang = (i / 64) * Math.PI * 2;
        const x2 = semiMinor * Math.cos(ang);
        const y2 = semiMajor * Math.sin(ang);
        vertices3D.push(center3D.clone().add(u.clone().multiplyScalar(x2)).add(v.clone().multiplyScalar(y2)));
        vertices2D.push(new THREE.Vector2(x2, y2));
      }

      return {
        shapeType: 'ellipse',
        shapeNameVi: 'Hình Elip (Cắt xiên)',
        vertices3D,
        vertices2D,
        area,
        perimeter,
        sideLengths: [],
        anglesDeg: [],
        center3D,
        normal,
        planeConstant: d,
        descriptionVi: `Khi cắt hình trụ bởi mặt phẳng nghiêng không song song đáy, thiết diện là hình elip với bán trục lớn a = ${semiMajor.toFixed(2)} cm và bán trục nhỏ b = ${semiMinor.toFixed(2)} cm.`,
        formulaVi: `S = \\pi \\cdot a \\cdot b = \\pi \\cdot ${semiMajor.toFixed(2)} \\cdot ${semiMinor.toFixed(2)} \\approx ${area.toFixed(2)} \\text{ cm}^2`,
        isConic: true,
        conicType: 'ellipse',
        radii: { r1: semiMajor, r2: semiMinor },
      };
    }
  }

  // 3. CONE (Hình Nón) - Conic Sections: Circle, Isosceles Triangle, Ellipse, Parabola, Hyperbola
  if (modelType === 'cone') {
    const isHorizontal = Math.abs(normal.y) > 0.98;
    const isThroughApex = Math.abs(normal.dot(new THREE.Vector3(0, h, 0)) + d) < 0.15;

    if (isHorizontal) {
      // Horizontal cut => Smaller Circle
      const yCut = -d / normal.y;
      if (yCut < -0.01 || yCut > h + 0.01) return null;

      const cutR = Math.max(0.01, r * (1 - Math.max(0, Math.min(h, yCut)) / h));
      const center3D = new THREE.Vector3(0, Math.max(0, Math.min(h, yCut)), 0);
      const area = Math.PI * cutR * cutR;
      const perimeter = 2 * Math.PI * cutR;

      const vertices3D: THREE.Vector3[] = [];
      const vertices2D: THREE.Vector2[] = [];
      for (let i = 0; i < 64; i++) {
        const ang = (i / 64) * Math.PI * 2;
        vertices3D.push(new THREE.Vector3(cutR * Math.cos(ang), center3D.y, cutR * Math.sin(ang)));
        vertices2D.push(new THREE.Vector2(cutR * Math.cos(ang), cutR * Math.sin(ang)));
      }

      return {
        shapeType: 'circle',
        shapeNameVi: 'Hình tròn (Song song đáy)',
        vertices3D,
        vertices2D,
        area,
        perimeter,
        sideLengths: [],
        anglesDeg: [],
        center3D,
        normal,
        planeConstant: d,
        descriptionVi: `Khi cắt hình nón bởi mặt phẳng song song với đáy, thiết diện là hình tròn đồng tâm với bán kính r' = R(1 - y/h) = ${cutR.toFixed(2)} cm.`,
        formulaVi: `S = \\pi \\cdot r'^2 = \\pi \\cdot ${cutR.toFixed(2)}^2 \\approx ${area.toFixed(2)} \\text{ cm}^2`,
        isConic: true,
        conicType: 'circle',
        radii: { r1: cutR, r2: cutR },
      };
    } else if (isThroughApex) {
      // Plane passing through apex => Isosceles Triangle
      const normH = Math.sqrt(normal.x * normal.x + normal.z * normal.z);
      const distFromAxis = normH > 0.001 ? Math.abs(d + normal.y * 0) / normH : 0;
      const groundCutDist = Math.min(r * 0.99, distFromAxis);
      const chordHalfWidth = Math.sqrt(Math.max(0, r * r - groundCutDist * groundCutDist));
      const baseWidth = 2 * chordHalfWidth;
      const slantHeight = Math.sqrt(chordHalfWidth * chordHalfWidth + h * h);
      const area = 0.5 * baseWidth * h;
      const perimeter = baseWidth + 2 * slantHeight;

      const nh = normH > 0.001 ? new THREE.Vector3(normal.x, 0, normal.z).normalize() : new THREE.Vector3(0, 0, 1);
      const uh = new THREE.Vector3(-nh.z, 0, nh.x).normalize();
      const pCenterGround = nh.clone().multiplyScalar(-groundCutDist);

      const v0 = pCenterGround.clone().add(uh.clone().multiplyScalar(-chordHalfWidth)).setY(0);
      const v1 = pCenterGround.clone().add(uh.clone().multiplyScalar(chordHalfWidth)).setY(0);
      const vApex = new THREE.Vector3(0, h, 0);

      return {
        shapeType: 'isosceles_triangle',
        shapeNameVi: 'Tam giác cân qua đỉnh',
        vertices3D: [v0, v1, vApex],
        vertices2D: [
          new THREE.Vector2(-chordHalfWidth, 0),
          new THREE.Vector2(chordHalfWidth, 0),
          new THREE.Vector2(0, h),
        ],
        area,
        perimeter,
        sideLengths: [baseWidth, slantHeight, slantHeight],
        anglesDeg: [55, 55, 70],
        center3D: new THREE.Vector3(0, h / 3, 0),
        normal,
        planeConstant: d,
        descriptionVi: `Khi cắt hình nón bởi mặt phẳng đi qua đỉnh nón, thiết diện nhận được là tam giác cân có đáy là dây cung đáy và 2 cạnh bên bằng đường sinh l = ${slantHeight.toFixed(2)} cm.`,
        formulaVi: `S = \\frac{1}{2} \\cdot 2R \\cdot h = R \\cdot h = ${r} \\cdot ${h} = ${area.toFixed(2)} \\text{ cm}^2`,
        isConic: true,
        conicType: 'triangle',
      };
    } else {
      // General Conic Section (Ellipse / Parabola / Hyperbola)
      const slantAngle = Math.atan2(h, r); // Slant angle from base
      const planeAngle = Math.acos(Math.abs(normal.y)); // Plane inclination angle from horizontal

      let conicName = 'Hình Elip (Cắt xiên)';
      let desc = 'Mặt phẳng cắt xiên qua toàn bộ các đường sinh tạo thành đường cong Elip khép kín.';
      let conicType: 'ellipse' | 'parabola' | 'hyperbola' = 'ellipse';

      if (Math.abs(planeAngle - slantAngle) < 0.1) {
        conicName = 'Hình Parabol (Song song đường sinh)';
        desc = 'Mặt phẳng song song với một đường sinh của hình nón, tạo thiết diện là đường cong Parabol.';
        conicType = 'parabola';
      } else if (planeAngle > slantAngle) {
        conicName = 'Hình Hypebol (Cắt 2 nhánh)';
        desc = 'Mặt phẳng nghiêng dốc đứng hơn đường sinh tạo thiết diện là nhánh Hypebol.';
        conicType = 'hyperbola';
      }

      const approxA = Math.min(r * 1.5, Math.max(0.5, r / Math.max(0.2, Math.abs(Math.sin(planeAngle)))));
      const approxB = Math.min(r, Math.max(0.5, r * Math.cos(Math.min(Math.PI / 2 - 0.1, planeAngle * 0.5))));
      const area = Math.PI * approxA * approxB;

      // Coordinate axes u and v on cutting plane
      let u = new THREE.Vector3(1, 0, 0);
      if (Math.abs(normal.dot(u)) > 0.9) u = new THREE.Vector3(0, 0, 1);
      u.sub(normal.clone().multiplyScalar(normal.dot(u))).normalize();
      const v = new THREE.Vector3().crossVectors(normal, u).normalize();

      const center3D = new THREE.Vector3(0, THREE.MathUtils.clamp(-d / Math.max(0.01, normal.y), h * 0.2, h * 0.8), 0);
      const vertices3D: THREE.Vector3[] = [];
      const vertices2D: THREE.Vector2[] = [];
      for (let i = 0; i < 64; i++) {
        const ang = (i / 64) * Math.PI * 2;
        const x2 = approxA * Math.cos(ang);
        const y2 = approxB * Math.sin(ang);
        vertices3D.push(center3D.clone().add(u.clone().multiplyScalar(x2)).add(v.clone().multiplyScalar(y2)));
        vertices2D.push(new THREE.Vector2(x2, y2));
      }

      return {
        shapeType: conicType,
        shapeNameVi: conicName,
        vertices3D,
        vertices2D,
        area,
        perimeter: 2 * Math.PI * approxA,
        sideLengths: [],
        anglesDeg: [],
        center3D,
        normal,
        planeConstant: d,
        descriptionVi: desc,
        formulaVi: `S \\approx \\pi \\cdot a \\cdot b \\approx ${area.toFixed(2)} \\text{ cm}^2`,
        isConic: true,
        conicType,
        radii: { r1: approxA, r2: approxB },
      };
    }
  }

  return null;
}

// Master Cross-Section Solver
export function solveCrossSection(
  modelType: ModelType,
  params: ModelParams,
  plane: THREE.Plane
): IntersectionResult | null {
  if (['cylinder', 'cone', 'sphere', 'parabol'].includes(modelType)) {
    return computeCurvedSolidCrossSection(
      modelType as 'cylinder' | 'cone' | 'sphere' | 'parabol',
      params,
      plane
    );
  }

  const polyData = getPolyhedronModelData(modelType, params);
  return computePolyhedronCrossSection(polyData.vertices, polyData.edges, plane, modelType, params);
}
