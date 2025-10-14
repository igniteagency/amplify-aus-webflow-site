"use strict";(()=>{
  const ATTR_TRIGGER = "data-smart-download";
  const ATTR_IOS = "data-ios";
  const ATTR_ANDROID = "data-android";
  const ATTR_WEB = "data-web";
  const ATTR_DESKTOP = "data-desktop"; // alias

  function isIOS() {
    const ua = navigator.userAgent || "";
    const platform = navigator.platform || "";
    const uaData = navigator.userAgentData || {};
    const chPlatform = (uaData.platform || "").toLowerCase();
    if (chPlatform) return /ios|ipados/.test(chPlatform);
    const iOSPlatforms = ["iPhone", "iPad", "iPod"];
    const iPadOnIOS13Plus = platform === "MacIntel" && navigator.maxTouchPoints > 1;
    return iOSPlatforms.some(p => platform.includes(p)) || /iPad|iPhone|iPod/.test(ua) || iPadOnIOS13Plus;
  }

  function isAndroid() {
    const ua = navigator.userAgent || "";
    const platform = navigator.platform || "";
    const uaData = navigator.userAgentData || {};
    const chPlatform = (uaData.platform || "").toLowerCase();
    if (chPlatform) {
      if (chPlatform === 'android') return true;
      return false;
    }
    const uaHasAndroid = /Android/i.test(ua);
    const isDesktopOS = /Macintosh|Windows NT|CrOS/i.test(ua) || /Mac|Win|CrOS/i.test(platform);
    const hasTouch = navigator.maxTouchPoints > 0 || "ontouchstart" in window;
    return uaHasAndroid && !isDesktopOS && hasTouch;
  }

  function detectPlatform() {
    if (isIOS()) return "ios";
    if (isAndroid()) return "android";
    return "other";
  }

  function pickTarget(btn) {
    const ios = btn.getAttribute(ATTR_IOS) || undefined;
    const android = btn.getAttribute(ATTR_ANDROID) || undefined;
    const web = btn.getAttribute(ATTR_WEB) || btn.getAttribute(ATTR_DESKTOP) || undefined;
    const platform = detectPlatform();
    if (platform === "ios" && ios) return { href: ios, platform };
    if (platform === "android" && android) return { href: android, platform };
    if (platform === "other" && web) return { href: web, platform };
    return { href: undefined, platform };
  }

  let initialized = false;
  function initSmartDownload() {
    if (initialized) return;
    initialized = true;

    const uaData = navigator.userAgentData || {};
    const detected = detectPlatform();
    const osName = (function(){
      const uaData = navigator.userAgentData || {};
      const chp = (uaData.platform || '').toLowerCase();
      if (chp) {
        if (chp.includes('ios') || chp.includes('ipados')) return 'iOS';
        if (chp.includes('android')) return 'Android';
        if (chp.includes('mac')) return 'macOS';
        if (chp.includes('win')) return 'Windows';
        if (chp.includes('cros')) return 'ChromeOS';
        if (chp.includes('linux')) return 'Linux';
      }
      const app = navigator.appVersion || navigator.userAgent || '';
      if (app.indexOf('Win') !== -1) return 'Windows';
      if (app.indexOf('Mac') !== -1) return 'macOS';
      if (app.indexOf('iPhone') !== -1 || app.indexOf('iPad') !== -1 || app.indexOf('iPod') !== -1) return 'iOS';
      if (app.indexOf('Android') !== -1) return 'Android';
      if (app.indexOf('CrOS') !== -1) return 'ChromeOS';
      if (app.indexOf('Linux') !== -1) return 'Linux';
      return 'Unknown';
    })();
    console.log('[smart-download] platform detected:', detected, {
      osName,
      uaHasAndroid: /Android/i.test(navigator.userAgent || ''),
      mobileCH: uaData && typeof uaData.mobile === 'boolean' ? uaData.mobile : undefined,
      platform: navigator.platform,
      chPlatform: uaData.platform,
      maxTouchPoints: navigator.maxTouchPoints,
    });

    document.addEventListener('click', (e) => {
      const target = e.target;
      if (!target) return;
      const btn = target.closest(`[${ATTR_TRIGGER}]`);
      if (!btn) return;

      const picked = pickTarget(btn);
      const anchor = btn.matches && btn.matches('a[href]') ? btn : btn.querySelector('a[href]');
      let href = picked.href || (anchor ? anchor.getAttribute('href') : undefined);
      if (href) {
        const trimmed = href.trim();
        if (!trimmed || trimmed === '#' || trimmed.toLowerCase().startsWith('javascript:')) {
          href = undefined;
        }
      }
      if (!href) return; // nothing to do

      const targetAttr = (anchor && anchor.getAttribute('target')) || btn.getAttribute('target');
      const mouse = e;
      const openInNew = targetAttr === '_blank' || (mouse && (mouse.metaKey || mouse.ctrlKey || mouse.button === 1));

      e.preventDefault();
      if (openInNew) window.open(href, '_blank', 'noopener,noreferrer');
      else window.location.assign(href);
    });
  }

  initSmartDownload();
})();
