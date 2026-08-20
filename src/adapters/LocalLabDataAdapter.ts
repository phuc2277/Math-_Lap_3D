import { LabDataAdapter } from './LabDataAdapter';
import { LabMetadata } from '../models/Lab';
import { Experiment } from '../models/Experiment';
import { GEOMETRY_MODELS } from '../data/geometryModels';
import { experimentsData } from '../data/experiments';

// Comprehensive mock repository of Labs matching Stage 3 specifications
const MOCK_LAB_METADATA_STORE: LabMetadata[] = [
  {
    id: 'lab-cylinder-001',
    title: 'Khám phá hình trụ',
    description: 'Khám phá các yếu tố cấu tạo, diện tích xung quanh và thể tích hình trụ.',
    type: '3d',
    modelType: 'cylinder',
    grade: 9,
    subject: 'math',
    lessonId: 'lop9-hinh-tru',
    status: 'published',
    createdAt: '2026-08-01',
    updatedAt: '2026-08-08',
  },
  {
    id: 'lab-cylinder-unfold-001',
    title: 'Khai triển hình trụ 2D',
    description: 'Thực hành trải phẳng mặt xung quanh hình trụ thành hình chữ nhật.',
    type: '3d',
    modelType: 'cylinder',
    grade: 9,
    subject: 'math',
    lessonId: 'lop9-hinh-tru',
    status: 'published',
    createdAt: '2026-08-02',
    updatedAt: '2026-08-08',
  },
  {
    id: 'lab-cylinder-volume-001',
    title: 'Thí nghiệm thể tích hình trụ',
    description: 'Thực hành đo đạc sự phụ thuộc bình phương của bán kính đáy tới thể tích.',
    type: '3d',
    modelType: 'cylinder',
    grade: 9,
    subject: 'math',
    lessonId: 'lop9-hinh-tru',
    status: 'published',
    createdAt: '2026-08-03',
    updatedAt: '2026-08-08',
  },
  {
    id: 'lab-cuboid-001',
    title: 'Khám phá hình hộp chữ nhật',
    description: 'Khám phá 6 mặt, các cạnh, chiều dài, chiều rộng, chiều cao hình hộp.',
    type: '3d',
    modelType: 'cuboid',
    grade: 8,
    subject: 'math',
    lessonId: 'lop8-hinh-hop-chu-nhat',
    status: 'published',
    createdAt: '2026-08-01',
    updatedAt: '2026-08-08',
  },
  {
    id: 'lab-cube-001',
    title: 'Khám phá hình lập phương',
    description: 'Mô hình 3D hình lập phương với 6 mặt vuông bằng nhau.',
    type: '3d',
    modelType: 'cube',
    grade: 8,
    subject: 'math',
    lessonId: 'lop8-hinh-lap-phuong',
    status: 'published',
    createdAt: '2026-08-01',
    updatedAt: '2026-08-08',
  },
  {
    id: 'lab-cone-001',
    title: 'Khám phá hình nón',
    description: 'Trực quan hóa đỉnh S, chiều cao h, đường sinh l và so sánh thể tích 1/3 với hình trụ.',
    type: '3d',
    modelType: 'cone',
    grade: 9,
    subject: 'math',
    lessonId: 'lop9-hinh-non',
    status: 'published',
    createdAt: '2026-08-01',
    updatedAt: '2026-08-08',
  },
  {
    id: 'lab-sphere-001',
    title: 'Khám phá hình cầu & mặt cầu',
    description: 'Mô hình 3D hình cầu, các đường tròn cắt và công thức thể tích (4/3)πr³.',
    type: '3d',
    modelType: 'sphere',
    grade: 9,
    subject: 'math',
    lessonId: 'lop9-hinh-cau',
    status: 'published',
    createdAt: '2026-08-01',
    updatedAt: '2026-08-08',
  },
  {
    id: 'lab-graph-linear-001',
    title: 'Hàm số bậc nhất y = ax + b và Đồ thị',
    description: 'Đồ thị đường thẳng tương tác, khảo sát hệ số góc a, tung độ gốc b và vị trí tương đối giữa các đường thẳng.',
    type: '3d',
    modelType: 'graph_linear',
    grade: 8,
    subject: 'math',
    lessonId: 'lop8-ham-so-bac-nhat',
    status: 'published',
    createdAt: '2026-08-01',
    updatedAt: '2026-08-19',
  },
];

export class LocalLabDataAdapter implements LabDataAdapter {
  private labs: LabMetadata[] = [...MOCK_LAB_METADATA_STORE];
  private experiments: Experiment[] = [...experimentsData];

  public async getLabById(labId: string): Promise<LabMetadata | null> {
    // Search exact ID or match against model type fallback (e.g. cylinder-001)
    const found = this.labs.find(
      (l) => l.id === labId || l.id === `lab-${labId}` || l.modelType === labId || l.lessonId === labId
    );
    if (found) return found;

    // Fallback search in GEOMETRY_MODELS
    const fallbackModel = GEOMETRY_MODELS.find(
      (m) => m.id === labId || m.modelType === labId || m.lessonId === labId
    );
    if (fallbackModel) {
      return {
        id: fallbackModel.id,
        title: fallbackModel.title,
        description: fallbackModel.shortDescription,
        type: '3d',
        modelType: fallbackModel.modelType,
        grade: fallbackModel.grade,
        subject: fallbackModel.subject,
        lessonId: fallbackModel.lessonId,
        status: 'published',
      };
    }

    return null;
  }

  public async getExperimentsByLabId(labId: string): Promise<Experiment[]> {
    const lab = await this.getLabById(labId);
    if (!lab) return [];

    return this.experiments.filter(
      (exp) => exp.labId === lab.id || exp.modelType === lab.modelType
    );
  }

  public async getLabsByLessonId(lessonId: string): Promise<LabMetadata[]> {
    return this.labs.filter((l) => l.lessonId === lessonId || l.id.includes(lessonId));
  }

  public async getAllPublishedLabs(): Promise<LabMetadata[]> {
    return this.labs.filter((l) => l.status === 'published');
  }

  public async saveLab(lab: LabMetadata): Promise<void> {
    const idx = this.labs.findIndex((l) => l.id === lab.id);
    if (idx >= 0) {
      this.labs[idx] = { ...lab, updatedAt: new Date().toISOString() };
    } else {
      this.labs.push({ ...lab, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }
  }

  public async saveExperiment(experiment: Experiment): Promise<void> {
    const idx = this.experiments.findIndex((e) => e.id === experiment.id);
    if (idx >= 0) {
      this.experiments[idx] = experiment;
    } else {
      this.experiments.push(experiment);
    }
  }
}

export const defaultLabDataAdapter = new LocalLabDataAdapter();
