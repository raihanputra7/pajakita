/**
 * paJAK-Kita — Modul Halaman Belanja APBD DKI Jakarta (belanja.html)
 * File: js/belanja.js
 *
 * Mengintegrasikan dataset lengkap 5 tahun (2022–2026) dari dataEngine.js & proyek:
 * 1. Hero KPI & Pemilih Tahun 2022–2026 interaktif dengan count-up & penanda progress.
 * 2. 4 Kelompok Belanja Daerah per tahun terpilih.
 * 3. Simulasi Rp100 Waffle 10x10 + Ondi Pemandu Interaktif #1.
 * 4. Tab 5 Dinas & Program Prioritas (data lengkap untuk seluruh dinas) + Ondi #2.
 * 5. Pembiayaan SiLPA & Neraca APBD per tahun terpilih.
 */

import {
  OFFICIAL_5YR_DATASET,
  formatRupiahSingkat,
  formatPersen
} from './dataEngine.js';

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

function prefersReducedMotion() {
  return Boolean(
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia(REDUCED_MOTION_QUERY).matches
  );
}

// Keluarga ikon garis SVG konsisten (stroke-width 1.7, ujung membulat, bebas emoji)
const SVG_PATHS = {
  briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18"/>',
  building: '<path d="M3 21h18M5 21V8l7-4 7 4v13M9 21v-6h6v6M9 11h.01M15 11h.01"/>',
  alert: '<path d="M12 3l10 18H2L12 3z"/><path d="M12 10v5M12 18h.01"/>',
  transfer: '<path d="M4 8h14l-3-3M20 16H6l3 3"/>',
  cap: '<path d="M2 9l10-5 10 5-10 5L2 9z"/><path d="M6 11.5V16c0 1.5 3 3 6 3s6-1.5 6-3v-4.5M22 9v6"/>',
  road: '<path d="M8 3L4 21M16 3l4 18M12 4v3M12 11v3M12 18v3"/>',
  heart: '<path d="M12 21s-8-5.2-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.8-8 11-8 11z"/><path d="M12 9v5M9.5 11.5h5"/>',
  drop: '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>',
  bus: '<rect x="4" y="3" width="16" height="14" rx="3"/><path d="M4 11h16M8 17v3M16 17v3M8 14h.01M16 14h.01"/>',
  leaf: '<path d="M5 19C5 10 10 5 20 4c0 10-5 15-14 15z"/><path d="M5 19c3-5 6-8 10-10"/>',
  users: '<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.5 2.7-6 6-6s6 2.5 6 6M16 5.2a3 3 0 0 1 0 5.6M18 14.5c2 .7 3 2.6 3 5.5"/>',
  landmark: '<path d="M3 10l9-6 9 6M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 21h18"/>',
  dots: '<path d="M6 12h.01M12 12h.01M18 12h.01"/>'
};

function renderIcon(name, size = 22) {
  const path = SVG_PATHS[name] || SVG_PATHS.building;
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
}

// Data Pembiayaan & BUMD 5 Tahun (tahun 2026 bersumber langsung dari OFFICIAL_5YR_DATASET.pembiayaan2026)
const PEMBIAYAAN_5YR = {
  2022: { silpa: 3980000000000, bumd: 3650000000000, netto: 1950000000000 },
  2023: { silpa: 4320000000000, bumd: 4050000000000, netto: 2350000000000 },
  2024: { silpa: 4650000000000, bumd: 4380000000000, netto: 2720000000000 },
  2025: { silpa: 4890000000000, bumd: 4620000000000, netto: 2980000000000 },
  2026: {
    silpa: OFFICIAL_5YR_DATASET.pembiayaan2026.penerimaanSiLPA,
    bumd: OFFICIAL_5YR_DATASET.pembiayaan2026.penyertaanModalBUMD,
    netto: OFFICIAL_5YR_DATASET.pembiayaan2026.pembiayaanNetto
  }
};

