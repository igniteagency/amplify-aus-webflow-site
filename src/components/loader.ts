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
  const OFF = 100; // off-screen
  const MEET = 50; // main meet position
  const NUDGE = 8; // inward nudge distance

  const moveInDur = 1.2;
  const nudgeDur = 0.28;
  const outDur = 1.0;

  // Initial state
  gsap.set([circleA, clipAUse], { attr: { y: -OFF } });
  gsap.set([circleB, intersection, maskB], { attr: { y: OFF } });

  const tl = gsap.timeline({ delay: 2, defaults: { overwrite: 'auto' } });

  // SLIDE IN to ±MEET
  tl.to([circleA, clipAUse], { attr: { y: -MEET }, duration: moveInDur, ease: 'back.out(1.18)' }, 0)
    .to(
      [circleB, intersection, maskB],
      { attr: { y: MEET }, duration: moveInDur, ease: 'back.out(1.18)' },
      0
    )

    // NUDGE closer together
    .addLabel('nudge')
    .to(
      [circleA, clipAUse],
      { attr: { y: -(MEET - NUDGE) }, duration: nudgeDur, ease: 'power1.inOut' },
      'nudge'
    )
    .to(
      [circleB, intersection, maskB],
      { attr: { y: MEET - NUDGE }, duration: nudgeDur, ease: 'power1.inOut' },
      'nudge'
    )

    // Background change with slight delay into the nudge
    .to(wrapper, { backgroundColor: 'transparent', duration: 0 }, 'nudge+=0.15')

    // SLIDE OUT to ±OFF
    .to([circleA, clipAUse], { attr: { y: -OFF }, duration: outDur, ease: 'power2.in' }, '>')
    .to(
      [circleB, intersection, maskB],
      { attr: { y: OFF }, duration: outDur, ease: 'power2.in' },
      '<'
    )

    // HIDE WRAPPER completely at the very end
    .set(wrapper, { display: 'none' });
}
