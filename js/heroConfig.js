/**
 * paJAK-Kita — Hero Slideshow Configuration
 * File: js/heroConfig.js
 *
 * Mengatur daftar gambar latar belakang hero slideshow, posisi fokus gambar,
 * dan durasi transisi agar mudah diatur tanpa mengubah komponen inti.
 */

export const HERO_SLIDES = [
  {
    src: 'public/assets/hero-1-monas.jpg',
    objectPosition: '50% 35%',
    label: 'Monumen Nasional Jakarta',
  },
  {
    src: 'public/assets/hero-2-sudirman-kaca.jpg',
    objectPosition: '50% 50%',
    label: 'Gedung Kaca Sudirman Jakarta',
  },
  {
    src: 'public/assets/hero-3-skyline-malam.jpg',
    objectPosition: '50% 40%',
    label: 'Cakrawala Malam Jakarta',
  },
  {
    src: 'public/assets/hero-4-jalan-sudirman.jpg',
    objectPosition: '50% 60%',
    label: 'Koridor Jalan Sudirman Jakarta',
  },
  {
    src: 'public/assets/hero-5-jpo-senja.jpg',
    objectPosition: '50% 50%',
    label: 'JPO Sudirman Senja Jakarta',
  },
];

export const HERO_SETTINGS = {
  slideDuration: 6000, // 6 detik per gambar
  fadeDuration: 1200,  // 1200ms crossfade ease-in-out
  kenBurnsScaleStart: 1.06,
  kenBurnsScaleEnd: 1.0,
};