// Komposisi Simulasi Rp100 + Basis Data 2026 Dinas Prioritas
const RP100_DINAS = [
  {
    key: 'pendidikan',
    nama: 'Dinas Pendidikan',
    icon: 'cap',
    porsiRp100: 24,
    color: '#B71C1C',
    pose: 'scaleX(1) rotate(-3deg)',
    bubbleDinas: 'Dinas Pendidikan menerima Rp24 per Rp100 dengan serapan 95,7% untuk KJP Plus hingga sekolah Net Zero.',
    detail: {
      pagu: 19800000000000,
      realisasi: 18950000000000,
      serapan: 95.7,
      deskripsi: 'Penyaluran Kartu Jakarta Pintar (KJP Plus), Kartu Jakarta Mahasiswa Unggul (KJMU), BOS, dan Revitalisasi Sekolah Net Zero.',
      program: [
        'Bantuan biaya personal pendidikan lewat KJP Plus & KJMU bagi ratusan ribu siswa',
        'Pembangunan & rehabilitasi total gedung sekolah ramah lingkungan (Net Zero Energy)',
        'Peningkatan kesejahteraan guru honorer & tenaga kependidikan',
        'Akses internet cepat & laboratorium digital sekolah'
      ]
    }
  },
  {
    key: 'binamarga',
    nama: 'Dinas Bina Marga',
    icon: 'road',
    porsiRp100: 12,
    color: '#E0A526',
    pose: 'scaleX(-1) rotate(3deg)',
    bubbleDinas: 'Dinas Bina Marga mendapat porsi Rp12 per Rp100 untuk trotoar, jalan, jembatan, dan utilitas bawah tanah.',
    detail: {
      pagu: 5450000000000,
      realisasi: 5120000000000,
      serapan: 93.9,
      deskripsi: 'Pembangunan & perawatan jalan, jembatan, JPO terintegrasi, trotoar ramah pejalan kaki, dan utilitas bawah tanah (SJUT).',
      program: [
        'Revitalisasi trotoar terpadu ramah disabilitas dan JPO ikonik Sudirman–Thamrin',
        'Pembangunan flyover & underpass pengurai simpul kemacetan kota',
        'Relokasi kabel udara ke saluran jaringan utilitas terpadu (SJUT) bawah tanah',
        'Pemeliharaan berkala jalan protokol dan penerangan jalan umum LED'
      ]
    }
  },
  {
    key: 'kesehatan',
    nama: 'Dinas Kesehatan',
    icon: 'heart',
    porsiRp100: 14,
    color: '#8E3B7A',
    pose: 'scaleX(1) rotate(3deg)',
    bubbleDinas: 'Dinas Kesehatan mengelola Rp14 per Rp100 untuk jaminan kesehatan warga, RSUD, puskesmas, dan ambulans 24 jam.',
    detail: {
      pagu: 11200000000000,
      realisasi: 10720000000000,
      serapan: 95.7,
      deskripsi: 'Jaminan Kesehatan Semesta (UHC) warga DKI, transformasi RSUD dan Puskesmas, penanggulangan stunting, dan Posyandu terpadu.',
      program: [
        'Premi Jaminan Kesehatan Semesta bagi warga DKI Jakarta peserta kelas 3 mandiri',
        'Pengadaan alat medis mutakhir dan perluasan ruang rawat inap RSUD',
        'Intervensi gizi terpadu dan percepatan penurunan stunting tingkat kelurahan',
        'Layanan Ambulans Gawat Darurat (AGD 119) gratis 24 jam untuk warga'
      ]
    }
  },
  {
    key: 'sda',
    nama: 'Dinas Sumber Daya Air (SDA)',
    icon: 'drop',
    porsiRp100: 10,
    color: '#2563A8',
    pose: 'scaleX(-1) rotate(-2deg)',
    bubbleDinas: 'Dinas Sumber Daya Air menerima Rp10 per Rp100 untuk pembangunan waduk, pompa banjir, dan tanggul pesisir.',
    detail: {
      pagu: 5200000000000,
      realisasi: 4860000000000,
      serapan: 93.5,
      deskripsi: 'Pencegahan banjir dan rob, normalisasi sungai, pembangunan waduk penampung air, serta optimalisasi rumah pompa.',
      program: [
        'Pembangunan dan pengerukan Waduk Brigif, Pondok Ranggon, serta embung resapan',
        'Optimalisasi stasiun rumah pompa utama di Pluit, Ancol, dan Pasar Ikan',
        'Penguatan tanggul pengaman pesisir pantai utara Jakarta',
        'Grebek lumpur saluran mikro dan kali penghubung sebelum musim hujan'
      ]
    }
  },
  {
    key: 'dishub',
    nama: 'Dinas Perhubungan',
    icon: 'bus',
    porsiRp100: 8,
    color: '#D9692A',
    pose: 'scaleX(1) rotate(-2deg)',
    bubbleDinas: 'Dinas Perhubungan menerima Rp8 per Rp100 untuk subsidi tarif Transjakarta, MRT, LRT, dan Mikrotrans gratis.',
    detail: {
      pagu: 6800000000000,
      realisasi: 6510000000000,
      serapan: 95.7,
      deskripsi: 'Subsidi tarif angkutan umum Transjakarta, MRT, LRT, Mikrotrans JakLingko gratis, serta pengaturan lalu lintas cerdas.',
      program: [
        'Subsidi tarif transportasi publik Transjakarta Rp3.500 dan JakLingko Rp0',
        'Perluasan rute angkutan pengumpan Mikrotrans AC hingga permukiman warga',
        'Sistem kendali lalu lintas cerdas (ITS) di persimpangan utama kota',
        'Pemeliharaan rambu, marka jalan, dan integrasi halte antarmoda'
      ]
    }
  },
  {
    key: 'lh',
    nama: 'Dinas Lingkungan Hidup',
    icon: 'leaf',
    porsiRp100: 4,
    color: '#1F7A57',
    pose: 'scaleX(1)',
    bubbleDinas: 'Dinas Lingkungan Hidup menerima Rp4 dari setiap Rp100 untuk pengolahan sampah dan kualitas udara.',
    detail: null
  },
  {
    key: 'sosial',
    nama: 'Dinas Sosial',
    icon: 'users',
    porsiRp100: 4,
    color: '#C0397A',
    pose: 'scaleX(1)',
    bubbleDinas: 'Dinas Sosial menerima Rp4 dari setiap Rp100 untuk bantuan lansia, disabilitas, anak, dan panti sosial.',
    detail: null
  },
  {
    key: 'pemerintahan',
    nama: 'OPD & Urusan Pemerintahan',
    icon: 'landmark',
    porsiRp100: 14,
    color: '#7A6A5E',
    pose: 'scaleX(1)',
    bubbleDinas: 'OPD & Urusan Pemerintahan menerima Rp14 dari setiap Rp100 untuk Damkar, layanan JAKI, dan administrasi warga.',
    detail: null
  },
  {
    key: 'lainnya',
    nama: 'Lainnya',
    icon: 'dots',
    porsiRp100: 10,
    color: '#8D8074',
    pose: 'scaleX(1)',
    bubbleDinas: 'Kategori Lainnya mencakup Rp10 dari setiap Rp100 belanja pendukung operasional kota.',
    detail: null
  }
];

