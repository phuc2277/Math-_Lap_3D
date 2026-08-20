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

  if (!showLabels && !showDimensions) {
    return null;
  }

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
            subtext="Dài"
            offset={[0, -0.25, 0.2]}
          />
        )}

        {/* Width (b) along Z axis on bottom right edge */}
        {(showDimensions || showLabels) && (
          <DimensionLine
            start={[halfA, -h / 2, -halfB]}
            end={[halfA, -h / 2, halfB]}
            color="#f43f5e"
            label={showLabels ? `b = ${b} cm` : undefined}
            subtext="Rộng"
            offset={[0.25, -0.25, 0]}
          />
        )}

        {/* Height (h) along Y axis on back-left vertical edge */}
        {(showHeight || showDimensions || showLabels) && (
          <DimensionLine
            start={[-halfA, -h / 2, -halfB]}
            end={[-halfA, h / 2, -halfB]}
            color="#10b981"
            label={showLabels ? `h = ${h} cm` : undefined}
            subtext="Cao"
            offset={[-0.25, 0, -0.25]}
          />
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
          <sphereGeometry args={[0.06, 16, 16]} />
          <meshBasicMaterial color="#f59e0b" />
        </mesh>
        {showLabels && (
          <Label3D position={[0, -h / 2 - 0.25, -0.2]} text="O" subtext="Đáy dưới" color="text-amber-400" />
        )}

        <mesh position={[0, h / 2, 0]}>
          <sphereGeometry args={[0.06, 16, 16]} />
          <meshBasicMaterial color="#f59e0b" />
        </mesh>
        {showLabels && (
          <Label3D position={[0, h / 2 + 0.25, -0.2]} text="O'" subtext="Đáy trên" color="text-amber-400" />
        )}

        {/* Central Axis OO' */}
        <Line
          points={[
            [0, -h / 2, 0],
            [0, h / 2, 0],
          ]}
          color="#f59e0b"
          lineWidth={1.5}
          dashed
          dashSize={0.2}
          gapSize={0.1}
        />

        {/* Radius Line (r) on bottom base along X */}
        {(showRadius || showDimensions) && (
          <DimensionLine
            start={[0, -h / 2, 0]}
            end={[r, -h / 2, 0]}
            color="#f43f5e"
            label={showLabels ? `r = ${r} cm` : undefined}
            subtext="Bán kính"
            offset={[0, -0.25, 0.2]}
          />
        )}

        {/* Height Line (h) on the left */}
        {(showHeight || showDimensions) && (
          <DimensionLine
            start={[-r - 0.35, -h / 2, 0]}
            end={[-r - 0.35, h / 2, 0]}
            color="#10b981"
            label={showLabels ? `h = ${h} cm` : undefined}
            subtext="Chiều cao"
            offset={[-0.2, 0, 0]}
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
          <sphereGeometry args={[0.06, 16, 16]} />
          <meshBasicMaterial color="#f59e0b" />
        </mesh>
        {showLabels && (
          <Label3D position={[0, -h / 2 - 0.25, -0.2]} text="O" color="text-amber-400" />
        )}

        {/* Apex S */}
        <mesh position={[0, h / 2, 0]}>
          <sphereGeometry args={[0.06, 16, 16]} />
          <meshBasicMaterial color="#f59e0b" />
        </mesh>
        {showLabels && (
          <Label3D position={[0, h / 2 + 0.25, 0]} text="S (Đỉnh)" color="text-amber-400" />
        )}

        {/* Height line SO */}
        {(showHeight || showDimensions) && (
          <DimensionLine
            start={[0, -h / 2, 0]}
            end={[0, h / 2, 0]}
            color="#10b981"
            label={showLabels ? `h = ${h} cm` : undefined}
            subtext="Chiều cao"
            offset={[-0.25, 0, 0]}
          />
        )}

        {/* Radius line r */}
        {(showRadius || showDimensions) && (
          <DimensionLine
            start={[0, -h / 2, 0]}
            end={[r, -h / 2, 0]}
            color="#f43f5e"
            label={showLabels ? `r = ${r} cm` : undefined}
            subtext="Bán kính"
            offset={[0, -0.25, 0.2]}
          />
        )}

        {/* Slant Height line (Đường sinh l) */}
        {(showSlantHeight || showDimensions) && (
          <DimensionLine
            start={[r, -h / 2, 0]}
            end={[0, h / 2, 0]}
            color="#a855f7"
            label={showLabels ? `l = ${l.toFixed(1)} cm` : undefined}
            subtext="Đường sinh"
            offset={[0.25, 0, 0]}
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
          <sphereGeometry args={[0.07, 16, 16]} />
          <meshBasicMaterial color="#f59e0b" />
        </mesh>
        {showLabels && (
          <Label3D position={[0, -0.25, -0.2]} text="O (Tâm)" color="text-amber-400" />
        )}

        {/* Radius line (r) */}
        {(showRadius || showDimensions) && (
          <DimensionLine
            start={[0, 0, 0]}
            end={[r, 0, 0]}
            color="#f43f5e"
            label={showLabels ? `R = ${r} cm` : undefined}
            subtext="Bán kính"
            offset={[0, 0.2, 0]}
          />
        )}
      </group>
    );
  }

  return null;
};
