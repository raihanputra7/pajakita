/**
 * paJAK-Kita — Generator Fakta Kartu Insight (Sisi Build)
 * File: scripts/generate-insight-facts.js
 *
 * Menghasilkan fakta berkalimat tetap dari berkas data resmi (tanpa AI),
 * lengkap dengan kueri sumber, penanda basis, dan catatan keterbatasan wilayah.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  formatRupiahRingkas,
  formatPersen,
  formatTanggalIndonesia,
} from '../js/format.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const realisasiPath = path.join(rootDir, 'public/data/pajak-kita-data-realisasi.json');
const rawRealisasi = JSON.parse(fs.readFileSync(realisasiPath, 'utf-8'));

const tglDataFormatted = formatTanggalIndonesia(rawRealisasi.meta.tanggal_data);
const tglDataStr = rawRealisasi.meta.tanggal_data;

const facts = [];

// 1. Fakta Berskala Seluruh DKI Jakarta
const totBelanja = rawRealisasi.realisasi_per_akun.total_halaman.jumlah_belanja;
const totBelanjaPct = (totBelanja.realisasi / totBelanja.anggaran) * 100;

facts.push({
  id: 'ins-jkt-belanja-total',
  wilayah: 'Seluruh DKI Jakarta',
  cakupan: 'jakarta',
  judul: 'Total Belanja APBD Jakarta',
  nilai: `${formatRupiahRingkas(totBelanja.realisasi)} (${formatPersen(totBelanjaPct)})`,
  keterangan: `Pemerintah Provinsi DKI Jakarta menganggarkan total belanja ${formatRupiahRingkas(totBelanja.anggaran)} pada APBD 2026. Sampai ${tglDataFormatted}, realisasi belanja telah mencapai ${formatRupiahRingkas(totBelanja.realisasi)} (${formatPersen(totBelanjaPct)}).`,
  kueri_sumber: 'realisasi_per_akun.total_halaman.jumlah_belanja',
  sumber: 'Dashboard BPKD Provinsi DKI Jakarta',
  tahun: 2026,
  tanggal_data: tglDataStr,
});

// Pajak Daerah
const akunPajak = rawRealisasi.realisasi_per_akun.pendapatan.find((p) => p.kode === '4.1.01');
if (akunPajak) {
  const pajakPct = (akunPajak.realisasi / akunPajak.anggaran) * 100;
  facts.push({
    id: 'ins-jkt-pajak-realisasi',
    wilayah: 'Seluruh DKI Jakarta',
    cakupan: 'jakarta',
    judul: 'Realisasi Pajak Daerah Jakarta',
    nilai: `${formatRupiahRingkas(akunPajak.realisasi)} (${formatPersen(pajakPct)})`,
    keterangan: `Dari target Pajak Daerah sebesar ${formatRupiahRingkas(akunPajak.anggaran)} pada APBD 2026, kas daerah telah menerima ${formatRupiahRingkas(akunPajak.realisasi)} (${formatPersen(pajakPct)}) per ${tglDataFormatted}.`,
    kueri_sumber: "realisasi_per_akun.pendapatan[kode='4.1.01']",
    sumber: 'Dashboard BPKD Provinsi DKI Jakarta',
    tahun: 2026,
    tanggal_data: tglDataStr,
  });
}

// Belanja Operasi
const belanjaOperasi = rawRealisasi.realisasi_per_akun.total_halaman.jumlah_belanja_operasi;
if (belanjaOperasi) {
  const operasiPct = (belanjaOperasi.realisasi / belanjaOperasi.anggaran) * 100;
  facts.push({
    id: 'ins-jkt-belanja-operasi',
    wilayah: 'Seluruh DKI Jakarta',
    cakupan: 'jakarta',
    judul: 'Belanja Operasi Layanan Publik',
    nilai: `${formatRupiahRingkas(belanjaOperasi.realisasi)} (${formatPersen(operasiPct)})`,
    keterangan: `Belanja operasi layanan publik (pegawai, barang jasa, bansos, hibah) ditargetkan ${formatRupiahRingkas(belanjaOperasi.anggaran)}, dan telah terealisasi ${formatRupiahRingkas(belanjaOperasi.realisasi)} (${formatPersen(operasiPct)}) per ${tglDataFormatted}.`,
    kueri_sumber: 'realisasi_per_akun.total_halaman.jumlah_belanja_operasi',
    sumber: 'Dashboard BPKD Provinsi DKI Jakarta',
    tahun: 2026,
    tanggal_data: tglDataStr,
  });
}

// Belanja Modal
const belanjaModal = rawRealisasi.realisasi_per_akun.belanja.find((b) => b.kode === '5.2');
if (belanjaModal) {
  const modalPct = (belanjaModal.realisasi / belanjaModal.anggaran) * 100;
  facts.push({
    id: 'ins-jkt-belanja-modal',
    wilayah: 'Seluruh DKI Jakarta',
    cakupan: 'jakarta',
    judul: 'Belanja Modal Infrastruktur',
    nilai: `${formatRupiahRingkas(belanjaModal.realisasi)} (${formatPersen(modalPct)})`,
    keterangan: `Alokasi belanja modal infrastruktur fisik dianggarkan ${formatRupiahRingkas(belanjaModal.anggaran)} secara agregat, dengan realisasi per ${tglDataFormatted} sebesar ${formatRupiahRingkas(belanjaModal.realisasi)} (${formatPersen(modalPct)}).`,
    kueri_sumber: "realisasi_per_akun.belanja[kode='5.2']",
    sumber: 'Dashboard BPKD Provinsi DKI Jakarta',
    tahun: 2026,
    tanggal_data: tglDataStr,
  });
}

// Dinas Pendidikan
const dinasPendidikan = rawRealisasi.realisasi_per_skpd.data.find((u) => u.no === 1);
if (dinasPendidikan) {
  const dikPct = (dinasPendidikan.belanja.realisasi / dinasPendidikan.belanja.anggaran) * 100;
  facts.push({
    id: 'ins-jkt-skpd-pendidikan',
    wilayah: 'Seluruh DKI Jakarta',
    cakupan: 'jakarta',
    judul: 'Belanja Dinas Pendidikan',
    nilai: `${formatRupiahRingkas(dinasPendidikan.belanja.realisasi)} (${formatPersen(dikPct)})`,
    keterangan: `Dinas Pendidikan memiliki alokasi belanja terbesar di antara seluruh SKPD DKI Jakarta (${formatRupiahRingkas(dinasPendidikan.belanja.anggaran)}), dengan realisasi belanja sebesar ${formatRupiahRingkas(dinasPendidikan.belanja.realisasi)} (${formatPersen(dikPct)}) per ${tglDataFormatted}.`,
    kueri_sumber: 'realisasi_per_skpd.data[no=1].belanja',
    sumber: 'Dashboard BPKD Provinsi DKI Jakarta',
    tahun: 2026,
    tanggal_data: tglDataStr,
  });
}

// 2. Fakta Wilayah Kota Administrasi & Kabupaten Kepulauan Seribu
const wilayahUnits = rawRealisasi.realisasi_per_skpd.data.filter((u) => u.wilayah !== null);

for (const unit of wilayahUnits) {
  const ang = unit.belanja.anggaran;
  const real = unit.belanja.realisasi;
  const serapanPct = (real / ang) * 100;
  const slug = unit.wilayah.toLowerCase().replace(/\s+/g, '-');

  facts.push({
    id: `ins-wilayah-${slug}`,
    wilayah: unit.wilayah,
    cakupan: 'wilayah',
    judul: `Belanja ${unit.nama_pendek}`,
    nilai: `${formatRupiahRingkas(real)} (${formatPersen(serapanPct)})`,
    keterangan: `Pemerintah ${unit.nama_pendek} menganggarkan ${formatRupiahRingkas(ang)} belanja pada 2026. Sampai ${tglDataFormatted}, ${formatRupiahRingkas(real)} (${formatPersen(serapanPct)}) telah terealisasi. (Catatan: Angka ini adalah anggaran SKPD milik pemerintah kota/kabupaten administrasi tersebut, bukan seluruh belanja di wilayah tersebut).`,
    kueri_sumber: `realisasi_per_skpd.data[wilayah='${unit.wilayah}'].belanja`,
    sumber: 'Dashboard BPKD Provinsi DKI Jakarta',
    tahun: 2026,
    tanggal_data: tglDataStr,
  });
}

const outputPath = path.join(rootDir, 'public/data/insight-facts.json');
fs.writeFileSync(outputPath, JSON.stringify(facts, null, 2), 'utf-8');

console.log(`[generate-insight-facts] Berhasil membuat ${facts.length} fakta insight ke ${outputPath}`);
