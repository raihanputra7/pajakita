/**
 * paJAK-Kita — Modul Halaman Penerimaan Pajak Daerah (penerimaan.html)
 * File: js/penerimaan.js
 *
 * Mengintegrasikan seluruh dataset penerimaan dari dataEngine.js:
 * 1. Horizon 5 Tahun (2022–2026) dengan filter tahun interaktif & hero count-up.
 * 2. Komparasi capaian Pajak Daerah vs Retribusi Daerah (Dataset 01 & 02).
 * 3. Bar proporsional "Porsi Kas" 12 jenis pajak + tooltip interaktif (Dataset 10 & 03).
 * 4. Rincian 12 kartu jenis pajak dengan marker garis target 100% & filter kategori.
 * 5. Grafik musiman bulanan 12 bulan dengan batang tumbuh saat di-scroll (Dataset 09).
 * 6. Perkembangan wajib pajak 5 tahun dengan batang tumbuh saat di-scroll (Dataset 11).
 */

import {
  OFFICIAL_5YR_DATASET,
  formatRupiahSingkat,
  formatPersen
} from './dataEngine.js';

let currentSelectedYear = 2026;
let currentSelectedCategory = 'all';
let currentSelectedMonthIndex = 7; // Default: Agustus (Puncak Jatuh Tempo PBB-P2)
let heroCountRafId = null;
let scrollRevealObserver = null;

function prefersReducedMotion() {
  return Boolean(
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

function getCategoryOfKode(kode) {
  if (['PKB', 'BBNKB', 'PBBKB'].includes(kode)) return 'kendaraan';
  if (['PBB-P2', 'BPHTB'].includes(kode)) return 'properti';
  return 'pbjt';
}

function getCategoryColor(cat) {
  if (cat === 'kendaraan') return 'var(--red)';
  if (cat === 'properti') return 'var(--gold)';
  return 'var(--grn)';
}

function getCategoryLabel(cat) {
  if (cat === 'kendaraan') return 'Kendaraan & BBM';
  if (cat === 'properti') return 'Properti & Tanah';
  return 'Belanja, Makan & Hiburan';
}

export function initPenerimaanPage() {
  initScrollRevealObserver();
  renderYearSelector();
  updatePenerimaanData(currentSelectedYear);
  renderSharePorsiBar();
  renderJenisPajakCards();
  initCategoryFilterTabs();
  renderSeasonalityChart();
  renderSeasonalityDetail(currentSelectedMonthIndex);
  renderWajibPajakChart();
  observeRevealTargets();
}

/**
 * Observer reveal saat scroll untuk kartu, grafik batang, dan track progres
 */
function initScrollRevealObserver() {
  if (prefersReducedMotion() || typeof IntersectionObserver === 'undefined') {
    scrollRevealObserver = null;
    return;
  }

  scrollRevealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          scrollRevealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -30px 0px' }
  );
}

function observeRevealTargets() {
  const targets = document.querySelectorAll('.pr-rv, .pr-card, .pr-bars, .pr-cols');
  if (prefersReducedMotion() || !scrollRevealObserver) {
    targets.forEach((el) => el.classList.add('in'));
    return;
  }

  targets.forEach((el) => {
    if (el.classList.contains('in')) return;
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.94 && rect.bottom > 0) {
      el.classList.add('in');
    } else {
      scrollRevealObserver.observe(el);
    }
  });
}

/**
 * Animasi count-up angka utama (102,8%) di blok merah hero
 */
function animateHeroPercent(targetVal) {
  const el = document.querySelector('#hero-kpi-capaian');
  if (!el) return;

  if (heroCountRafId !== null) {
    cancelAnimationFrame(heroCountRafId);
    heroCountRafId = null;
  }

  const finalFormatted = Number(targetVal).toFixed(1).replace('.', ',');
  if (prefersReducedMotion()) {
    el.textContent = finalFormatted;
    return;
  }

  const duration = 1500;
  const start = performance.now();

  const step = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 4);
    const current = targetVal * eased;
    el.textContent = current.toFixed(1).replace('.', ',');

    if (progress < 1) {
      heroCountRafId = requestAnimationFrame(step);
    } else {
      el.textContent = finalFormatted;
      heroCountRafId = null;
    }
  };

  heroCountRafId = requestAnimationFrame(step);
}

/**
 * 1. Render Tombol Pemilih Tahun (Horizon 2022–2026)
 */
