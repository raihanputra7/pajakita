/**
 * =============================================================================
 * paJAK-Kita — Controller Halaman Glosarium & Kamus (kamus.js)
 * Memuat dan mengelola 158 istilah resmi APBD & Pajak Daerah DKI Jakarta
 * Fitur: Real-time Live Search, A–Z Quick Jump, Kategori, Mini Index, Deep Link
 * =============================================================================
 */

(function () {
  'use strict';

  // State aplikasi kamus
  const state = {
    allEntries: [],
    categories: [],
    activeLetter: null,
    activeCategory: 'Semua',
    searchQuery: '',
    filteredEntries: []
  };

  // DOM Elements
  const searchInput = document.getElementById('kamusSearchInput');
  const clearBtn = document.getElementById('kamusClearBtn');
  const alphabetBar = document.getElementById('kamusAlphabetBar');
  const resetAlphabetBtn = document.getElementById('kamusResetAlphabet');
  const categoryPillsContainer = document.getElementById('kamusCategoryPills');
  const quickListBox = document.getElementById('kamusQuickListBox');
  const resultCountBadge = document.getElementById('kamusResultCount');
  const contentContainer = document.getElementById('kamusContent');

  /**
   * Mengambil data 158 istilah glosarium dari file JSON
   */
  async function loadGlossaryData() {
    const urls = ['public/data/glosarium-pajak-keuangan-daerah.json', '/public/data/glosarium-pajak-keuangan-daerah.json', 'data/glosarium-pajak-keuangan-daerah.json', '/data/glosarium-pajak-keuangan-daerah.json'];

    for (const url of urls) {
      try {
        const res = await fetch(url);
        if (res.ok) {
          const json = await res.json();
          initGlossary(json);
          return;
        }
      } catch (e) {
        // Coba url berikutnya
      }
    }

    renderErrorState('Gagal memuat berkas glosarium. Silakan segarkan halaman.');
  }

  /**
   * Inisialisasi awal setelah data JSON berhasil dimuat
   */
  function initGlossary(data) {
    const rawEntries = Array.isArray(data.entries) ? data.entries : [];

    // Sort entri berdasarkan abjad singkatan/nama
    state.allEntries = rawEntries.map((item, idx) => ({
      ...item,
      id: item.id || `term-${idx}`,
      firstLetter: (item.abbreviation || item.fullName || '#').charAt(0).toUpperCase()
    })).sort((a, b) => {
      const termA = (a.abbreviation || a.fullName).toLowerCase();
      const termB = (b.abbreviation || b.fullName).toLowerCase();
      return termA.localeCompare(termB, 'id');
    });

    // Kategori unik
    const catSet = new Set(['Semua']);
    if (data.meta && Array.isArray(data.meta.categories)) {
      data.meta.categories.forEach(c => catSet.add(c));
    } else {
      state.allEntries.forEach(e => {
        if (e.category) catSet.add(e.category);
      });
    }
    state.categories = Array.from(catSet);

    // Setup UI awal
    renderCategoryPills();
    renderAlphabetBar();
    applyFilter();
    setupEventListeners();

    // Check URL Hash untuk deep-linking (misal kamus.html#apbd)
    if (window.location.hash) {
      const targetId = window.location.hash.substring(1);
      setTimeout(() => scrollToTerm(targetId), 300);
    }
  }

  /**
   * Render Tombol Kategori
   */
  function renderCategoryPills() {
    if (!categoryPillsContainer) return;
    categoryPillsContainer.innerHTML = '';

    state.categories.forEach(cat => {
      const pill = document.createElement('button');
      pill.type = 'button';
      pill.className = `kamus-cat-pill ${cat === state.activeCategory ? 'active' : ''}`;
      pill.textContent = cat;
      pill.addEventListener('click', () => {
        state.activeCategory = cat;
        renderCategoryPills();
        applyFilter();
      });
      categoryPillsContainer.appendChild(pill);
    });
  }

  /**
   * Render Tombol Lompat Alfabet A-Z
   */
  function renderAlphabetBar() {
    if (!alphabetBar) return;
    alphabetBar.innerHTML = '';

    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

    letters.forEach(letter => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `kamus-alpha-btn ${state.activeLetter === letter ? 'active' : ''}`;
      btn.textContent = letter;
      btn.dataset.letter = letter;

      btn.addEventListener('click', () => {
        if (state.activeLetter === letter) {
          state.activeLetter = null;
        } else {
          state.activeLetter = letter;
        }
        renderAlphabetBar();
        applyFilter();

        // Jika tombol aktif dan ada elemen grupnya, scroll ke grup
        if (state.activeLetter) {
          const groupEl = document.getElementById(`group-${state.activeLetter}`);
          if (groupEl) {
            groupEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
      });

      alphabetBar.appendChild(btn);
    });
  }

  /**
   * Filter entri berdasarkan search query, kategori, dan huruf abjad
   */
  function applyFilter() {
    const q = (state.searchQuery || '').trim().toLowerCase();
    const cat = state.activeCategory;
    const letter = state.activeLetter;

    state.filteredEntries = state.allEntries.filter(item => {
      // 1. Filter Kategori
      if (cat !== 'Semua' && item.category !== cat) {
        return false;
      }

      // 2. Filter Huruf A-Z
      if (letter && item.firstLetter !== letter) {
        return false;
      }

      // 3. Filter Teks Pencarian
      if (q) {
        const inAbbr = (item.abbreviation || '').toLowerCase().includes(q);
        const inName = (item.fullName || '').toLowerCase().includes(q);
        const inDef = (item.definition || '').toLowerCase().includes(q);
        const inCat = (item.category || '').toLowerCase().includes(q);
        return inAbbr || inName || inDef || inCat;
      }

      return true;
    });

    // Update state disabled/active pada tombol alfabet
    updateAlphabetDisabledStates();

    // Render Mini Index & Daftar Istilah Utama
    renderQuickList();
    renderMainContent();

    // Update Counter
    if (resultCountBadge) {
      resultCountBadge.textContent = `${state.filteredEntries.length} istilah`;
    }
  }

  /**
   * Update tombol A-Z: nonaktifkan huruf yang tidak punya entri di hasil saat ini
   */
  function updateAlphabetDisabledStates() {
    if (!alphabetBar) return;
    const availableLetters = new Set(
      state.allEntries
        .filter(item => {
          if (state.activeCategory !== 'Semua' && item.category !== state.activeCategory) return false;
          if (state.searchQuery) {
            const q = state.searchQuery.toLowerCase();
            return (item.abbreviation || '').toLowerCase().includes(q) ||
                   (item.fullName || '').toLowerCase().includes(q) ||
                   (item.definition || '').toLowerCase().includes(q);
          }
          return true;
        })
        .map(i => i.firstLetter)
    );

    const buttons = alphabetBar.querySelectorAll('.kamus-alpha-btn');
    buttons.forEach(btn => {
      const l = btn.dataset.letter;
      const hasTerms = availableLetters.has(l);
      btn.disabled = !hasTerms;
      btn.classList.toggle('active', state.activeLetter === l);
    });
  }

  /**
   * Render Mini Index (Quick List Box) di Kolom Kiri
   */
  function renderQuickList() {
    if (!quickListBox) return;
    quickListBox.innerHTML = '';

    if (state.filteredEntries.length === 0) {
      quickListBox.innerHTML = '<div style="padding: 12px; font-size: 0.75rem; color: #94A3B8; text-align: center;">Tidak ada istilah sesuai filter</div>';
      return;
    }

    state.filteredEntries.forEach(item => {
      const a = document.createElement('a');
      a.className = 'quicklist-item';
      a.href = `#${item.id}`;
      a.innerHTML = `
        <span class="quicklist-item-abbr">${escapeHtml(item.abbreviation || '')}</span>
        <span class="quicklist-item-name" title="${escapeHtml(item.fullName || '')}">${escapeHtml(item.fullName || '')}</span>
      `;
      a.addEventListener('click', (e) => {
        e.preventDefault();
        scrollToTerm(item.id);
      });
      quickListBox.appendChild(a);
    });
  }

  /**
   * Render Daftar Lengkap Istilah di Kolom Kanan dikelompokkan per Abjad
   */
  function renderMainContent() {
    if (!contentContainer) return;
    contentContainer.innerHTML = '';

    // Handle Empty State
    if (state.filteredEntries.length === 0) {
      contentContainer.innerHTML = `
        <div class="kamus-empty-state">
          <div class="kamus-empty-icon">🔍</div>
          <h3 class="kamus-empty-title">Istilah tidak ditemukan</h3>
          <p class="kamus-empty-desc">Coba cari kata kunci lain atau periksa ejaan singkatan.</p>
          <button type="button" class="kamus-cat-pill active" id="emptyResetBtn" style="padding: 8px 18px; font-size: 0.8125rem;">
            Reset Pencarian &amp; Filter
          </button>
        </div>
      `;

      const emptyResetBtn = document.getElementById('emptyResetBtn');
      if (emptyResetBtn) {
        emptyResetBtn.addEventListener('click', resetAllFilters);
      }
      return;
    }

    // Kelompokkan per huruf abjad
    const grouped = {};
    state.filteredEntries.forEach(item => {
      const l = item.firstLetter || '#';
      if (!grouped[l]) grouped[l] = [];
      grouped[l].push(item);
    });

    const sortedLetters = Object.keys(grouped).sort();

    sortedLetters.forEach(letter => {
      const groupEl = document.createElement('section');
      groupEl.className = 'kamus-alpha-group';
      groupEl.id = `group-${letter}`;

      // Header Huruf
      groupEl.innerHTML = `
        <div class="kamus-alpha-heading">
          <div class="kamus-alpha-letter">${letter}</div>
          <div class="kamus-alpha-count">${grouped[letter].length} istilah</div>
        </div>
        <div class="kamus-terms-list" id="terms-list-${letter}"></div>
      `;

      const termsListEl = groupEl.querySelector(`#terms-list-${letter}`);

      // Kartu Entri Istilah
      grouped[letter].forEach(item => {
        const card = document.createElement('article');
        card.className = 'kamus-entry-card';
        card.id = item.id;

        const noteHtml = item.note ? `<div class="kamus-entry-note">Catatan: ${escapeHtml(item.note)}</div>` : '';
        const tagHtml = item.category ? `<span class="kamus-entry-tag">${escapeHtml(item.category)}</span>` : '';

        card.innerHTML = `
          <div class="kamus-entry-top">
            <div class="kamus-entry-title-wrap">
              <span class="kamus-entry-abbr">${escapeHtml(item.abbreviation || '')}</span>
              ${item.fullName && item.fullName !== item.abbreviation ? `<span class="kamus-entry-fullname">— ${escapeHtml(item.fullName)}</span>` : ''}
            </div>
            ${tagHtml}
          </div>
          <p class="kamus-entry-def">${escapeHtml(item.definition || '')}</p>
          ${noteHtml}
        `;

        termsListEl.appendChild(card);
      });

      contentContainer.appendChild(groupEl);
    });
  }

  /**
   * Scroll halus ke kartu istilah tertentu dan beri efek visual highlight
   */
  function scrollToTerm(id) {
    const card = document.getElementById(id);
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      card.classList.remove('term-highlighted');
      // Trigger reflow agar animasi bisa berulang
      void card.offsetWidth;
      card.classList.add('term-highlighted');

      // Update URL hash secara rapi tanpa reload
      if (history.pushState) {
        history.pushState(null, null, `#${id}`);
      } else {
        window.location.hash = id;
      }
    }
  }

  /**
   * Reset seluruh filter pencarian, abjad, dan kategori
   */
  function resetAllFilters() {
    state.searchQuery = '';
    state.activeCategory = 'Semua';
    state.activeLetter = null;

    if (searchInput) searchInput.value = '';
    if (clearBtn) clearBtn.style.display = 'none';

    renderCategoryPills();
    renderAlphabetBar();
    applyFilter();
  }

  /**
   * Pasang listener interaksi pengguna
   */
  function setupEventListeners() {
    // Input Pencarian Real-Time
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        state.searchQuery = e.target.value;
        if (clearBtn) {
          clearBtn.style.display = state.searchQuery ? 'flex' : 'none';
        }
        applyFilter();
      });
    }

    // Tombol Clear Pencarian
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (searchInput) {
          searchInput.value = '';
          searchInput.focus();
        }
        clearBtn.style.display = 'none';
        state.searchQuery = '';
        applyFilter();
      });
    }

    // Tombol Reset Abjad
    if (resetAlphabetBtn) {
      resetAlphabetBtn.addEventListener('click', () => {
        state.activeLetter = null;
        renderAlphabetBar();
        applyFilter();
      });
    }
  }

  /**
   * Helper sanitasi teks untuk keamanan DOM
   */
  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Render state kesalahan jika JSON gagal dimuat
   */
  function renderErrorState(msg) {
    if (contentContainer) {
      contentContainer.innerHTML = `
        <div class="kamus-empty-state">
          <div class="kamus-empty-icon">⚠️</div>
          <h3 class="kamus-empty-title">Kendala Memuat Data</h3>
          <p class="kamus-empty-desc">${escapeHtml(msg)}</p>
        </div>
      `;
    }
  }

  // Jalankan saat DOM siap
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadGlossaryData);
  } else {
    loadGlossaryData();
  }
})();
