/**
 * paJAK-Kita — Modul Akses Data Tunggal untuk Web Client
 * File: js/dataClient.js
 *
 * Mengimplementasikan modul akses data tunggal paJAK-Kita untuk peramban web:
 * - getMeta
 * - getRingkasanApbd
 * - getPendapatanPerAkun
 * - getBelanjaPerAkun
 * - getBelanjaPerUrusanPorsi (hanya kode, nama_pendek, kelompok, porsi_dari_jumlah_urusan_persen; nilai_dashboard dilarang diekspos)
 * - getPembiayaanPerAkun
 * - getTurunan
 * - getInsight (mengembalikan [] sesuai aturan)
 */

let cachedData = null;

export function validateDataAnggaran(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('Galat Validasi: Data anggaran kosong atau bukan objek JSON');
  }

  const requiredSections = [
    'meta',
    'ringkasan_apbd',
    'pendapatan_per_akun',
    'belanja_per_akun',
    'belanja_per_urusan',
    'pembiayaan_per_akun',
    'turunan',
  ];

  for (const section of requiredSections) {
    if (!(section in data)) {
      throw new Error(`Galat Validasi: Bagian wajib '${section}' tidak ditemukan dalam data anggaran`);
    }
  }

  if (!data.meta.sumber || !data.meta.sumber.nama || !data.meta.istilah) {
    throw new Error('Galat Validasi: Struktur metadata tidak lengkap');
  }

  return true;
}

export async function loadData() {
  if (cachedData) return cachedData;

  const candidateUrls = [
    'public/data/pajak-kita-data-anggaran.json',
    '/public/data/pajak-kita-data-anggaran.json',
    'data/pajak-kita-data-anggaran.json',
    '/data/pajak-kita-data-anggaran.json',
  ];

  for (const url of candidateUrls) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        validateDataAnggaran(json);
        cachedData = json;
        return cachedData;
      }
    } catch {
      // Coba kandidat berikutnya
    }
  }

  throw new Error('Galat: Tidak dapat memuat berkas data anggaran APBD.');
}

export async function getMeta() {
  const data = await loadData();
  return { ...data.meta };
}

export async function getRingkasanApbd() {
  const data = await loadData();
  return {
    pendapatan: [...data.ringkasan_apbd.pendapatan],
    belanja: [...data.ringkasan_apbd.belanja],
    pembiayaan_penerimaan: [...data.ringkasan_apbd.pembiayaan_penerimaan],
    pembiayaan_pengeluaran: [...data.ringkasan_apbd.pembiayaan_pengeluaran],
  };
}

export async function getPendapatanPerAkun() {
  const data = await loadData();
  return data.pendapatan_per_akun.map((item) => ({
    kode: item.kode,
    nama: item.nama,
    nilai: { ...item.nilai },
  }));
}

export async function getBelanjaPerAkun() {
  const data = await loadData();
  return {
    operasi: data.belanja_per_akun.operasi.map((i) => ({ ...i, nilai: { ...i.nilai } })),
    modal: data.belanja_per_akun.modal.map((i) => ({ ...i, nilai: { ...i.nilai } })),
    tidak_terduga: data.belanja_per_akun.tidak_terduga.map((i) => ({ ...i, nilai: { ...i.nilai } })),
    transfer: data.belanja_per_akun.transfer.map((i) => ({ ...i, nilai: { ...i.nilai } })),
  };
}

export async function getBelanjaPerUrusanPorsi() {
  const data = await loadData();
  return data.belanja_per_urusan.data.map((item) => ({
    kode: item.kode,
    nama_pendek: item.nama_pendek,
    kelompok: item.kelompok,
    porsi_dari_jumlah_urusan_persen: { ...item.porsi_dari_jumlah_urusan_persen },
    // PERINGATAN: nilai_dashboard dilarang keras diekspos
  }));
}

export async function getPembiayaanPerAkun() {
  const data = await loadData();
  return {
    penerimaan: data.pembiayaan_per_akun.penerimaan.map((i) => ({ ...i, nilai: { ...i.nilai } })),
    pengeluaran: data.pembiayaan_per_akun.pengeluaran.map((i) => ({ ...i, nilai: { ...i.nilai } })),
  };
}

export async function getTurunan() {
  const data = await loadData();
  return {
    catatan: data.turunan.catatan,
    porsi_pendapatan_persen: { ...data.turunan.porsi_pendapatan_persen },
    perubahan_2025_ke_2026: { ...data.turunan.perubahan_2025_ke_2026 },
    porsi_belanja_per_jenis_persen_2026: { ...data.turunan.porsi_belanja_per_jenis_persen_2026 },
    lima_urusan_terbesar_2026: data.turunan.lima_urusan_terbesar_2026.map((item) => ({
      kode: item.kode,
      nama_pendek: item.nama_pendek,
      porsi_dari_jumlah_urusan_persen: item.porsi_dari_jumlah_urusan_persen,
    })),
  };
}

