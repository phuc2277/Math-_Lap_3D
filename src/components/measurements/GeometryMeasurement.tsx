import React from 'react';
import { ModelType, ModelParams, DisplayOptions } from '../../types/geometry';
import { DimensionLine, Label3D } from '../geometry/3DHelpers';
import { Line } from '@react-three/drei';

interface GeometryMeasurementProps {
  modelType: ModelType;
  params: ModelParams;
  displayOptions: DisplayOptions;
}

export const GeometryMeasurement: React.FC<GeometryMeasurementProps> = ({
  modelType,
  params,
  displayOptions,
}) => {
  const { showRadius, showHeight, showSlantHeight, showDimensions, showLabels } = displayOptions;

  if (modelType === 'cuboid' || modelType === 'cube') {
    const a = params.a ?? (modelType === 'cube' ? 4 : 5);
    const b = modelType === 'cube' ? a : params.b ?? 3;
    const h = modelType === 'cube' ? a : params.h ?? 4;

    const halfA = a / 2;
    const halfB = b / 2;

    return (
      <group position={[0, h / 2, 0]}>
        {/* Length (a) along X axis on bottom front edge */}
        {(showDimensions || showLabels) && (
          <DimensionLine
            start={[-halfA, -h / 2, halfB]}
            end={[halfA, -h / 2, halfB]}
            color="#38bdf8"
            label={showLabels ? `a = ${a} cm` : undefined}
            subtext="Chiều dài"
            offset={[0, -0.3, 0.2]}
          />
        )}

        {/* Width (b) along Z axis on bottom right edge */}
        {(showDimensions || showLabels) && (
          <DimensionLine
            start={[halfA, -h / 2, -halfB]}
            end={[halfA, -h / 2, halfB]}
            color="#f43f5e"
            label={showLabels ? `b = ${b} cm` : undefined}
            subtext="Chiều rộng"
            offset={[0.3, -0.3, 0]}
          />
        )}

        {/* Height (h) along Y axis on back-left vertical edge */}
        {(showHeight || showDimensions || showLabels) && (
          <DimensionLine
            start={[-halfA - 0.3, -h / 2, -halfB]}
            end={[-halfA - 0.3, h / 2, -halfB]}
            color="#10b981"
            label={showLabels ? `h = ${h} cm` : undefined}
            subtext="Chiều cao"
            offset={[-0.2, 0, 0]}
          />
        )}

        {/* Diagonal of space (Đường chéo hình hộp) */}
        {showDimensions && (
          <group>
            <Line
              points={[
                [-halfA, -h / 2, halfB],
                [halfA, h / 2, -halfB],
              ]}
              color="#a855f7"
              lineWidth={2}
              dashed
              dashSize={0.2}
              gapSize={0.1}
            />
            {showLabels && (
              <Label3D
                position={[0, 0, 0]}
                text={`d = ${Math.sqrt(a * a + b * b + h * h).toFixed(2)} cm`}
                subtext="Đường chéo"
                color="text-purple-300"
                badgeBg="bg-purple-950/80 border-purple-800"
              />
            )}
          </group>
        )}
      </group>
    );
  }

  if (modelType === 'cylinder') {
    const r = params.r ?? 3;
    const h = params.h ?? 5;

    return (
      <group position={[0, h / 2, 0]}>
        {/* Base Center O (bottom) & O' (top) */}
        <mesh position={[0, -h / 2, 0]}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshBasicMaterial color="#f59e0b" />
        </mesh>
        {showLabels && (
          <Label3D position={[0, -h / 2 - 0.35, 0]} text="O" subtext="Tâm đáy dưới" color="text-amber-400" />
        )}

        <mesh position={[0, h / 2, 0]}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshBasicMaterial color="#f59e0b" />
        </mesh>
        {showLabels && (
          <Label3D position={[0, h / 2 + 0.35, 0]} text="O'" subtext="Tâm đáy trên" color="text-amber-400" />
        )}

        {/* Central Axis OO' */}
        <Line
          points={[
            [0, -h / 2, 0],
            [0, h / 2, 0],
          ]}
          color="#f59e0b"
          lineWidth={2}
          dashed
          dashSize={0.2}
          gapSize={0.1}
        />

        {/* Radius Line (r) */}
        {(showRadius || showDimensions) && (
          <DimensionLine
            start={[0, -h / 2, 0]}
            end={[r, -h / 2, 0]}
            color="#f43f5e"
            label={showLabels ? `r = ${r} cm` : undefined}
            subtext="Bán kính đáy"
          />
        )}

        {/* Diameter Line (d = 2r) on top base */}
        {showDimensions && (
          <DimensionLine
            start={[-r, h / 2, 0]}
            end={[r, h / 2, 0]}
            color="#38bdf8"
            label={showLabels ? `d = ${2 * r} cm` : undefined}
            subtext="Đường kính đáy"
            offset={[0, 0.3, 0]}
          />
        )}

        {/* Height Line (h) */}
        {(showHeight || showDimensions) && (
          <DimensionLine
            start={[-r - 0.4, -h / 2, 0]}
            end={[-r - 0.4, h / 2, 0]}
            color="#10b981"
            label={showLabels ? `h = ${h} cm` : undefined}
            subtext="Chiều cao"
          />
        )}
      </group>
    );
  }

  if (modelType === 'cone') {
    const r = params.r ?? 3;
    const h = params.h ?? 5;
    const l = Math.sqrt(r * r + h * h);

    return (
      <group position={[0, h / 2, 0]}>
        {/* Base center O */}
        <mesh position={[0, -h / 2, 0]}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshBasicMaterial color="#f59e0b" />
        </mesh>
        {showLabels && (
          <Label3D position={[0, -h / 2 - 0.35, 0]} text="O" subtext="Tâm đáy" color="text-amber-400" />
        )}

        {/* Apex S */}
        <mesh position={[0, h / 2, 0]}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshBasicMaterial color="#f59e0b" />
        </mesh>
        {showLabels && (
          <Label3D position={[0, h / 2 + 0.35, 0]} text="S" subtext="Đỉnh nón" color="text-amber-400" />
        )}

        {/* Height line SO */}
        {(showHeight || showDimensions) && (
          <DimensionLine
            start={[0, -h / 2, 0]}
            end={[0, h / 2, 0]}
            color="#10b981"
            label={showLabels ? `h = ${h} cm` : undefined}
            subtext="Chiều cao"
            offset={[-0.3, 0, 0]}
          />
        )}

        {/* Radius line r */}
        {(showRadius || showDimensions) && (
          <DimensionLine
            start={[0, -h / 2, 0]}
            end={[r, -h / 2, 0]}
            color="#f43f5e"
            label={showLabels ? `r = ${r} cm` : undefined}
            subtext="Bán kính đáy"
          />
        )}

        {/* Slant Height line (Đường sinh l) */}
        {(showSlantHeight || showDimensions) && (
          <DimensionLine
            start={[r, -h / 2, 0]}
            end={[0, h / 2, 0]}
            color="#a855f7"
            label={showLabels ? `l = ${l.toFixed(2)} cm` : undefined}
            subtext="Đường sinh"
            offset={[0.2, 0, 0]}
          />
        )}

        {/* Right-angle triangle indicator (Tam giác vuông SOA) */}
        {showDimensions && (
          <Line
            points={[
              [0, -h / 2 + 0.4, 0],
              [0.4, -h / 2 + 0.4, 0],
              [0.4, -h / 2, 0],
            ]}
            color="#e2e8f0"
            lineWidth={1.5}
          />
        )}
      </group>
    );
  }

  if (modelType === 'sphere') {
    const r = params.r ?? 4;

    return (
      <group position={[0, r, 0]}>
        {/* Center point O */}
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[0.09, 16, 16]} />
          <meshBasicMaterial color="#f59e0b" />
        </mesh>
        {showLabels && (
          <Label3D position={[0, -0.35, 0]} text="O" subtext="Tâm hình cầu" color="text-amber-400" />
        )}

        {/* Radius line (r) */}
        {(showRadius || showDimensions) && (
          <DimensionLine
            start={[0, 0, 0]}
            end={[r, 0, 0]}
            color="#38bdf8"
            label={showLabels ? `r = ${r} cm` : undefined}
            subtext="Bán kính"
          />
        )}

        {/* Diameter line (d = 2r) */}
        {showDimensions && (
          <DimensionLine
            start={[-r, 0, 0]}
            end={[r, 0, 0]}
            color="#ec4899"
            label={showLabels ? `d = ${2 * r} cm` : undefined}
            subtext="Đường kính"
            offset={[0, 0.4, 0]}
          />
        )}
      </group>
    );
  }

  if (modelType === 'prism_quad') {
    const a = params.a ?? 6;
    const b = Math.min(params.b ?? 3, a - 0.1);
    const d = params.d ?? 4;
    const h = params.h ?? 5;

    return (
      <group position={[0, h / 2, 0]}>
        {/* Đáy lớn a */}
        {(showDimensions || showLabels) && (
          <DimensionLine
            start={[-a / 2, -h / 2, -d / 2]}
            end={[a / 2, -h / 2, -d / 2]}
            color="#38bdf8"
            label={showLabels ? `a = ${a} cm` : undefined}
            subtext="Đáy lớn"
            offset={[0, -0.3, 0]}
          />
        )}
        {/* Đáy nhỏ b */}
        {(showDimensions || showLabels) && (
          <DimensionLine
            start={[-b / 2, -h / 2, d / 2]}
            end={[b / 2, -h / 2, d / 2]}
            color="#f43f5e"
            label={showLabels ? `b = ${b} cm` : undefined}
            subtext="Đáy nhỏ"
            offset={[0, -0.3, 0]}
          />
        )}
        {/* Chiều cao đáy d */}
        {(showDimensions || showLabels) && (
          <DimensionLine
            start={[0, -h / 2, -d / 2]}
            end={[0, -h / 2, d / 2]}
            color="#eab308"
            label={showLabels ? `d = ${d} cm` : undefined}
            subtext="Chiều cao đáy"
            offset={[0.3, -0.3, 0]}
          />
        )}
        {/* Chiều cao lăng trụ h */}
        {(showHeight || showDimensions) && (
          <DimensionLine
            start={[-a / 2 - 0.3, -h / 2, -d / 2]}
            end={[-a / 2 - 0.3, h / 2, -d / 2]}
            color="#10b981"
            label={showLabels ? `h = ${h} cm` : undefined}
            subtext="Chiều cao lăng trụ"
          />
        )}
      </group>
    );
  }

  if (modelType === 'prism') {
    const a = params.a ?? 4;
    const h = params.h ?? 5;

    return (
      <group position={[0, h / 2, 0]}>
        {(showDimensions || showLabels) && (
          <DimensionLine
            start={[-a / 2, -h / 2, 0]}
            end={[a / 2, -h / 2, 0]}
            color="#38bdf8"
            label={showLabels ? `a = ${a} cm` : undefined}
            subtext="Cạnh đáy"
            offset={[0, -0.3, 0]}
          />
        )}
        {(showHeight || showDimensions) && (
          <DimensionLine
            start={[-a / 2 - 0.3, -h / 2, 0]}
            end={[-a / 2 - 0.3, h / 2, 0]}
            color="#10b981"
            label={showLabels ? `h = ${h} cm` : undefined}
            subtext="Chiều cao"
          />
        )}
      </group>
    );
  }

  if (modelType === 'pyramid' || modelType === 'pyramid_triangular') {
    const a = params.a ?? 4;
    const b = params.b ?? 4;
    const h = params.h ?? 5;

    return (
      <group position={[0, h / 2, 0]}>
        {(showDimensions || showLabels) && (
          <DimensionLine
            start={[-a / 2, -h / 2, b / 2]}
            end={[a / 2, -h / 2, b / 2]}
            color="#f59e0b"
            label={showLabels ? `a = ${a} cm` : undefined}
            subtext="Cạnh đáy"
            offset={[0, -0.3, 0.2]}
          />
        )}
        {(showHeight || showDimensions) && (
          <DimensionLine
            start={[0, -h / 2, 0]}
            end={[0, h / 2, 0]}
            color="#10b981"
            label={showLabels ? `h = ${h} cm` : undefined}
            subtext="Chiều cao"
            offset={[-0.3, 0, 0]}
          />
        )}
      </group>
    );
  }

  return null;
};
