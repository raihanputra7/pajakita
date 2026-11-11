/**
 * paJAK-Kita — Welcome Greeting Toast Notification
 * File: js/welcomeNotification.js
 *
 * Mengelola penyimpanan profil lokal di browser (localStorage)
 * dan menampilkan notifikasi kecil (toast sapaan) saat pengguna kembali ke situs.
 *
 * Format Storage:
 * key: "pajakkita:v1:profil"
 * value: { "wilayah": "...", "nama": "...", "terakhir": 1731139000000 }
 *
 * Session Flag:
 * key: "pajakkita:v1:sapa" (sessionStorage)
 */

export const STORAGE_KEY_PROFILE = 'pajakkita:v1:profil';
export const SESSION_KEY_GREETED = 'pajakkita:v1:sapa';

export const VALID_REGIONS = [
  'Jakarta Pusat',
  'Jakarta Barat',
  'Jakarta Selatan',
  'Jakarta Timur',
  'Jakarta Utara',
  'Kepulauan Seribu'
];

/**
 * Memeriksa apakah suatu wilayah valid untuk disimpan (eksklusif per wilayah, bukan agregat)
 * @param {string} region
 * @returns {boolean}
 */
export function isValidRegion(region) {
  if (!region || typeof region !== 'string') return false;
  const trimmed = region.trim();
  if (trimmed === 'Semua Wilayah' || trimmed === 'Seluruh DKI Jakarta') return false;
  return VALID_REGIONS.includes(trimmed);
}

/**
 * Menyimpan profil saat pengguna berhasil mengunduh kartu
 * @param {string} region - Nama wilayah
 * @param {string} [name] - Nama panggilan (opsional)
 */
export function saveExportProfile(region, name = '') {
  try {
    if (!isValidRegion(region)) return;

    localStorage.removeItem('pajakkita:deleted');

    const profileData = {
      wilayah: region.trim(),
      nama: (name || '').trim(),
      terakhir: Date.now()
    };

    localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(profileData));
    sessionStorage.removeItem(SESSION_KEY_GREETED);
  } catch (err) {
    // Mode private atau storage diblokir: abaikan tanpa error ke console
  }
}

/**
 * Membaca profil tersimpan dan memvalidasi isinya
 * @returns {{ wilayah: string, nama: string, terakhir: number } | null}
 */
export function getSavedProfile() {
  try {
    if (localStorage.getItem('pajakkita:deleted') === 'true') {
      return null;
    }

    let raw = localStorage.getItem(STORAGE_KEY_PROFILE);
    if (!raw) {
      // Cek legacy key jika ada
      raw = localStorage.getItem('pajakita_user_profile');
      if (raw) {
        try {
          const legacy = JSON.parse(raw);
          if (legacy && legacy.region && isValidRegion(legacy.region)) {
            return {
              wilayah: legacy.region.trim(),
              nama: typeof legacy.name === 'string' ? legacy.name.trim() : '',
              terakhir: legacy.updatedAt || Date.now()
            };
          }
        } catch (e) {}
      }

      // Tidak ada profil tersimpan -> kosong (non-user) sampai warga menyimpan/mengunduh kartu
      return null;
    }

    const data = JSON.parse(raw);
    if (!data || typeof data !== 'object') {
      return null;
    }

    if (!isValidRegion(data.wilayah)) {
      return null;
    }

    return {
      wilayah: data.wilayah.trim(),
      nama: typeof data.nama === 'string' ? data.nama.trim() : '',
      terakhir: Number(data.terakhir) || Date.now()
    };
  } catch (err) {
    return null;
  }
}

/**
 * Menghapus profil dari localStorage dan flag sesi
 */
export function clearSavedProfile() {
  try {
    localStorage.removeItem(STORAGE_KEY_PROFILE);
    localStorage.removeItem('pajakita_user_profile');
    localStorage.setItem('pajakkita:deleted', 'true');
  } catch (err) {}
  try {
    sessionStorage.removeItem(SESSION_KEY_GREETED);
  } catch (err) {}
}

/**
 * Menandai sesi bahwa sapaan sudah ditampilkan
 */
export function markSessionGreeted() {
  try {
    sessionStorage.setItem(SESSION_KEY_GREETED, 'true');
  } catch (err) {}
}

/**
 * Memeriksa apakah sapaan sudah pernah muncul di sesi ini
 * @returns {boolean}
 */
export function isSessionGreeted() {
  try {
    return sessionStorage.getItem(SESSION_KEY_GREETED) === 'true';
  } catch (err) {
    return false;
  }
}

let activeToastElement = null;
let toastAutoCloseTimer = null;

/**
 * Menutup toast sapaan dengan animasi keluar
 */