let currentSelectedYear = 2026;
let activeOpdKey = 'pendidikan';
let heroCardRevealed = false;
let heroCountStarted = false;
let heroCountRafId = null;
let revealObserver = null;

export function initBelanjaPage() {
  renderYearChips();
  populateHeroStats(currentSelectedYear, false);
  renderKelompokBelanja(currentSelectedYear);
  renderWaffleRp100();
  renderDinasTabs();
  renderDinasPanel(activeOpdKey, false, currentSelectedYear);
  populatePembiayaanNeraca(currentSelectedYear);
  initScrollReveal();
}

/**
 * Count-up angka besar reusable (easing out ~1,8 detik)
 */
export function animateCountUp(el, targetVal, { duration = 1800, decimals = 1 } = {}) {
  if (!el) return;
  if (heroCountRafId !== null) {
    cancelAnimationFrame(heroCountRafId);
    heroCountRafId = null;
  }

  const formattedFinal = Number(targetVal).toFixed(decimals).replace('.', ',');
  if (prefersReducedMotion() || duration <= 0) {
    el.textContent = formattedFinal;
    return;
  }

  const start = performance.now();
  const step = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 4);
    el.textContent = (targetVal * eased).toFixed(decimals).replace('.', ',');
    if (progress < 1) {
      heroCountRafId = requestAnimationFrame(step);
    } else {
      el.textContent = formattedFinal;
      heroCountRafId = null;
    }
  };
  heroCountRafId = requestAnimationFrame(step);
}

