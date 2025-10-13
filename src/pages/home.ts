import { initIntroText } from '$components/intro-text';

// Run on Webflow DOM ready
window.Webflow = window.Webflow || [];
window.Webflow.push(() => {
  initIntroText({ rotationMaxDeg: 2 });
});
