import React from 'react';
import {
  VisualizationType,
  ModelType,
  ModelParams,
  DisplayOptions,
  SectionPlaneParams,
  Experiment,
  LabTab,
} from '../../types/geometry';
import { GeometryScene } from '../geometry/GeometryScene';
import { GraphEngine } from './GraphEngine';
import { ProbabilityEngine } from './ProbabilityEngine';
import { StatisticsEngine } from './StatisticsEngine';
import { Geometry2DEngine } from './Geometry2DEngine';
import { RelativePositionLineCircle } from './geometry2d/RelativePositionLineCircle';
import { RelativePositionTwoCircles } from './geometry2d/RelativePositionTwoCircles';
import { AlgebraIdentityEngine } from './geometry2d/AlgebraIdentityEngine';
import { PythagoreanTheoremEngine } from './geometry2d/PythagoreanTheoremEngine';
import { CongruentTrianglesEngine } from './geometry2d/CongruentTrianglesEngine';
import { SimilarTrianglesEngine } from './geometry2d/SimilarTrianglesEngine';

interface VisualizationEngineRegistryProps {
  visualizationType?: VisualizationType;
  modelType: ModelType;
  params: ModelParams;
  displayOptions?: DisplayOptions;
  activeMode?: LabTab;
  unfoldingProgress?: number;
  sectionParams?: SectionPlaneParams;
  onParamChange?: (key: keyof ModelParams, value: number) => void;
  onOptionToggle?: (key: keyof DisplayOptions, value?: any) => void;
  onSectionChange?: (updates: Partial<SectionPlaneParams>) => void;
  experiment?: Experiment;
}

export const VisualizationEngineRegistry: React.FC<VisualizationEngineRegistryProps> = ({
  visualizationType = '3d',
  modelType,
  params,
  displayOptions,
  activeMode,
  unfoldingProgress,
  sectionParams,
  onParamChange,
  onOptionToggle,
  onSectionChange,
  experiment,
}) => {
  // Direct route for 2D Geometry experiments
  if (modelType === 'line_circle') {
    return (
      <RelativePositionLineCircle
        params={params}
        onParamChange={onParamChange}
      />
    );
  }

  if (modelType === 'two_circles') {
    return (
      <RelativePositionTwoCircles
        params={params}
        onParamChange={onParamChange}
      />
    );
  }

  if (modelType === 'algebra_identity') {
    return (
      <AlgebraIdentityEngine
        params={params}
        displayOptions={displayOptions}
        onParamChange={onParamChange}
      />
    );
  }

  if (modelType === 'pythagorean_theorem') {
    return (
      <PythagoreanTheoremEngine
        params={params}
        displayOptions={displayOptions}
        onParamChange={onParamChange}
      />
    );
  }

  if (modelType === 'congruent_triangles') {
    return (
      <CongruentTrianglesEngine
        params={params}
        displayOptions={displayOptions}
        onParamChange={onParamChange}
      />
    );
  }

  if (modelType === 'similar_triangles') {
    return (
      <SimilarTrianglesEngine
        params={params}
        displayOptions={displayOptions}
        onParamChange={onParamChange}
      />
    );
  }

  // Determine effective type from experiment or visualizationType or modelType
  let type: VisualizationType = experiment?.visualizationType || visualizationType;

  if (modelType.startsWith('graph')) {
    type = 'graph';
  } else if (modelType === 'probability_sim') {
    type = 'probability';
  } else if (modelType === 'statistics_sim') {
    type = 'statistics';
  }

  switch (type) {
    case 'graph':
      return (
        <GraphEngine
          params={params}
          onParamChange={onParamChange}
          graphConfig={experiment?.graphConfig}
        />
      );

    case 'probability':
      return (
        <ProbabilityEngine
          params={params}
          onParamChange={onParamChange}
          probabilityConfig={experiment?.probabilityConfig}
        />
      );

    case 'statistics':
      return (
        <StatisticsEngine
          params={params}
          onParamChange={onParamChange}
          statisticsConfig={experiment?.statisticsConfig}
        />
      );

    case 'geometry2d':
      return (
        <Geometry2DEngine
          params={params}
          onParamChange={onParamChange}
        />
      );

    case '3d':
    default:
      return (
        <GeometryScene
          modelType={modelType}
          params={params}
          displayOptions={displayOptions || {
            showRadius: true,
            showHeight: true,
            showSlantHeight: true,
            showDimensions: true,
            showLabels: true,
            showGrid: true,
            showAxes: false,
            showWireframe: false,
            transparentSolid: false,
            solidOpacity: 0.85,
          }}
          activeMode={activeMode || 'observe'}
          unfoldingProgress={unfoldingProgress || 0}
          sectionParams={sectionParams || { enabled: true, position: 0, orientation: 'horizontal', showSectionFace: true }}
          onOptionToggle={onOptionToggle}
          onSectionChange={onSectionChange}
        />
      );
  }
};
