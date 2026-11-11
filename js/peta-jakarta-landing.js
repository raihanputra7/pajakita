/**
 * paJAK-Kita — Dashboard Peta Interaktif Wilayah Administrasi DKI Jakarta (Split-Screen 50:50)
 * File: js/peta-jakarta-landing.js
 *
 * Fitur Utama:
 * 1. Peta SVG interaktif 6 wilayah (5 Kota Administrasi & 1 Kabupaten Administrasi Kepulauan Seribu via inset).
 * 2. Warna peta mempertahankan estetika Betawi Modern (saturasi pudar saat default, warna penuh & garis sorot saat dipilih/hover).
 * 3. Interaksi hover (floating tooltip di atas kursor) dan click (mengunci wilayah & memperbarui panel kanan dengan transisi halus).
 * 4. Panel informasi kanan dengan 6 kategori Accordion/Dropdown yang dapat dibuka & ditutup:
 *    - Ringkasan Wilayah
 *    - Penerimaan Pajak Daerah
 *    - Target dan Realisasi Pajak
 *    - Belanja APBD
 *    - Program Pembangunan
 *    - Insight dan Rekomendasi
 * 5. Integrasi data resmi BPKD DKI Jakarta (per 25 Okt 2026) & Satu Data Jakarta, disertai label transparan
 *    untuk angka proporsi/estimasi simulasi agar jujur dan tidak mengarang data resmi.
 */

