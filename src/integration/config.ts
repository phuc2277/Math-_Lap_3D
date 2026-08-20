/**
 * Cấu hình kết nối và Domain Whitelist giữa Website Chính và Math Lab
 * Website chính: https://luyen-de-ket-noi-tri-thuc.onrender.com/
 * Tác giả: Thầy giáo Nguyễn Quang Phúc - Trường THCS Hưng Bình, Nghệ An
 */

export const INTEGRATION_CONFIG = {
  allowedOrigins: [
    'https://luyen-de-ket-noi-tri-thuc.onrender.com',
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:8080',
    'https://ais-dev-ec5wbqxrjltdgn3ect6kfk-1401565628.asia-east1.run.app',
    'https://ais-pre-ec5wbqxrjltdgn3ect6kfk-1401565628.asia-east1.run.app'
  ],
  allowedParentOrigins: [
    'https://luyen-de-ket-noi-tri-thuc.onrender.com',
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:8080',
    'https://ais-dev-ec5wbqxrjltdgn3ect6kfk-1401565628.asia-east1.run.app',
    'https://ais-pre-ec5wbqxrjltdgn3ect6kfk-1401565628.asia-east1.run.app'
  ],
  defaultReturnUrl: 'https://luyen-de-ket-noi-tri-thuc.onrender.com/bai-hoc',
  postMessageProtocolVersion: '1.0.0',
};

export const MAIN_WEBSITE_CONFIG = {
  name: 'Luyện đề Kết nối tri thức',
  domain: 'luyen-de-ket-noi-tri-thuc.onrender.com',
  baseUrl: 'https://luyen-de-ket-noi-tri-thuc.onrender.com',
  loginPath: '/dang-nhap',
  lessonsPath: '/bai-hoc',
  ssoAuthEndpoint: 'https://luyen-de-ket-noi-tri-thuc.onrender.com/api/sso/verify-ticket',
  allowedOrigins: INTEGRATION_CONFIG.allowedOrigins,
};

/**
 * Kiểm tra xem một origin có thuộc danh sách an toàn hay không
 */
export function isAllowedOrigin(origin: string): boolean {
  if (!origin) return false;
  return INTEGRATION_CONFIG.allowedOrigins.some(allowed => {
    if (allowed === origin) return true;
    try {
      const allowedUrl = new URL(allowed);
      const testUrl = new URL(origin);
      return allowedUrl.hostname === testUrl.hostname;
    } catch {
      return false;
    }
  });
}

/**
 * Tạo URL quay lại bài học hợp lệ trên website chính
 */
export function buildReturnUrl(lessonId?: string, fallbackPath: string = '/bai-hoc'): string {
  if (!lessonId) {
    return `${MAIN_WEBSITE_CONFIG.baseUrl}${fallbackPath}`;
  }
  return `${MAIN_WEBSITE_CONFIG.baseUrl}/bai-hoc/${encodeURIComponent(lessonId)}`;
}