export async function getInsight(wilayah) {
  try {
    let facts = [];
    const urls = [
      'public/data/insight-facts.json',
      '/public/data/insight-facts.json',
    ];
    for (const u of urls) {
      try {
        const res = await fetch(u);
        if (res.ok) {
          facts = await res.json();
          break;
        }
      } catch {
        // coba url berikutnya
      }
    }

    if (!facts || facts.length === 0) return [];
    if (!wilayah || wilayah === 'Semua Wilayah' || wilayah === 'Seluruh DKI Jakarta') {
      return facts;
    }

    const normalized = wilayah.toLowerCase().trim();
    const matched = facts.filter(
      (f) =>
        f.wilayah.toLowerCase().includes(normalized) ||
        normalized.includes(f.wilayah.toLowerCase()) ||
        f.cakupan === 'jakarta'
    );
    return matched.length > 0 ? matched : facts;
  } catch {
    return [];
  }
}

// =============================================================================
// Cache & Validasi Realisasi APBD
// =============================================================================

let cachedRealisasiData = null;

export function validateDataRealisasi(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('Galat Validasi Realisasi: Data realisasi kosong atau bukan objek JSON');
  }

  const requiredSections = [
    'meta',
    'realisasi_per_akun',
    'realisasi_per_skpd',
    'turunan',
  ];

  for (const s of requiredSections) {
    if (!(s in data)) {
      throw new Error(`Galat Validasi Realisasi: Bagian wajib '${s}' tidak ditemukan dalam data realisasi`);
    }
  }

  if (!data.meta || !data.meta.sumber || !data.meta.tanggal_data) {
    throw new Error('Galat Validasi Realisasi: Struktur metadata realisasi tidak lengkap');
  }

  if (
    !Array.isArray(data.realisasi_per_akun.pendapatan) ||
    !Array.isArray(data.realisasi_per_akun.belanja)
  ) {
    throw new Error('Galat Validasi Realisasi: Daftar pendapatan dan belanja per akun harus berupa array');
  }

  if (!data.realisasi_per_skpd.data || !Array.isArray(data.realisasi_per_skpd.data)) {
    throw new Error('Galat Validasi Realisasi: Daftar SKPD harus berupa array');
  }

  return true;
}

export async function loadRealisasiData() {
  if (cachedRealisasiData) return cachedRealisasiData;

  const urls = [
    'public/data/pajak-kita-data-realisasi.json',
    '/public/data/pajak-kita-data-realisasi.json',
    'data/pajak-kita-data-realisasi.json',
    '/data/pajak-kita-data-realisasi.json',
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        const parsed = await res.json();
        validateDataRealisasi(parsed);
        cachedRealisasiData = parsed;
        return cachedRealisasiData;
      }
    } catch {
      // Coba url berikutnya
    }
  }

  throw new Error('Galat: Tidak dapat memuat berkas data realisasi APBD (pajak-kita-data-realisasi.json)');
}

export async function getRealisasiMeta() {
  const data = await loadRealisasiData();
  return { ...data.meta };
}

export async function getRealisasiPerAkun() {
  const data = await loadRealisasiData();

  const mapAkun = (item) => {
    const anggaran = item.anggaran || 0;
    const realisasi = item.realisasi || 0;
    const persen_hitung = anggaran > 0 ? Math.round((realisasi / anggaran) * 10000) / 100 : 0;
    const selisih_menuju_anggaran = anggaran - realisasi;

    return {
      kode: item.kode,
      nama: item.nama,
      anggaran,
      realisasi,
      persen_dashboard: item.persen_dashboard,
      persen_hitung,
      selisih_menuju_anggaran,
    };
  };

  return {
    pendapatan: data.realisasi_per_akun.pendapatan.map(mapAkun),
    belanja: data.realisasi_per_akun.belanja.map(mapAkun),
    pembiayaan_penerimaan: (data.realisasi_per_akun.pembiayaan_penerimaan || []).map(mapAkun),
    pembiayaan_pengeluaran: (data.realisasi_per_akun.pembiayaan_pengeluaran || []).map(mapAkun),
    total_halaman: { ...data.realisasi_per_akun.total_halaman },
  };
}

export async function getRealisasiPerSkpd() {
  const data = await loadRealisasiData();
  const totalBelanjaAnggaran = data.realisasi_per_skpd.jumlah.belanja_anggaran || 74285299931740;

  const sorted = [...data.realisasi_per_skpd.data].sort(
    (a, b) => b.belanja.anggaran - a.belanja.anggaran
  );

  const peringkatMap = new Map();
  sorted.forEach((item, index) => {
    peringkatMap.set(item.no, index + 1);
  });

  const unitList = data.realisasi_per_skpd.data.map((item) => {
    const ang = item.belanja.anggaran;
    const real = item.belanja.realisasi;
    const serapan_persen = ang > 0 ? Math.round((real / ang) * 10000) / 100 : null;
    const porsi_dari_total_belanja_persen =
      totalBelanjaAnggaran > 0 ? Math.round((ang / totalBelanjaAnggaran) * 10000) / 100 : 0;

    return {
      no: item.no,
      nama: item.nama,
      nama_pendek: item.nama_pendek,
      jenis_unit: item.jenis_unit,
      wilayah: item.wilayah,
      pendapatan: { ...item.pendapatan },
      belanja: {
        anggaran: ang,
        realisasi: real,
        serapan_persen,
      },
      pembiayaan: { ...item.pembiayaan },
      peringkat_belanja: peringkatMap.get(item.no) || 0,
      porsi_dari_total_belanja_persen,
    };
  });

  return {
    jumlah: { ...data.realisasi_per_skpd.jumlah },
    data: unitList,
  };
}

export async function getTurunanRealisasi() {
  const data = await loadRealisasiData();
  return { ...data.turunan };
}

