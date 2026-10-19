(() => {
  const hero = document.querySelector('#hero');
  const smoke = hero?.querySelector('.hero-smoke');
  if (!smoke) return;
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  smoke.append(canvas);
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;
  // Bake the soft texture once. Each frame only composites small cached sprites.
  const puff = document.createElement('canvas');
  puff.width = puff.height = 128;
  const pc = puff.getContext('2d');
  const gradient = pc.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, 'rgba(180,173,159,.28)');
  gradient.addColorStop(.35, 'rgba(164,158,146,.15)');
  gradient.addColorStop(1, 'rgba(150,143,132,0)');
  pc.fillStyle = gradient; pc.fillRect(0, 0, 128, 128);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let width = 1, height = 1, visible = true, ready = false;
  let frame = 0, previous = 0, time = 0;
  const count = 36;
  function resize() {
    const rect = hero.getBoundingClientRect();
    const scale = Math.min(1, 800 / rect.width, 650 / rect.height);
    width = canvas.width = Math.round(rect.width * scale);
    height = canvas.height = Math.round(rect.height * scale);
    draw();
  }
  function draw() {
    ctx.clearRect(0, 0, width, height);
    for (let i = 0; i < count; i++) {
      const lane = i % 3;
      const phase = ((i / count + time * (.045 + lane * .008)) % 1);
      const curl = phase * Math.PI * 3 + lane * 2.1;
      const x = width * (.15 + lane * .35 + Math.sin(curl + time * .2) * .14);
      const y = height * (1.22 - phase * 1.5);
      const size = width * (.20 + .17 * phase) + height * .09;
      const envelope = Math.sin(phase * Math.PI) ** 2;
      // Keep the center quieter so the gold identity stays crisp.
      const center = Math.abs(x / width - .5) < .19 ? .45 : 1;
      ctx.globalAlpha = envelope * center * .48;
      ctx.drawImage(puff, x - size / 2, y - size / 2, size, size * .65);
    }
    ctx.globalAlpha = 1;
  }
  function tick(now) {
    frame = 0;
    if (!ready || !visible || document.hidden || reduced.matches) return;
    if (!previous) previous = now;
    const dt = now - previous;
    // 30 fps at a bounded canvas resolution, independent of screen pixel density.
    if (dt >= 1000 / 30) {
      time += Math.min(dt, 80) / 1000;
      previous = now;
      draw();
    }
    frame = requestAnimationFrame(tick);
  }
  function sync() {
    cancelAnimationFrame(frame); frame = 0; previous = 0;
    const paused = !ready || !visible || document.hidden || reduced.matches;
    smoke.classList.toggle('is-paused', paused);
    if (!paused) frame = requestAnimationFrame(tick);
    else if (reduced.matches) draw();
  }
  function reveal() { ready = true; smoke.classList.add('is-ready'); sync(); }
  const preloader = document.querySelector('#pre');
  if (!preloader || preloader.classList.contains('done')) reveal();
  else {
    const opening = new MutationObserver(() => {
      if (preloader.classList.contains('done') || !preloader.isConnected) {
        reveal(); opening.disconnect();
      }
    });
    opening.observe(preloader, { attributes: true, attributeFilter: ['class'] });
    opening.observe(preloader.parentNode, { childList: true });
  }
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); }).observe(hero);
  document.addEventListener('visibilitychange', sync);
  reduced.addEventListener('change', sync);
  new ResizeObserver(resize).observe(hero);
  resize();
})();