export function closeGreetingToast() {
  if (toastAutoCloseTimer) {
    clearTimeout(toastAutoCloseTimer);
    toastAutoCloseTimer = null;
  }

  if (!activeToastElement) return;

  const toast = activeToastElement;
  activeToastElement = null;

  toast.classList.add('is-leaving');

  const removeEl = () => {
    if (toast.parentNode) {
      toast.parentNode.removeChild(toast);
    }
  };

  // Tunggu animasi 200ms
  setTimeout(removeEl, 210);
}

/**
 * Menampilkan notifikasi toast sapaan selamat datang
 * @param {{ wilayah: string, nama: string }} profile
 */
export function showGreetingToast(profile) {
  if (!profile || !profile.wilayah) return;

  // Bersihkan toast lama jika ada
  if (activeToastElement) {
    closeGreetingToast();
  }

  const toast = document.createElement('aside');
  toast.className = 'pajakita-greeting-toast';
  toast.id = 'pajakita-greeting-toast';
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');

  // Format nama (maksimal 24 karakter dengan elipsis)
  const trimmedName = (profile.nama || '').trim();
  const displayName = trimmedName.length > 24 ? trimmedName.slice(0, 24) + '…' : trimmedName;

  // Maskot Ondel-Ondel Ondi
  const mascotWrap = document.createElement('div');
  mascotWrap.className = 'pajakita-greeting-mascot';
  mascotWrap.setAttribute('aria-hidden', 'true');

  const mascotImg = document.createElement('img');
  mascotImg.src = 'public/assets/maskot-ondi/ondi-02-menyambut.svg';
  mascotImg.alt = '';
  mascotImg.width = 76;
  mascotImg.height = 124;
  mascotImg.onerror = () => {
    mascotImg.src = 'public/assets/maskot-ondi/ondi-02-menyambut.png';
  };
  mascotWrap.appendChild(mascotImg);

  // Konten Teks
  const contentWrap = document.createElement('div');
  contentWrap.className = 'pajakita-greeting-content';

  const titleEl = document.createElement('div');
  titleEl.className = 'pajakita-greeting-title';

  const textEl = document.createElement('div');
  textEl.className = 'pajakita-greeting-text';

  if (displayName) {
    titleEl.textContent = `Halo, ${displayName}!`;
    textEl.textContent = `Selamat datang kembali, warga ${profile.wilayah}.`;
  } else {
    titleEl.textContent = 'Selamat datang kembali!';
    textEl.textContent = `Halo, warga ${profile.wilayah}.`;
  }

  // Tombol "Tutup notifikasi" dengan indikator visual loading bulet countdown 10 detik
  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'pajakita-greeting-btn';
  closeBtn.setAttribute('aria-label', 'Tutup notifikasi (otomatis tertutup dalam 10 detik)');

  const btnText = document.createElement('span');
  btnText.textContent = 'Tutup notifikasi';

  const spinnerWrap = document.createElement('span');
  spinnerWrap.className = 'pajakita-timer-spinner';
  spinnerWrap.setAttribute('aria-hidden', 'true');
  spinnerWrap.innerHTML = `
    <svg viewBox="0 0 20 20" class="pajakita-timer-svg" width="16" height="16">
      <circle class="timer-track" cx="10" cy="10" r="7" />
      <circle class="timer-fill" cx="10" cy="10" r="7" />
    </svg>
  `;

  closeBtn.appendChild(btnText);
  closeBtn.appendChild(spinnerWrap);

  closeBtn.addEventListener('click', () => {
    closeGreetingToast();
  });

  // Delay auto-close 10 detik
  toastAutoCloseTimer = setTimeout(() => {
    closeGreetingToast();
  }, 10000);

  contentWrap.appendChild(titleEl);
  contentWrap.appendChild(textEl);
  contentWrap.appendChild(closeBtn);

  toast.appendChild(mascotWrap);
  toast.appendChild(contentWrap);

  // Aksesibilitas: Esc menutup notifikasi HANYA jika fokus ada di dalam notifikasi
  toast.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeGreetingToast();
    }
  });

  document.body.appendChild(toast);
  activeToastElement = toast;

  // PENTING: JANGAN mencuri fokus saat muncul (fokus tetap di tempat user berada)
}

/**
 * Inisialisasi tautan "Hapus data saya" di footer
 */
export function initFooterDeleteData() {
  const btn = document.getElementById('btn-footer-delete-data');
  const statusEl = document.getElementById('footer-delete-status');

  if (btn) {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      clearSavedProfile();
      closeGreetingToast();

      if (statusEl) {
        statusEl.textContent = 'Data tersimpan di browser ini sudah dihapus.';
        statusEl.style.display = 'inline';
      }
      btn.style.display = 'none';
    });
  }
}

/**
 * Inisialisasi otomatis pengecekan notifikasi toast sapaan saat halaman siap
 */
export function initWelcomeGreeting() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  initFooterDeleteData();

  const profile = getSavedProfile();
  if (!profile) return;

  // Jeda ~600 ms setelah halaman siap
  setTimeout(() => {
    const validProfile = getSavedProfile();
    if (validProfile) {
      showGreetingToast(validProfile);
    }
  }, 600);
}

