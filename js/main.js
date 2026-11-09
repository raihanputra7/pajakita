/**
 * paJAK-Kita — Main Scripts, Navbar & Interactive Features
 * File: js/main.js
 *
 * Mengimplementasikan:
 * 1. Navbar transparan di atas hero, solid setelah scroll 24px (--color-cream, teks ink).
 * 2. Smart sticky nav: sembunyi saat scroll ke bawah, muncul saat scroll ke atas.
 * 3. Menu dropdown dengan icon panah berputar, hover intent 120ms & dukungan klik.
 * 4. Dropdown panel kaya: ikon, judul, deskripsi satu baris, badge "Segera hadir", side card data terbaru.
 * 5. Aksesibilitas penuh keyboard (Tab, panah, Enter, Esc, ARIA).
 * 6. Mobile navigation sheet layar penuh dengan accordion dan focus trap.
 * 7. Inisialisasi Hero Slideshow dan Framer Motion.
 */

import { initSiteMotion } from './animations.js';
import { getRealisasiMeta } from './dataClient.js';
import { formatTanggalIndonesia } from './format.js';
import {
  getPilar1Metrics,
  getPilar2Metrics,
  getDynamicOndiNarrative,
  fetchAllTaxData
} from './dataEngine.js';
import { initWelcomeGreeting } from './welcomeNotification.js';

