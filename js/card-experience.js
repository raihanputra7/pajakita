import { getDynamicInsightFacts } from './dataEngine.js';

const TEMPLATE_KEYS = {
  sunburst: 'sunburst',
  kuning: 'kuning',
  comic: 'komik',
  wave: 'split',
  blob: 'blob'
};

const SAMPLE_CARDS = [
  { index: 4, template: 'sunburst', name: 'Mina' },
  { index: 5, template: 'kuning', name: 'Ines' },
  { index: 7, template: 'comic', name: 'Dax' },
  { index: 6, template: 'wave', name: 'Ayu' },
  { index: 8, template: 'blob', name: 'Bima' }
];

const HERO_CARDS = [
  { index: 4, template: 'sunburst', name: 'Mina' },
  { index: 5, template: 'kuning', name: 'Ines' },
  { index: 7, template: 'blob', name: 'Ayu' }
];

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function getFacts(region) {
  return getDynamicInsightFacts(region || null);
}

function mapFact(fact, name) {
  return {
    id: fact.id,
    wil: fact.wilayah,
    lbl: fact.judul,
    angka: fact.nilai,
    teks: fact.keterangan,
    sumber: 'Dashboard BPKD DKI Jakarta',
    thn: fact.tahun || 2026,
    nm: name || 'Warga Jakarta',
    ver: false
  };
}

function createStage(template, data, scale) {
  const stage = document.createElement('div');
  stage.className = 'card-experience-stage';
  stage.style.setProperty('--card-scale', String(scale));
  const mount = document.createElement('div');
  mount.className = 'card-experience-mount';
  const shine = document.createElement('div');
  shine.className = 'card-experience-shine';
  shine.setAttribute('aria-hidden', 'true');
  const glare = document.createElement('div');
  glare.className = 'card-experience-glare';
  glare.setAttribute('aria-hidden', 'true');
  stage.append(mount, shine, glare);
  window.PajakCards.mount(mount, TEMPLATE_KEYS[template] || template, data);
  return stage;
}

function fitStage(stage) {
  const mount = stage.querySelector('.card-experience-mount');
  if (mount) window.PajakCards.fit(mount);
}

function addScaleLayout(parent, stage, scale) {
  parent.style.width = `${540 * scale}px`;
  parent.style.height = `${760 * scale}px`;
  parent.append(stage);
  fitStage(stage);
}

function currentFormCard() {
  const region = document.getElementById('card-input-region')?.value || 'Seluruh DKI Jakarta';
  const name = document.getElementById('card-input-name')?.value.trim() || 'Warga Jakarta';
  const selectedIndex = Number(document.getElementById('card-insight-select')?.value || 0);
  const fact = getFacts(region)[selectedIndex] || getFacts(region)[0] || getFacts()[0];
  const selectedTemplate = document.getElementById('templateSelect')?.value || 'sunburst';
  return fact ? { fact, data: mapFact(fact, name), template: selectedTemplate } : null;
}

function renderTemplateChoices() {
  const facts = getFacts();
  document.querySelectorAll('[data-template-mount]').forEach((thumb, index) => {
    const template = thumb.dataset.templateMount;
    const fact = facts[index + 3] || facts[index] || facts[0];
    if (!fact) return;
    const stage = createStage(template, mapFact(fact, 'Warga Jakarta'), 1);
    thumb.append(stage);
    fitStage(stage);
    const resize = () => stage.style.transform = `scale(${thumb.clientWidth / 540})`;
    resize();
    new ResizeObserver(resize).observe(thumb);
  });
}

function renderHeroCards() {
  const facts = getFacts();
  document.querySelectorAll('[data-showcase-card]').forEach((card, index) => {
    const sample = HERO_CARDS[Number(card.dataset.sample)] || HERO_CARDS[index];
    const fact = facts[sample.index] || facts[index] || facts[0];
    if (!fact) return;
    card.classList.add('card-showcase-interactive');
    const scale = card.classList.contains('card-story-card--center') ? 0.42 : 0.37;
    addScaleLayout(card, createStage(sample.template, mapFact(fact, sample.name), scale), scale);
  });
}

