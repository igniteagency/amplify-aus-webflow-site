import { initIntroText } from '$components/intro-text';
import { initLoader } from '$components/loader';

// Run on Webflow DOM ready
window.Webflow = window.Webflow || [];
window.Webflow.push(() => {
  initLoader();
  initIntroText({ rotationMaxDeg: 6 });
});
