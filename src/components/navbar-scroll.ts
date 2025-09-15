/**
 * Navbar hide-on-scroll
 * Adds `.is-scrolled` to `.navbar_container` when scrolling down,
 * removes it when scrolling up. Always shows at the very top.
 */

type Options = {
  selector?: string;
  threshold?: number; // pixels from top considered as "top"
  watchSelectors?: string; // sections that keep nav visible while in view
};

export function initNavbarScroll(options: Options = {}): void {
  const selector = options.selector ?? '.navbar_container';
  const threshold = Math.max(0, options.threshold ?? 10);
  const watchSelectors = options.watchSelectors ?? '.section_header, .section_hero';

  const nav = document.querySelector<HTMLElement>(selector);
  if (!nav) return;

  // Helpers to avoid redundant classList writes
  let isHidden = nav.classList.contains('is-scrolled');
  const show = () => {
    if (isHidden) {
      nav.classList.remove('is-scrolled');
      isHidden = false;
    }
  };
  const hide = () => {
    if (!isHidden) {
      nav.classList.add('is-scrolled');
      isHidden = true;
    }
  };

  // Visibility lock while watched sections are in view
  let lockCount = 0;
  const incLock = () => {
    lockCount += 1;
    show(); // ensure visible when any lock is active
  };
  const decLock = () => {
    lockCount = Math.max(0, lockCount - 1);
  };

  const watched = document.querySelectorAll(watchSelectors);
  watched.forEach((el) => {
    ScrollTrigger.create({
      trigger: el,
      start: 'top bottom', // when element enters viewport
      end: 'bottom 15%', // until element leaves viewport
      onToggle: (self) => (self.isActive ? incLock() : decLock()),
    });
  });

  // Initial state: if page loads scrolled beyond threshold, keep current state,
  // but ensure visible when at very top.
  if (window.scrollY <= threshold) show();

  // Create a single ScrollTrigger to react to direction changes across the page
  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate(self) {
      const y = window.scrollY || document.documentElement.scrollTop || 0;

      // Always show when near the very top
      if (y <= threshold) {
        show();
        return;
      }

      // Keep visible while any watched section is intersecting the viewport
      if (lockCount > 0) {
        show();
        return;
      }

      // Direction: 1 = down, -1 = up
      if (self.direction === 1) hide();
      else if (self.direction === -1) show();
    },
  });
}
