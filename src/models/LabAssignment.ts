export type AssignmentTargetType = 'class' | 'group' | 'all';
export type AssignmentStatus = 'draft' | 'published' | 'closed' | 'archived';
export type ScoringMode = 'none' | 'completion' | 'points';

export interface LabAssignment {
  id: string;
  labId: string;
  experimentId: string;
  lessonId?: string;
  title: string;
  instructions?: string;
  targetType: AssignmentTargetType;
  targetId?: string; // e.g. "class-9A"
  targetName?: string; // e.g. "Lớp 9A"
  createdBy: string; // teacherId
  createdByName?: string;
  startAt?: string;
  dueAt?: string;
  status: AssignmentStatus;
  allowRetake?: boolean;
  maxAttempts?: number | null; // null = unlimited
  scoringMode?: ScoringMode;
  totalPossiblePoints?: number;
  showAnswersAfterSubmit?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export const SAMPLE_ASSIGNMENTS: LabAssignment[] = [
  {
    id: 'assignment-001',
    labId: 'cylinder-001',
    experimentId: 'exp-cylinder-01',
    lessonId: 'lop9-hinh-tru',
    title: 'Khám phá thể tích hình trụ',
    instructions: 'Thực hiện 4 bước thí nghiệm, quan sát sự thay đổi thể tích khi biến đổi bán kính r và chiều cao h.',
    targetType: 'class',
    targetId: 'class-9A',
    targetName: 'Lớp 9A',
    createdBy: 'teacher-01',
    createdByName: 'Thầy Nguyễn Văn A',
    startAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    dueAt: new Date(Date.now() + 86400000 * 5).toISOString(),
    status: 'published',
    allowRetake: true,
    maxAttempts: 3,
    scoringMode: 'points',
    totalPossiblePoints: 10,
    showAnswersAfterSubmit: true,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'assignment-002',
    labId: 'cone-001',
    experimentId: 'exp-cone-01',
    lessonId: 'lop9-hinh-non',
    title: 'Thí nghiệm mối liên hệ Pythagoras trong hình nón',
    instructions: 'Quan sát đường sinh l = √(r² + h²). So sánh thể tích hình nón và thể tích hình trụ có cùng bán kính và chiều cao.',
    targetType: 'class',
    targetId: 'class-9A',
    targetName: 'Lớp 9A',
    createdBy: 'teacher-01',
    createdByName: 'Thầy Nguyễn Văn A',
    startAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    dueAt: new Date(Date.now() + 86400000 * 7).toISOString(),
    status: 'published',
    allowRetake: true,
    maxAttempts: 2,
    scoringMode: 'points',
    totalPossiblePoints: 10,
    showAnswersAfterSubmit: true,
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: 'assignment-003',
    labId: 'cuboid-001',
    experimentId: 'exp-cuboid-01',
    lessonId: 'lop8-hinh-hop-chu-nhat',
    title: 'Khai triển và tính diện tích toàn phần hình hộp chữ nhật',
    instructions: 'Sử dụng công cụ khai triển 3D để kiểm tra các mặt phẳng trải phẳng và trả lời các câu hỏi.',
    targetType: 'class',
    targetId: 'class-8B',
    targetName: 'Lớp 8B',
    createdBy: 'teacher-01',
    createdByName: 'Thầy Nguyễn Văn A',
    startAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    dueAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    status: 'published',
    allowRetake: false,
    maxAttempts: 1,
    scoringMode: 'completion',
    totalPossiblePoints: 10,
    showAnswersAfterSubmit: true,
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
];
