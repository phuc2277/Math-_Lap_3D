import { Experiment as GeometryExperiment, ExperimentStep, VisualizationType } from '../types/geometry';

export type { ExperimentStep, VisualizationType };

export interface Experiment extends GeometryExperiment {}

export interface ExperimentGenerator {
  generateExperimentFromLesson(lessonContent: string, modelType: string): Promise<Experiment>;
}
