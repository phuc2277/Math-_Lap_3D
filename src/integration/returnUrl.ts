import { INTEGRATION_CONFIG } from './config';

/**
 * Validates a returnUrl query parameter to prevent open-redirect security vulnerabilities.
 * Allows relative paths (e.g., "/lessons") or URLs matching whitelisted parent origins.
 */
export function sanitizeReturnUrl(returnUrl?: string | null): string | null {
  if (!returnUrl) return null;

  const trimmed = returnUrl.trim();
  if (!trimmed) return null;

  // Allow relative URLs starting with '/' but not '//' (protocol-relative redirect exploit)
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return trimmed;
  }

  try {
    const url = new URL(trimmed);

    // Verify protocol is http or https
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      console.warn('[Security] Rejected non-HTTP returnUrl protocol:', url.protocol);
      return null;
    }

    // Check if origin is in allowed parent origins list
    const isAllowed = INTEGRATION_CONFIG.allowedParentOrigins.some(
      (origin) => origin === url.origin
    );

    if (isAllowed) {
      return url.toString();
    }

    console.warn('[Security] Rejected unauthorized returnUrl domain:', url.origin);
    return null;
  } catch (e) {
    console.warn('[Security] Invalid returnUrl format:', trimmed);
    return null;
  }
}

/**
 * Safely redirects the browser to returnUrl or executes fallback
 */
export function navigateToReturnUrl(returnUrl?: string | null, fallbackPath: string = '/'): void {
  const safeUrl = sanitizeReturnUrl(returnUrl);
  if (safeUrl) {
    if (safeUrl.startsWith('/')) {
      window.location.href = `${window.location.origin}${safeUrl}`;
    } else {
      window.location.href = safeUrl;
    }
  } else {
    window.location.href = `${window.location.origin}${fallbackPath}`;
  }
}