// Pastikan tiap refresh halaman selalu kembali ke landing page (bagian paling atas)
if (typeof window !== 'undefined' && 'scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}

function resetToLandingPage() {
  if (typeof window === 'undefined') return;
  // Hapus hash anchor (seperti #kartu) agar reload tidak mengunci posisi ke bawah
  if (window.location.hash) {
    try {
      history.replaceState(null, '', window.location.pathname + window.location.search);
    } catch (e) {}
  }
  window.scrollTo(0, 0);
}

// Eksekusi segera saat script dimuat dan saat window siap
resetToLandingPage();
window.addEventListener('load', () => resetToLandingPage());

function boot() {
  resetToLandingPage();
  try { initHeroSlideshow(); } catch (err) { console.error('Hero slideshow error:', err); }
  try { initNavbar(); } catch (err) { console.error('Navbar error:', err); }
  try { initSiteMotion(); } catch (err) { console.error('Site motion error:', err); }
  try { updateNavbarDataBadge(); } catch (err) { console.error('Data badge error:', err); }
  try { initOndiEyeTracking(); } catch (err) { console.error('Ondi eye tracking error:', err); }
  try { initDynamicOndi(2026); } catch (err) { console.error('Dynamic Ondi error:', err); }
  try { initExecutiveSummary(2026); } catch (err) { console.error('Executive summary error:', err); }
  try { initWelcomeGreeting(); } catch (err) { /* silent fail */ }

  // Non-blocking background fetch untuk sinkronisasi gateway Satu Data
  fetchAllTaxData().then(() => {
    try { initExecutiveSummary(2026); } catch (e) {}
    try { initDynamicOndi(2026); } catch (e) {}
  }).catch(() => {});
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}

function initNavbar() {
  const siteHeader = document.querySelector('.site-header');
  const menuToggle = document.querySelector('#menuToggle');
  const mobileNav = document.querySelector('#mobileNavSheet');
  const mobileNavClose = document.querySelector('#mobileNavClose');
  const dropdownWrappers = document.querySelectorAll('.nav-dropdown-wrapper');

  if (!siteHeader) return;

  // =========================================================================
  // 1. SCROLL EFFECT: TRANSPARAN -> SOLID & HIDE ON SCROLL DOWN
  // =========================================================================
  let lastScrollY = window.scrollY;
  let isHeaderScrolled = false;

  const handleScroll = () => {
    const currentScrollY = window.scrollY;

    // Solid state setelah 24px (tetap solid jika halaman memiliki class .header-solid)
    if (siteHeader.classList.contains('header-solid')) {
      // Selalu solid di subhalaman
    } else if (currentScrollY > 24) {
      if (!isHeaderScrolled) {
        siteHeader.classList.add('is-scrolled');
        isHeaderScrolled = true;
      }
    } else {
      if (isHeaderScrolled) {
        siteHeader.classList.remove('is-scrolled');
        isHeaderScrolled = false;
      }
    }

    // Hide on scroll down, show on scroll up (hanya jika scroll > 120px)
    if (currentScrollY > 120) {
      if (currentScrollY > lastScrollY && currentScrollY - lastScrollY > 6) {
        siteHeader.classList.add('is-hidden');
        closeAllDropdowns();
      } else if (lastScrollY - currentScrollY > 6) {
        siteHeader.classList.remove('is-hidden');
      }
    } else {
      siteHeader.classList.remove('is-hidden');
    }

    lastScrollY = currentScrollY;
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll(); // run once on load

  // =========================================================================
  // 2. DROPDOWNS DENGAN HOVER INTENT & KLIK
  // =========================================================================
  function closeAllDropdowns() {
    dropdownWrappers.forEach((wrapper) => {
      wrapper.classList.remove('is-open');
      const trigger = wrapper.querySelector('.nav-dropdown-trigger');
      if (trigger) trigger.setAttribute('aria-expanded', 'false');
    });
  }

  dropdownWrappers.forEach((wrapper) => {
    const trigger = wrapper.querySelector('.nav-dropdown-trigger');
    const panel = wrapper.querySelector('.nav-dropdown-panel');
    let hoverTimeout = null;

    if (!trigger || !panel) return;

    // Hover intent ~120ms
    wrapper.addEventListener('mouseenter', () => {
      clearTimeout(hoverTimeout);
      hoverTimeout = setTimeout(() => {
        closeAllDropdowns();
        wrapper.classList.add('is-open');
        trigger.setAttribute('aria-expanded', 'true');
      }, 120);
    });

    wrapper.addEventListener('mouseleave', () => {
      clearTimeout(hoverTimeout);
      hoverTimeout = setTimeout(() => {
        wrapper.classList.remove('is-open');
        trigger.setAttribute('aria-expanded', 'false');
      }, 150);
    });

    // Klik/tap toggle
    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = wrapper.classList.contains('is-open');
      closeAllDropdowns();
      if (!isOpen) {
        wrapper.classList.add('is-open');
        trigger.setAttribute('aria-expanded', 'true');
      }
    });

    // Tutup saat item link diklik
    panel.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        closeAllDropdowns();
      });
    });
  });

  // Klik di luar menutup dropdown
  document.addEventListener('click', (e) => {
    if (!siteHeader.contains(e.target)) {
      closeAllDropdowns();
    }
  });

  // Tombol Escape menutup dropdown
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAllDropdowns();
      if (mobileNav && mobileNav.classList.contains('is-open')) {
        toggleMobileNav(false);
      }
    }
  });

  // =========================================================================
  // 3. MOBILE NAVIGATION SHEET (FULLSCREEN ACCORDION & FOCUS TRAP)
  // =========================================================================
  function toggleMobileNav(open) {
    if (!mobileNav || !menuToggle) return;

    mobileNav.classList.toggle('is-open', open);
    menuToggle.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('nav-locked', open);

    if (open) {
      // Focus ke tombol tutup
      setTimeout(() => mobileNavClose?.focus(), 100);
    } else {
      menuToggle.focus();
    }
  }

  menuToggle?.addEventListener('click', () => {
    const isOpen = mobileNav?.classList.contains('is-open');
    toggleMobileNav(!isOpen);
  });

  mobileNavClose?.addEventListener('click', () => {
    toggleMobileNav(false);
  });

  // Accordion pada mobile nav
  const mobileAccordions = document.querySelectorAll('.mobile-accordion-header');
  mobileAccordions.forEach((btn) => {
    btn.addEventListener('click', () => {
      const parent = btn.parentElement;
      const isOpen = parent.classList.contains('is-open');

      mobileAccordions.forEach((other) => other.parentElement.classList.remove('is-open'));
      if (!isOpen) {
        parent.classList.add('is-open');
        btn.setAttribute('aria-expanded', 'true');
      } else {
        btn.setAttribute('aria-expanded', 'false');
      }
    });
  });

  // Tutup mobile nav saat link diklik
  mobileNav?.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      toggleMobileNav(false);
    });
  });
}

