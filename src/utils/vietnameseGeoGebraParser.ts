/**
 * Bộ xử lý phân tích cú pháp Tiếng Việt tự nhiên sang lệnh GeoGebra GGB API Standard
 */

export interface ParsedGeoGebraResult {
  rawInput: string;
  commands: string[];
  explanation: string;
  isClearCommand?: boolean;
}

export async function parseVietnameseGeoGebraCommandWithAI(input: string): Promise<ParsedGeoGebraResult> {
  const trimmed = input.trim();
  if (!trimmed) {
    return {
      rawInput: input,
      commands: [],
      explanation: 'Vui lòng nhập lệnh Tiếng Việt.',
    };
  }

  const normalized = trimmed.toLowerCase();

  // 1. Clear All / Xóa bảng
  if (
    normalized.includes('xóa tất cả') ||
    normalized.includes('xóa bảng') ||
    normalized.includes('làm mới') ||
    normalized.includes('xóa hết')
  ) {
    return {
      rawInput: input,
      commands: [],
      explanation: 'Xóa toàn bộ đối tượng trên bảng vẽ GeoGebra.',
      isClearCommand: true,
    };
  }

  try {
    const response = await fetch('/api/convert-vietnamese-ggb', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userPrompt: trimmed }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success && data.script) {
        const script: string = data.script.trim();
        let commands: string[] = [];

        // Check if script matches Execute({"...", "..."}) structure
        const executeMatch = script.match(/^Execute\(\s*\{([\s\S]*)\}\s*\)$/i);
        if (executeMatch) {
          const inner = executeMatch[1];
          const matches = inner.match(/"([^"\\]*(?:\\.[^"\\]*)*)"/g);
          if (matches && matches.length > 0) {
            commands = matches.map((m) =>
              m.substring(1, m.length - 1).replace(/\\"/g, '"').replace(/\\\\/g, '\\')
            );
          } else {
            commands = [script];
          }
        } else {
          // If script has multiple lines or single command, split by line
          commands = script
            .split('\n')
            .map((s) => s.trim())
            .filter(Boolean);
        }

        return {
          rawInput: input,
          commands: commands.length > 0 ? commands : [script],
          explanation: `[AI Gemini 2.5 Flash] Mã lệnh GeoGebra Script: ${script}`,
        };
      }
    }
  } catch (err) {
    console.warn('[GGB AI Parser] Fetch error, falling back to local regex parser:', err);
  }

  // Fallback to local regex-based parser
  return parseVietnameseGeoGebraCommand(input);
}