function buildCommunityCard(sample, facts, isCurrent = false) {
  const item = document.createElement('article');
  item.className = 'card-community-card';
  item.dataset.communityCard = isCurrent ? 'current' : 'sample';
  const caption = document.createElement('div');
  caption.className = 'card-community-caption';
  const name = document.createElement('strong');
  name.textContent = isCurrent ? 'kamu barusan' : sample.name;
  const location = isCurrent ? 'di Jakarta' : `di ${facts[sample.index]?.wilayah || 'Jakarta'}`;
  caption.append('Dibuat oleh ', name, ` ${location}`);
  item.append(caption);

  if (!isCurrent) {
    const fact = facts[sample.index] || facts[0];
    item.append(createCommunityArtwork(sample.template, mapFact(fact, sample.name)));
  }
  return item;
}

function createCommunityArtwork(template, data) {
  const scale = 0.29;
  const frame = document.createElement('div');
  frame.className = 'card-community-artwork';
  frame.style.width = `${540 * scale}px`;
  frame.style.height = `${760 * scale}px`;
  frame.append(createStage(template, data, scale));
  return frame;
}

function renderCommunityTrack() {
  const track = document.getElementById('card-community-track');
  if (!track) return;
  const facts = getFacts();
  const firstSet = document.createElement('div');
  firstSet.className = 'card-community-set';
  firstSet.setAttribute('aria-hidden', 'false');
  SAMPLE_CARDS.forEach(sample => firstSet.append(buildCommunityCard(sample, facts)));
  firstSet.append(buildCommunityCard({}, facts, true));

  const secondSet = firstSet.cloneNode(true);
  secondSet.setAttribute('aria-hidden', 'true');
  secondSet.querySelectorAll('button, a, [tabindex]').forEach(element => element.setAttribute('tabindex', '-1'));
  track.replaceChildren(firstSet, secondSet);
  track.querySelectorAll('.card-experience-stage').forEach(fitStage);
  refreshCurrentCard();
}

function refreshCurrentCard() {
  const current = currentFormCard();
  if (!current) return;
  const quote = document.getElementById('card-current-quote');
  if (quote) quote.textContent = `“${current.fact.judul}”`;

  document.querySelectorAll('[data-community-card="current"]').forEach(item => {
    item.querySelector('.card-community-artwork')?.remove();
    const artwork = createCommunityArtwork(current.template, current.data);
    item.append(artwork);
    const stage = artwork.querySelector('.card-experience-stage');
    if (stage) fitStage(stage);
    const location = item.querySelector('.card-community-caption');
    if (location) location.lastChild.textContent = ` di ${current.fact.wilayah}`;
  });
}

function updateTemplateSelection(template) {
  document.querySelectorAll('[data-template-choice]').forEach(button => {
    const active = button.dataset.templateChoice === template;
    button.setAttribute('aria-checked', String(active));
    button.tabIndex = active ? 0 : -1;
  });
}

