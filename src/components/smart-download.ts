/**
 * Smart Download: Attribute-targeted click handler
 *
 * Usage:
 * - Add `[data-smart-download]` to any clickable element (e.g., button or link).
 * - Optionally add platform-specific targets via:
 *     - `data-ios="https://..."`
 *     - `data-android="https://..."`
 *     - `data-web="https://..."` (recommended default for desktop/web)
 * - On click, navigates to the best target for the current platform.
 *
 * Desktop behavior: if neither iOS nor Android are detected, only `data-web`
 * is used; otherwise falls back to '/'. This prevents Play Store on desktop.
 */

const ATTR_TRIGGER = 'data-smart-download';
const ATTR_IOS = 'data-ios';
const ATTR_ANDROID = 'data-android';
const ATTR_WEB = 'data-web';
const ATTR_DESKTOP = 'data-desktop'; // alias for data-web (legacy support)

function isIOS(): boolean {
  const ua = navigator.userAgent || '';
  const platform = navigator.platform || '';
  const uaData = (navigator as any).userAgentData;
  const chPlatform = uaData?.platform?.toLowerCase?.() as string | undefined;
  if (chPlatform) return /ios|ipados/.test(chPlatform);
  const iOSPlatforms = ['iPhone', 'iPad', 'iPod'];
  const iPadOnIOS13Plus = platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  return (
    iOSPlatforms.some((p) => platform.includes(p)) || /iPad|iPhone|iPod/.test(ua) || iPadOnIOS13Plus
  );
}

function isAndroid(): boolean {
  const ua = navigator.userAgent || '';
  const platform = navigator.platform || '';
  const uaHasAndroid = /Android/i.test(ua);

  // Prefer Client Hints platform when available (Chromium, some WebKit)
  const uaData = (navigator as any).userAgentData;
  const chPlatform = uaData?.platform?.toLowerCase?.() as string | undefined;
  if (chPlatform) {
    if (chPlatform === 'android') return true;
    // If CH platform is something else (macOS, Windows, etc.), treat as not Android
    return false;
  }

  // Fallback heuristic: require UA says Android, exclude desktop OS tokens, and require touch
  const isDesktopOS = /Macintosh|Windows NT|CrOS/i.test(ua) || /Mac|Win|CrOS/i.test(platform);
  const hasTouch = navigator.maxTouchPoints > 0 || 'ontouchstart' in window;
  return uaHasAndroid && !isDesktopOS && hasTouch;
}

type Platform = 'ios' | 'android' | 'other';

function detectPlatform(): Platform {
  if (isIOS()) return 'ios';
  if (isAndroid()) return 'android';
  return 'other';
}

function detectOSName(): string {
  const uaData = (navigator as any).userAgentData;
  const chPlatform = (uaData?.platform || '').toLowerCase();
  if (chPlatform) {
    if (chPlatform.includes('ios') || chPlatform.includes('ipados')) return 'iOS';
    if (chPlatform.includes('android')) return 'Android';
    if (chPlatform.includes('mac')) return 'macOS';
    if (chPlatform.includes('win')) return 'Windows';
    if (chPlatform.includes('cros')) return 'ChromeOS';
    if (chPlatform.includes('linux')) return 'Linux';
  }
  const app = navigator.appVersion || navigator.userAgent || '';
  if (app.indexOf('Win') !== -1) return 'Windows';
  if (app.indexOf('Mac') !== -1) return 'macOS';
  if (app.indexOf('iPhone') !== -1 || app.indexOf('iPad') !== -1 || app.indexOf('iPod') !== -1)
    return 'iOS';
  if (app.indexOf('Android') !== -1) return 'Android';
  if (app.indexOf('CrOS') !== -1) return 'ChromeOS';
  if (app.indexOf('Linux') !== -1) return 'Linux';
  return 'Unknown';
}

function pickTarget(btn: Element): { href?: string; platform: Platform } {
  const ios = btn.getAttribute(ATTR_IOS) || undefined;
  const android = btn.getAttribute(ATTR_ANDROID) || undefined;
  const web = btn.getAttribute(ATTR_WEB) || btn.getAttribute(ATTR_DESKTOP) || undefined;

  const platform = detectPlatform();

  if (platform === 'ios' && ios) return { href: ios, platform };
  if (platform === 'android' && android) return { href: android, platform };

  // Desktop/other: prefer explicit web; do NOT fall back to stores
  // If no web target provided, return undefined href to allow anchor/default
  return { href: web || undefined, platform };
}

let initialized = false;
export function initSmartDownload(): void {
  if (initialized) return;
  initialized = true;

  // Log detected platform on init (page load) with a bit more context
  const detected = detectPlatform();
  const osName = detectOSName();
  const uaData = (navigator as any).userAgentData;
  console.log('[smart-download] platform detected:', detected, {
    osName,
    uaHasAndroid: /Android/i.test(navigator.userAgent || ''),
    mobileCH: uaData?.mobile,
    platform: navigator.platform,
    chPlatform: uaData?.platform,
    maxTouchPoints: navigator.maxTouchPoints,
  });

  document.addEventListener('click', (e) => {
    const target = e.target as Element | null;
    if (!target) return;
    const btn = target.closest(`[${ATTR_TRIGGER}]`);
    if (!btn) return;

    // Determine chosen URL
    const { href } = pickTarget(btn);

    // Respect target behavior and modifier keys
    const anchor = (btn as HTMLElement).matches?.('a[href]')
      ? (btn as HTMLAnchorElement)
      : (btn.querySelector('a[href]') as HTMLAnchorElement | null);
    const targetAttr = anchor?.getAttribute('target') || btn.getAttribute('target');
    const mouse = e as MouseEvent;
    const openInNew =
      targetAttr === '_blank' || (mouse && (mouse.metaKey || mouse.ctrlKey || mouse.button === 1));

    // If no computed href, try to fall back to anchor's own href. If still none, do nothing.
    let finalHref = href || anchor?.getAttribute('href') || undefined;
    // Treat empty, '#' or 'javascript:' as no-op fallbacks
    if (finalHref) {
      const trimmed = finalHref.trim();
      if (!trimmed || trimmed === '#' || trimmed.toLowerCase().startsWith('javascript:')) {
        finalHref = undefined;
      }
    }
    if (!finalHref) return;
    if (!finalHref) return;

    e.preventDefault();

    if (openInNew) window.open(finalHref, '_blank', 'noopener,noreferrer');
    else window.location.assign(finalHref);
  });
}
