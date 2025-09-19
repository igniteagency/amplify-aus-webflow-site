/**
 * Intro Text: Letter-by-letter reveal (GSAP)
 *
 * Switches to a SplitText-like approach implemented in plain DOM:
 *  - Wraps non-whitespace characters in `.intro-char` spans
 *  - Animates their opacity with scrubbed stagger tied to scroll
 *  - For each `<strong>`, injects `.intro-strong-fill` and animates it in sync
 *
 * Why: This makes the timing of the strong background highly reliable because
 * it keys off the same per-letter timing as the text reveal.
 */

type IntroTextOptions = {
  sectionSelector?: string;
  textSelector?: string;
  start?: string; // ScrollTrigger start
  end?: string; // ScrollTrigger end
  scrub?: boolean | number; // scrub config
  rotationMaxDeg?: number; // random rotation range: -N..+N
};

// Tunables
const ROTATION_MAX_DEG = 6; // default random rotation range (+/- degrees)

export function initIntroText(options: IntroTextOptions = {}): void {
  const sectionSelector = options.sectionSelector ?? '.section_text-intro';
  const textSelector = options.textSelector ?? '.text-gradient-fill';

  const section = document.querySelector<HTMLElement>(sectionSelector);
  if (!section) return;

  const textEls = section.querySelectorAll<HTMLElement>(textSelector);
  if (!textEls.length) return;

  textEls.forEach((container) => {
    if (container.hasAttribute('data-intro-split')) return; // guard against duplicate runs
    container.setAttribute('data-intro-split', 'true');

    const fillClass = 'intro-strong-fill';
    const charClass = 'intro-char';

    // 1) Split into characters (non-whitespace only)
    const chars: HTMLElement[] = [];
    const splitNode = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.nodeValue ?? '';
        const frag = document.createDocumentFragment();
        for (const ch of text) {
          if (/\s/.test(ch)) {
            frag.appendChild(document.createTextNode(ch));
          } else {
            const span = document.createElement('span');
            span.className = charClass;
            span.textContent = ch;
            frag.appendChild(span);
            chars.push(span);
          }
        }
        node.parentNode?.replaceChild(frag, node);
        return;
      }
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        if (el.classList.contains(charClass) || el.classList.contains(fillClass)) return;
        Array.from(el.childNodes).forEach(splitNode);
      }
    };
    Array.from(container.childNodes).forEach(splitNode);

    if (!chars.length) return;

    // 2) Prepare <strong> fills and map to character indices
    const charIndex = new Map<HTMLElement, number>();
    chars.forEach((c, i) => charIndex.set(c, i));

    const strongs = container.querySelectorAll<HTMLElement>('strong');
    type StrongMap = {
      wrap: HTMLElement;
      fill: HTMLElement;
      startIdx: number;
      endIdx: number;
      rotation: number;
    };
    const strongMaps: StrongMap[] = [];

    strongs.forEach((strong) => {
      // Inject wrapper + fill elements to decouple rotation and scale origins
      const wrapClass = 'intro-strong-fill-wrap';
      let wrap = strong.querySelector<HTMLElement>(`.${wrapClass}`);
      let fill = strong.querySelector<HTMLElement>(`.${fillClass}`);
      if (!wrap) {
        wrap = document.createElement('span');
        wrap.className = wrapClass;
        wrap.setAttribute('aria-hidden', 'true');
        // Ensure the wrapper covers the strong so rotation is visible
        wrap.style.position = 'absolute';
        wrap.style.left = '0';
        wrap.style.top = '0';
        wrap.style.right = '0';
        wrap.style.bottom = '0';
        wrap.style.display = 'block';
        wrap.style.zIndex = '-1';
        // Create fill inside wrap if missing
        if (!fill) {
          fill = document.createElement('span');
          fill.className = fillClass;
        }
        // Ensure fill covers the wrapper so scaling/rotation are visible
        fill.style.position = 'absolute';
        fill.style.left = '0';
        fill.style.top = '0';
        fill.style.right = '0';
        fill.style.bottom = '0';
        wrap.appendChild(fill);
        strong.insertBefore(wrap, strong.firstChild);
      } else if (!fill) {
        // Wrap existed but fill missing
        fill = document.createElement('span');
        fill.className = fillClass;
        fill.style.position = 'absolute';
        fill.style.left = '0';
        fill.style.top = '0';
        fill.style.right = '0';
        fill.style.bottom = '0';
        wrap.appendChild(fill);
      }

      // Determine first and last character indices within this strong
      const innerChars = Array.from(strong.querySelectorAll<HTMLElement>(`.${charClass}`));
      if (!innerChars.length) return;
      const indices = innerChars.map((el) => charIndex.get(el) ?? 0).sort((a, b) => a - b);
      // Precompute a stable random rotation for this instance (-N..+N deg)
      const max = Math.max(0, options.rotationMaxDeg ?? ROTATION_MAX_DEG);
      const rotation = Math.round((Math.random() * 2 * max - max) * 10) / 10;
      strongMaps.push({
        wrap,
        fill,
        startIdx: indices[0],
        endIdx: indices[indices.length - 1],
        rotation,
      });
    });

    // Collect all strong characters for color animation and resolve colors
    const strongChars = Array.from(container.querySelectorAll<HTMLElement>(`strong .${charClass}`));
    const defaultColor = getComputedStyle(container).color;
    const tealVar = getComputedStyle(document.documentElement)
      .getPropertyValue('--_color---teal')
      .trim();
    const tealColor = tealVar || 'teal';

    // 3) Timeline with scrub: letter opacity + synced strong fill
    const each = 1 / Math.max(1, chars.length - 1);
    const charDur = Math.min(0.25, each * 2);

    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: container,
        start: options.start ?? 'top 85%', // earlier lead-in
        end: options.end ?? 'bottom 25%',
        scrub: options.scrub ?? true,
      },
    });

    gsap.set(chars, { opacity: 0.2 });
    gsap.set(strongs, { position: 'relative' });
    strongMaps.forEach(({ wrap, fill }) => {
      gsap.set(wrap, { rotation: 0, transformOrigin: 'center center', zIndex: -1 });
      gsap.set(fill, { scaleX: 0, transformOrigin: 'left center' });
    });
    if (strongChars.length) gsap.set(strongChars, { color: defaultColor });

    tl.to(chars, { opacity: 1, duration: charDur, stagger: { each, from: 'start' } }, 0);

    // Per-character color animation for strong text to match opacity timing
    strongChars.forEach((char) => {
      const idx = charIndex.get(char) ?? 0;
      const startTime = idx * each;
      tl.to(char, { color: tealColor, duration: charDur }, startTime);
    });

    strongMaps.forEach(({ wrap, fill, startIdx, endIdx, rotation }) => {
      const startTime = startIdx * each;
      const endTime = endIdx * each + charDur;
      const d = Math.max(0.0001, endTime - startTime);
      tl.to(fill, { scaleX: 1, duration: d }, startTime);
      tl.to(wrap, { rotation, transformOrigin: 'center center', duration: d }, startTime);
    });
  });
}