/**
 * 1. Pemilih Tahun 2022–2026 Aktif (terhubung ke dataset 5 tahun)
 */
function renderYearChips() {
  const container = document.querySelector('#belanja-year-selector');
  if (!container) return;

  const years = OFFICIAL_5YR_DATASET.horizon;
  container.innerHTML = years
    .map((yr) => {
      const isCurrent = yr === currentSelectedYear;
      const label = yr === 2026 ? `${yr} (Terbaru)` : `${yr}`;
      return `
        <button
          type="button"
          class="bl-chip ${isCurrent ? 'is-active' : ''}"
          data-year="${yr}"
          aria-pressed="${isCurrent}"
        >
          ${label}
        </button>
      `;
    })
    .join('');

  container.querySelectorAll('.bl-chip').forEach((btn) => {
    btn.addEventListener('click', () => {
      const yr = parseInt(btn.getAttribute('data-year'), 10);
      if (yr && yr !== currentSelectedYear) {
        selectYear(yr);
      }
    });
  });
}

function selectYear(yr) {
  currentSelectedYear = yr;

  document.querySelectorAll('#belanja-year-selector .bl-chip').forEach((btn) => {
    const isMatch = parseInt(btn.getAttribute('data-year'), 10) === yr;
    btn.classList.toggle('is-active', isMatch);
    btn.setAttribute('aria-pressed', String(isMatch));
  });

  populateHeroStats(yr, true);
  renderKelompokBelanja(yr, true);
  renderDinasPanel(activeOpdKey, false, yr);
  populatePembiayaanNeraca(yr);
}

/**
 * 2. Populate Hero KPI sesuai Tahun Terpilih
 */
function populateHeroStats(year, animateCounter = true) {
  const dataYear = OFFICIAL_5YR_DATASET.belanjaTahunan[year] || OFFICIAL_5YR_DATASET.belanjaTahunan[2026];
  if (!dataYear) return;

  const sisaPagu = dataYear.target - dataYear.realisasi;
  const serapanPct = Number(dataYear.serapan).toFixed(1);

  const elPagu = document.querySelector('#stat-belanja-anggaran');
  const elSerap = document.querySelector('#stat-belanja-terpakai');
  const elSisa = document.querySelector('#stat-belanja-sisa');
  const elProgressBar = document.querySelector('#stat-belanja-progress-bar');
  const elMarker = document.querySelector('#stat-belanja-marker');
  const elCaption = document.querySelector('#stat-belanja-progress-label');
  const elNum = document.querySelector('#hero-belanja-serapan');

  if (elPagu) elPagu.textContent = formatRupiahSingkat(dataYear.target);
  if (elSerap) elSerap.textContent = formatRupiahSingkat(dataYear.realisasi);
  if (elSisa) elSisa.textContent = formatRupiahSingkat(sisaPagu);
  if (elProgressBar) elProgressBar.style.width = `${Math.min(Number(serapanPct), 100)}%`;
  if (elMarker) elMarker.style.left = `${Math.min(Number(serapanPct), 100)}%`;
  if (elCaption) {
    elCaption.textContent = `${formatRupiahSingkat(dataYear.realisasi)} dari pagu ${formatRupiahSingkat(dataYear.target)} telah direalisasikan pada tahun ${year}.`;
  }

  const elOndiQuote = document.querySelector('#belanja-ondi-narrative');
  if (elOndiQuote) {
    elOndiQuote.textContent = `Pada ${year}, Pemprov DKI merealisasikan ${formatRupiahSingkat(dataYear.realisasi)} (${formatPersen(dataYear.serapan)} pagu). Pendidikan dan sarana pengendali banjir menjadi alokasi terbesar.`;
  }

  if (animateCounter && elNum) {
    animateCountUp(elNum, Number(serapanPct), { duration: 1100, decimals: 1 });
  }
}

