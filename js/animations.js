/**
 * paJAK-Kita — Framer Motion & Scroll Animations
 * File: js/animations.js
 *
 * Mengimplementasikan:
 * 1. Animasi masuk hero: nav fades down, headline reveal baris demi baris (+24px -> 0, 700ms cubic-bezier(.2,.8,.2,1)),
 *    dark glass card slide in dari kanan dengan delay, tombol reveal.
 * 2. Scroll-triggered reveal dengan stagger (whileInView, once: true).
 * 3. Hover micro-interactions (card lift 4px, arrow nudge).
 * 4. Hanya menganimasikan transform dan opacity.
 * 5. Menghormati prefers-reduced-motion (dinonaktifkan sepenuhnya).
 */

const prefersReducedMotion = () =>
  window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function initSiteMotion() {
  if (prefersReducedMotion()) {
    // Tampilkan semua elemen langsung tanpa animasi
    document.querySelectorAll('.motion-reveal, .hero-headline-line, .hero-card-glass, .hero-btn-explore').forEach((el) => {
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
    return;
  }

  initHeroMotion();
  initSectionScrollMotion();
  initHoverMicroInteractions();
}

function initHeroMotion() {
  const isMotionAvailable = typeof window.Motion !== 'undefined' && window.Motion.animate;

  const header = document.querySelector('.site-header');
  const headlineLines = document.querySelectorAll('.hero-headline-line');
  const heroSubline = document.querySelector('.hero-subline');
  const heroCard = document.querySelector('.hero-card-glass');
  const heroBtn = document.querySelector('.hero-btn-explore');

  if (isMotionAvailable) {
    const { animate } = window.Motion;

    // 1. Nav fades down
    if (header) {
      animate(header, { opacity: [0, 1], y: [-16, 0] }, { duration: 0.6, ease: [0.2, 0.8, 0.2, 1] });
    }

    // 2. Headline lines reveal satu demi satu
    if (headlineLines.length > 0) {
      headlineLines.forEach((line, idx) => {
        animate(
          line,
          { opacity: [0, 1], y: [24, 0] },
          { duration: 0.7, delay: 0.15 + idx * 0.12, ease: [0.2, 0.8, 0.2, 1] }
        );
      });
    }

    // 3. Hero subline
    if (heroSubline) {
      animate(
        heroSubline,
        { opacity: [0, 1], y: [18, 0] },
        { duration: 0.6, delay: 0.42, ease: [0.2, 0.8, 0.2, 1] }
      );
    }

    // 4. Hero card slides in from right
    if (heroCard) {
      animate(
        heroCard,
        { opacity: [0, 1], x: [36, 0] },
        { duration: 0.7, delay: 0.5, ease: [0.2, 0.8, 0.2, 1] }
      );
    }

    // 5. Hero button
    if (heroBtn) {
      animate(
        heroBtn,
        { opacity: [0, 1], y: [16, 0] },
        { duration: 0.55, delay: 0.62, ease: [0.2, 0.8, 0.2, 1] }
      );
    }
  } else {
    // Native Web Animations API fallback (tanpa fill: 'forwards' agar tidak mengunci transform navbar & hover)
    const ease = 'cubic-bezier(0.2, 0.8, 0.2, 1)';

    if (header) {
      header.animate([
        { opacity: 0, transform: 'translateY(-16px)' },
        { opacity: 1, transform: 'translateY(0)' }
      ], { duration: 600, easing: ease, fill: 'backwards' });
    }

    headlineLines.forEach((line, idx) => {
      line.animate([
        { opacity: 0, transform: 'translateY(24px)' },
        { opacity: 1, transform: 'translateY(0)' }
      ], { duration: 700, delay: 150 + idx * 120, easing: ease, fill: 'backwards' });
    });

    if (heroSubline) {
      heroSubline.animate([
        { opacity: 0, transform: 'translateY(18px)' },
        { opacity: 1, transform: 'translateY(0)' }
      ], { duration: 600, delay: 420, easing: ease, fill: 'backwards' });
    }

    if (heroCard) {
      heroCard.animate([
        { opacity: 0, transform: 'translateX(36px)' },
        { opacity: 1, transform: 'translateX(0)' }
      ], { duration: 700, delay: 500, easing: ease, fill: 'backwards' });
    }

    if (heroBtn) {
      heroBtn.animate([
        { opacity: 0, transform: 'translateY(16px)' },
        { opacity: 1, transform: 'translateY(0)' }
      ], { duration: 550, delay: 620, easing: ease, fill: 'backwards' });
    }
  }
}

function initSectionScrollMotion() {
  const revealElements = document.querySelectorAll('.motion-reveal');
  if (revealElements.length === 0) return;

  const isMotionAvailable = typeof window.Motion !== 'undefined' && window.Motion.inView;

  if (isMotionAvailable) {
    const { inView, animate } = window.Motion;

    revealElements.forEach((el) => {
      inView(el, () => {
        animate(
          el,
          { opacity: [0, 1], y: [24, 0] },
          { duration: 0.65, ease: [0.2, 0.8, 0.2, 1] }
        );
      }, { amount: 0.15 });
    });
  } else {
    // IntersectionObserver fallback
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.animate([
            { opacity: 0, transform: 'translateY(24px)' },
            { opacity: 1, transform: 'translateY(0)' }
          ], { duration: 650, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)', fill: 'backwards' });
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    revealElements.forEach((el) => observer.observe(el));
  }
}

function initHoverMicroInteractions() {
  document.querySelectorAll('.hover-lift').forEach((card) => {
    card.addEventListener('mouseenter', () => {
      if (prefersReducedMotion()) return;
      card.style.transform = 'translateY(-4px)';
    });
    card.addEventListener('mouseleave', () => {
      if (prefersReducedMotion()) return;
      card.style.transform = '';
    });
  });

  document.querySelectorAll('.hover-nudge-arrow').forEach((btn) => {
    const arrow = btn.querySelector('.arrow-icon');
    if (!arrow) return;
    btn.addEventListener('mouseenter', () => {
      if (prefersReducedMotion()) return;
      arrow.style.transform = 'translateX(4px)';
    });
    btn.addEventListener('mouseleave', () => {
      if (prefersReducedMotion()) return;
      arrow.style.transform = '';
    });
  });
}
