import { IntegrationContext, IntegrationSource, DisplayMode, UserRole } from '../models/Lab';
import { sanitizeReturnUrl } from './returnUrl';

/**
 * Parses integration context from current URL query parameters and hash routes.
 * Examples:
 *  - /lab/lab-cylinder-001?source=teacher&mode=presentation
 *  - /?lab=cylinder-001&lessonId=lop9-hinh-tru&source=lesson&returnUrl=/lessons
 */
export function parseIntegrationContext(): IntegrationContext {
  const searchParams = new URLSearchParams(window.location.search);

  // Extract labId from query or hash
  let labId = searchParams.get('labId') || searchParams.get('lab') || '';
  
  if (!labId) {
    const hash = window.location.hash;
    if (hash.startsWith('#lab/')) {
      labId = hash.replace('#lab/', '');
    } else if (hash.startsWith('#/lab/')) {
      labId = hash.replace('#/lab/', '');
    }
  }

  // Pathname routing support: /lab/:labId
  const pathParts = window.location.pathname.split('/').filter(Boolean);
  if (pathParts.length >= 2 && pathParts[0] === 'lab') {
    labId = pathParts[1];
  }

  // Parse lesson & experiment IDs
  const lessonId = searchParams.get('lessonId') || searchParams.get('lesson') || undefined;
  const experimentId = searchParams.get('experimentId') || searchParams.get('experiment') || undefined;

  // Source mode
  const rawSource = searchParams.get('source')?.toLowerCase();
  let source: IntegrationSource = 'direct';
  if (rawSource === 'teacher' || rawSource === 'student' || rawSource === 'lesson' || rawSource === 'preview') {
    source = rawSource;
  } else if (lessonId) {
    source = 'lesson';
  }

  // Display mode
  const rawMode = searchParams.get('mode')?.toLowerCase();
  const mode: DisplayMode = rawMode === 'presentation' ? 'presentation' : 'normal';

  // User role & info
  const rawRole = searchParams.get('role')?.toLowerCase();
  const userRole: UserRole = rawRole === 'teacher' || source === 'teacher' ? 'teacher' : 'student';
  const userId = searchParams.get('userId') || undefined;
  const userName = searchParams.get('userName') || undefined;
  const classId = searchParams.get('classId') || undefined;

  // Safe Return URL
  const returnUrl = sanitizeReturnUrl(searchParams.get('returnUrl')) || undefined;

  return {
    labId: labId || 'cylinder-001', // Fallback default lab
    lessonId,
    experimentId,
    source,
    mode,
    returnUrl,
    userContext: {
      userId,
      userRole,
      userName,
      classId,
    },
  };
}

/**
 * Builds a shareable deep-link URL for a given Lab with integration parameters
 */
export function buildLabDeepLink(options: {
  labId: string;
  lessonId?: string;
  experimentId?: string;
  source?: IntegrationSource;
  mode?: DisplayMode;
  returnUrl?: string;
}): string {
  const baseUrl = `${window.location.origin}${window.location.pathname}`;
  const params = new URLSearchParams();

  params.set('lab', options.labId);
  if (options.lessonId) params.set('lessonId', options.lessonId);
  if (options.experimentId) params.set('experiment', options.experimentId);
  if (options.source && options.source !== 'direct') params.set('source', options.source);
  if (options.mode && options.mode !== 'normal') params.set('mode', options.mode);
  if (options.returnUrl) params.set('returnUrl', options.returnUrl);

  return `${baseUrl}?${params.toString()}`;
}