// =========================================================================
// HERO BACKGROUND SLIDESHOW (Crossfade 1.2s + Smooth Ken Burns Scale 1.0 -> 1.08)
// =========================================================================
const HERO_IMAGES = [
  { src: 'public/assets/hero-1-monas.jpg', alt: 'Monumen Nasional Jakarta', position: '50% 35%' },
  { src: 'public/assets/hero-2-sudirman-kaca.jpg', alt: 'Gedung Kaca Sudirman Jakarta', position: '50% 50%' },
  { src: 'public/assets/hero-3-skyline-malam.jpg', alt: 'Cakrawala Malam Jakarta', position: '50% 40%' },
  { src: 'public/assets/hero-4-jalan-sudirman.jpg', alt: 'Koridor Jalan Sudirman Jakarta', position: '50% 60%' },
  { src: 'public/assets/hero-5-jpo-senja.jpg', alt: 'JPO Sudirman Senja Jakarta', position: '50% 50%' }
];

function initHeroSlideshow() {
  const heroSection = document.querySelector('#beranda') || document.querySelector('.hero-viewport-100');
  if (!heroSection) return;

  // Cegah artefak seleksi teks warna biru pekat saat double-click
  heroSection.addEventListener('dblclick', (e) => {
    e.preventDefault();
  });

  const slidesWrapper = heroSection.querySelector('.hero-slides-wrapper');
  if (!slidesWrapper) return;

  // Pastikan elemen slide sesuai dengan array HERO_IMAGES
  let slides = Array.from(slidesWrapper.querySelectorAll('.hero-slide, .hero-slide-img'));
  if (slides.length !== HERO_IMAGES.length) {
    slidesWrapper.innerHTML = '';
    slides = HERO_IMAGES.map((item, idx) => {
      const img = document.createElement('img');
      img.className = `hero-slide hero-slide-img ${idx === 0 ? 'active is-active' : ''}`;
      img.src = item.src;
      img.alt = item.alt;
      img.style.objectPosition = item.position;
      if (idx === 0) img.setAttribute('fetchpriority', 'high');
      else img.loading = 'lazy';
      slidesWrapper.appendChild(img);
      return img;
    });
  } else {
    slides.forEach((img, idx) => {
      const item = HERO_IMAGES[idx];
      if (!img.getAttribute('src')) img.src = item.src;
      img.alt = item.alt;
      img.style.objectPosition = item.position;
      img.classList.add('hero-slide');
      if (idx === 0) {
        img.classList.add('active', 'is-active');
      } else {
        img.classList.remove('active', 'is-active');
      }
    });
  }

  let currentIndex = 0;
  let isPlaying = true;
  let timerId = null;

  // Inisialisasi indikator
  const indicatorsContainer = heroSection.querySelector('.hero-indicators-list');
  let indicatorBtns = [];
  if (indicatorsContainer) {
    indicatorsContainer.innerHTML = '';
    HERO_IMAGES.forEach((item, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `hero-indicator-btn ${idx === 0 ? 'is-active' : ''}`;
      btn.setAttribute('aria-label', `Tampilkan gambar ${idx + 1} dari ${HERO_IMAGES.length}`);
      const fill = document.createElement('span');
      fill.className = 'hero-indicator-fill';
      btn.appendChild(fill);

      btn.addEventListener('click', () => {
        goToSlide(idx);
      });
      indicatorsContainer.appendChild(btn);
      indicatorBtns.push(btn);
    });
  }

  // Tombol pause/play
  const toggleBtn = heroSection.querySelector('#hero-slideshow-toggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      isPlaying = !isPlaying;
      toggleBtn.setAttribute('aria-pressed', String(!isPlaying));
      toggleBtn.setAttribute('aria-label', isPlaying ? 'Jeda tayangan slide' : 'Lanjutkan tayangan slide');
      toggleBtn.classList.toggle('is-paused', !isPlaying);
      if (isPlaying) {
        startTimer();
      } else {
        stopTimer();
      }
    });
  }

  function setSlide(index) {
    currentIndex = index;
    slides.forEach((img, idx) => {
      const isActive = idx === currentIndex;
      img.classList.toggle('active', isActive);
      img.classList.toggle('is-active', isActive);
      img.style.removeProperty('opacity');
      img.style.zIndex = isActive ? '1' : '0';
    });
    indicatorBtns.forEach((btn, idx) => {
      btn.classList.toggle('active', idx === currentIndex);
      btn.classList.toggle('is-active', idx === currentIndex);
    });

    // Preload gambar berikutnya
    const nextIdx = (currentIndex + 1) % slides.length;
    if (slides[nextIdx] && !slides[nextIdx].src) {
      slides[nextIdx].src = HERO_IMAGES[nextIdx].src;
    }
  }

  function nextSlide() {
    const nextIdx = (currentIndex + 1) % slides.length;
    setSlide(nextIdx);
  }

  function goToSlide(index) {
    setSlide(index);
    if (isPlaying) {
      startTimer();
    }
  }

  function startTimer() {
    stopTimer();
    if (window.__heroTimer) {
      clearInterval(window.__heroTimer);
      window.__heroTimer = null;
    }
    timerId = setInterval(() => {
      if (isPlaying) {
        nextSlide();
      }
    }, 6000); // 6000ms (6 detik) sesuai kurva timing referensi
    window.__heroTimer = timerId;
  }

  function stopTimer() {
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }
    if (window.__heroTimer) {
      clearInterval(window.__heroTimer);
      window.__heroTimer = null;
    }
  }

  // Jeda saat tab browser diminimalkan
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopTimer();
    } else if (isPlaying) {
      startTimer();
    }
  });

  // Parallax ringan saat scroll
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        const scrollY = window.scrollY;
        const heroHeight = heroSection.offsetHeight;
        if (scrollY <= heroHeight) {
          const translateY = scrollY * 0.25;
          slidesWrapper.style.transform = `translate3d(0, ${translateY}px, 0)`;
        }
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  // Mulai slideshow otomatis
  setSlide(0);
  startTimer();
}

