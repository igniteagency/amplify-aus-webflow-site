export function initLoader(): void {
  const circleA = document.querySelector('#circle-a');
  const clipAUse = document.querySelector('#clipA > use'); // A in clip
  const circleB = document.querySelector('#circle-b');
  const intersection = document.querySelector('#intersection'); // visible purple B
  const maskB = document.querySelector('#intersectMask g g use'); // B inside mask
  const wrapper = document.querySelector('.loader-wrapper'); // wrapper element

  // Ensure required elements exist before running
  if (!wrapper || !circleA || !clipAUse || !circleB || !intersection || !maskB) return;

  // Tunables
  const OFF = 110; // off-screen
  const MEET = 72; // main meet position

  const moveInDur = 1.2;
  const outDur = 2.5;
  const BG_END_OFFSET = -1.5; // seconds from timeline end; >0 after, <0 before

  // Initial state
  gsap.set([circleA, clipAUse], { attr: { y: -OFF } });
  gsap.set([circleB, intersection, maskB], { attr: { y: OFF } });

  const tl = gsap.timeline({ delay: 2, defaults: { overwrite: 'auto' } });
  const bgPos = BG_END_OFFSET >= 0 ? `+=${BG_END_OFFSET}` : `-=${Math.abs(BG_END_OFFSET)}`;

  // SLIDE IN to ±MEET
  tl.to([circleA, clipAUse], { attr: { y: -MEET }, duration: moveInDur, ease: 'back.out(1.5)' }, 0)
    .to(
      [circleB, intersection, maskB],
      { attr: { y: MEET }, duration: moveInDur, ease: 'back.out(1.5)' },
      0
    )

    // SLIDE OUT to opposite sides (cross through)
    .to([circleA, clipAUse], { attr: { y: OFF }, duration: outDur, ease: 'expo.inOut' }, '>')
    .to(
      [circleB, intersection, maskB],
      { attr: { y: -OFF }, duration: outDur, ease: 'expo.inOut' },
      '<'
    )

    // Background change tied to end of timeline (adjust with BG_END_OFFSET)
    .to(wrapper, { backgroundColor: 'transparent', duration: 0 }, bgPos)

    // HIDE WRAPPER completely at the very end
    .set(wrapper, { display: 'none' });
}