(function () {
  "use strict";

  var mapGeoData = window.PETA_JAKARTA;
  if (!mapGeoData) return;

  var NS = "http://www.w3.org/2000/svg";
  var svg = document.getElementById("peta-jakarta-svg");
  var tooltip = document.getElementById("peta-jakarta-tooltip");
  var ondiPointer = document.getElementById("peta-ondi-pointer");
  var quickPillsContainer = document.getElementById("peta-quick-pills");
  var legendContainer = document.getElementById("peta-legend-items");
  var accordionContainer = document.getElementById("peta-accordion-group");
  var infoPanel = document.getElementById("peta-info-panel");

  if (!svg || !tooltip || !accordionContainer) return;

  // Konfigurasi posisi & ukuran maskot Ondi saat menunjuk wilayah yang dipilih
  var ONDI_POINTER_CONFIG = {
    heightRatioDesktop: 0.38, // Tinggi Ondi = 38% dari tinggi peta (rentang 35–45%)
    heightRatioMobile: 0.33,  // Tinggi Ondi pada layar <= 600px
    aspectRatio: 460 / 630,   // Rasio gambar asli 460:630
    // Posisi ujung jari telunjuk di dalam gambar Ondi (relatif 0..1)
    fingerTipXRatio: 0.035,   // ~3.5% dari tepi kiri gambar
    fingerTipYRatio: 0.36,    // ~1/3 dari tepi atas gambar
    gapPx: 6,                 // Jarak horizontal (px) antara titik tunjuk wilayah dan ujung jari Ondi
    offsetX: 0,               // Penyesuaian manual horizontal tambahan (px)
    offsetY: 0,               // Penyesuaian manual vertikal tambahan (px)
    // Titik sasaran tunjuk per wilayah (relatif 0..1 terhadap bounding box path masing-masing wilayah)
    regionTargets: {
      "jakarta-timur":    { targetBBoxXRatio: 0.64, targetBBoxYRatio: 0.54 },
      "jakarta-selatan":  { targetBBoxXRatio: 0.88, targetBBoxYRatio: 0.48 },
      "jakarta-pusat":    { targetBBoxXRatio: 0.90, targetBBoxYRatio: 0.52 },
      "jakarta-barat":    { targetBBoxXRatio: 0.85, targetBBoxYRatio: 0.62 },
      "jakarta-utara":    { targetBBoxXRatio: 0.76, targetBBoxYRatio: 0.68 },
      "kepulauan-seribu": { targetBBoxXRatio: 0.90, targetBBoxYRatio: 0.52 }
    }
  };

  // =========================================================================
  // DATABASE LENGKAP 6 WILAYAH ADMINISTRASI DKI JAKARTA
  // Menggabungkan Data Resmi BPKD (pajak-kita-data-realisasi.json) & Satu Data
  // serta Data Simulasi Proporsional yang diberi label jelas.
  // =========================================================================
  var WILAYAH_PROFILES = {
    "jakarta-selatan": {
      id: "jakarta-selatan",
      nama: "Jakarta Selatan",
      jenis: "Kota Administrasi",
      kode: "KOTA ADM. JAKSEL • 10 KECAMATAN",
      warna: "#207A5B",
      tagline: "Pusat Kawasan Bisnis Terpadu, Hunian Hijau & Kontributor PBB-P2 Tertinggi",
      kpiUtama: {
        pajakVal: "Rp 4,12 T",
        pajakSub: "PBB-P2 Tertinggi (Satu Data)",
        anggaranVal: "Rp 1,32 T",
        realisasiVal: "Rp 966,71 M",
        serapanSub: "73,03% Terserap (BPKD 2026)"
      },
      ringkasan: {
        statusData: "DATA RESMI ADMINISTRATIF & DEMOGRAFI",
        isResmi: true,
        deskripsi: "Jakarta Selatan merupakan pusat bisnis koridor Sudirman–TB Simatupang sekaligus kawasan permukiman utama dengan ruang terbuka hijau dan daerah resapan air terluas di selatan Jakarta.",
        stats: [
          { label: "Pusat Pemerintahan", val: "Kebayoran Baru" },
          { label: "Cakupan Wilayah", val: "10 Kecamatan · 65 Kelurahan" },
          { label: "Luas Daratan", val: "145,73 km²" },
          { label: "Karakter Ekonomi", val: "Perkantoran, Hunian & Gaya Hidup" }
        ]
      },
      penerimaanPajak: {
        statusData: "DATA TERVERIFIKASI SATU DATA & SIMULASI PROPORSI",
        isResmi: false,
        catatanSumber: "Fakta unggulan Rp 4,12 T bersumber dari dataset aplikasi (Satu Data Jakarta). Rincian porsi per jenis pajak di bawah adalah estimasi simulasi proporsional wilayah.",
        sorotanUtama: "Kontributor PBB-P2 tertinggi se-DKI Jakarta (Rp 4,12 Triliun), ditopang kawasan komersial SCBD, Kuningan, TB Simatupang, dan hunian Pondok Indah.",
        komposisi: [
          { nama: "Pajak Bumi & Bangunan (PBB-P2)", nilai: "Rp 4,12 T", persen: 88, ket: "Data Fakta Insight Resmi" },
          { nama: "PBJT Makanan, Minuman & Restoran", nilai: "Rp 1,95 T", persen: 76, ket: "Simulasi Proporsi Wilayah" },
          { nama: "Pajak Kendaraan Bermotor (PKB)", nilai: "Rp 2,68 T", persen: 82, ket: "Simulasi Proporsi Wilayah" },
          { nama: "BPHTB (Perolehan Hak Tanah/Bangunan)", nilai: "Rp 2,30 T", persen: 74, ket: "Simulasi Proporsi Wilayah" }
        ]
      },
      targetRealisasiPajak: {
        statusData: "SIMULASI ESTIMASI UPPRD WILAYAH (CONTOH DATA)",
        isResmi: false,
        catatanSumber: "Pada Dashboard BPKD, realisasi Pajak Daerah dicatat terpusat pada Bapenda (Rp 37,14 T dari target Rp 49,90 T / 74,43%). Angka UPPRD wilayah ini adalah simulasi proporsional.",
        target: "Rp 13,40 T (Simulasi)",
        realisasi: "Rp 11,05 T (Simulasi)",
        capaianPersen: 82.5,
        kepatuhanWp: "88,2% (Estimasi Kepatuhan)",
        narasi: "Tingkat kepatuhan wajib pajak badan dan perorangan di Jakarta Selatan berada di atas rata-rata provinsi, didorong digitalisasi e-SPPT dan pembayaran kanal QRIS."
      },
      belanjaApbd: {
        statusData: "DATA RESMI DASHBOARD BPKD (PER 25 OKT 2026)",
        isResmi: true,
        unitSkpd: "KOTA ADMINISTRASI JAKARTA SELATAN (Unit SKPD No. 41)",
        anggaran: "Rp 1.323.684.900.442 (Rp 1,32 T)",
        realisasi: "Rp 966.705.503.358 (Rp 966,71 M)",
        serapanPersen: 73.03,
        catatanPenting: "Sesuai dokumen BPKD, angka ini adalah anggaran SKPD milik Pemerintah Kota Administrasi Jakarta Selatan, belum termasuk belanja Dinas teknis provinsi yang jatuh di wilayah ini."
      },
      programPembangunan: {
        statusData: "PROGRAM PRIORITAS WILAYAH 2026",
        isResmi: true,
        daftar: [
          { judul: "Pengendalian Banjir & Waduk Brigif", instansi: "Dinas SDA & Pemkot Jaksel", desc: "Optimalisasi embung/waduk resapan dan normalisasi saluran penghubung Kali Krukut serta Kali Mampang." },
          { judul: "Revitalisasi Trotoar & SJUT Terpadu", instansi: "Dinas Bina Marga", desc: "Penataan trotoar ramah disabilitas dan penurunan kabel udara ke bawah tanah (SJUT) di koridor Kebayoran Baru & Mampang." },
          { judul: "Integrasi Angkutan Pengumpan JakLingko", instansi: "Dinas Perhubungan", desc: "Perluasan rute Mikrotrans terintegrasi stasiun MRT Lebak Bulus, Fatmawati, Blok M, dan stasiun KRL." }
        ]
      },
      insightRekomendasi: {
        statusData: "INSIGHT CIVIC-TECH PAJAK-KITA",
        isResmi: true,
        faktaKartu: "Jakarta Selatan menyumbang PBB-P2 tertinggi (Rp 4,12 T) dengan serapan anggaran SKPD Kota mencapai 73,03% (Rp 966,71 M) per 25 Oktober 2026.",
        rekomendasi: "Optimalisasi pajak restoran/hiburan (PBJT) di kawasan kuliner Senopati, Kemang, dan Blok M dapat terus dialokasikan kembali untuk memperluas ruang terbuka hijau, sumur resapan, dan manajemen rekayasa lalu lintas."
      }
    },

    "jakarta-pusat": {
      id: "jakarta-pusat",
      nama: "Jakarta Pusat",
      jenis: "Kota Administrasi",
      kode: "KOTA ADM. JAKPUS • 8 KECAMATAN",
      warna: "#E5AD27",
      tagline: "Jantung Pemerintahan Nasional, Pusat Perhotelan & Koridor Ekonomi Sudirman–Thamrin",
      kpiUtama: {
        pajakVal: "Rp 3,45 T",
        pajakSub: "PBJT Hotel & Resto (Satu Data)",
        anggaranVal: "Rp 854,35 M",
        realisasiVal: "Rp 632,63 M",
        serapanSub: "74,05% Terserap (BPKD 2026)"
      },
      ringkasan: {
        statusData: "DATA RESMI ADMINISTRATIF & DEMOGRAFI",
        isResmi: true,
        deskripsi: "Jakarta Pusat adalah wilayah administrasi terkecil di daratan DKI Jakarta namun memiliki kepadatan aktivitas ekonomi, pusat pemerintahan, gedung perkantoran vertikal, dan perhotelan tertinggi.",
        stats: [
          { label: "Pusat Pemerintahan", val: "Tanah Abang / Petojo" },
          { label: "Cakupan Wilayah", val: "8 Kecamatan · 44 Kelurahan" },
          { label: "Luas Daratan", val: "48,13 km²" },
          { label: "Karakter Ekonomi", val: "Pemerintahan, Finansial, Hotel & Niaga" }
        ]
      },
      penerimaanPajak: {
        statusData: "DATA TERVERIFIKASI SATU DATA & SIMULASI PROPORSI",
        isResmi: false,
        catatanSumber: "Fakta unggulan Rp 3,45 T bersumber dari dataset aplikasi (Satu Data Jakarta). Rincian lainnya merupakan simulasi proporsi wilayah.",
        sorotanUtama: "Kawasan Sudirman–Thamrin dan pusat perhotelan Jakarta Pusat mendominasi realisasi PBJT Makanan, Minuman, dan Jasa Perhotelan (Rp 3,45 Triliun).",
        komposisi: [
          { nama: "PBJT Restoran & Perhotelan", nilai: "Rp 3,45 T", persen: 91, ket: "Data Fakta Insight Resmi" },
          { nama: "Pajak Bumi & Bangunan (PBB-P2)", nilai: "Rp 3,18 T", persen: 86, ket: "Simulasi Proporsi Wilayah" },
          { nama: "Pajak Reklame & Hiburan", nilai: "Rp 580 M", persen: 80, ket: "Simulasi Proporsi Wilayah" },
          { nama: "Pajak Kendaraan Bermotor (PKB)", nilai: "Rp 1,75 T", persen: 78, ket: "Simulasi Proporsi Wilayah" }
        ]
      },
      targetRealisasiPajak: {
        statusData: "SIMULASI ESTIMASI UPPRD WILAYAH (CONTOH DATA)",
        isResmi: false,
        catatanSumber: "Realisasi pajak resmi dicatat agregat se-DKI oleh Bapenda (74,43%). Data target & realisasi tingkat kota ini adalah simulasi proporsional.",
        target: "Rp 10,80 T (Simulasi)",
        realisasi: "Rp 8,96 T (Simulasi)",
        capaianPersen: 83.0,
        kepatuhanWp: "89,5% (Estimasi Kepatuhan)",
        narasi: "Kontribusi wajib pajak korporasi, perbankan, dan jaringan hotel bintang 4–5 di Jakarta Pusat menjaga kestabilan kas daerah sepanjang tahun."
      },
      belanjaApbd: {
        statusData: "DATA RESMI DASHBOARD BPKD (PER 25 OKT 2026)",
        isResmi: true,
        unitSkpd: "KOTA ADMINISTRASI JAKARTA PUSAT (Unit SKPD No. 38)",
        anggaran: "Rp 854.348.496.329 (Rp 854,35 M)",
        realisasi: "Rp 632.627.628.132 (Rp 632,63 M)",
        serapanPersen: 74.05,
        catatanPenting: "Merupakan anggaran SKPD milik Pemerintah Kota Administrasi Jakarta Pusat per 25 Oktober 2026 (Sumber: Dashboard BPKD Provinsi DKI Jakarta)."
      },
      programPembangunan: {
        statusData: "PROGRAM PRIORITAS WILAYAH 2026",
        isResmi: true,
        daftar: [
          { judul: "Pembangunan MRT Jakarta Fase 2 & Kawasan TOD", instansi: "PT MRT Jakarta & Dishub", desc: "Pengembangan jalur bawah tanah Bundaran HI – Harmoni – Kota beserta penataan ruang pedestrian terpadu." },
          { judul: "Penataan Kawasan Niaga Tanah Abang & Pasar Senen", instansi: "Pemkot Jakpus & Dinas PPKUKM", desc: "Penataan fasilitas pejalan kaki, jembatan multiguna, dan pemberdayaan sentra UMKM perdagangan grosir." },
          { judul: "Revitalisasi Puskesmas & Rumah Pompa Ciliwung", instansi: "Dinas Kesehatan & Dinas SDA", desc: "Pemeliharaan rumah pompa Pasar Ikan/Cideng serta peningkatan layanan puskesmas kelurahan 24 jam." }
        ]
      },
      insightRekomendasi: {
        statusData: "INSIGHT CIVIC-TECH PAJAK-KITA",
        isResmi: true,
        faktaKartu: "Jakarta Pusat mencatatkan realisasi belanja SKPD Kota sebesar Rp 632,63 M (74,05%) dari pagu Rp 854,35 M per 25 Oktober 2026.",
        rekomendasi: "Intensifikasi pemantauan pajak parkir dan PBJT secara elektronik di pusat perbelanjaan serta penguatan fasilitas pejalan kaki di zona rendah emisi (Low Emission Zone)."
      }
    },

    "jakarta-barat": {
      id: "jakarta-barat",
      nama: "Jakarta Barat",
      jenis: "Kota Administrasi",
      kode: "KOTA ADM. JAKBAR • 8 KECAMATAN",
      warna: "#6E1519",
      tagline: "Sentra Perdagangan Glodok–Puri Indah, Kawasan Warisan Kota Tua & Serapan SKPD Tertinggi",
      kpiUtama: {
        pajakVal: "Rp 2,85 T",
        pajakSub: "PKB & Reklame (Satu Data)",
        anggaranVal: "Rp 1,09 T",
        realisasiVal: "Rp 822,15 M",
        serapanSub: "75,18% Terserap (BPKD 2026)"
      },
      ringkasan: {
        statusData: "DATA RESMI ADMINISTRATIF & DEMOGRAFI",
        isResmi: true,
        deskripsi: "Jakarta Barat menggabungkan kawasan cagar budaya Kota Tua, pusat perdagangan elektronik dan niaga Glodok, koridor kampus Grogol, hingga pusat bisnis modern Puri Indah.",
        stats: [
          { label: "Pusat Pemerintahan", val: "Kembangan" },
          { label: "Cakupan Wilayah", val: "8 Kecamatan · 56 Kelurahan" },
          { label: "Luas Daratan", val: "124,44 km²" },
          { label: "Karakter Ekonomi", val: "Perdagangan, Jasa, Kampus & Wisata Sejarah" }
        ]
      },
      penerimaanPajak: {
        statusData: "DATA TERVERIFIKASI SATU DATA & SIMULASI PROPORSI",
        isResmi: false,
        catatanSumber: "Fakta unggulan Rp 2,85 T bersumber dari dataset aplikasi (Satu Data Jakarta). Rincian lainnya adalah simulasi proporsional.",
        sorotanUtama: "Kawasan niaga Grogol, Glodok, dan Puri Indah menjadi kontributor kuat Pajak Kendaraan Bermotor (PKB) dan Pajak Reklame sebesar Rp 2,85 Triliun.",
        komposisi: [
          { nama: "PKB & Pajak Reklame Utama", nilai: "Rp 2,85 T", persen: 84, ket: "Data Fakta Insight Resmi" },
          { nama: "Pajak Bumi & Bangunan (PBB-P2)", nilai: "Rp 2,40 T", persen: 79, ket: "Simulasi Proporsi Wilayah" },
          { nama: "BPHTB (Perolehan Hak Tanah/Bangunan)", nilai: "Rp 1,78 T", persen: 75, ket: "Simulasi Proporsi Wilayah" },
          { nama: "PBJT Makanan, Minuman & Hiburan", nilai: "Rp 1,35 T", persen: 77, ket: "Simulasi Proporsi Wilayah" }
        ]
      },
      targetRealisasiPajak: {
        statusData: "SIMULASI ESTIMASI UPPRD WILAYAH (CONTOH DATA)",
        isResmi: false,
        catatanSumber: "Pajak daerah resmi dicatat terpusat oleh Bapenda DKI Jakarta. Angka target & capaian wilayah ini adalah simulasi proporsional.",
        target: "Rp 10,45 T (Simulasi)",
        realisasi: "Rp 8,38 T (Simulasi)",
        capaianPersen: 80.2,
        kepatuhanWp: "86,1% (Estimasi Kepatuhan)",
        narasi: "Tingginya kepemilikan kendaraan niaga dan pribadi serta kepadatan pusat perbelanjaan menjadikan Jakarta Barat salah satu tulang punggung penerimaan PKB dan PBJT."
      },
      belanjaApbd: {
        statusData: "DATA RESMI DASHBOARD BPKD (PER 25 OKT 2026)",
        isResmi: true,
        unitSkpd: "KOTA ADMINISTRASI JAKARTA BARAT (Unit SKPD No. 40)",
        anggaran: "Rp 1.093.649.673.381 (Rp 1,09 T)",
        realisasi: "Rp 822.153.372.935 (Rp 822,15 M)",
        serapanPersen: 75.18,
        catatanPenting: "Mencatat persentase serapan anggaran SKPD Kota tertinggi (75,18%) di antara seluruh wilayah administrasi per 25 Oktober 2026 (Sumber: Dashboard BPKD)."
      },
      programPembangunan: {
        statusData: "PROGRAM PRIORITAS WILAYAH 2026",
        isResmi: true,
        daftar: [
          { judul: "Sistem Polder, Pompa & Tanggul Kali Angke–Pesanggrahan", instansi: "Dinas SDA", desc: "Penguatan stasiun pompa, pengerukan sedimen sungai, dan drainase mikro untuk pengendalian genangan di Cengkareng & Kalideres." },
          { judul: "Penataan Zona Rendah Emisi & Pedestrian Kota Tua", instansi: "Dinas Bina Marga & Dishub", desc: "Revitalisasi jalur pejalan kaki, integrasi halte Transjakarta dan Stasiun Jakarta Kota sebagai destinasi wisata sejarah." },
          { judul: "Peningkatan Layanan RSUD & Sekolah Net Zero", instansi: "Dinas Kesehatan & Disdik", desc: "Pengembangan fasilitas medis RSUD Cengkareng/Tamansari serta rehabilitasi gedung sekolah negeri." }
        ]
      },
      insightRekomendasi: {
        statusData: "INSIGHT CIVIC-TECH PAJAK-KITA",
        isResmi: true,
        faktaKartu: "Pemerintah Kota Administrasi Jakarta Barat berhasil menyerap Rp 822,15 M (75,18%) dari pagu Rp 1,09 T sampai 25 Oktober 2026 — persentase serapan wilayah tertinggi se-DKI.",
        rekomendasi: "Memperluas kemudahan layanan gerai Samsat keliling dan pendataan PBJT digital pada sentra kuliner malam untuk mendukung pembiayaan infrastruktur pengendali banjir barat."
      }
    },

    "jakarta-timur": {
      id: "jakarta-timur",
      nama: "Jakarta Timur",
      jenis: "Kota Administrasi",
      kode: "KOTA ADM. JAKTIM • 10 KECAMATAN",
      warna: "#A8650F",
      tagline: "Wilayah Terluas & Terpadat, Laju Wajib Pajak Tercepat (+6,2% YoY) & Pagu SKPD Terbesar",
      kpiUtama: {
        pajakVal: "+6,2% YoY",
        pajakSub: "Pertumbuhan WP Tercepat",
        anggaranVal: "Rp 1,42 T",
        realisasiVal: "Rp 1,06 T",
        serapanSub: "74,48% Terserap (BPKD 2026)"
      },
      ringkasan: {
        statusData: "DATA RESMI ADMINISTRATIF & DEMOGRAFI",
        isResmi: true,
        deskripsi: "Jakarta Timur memiliki luas daratan dan jumlah penduduk terbesar di DKI Jakarta, menjadi tumpuan kawasan industri Pulogadung, simpul transportasi LRT/Kereta Cepat Halim, dan kawasan hunian warga.",
        stats: [
          { label: "Pusat Pemerintahan", val: "Cakung" },
          { label: "Cakupan Wilayah", val: "10 Kecamatan · 65 Kelurahan" },
          { label: "Luas Daratan", val: "182,70 km² (Terluas di DKI)" },
          { label: "Karakter Ekonomi", val: "Industri, Transportasi & Permukiman Padat" }
        ]
      },
      penerimaanPajak: {
        statusData: "DATA TERVERIFIKASI SATU DATA & SIMULASI PROPORSI",
        isResmi: false,
        catatanSumber: "Pertumbuhan WP +6,2% YoY bersumber dari dataset aplikasi (Satu Data Jakarta). Angka nominal per jenis pajak adalah simulasi proporsional.",
        sorotanUtama: "Jakarta Timur mencatat laju penambahan wajib pajak baru tercepat se-DKI Jakarta (+6,2% YoY) berkat ekspansi kawasan hunian terjangkau dan konektivitas transportasi baru.",
        komposisi: [
          { nama: "Pajak Kendaraan Bermotor (PKB & BBNKB)", nilai: "Rp 3,10 T", persen: 85, ket: "Simulasi Proporsi Wilayah" },
          { nama: "Pajak Bumi & Bangunan (PBB-P2)", nilai: "Rp 2,15 T", persen: 78, ket: "Simulasi Proporsi Wilayah" },
          { nama: "BPHTB (Kawasan Hunian & TOD Baru)", nilai: "Rp 1,85 T", persen: 81, ket: "Simulasi Proporsi Wilayah" },
          { nama: "PBJT Tenaga Listrik & Industri", nilai: "Rp 1,12 T", persen: 76, ket: "Simulasi Proporsi Wilayah" }
        ]
      },
      targetRealisasiPajak: {
        statusData: "SIMULASI ESTIMASI UPPRD WILAYAH (CONTOH DATA)",
        isResmi: false,
        catatanSumber: "Realisasi pajak daerah resmi dicatat terpusat oleh Bapenda DKI Jakarta. Angka target & realisasi wilayah ini adalah simulasi proporsional.",
        target: "Rp 10,20 T (Simulasi)",
        realisasi: "Rp 8,22 T (Simulasi)",
        capaianPersen: 80.6,
        kepatuhanWp: "85,8% (+6,2% Pertumbuhan WP Baru)",
        narasi: "Basis wajib pajak kendaraan bermotor dan PBB perumahan di 10 kecamatan Jakarta Timur terus tumbuh seiring pembangunan infrastruktur timur Jakarta."
      },
      belanjaApbd: {
        statusData: "DATA RESMI DASHBOARD BPKD (PER 25 OKT 2026)",
        isResmi: true,
        unitSkpd: "KOTA ADMINISTRASI JAKARTA TIMUR (Unit SKPD No. 42)",
        anggaran: "Rp 1.416.751.495.336 (Rp 1,42 T)",
        realisasi: "Rp 1.055.161.955.212 (Rp 1,06 T)",
        serapanPersen: 74.48,
        catatanPenting: "Memiliki pagu anggaran dan nilai realisasi rupiah SKPD Kota terbesar (Rp 1,06 Triliun) di antara seluruh kota administrasi DKI Jakarta (Sumber: Dashboard BPKD)."
      },
      programPembangunan: {
        statusData: "PROGRAM PRIORITAS WILAYAH 2026",
        isResmi: true,
        daftar: [
          { judul: "Normalisasi Kali Ciliwung, Sodetan BKT & Waduk Pondok Ranggon", instansi: "Dinas SDA", desc: "Pengerukan waduk, penguatan tanggul Ciliwung–Cipinang, dan pengendalian banjir kawasan padat penduduk." },
          { judul: "Penyaluran KJP Plus & Rehabilitasi Sekolah Negeri", instansi: "Dinas Pendidikan", desc: "Menjangkau jumlah penerima manfaat siswa KJP Plus terbesar serta pembangunan sekolah ramah lingkungan." },
          { judul: "Konektivitas Angkutan Umum LRT Jabodebek & Halim", instansi: "Dinas Perhubungan", desc: "Penyediaan trayek pengumpan Transjakarta/Mikrotrans menuju stasiun LRT Ciracas, Kampung Rambutan, Cawang, dan Stasiun Halim." }
        ]
      },
      insightRekomendasi: {
        statusData: "INSIGHT CIVIC-TECH PAJAK-KITA",
        isResmi: true,
        faktaKartu: "Dengan populasi terbesar, Pemkot Jakarta Timur mengelola anggaran SKPD Kota terbesar yakni Rp 1,42 T dengan realisasi Rp 1,06 T (74,48%) per 25 Oktober 2026.",
        rekomendasi: "Pertumbuhan wajib pajak baru (+6,2% YoY) perlu diimbangi dengan pemerataan infrastruktur drainase lingkungan, puskesmas rawat inap, dan ruang terbuka ramah anak."
      }
    },

    "jakarta-utara": {
      id: "jakarta-utara",
      nama: "Jakarta Utara",
      jenis: "Kota Administrasi",
      kode: "KOTA ADM. JAKUT • 6 KECAMATAN",
      warna: "#B82025",
      tagline: "Gerbang Maritim Tanjung Priok, Logistik Internasional & Kawasan Pesisir Utara",
      kpiUtama: {
        pajakVal: "Rp 2,65 T",
        pajakSub: "BPHTB & Logistik (Satu Data)",
        anggaranVal: "Rp 865,93 M",
        realisasiVal: "Rp 645,47 M",
        serapanSub: "74,54% Terserap (BPKD 2026)"
      },
      ringkasan: {
        statusData: "DATA RESMI ADMINISTRATIF & DEMOGRAFI",
        isResmi: true,
        deskripsi: "Jakarta Utara membentang di sepanjang pesisir pantai utara dari Kamal Muara hingga Cilincing, menjadi rumah bagi pelabuhan tersibuk di Indonesia (Tanjung Priok), kawasan pergudangan, dan pengembangan kota mandiri pesisir.",
        stats: [
          { label: "Pusat Pemerintahan", val: "Tanjung Priok" },
          { label: "Cakupan Wilayah", val: "6 Kecamatan · 31 Kelurahan" },
          { label: "Luas Daratan", val: "146,66 km²" },
          { label: "Karakter Ekonomi", val: "Pelabuhan, Logistik, Industri & Pesisir" }
        ]
      },
      penerimaanPajak: {
        statusData: "DATA TERVERIFIKASI SATU DATA & SIMULASI PROPORSI",
        isResmi: false,
        catatanSumber: "Fakta unggulan Rp 2,65 T bersumber dari dataset aplikasi (Satu Data Jakarta). Rincian lainnya adalah simulasi proporsional.",
        sorotanUtama: "Aktivitas logistik pelabuhan Tanjung Priok serta pengembangan komersial Kelapa Gading, Sunter, dan PIK mendorong perolehan BPHTB & PBB-P2 sebesar Rp 2,65 Triliun.",
        komposisi: [
          { nama: "BPHTB & PBB-P2 Kawasan Pesisir/Logistik", nilai: "Rp 2,65 T", persen: 85, ket: "Data Fakta Insight Resmi" },
          { nama: "Pajak Kendaraan & Alat Berat/Niaga", nilai: "Rp 1,92 T", persen: 79, ket: "Simulasi Proporsi Wilayah" },
          { nama: "PBJT Kuliner, Hiburan & Perhotelan", nilai: "Rp 1,48 T", persen: 82, ket: "Simulasi Proporsi Wilayah" },
          { nama: "Pajak Bahan Bakar & Tenaga Listrik", nilai: "Rp 1,15 T", persen: 77, ket: "Simulasi Proporsi Wilayah" }
        ]
      },
      targetRealisasiPajak: {
        statusData: "SIMULASI ESTIMASI UPPRD WILAYAH (CONTOH DATA)",
        isResmi: false,
        catatanSumber: "Realisasi pajak daerah resmi dicatat terpusat oleh Bapenda DKI Jakarta. Angka target & realisasi wilayah ini adalah simulasi proporsional.",
        target: "Rp 8,90 T (Simulasi)",
        realisasi: "Rp 7,20 T (Simulasi)",
        capaianPersen: 80.9,
        kepatuhanWp: "85,4% (Estimasi Kepatuhan)",
        narasi: "Ekspansi properti komersial dan kuliner di pesisir utara serta aktivitas armada angkutan barang memberikan kontribusi pajak daerah yang signifikan."
      },
      belanjaApbd: {
        statusData: "DATA RESMI DASHBOARD BPKD (PER 25 OKT 2026)",
        isResmi: true,
        unitSkpd: "KOTA ADMINISTRASI JAKARTA UTARA (Unit SKPD No. 39)",
        anggaran: "Rp 865.925.043.439 (Rp 865,93 M)",
        realisasi: "Rp 645.468.365.389 (Rp 645,47 M)",
        serapanPersen: 74.54,
        catatanPenting: "Merupakan anggaran SKPD milik Pemerintah Kota Administrasi Jakarta Utara per 25 Oktober 2026 (Sumber: Dashboard BPKD Provinsi DKI Jakarta)."
      },
      programPembangunan: {
        statusData: "PROGRAM PRIORITAS WILAYAH 2026",
        isResmi: true,
        daftar: [
          { judul: "Tanggul Pengaman Pantai (NCICD) & Rumah Pompa Pluit–Ancol", instansi: "Dinas SDA", desc: "Perlindungan kawasan pesisir dari banjir rob melalui pembangunan tanggul pantai dan peningkatan kapasitas stasiun pompa." },
          { judul: "Fasilitas Pengolahan Sampah RDF Plant Rorotan", instansi: "Dinas Lingkungan Hidup", desc: "Pengolahan sampah perkotaan menjadi bahan bakar alternatif (Refuse Derived Fuel) guna mengurangi beban TPST." },
          { judul: "Perluasan Jaringan Air Bersih Perpipaan PAM Jaya", instansi: "BUMD PAM Jaya & Pemprov DKI", desc: "Penyediaan akses air bersih perpipaan bagi warga pesisir Muara Angke, Penjaringan, dan Cilincing untuk menekan pengambilan air tanah." }
        ]
      },
      insightRekomendasi: {
        statusData: "INSIGHT CIVIC-TECH PAJAK-KITA",
        isResmi: true,
        faktaKartu: "Pemkot Administrasi Jakarta Utara telah merealisasikan belanja sebesar Rp 645,47 M (74,54%) dari total pagu Rp 865,93 M hingga 25 Oktober 2026.",
        rekomendasi: "Sinergi penerimaan pajak dari kawasan komersial pesisir dan pelabuhan sangat krusial untuk membiayai infrastruktur mitigasi penurunan muka tanah, tanggul rob, dan rehabilitasi jalan logistik."
      }
    },

    "kepulauan-seribu": {
      id: "kepulauan-seribu",
      nama: "Kepulauan Seribu",
      jenis: "Kabupaten Administrasi",
      kode: "KAB. ADM. KEP. SERIBU • 2 KECAMATAN",
      warna: "#14503C",
      tagline: "Kawasan Konservasi Bahari, Pariwisata Ekologi Kepulauan & Layanan Dasar Maritim",
      kpiUtama: {
        pajakVal: "Rp 142 M",
        pajakSub: "Retribusi & Pajak Bahari",
        anggaranVal: "Rp 216,42 M",
        realisasiVal: "Rp 146,90 M",
        serapanSub: "67,88% Terserap (BPKD 2026)"
      },
      ringkasan: {
        statusData: "DATA RESMI ADMINISTRATIF & DEMOGRAFI",
        isResmi: true,
        deskripsi: "Satu-satunya kabupaten administrasi di DKI Jakarta yang terdiri dari gugusan lebih dari 110 pulau di Teluk Jakarta, berfokus pada pelestarian ekosistem laut, wisata bahari, dan perikanan berkelanjutan.",
        stats: [
          { label: "Pusat Pemerintahan", val: "Pulau Pramuka" },
          { label: "Cakupan Wilayah", val: "2 Kecamatan · 6 Kelurahan" },
          { label: "Luas Daratan Pulau", val: "10,18 km² (110+ Gugusan Pulau)" },
          { label: "Karakter Ekonomi", val: "Ekowisata Bahari, Kelautan & Konservasi" }
        ]
      },
      penerimaanPajak: {
        statusData: "DATA TERVERIFIKASI SATU DATA & SIMULASI PROPORSI",
        isResmi: false,
        catatanSumber: "Fakta unggulan Rp 142 Miliar bersumber dari dataset aplikasi (Satu Data Jakarta). Rincian di bawah merupakan simulasi proporsional wilayah kepulauan.",
        sorotanUtama: "Penerimaan pajak perhotelan/resort pulau dan retribusi wisata bahari Kepulauan Seribu tercatat sebesar Rp 142 Miliar, dikembalikan dalam bentuk subsidi layanan publik kepulauan.",
        komposisi: [
          { nama: "PBJT Perhotelan, Resort & Restoran Bahari", nilai: "Rp 82 M", persen: 78, ket: "Simulasi Proporsi Wilayah" },
          { nama: "Retribusi Wisata, Dermaga & Jasa Kepulauan", nilai: "Rp 36 M", persen: 74, ket: "Simulasi Proporsi Wilayah" },
          { nama: "PBB-P2 & BPHTB Kawasan Resort Pulau", nilai: "Rp 24 M", persen: 70, ket: "Simulasi Proporsi Wilayah" }
        ]
      },
      targetRealisasiPajak: {
        statusData: "SIMULASI ESTIMASI UPPRD WILAYAH (CONTOH DATA)",
        isResmi: false,
        catatanSumber: "Dalam prinsip keadilan fiskal APBD DKI Jakarta, wilayah kepulauan menerima alokasi belanja pembangunan yang lebih besar dibanding setoran pajaknya (subsidi silang provinsi).",
        target: "Rp 180 M (Simulasi)",
        realisasi: "Rp 142 M (Fakta Satu Data)",
        capaianPersen: 78.9,
        kepatuhanWp: "83,5% (Estimasi Kepatuhan)",
        narasi: "Fokus fiskal di Kepulauan Seribu bukan pada besaran pungutan pajak, melainkan pemerataan layanan dasar bagi warga di 11 pulau berpenghuni."
      },
      belanjaApbd: {
        statusData: "DATA RESMI DASHBOARD BPKD (PER 25 OKT 2026)",
        isResmi: true,
        unitSkpd: "KAB. ADM. KEPULAUAN SERIBU (Unit SKPD No. 43)",
        anggaran: "Rp 216.416.964.743 (Rp 216,42 M)",
        realisasi: "Rp 146.895.017.800 (Rp 146,90 M)",
        serapanPersen: 67.88,
        catatanPenting: "Merupakan anggaran SKPD milik Pemerintah Kabupaten Administrasi Kepulauan Seribu per 25 Oktober 2026 (Sumber: Dashboard BPKD Provinsi DKI Jakarta)."
      },
      programPembangunan: {
        statusData: "PROGRAM PRIORITAS WILAYAH 2026",
        isResmi: true,
        daftar: [
          { judul: "Instalasi Pengolahan Air Bersih Laut (SWRO)", instansi: "Dinas SDA & PAM Jaya", desc: "Pemeliharaan dan perluasan instalasi Sea Water Reverse Osmosis (SWRO) untuk menjamin air tawar bersih bagi warga pulau." },
          { judul: "Subsidi Kapal Dishub Antar-Pulau & Dermaga", instansi: "Dinas Perhubungan", desc: "Penyelenggaraan kapal angkut penumpang dan logistik bersubsidi dari Marina Ancol / Kali Adem menuju pulau-pulau pemukiman." },
          { judul: "RSUD Kepulauan Seribu, Kapal Ambulans & Konservasi", instansi: "Dinas Kesehatan & Dinas KPKP", desc: "Layanan medis darurat laut, rehabilitasi terumbu karang, penanaman mangrove, dan pemberdayaan nelayan." }
        ]
      },
      insightRekomendasi: {
        statusData: "INSIGHT CIVIC-TECH PAJAK-KITA",
        isResmi: true,
        faktaKartu: "Kabupaten Administrasi Kepulauan Seribu menganggarkan Rp 216,42 M pada APBD 2026 dengan realisasi Rp 146,90 M (67,88%) per 25 Oktober 2026.",
        rekomendasi: "Peningkatan konektivitas kapal reguler, pengelolaan sampah laut terpadu, dan energi surya ramah lingkungan akan memperkuat daya tarik ekowisata bahari berkelanjutan."
      }
    }
  };

  // Urutan tampilan tombol wilayah
  var ORDERED_IDS = [
    "jakarta-selatan",
    "jakarta-pusat",
    "jakarta-barat",
    "jakarta-timur",
    "jakarta-utara",
    "kepulauan-seribu"
  ];

  // State aktif: default ke Jakarta Selatan (sesuai contoh prompt)
  var selectedId = "jakarta-selatan";
  var openAccordionKeys = { "ringkasan": true, "belanjaApbd": true }; // Default buka 2 kategori penting agar informatif namun ringkas
  var mapElements = {}; // id -> { data, g, pillBtn, legendBtn }

  // =========================================================================
  // 1. FUNGSI WARNA PUDAR (Saturasi 30%, Hue Tetap - Sesuai Referensi peta-jakarta)
  // =========================================================================
  function hexKeHsl(hex) {
    var r = parseInt(hex.slice(1, 3), 16) / 255,
        g = parseInt(hex.slice(3, 5), 16) / 255,
        b = parseInt(hex.slice(5, 7), 16) / 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b), h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
      var d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h *= 60;
    }
    return [h, s, l];
  }

  function pudar(hex) {
    var hsl = hexKeHsl(hex);
    var s = hsl[1] * 0.3;                           // saturasi tinggal 30%
    var l = Math.min(hsl[2] * 0.55 + 0.33, 0.74);   // tidak pernah mendekati putih
    return "hsl(" + hsl[0].toFixed(0) + " " + (s * 100).toFixed(0) + "% " + (l * 100).toFixed(0) + "%)";
  }

  // =========================================================================
  // 2. RENDER PETA SVG DKI JAKARTA & INSET KEPULAUAN SERIBU
  // =========================================================================
  svg.setAttribute("viewBox", mapGeoData.viewBox);
  svg.innerHTML = "";

  var gKota = document.createElementNS(NS, "g");
  svg.appendChild(gKota);

  var garisSorot = document.createElementNS(NS, "path");
  garisSorot.setAttribute("id", "garis-sorot");
  svg.appendChild(garisSorot);

  // Bingkai Inset Kepulauan Seribu yang Interaktif
  var ins = mapGeoData.inset;
  var bingkai = document.createElementNS(NS, "rect");
  bingkai.setAttribute("class", "bingkai-inset");
  bingkai.setAttribute("x", ins.x);
  bingkai.setAttribute("y", ins.y);
  bingkai.setAttribute("width", ins.w);
  bingkai.setAttribute("height", ins.h);
  bingkai.setAttribute("rx", 12);
  gKota.appendChild(bingkai);

  var labelInset = document.createElementNS(NS, "text");
  labelInset.setAttribute("class", "label-inset");
  labelInset.setAttribute("x", ins.x + 14);
  labelInset.setAttribute("y", ins.y + 26);
  labelInset.innerHTML =
    '<tspan font-size="16" font-weight="700">Kepulauan Seribu</tspan>' +
    '<tspan class="kecil" x="' + (ins.x + 14) + '" dy="18">inset kepulauan (klik area ini)</tspan>';
  gKota.appendChild(labelInset);

  // Render Path 6 Wilayah
  mapGeoData.kota.forEach(function (k) {
    var g = document.createElementNS(NS, "g");
    g.setAttribute("class", "kota");
    g.setAttribute("data-wilayah-id", k.id);
    g.setAttribute("tabindex", "0");
    g.setAttribute("role", "button");
    g.setAttribute("aria-label", "Pilih wilayah " + k.nama);
    g.style.setProperty("--warna", k.warna);
    g.style.setProperty("--pudar", pudar(k.warna));

    if (k.inset) {
      var hit = document.createElementNS(NS, "rect");
      hit.setAttribute("class", "area-hit");
      hit.setAttribute("x", ins.x);
      hit.setAttribute("y", ins.y);
      hit.setAttribute("width", ins.w);
      hit.setAttribute("height", ins.h);
      hit.setAttribute("rx", 12);
      g.appendChild(hit);
    }

    var p = document.createElementNS(NS, "path");
    p.setAttribute("class", "bentuk");
    p.setAttribute("d", k.d);
    g.appendChild(p);
    gKota.appendChild(g);

    mapElements[k.id] = { data: k, g: g, path: p };

    // Interaksi Hover & PointerMove untuk Floating Tooltip
    g.addEventListener("pointerenter", function () {
      onHoverEnter(k.id, false);
    });
    g.addEventListener("pointermove", function (e) {
      onPointerMove(e);
    });
    g.addEventListener("pointerleave", function () {
      onHoverLeave();
    });
    g.addEventListener("focus", function () {
      onHoverEnter(k.id, true);
    });
    g.addEventListener("blur", function () {
      onHoverLeave();
    });

    // Interaksi Klik & Keyboard untuk memilih/melepas kunci wilayah
    g.addEventListener("click", function (e) {
      e.stopPropagation();
      if (selectedId === k.id) {
        clearWilayahSelection();
      } else {
        selectWilayah(k.id, true);
      }
    });
    g.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (selectedId === k.id) {
          clearWilayahSelection();
        } else {
          selectWilayah(k.id, true);
        }
      }
    });
  });

  // Klik area kosong pada SVG peta untuk melepas kunci pilihan wilayah
  svg.addEventListener("click", function () {
    if (selectedId !== null) {
      clearWilayahSelection();
    }
  });

  // =========================================================================
  // 3. RENDER TOMBOL PEMILIH CEPAT (QUICK PILLS) & LEGEND BAWAH PETA
  // =========================================================================
  if (quickPillsContainer) {
    quickPillsContainer.innerHTML = "";
    ORDERED_IDS.forEach(function (id) {
      var prof = WILAYAH_PROFILES[id];
      if (!prof) return;
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "peta-pill-btn";
      btn.setAttribute("role", "tab");
      btn.setAttribute("data-id", id);
      btn.style.setProperty("--warna", prof.warna);
      btn.innerHTML = '<span class="peta-pill-dot"></span><span>' + prof.nama + '</span>';

      btn.addEventListener("click", function () {
        selectWilayah(id, true);
      });
      btn.addEventListener("pointerenter", function () {
        highlightMapRegion(id);
      });
      btn.addEventListener("pointerleave", function () {
        highlightMapRegion(selectedId);
      });

      quickPillsContainer.appendChild(btn);
      if (mapElements[id]) mapElements[id].pillBtn = btn;
    });
  }

  if (legendContainer) {
    legendContainer.innerHTML = "";
    ORDERED_IDS.forEach(function (id) {
      var prof = WILAYAH_PROFILES[id];
      if (!prof) return;
      var itemBtn = document.createElement("button");
      itemBtn.type = "button";
      itemBtn.className = "peta-legend-btn";
      itemBtn.setAttribute("data-id", id);
      itemBtn.style.setProperty("--warna", prof.warna);
      itemBtn.innerHTML =
        '<i class="peta-legend-swatch"></i>' +
        '<span class="peta-legend-text">' + prof.nama + (id === "kepulauan-seribu" ? " (Inset)" : "") + '</span>';

      itemBtn.addEventListener("click", function () {
        selectWilayah(id, true);
      });
      itemBtn.addEventListener("pointerenter", function () {
        highlightMapRegion(id);
      });
      itemBtn.addEventListener("pointerleave", function () {
        highlightMapRegion(selectedId);
      });

      legendContainer.appendChild(itemBtn);
      if (mapElements[id]) mapElements[id].legendBtn = itemBtn;
    });
  }

  // =========================================================================
  // 4. LOGIKA HOVER, TOOLTIP, HIGHLIGHT PETA, DAN MASKOT ONDI
  // =========================================================================
  var ondiAnimRaf = null;

  function updateOndiPosition(regionId) {
    if (!ondiPointer || !svg) return;
    var targetId = regionId || selectedId;
    if (!targetId) return;

    var svgWrap = svg.parentElement;
    var regionEntry = mapElements[targetId];
    if (!svgWrap || !regionEntry || !regionEntry.path) return;

    var wrapRect = svgWrap.getBoundingClientRect();
    var regionRect = regionEntry.path.getBoundingClientRect();
    if (!wrapRect.width || !wrapRect.height || !regionRect.width || !regionRect.height) return;

    var isMobile = window.innerWidth <= 600;
    var heightRatio = isMobile
      ? ONDI_POINTER_CONFIG.heightRatioMobile
      : ONDI_POINTER_CONFIG.heightRatioDesktop;

    var ondiHeight = wrapRect.height * heightRatio;
    var ondiWidth = ondiHeight * ONDI_POINTER_CONFIG.aspectRatio;

    // Koordinat bounding box wilayah terpilih relatif terhadap .kartu-peta-svg-wrap
    var regionLeft = regionRect.left - wrapRect.left;
    var regionTop = regionRect.top - wrapRect.top;

    var targetCfg = ONDI_POINTER_CONFIG.regionTargets[targetId] || {
      targetBBoxXRatio: 0.8,
      targetBBoxYRatio: 0.5
    };

    // Titik pada bagian kanan wilayah yang ditunjuk ujung jari Ondi
    var targetX = regionLeft + (regionRect.width * targetCfg.targetBBoxXRatio);
    var targetY = regionTop + (regionRect.height * targetCfg.targetBBoxYRatio);

    // Hitung posisi kiri-atas Ondi agar ujung jarinya mengarah tepat ke (targetX + gapPx, targetY)
    var left = targetX + ONDI_POINTER_CONFIG.gapPx - (ondiWidth * ONDI_POINTER_CONFIG.fingerTipXRatio) + ONDI_POINTER_CONFIG.offsetX;
    var top = targetY - (ondiHeight * ONDI_POINTER_CONFIG.fingerTipYRatio) + ONDI_POINTER_CONFIG.offsetY;

    // Jaga agar Ondi tidak menutupi legenda di bawah peta (.kartu-peta-footer)
    var maxTop = wrapRect.height - ondiHeight - 4;
    if (top > maxTop) top = maxTop;
    if (top < 0) top = 0;

    // Pada layar mobile/sempit, jaga agar bagian visual Ondi tidak melewati tepi kanan kartu
    if (isMobile) {
      var maxLeftMobile = wrapRect.width - (ondiWidth * 0.82);
      if (left > maxLeftMobile) left = maxLeftMobile;
    }

    ondiPointer.style.width = ondiWidth.toFixed(1) + "px";
    ondiPointer.style.height = ondiHeight.toFixed(1) + "px";
    ondiPointer.style.left = left.toFixed(1) + "px";
    ondiPointer.style.top = top.toFixed(1) + "px";
  }

  function updateOndiVisibility(reanimate) {
    if (!ondiPointer) return;
    if (ondiAnimRaf) {
      cancelAnimationFrame(ondiAnimRaf);
      ondiAnimRaf = null;
    }

    if (selectedId && mapElements[selectedId]) {
      if (reanimate) {
        // Reset ke state awal (fade + geser kanan) tanpa transisi, lalu animasikan muncul di wilayah baru
        ondiPointer.style.transition = "none";
        ondiPointer.classList.remove("is-visible");
        updateOndiPosition(selectedId);
        void ondiPointer.offsetWidth;
        ondiPointer.style.transition = "";
        ondiAnimRaf = requestAnimationFrame(function () {
          ondiPointer.classList.add("is-visible");
          ondiAnimRaf = null;
        });
      } else {
        updateOndiPosition(selectedId);
        ondiPointer.classList.add("is-visible");
      }
    } else {
      ondiPointer.classList.remove("is-visible");
    }
  }

  function highlightMapRegion(activeRegionId) {
    var hasActiveOrSelected = Boolean(activeRegionId || selectedId);
    svg.classList.toggle("aktif", hasActiveOrSelected);

    Object.keys(mapElements).forEach(function (id) {
      var entry = mapElements[id];
      var isTarget = Boolean(activeRegionId && id === activeRegionId);
      var isSelected = Boolean(selectedId && id === selectedId);
      entry.g.classList.toggle("sorot", isTarget);
      entry.g.classList.toggle("terpilih", isSelected);
      if (entry.pillBtn) {
        entry.pillBtn.classList.toggle("is-active", isSelected);
        entry.pillBtn.setAttribute("aria-selected", String(isSelected));
      }
      if (entry.legendBtn) {
        entry.legendBtn.classList.toggle("is-active", isSelected);
      }
    });

    var targetEntry = activeRegionId ? mapElements[activeRegionId] : null;
    if (targetEntry) {
      garisSorot.setAttribute("d", targetEntry.data.d);
      bingkai.classList.toggle("inset-aktif", activeRegionId === "kepulauan-seribu");
    } else {
      garisSorot.removeAttribute("d");
      bingkai.classList.remove("inset-aktif");
    }
  }

  function onHoverEnter(id, hideTooltip) {
    highlightMapRegion(id);
    var entry = mapElements[id];
    var prof = WILAYAH_PROFILES[id];
    if (!entry || !prof) return;

    tooltip.style.borderLeftColor = entry.data.warna;
    if (hideTooltip) {
      tooltip.hidden = true;
      return;
    }
    tooltip.innerHTML =
      '<strong>' + entry.data.nama + '</strong>' +
      '<span class="peta-tooltip-sub">Belanja SKPD: ' + prof.kpiUtama.realisasiVal + ' (' + prof.belanjaApbd.serapanPersen.toFixed(1).replace(".", ",") + '%)</span>';
    tooltip.hidden = false;
  }

  function onHoverLeave() {
    tooltip.hidden = true;
    highlightMapRegion(selectedId);
  }

  function onPointerMove(e) {
    var svgWrap = svg.parentElement;
    if (!svgWrap) return;
    var kotak = svgWrap.getBoundingClientRect();
    tooltip.style.left = (e.clientX - kotak.left) + "px";
    tooltip.style.top = (e.clientY - kotak.top) + "px";
  }

  // =========================================================================
  // 5. PILIH WILAYAH & UPDATE PANEL KANAN DENGAN TRANSISI HALUS
  // =========================================================================
  function clearWilayahSelection() {
    selectedId = null;
    highlightMapRegion(null);
    updateOndiVisibility(false);
  }

  function selectWilayah(id, animateTransition) {
    if (!WILAYAH_PROFILES[id]) return;
    var isChanged = selectedId !== id;
    selectedId = id;

    highlightMapRegion(selectedId);
    updateOndiVisibility(Boolean(animateTransition));

    if (animateTransition && isChanged && infoPanel) {
      infoPanel.classList.remove("panel-fade-in");
      infoPanel.classList.add("panel-fade-out");
      setTimeout(function () {
        if (selectedId && WILAYAH_PROFILES[selectedId]) {
          renderRightPanel(WILAYAH_PROFILES[selectedId]);
        }
        infoPanel.classList.remove("panel-fade-out");
        infoPanel.classList.add("panel-fade-in");
      }, 150);
    } else {
      renderRightPanel(WILAYAH_PROFILES[selectedId]);
    }
  }

  // =========================================================================
  // 6. RENDER PANEL INFORMASI KANAN & 6 KATEGORI ACCORDION
  // =========================================================================
  function renderRightPanel(prof) {
    // 1. Update Header & KPI Strip
    var elJenis = document.getElementById("peta-panel-jenis");
    var elKode = document.getElementById("peta-panel-kode");
    var elColorBar = document.getElementById("peta-panel-color-bar");
    var elNama = document.getElementById("peta-panel-nama");
    var elTagline = document.getElementById("peta-panel-tagline");

    var elKpiPajak = document.getElementById("peta-kpi-pajak");
    var elKpiPajakSub = document.getElementById("peta-kpi-pajak-sub");
    var elKpiAnggaran = document.getElementById("peta-kpi-anggaran");
    var elKpiRealisasi = document.getElementById("peta-kpi-realisasi");
    var elKpiSerapan = document.getElementById("peta-kpi-serapan");
    var elBtnBuatKartu = document.getElementById("peta-btn-buat-kartu");

    if (elJenis) elJenis.textContent = prof.jenis.toUpperCase();
    if (elKode) elKode.textContent = prof.kode;
    if (elColorBar) elColorBar.style.backgroundColor = prof.warna;
    if (elNama) elNama.textContent = prof.nama.toUpperCase();
    if (elTagline) elTagline.textContent = prof.tagline;

    if (elKpiPajak) elKpiPajak.textContent = prof.kpiUtama.pajakVal;
    if (elKpiPajakSub) elKpiPajakSub.textContent = prof.kpiUtama.pajakSub;
    if (elKpiAnggaran) elKpiAnggaran.textContent = prof.kpiUtama.anggaranVal;
    if (elKpiRealisasi) elKpiRealisasi.textContent = prof.kpiUtama.realisasiVal;
    if (elKpiSerapan) elKpiSerapan.textContent = prof.kpiUtama.serapanSub;

    // Sinkronisasi tautan "Buat Kartu Insight Wilayah Ini" ke halaman buat-kartu.html beserta parameter wilayah
    if (elBtnBuatKartu) {
      elBtnBuatKartu.setAttribute("href", "buat-kartu.html?wilayah=" + encodeURIComponent(prof.nama));
      elBtnBuatKartu.onclick = null;
    }

    // 2. Susun 6 Kategori Accordion sesuai ketentuan
    var categories = [
      {
        key: "ringkasan",
        num: "01",
        title: "Ringkasan Wilayah",
        subtitle: prof.ringkasan.stats[1].val,
        badge: prof.ringkasan.statusData,
        isOfficial: prof.ringkasan.isResmi,
        contentHtml: buildRingkasanHtml(prof)
      },
      {
        key: "penerimaanPajak",
        num: "02",
        title: "Penerimaan Pajak Daerah",
        subtitle: "Kontributor utama: " + prof.kpiUtama.pajakVal,
        badge: prof.penerimaanPajak.statusData,
        isOfficial: prof.penerimaanPajak.isResmi,
        contentHtml: buildPenerimaanPajakHtml(prof)
      },
      {
        key: "targetRealisasiPajak",
        num: "03",
        title: "Target dan Realisasi Pajak",
        subtitle: "Capaian simulasi " + prof.targetRealisasiPajak.capaianPersen.toFixed(1).replace(".", ",") + "%",
        badge: prof.targetRealisasiPajak.statusData,
        isOfficial: prof.targetRealisasiPajak.isResmi,
        contentHtml: buildTargetRealisasiPajakHtml(prof)
      },
      {
        key: "belanjaApbd",
        num: "04",
        title: "Belanja APBD",
        subtitle: "Realisasi SKPD: " + prof.kpiUtama.realisasiVal + " (" + prof.belanjaApbd.serapanPersen.toFixed(2).replace(".", ",") + "%)",
        badge: prof.belanjaApbd.statusData,
        isOfficial: prof.belanjaApbd.isResmi,
        contentHtml: buildBelanjaApbdHtml(prof)
      },
      {
        key: "programPembangunan",
        num: "05",
        title: "Program Pembangunan",
        subtitle: prof.programPembangunan.daftar.length + " Fokus Program Prioritas",
        badge: prof.programPembangunan.statusData,
        isOfficial: prof.programPembangunan.isResmi,
        contentHtml: buildProgramPembangunanHtml(prof)
      },
      {
        key: "insightRekomendasi",
        num: "06",
        title: "Insight dan Rekomendasi",
        subtitle: "Fakta kunci & rekomendasi kebijakan",
        badge: prof.insightRekomendasi.statusData,
        isOfficial: prof.insightRekomendasi.isResmi,
        contentHtml: buildInsightRekomendasiHtml(prof)
      }
    ];

    accordionContainer.innerHTML = categories.map(function (cat) {
      var isOpen = Boolean(openAccordionKeys[cat.key]);
      return (
        '<div class="peta-acc-item ' + (isOpen ? 'is-open' : '') + '" data-acc-key="' + cat.key + '">' +
          '<button type="button" class="peta-acc-trigger" aria-expanded="' + String(isOpen) + '">' +
            '<div class="peta-acc-trigger-left">' +
              '<span class="peta-acc-num">' + cat.num + '</span>' +
              '<div class="peta-acc-headings">' +
                '<span class="peta-acc-title">' + cat.title + '</span>' +
                '<span class="peta-acc-summary">' + cat.subtitle + '</span>' +
              '</div>' +
            '</div>' +
            '<span class="peta-acc-chevron" aria-hidden="true">' +
              '<svg width="16" height="16" viewBox="0 0 24 24" fill="none">' +
                '<path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>' +
              '</svg>' +
            '</span>' +
          '</button>' +
          '<div class="peta-acc-body" ' + (isOpen ? '' : 'hidden') + '>' +
            '<div class="peta-acc-source-tag ' + (cat.isOfficial ? 'tag-resmi' : 'tag-simulasi') + '">' +
              '<span class="source-dot"></span>' +
              '<span>' + cat.badge + '</span>' +
            '</div>' +
            cat.contentHtml +
          '</div>' +
        '</div>'
      );
    }).join("");

    // Pasang event listener klik pada setiap header accordion
    accordionContainer.querySelectorAll(".peta-acc-trigger").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var parentItem = btn.closest(".peta-acc-item");
        if (!parentItem) return;
        var key = parentItem.getAttribute("data-acc-key");
        var body = parentItem.querySelector(".peta-acc-body");
        var currentlyOpen = parentItem.classList.contains("is-open");
        var nextOpen = !currentlyOpen;

        openAccordionKeys[key] = nextOpen;
        parentItem.classList.toggle("is-open", nextOpen);
        btn.setAttribute("aria-expanded", String(nextOpen));
        if (body) body.hidden = !nextOpen;
      });
    });
  }

  // =========================================================================
  // 7. BUILDER HTML UNTUK 6 KATEGORI ACCORDION
  // =========================================================================
  function buildRingkasanHtml(prof) {
    var r = prof.ringkasan;
    var statsHtml = r.stats.map(function (st) {
      return (
        '<div class="peta-stat-cell">' +
          '<span class="peta-stat-lbl">' + st.label + '</span>' +
          '<strong class="peta-stat-val">' + st.val + '</strong>' +
        '</div>'
      );
    }).join("");

    return (
      '<p class="peta-acc-text">' + r.deskripsi + '</p>' +
      '<div class="peta-stats-grid">' + statsHtml + '</div>'
    );
  }

  function buildPenerimaanPajakHtml(prof) {
    var p = prof.penerimaanPajak;
    var barsHtml = p.komposisi.map(function (item) {
      return (
        '<div class="peta-bar-row">' +
          '<div class="peta-bar-head">' +
            '<span class="peta-bar-name">' + item.nama + '</span>' +
            '<strong class="peta-bar-val">' + item.nilai + '</strong>' +
          '</div>' +
          '<div class="peta-bar-track">' +
            '<div class="peta-bar-fill" style="width: ' + item.persen + '%; background-color: ' + prof.warna + ';"></div>' +
          '</div>' +
          '<span class="peta-bar-note">' + item.ket + '</span>' +
        '</div>'
      );
    }).join("");

    return (
      '<p class="peta-acc-text">' + p.sorotanUtama + '</p>' +
      '<div class="peta-bars-list">' + barsHtml + '</div>' +
      '<p class="peta-acc-disclaimer">* ' + p.catatanSumber + '</p>'
    );
  }

  function buildTargetRealisasiPajakHtml(prof) {
    var tr = prof.targetRealisasiPajak;
    return (
      '<div class="peta-tr-box">' +
        '<div class="peta-tr-metrics">' +
          '<div>' +
            '<span class="peta-stat-lbl">Target Pajak Wilayah</span>' +
            '<strong class="peta-stat-val">' + tr.target + '</strong>' +
          '</div>' +
          '<div>' +
            '<span class="peta-stat-lbl">Realisasi Terkumpul</span>' +
            '<strong class="peta-stat-val text-primary">' + tr.realisasi + '</strong>' +
          '</div>' +
          '<div>' +
            '<span class="peta-stat-lbl">Rasio Kepatuhan WP</span>' +
            '<strong class="peta-stat-val text-success">' + tr.kepatuhanWp + '</strong>' +
          '</div>' +
        '</div>' +
        '<div class="peta-bar-head" style="margin-top: 10px;">' +
          '<span class="peta-bar-name">Progres Capaian terhadap Target Wilayah</span>' +
          '<strong class="peta-bar-val">' + tr.capaianPersen.toFixed(1).replace(".", ",") + '%</strong>' +
        '</div>' +
        '<div class="peta-bar-track">' +
          '<div class="peta-bar-fill" style="width: ' + Math.min(tr.capaianPersen, 100) + '%;"></div>' +
        '</div>' +
      '</div>' +
      '<p class="peta-acc-text" style="margin-top: 10px;">' + tr.narasi + '</p>' +
      '<p class="peta-acc-disclaimer">* ' + tr.catatanSumber + '</p>'
    );
  }

  function buildBelanjaApbdHtml(prof) {
    var b = prof.belanjaApbd;
    return (
      '<div class="peta-tr-box">' +
        '<div class="peta-unit-label">' + b.unitSkpd + '</div>' +
        '<div class="peta-tr-metrics peta-tr-2col">' +
          '<div>' +
            '<span class="peta-stat-lbl">Anggaran Penetapan APBD 2026</span>' +
            '<strong class="peta-stat-val">' + b.anggaran + '</strong>' +
          '</div>' +
          '<div>' +
            '<span class="peta-stat-lbl">Realisasi s.d. 25 Okt 2026</span>' +
            '<strong class="peta-stat-val text-success">' + b.realisasi + '</strong>' +
          '</div>' +
        '</div>' +
        '<div class="peta-bar-head" style="margin-top: 10px;">' +
          '<span class="peta-bar-name">Tingkat Penyerapan Anggaran SKPD Wilayah</span>' +
          '<strong class="peta-bar-val">' + b.serapanPersen.toFixed(2).replace(".", ",") + '%</strong>' +
        '</div>' +
        '<div class="peta-bar-track">' +
          '<div class="peta-bar-fill fill-green" style="width: ' + Math.min(b.serapanPersen, 100) + '%;"></div>' +
        '</div>' +
      '</div>' +
      '<p class="peta-acc-disclaimer" style="margin-top: 8px;">ⓘ ' + b.catatanPenting + '</p>'
    );
  }

  function buildProgramPembangunanHtml(prof) {
    var progHtml = prof.programPembangunan.daftar.map(function (pr, idx) {
      return (
        '<div class="peta-prog-item">' +
          '<span class="peta-prog-idx">0' + (idx + 1) + '</span>' +
          '<div class="peta-prog-body">' +
            '<div class="peta-prog-head">' +
              '<strong class="peta-prog-title">' + pr.judul + '</strong>' +
              '<span class="peta-prog-agency">' + pr.instansi + '</span>' +
            '</div>' +
            '<p class="peta-prog-desc">' + pr.desc + '</p>' +
          '</div>' +
        '</div>'
      );
    }).join("");

    return '<div class="peta-prog-list">' + progHtml + '</div>';
  }

  function buildInsightRekomendasiHtml(prof) {
    var ir = prof.insightRekomendasi;
    return (
      '<div class="peta-insight-callout">' +
        '<div class="peta-insight-block">' +
          '<span class="peta-insight-tag">FAKTA KUNCI WILAYAH</span>' +
          '<p class="peta-acc-text">' + ir.faktaKartu + '</p>' +
        '</div>' +
        '<div class="peta-insight-block" style="margin-top: 10px;">' +
          '<span class="peta-insight-tag tag-rekom">REKOMENDASI ALOKASI & KEBIJAKAN</span>' +
          '<p class="peta-acc-text">' + ir.rekomendasi + '</p>' +
        '</div>' +
      '</div>'
    );
  }

  // Sinkronisasi ulang posisi Ondi saat ukuran layar atau kontainer peta berubah
  window.addEventListener("resize", function () {
    if (selectedId) {
      updateOndiPosition(selectedId);
    }
  });

  if (typeof ResizeObserver !== "undefined" && svg.parentElement) {
    var mapResizeObserver = new ResizeObserver(function () {
      if (selectedId) {
        updateOndiPosition(selectedId);
      }
    });
    mapResizeObserver.observe(svg.parentElement);
  }

  // Inisialisasi tampilan awal ke Jakarta Selatan
  selectWilayah(selectedId, false);
})();