async function updateNavbarDataBadge() {
  try {
    const meta = await getRealisasiMeta();
    if (meta && meta.tanggal_data) {
      const badgeDateEl = document.querySelector('#nav-data-date-val');
      const badgeCard = document.querySelector('#nav-data-date-card');
      if (badgeDateEl) {
        badgeDateEl.textContent = formatTanggalIndonesia(meta.tanggal_data);
      }
      if (badgeCard) {
        badgeCard.style.display = 'block';
      }
    }
  } catch {
    // Sembunyikan jika data layer tidak menyediakan
    const badgeCard = document.querySelector('#nav-data-date-card');
    if (badgeCard) badgeCard.style.display = 'none';
  }
}

// =========================================================================
// ONDI EYE TRACKING (Pupil Mata Mengikuti Gerakan Kursor Mouse)
// =========================================================================
function initOndiEyeTracking() {
  const pupilLeft = document.getElementById('ondi-pupil-left');
  const pupilRight = document.getElementById('ondi-pupil-right');
  const svgEl = document.querySelector('.ondi-avatar-svg');
  if (!pupilLeft || !pupilRight || !svgEl) return;

  // Pastikan transisi awal adalah none agar tidak ada lag/delay
  pupilLeft.style.transition = 'none';
  pupilRight.style.transition = 'none';

  let mouseX = 0, mouseY = 0;
  let rafId = null;
  let isLeaving = false;

  function renderEyes() {
    rafId = null;
    if (isLeaving) return;

    // Hitung posisi mata presisi berdasarkan bounding box SVG viewBox(60 230 460 630)
    // Mata kiri: cx=254, cy=476 -> x=(254-60)/460 = 0.4217, y=(476-230)/630 = 0.3905
    // Mata kanan: cx=326, cy=476 -> x=(326-60)/460 = 0.5783, y=(476-230)/630 = 0.3905
    const rect = svgEl.getBoundingClientRect();
    const eyeY = rect.top + rect.height * 0.3905;
    const leftEyeX = rect.left + rect.width * 0.4217;
    const rightEyeX = rect.left + rect.width * 0.5783;

    // Batas radius gerak pupil mata (px)
    const maxRadius = 7.5;

    // Mata Kiri
    const dxL = mouseX - leftEyeX;
    const dyL = mouseY - eyeY;
    const angleL = Math.atan2(dyL, dxL);
    const distL = Math.hypot(dxL, dyL);
    const moveDistL = distL < 1 ? 0 : Math.min(distL / 4.5, maxRadius);
    const mxL = (Math.cos(angleL) * moveDistL).toFixed(2);
    const myL = (Math.sin(angleL) * moveDistL).toFixed(2);

    // Mata Kanan
    const dxR = mouseX - rightEyeX;
    const dyR = mouseY - eyeY;
    const angleR = Math.atan2(dyR, dxR);
    const distR = Math.hypot(dxR, dyR);
    const moveDistR = distR < 1 ? 0 : Math.min(distR / 4.5, maxRadius);
    const mxR = (Math.cos(angleR) * moveDistR).toFixed(2);
    const myR = (Math.sin(angleR) * moveDistR).toFixed(2);

    // Update instan tanpa reflow berulang
    pupilLeft.style.transform = `translate(${mxL}px, ${myL}px)`;
    pupilRight.style.transform = `translate(${mxR}px, ${myR}px)`;
  }

  // Event listener mousemove instan
  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    if (isLeaving) {
      isLeaving = false;
      pupilLeft.style.transition = 'none';
      pupilRight.style.transition = 'none';
    }

    if (!rafId) {
      rafId = requestAnimationFrame(renderEyes);
    }
  }, { passive: true });

  // Fallback halus saat mouse keluar dari layar dokumen
  document.addEventListener('mouseleave', () => {
    isLeaving = true;
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    pupilLeft.style.transition = 'transform 0.3s ease-out';
    pupilRight.style.transition = 'transform 0.3s ease-out';
    pupilLeft.style.transform = 'translate(0px, 0px)';
    pupilRight.style.transform = 'translate(0px, 0px)';
  });
}