export function parseVietnameseGeoGebraCommand(input: string): ParsedGeoGebraResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return {
      rawInput: input,
      commands: [],
      explanation: 'Vui lòng nhập lệnh Tiếng Việt.',
    };
  }

  const normalized = trimmed.toLowerCase();

  // 1. Clear All / Xóa bảng
  if (
    normalized.includes('xóa tất cả') ||
    normalized.includes('xóa bảng') ||
    normalized.includes('làm mới') ||
    normalized.includes('xóa hết')
  ) {
    return {
      rawInput: input,
      commands: [],
      explanation: 'Xóa toàn bộ đối tượng trên bảng vẽ GeoGebra.',
      isClearCommand: true,
    };
  }

  const commands: string[] = [];
  let explanation = '';

  // Helper regexes
  // Match "vẽ đồ thị y = ..." or "vẽ hàm số ..." or "y = ..."
  const graphMatch = trimmed.match(/(?:vẽ\s+)?(?:đồ\s+thị|hàm\s+số|parabol)?\s*([a-zA-Z]\([xa-z]\)\s*=\s*.+|y\s*=\s*.+|x\^2\s*\+\s*y\^2\s*=\s*.+)/i);

  // Match "vẽ đường tròn tâm <A/O/(2,3)> bán kính <4/r>"
  const circleRadiusMatch = trimmed.match(/(?:vẽ\s+)?đường\s+tròn\s+tâm\s+([A-Za-z0-9_]+|\([^)]+\))\s+bán\s+kính\s+([0-9.]+)/i);

  // Match "vẽ đường tròn đường kính <A, B/AB>"
  const circleDiameterMatch = trimmed.match(/(?:vẽ\s+)?đường\s+tròn\s+đường\s+kính\s+([A-Z])(?:\s+và\s+|\s*,?\s*)([A-Z])/i);

  // Match "vẽ đường tròn ngoại tiếp <A, B, C / ABC>" or "đường tròn qua 3 điểm A, B, C"
  const circumcircleMatch = trimmed.match(/(?:vẽ\s+)?đường\s+tròn\s+(?:ngoại\s+tiếp|qua\s+3?\s*điểm)?\s*([A-Z])(?:\s*,\s*|\s+và\s+|\s+)([A-Z])(?:\s*,\s*|\s+và\s+|\s+)([A-Z])/i);

  // Match "vẽ điểm A(2, 3)" or "điểm A tại (2, 3)" or "A = (2, 3)"
  const pointCoordsMatch = trimmed.match(/(?:vẽ\s+|tạo\s+)?điểm\s+([A-Z])(?:\s*tại|\s*ở|\s*=)?\s*\(\s*(-?[0-9.]+)\s*,\s*(-?[0-9.]+)\s*\)/i) ||
    trimmed.match(/^([A-Z])\s*=\s*\(\s*(-?[0-9.]+)\s*,\s*(-?[0-9.]+)\s*\)$/i);

  // Match "vẽ đoạn thẳng AB" or "nối A và B"
  const segmentMatch = trimmed.match(/(?:vẽ\s+)?đoạn\s+thẳng\s+([A-Z])(?:\s*,\s*|\s+và\s+|\s+)([A-Z])/i) ||
    trimmed.match(/nối\s+([A-Z])\s+và\s+([A-Z])/i);

  // Match "vẽ đường thẳng qua A và B" or "đường thẳng AB"
  const lineMatch = trimmed.match(/(?:vẽ\s+)?đường\s+thẳng\s+(?:qua\s+)?([A-Z])(?:\s*,\s*|\s+và\s+|\s+)([A-Z])/i);

  // Match "vẽ tia AB"
  const rayMatch = trimmed.match(/(?:vẽ\s+)?tia\s+([A-Z])(?:\s*qua\s+|\s+)?([A-Z])/i);

  // Match "vẽ tam giác ABC" or "tam giác A, B, C"
  const triangleMatch = trimmed.match(/(?:vẽ\s+)?tam\s+giác\s+([A-Z])(?:\s*,\s*|\s+)?([A-Z])(?:\s*,\s*|\s+)?([A-Z])/i);

  // Match "vẽ đa giác A B C D"
  const polygonMatch = trimmed.match(/(?:vẽ\s+)?độc?\s*giác\s+([A-Z]+)/i) ||
    trimmed.match(/(?:vẽ\s+)?đa\s+giác\s+([A-Z\s,]+)/i);

  // Match "trung điểm M của AB" or "vẽ trung điểm AB"
  const midpointMatch = trimmed.match(/(?:vẽ\s+)?trung\s+điểm\s+([A-Z])?\s*(?:của\s+)?([A-Z])(?:\s*,\s*|\s+và\s+|\s+)?([A-Z])/i);

  // Match "đường trung trực của AB"
  const perpBisectorMatch = trimmed.match(/(?:vẽ\s+)?đường\s+trung\s+trực\s+(?:của\s+)?([A-Z])(?:\s*,\s*|\s+và\s+|\s+)?([A-Z])/i);

  // Match "đường phân giác góc ABC" or "phân giác góc ABC"
  const bisectorMatch = trimmed.match(/(?:vẽ\s+)?đường\s+phân\s+giác\s+(?:góc\s+)?([A-Z])\s*([A-Z])\s*([A-Z])/i) ||
    trimmed.match(/(?:vẽ\s+)?phân\s+giác\s+([A-Z])\s*([A-Z])\s*([A-Z])/i);

  // Match "đường vuông góc với AB qua C" or "vẽ đường vuông góc qua C tới AB"
  const perpLineMatch = trimmed.match(/(?:vẽ\s+)?đường\s+vuông\s+góc\s+(?:qua\s+|tại\s+)?([A-Z])?\s*(?:với|tới|đến)?\s*([A-Z])([A-Z])/i) ||
    trimmed.match(/(?:vẽ\s+)?đường\s+vuông\s+góc\s+với\s+([A-Z])([A-Z])\s+qua\s+([A-Z])/i);

  // Match "đường song song với AB qua C"
  const parallelLineMatch = trimmed.match(/(?:vẽ\s+)?đường\s+song\s+song\s+với\s+([A-Z])([A-Z])\s+qua\s+([A-Z])/i) ||
    trimmed.match(/(?:vẽ\s+)?đường\s+song\s+song\s+qua\s+([A-Z])\s+với\s+([A-Z])([A-Z])/i);

  // Match "đo góc ABC" or "vẽ góc ABC"
  const angleMatch = trimmed.match(/(?:đo|vẽ)\s+góc\s+([A-Z])\s*([A-Z])\s*([A-Z])/i);

  // Match "phép đối xứng A qua d" or "đối xứng A qua B"
  const reflectMatch = trimmed.match(/(?:phép\s+)?đối\s+xứng\s+([A-Z])\s+qua\s+([A-Za-z0-9_]+)/i);

  // Match "phép quay A 60 độ quanh O" or "quay A 45 độ quanh O"
  const rotateMatch = trimmed.match(/(?:phép\s+)?quay\s+([A-Z])\s+([0-9.]+)(?:°| độ)?\s+quanh\s+([A-Z])/i);

  // Match "phép tịnh tiến A theo véctơ u"
  const translateMatch = trimmed.match(/(?:phép\s+)?tịnh\s+tiến\s+([A-Z])\s+theo\s+(?:véctơ\s+)?([a-zA-Z0-9_]+)/i);

  // Match "vẽ véctơ AB" or "véctơ u = (3, 2)"
  const vectorMatch = trimmed.match(/(?:vẽ\s+)?véctơ\s+([A-Z])\s*([A-Z])/i) ||
    trimmed.match(/(?:vẽ\s+)?véctơ\s+([a-z])\s*=\s*\(\s*(-?[0-9.]+)\s*,\s*(-?[0-9.]+)\s*\)/i);

  // Match "giao điểm của d1 và d2"
  const intersectMatch = trimmed.match(/(?:giao\s+điểm|tìm\s+giao\s+điểm)\s+(?:của\s+)?([a-zA-Z0-9_]+)\s+và\s+([a-zA-Z0-9_]+)/i);

  // Match "đổi màu A thành đỏ" / "màu C xanh"
  const colorMatch = trimmed.match(/(?:đổi\s+màu|màu)\s+([a-zA-Z0-9_]+)\s+(?:thành\s+)?(đỏ|xanh|vàng|tím|lục|cam|đen|trắng|red|blue|green|yellow|purple|orange)/i);

  // PARSING EVALUATION PIPELINE:

  // 1. Circle Radius
  if (circleRadiusMatch) {
    const center = circleRadiusMatch[1];
    const radius = circleRadiusMatch[2];
    commands.push(`Circle(${center}, ${radius})`);
    explanation = `Dựng đường tròn tâm ${center} có bán kính R = ${radius}`;
    return { rawInput: input, commands, explanation };
  }

  // 2. Circle Diameter
  if (circleDiameterMatch) {
    const p1 = circleDiameterMatch[1];
    const p2 = circleDiameterMatch[2];
    commands.push(`Circle(${p1}, ${p2})`);
    explanation = `Dựng đường tròn đường kính ${p1}${p2}`;
    return { rawInput: input, commands, explanation };
  }

  // 3. Circumcircle / Circle through 3 points
  if (circumcircleMatch) {
    const p1 = circumcircleMatch[1];
    const p2 = circumcircleMatch[2];
    const p3 = circumcircleMatch[3];
    commands.push(`Circumcircle(${p1}, ${p2}, ${p3})`);
    explanation = `Dựng đường tròn đi qua 3 điểm ${p1}, ${p2}, ${p3}`;
    return { rawInput: input, commands, explanation };
  }

  // 4. Point Coordinates
  if (pointCoordsMatch) {
    const pName = pointCoordsMatch[1];
    const x = pointCoordsMatch[2];
    const y = pointCoordsMatch[3];
    commands.push(`${pName} = (${x}, ${y})`);
    explanation = `Tạo điểm ${pName} tại tọa độ (${x}, ${y})`;
    return { rawInput: input, commands, explanation };
  }

  // 5. Midpoint
  if (midpointMatch) {
    const mName = midpointMatch[1] || 'M';
    const p1 = midpointMatch[2];
    const p2 = midpointMatch[3];
    commands.push(`${mName} = Midpoint(${p1}, ${p2})`);
    explanation = `Tạo trung điểm ${mName} của đoạn thẳng ${p1}${p2}`;
    return { rawInput: input, commands, explanation };
  }

  // 6. Perpendicular Bisector
  if (perpBisectorMatch) {
    const p1 = perpBisectorMatch[1];
    const p2 = perpBisectorMatch[2];
    commands.push(`PerpendicularBisector(${p1}, ${p2})`);
    explanation = `Dựng đường trung trực của đoạn thẳng ${p1}${p2}`;
    return { rawInput: input, commands, explanation };
  }

  // 7. Angle Bisector
  if (bisectorMatch) {
    const p1 = bisectorMatch[1];
    const vertex = bisectorMatch[2];
    const p3 = bisectorMatch[3];
    commands.push(`AngleBisector(${p1}, ${vertex}, ${p3})`);
    explanation = `Dựng đường phân giác của góc ∠${p1}${vertex}${p3}`;
    return { rawInput: input, commands, explanation };
  }

  // 8. Perpendicular Line
  if (perpLineMatch) {
    const pt = perpLineMatch[1] || perpLineMatch[3];
    const l1 = perpLineMatch[2];
    const l2 = perpLineMatch[3];
    if (pt && l1 && l2) {
      commands.push(`PerpendicularLine(${pt}, Segment(${l1}, ${l2}))`);
      explanation = `Dựng đường thẳng qua ${pt} và vuông góc với ${l1}${l2}`;
      return { rawInput: input, commands, explanation };
    }
  }

  // 9. Parallel Line
  if (parallelLineMatch) {
    const pt = parallelLineMatch[3] || parallelLineMatch[1];
    const l1 = parallelLineMatch[1] || parallelLineMatch[2];
    const l2 = parallelLineMatch[2] || parallelLineMatch[3];
    commands.push(`Parallel(${pt}, Line(${l1}, ${l2}))`);
    explanation = `Dựng đường thẳng qua ${pt} và song song với ${l1}${l2}`;
    return { rawInput: input, commands, explanation };
  }

  // 10. Segment
  if (segmentMatch) {
    const p1 = segmentMatch[1];
    const p2 = segmentMatch[2];
    commands.push(`Segment(${p1}, ${p2})`);
    explanation = `Vẽ đoạn thẳng ${p1}${p2}`;
    return { rawInput: input, commands, explanation };
  }

  // 11. Line
  if (lineMatch) {
    const p1 = lineMatch[1];
    const p2 = lineMatch[2];
    commands.push(`Line(${p1}, ${p2})`);
    explanation = `Vẽ đường thẳng qua ${p1} và ${p2}`;
    return { rawInput: input, commands, explanation };
  }

  // 12. Ray
  if (rayMatch) {
    const p1 = rayMatch[1];
    const p2 = rayMatch[2];
    commands.push(`Ray(${p1}, ${p2})`);
    explanation = `Vẽ tia ${p1}${p2}`;
    return { rawInput: input, commands, explanation };
  }

  // 13. Triangle
  if (triangleMatch) {
    const p1 = triangleMatch[1];
    const p2 = triangleMatch[2];
    const p3 = triangleMatch[3];
    commands.push(`Polygon(${p1}, ${p2}, ${p3})`);
    explanation = `Dựng tam giác cấu thành bởi 3 đỉnh ${p1}, ${p2}, ${p3}`;
    return { rawInput: input, commands, explanation };
  }

  // 14. Angle Measurement
  if (angleMatch) {
    const p1 = angleMatch[1];
    const vertex = angleMatch[2];
    const p3 = angleMatch[3];
    commands.push(`Angle(${p1}, ${vertex}, ${p3})`);
    explanation = `Đo và hiển thị góc ∠${p1}${vertex}${p3}`;
    return { rawInput: input, commands, explanation };
  }

  // 15. Reflection
  if (reflectMatch) {
    const obj = reflectMatch[1];
    const mirror = reflectMatch[2];
    commands.push(`Reflect(${obj}, ${mirror})`);
    explanation = `Thực hiện phép đối xứng điểm ${obj} qua ${mirror}`;
    return { rawInput: input, commands, explanation };
  }

  // 16. Rotation
  if (rotateMatch) {
    const obj = rotateMatch[1];
    const angle = rotateMatch[2];
    const center = rotateMatch[3];
    commands.push(`Rotate(${obj}, ${angle}°, ${center})`);
    explanation = `Thực hiện phép quay điểm ${obj} một góc ${angle}° quanh tâm ${center}`;
    return { rawInput: input, commands, explanation };
  }

  // 17. Translation
  if (translateMatch) {
    const obj = translateMatch[1];
    const vec = translateMatch[2];
    commands.push(`Translate(${obj}, ${vec})`);
    explanation = `Thực hiện phép tịnh tiến ${obj} theo véctơ ${vec}`;
    return { rawInput: input, commands, explanation };
  }

  // 18. Vector
  if (vectorMatch) {
    if (vectorMatch[3]) {
      const vName = vectorMatch[1];
      const vx = vectorMatch[2];
      const vy = vectorMatch[3];
      commands.push(`${vName} = Vector((${vx}, ${vy}))`);
      explanation = `Tạo véctơ ${vName} = (${vx}, ${vy})`;
    } else {
      const p1 = vectorMatch[1];
      const p2 = vectorMatch[2];
      commands.push(`Vector(${p1}, ${p2})`);
      explanation = `Dựng véctơ ${p1}${p2}`;
    }
    return { rawInput: input, commands, explanation };
  }

  // 19. Intersection
  if (intersectMatch) {
    const o1 = intersectMatch[1];
    const o2 = intersectMatch[2];
    commands.push(`Intersect(${o1}, ${o2})`);
    explanation = `Xác định giao điểm giữa ${o1} và ${o2}`;
    return { rawInput: input, commands, explanation };
  }

  // 20. Color
  if (colorMatch) {
    const obj = colorMatch[1];
    const colorVi = colorMatch[2].toLowerCase();
    const colorMap: Record<string, string> = {
      'đỏ': 'red',
      'red': 'red',
      'xanh': 'blue',
      'blue': 'blue',
      'lục': 'green',
      'green': 'green',
      'vàng': 'yellow',
      'yellow': 'yellow',
      'tím': 'magenta',
      'purple': 'purple',
      'cam': 'orange',
      'orange': 'orange',
      'đen': 'black',
    };
    const mappedColor = colorMap[colorVi] || 'blue';
    commands.push(`SetColor(${obj}, "${mappedColor}")`);
    explanation = `Thay đổi màu của đối tượng ${obj} thành màu ${colorVi}`;
    return { rawInput: input, commands, explanation };
  }

  // 21. Function Graph / Direct Equation (Fallback)
  if (graphMatch) {
    const eq = graphMatch[1].trim();
    commands.push(eq);
    explanation = `Vẽ đồ thị / hàm số: ${eq}`;
    return { rawInput: input, commands, explanation };
  }

  // Direct Fallback Execution
  commands.push(trimmed);
  explanation = `Thực thi trực tiếp lệnh: "${trimmed}"`;
  return { rawInput: input, commands, explanation };
}
