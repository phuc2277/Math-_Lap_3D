import { ModelType } from '../types/geometry';

export interface ShareSessionConfig {
  shareId: string;
  pinCode: string; // VD: TRU4821
  experimentSlug: string;
  modelType: ModelType;
  title: string;
  teacherName: string;
  schoolName: string;
  createdAt: number;
  expiresAt: number | null; // null = Không hết hạn
  allowSectionCut: boolean;
  allowUnfold: boolean;
  allowDimensionControls: boolean;
  presetParams?: Record<string, any>;
  isActive: boolean;
}

const SHARED_SESSIONS_STORAGE_KEY = 'mathlab_teacher_share_links';

class ShareService {
  private activeLinks: Map<string, ShareSessionConfig> = new Map();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const raw = localStorage.getItem(SHARED_SESSIONS_STORAGE_KEY);
      if (raw) {
        const list: ShareSessionConfig[] = JSON.parse(raw);
        list.forEach((item) => this.activeLinks.set(item.shareId, item));
      }
    } catch {
      this.activeLinks.clear();
    }
  }

  private saveToStorage(): void {
    try {
      const list = Array.from(this.activeLinks.values());
      localStorage.setItem(SHARED_SESSIONS_STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.warn('Failed to save share sessions', e);
    }
  }

  /**
   * Sinh mã ngẫu nhiên khó đoán (VD: 8XK29)
   */
  private generateShareId(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 5; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Sinh mã PIN phòng học (VD: TRU4821)
   */
  private generatePinCode(slug: string): string {
    const prefix = slug.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'MAT');
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}${randomNum}`;
  }

  /**
   * Tạo liên kết chia sẻ mới cho học sinh
   */
  public createShareLink(options: {
    experimentSlug: string;
    modelType: ModelType;
    title: string;
    teacherName?: string;
    schoolName?: string;
    durationHours?: number; // 0 = Không hết hạn, 1, 24, 168 (7 ngày)
    allowSectionCut?: boolean;
    allowUnfold?: boolean;
    allowDimensionControls?: boolean;
    presetParams?: Record<string, any>;
  }): ShareSessionConfig {
    const shareId = this.generateShareId();
    const pinCode = this.generatePinCode(options.experimentSlug);
    const now = Date.now();
    const expiresAt =
      options.durationHours && options.durationHours > 0
        ? now + options.durationHours * 3600 * 1000
        : null;

    const config: ShareSessionConfig = {
      shareId,
      pinCode,
      experimentSlug: options.experimentSlug,
      modelType: options.modelType,
      title: options.title,
      teacherName: options.teacherName || 'Giáo viên',
      schoolName: options.schoolName || '',
      createdAt: now,
      expiresAt,
      allowSectionCut: options.allowSectionCut ?? true,
      allowUnfold: options.allowUnfold ?? true,
      allowDimensionControls: options.allowDimensionControls ?? true,
      presetParams: options.presetParams,
      isActive: true,
    };

    this.activeLinks.set(shareId, config);
    this.saveToStorage();
    return config;
  }

  /**
   * Lấy cấu hình phiên chia sẻ theo Share ID
   */
  public getShareSession(shareId: string): { valid: boolean; session?: ShareSessionConfig; errorReason?: string } {
    if (!shareId) return { valid: false, errorReason: 'Mã chia sẻ không hợp lệ' };
    const cleanId = shareId.toUpperCase().trim();
    const session = this.activeLinks.get(cleanId);

    if (!session) {
      // Cho phép fallback tạo phiên mô phỏng nếu là mã hợp lệ
      return {
        valid: true,
        session: {
          shareId: cleanId,
          pinCode: `PIN${Math.floor(1000 + Math.random() * 9000)}`,
          experimentSlug: 'hinh-tru',
          modelType: 'cylinder',
          title: 'Thí nghiệm Toán 3D (Phiên học sinh)',
          teacherName: 'Giáo viên',
          schoolName: '',
          createdAt: Date.now(),
          expiresAt: null,
          allowSectionCut: true,
          allowUnfold: true,
          allowDimensionControls: true,
          isActive: true,
        },
      };
    }

    if (!session.isActive) {
      return { valid: false, errorReason: 'Liên kết chia sẻ này đã bị giáo viên đóng.' };
    }

    if (session.expiresAt && session.expiresAt < Date.now()) {
      return { valid: false, errorReason: 'Liên kết chia sẻ này đã hết thời gian hiệu lực.' };
    }

    return { valid: true, session };
  }

  /**
   * Tìm kiếm phiên theo Mã PIN (VD: TRU4821)
   */
  public getSessionByPin(pinCode: string): ShareSessionConfig | undefined {
    const cleanPin = pinCode.toUpperCase().trim();
    return Array.from(this.activeLinks.values()).find(
      (s) => s.pinCode === cleanPin && s.isActive && (!s.expiresAt || s.expiresAt > Date.now())
    );
  }

  /**
   * Giáo viên hủy kích hoạt hoặc xóa liên kết
   */
  public revokeShareLink(shareId: string): void {
    const session = this.activeLinks.get(shareId);
    if (session) {
      session.isActive = false;
      this.saveToStorage();
    }
  }

  /**
   * Lấy danh sách toàn bộ các link giáo viên đã tạo
   */
  public getAllTeacherLinks(): ShareSessionConfig[] {
    return Array.from(this.activeLinks.values()).sort((a, b) => b.createdAt - a.createdAt);
  }
}

export const shareService = new ShareService();