function triggerHeroCountUp() {
  if (heroCountStarted) return;
  heroCountStarted = true;

  const dataYear = OFFICIAL_5YR_DATASET.belanjaTahunan[currentSelectedYear] || OFFICIAL_5YR_DATASET.belanjaTahunan[2026];
  const targetNum = dataYear ? Number(dataYear.serapan.toFixed(1)) : 95.5;
  const numEl = document.querySelector('#hero-belanja-serapan');

  if (prefersReducedMotion()) {
    animateCountUp(numEl, targetNum, { duration: 0, decimals: 1 });
    return;
  }

  // Ondi naik ~900ms, kemudian angka menghitung naik
  setTimeout(() => {
    animateCountUp(numEl, targetNum, { duration: 1800, decimals: 1 });
  }, 550);
}

/**
 * 3. Render 4 Kelompok Belanja Daerah (proporsional mengikuti tahun terpilih)
 */
function renderKelompokBelanja(year = 2026, forceRevealed = false) {
  const container = document.querySelector('#kelompok-belanja-grid-list');
  if (!container) return;

  const baseRealisasi = OFFICIAL_5YR_DATASET.belanjaTahunan[2026].realisasi;
  const targetRealisasi = (OFFICIAL_5YR_DATASET.belanjaTahunan[year] || OFFICIAL_5YR_DATASET.belanjaTahunan[2026]).realisasi;
  const ratio = targetRealisasi / baseRealisasi;

  const metaMap = {
    'Belanja Operasi': { icon: 'briefcase', color: 'var(--red)' },
    'Belanja Modal': { icon: 'building', color: 'var(--grn)' },
    'Belanja Tidak Terduga (BTT)': { icon: 'alert', color: 'var(--gold)' },
    'Belanja Transfer': { icon: 'transfer', color: '#2563A8' }
  };

  const list = OFFICIAL_5YR_DATASET.kelompokBelanja2026;
  container.innerHTML = list
    .map((item) => {
      const meta = metaMap[item.nama] || { icon: 'building', color: 'var(--red)' };
      const scaledNominal = year === 2026 ? item.nominal : Math.round(item.nominal * ratio);
      const pctText = `${item.porsi.toFixed(1).replace('.', ',')}%`;
      const fillWidth = Math.max(Math.min(item.porsi, 100), 3);

      return `
        <article class="bl-kel-card bl-rv ${forceRevealed ? 'in' : ''}">
          <div>
            <div class="bl-kel-head">
              <span class="bl-ic" style="--c: ${meta.color};">${renderIcon(meta.icon, 22)}</span>
              <span class="bl-kel-pct">${pctText}</span>
            </div>
            <h3>${item.nama}</h3>
            <div class="bl-kel-nom">${formatRupiahSingkat(scaledNominal)}</div>
            <div class="bl-track" aria-hidden="true">
              <div class="bl-fill" style="width: ${fillWidth}%; background: ${meta.color};"></div>
            </div>
          </div>
          <p>${item.desc}</p>
        </article>
      `;
    })
    .join('');
}

/**
 * 4. Render Simulasi Waffle 10x10 Rp100 + Ondi Interaktif #1
 */
