import { getDynamicInsightFacts } from './dataEngine.js';

const CARD_POOL = [
  { factId: 'ins-jaktim-01', template: 'blob', name: 'Ayu' },
  { factId: 'ins-jakpus-01', template: 'kuning', name: 'Ines' },
  { factId: 'ins-jakbar-01', template: 'sunburst', name: 'Raka' }
];

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const facts = getDynamicInsightFacts();
let hero = document.getElementById('card-experience') || document.getElementById('kartu') || document.querySelector('.card-story-hero');
let fan = hero?.querySelector('.card-story-fan');
let gallery = hero?.querySelector('.card-story-gallery');
let progressTrack = hero?.querySelector('.card-story-progress');
let progressFill = hero?.querySelector('.card-story-progress-fill');
let progressMascot = hero?.querySelector('.card-story-progress-mascot');
let backgroundLayers = [...(hero?.querySelectorAll('.card-story-background-layer') || [])];

function refreshDOMElements() {
  if (!hero || !fan) {
    hero = document.getElementById('card-experience') || document.getElementById('kartu') || document.querySelector('.card-story-hero');
    fan = hero?.querySelector('.card-story-fan');
    gallery = hero?.querySelector('.card-story-gallery');
    progressTrack = hero?.querySelector('.card-story-progress');
    progressFill = hero?.querySelector('.card-story-progress-fill');
    progressMascot = hero?.querySelector('.card-story-progress-mascot');
    backgroundLayers = [...(hero?.querySelectorAll('.card-story-background-layer') || [])];
  }
}

let centerIndex = 0;
let transitionTimer = 0;
let progressAnimation = null;
let mascotAnimation = null;
let tiltFrame = 0;
let shineHideTimer = 0;
const cardHovers = [];
const groupTilt = {
  currentX: 0,
  currentY: 0,
  currentZ: 0,
  targetX: 0,
  targetY: 0,
  targetZ: 0,
  pointerX: 50,
  pointerY: 50
};

function cardData(sample, fact) {
  return {
    id: fact.id,
    wil: fact.wilayah,
    lbl: fact.judul,
    angka: fact.nilai,
    teks: fact.keterangan,
    sumber: fact.sumber || 'Dashboard BPKD DKI Jakarta',
    thn: fact.tahun || 2026,
    nm: sample.name,
    ver: false
  };
}

function findFact(id) {
  return facts.find(fact => fact.id === id) || facts[0];
}

function createHeroCard(sample, index) {
  const fact = findFact(sample.factId);
  if (!fact) return null;

  const card = document.createElement('article');
  card.className = 'card-story-card';
  card.dataset.heroCardIndex = String(index);
  card.dataset.region = fact.wilayah;
  card.dataset.template = sample.template;
  card.setAttribute('aria-hidden', 'true');

  const floating = document.createElement('div');
  floating.className = `card-story-float card-story-float--${index % 3}`;
  const hover = document.createElement('div');
  hover.className = 'card-story-hover';
  cardHovers.push(hover);
  const mount = document.createElement('div');
  mount.className = 'card-experience-mount';
  window.PajakCards.mount(mount, sample.template, cardData(sample, fact));
  const shine = document.createElement('div');
  shine.className = 'card-experience-shine';
  shine.setAttribute('aria-hidden', 'true');
  const glare = document.createElement('div');
  glare.className = 'card-experience-glare';
  glare.setAttribute('aria-hidden', 'true');
  hover.append(mount, shine, glare);
  floating.append(hover);
  card.append(floating);
  return card;
}

function slotForOffset(offset) {
  if (offset === 0) return 'center';
  if (offset === 1) return 'right';
  if (offset === -1) return 'left';
  if (offset === -2) return 'off-left';
  if (offset === 2) return 'off-right';
  return 'far-right';
}

function relativeOffset(index) {
  const forward = (index - centerIndex + CARD_POOL.length) % CARD_POOL.length;
  return forward > CARD_POOL.length / 2 ? forward - CARD_POOL.length : forward;
}

function syncSlots() {
  fan.querySelectorAll('[data-hero-card-index]').forEach(card => {
    const offset = relativeOffset(Number(card.dataset.heroCardIndex));
    const slot = slotForOffset(offset);
    card.dataset.heroSlot = slot;
    const fact = findFact(CARD_POOL[Number(card.dataset.heroCardIndex)].factId);
    const sample = CARD_POOL[Number(card.dataset.heroCardIndex)];
    card.setAttribute('aria-hidden', String(offset !== 0));
    card.setAttribute('aria-label', `Kartu aktif: ${fact.judul}, ${fact.wilayah}, dibuat oleh ${sample.name}`);
    card.dataset.region = fact.wilayah;
  });
}

function syncActiveBackground() {
  const center = CARD_POOL[centerIndex];
  hero.dataset.cardTemplate = center.template;
  hero.dataset.theme = center.template;
  backgroundLayers.forEach(layer => {
    layer.classList.toggle('is-active', layer.dataset.template === center.template);
  });
}

function syncVisuals() {
  syncSlots();
  syncActiveBackground();
}

function moveCenter(direction) {
  centerIndex = (centerIndex + direction + CARD_POOL.length) % CARD_POOL.length;
  syncVisuals();
}

function carouselActive() {
  return !prefersReducedMotion.matches;
}