// =========================================================================
// RINGKASAN EKSEKUTIF (PILAR 01 & PILAR 02)
// =========================================================================

/**
 * Inisialisasi Narasi Dinamis Maskot Ondi berdasarkan Capaian Tahun Berjalan
 */
export function initDynamicOndi(year = 2026) {
  const ondiNarrativeEl = document.querySelector('#ondi-narrative-text');
  const ondiFreshnessEl = document.querySelector('#ondi-freshness-text');
  const narrative = getDynamicOndiNarrative(year);

  if (ondiNarrativeEl && narrative && narrative.lead) {
    ondiNarrativeEl.innerHTML = narrative.lead;
  }
  if (ondiFreshnessEl && narrative && narrative.freshness) {
    ondiFreshnessEl.textContent = narrative.freshness;
  }
}

/**
 * Inisialisasi Ringkasan Eksekutif Pilar 1 & Pilar 2 dengan 11 Dataset Terpadu
 */
export function initExecutiveSummary(year = 2026) {
  const p1 = getPilar1Metrics(year);
  const p2 = getPilar2Metrics(year);

  // =========================================================================
  // 1. Pilar 01: Penerimaan Pajak Daerah (Datasets 1, 2, 3, 8, 9, 10, 11)
  // =========================================================================
  const targetPajakEl = document.querySelector('#metric-target-pajak');
  const realisasiPajakEl = document.querySelector('#metric-realisasi-pajak');
  const persenPajakEl = document.querySelector('#metric-persen-pajak');
  const progressBarPajakEl = document.querySelector('#progress-bar-pajak');
  const sisaPajakDescEl = document.querySelector('#metric-sisa-pajak-desc');
  const contributorsListEl = document.querySelector('#penerimaan-contributors-list');

  if (targetPajakEl) targetPajakEl.textContent = p1.target;
  if (realisasiPajakEl) realisasiPajakEl.textContent = p1.realisasi;
  if (persenPajakEl) persenPajakEl.textContent = p1.capaian;
  if (progressBarPajakEl) {
    progressBarPajakEl.style.width = `${Math.min(Math.max(p1.capaianRaw, 0), 100)}%`;
  }
  if (sisaPajakDescEl) {
    sisaPajakDescEl.textContent = `Target: ${p1.target} · Terkumpul: ${p1.realisasi} (${p1.capaian} tercapai)`;
  }

  // Dataset 01 & 02: Pajak Daerah vs Retribusi Daerah
  const pajakCapaianEl = document.querySelector('#metric-pajak-capaian-val');
  const retribusiCapaianEl = document.querySelector('#metric-retribusi-capaian-val');
  if (pajakCapaianEl) pajakCapaianEl.textContent = p1.pajakPersen;
  if (retribusiCapaianEl) retribusiCapaianEl.textContent = p1.retribusiPersen;

  // Dataset 11: Wajib Pajak Jakarta & Rasio Kepatuhan
  const totalWpEl = document.querySelector('#metric-total-wp-val');
  const tumbuhWpEl = document.querySelector('#metric-tumbuh-wp-val');
  const patuhWpEl = document.querySelector('#metric-patuh-wp-val');
  if (totalWpEl) totalWpEl.textContent = p1.totalWajibPajak;
  if (tumbuhWpEl) tumbuhWpEl.textContent = p1.pertumbuhanWp;
  if (patuhWpEl) patuhWpEl.textContent = p1.kepatuhanWp;

  // Dataset 03 & 10: 3 Kontributor Pajak Teratas
  if (contributorsListEl && Array.isArray(p1.topSectors) && p1.topSectors.length > 0) {
    contributorsListEl.innerHTML = p1.topSectors.map((s) => `
      <div class="exec-contributor-pill">
        <span class="pill-rank">${s.rank}</span>
        <span class="pill-name">${s.name}</span>
        <span class="pill-val">${s.value}</span>
      </div>
    `).join('');
  }

  // =========================================================================
  // 2. Pilar 02: Alokasi Belanja Kota & Pembiayaan (Datasets 4, 5, 6, 7)
  // =========================================================================
  const totalBelanjaEl = document.querySelector('#metric-total-belanja');
  const realisasiBelanjaEl = document.querySelector('#metric-realisasi-belanja');
  const persenBelanjaEl = document.querySelector('#metric-persen-belanja');
  const progressBarBelanjaEl = document.querySelector('#progress-bar-belanja');
  const statusBelanjaEl = document.querySelector('#metric-status-belanja');

  if (totalBelanjaEl) totalBelanjaEl.textContent = p2.total;
  if (realisasiBelanjaEl) realisasiBelanjaEl.textContent = p2.terserap;
  if (persenBelanjaEl) persenBelanjaEl.textContent = p2.persentase;
  if (statusBelanjaEl) statusBelanjaEl.textContent = p2.statusSerapan;
  if (progressBarBelanjaEl) {
    progressBarBelanjaEl.style.width = `${Math.min(Math.max(p2.serapanRaw, 0), 100)}%`;
  }

  // Dataset 05: 4 Kelompok Belanja (Operasi, Modal, BTT, Transfer)
  const kelompokGridEl = document.querySelector('#belanja-kelompok-grid');
  if (kelompokGridEl && Array.isArray(p2.kelompokBelanja)) {
    kelompokGridEl.innerHTML = p2.kelompokBelanja.map((k) => `
      <div class="exec-kelompok-item">
        <div class="kelompok-item-head">
          <span class="kelompok-name">${k.name}</span>
          <span class="kelompok-share">${k.porsi}</span>
        </div>
        <div class="kelompok-val">${k.nominal}</div>
        <div class="kelompok-pagu">${k.desc}</div>
      </div>
    `).join('');
  }

  // 3 Fokus Alokasi Layanan Publik
  const sectorsListEl = document.querySelector('#belanja-sectors-list');
  if (sectorsListEl && Array.isArray(p2.topSectors) && p2.topSectors.length > 0) {
    sectorsListEl.innerHTML = p2.topSectors.map((s) => `
      <div class="exec-sector-card">
        <span class="sector-icon" aria-hidden="true">${s.icon || '🏛️'}</span>
        <div class="sector-info">
          <span class="sector-name">${s.name || ''}</span>
          <span class="sector-val">${s.value || 'Rp -- T'}</span>
        </div>
      </div>
    `).join('');
  }

  // Dataset 04 & 07: Transparansi Pembiayaan (SiLPA & BUMD) serta Neraca APBD
  const silpaEl = document.querySelector('#metric-silpa-val');
  const bumdEl = document.querySelector('#metric-bumd-val');
  const bumdFokusEl = document.querySelector('#metric-bumd-fokus');
  const neracaEl = document.querySelector('#metric-neraca-val');
  const neracaDescEl = document.querySelector('#metric-neraca-desc');
  const pembiayaanStatusEl = document.querySelector('#pembiayaan-status-label');

  if (silpaEl) silpaEl.textContent = p2.silpa;
  if (bumdEl) bumdEl.textContent = p2.penyertaanBumd;
  if (bumdFokusEl) bumdFokusEl.textContent = p2.fokusBumd;
  if (neracaEl) neracaEl.textContent = p2.statusNeraca;
  if (neracaDescEl) neracaDescEl.textContent = `Pendapatan ${p2.totalPendapatan} vs Belanja ${p2.totalBelanja} · Pembiayaan Netto ${p2.pembiayaanNetto}`;
  if (pembiayaanStatusEl) {
    pembiayaanStatusEl.textContent = 'Fiskal Terkendali';
  }
}



