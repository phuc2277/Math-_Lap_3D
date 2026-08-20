import { LabMetadata } from '../models/Lab';
import { Experiment } from '../models/Experiment';

export interface LabDataAdapter {
  getLabById(labId: string): Promise<LabMetadata | null>;
  getExperimentsByLabId(labId: string): Promise<Experiment[]>;
  getLabsByLessonId(lessonId: string): Promise<LabMetadata[]>;
  getAllPublishedLabs(): Promise<LabMetadata[]>;
  saveLab(lab: LabMetadata): Promise<void>;
  saveExperiment(experiment: Experiment): Promise<void>;
}