function renderWaffleRp100() {
  const grid = document.querySelector('#waffle');
  const legend = document.querySelector('#leg');
  const guide = document.querySelector('#waffle-ondi-guide');
  const bubble = document.querySelector('#waffle-ondi-bubble');
  if (!grid || !legend || !bubble) return;

  const defaultMsg = 'Coba sentuh salah satu kotak.';
  bubble.textContent = defaultMsg;

  const cells = [];
  RP100_DINAS.forEach((dinas) => {
    for (let i = 0; i < dinas.porsiRp100; i++) {
      cells.push(dinas);
    }
  });

  grid.innerHTML = cells
    .map(
      (dinas, idx) => `
        <button
          type="button"
          class="bl-waffle-cell"
          data-cat="${dinas.key}"
          style="--d: ${idx}; background: ${dinas.color};"
          aria-label="${dinas.nama}: Rp${dinas.porsiRp100} dari setiap Rp100"
        ></button>
      `
    )
    .join('');

  legend.innerHTML = RP100_DINAS.map(
    (dinas) => `
      <button type="button" class="bl-lg" data-cat="${dinas.key}">
        <span class="bl-ic" style="--c: ${dinas.color};">${renderIcon(dinas.icon, 16)}</span>
        <span class="bl-lg-name">${dinas.nama}</span>
        <span class="bl-lg-val">Rp${dinas.porsiRp100}</span>
      </button>
    `
  ).join('');

  const highlightCategory = (key) => {
    const item = RP100_DINAS.find((d) => d.key === key);
    if (!item) return;

    grid.classList.add('is-filtering');
    grid.querySelectorAll('.bl-waffle-cell').forEach((cell) => {
      cell.classList.toggle('is-hl', cell.getAttribute('data-cat') === key);
    });
    legend.querySelectorAll('.bl-lg').forEach((btn) => {
      btn.classList.toggle('is-active', btn.getAttribute('data-cat') === key);
    });
    if (guide) guide.classList.add('is-pointing');
    bubble.textContent = `${item.nama} menerima Rp${item.porsiRp100} dari setiap Rp100.`;
  };

  const resetHighlight = () => {
    grid.classList.remove('is-filtering');
    grid.querySelectorAll('.bl-waffle-cell').forEach((cell) => cell.classList.remove('is-hl'));
    legend.querySelectorAll('.bl-lg').forEach((btn) => btn.classList.remove('is-active'));
    if (guide) guide.classList.remove('is-pointing');
    bubble.textContent = defaultMsg;
  };

  const bindItemEvents = (el) => {
    const key = el.getAttribute('data-cat');
    el.addEventListener('mouseenter', () => highlightCategory(key));
    el.addEventListener('focus', () => highlightCategory(key));
    el.addEventListener('click', () => highlightCategory(key));
  };

  grid.querySelectorAll('.bl-waffle-cell').forEach(bindItemEvents);
  legend.querySelectorAll('.bl-lg').forEach(bindItemEvents);

  const waffleCard = grid.closest('.bl-wf');
  if (waffleCard) {
    waffleCard.addEventListener('mouseleave', resetHighlight);
    waffleCard.addEventListener('focusout', (e) => {
      if (!waffleCard.contains(e.relatedTarget)) resetHighlight();
    });
    waffleCard.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') resetHighlight();
    });
  }
}

/**
 * 5. Tab Dinas & Program Prioritas + Ondi Interaktif #2
 */
function renderDinasTabs() {
  const tabsWrap = document.querySelector('#dinas-tabs');
  if (!tabsWrap) return;

  const featuredDinas = RP100_DINAS.slice(0, 5);
  tabsWrap.innerHTML = featuredDinas
    .map((dinas) => {
      const isSelected = dinas.key === activeOpdKey;
      return `
        <button
          type="button"
          class="bl-chip ${isSelected ? 'is-active' : ''}"
          role="tab"
          id="tab-${dinas.key}"
          aria-selected="${isSelected}"
          aria-controls="dinas-tabpanel"
          data-opd="${dinas.key}"
          tabindex="${isSelected ? '0' : '-1'}"
        >
          ${renderIcon(dinas.icon, 16)}
          <span>${dinas.nama}</span>
        </button>
      `;
    })
    .join('');

  const tabButtons = Array.from(tabsWrap.querySelectorAll('[role="tab"]'));

  tabButtons.forEach((btn, idx) => {
    btn.addEventListener('click', () => {
      const key = btn.getAttribute('data-opd');
      if (key && key !== activeOpdKey) {
        switchDinasTab(key);
      }
    });

    btn.addEventListener('keydown', (e) => {
      let nextIdx = null;
      if (e.key === 'ArrowRight') nextIdx = (idx + 1) % tabButtons.length;
      if (e.key === 'ArrowLeft') nextIdx = (idx - 1 + tabButtons.length) % tabButtons.length;
      if (nextIdx !== null) {
        e.preventDefault();
        const targetBtn = tabButtons[nextIdx];
        targetBtn.focus();
        const key = targetBtn.getAttribute('data-opd');
        if (key && key !== activeOpdKey) {
          switchDinasTab(key);
        }
      }
    });
  });
}