function scheduleNext() {
  window.clearTimeout(transitionTimer);
  transitionTimer = 0;
  if (carouselActive()) {
    progressAnimation?.cancel();
    mascotAnimation?.cancel();
    progressAnimation = progressFill?.animate(
      [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }],
      { duration: 5000, easing: 'linear', fill: 'forwards' }
    ) || null;
    mascotAnimation = progressMascot?.animate(
      [{ left: '10px' }, { left: `calc(100% - 10px)` }],
      { duration: 5000, easing: 'linear', fill: 'forwards' }
    ) || null;
    transitionTimer = window.setTimeout(() => {
      moveCenter(1);
      scheduleNext();
    }, 5000);
  } else {
    progressAnimation?.pause();
    mascotAnimation?.pause();
  }
}

function animateTilts() {
  tiltFrame = 0;
  groupTilt.currentX += (groupTilt.targetX - groupTilt.currentX) * 0.16;
  groupTilt.currentY += (groupTilt.targetY - groupTilt.currentY) * 0.16;
  groupTilt.currentZ += (groupTilt.targetZ - groupTilt.currentZ) * 0.16;

  fan.style.transform =
    `rotateX(${groupTilt.currentX.toFixed(2)}deg) ` +
    `rotateY(${groupTilt.currentY.toFixed(2)}deg) ` +
    `translateZ(${groupTilt.currentZ.toFixed(2)}px)`;
  const shadowX = `${(-groupTilt.currentY * 0.8).toFixed(1)}px`;
  const shadowY = `${(8 + groupTilt.currentX * 0.8 + groupTilt.currentZ * 0.3).toFixed(1)}px`;
  const shadowBlur = `${(20 + groupTilt.currentZ * 0.5).toFixed(1)}px`;
  cardHovers.forEach(hover => {
    hover.style.setProperty('--card-shadow-x', shadowX);
    hover.style.setProperty('--card-shadow-y', shadowY);
    hover.style.setProperty('--card-shadow-blur', shadowBlur);
  });

  const needsAnotherFrame =
    Math.abs(groupTilt.targetX - groupTilt.currentX) > 0.03 ||
    Math.abs(groupTilt.targetY - groupTilt.currentY) > 0.03 ||
    Math.abs(groupTilt.targetZ - groupTilt.currentZ) > 0.03;

  if (needsAnotherFrame) {
    tiltFrame = window.requestAnimationFrame(animateTilts);
  }
}

function requestTiltFrame() {
  if (!tiltFrame) {
    tiltFrame = window.requestAnimationFrame(animateTilts);
  }
}

function resetGroupTilt() {
  groupTilt.targetX = 0;
  groupTilt.targetY = 0;
  groupTilt.targetZ = 0;
  window.clearTimeout(shineHideTimer);
  fan.classList.remove('is-interacting');
  requestTiltFrame();
}

function tiltGroupToPointer(event) {
  const bounds = gallery.getBoundingClientRect();
  if (!bounds.width || !bounds.height) return;
  const x = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width));
  const y = Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height));
  const maxTiltX = prefersReducedMotion.matches ? 1.5 : 10;
  const maxTiltY = prefersReducedMotion.matches ? 1.5 : 12;

  groupTilt.targetX = (y - 0.5) * maxTiltX * 2;
  groupTilt.targetY = (x - 0.5) * maxTiltY * 2;
  groupTilt.targetZ = prefersReducedMotion.matches ? 2 : 18;
  groupTilt.pointerX = x * 100;
  groupTilt.pointerY = y * 100;
  cardHovers.forEach(hover => {
    hover.style.setProperty('--glare-x', `${groupTilt.pointerX}%`);
    hover.style.setProperty('--glare-y', `${groupTilt.pointerY}%`);
    hover.style.setProperty('--shine-x', `${groupTilt.pointerX}%`);
    hover.style.setProperty('--shine-y', `${groupTilt.pointerY}%`);
  });
  if (event.type === 'pointermove') {
    fan.classList.add('is-interacting');
    window.clearTimeout(shineHideTimer);
    shineHideTimer = window.setTimeout(() => {
      fan.classList.remove('is-interacting');
    }, 140);
  }
  requestTiltFrame();
}

function bindGroupTilt() {
  gallery.addEventListener('pointerdown', tiltGroupToPointer);
  gallery.addEventListener('pointermove', tiltGroupToPointer);
  gallery.addEventListener('pointerleave', resetGroupTilt);
  gallery.addEventListener('pointercancel', resetGroupTilt);
  gallery.addEventListener('pointerup', event => {
    if (event.pointerType === 'touch') resetGroupTilt();
  });
}

function initCarousel() {
  refreshDOMElements();

  if (!window.PajakCards?.mount) {
    setTimeout(initCarousel, 50);
    return;
  }

  if (!fan) {
    console.error('Hero carousel requires a valid .card-story-fan container.');
    return;
  }

  if (fan.children.length > 0) return; // Prevent duplicate cards

  CARD_POOL.forEach((sample, index) => {
    const card = createHeroCard(sample, index);
    if (card) fan.append(card);
  });
  syncVisuals();
  bindGroupTilt();

  prefersReducedMotion.addEventListener?.('change', () => {
    if (prefersReducedMotion.matches) {
      groupTilt.targetX = Math.max(-1.5, Math.min(1.5, groupTilt.targetX));
      groupTilt.targetY = Math.max(-1.5, Math.min(1.5, groupTilt.targetY));
      groupTilt.targetZ = Math.min(2, groupTilt.targetZ);
      requestTiltFrame();
    }
    scheduleNext();
  });
  scheduleNext();
}

if (document.fonts) {
  document.fonts.ready.then(initCarousel).catch(error => {
    console.error('Hero carousel initialization failed:', error);
  });
} else {
  initCarousel();
}
