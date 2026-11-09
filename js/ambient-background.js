const wrapper = document.querySelector('.insight-gallery-unified');

if (wrapper) {
  const glow = document.createElement('div');
  glow.className = 'insight-gallery-cursor-glow';
  glow.setAttribute('aria-hidden', 'true');
  wrapper.prepend(glow);

  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const glowSize = 500;
  let x = 0;
  let y = 0;
  let targetX = 0;
  let targetY = 0;
  let frame = 0;
  let pointerMoved = false;

  const setInitialPosition = () => {
    const rect = wrapper.getBoundingClientRect();
    x = rect.width * 0.45 - glowSize / 2;
    y = rect.height * 0.4 - glowSize / 2;
    targetX = x;
    targetY = y;
    glow.style.transform = `translate(${x}px, ${y}px)`;
  };

  const animate = () => {
    x += (targetX - x) * 0.06;
    y += (targetY - y) * 0.06;
    glow.style.transform = `translate(${x}px, ${y}px)`;

    if (Math.abs(targetX - x) > 0.1 || Math.abs(targetY - y) > 0.1) {
      frame = window.requestAnimationFrame(animate);
    } else {
      x = targetX;
      y = targetY;
      glow.style.transform = `translate(${x}px, ${y}px)`;
      frame = 0;
    }
  };

  const handlePointerMove = event => {
    if (motionPreference.matches) return;
    const rect = wrapper.getBoundingClientRect();
    targetX = event.clientX - rect.left - glowSize / 2;
    targetY = event.clientY - rect.top - glowSize / 2;
    pointerMoved = true;
    if (!frame) frame = window.requestAnimationFrame(animate);
  };

  const handleMotionChange = () => {
    if (motionPreference.matches) {
      if (frame) window.cancelAnimationFrame(frame);
      frame = 0;
      pointerMoved = false;
      setInitialPosition();
    }
  };

  const observer = new ResizeObserver(() => {
    if (!pointerMoved && !motionPreference.matches) setInitialPosition();
  });
  observer.observe(wrapper);
  wrapper.addEventListener('pointermove', handlePointerMove, { passive: true });
  motionPreference.addEventListener('change', handleMotionChange);
  window.addEventListener('pagehide', () => {
    observer.disconnect();
    wrapper.removeEventListener('pointermove', handlePointerMove);
    motionPreference.removeEventListener('change', handleMotionChange);
    if (frame) window.cancelAnimationFrame(frame);
  }, { once: true });
  setInitialPosition();
}
