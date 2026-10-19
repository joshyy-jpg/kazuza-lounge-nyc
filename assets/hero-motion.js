/* Scroll-linked geometry: native scrolling, eased motion, no continuous idle loop. */
(() => {
  const hero = document.querySelector('#hero');
  const shapes = [...document.querySelectorAll('.hero-geometry i')];
  if (!hero || !shapes.length) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const tracks = [
    [24, 0.12, -12, -16], [-18, 0.08, 14, -10],
    [32, 0.16, 8, -22], [-24, 0.10, -16, 10],
    [18, 0.14, 12, 16], [-30, 0.18, -10, -8]
  ];
  let current = 0, target = 0, frame = 0, lastTime = 0;
  function paint(progress) {
    const mobile = innerWidth < 600 ? 0.65 : 1;
    shapes.forEach((shape, i) => {
      const [rotation, growth, x, y] = tracks[i % tracks.length];
      shape.style.setProperty('--scroll-turn', `${rotation * progress * mobile}deg`);
      shape.style.setProperty('--scroll-scale', 1 + growth * progress * mobile);
      shape.style.setProperty('--scroll-x', `${x * progress * mobile}px`);
      shape.style.setProperty('--scroll-y', `${y * progress * mobile}px`);
    });
  }
  function tick(time) {
    const dt = lastTime ? Math.min(time - lastTime, 64) : 16;
    lastTime = time;
    current += (target - current) * (1 - Math.exp(-dt / 170));
    if (Math.abs(target - current) < 0.0002) current = target;
    paint(current);
    if (current !== target) frame = requestAnimationFrame(tick);
    else { frame = 0; lastTime = 0; }
  }
  function update() {
    if (reduced.matches) {
      cancelAnimationFrame(frame);
      frame = 0; lastTime = 0; current = target = 0;
      paint(0);
      return;
    }
    const rect = hero.getBoundingClientRect();
    target = Math.max(0, Math.min(1, -rect.top / Math.max(1, rect.height)));
    if (!frame) frame = requestAnimationFrame(tick);
  }
  addEventListener('scroll', update, { passive: true });
  addEventListener('resize', update, { passive: true });
  addEventListener('pageshow', update);
  reduced.addEventListener('change', update);
  update();
})();
