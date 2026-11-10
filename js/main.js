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
  try { initOndiCustomCursor(); } catch (err) { console.error('Ondi custom cursor error:', err); }
  try { initHeroSlideshow(); } catch (err) { console.error('Hero slideshow error:', err); }
  try { initNavbar(); } catch (err) { console.error('Navbar error:', err); }
  try { initSiteMotion(); } catch (err) { console.error('Site motion error:', err); }
  try { updateNavbarDataBadge(); } catch (err) { console.error('Data badge error:', err); }
  try { initOndiEyeTracking(); } catch (err) { console.error('Ondi eye tracking error:', err); }
  try { initOndiBelanjaArmTracking(); } catch (err) { console.error('Ondi belanja arm tracking error:', err); }
  try { initDynamicOndi(2026); } catch (err) { console.error('Dynamic Ondi error:', err); }
  try { initExecutiveSummary(2026); } catch (err) { console.error('Executive summary error:', err); }
  try { initWelcomeGreeting(); } catch (err) { /* silent fail */ }
  try { initFooterMascot(); } catch (err) { /* silent fail */ }

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

    // =========================================================================
    // PHYSICAL SCROLL-LINKED PUSH EFFECT (1:1 PARALLAX CURTAIN SEAM COLLISION)
    // =========================================================================
    const mainEl = document.querySelector('main') || document.querySelector('.page-content-wrapper');
    const navHeight = siteHeader.offsetHeight || 54;
    const mainBottom = mainEl ? mainEl.getBoundingClientRect().bottom : 9999;
    const isCurtainActive = mainBottom <= window.innerHeight;

    if (isCurtainActive) {
      // Pastikan kelas is-hidden dilepas saat area tirai aktif agar navbar tetap terlihat di posisinya
      // selama konten <main> masih berada di belakangnya (sebelum seam menyentuh navbar).
      siteHeader.classList.remove('is-hidden');

      if (mainBottom <= navHeight) {
        // Seam (ujung bawah <main>) telah menyentuh batas navbar dan bergerak melaluinya:
        // Dorong navbar naik pixel-by-pixel secara fisik 1:1 bersamaan dengan naiknya seam!
        const offset = navHeight - Math.max(0, mainBottom);
        siteHeader.style.transition = 'none'; // Sinkronisasi scroll instan 1:1 tanpa jeda
        siteHeader.style.transform = `translateY(-${offset}px)`;

        if (offset >= navHeight) {
          siteHeader.classList.add('nav-hidden-footer');
        } else {
          siteHeader.classList.remove('nav-hidden-footer');
        }
      } else {
        // Seam tirai belum menyentuh navbar: jaga navbar tetap stabil terlihat di translateY(0)
        siteHeader.style.transition = 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)';
        siteHeader.style.transform = 'translateY(0)';
        siteHeader.classList.remove('nav-hidden-footer');
      }
    } else {
      // Di luar area tirai (saat membaca konten utama):
      // Kembalikan inline style agar sistem show/hide scroll standar aktif kembali
      siteHeader.style.transition = '';
      siteHeader.style.transform = '';
      siteHeader.classList.remove('nav-hidden-footer');

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
  if (statusBelanjaEl) {
    statusBelanjaEl.textContent = p2.statusSerapan === 'Sangat Efektif' ? 'Sangat efektif' : p2.statusSerapan;
  }
  if (progressBarBelanjaEl) {
    progressBarBelanjaEl.style.width = `${Math.min(Math.max(p2.serapanRaw, 0), 100)}%`;
  }

  // Dataset 05: 4 Kelompok Belanja (Operasi, Modal, BTT, Transfer)
  const kelompokGridEl = document.querySelector('#belanja-kelompok-grid');
  if (kelompokGridEl && Array.isArray(p2.kelompokBelanja)) {
    const barColors = ['bar-red', 'bar-gold', 'bar-green', 'bar-dark'];
    kelompokGridEl.innerHTML = p2.kelompokBelanja.map((k, idx) => {
      const rawPct = parseFloat(String(k.porsi).replace(',', '.')) || 0;
      const barWidth = Math.max(rawPct, 4);
      const colorClass = barColors[idx % barColors.length];
      return `
        <div class="pilar2-kelompok-item">
          <span class="pilar2-kelompok-name">${k.name}</span>
          <span class="pilar2-kelompok-pct">${k.porsi}</span>
          <div class="pilar2-kelompok-track" aria-hidden="true">
            <div class="pilar2-kelompok-fill ${colorClass}" style="width: ${barWidth}%;"></div>
          </div>
          <span class="pilar2-kelompok-nom">${k.nominal}</span>
        </div>
      `;
    }).join('');
  }

  // 3 Fokus Alokasi Layanan Publik Prioritas
  const sectorsListEl = document.querySelector('#belanja-sectors-list');
  if (sectorsListEl && Array.isArray(p2.topSectors) && p2.topSectors.length > 0) {
    const dotColors = ['dot-gold', 'dot-green', 'dot-red'];
    sectorsListEl.innerHTML = p2.topSectors.map((s, idx) => {
      const dotClass = dotColors[idx % dotColors.length];
      return `
        <div class="pilar2-sector-row">
          <span class="pilar2-sector-dot ${dotClass}" aria-hidden="true"></span>
          <span class="pilar2-sector-name">${s.name || ''}</span>
          <span class="pilar2-sector-val">${s.value || 'Rp -- T'}</span>
        </div>
      `;
    }).join('');
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

/**
 * Maskot Ondi Edukatif di Footer:
 * Menampilkan 10 maskot Ondi (5 ekspresi masing-masing 2x) dari sprite walk strip
 * berjalan secara vertikal acak di taman, dengan pesan insight APBD langsung tampil tanpa hover kursor.
 */
function initFooterMascot() {
  const stage = document.getElementById('footerOndiStage');
  if (!stage) return;

  const BASE_EXPRESSIONS = [
    { key: 'senang',  label: 'Ondi Senang',  file: 'public/assets/maskot-ondi-gerak/ondi-walk-strip-per-ekspresi/ondi-walk-senang.png' },
    { key: 'kaget',   label: 'Ondi Kaget',   file: 'public/assets/maskot-ondi-gerak/ondi-walk-strip-per-ekspresi/ondi-walk-kaget.png' },
    { key: 'marah',   label: 'Ondi Tegas',   file: 'public/assets/maskot-ondi-gerak/ondi-walk-strip-per-ekspresi/ondi-walk-marah.png' },
    { key: 'ngantuk', label: 'Ondi Santai',  file: 'public/assets/maskot-ondi-gerak/ondi-walk-strip-per-ekspresi/ondi-walk-ngantuk.png' },
    { key: 'sedih',   label: 'Ondi Peduli',  file: 'public/assets/maskot-ondi-gerak/ondi-walk-strip-per-ekspresi/ondi-walk-sedih.png' }
  ];

  // Setiap ekspresi dibuat 2x -> total 10 maskot, lalu acak urutannya
  const ondiPool = [...BASE_EXPRESSIONS, ...BASE_EXPRESSIONS]
    .sort(() => Math.random() - 0.5);

  const INSIGHTS = [
    'Halo warga! Yuk telusuri ke mana uang pajak Jakarta mengalir.',
    'Pajak daerah membiayai Transjakarta, MRT, dan LRT setiap hari.',
    'PBB-P2 dan PKB adalah kontributor terbesar pendapatan daerah Jakarta.',
    'Minimal 20% APBD dialokasikan untuk sektor pendidikan & sekolah.',
    'Lebih dari 1.200 taman & RPTRA kota dirawat dari anggaran belanja daerah.',
    'Transparansi fiskal memastikan setiap rupiah kembali ke fasilitas warga.',
    'Data APBD diproses aman langsung di browsermu tanpa pelacakan server.'
  ];

  // 10 jalur horizontal tersebar merata di area taman dengan sedikit variasi acak
  const LANES = [6, 15, 24, 34, 44, 54, 64, 74, 83, 91];
  // 2 posisi utama yang menampilkan bubble insight secara langsung (tanpa hover)
  const AUTO_VISIBLE_SLOTS = new Set([1, 7]);
  const activeBubbles = [];

  stage.innerHTML = '';

  ondiPool.forEach((expr, idx) => {
    const lane = LANES[idx] + (Math.random() * 3 - 1.5);
    const bottom = Math.floor(Math.random() * 18) + 4;
    const distance = -(Math.floor(Math.random() * 32) + 38);
    const duration = (4.6 + Math.random() * 4.0).toFixed(2);
    const delay = -(Math.random() * 7).toFixed(2);
    const walkSpeed = (0.7 + Math.random() * 0.32).toFixed(2);
    const depthScale = (0.94 + Math.random() * 0.14).toFixed(2);
    const isFlipped = Math.random() > 0.5;
    const isVisibleByDefault = AUTO_VISIBLE_SLOTS.has(idx);

    let alignClass = '';
    if (lane < 20) alignClass = 'bubble-align-left';
    else if (lane > 76) alignClass = 'bubble-align-right';

    const walker = document.createElement('div');
    walker.className = `ondi-patrol-walker${isFlipped ? ' is-flipped' : ''}`;
    walker.setAttribute('tabindex', '0');
    walker.setAttribute('role', 'button');
    walker.setAttribute('aria-label', `${expr.label} - Fakta APBD Jakarta`);
    walker.style.setProperty('--patrol-left', `${lane.toFixed(1)}%`);
    walker.style.setProperty('--patrol-bottom', `${bottom}px`);
    walker.style.setProperty('--patrol-distance', `${distance}px`);
    walker.style.setProperty('--patrol-duration', `${duration}s`);
    walker.style.setProperty('--patrol-delay', `${delay}s`);
    walker.style.setProperty('--walk-fps-duration', `${walkSpeed}s`);
    walker.style.setProperty('--depth-scale', depthScale);
    walker.style.setProperty('--patrol-z', `${4 + (idx % 4)}`);

    const bubble = document.createElement('div');
    bubble.className = `ondi-speech-bubble${alignClass ? ' ' + alignClass : ''}${isVisibleByDefault ? ' is-visible' : ''}`;
    bubble.setAttribute('role', 'status');
    bubble.setAttribute('aria-live', 'polite');

    const initialText = INSIGHTS[(idx * 2) % INSIGHTS.length];
    bubble.innerHTML = `
      <span class="bubble-tag">Insight APBD Jakarta</span>
      <p class="bubble-text">${initialText}</p>
    `;

    const avatar = document.createElement('div');
    avatar.className = 'ondi-avatar ondi-walk-sprite';
    avatar.style.backgroundImage = `url('${expr.file}')`;
    avatar.setAttribute('aria-label', expr.label);

    walker.appendChild(bubble);
    walker.appendChild(avatar);
    stage.appendChild(walker);

    if (isVisibleByDefault) {
      activeBubbles.push(bubble);
    }

    // Interaksi opsional jika user mengklik Ondi manapun: tampilkan/ganti insightnya langsung
    walker.addEventListener('click', () => {
      const textEl = bubble.querySelector('.bubble-text');
      if (textEl) {
        textEl.textContent = INSIGHTS[Math.floor(Math.random() * INSIGHTS.length)];
      }
      bubble.classList.add('is-visible');
    });
  });

  // Rotasi otomatis pesan insight secara berkala pada bubble yang langsung tampil
  let cycleIdx = 0;
  setInterval(() => {
    cycleIdx = (cycleIdx + 1) % INSIGHTS.length;
    activeBubbles.forEach((bubble, bIdx) => {
      const textEl = bubble.querySelector('.bubble-text');
      if (!textEl) return;
      textEl.style.opacity = '0';
      setTimeout(() => {
        textEl.textContent = INSIGHTS[(cycleIdx + bIdx * 2) % INSIGHTS.length];
        textEl.style.opacity = '1';
      }, 220);
    });
  }, 4800);
}

// =========================================================================
// KURSOR KEPALA ONDI & ANIMASI KLIK MENGEDIP (64x64px)
// =========================================================================
function initOndiCustomCursor() {
  if (!window.matchMedia('(pointer: fine)').matches) return; // Tidak aktif di layar sentuh

  let k = document.getElementById('ondi-kursor');
  if (!k) {
    k = document.createElement('div');
    k.id = 'ondi-kursor';
    k.setAttribute('aria-hidden', 'true');
    k.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="117.5 235 345 345">
<defs><filter id="ondi-kursor-kontur" x="-10%" y="-10%" width="120%" height="120%"><feMorphology in="SourceAlpha" operator="dilate" radius="6" result="tebal"/><feFlood flood-color="#FFFFFF" result="putih"/><feComposite in="putih" in2="tebal" operator="in" result="kontur"/><feMerge><feMergeNode in="kontur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
<g filter="url(#ondi-kursor-kontur)"><g id="ondi-kursor-kepala"><line x1="290" y1="395" x2="290" y2="257" stroke="#E0A526" stroke-width="27" stroke-linecap="round"/><line x1="276" y1="395" x2="236" y2="285" stroke="#E0A526" stroke-width="27" stroke-linecap="round"/><line x1="304" y1="395" x2="344" y2="285" stroke="#E0A526" stroke-width="27" stroke-linecap="round"/><line x1="258" y1="395" x2="207" y2="327" stroke="#E0A526" stroke-width="27" stroke-linecap="round"/><line x1="322" y1="395" x2="373" y2="327" stroke="#E0A526" stroke-width="27" stroke-linecap="round"/><line x1="240" y1="393" x2="195" y2="378" stroke="#E0A526" stroke-width="27" stroke-linecap="round"/><line x1="340" y1="393" x2="385" y2="378" stroke="#E0A526" stroke-width="27" stroke-linecap="round"/><path d="M203,440 V400 H377 V440 V510 Q377,572 290,572 Q203,572 203,510 Z" fill="#B71C1C"/><path d="M203,411 V393 Q203,385 211,385 H369 Q377,385 377,393 V411 Z" fill="#E0A526"/><path d="M203,410 L217.5,428 L232,410 L246.5,428 L261,410 L275.5,428 L290,410 L304.5,428 L319,410 L333.5,428 L348,410 L362.5,428 L377,410 Z" fill="#E0A526"/><path d="M203,410 L217.5,428 L232,410 L246.5,428 L261,410 L275.5,428 L290,410 L304.5,428 L319,410 L333.5,428 L348,410 L362.5,428 L377,410 Z" fill="#E0A526"/><line x1="226" y1="438" x2="280" y2="438" stroke="#231F1F" stroke-width="9" stroke-linecap="round"/><line x1="300" y1="438" x2="354" y2="438" stroke="#231F1F" stroke-width="9" stroke-linecap="round"/><g class="mata-buka"><circle cx="254" cy="476" r="22" fill="#fff"/><circle cx="254" cy="476" r="11" fill="#231F1F"/><circle cx="326" cy="476" r="22" fill="#fff"/><circle cx="326" cy="476" r="11" fill="#231F1F"/></g><g class="mata-tutup"><path d="M231,476 Q254,490 277,476" fill="none" stroke="#231F1F" stroke-width="8" stroke-linecap="round"/><path d="M303,476 Q326,490 349,476" fill="none" stroke="#231F1F" stroke-width="8" stroke-linecap="round"/></g><path d="M243,532 Q245,518 270,517 Q282,517 290,522 Q298,517 310,517 Q335,518 337,532 Q316,526 290,530 Q264,526 243,532 Z" fill="#231F1F"/><path d="M264,547 Q290,561 316,547" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round"/></g><line class="sinar" style="--dx:-1;--dy:-0.7" x1="178" y1="350" x2="142" y2="324"/><line class="sinar" style="--dx:-1;--dy:-0.1" x1="184" y1="436" x2="140" y2="432"/><line class="sinar" style="--dx:-0.9;--dy:0.6" x1="190" y1="510" x2="152" y2="532"/><line class="sinar" style="--dx:1;--dy:-0.7" x1="402" y1="350" x2="438" y2="324"/><line class="sinar" style="--dx:1;--dy:-0.1" x1="396" y1="436" x2="440" y2="432"/><line class="sinar" style="--dx:0.9;--dy:0.6" x1="390" y1="510" x2="428" y2="532"/></g>
</svg>`;
    document.body.appendChild(k);
  }

  const svg = k.querySelector('svg');
  let clickTimer = null;

  document.addEventListener('mousemove', (e) => {
    k.classList.add('aktif');
    k.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
  }, { passive: true });

  document.addEventListener('mouseleave', () => {
    k.classList.remove('aktif');
  });

  document.addEventListener('mousedown', () => {
    k.classList.remove('klik');
    if (svg) void svg.getBoundingClientRect(); // Mulai ulang animasi tiap klik
    k.classList.add('klik');
    clearTimeout(clickTimer);
    clickTimer = setTimeout(() => {
      k.classList.remove('klik');
    }, 450);
  });
}

// =========================================================================
// MASKOT ONDI PILAR 02: HANYA LENGAN KIRI (#lengan-menunjuk) BERPUTAR DI BAHU
// =========================================================================
function initOndiBelanjaArmTracking() {
  // Konstanta yang dapat disesuaikan:
  const PIVOT_X = 224;          // Titik sendi bahu X dalam koordinat SVG
  const PIVOT_Y = 598;          // Titik sendi bahu Y dalam koordinat SVG
  const REST_ANGLE_DEG = 206;   // Sudut awal lengan menunjuk (kiri-atas, ~206°)
  const MIN_ANGLE_DEG = 100;    // Batas bawah sudut (kiri-bawah)
  const MAX_ANGLE_DEG = 245;    // Batas atas sudut (kiri-atas)
  const SMOOTHING = 0.18;       // Faktor interpolasi per frame
  const MAX_STEP_DEG = 12;      // Batas kecepatan putar maksimum (derajat/frame)
  const EPSILON_DEG = 0.1;      // Ambang batas berhenti loop RAF

  const stages = document.querySelectorAll('.pilar2-ondi-stage');
  if (stages.length === 0) return;

  // Layar sentuh atau prefers-reduced-motion: lengan tetap di posisi awal (206°)
  const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
  const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (isCoarsePointer || isReducedMotion) {
    stages.forEach((stage) => {
      const lengan = stage.querySelector('#lengan-menunjuk');
      if (lengan) {
        lengan.setAttribute('transform', `rotate(0 ${PIVOT_X} ${PIVOT_Y})`);
      }
    });
    return;
  }

  let kursorX = null;
  let kursorY = null;
  let isCursorInWindow = false;

  const instances = [];

  stages.forEach((stage) => {
    const svg = stage.querySelector('svg');
    const lengan = svg ? svg.querySelector('#lengan-menunjuk') : null;
    if (!svg || !lengan) return;

    const instance = {
      svg,
      lengan,
      pt: svg.createSVGPoint(),
      sudutSaatIni: REST_ANGLE_DEG,
      isVisible: true,
      rafId: null
    };

    // Pastikan posisi awal di 206° (rotasi relatif 0°)
    lengan.setAttribute('transform', `rotate(0 ${PIVOT_X} ${PIVOT_Y})`);
    instances.push(instance);
  });

  if (instances.length === 0) return;

  const computeTargetAngle = (inst) => {
    if (!isCursorInWindow || kursorX === null || kursorY === null) {
      return REST_ANGLE_DEG;
    }
    const ctm = inst.svg.getScreenCTM();
    if (!ctm) return REST_ANGLE_DEG;

    inst.pt.x = PIVOT_X;
    inst.pt.y = PIVOT_Y;
    const bahu = inst.pt.matrixTransform(ctm);

    // Sudut layar (0° = kanan, searah jarum jam positif karena Y ke bawah), normalisasi 0–360
    const rawDeg = Math.atan2(kursorY - bahu.y, kursorX - bahu.x) * (180 / Math.PI);
    const normDeg = ((rawDeg % 360) + 360) % 360;

    // Clamp ke rentang [100°, 245°] agar tidak menembus badan atau menutupi wajah
    return Math.min(Math.max(normDeg, MIN_ANGLE_DEG), MAX_ANGLE_DEG);
  };

  const stepInstance = (inst) => {
    inst.rafId = null;
    if (document.hidden || !inst.isVisible) return;

    const target = computeTargetAngle(inst);
    const diff = target - inst.sudutSaatIni;

    if (Math.abs(diff) < EPSILON_DEG) {
      inst.sudutSaatIni = target;
      inst.lengan.setAttribute(
        'transform',
        `rotate(${(inst.sudutSaatIni - REST_ANGLE_DEG).toFixed(2)} ${PIVOT_X} ${PIVOT_Y})`
      );
      return; // Hentikan loop RAF saat sudah mencapai target
    }

    let delta = diff * SMOOTHING;
    if (delta > MAX_STEP_DEG) delta = MAX_STEP_DEG;
    if (delta < -MAX_STEP_DEG) delta = -MAX_STEP_DEG;

    inst.sudutSaatIni += delta;
    inst.lengan.setAttribute(
      'transform',
      `rotate(${(inst.sudutSaatIni - REST_ANGLE_DEG).toFixed(2)} ${PIVOT_X} ${PIVOT_Y})`
    );

    inst.rafId = requestAnimationFrame(() => stepInstance(inst));
  };

  const wakeAll = () => {
    if (document.hidden) return;
    instances.forEach((inst) => {
      if (inst.isVisible && !inst.rafId) {
        inst.rafId = requestAnimationFrame(() => stepInstance(inst));
      }
    });
  };

  const stopAll = () => {
    instances.forEach((inst) => {
      if (inst.rafId) {
        cancelAnimationFrame(inst.rafId);
        inst.rafId = null;
      }
    });
  };

  window.addEventListener('mousemove', (e) => {
    kursorX = e.clientX;
    kursorY = e.clientY;
    isCursorInWindow = true;
    wakeAll();
  }, { passive: true });

  document.addEventListener('mouseleave', () => {
    isCursorInWindow = false;
    wakeAll();
  });

  window.addEventListener('scroll', () => {
    if (isCursorInWindow) wakeAll();
  }, { passive: true });

  window.addEventListener('resize', () => {
    if (isCursorInWindow) wakeAll();
  }, { passive: true });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopAll();
    } else {
      wakeAll();
    }
  });

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const inst = instances.find((item) => item.svg === entry.target);
        if (!inst) return;
        inst.isVisible = entry.isIntersecting;
        if (!inst.isVisible && inst.rafId) {
          cancelAnimationFrame(inst.rafId);
          inst.rafId = null;
        } else if (inst.isVisible) {
          wakeAll();
        }
      });
    }, { threshold: 0.01 });

    instances.forEach((inst) => observer.observe(inst.svg));
  }
}