function renderYearSelector() {
  const container = document.querySelector('#penerimaan-year-selector');
  if (!container) return;

  const years = OFFICIAL_5YR_DATASET.horizon;
  container.innerHTML = years
    .map((yr) => {
      const isCurrent = yr === currentSelectedYear;
      const label = yr === 2026 ? `${yr} (Terbaru)` : `${yr}`;
      return `
        <button type="button" class="pr-chip year-pill-btn ${isCurrent ? 'is-active active' : ''}" data-year="${yr}" aria-pressed="${isCurrent}">
          ${label}
        </button>
      `;
    })
    .join('');

  container.querySelectorAll('.year-pill-btn').forEach((btn) => {
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
  document.querySelectorAll('.year-pill-btn').forEach((b) => {
    const isMatch = parseInt(b.getAttribute('data-year'), 10) === yr;
    b.classList.toggle('is-active', isMatch);
    b.classList.toggle('active', isMatch);
    b.setAttribute('aria-pressed', String(isMatch));
  });
  updatePenerimaanData(yr);
  renderWajibPajakChart();
}

/**
 * 2. Update Seluruh Angka Kunci & Komparasi Berdasarkan Tahun Terpilih
 */
function updatePenerimaanData(year) {
  const data = OFFICIAL_5YR_DATASET;
  const penerimaan = data.penerimaanTahunan[year] || data.penerimaanTahunan[2026];
  const pajakRetribusi = data.pajakVsRetribusi[year] || data.pajakVsRetribusi[2026];
  const wp = data.wajibPajak[year] || data.wajibPajak[2026];

  // A. Blok Merah Hero & 3 KPI Tumpuk
  const elAnggaran = document.querySelector('#stat-pajak-anggaran');
  const elRealisasi = document.querySelector('#stat-pajak-realisasi');
  const elStatus = document.querySelector('#stat-pajak-status');
  const elSurplusDefisit = document.querySelector('#stat-pajak-surplus-val');
  const elHeroDesc = document.querySelector('#hero-kpi-desc');

  animateHeroPercent(penerimaan.capaian);

  if (elAnggaran) elAnggaran.textContent = formatRupiahSingkat(penerimaan.target);
  if (elRealisasi) elRealisasi.textContent = formatRupiahSingkat(penerimaan.realisasi);

  const surplusNominal = penerimaan.realisasi - penerimaan.target;
  const isSurplus = surplusNominal >= 0;

  if (elStatus) {
    elStatus.textContent = isSurplus ? 'Melampaui Target' : 'Belum Capai Target';
    elStatus.className = `pr-tag ${isSurplus ? '' : 'is-warn'}`.trim();
  }
  if (elSurplusDefisit) {
    elSurplusDefisit.textContent = `${isSurplus ? '+' : '-'}${formatRupiahSingkat(Math.abs(surplusNominal))}`;
  }
  if (elHeroDesc) {
    elHeroDesc.textContent = isSurplus
      ? `Uang pajak yang masuk melampaui target tahun ${year}, lebih ${formatRupiahSingkat(surplusNominal)}.`
      : `Uang pajak yang terkumpul tahun ${year} tercatat ${formatRupiahSingkat(penerimaan.realisasi)} dari target ${formatRupiahSingkat(penerimaan.target)}.`;
  }

  // B. Komparasi Pajak Daerah vs Retribusi Daerah
  const elPajakVal = document.querySelector('#metric-comp-pajak-val');
  const elPajakBar = document.querySelector('#metric-comp-pajak-bar');
  const elRetribusiVal = document.querySelector('#metric-comp-retribusi-val');
  const elRetribusiBar = document.querySelector('#metric-comp-retribusi-bar');
  const elPajakVsRetribusiNote = document.querySelector('#pajak-retribusi-insight-text');

  if (elPajakVal) elPajakVal.textContent = formatPersen(pajakRetribusi.pajak);
  if (elPajakBar) elPajakBar.style.width = `${Math.min(pajakRetribusi.pajak, 100)}%`;
  if (elRetribusiVal) elRetribusiVal.textContent = formatPersen(pajakRetribusi.retribusi);
  if (elRetribusiBar) elRetribusiBar.style.width = `${Math.min(pajakRetribusi.retribusi, 100)}%`;

  if (elPajakVsRetribusiNote) {
    elPajakVsRetribusiNote.innerHTML = `Pajak daerah mencapai <strong>${formatPersen(pajakRetribusi.pajak)}</strong> dari target ${year}, sementara retribusi daerah (seperti parkir, biaya layanan, dan izin usaha) mencapai <strong>${formatPersen(pajakRetribusi.retribusi)}</strong>.`;
  }

  // C. Ringkasan Pembayar Pajak Header
  const elWpTotal = document.querySelector('#stat-wp-total-val');
  const elWpPertumbuhan = document.querySelector('#stat-wp-growth-val');
  const elWpKepatuhan = document.querySelector('#stat-wp-patuh-val');

  if (elWpTotal) elWpTotal.textContent = `${(wp.total / 1e6).toFixed(2).replace('.', ',')} Juta`;
  if (elWpPertumbuhan) elWpPertumbuhan.textContent = `+${wp.pertumbuhanYoY.toFixed(1).replace('.', ',')}% / tahun`;
  if (elWpKepatuhan) elWpKepatuhan.textContent = formatPersen(wp.kepatuhanPersen);

  // D. Catatan Ondi Edukasi
  const elOndiInsight = document.querySelector('#penerimaan-ondi-narrative');
  if (elOndiInsight) {
    elOndiInsight.innerHTML = `Pada tahun <strong>${year}</strong>, uang pajak Jakarta yang terkumpul mencapai <strong>${formatRupiahSingkat(penerimaan.realisasi)}</strong> (${formatPersen(penerimaan.capaian)} dari target). Penyumbang terbesarnya tetap berasal dari pajak tanah/bangunan (PBB-P2) dan pajak kendaraan (PKB) yang mencakup hampir 40% total pemasukan.`;
  }
}

/**
 * 3A. Render Bar "Porsi Kas" 12 Jenis Pajak dengan Tooltip Interaktif
 */
function renderSharePorsiBar() {
  const bar = document.querySelector('#share-porsi-bar');
  const tipReadout = document.querySelector('#pr-share-tip');
  const floatTip = document.querySelector('#pr-share-float');
  const wrap = document.querySelector('.pr-share-wrap');
  if (!bar) return;

  const sorted = [...OFFICIAL_5YR_DATASET.jenisPajak2026].sort((a, b) => b.share - a.share);

  bar.innerHTML = sorted
    .map((item) => {
      const cat = getCategoryOfKode(item.kode);
      const color = getCategoryColor(cat);
      const shareFmt = item.share.toFixed(1).replace('.', ',');
      const tipText = `${item.kode} · ${shareFmt}% dari total pajak (${formatRupiahSingkat(item.realisasi)})`;
      return `
        <button
          type="button"
          class="pr-share-seg"
          style="--w: ${item.share}; background: ${color};"
          data-tip="${tipText}"
          data-cat-label="${getCategoryLabel(cat)}"
          aria-label="${item.nama}: ${shareFmt}% bagian total pajak"
        ></button>
      `;
    })
    .join('');

  const showTip = (seg) => {
    const msg = seg.getAttribute('data-tip') || '';
    if (tipReadout) tipReadout.textContent = msg;

    bar.querySelectorAll('.pr-share-seg').forEach((s) => s.classList.toggle('is-hovered', s === seg));

    if (floatTip && wrap) {
      floatTip.textContent = msg;
      const wrapRect = wrap.getBoundingClientRect();
      const segRect = seg.getBoundingClientRect();
      const rawCenter = segRect.left - wrapRect.left + segRect.width / 2;
      const minLeft = 90;
      const maxLeft = Math.max(wrapRect.width - 90, minLeft);
      const clampedLeft = Math.min(Math.max(rawCenter, minLeft), maxLeft);
      floatTip.style.left = `${clampedLeft}px`;
      floatTip.classList.add('is-visible');
    }
  };

  const hideFloatTip = () => {
    if (floatTip) floatTip.classList.remove('is-visible');
    bar.querySelectorAll('.pr-share-seg').forEach((s) => s.classList.remove('is-hovered'));
  };

  bar.querySelectorAll('.pr-share-seg').forEach((seg) => {
    seg.addEventListener('mouseenter', () => showTip(seg));
    seg.addEventListener('focus', () => showTip(seg));
    seg.addEventListener('click', () => showTip(seg));
  });

  bar.addEventListener('mouseleave', hideFloatTip);
  bar.addEventListener('focusout', (e) => {
    if (!bar.contains(e.relatedTarget)) hideFloatTip();
  });
}

/**
 * 3B. Render 12 Kartu Jenis Pajak dengan Marker Target 100% & Filter Kategori
 */
function renderJenisPajakCards() {
  const container = document.querySelector('#jenis-pajak-grid-list');
  if (!container) return;

  const list = OFFICIAL_5YR_DATASET.jenisPajak2026;

  container.innerHTML = list
    .map((item, index) => {
      const cat = getCategoryOfKode(item.kode);
      const isAboveTarget = item.persen >= 100;
      const widthScale = Math.min((item.persen / 110) * 100, 100).toFixed(2);
      const rankNum = String(index + 1).padStart(2, '0');
      const shareStr = item.share.toFixed(1).replace('.', ',');
      const diffNominal = formatRupiahSingkat(Math.abs(item.realisasi - item.target));

      return `
        <article class="pr-jt pr-rv" data-kode="${item.kode}" data-cat="${cat}">
          <div>
            <div class="pr-jt-top">
              <span class="pr-jt-no">${rankNum}</span>
              <span class="pr-jt-por">${shareStr}% Bagian Pajak</span>
            </div>
            <h3>${item.nama}</h3>
            <div class="pr-jt-kode">${item.kode}</div>
          </div>

          <div>
            <div class="pr-jt-rl">
              <div>
                <small>Sudah Masuk</small>
                <b>${formatRupiahSingkat(item.realisasi)}</b>
              </div>
              <div style="text-align: right;">
                <small>Target</small>
                <span>${formatRupiahSingkat(item.target)}</span>
              </div>
            </div>

            <div class="pr-track pr-mk" title="Garis vertikal menandakan target 100%">
              <div class="pr-fill-clip">
                <div class="pr-fill" style="width: ${widthScale}%; background: ${isAboveTarget ? 'var(--grn)' : 'var(--red)'};"></div>
              </div>
            </div>

            <div class="pr-jt-meta">
              <span class="${isAboveTarget ? 'pr-ok' : 'pr-warn'}">
                ${isAboveTarget ? '✓ Melebihi Target' : 'Masih Berjalan'} (${item.persen.toFixed(1).replace('.', ',')}%)
              </span>
              <span style="color: var(--mut);">
                ${isAboveTarget ? 'Lebih: ' : 'Kurang: '}${diffNominal}
              </span>
            </div>
          </div>
        </article>
      `;
    })
    .join('');

  applyJenisFilter(currentSelectedCategory);
}

function applyJenisFilter(category) {
  const cards = document.querySelectorAll('#jenis-pajak-grid-list .pr-jt');
  cards.forEach((card) => {
    const cat = card.getAttribute('data-cat');
    const shouldHide = category !== 'all' && cat !== category;
    card.classList.toggle('is-hidden', shouldHide);
    if (!shouldHide) {
      card.classList.add('in');
    }
  });
}

function initCategoryFilterTabs() {
  const tabs = document.querySelectorAll('.jenis-filter-tab');
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const cat = tab.getAttribute('data-cat');
      if (cat && cat !== currentSelectedCategory) {
        currentSelectedCategory = cat;
        tabs.forEach((t) => {
          const isOn = t === tab;
          t.classList.toggle('is-active', isOn);
          t.classList.toggle('active', isOn);
          t.setAttribute('aria-pressed', String(isOn));
        });
        applyJenisFilter(currentSelectedCategory);
      }
    });
  });
}