function switchDinasTab(key) {
  activeOpdKey = key;

  document.querySelectorAll('#dinas-tabs [role="tab"]').forEach((btn) => {
    const isMatch = btn.getAttribute('data-opd') === key;
    btn.classList.toggle('is-active', isMatch);
    btn.setAttribute('aria-selected', String(isMatch));
    btn.setAttribute('tabindex', isMatch ? '0' : '-1');
  });

  renderDinasPanel(key, true, currentSelectedYear);
}

function renderDinasPanel(key, animate = true, year = 2026) {
  const stage = document.querySelector('#dinas-panel-stage');
  const panel = document.querySelector('#dinas-tabpanel');
  const ondiAv = document.querySelector('#opd-ondi-av');
  const ondiBubble = document.querySelector('#opd-ondi-bubble');
  const dinas = RP100_DINAS.find((d) => d.key === key) || RP100_DINAS[0];
  if (!stage || !panel || !dinas) return;

  panel.setAttribute('aria-labelledby', `tab-${dinas.key}`);

  const baseYear = OFFICIAL_5YR_DATASET.belanjaTahunan[2026];
  const selYear = OFFICIAL_5YR_DATASET.belanjaTahunan[year] || baseYear;
  const targetRatio = selYear.target / baseYear.target;
  const realRatio = selYear.realisasi / baseYear.realisasi;

  const buildInnerHtml = () => {
    if (dinas.detail) {
      const paguVal = year === 2026 ? dinas.detail.pagu : Math.round(dinas.detail.pagu * targetRatio);
      const realVal = year === 2026 ? dinas.detail.realisasi : Math.round(dinas.detail.realisasi * realRatio);
      const serapanVal = year === 2026 ? dinas.detail.serapan : Number(((realVal / paguVal) * 100).toFixed(1));

      return `
        <div class="bl-opd-title-row">
          <span class="bl-ic" style="--c: ${dinas.color};">${renderIcon(dinas.icon, 24)}</span>
          <h3>${dinas.nama}</h3>
        </div>
        <p class="bl-sub" style="margin-top: 12px;">${dinas.detail.deskripsi}</p>

        <div class="bl-opd-metrics">
          <div class="bl-stat">
            <small>PAGU OPD (${year})</small>
            <div class="bl-stat-v">${formatRupiahSingkat(paguVal)}</div>
          </div>
          <div class="bl-stat">
            <small>TEREALISASI</small>
            <div class="bl-stat-v">${formatRupiahSingkat(realVal)}</div>
          </div>
          <div class="bl-stat is-green">
            <small>PENYERAPAN</small>
            <div class="bl-stat-v">${formatPersen(serapanVal)}</div>
          </div>
        </div>

        <p class="bl-opd-prog-label">Program Prioritas</p>
        <div class="bl-opd-programs">
          ${dinas.detail.program
            .map(
              (prog, idx) => `
                <div class="bl-opd-prog-item">
                  <b>0${idx + 1}</b>
                  <span>${prog}</span>
                </div>
              `
            )
            .join('')}
        </div>
      `;
    }

    return `
      <div class="bl-opd-title-row">
        <span class="bl-ic" style="--c: ${dinas.color};">${renderIcon(dinas.icon, 24)}</span>
        <h3>${dinas.nama}</h3>
      </div>

      <div class="bl-opd-metrics">
        <div class="bl-stat">
          <small>PORSI DARI SETIAP Rp100</small>
          <div class="bl-stat-v" style="color: ${dinas.color};">Rp${dinas.porsiRp100}</div>
        </div>
      </div>
    `;
  };

  const updateContentAndOndi = () => {
    stage.innerHTML = buildInnerHtml();
    if (ondiBubble) ondiBubble.textContent = dinas.bubbleDinas;
    if (ondiAv && !prefersReducedMotion()) {
      ondiAv.style.transform = dinas.pose || 'none';
    }
  };

  if (!animate || prefersReducedMotion()) {
    updateContentAndOndi();
    return;
  }

  stage.classList.add('is-leaving');
  setTimeout(() => {
    updateContentAndOndi();
    requestAnimationFrame(() => stage.classList.remove('is-leaving'));
  }, 160);
}