function attachShowcaseInteraction(root = document) {
  root.querySelectorAll('.card-showcase-interactive, .card-community-card').forEach(card => {
    if (card.dataset.interactiveBound) return;
    card.dataset.interactiveBound = 'true';
    card.addEventListener('pointerenter', () => card.classList.add('is-hovering'));
    card.addEventListener('pointerleave', () => {
      card.classList.remove('is-hovering');
      card.style.setProperty('--tilt-x', '0deg');
      card.style.setProperty('--tilt-y', '0deg');
      const shine = card.querySelector('.card-experience-shine');
      const glare = card.querySelector('.card-experience-glare');
      shine?.style.setProperty('--shine-x', '50%');
      shine?.style.setProperty('--shine-y', '50%');
      glare?.style.setProperty('--glare-x', '50%');
      glare?.style.setProperty('--glare-y', '50%');
    });
    card.addEventListener('pointermove', event => {
      const bounds = card.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width;
      const y = (event.clientY - bounds.top) / bounds.height;
      card.style.setProperty('--tilt-x', `${(0.5 - y) * 18}deg`);
      card.style.setProperty('--tilt-y', `${(x - 0.5) * 24}deg`);
      const shine = card.querySelector('.card-experience-shine');
      const glare = card.querySelector('.card-experience-glare');
      shine?.style.setProperty('--shine-x', `${x * 100}%`);
      shine?.style.setProperty('--shine-y', `${y * 100}%`);
      glare?.style.setProperty('--glare-x', `${x * 100}%`);
      glare?.style.setProperty('--glare-y', `${y * 100}%`);
    });
  });
}