/**
 * 4. Render Grafik Musiman Bulanan 12 Bulan (Dataset 09)
 */
function renderSeasonalityChart() {
  const container = document.querySelector('#seasonality-bars-container');
  if (!container) return;

  const data = OFFICIAL_5YR_DATASET.seasonalityBulanan;
  const maxPercent = Math.max(...data.map((d) => d.persen));

  container.innerHTML = data
    .map((item, idx) => {
      const heightPercent = ((item.persen / maxPercent) * 100).toFixed(1);
      const isMaxPeak = item.persen === maxPercent;
      const isPeak = Boolean(item.puncak) && !isMaxPeak;
      const isSelected = idx === currentSelectedMonthIndex;
      const peakClass = isMaxPeak ? 'is-max-peak' : isPeak ? 'is-peak' : '';
      const pctFormatted = `${item.persen.toFixed(1).replace('.', ',')}%`;

      return `
        <button
          type="button"
          class="pr-bar ${peakClass} ${isSelected ? 'is-selected' : ''}"
          data-idx="${idx}"
          aria-pressed="${isSelected}"
          title="${item.bulan}: ${pctFormatted}"
        >
          <em>${item.puncak || isSelected ? pctFormatted : ''}</em>
          <span class="pr-bar-track"><i style="--h: ${heightPercent};"></i></span>
          <span>${item.bulan}</span>
        </button>
      `;
    })
    .join('');

  container.querySelectorAll('.pr-bar').forEach((col) => {
    col.addEventListener('click', () => {
      const idx = parseInt(col.getAttribute('data-idx'), 10);
      if (!isNaN(idx)) {
        currentSelectedMonthIndex = idx;
        container.querySelectorAll('.pr-bar').forEach((c) => {
          const matched = parseInt(c.getAttribute('data-idx'), 10) === idx;
          c.classList.toggle('is-selected', matched);
          c.setAttribute('aria-pressed', String(matched));
          const em = c.querySelector('em');
          const dItem = data[parseInt(c.getAttribute('data-idx'), 10)];
          if (em && dItem) {
            em.textContent = dItem.puncak || matched ? `${dItem.persen.toFixed(1).replace('.', ',')}%` : '';
          }
        });
        renderSeasonalityDetail(currentSelectedMonthIndex);
      }
    });
  });
}