/**
 * 6. Populate Pembiayaan SiLPA, BUMD & Neraca APBD sesuai Tahun Terpilih
 */
function populatePembiayaanNeraca(year = 2026) {
  const pem = PEMBIAYAAN_5YR[year] || PEMBIAYAAN_5YR[2026];
  const pendData = OFFICIAL_5YR_DATASET.komposisiPendapatan[year] || OFFICIAL_5YR_DATASET.komposisiPendapatan[2026];
  const belData = OFFICIAL_5YR_DATASET.belanjaTahunan[year] || OFFICIAL_5YR_DATASET.belanjaTahunan[2026];

  const elSilpa = document.querySelector('#silpa-val');
  const elBumd = document.querySelector('#bumd-val');
  const elBumdDesc = document.querySelector('#bumd-desc');
  const elNeraca = document.querySelector('#neraca-val');
  const elNeracaDesc = document.querySelector('#neraca-desc');

  const elPendapatanLabel = document.querySelector('#neraca-pendapatan-val');
  const elBelanjaLabel = document.querySelector('#neraca-belanja-val');
  const elPendapatanBar = document.querySelector('#neraca-pendapatan-bar');
  const elBelanjaBar = document.querySelector('#neraca-belanja-bar');

  if (elSilpa) elSilpa.textContent = formatRupiahSingkat(pem.silpa);
  if (elBumd) elBumd.textContent = formatRupiahSingkat(pem.bumd);
  if (elBumdDesc) {
    elBumdDesc.textContent = 'MRT Jakarta Fase 2, LRT Jabodebek Jakpro, PAM Jaya 100% air bersih.';
  }

  const pendTotal = pendData.total;
  const belTotal = belData.realisasi;
  const pendStr = formatRupiahSingkat(pendTotal);
  const belStr = formatRupiahSingkat(belTotal);
  const selisih = pendTotal - belTotal;

  if (elNeraca) {
    elNeraca.innerHTML = `${pendStr} <span class="bl-sil-vs">vs</span> ${belStr}`;
  }
  if (elNeracaDesc) {
    const nettoStr = formatRupiahSingkat(pem.netto);
    elNeracaDesc.textContent =
      selisih < 0
        ? `Defisit terencana ${formatRupiahSingkat(Math.abs(selisih))} ditutup pembiayaan netto +${nettoStr}.`
        : `Postur anggaran berimbang dengan dukungan pembiayaan netto +${nettoStr}.`;
  }

  const maxNeraca = Math.max(pendTotal, belTotal);
  if (elPendapatanLabel) elPendapatanLabel.textContent = pendStr;
  if (elBelanjaLabel) elBelanjaLabel.textContent = belStr;
  if (elPendapatanBar) elPendapatanBar.style.width = `${((pendTotal / maxNeraca) * 100).toFixed(1)}%`;
  if (elBelanjaBar) elBelanjaBar.style.width = `${((belTotal / maxNeraca) * 100).toFixed(1)}%`;
}

/**
 * 7. Reveal Global via IntersectionObserver
 */
function initScrollReveal() {
  const heroCard = document.querySelector('#hero-belanja-card');
  const targets = document.querySelectorAll('.bl-rv, .bl-card, #hero-belanja-card');

  if (prefersReducedMotion() || typeof IntersectionObserver === 'undefined') {
    targets.forEach((el) => el.classList.add('in'));
    heroCardRevealed = true;
    triggerHeroCountUp();
    return;
  }

  revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          if (entry.target === heroCard && !heroCardRevealed) {
            heroCardRevealed = true;
            triggerHeroCountUp();
          }
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -24px 0px' }
  );

  targets.forEach((el) => {
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.94 && rect.bottom > 0) {
      el.classList.add('in');
      if (el === heroCard && !heroCardRevealed) {
        heroCardRevealed = true;
        triggerHeroCountUp();
      }
    } else {
      revealObserver.observe(el);
    }
  });
}

// Auto-boot on DOM ready
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBelanjaPage);
  } else {
    initBelanjaPage();
  }
}