function initPreviewControls() {
  const viewport = document.getElementById('card-preview-viewport');
  const rotator = document.getElementById('card-preview-tilt');
  if (!viewport || !rotator) return;
  const autoFlipToggle = document.getElementById('card-preview-autoflip-toggle');
  const autoFlipHint = document.getElementById('card-preview-autoflip-hint');

  const state = {
    pointerInside: false,
    dragging: false,
    pointerId: null,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastTime: 0,
    velocity: 0,
    rotationY: 0,
    targetX: 0,
    targetY: 0,
    displayedX: 0,
    displayedY: 0,
    spin: null,
    snapTarget: null,
    autoFlip: !prefersReducedMotion.matches,
    autoFlipLastTime: 0,
    loadingDesign: false,
    designLoadTimer: 0,
    frame: 0
  };

  const setPointerPosition = event => {
    const bounds = viewport.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width));
    const y = Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height));
    viewport.style.setProperty('--glare-x', `${x * 100}%`);
    viewport.style.setProperty('--glare-y', `${y * 100}%`);
    viewport.style.setProperty('--shine-x', `${x * 100}%`);
    viewport.style.setProperty('--shine-y', `${y * 100}%`);
    if (!state.dragging && !state.autoFlip) {
      state.targetX = (0.5 - y) * 24;
      state.targetY = (x - 0.5) * 30;
    }
  };

  const tick = time => {
    state.frame = 0;
    const reduced = prefersReducedMotion.matches;
    if (state.autoFlip && !reduced && !state.loadingDesign) {
      const elapsed = Math.max(0, time - state.autoFlipLastTime);
      state.rotationY += Math.min(elapsed, 50) * 0.04;
    } else if (state.spin && !reduced) {
      const progress = Math.min(1, (time - state.spin.start) / 900);
      const eased = 1 - Math.pow(1 - progress, 3);
      state.rotationY = state.spin.from + (state.spin.to - state.spin.from) * eased;
      if (progress === 1) {
        state.rotationY = state.spin.to;
        state.spin = null;
        state.targetX = 0;
        state.targetY = 0;
      }
    }
    if (state.snapTarget !== null && !state.dragging) {
      state.rotationY += (state.snapTarget - state.rotationY) * 0.16;
      if (Math.abs(state.snapTarget - state.rotationY) < 0.15) {
        state.rotationY = state.snapTarget;
        state.snapTarget = null;
      }
    }

    const idle = !reduced && !state.pointerInside && !state.dragging && !state.loadingDesign;
    const idleX = idle ? Math.sin(time * 0.00065) * 0.7 : 0;
    const idleY = idle ? Math.sin(time * 0.0008) * 1.5 : 0;
    const wantedX = (reduced ? 0 : state.targetX) + idleX;
    const wantedY = state.rotationY + (reduced ? 0 : state.targetY) + idleY;
    state.displayedX += (wantedX - state.displayedX) * 0.14;
    state.displayedY += (wantedY - state.displayedY) * 0.14;
    rotator.style.transform = `rotateX(${state.displayedX}deg) rotateY(${state.displayedY}deg)`;
    state.autoFlipLastTime = time;

    const keepRunning = !reduced || state.pointerInside || state.dragging || state.spin || state.snapTarget !== null || (state.autoFlip && !reduced);
    if (keepRunning) state.frame = requestAnimationFrame(tick);
  };

  const ensureFrame = () => {
    if (!state.frame) state.frame = requestAnimationFrame(tick);
  };

  const updateAutoFlipControl = () => {
    autoFlipToggle?.setAttribute('aria-checked', String(state.autoFlip));
    viewport.classList.toggle('is-autoflip', state.autoFlip);
    if (autoFlipHint) {
      autoFlipHint.textContent = state.autoFlip
        ? 'Matikan auto-flip untuk menggerakkan kartu secara manual.'
        : 'Nyalakan auto-flip untuk melihat kartu berputar otomatis.';
    }
  };

  const stopAutoFlip = () => {
    if (!state.autoFlip) return;
    state.autoFlip = false;
    state.rotationY = state.displayedY;
    state.targetX = 0;
    state.targetY = 0;
    state.spin = null;
    state.snapTarget = null;
    updateAutoFlipControl();
  };

  updateAutoFlipControl();
  viewport.addEventListener('pointerenter', event => {
    state.pointerInside = true;
    viewport.classList.add('is-hovering');
    setPointerPosition(event);
    ensureFrame();
  });
  viewport.addEventListener('pointerleave', () => {
    if (state.dragging) return;
    state.pointerInside = false;
    viewport.classList.remove('is-hovering');
    state.targetX = 0;
    state.targetY = 0;
    ensureFrame();
  });
  viewport.addEventListener('pointerdown', event => {
    if (state.autoFlip) return;
    if (event.button !== undefined && event.button !== 0) return;
    event.preventDefault();
    state.dragging = true;
    state.pointerId = event.pointerId;
    state.startX = event.clientX;
    state.rotationY = state.displayedY;
    state.startY = state.rotationY;
    state.lastX = event.clientX;
    state.lastTime = performance.now();
    state.velocity = 0;
    state.spin = null;
    state.snapTarget = null;
    state.targetX = 0;
    state.targetY = 0;
    viewport.setPointerCapture(event.pointerId);
    viewport.classList.add('is-hovering');
    ensureFrame();
  });
  viewport.addEventListener('pointermove', event => {
    setPointerPosition(event);
    if (state.autoFlip) return;
    if (!state.dragging || event.pointerId !== state.pointerId) {
      ensureFrame();
      return;
    }
    const now = performance.now();
    const elapsed = Math.max(1, now - state.lastTime);
    const delta = event.clientX - state.lastX;
    state.velocity = delta / elapsed;
    state.lastX = event.clientX;
    state.lastTime = now;
    state.rotationY = state.startY + (event.clientX - state.startX) * 0.65;
    state.targetX = 0;
    state.targetY = 0;
    ensureFrame();
  });
  const finishDrag = event => {
    if (!state.dragging || (event.pointerId !== undefined && event.pointerId !== state.pointerId)) return;
    state.dragging = false;
    state.pointerId = null;
    const inertia = Math.abs(state.velocity) > 0.15
      ? Math.sign(state.velocity) * Math.min(Math.abs(state.velocity) * 120, 45)
      : 0;
    state.snapTarget = Math.round((state.rotationY + inertia) / 180) * 180;
    ensureFrame();
  };
  viewport.addEventListener('pointerup', finishDrag);
  viewport.addEventListener('pointercancel', finishDrag);

  autoFlipToggle?.addEventListener('click', () => {
    state.autoFlip = autoFlipToggle.getAttribute('aria-checked') !== 'true';
    updateAutoFlipControl();
    state.targetX = 0;
    state.targetY = 0;
    state.spin = null;
    state.snapTarget = null;

    if (state.autoFlip) {
      state.rotationY = state.displayedY;
      state.autoFlipLastTime = performance.now();
    } else {
      state.rotationY = state.displayedY;
      state.snapTarget = Math.round(state.rotationY / 360) * 360;
    }
    ensureFrame();
  });

  const spin = () => {
    stopAutoFlip();
    state.snapTarget = null;
    state.targetX = 0;
    state.targetY = 0;
    const target = Math.ceil((state.rotationY + 360) / 360) * 360;
    if (prefersReducedMotion.matches) {
      state.rotationY = target;
      state.displayedX = 0;
      state.displayedY = target;
      rotator.style.transform = `rotateX(0deg) rotateY(${target}deg)`;
      return;
    }
    state.spin = { from: state.rotationY, to: target, start: performance.now() };
    ensureFrame();
  };

  const startDesignLoading = () => {
    const loading = document.getElementById('card-preview-loading');
    if (!loading) return;
    stopAutoFlip();
    window.clearTimeout(state.designLoadTimer);
    state.loadingDesign = true;
    state.rotationY = state.displayedY;
    state.targetX = 0;
    state.targetY = 0;
    state.spin = null;
    state.snapTarget = null;
    loading.classList.add('is-active');
    loading.setAttribute('aria-hidden', 'false');
    viewport.setAttribute('aria-busy', 'true');
    state.designLoadTimer = window.setTimeout(() => {
      state.loadingDesign = false;
      state.autoFlipLastTime = performance.now();
      state.snapTarget = Math.round(state.rotationY / 360) * 360;
      loading.classList.remove('is-active');
      loading.setAttribute('aria-hidden', 'true');
      viewport.removeAttribute('aria-busy');
      ensureFrame();
    }, 650);
    ensureFrame();
  };

  const templateSelect = document.getElementById('templateSelect');
  const templateButtons = [...document.querySelectorAll('[data-template-choice]')];
  templateButtons.forEach((button, index) => {
    button.addEventListener('click', () => {
      if (!templateSelect) return;
      templateSelect.value = button.dataset.templateChoice;
      templateSelect.dispatchEvent(new Event('change', { bubbles: true }));
    });
    button.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
      event.preventDefault();
      const direction = ['ArrowRight', 'ArrowDown'].includes(event.key) ? 1 : -1;
      const next = templateButtons[(index + direction + templateButtons.length) % templateButtons.length];
      next.focus();
      next.click();
    });
  });

  templateSelect?.addEventListener('change', event => {
    updateTemplateSelection(event.target.value);
    startDesignLoading();
  });
  document.getElementById('card-input-region')?.addEventListener('change', spin);
  document.getElementById('card-insight-select')?.addEventListener('change', spin);
  document.getElementById('card-btn-randomize')?.addEventListener('click', spin);
  const mount = document.getElementById('card-mount-point');
  if (mount) {
    const observer = new MutationObserver(() => window.setTimeout(refreshCurrentCard, 60));
    observer.observe(mount, { childList: true });
  }

  prefersReducedMotion.addEventListener?.('change', () => {
    state.autoFlipLastTime = performance.now();
    ensureFrame();
  });
  ensureFrame();
}

async function initCardExperience() {
  if (!window.PajakCards?.mount) {
    console.error('Card experience requires the existing PajakCards renderer.');
    return;
  }

  if (document.fonts) await document.fonts.ready;
  renderTemplateChoices();
  renderHeroCards();
  renderCommunityTrack();
  attachShowcaseInteraction();
  updateTemplateSelection(document.getElementById('templateSelect')?.value || 'sunburst');
  initPreviewControls();

  const cta = document.querySelector('.card-story-cta');
  cta?.addEventListener('click', event => {
    const target = document.querySelector(cta.getAttribute('href'));
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: prefersReducedMotion.matches ? 'auto' : 'smooth' });
  });
}

const startCardExperience = () => {
  initCardExperience().catch(error => {
    console.error('Card experience initialization failed:', error);
  });
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startCardExperience, { once: true });
} else {
  startCardExperience();
}