function renderSeasonalityDetail(index) {
  const detailEl = document.querySelector('#seasonality-month-detail-card');
  if (!detailEl) return;

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const item = OFFICIAL_5YR_DATASET.seasonalityBulanan[index] || OFFICIAL_5YR_DATASET.seasonalityBulanan[7];
  const fullMonth = monthNames[index] || 'Agustus';

  detailEl.innerHTML = `
    <small>${item.puncak ? 'BULAN PALING RAMAI' : 'PEMASUKAN BULANAN'}</small>
    <h4 class="pr-serif">${fullMonth} · Menyumbang ${item.persen.toFixed(1).replace('.', ',')}% pemasukan setahun</h4>
    <p>${item.catatan}</p>
    <p><strong>Info Tambahan:</strong> Pemasukan pajak Jakarta biasanya melonjak saat batas waktu bayar PBB-P2 di pertengahan tahun dan saat program diskon pajak kendaraan ulang tahun Jakarta. Membayar tepat waktu membantu warga terhindar dari denda 1% per bulan.</p>
  `;
}

/**
 * 5. Render Grafik Batang Perkembangan Wajib Pajak 5 Tahun (Dataset 11)
 */
function renderWajibPajakChart() {
  const container = document.querySelector('#wp-bars-chart');
  if (!container) return;

  const years = OFFICIAL_5YR_DATASET.horizon;
  const wpData = OFFICIAL_5YR_DATASET.wajibPajak;

  container.innerHTML = years
    .map((yr) => {
      const item = wpData[yr];
      const totalJuta = item.total / 1e6;
      const heightRatio = Math.min(Math.max(((totalJuta - 3.5) / 2.5) * 100, 20), 100).toFixed(1);
      const isSelected = yr === currentSelectedYear;

      return `
        <button
          type="button"
          class="pr-col ${isSelected ? 'is-selected' : ''}"
          data-year="${yr}"
          aria-pressed="${isSelected}"
          title="${yr}: ${totalJuta.toFixed(2).replace('.', ',')} Juta WP (${formatPersen(item.kepatuhanPersen)})"
        >
          <span class="pr-ok">+${item.pertumbuhanYoY.toFixed(1).replace('.', ',')}%</span>
          <span class="pr-col-track"><i style="--h: ${heightRatio};"></i></span>
          <span class="pr-col-val">${totalJuta.toFixed(2).replace('.', ',')} Jt</span>
          <small>${yr} · ${formatPersen(item.kepatuhanPersen)}</small>
        </button>
      `;
    })
    .join('');

  container.querySelectorAll('.pr-col').forEach((btn) => {
    btn.addEventListener('click', () => {
      const yr = parseInt(btn.getAttribute('data-year'), 10);
      if (yr && yr !== currentSelectedYear) {
        selectYear(yr);
      }
    });
  });
}

// Auto-boot on DOM ready
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPenerimaanPage);
  } else {
    initPenerimaanPage();
  }
}
