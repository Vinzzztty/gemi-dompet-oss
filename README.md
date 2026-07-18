<h1 align="center">Gemi Dompet</h1>
<h6 align="center">Aplikasi manajemen keuangan pribadi untuk mencatat, memahami, dan membagikan pengeluaran.</h6>

<p align="center">
  <img src="https://github.com/Vinzzztty/gemi-dompet-oss/actions/workflows/ci.yml/badge.svg?branch=main" alt="CI" />
  <img src="https://img.shields.io/github/languages/top/Vinzzztty/gemi-dompet-oss" alt="language" />
  <img src="https://img.shields.io/github/languages/code-size/Vinzzztty/gemi-dompet-oss" alt="size" />
  <img src="https://img.shields.io/github/last-commit/Vinzzztty/gemi-dompet-oss" alt="last commit" />
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs welcome" />
</p>

## Tentang

Gemi Dompet adalah aplikasi web untuk mengelola keuangan pribadi dalam satu tempat. Catat pemasukan dan pengeluaran, kelola beberapa dompet, pantau tagihan berulang, lihat laporan, serta hitung pembagian biaya bersama teman atau grup.

## Fitur

- **Multi-dompet** — kelola saldo bank, e-wallet, dan tunai.
- **Transaksi & kategori** — catat pemasukan, pengeluaran, dan transfer antar-dompet.
- **Laporan keuangan** — ringkasan saldo, perbandingan bulanan, dan pengeluaran per kategori.
- **Tagihan** — kelola tagihan dan seri tagihan berulang beserta pengingatnya.
- **Split bill & talangan grup** — buat sesi berbagi biaya, tambahkan peserta, dan lihat rekomendasi pelunasan.
- **Akun & keamanan** — autentikasi berbasis cookie, reset password, dan validasi saldo dompet.

## Teknologi

- [Next.js](https://nextjs.org/) 15 dan React 19
- TypeScript dan Tailwind CSS
- Prisma dan PostgreSQL
- Radix UI, Lucide, dan Font Awesome

## Menjalankan Secara Lokal

### Prasyarat

- Node.js 18 atau lebih baru
- npm
- PostgreSQL

### Instalasi

```bash
git clone https://github.com/Vinzzztty/gemi-dompet-oss.git
cd gemi-dompet-oss
npm ci
cp .env.example .env.local
```

Isi `.env.local` dengan koneksi PostgreSQL dan secret lokal Anda. Jangan pernah commit file environment.

```bash
npx prisma migrate dev
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

### Environment variables

| Variable | Kegunaan |
| --- | --- |
| `DATABASE_URL` | Connection string PostgreSQL. |
| `JWT_SECRET` | Secret acak minimal 32 karakter untuk menandatangani sesi. |
| `RESEND_API_KEY` | API key Resend untuk email reset password. |
| `RESEND_FROM_EMAIL` | Alamat email pengirim yang sudah diverifikasi. |
| `NEXT_PUBLIC_APP_URL` | URL publik aplikasi, digunakan pada tautan reset password. |

## Perintah Pengembangan

```bash
npm run dev       # Jalankan server development
npm test          # Jalankan unit test
npm run build     # Buat dan validasi production build
npm run start     # Jalankan production build
npx prisma studio # Buka Prisma Studio
```

`npm ci` akan menjalankan `prisma generate` secara otomatis. Setelah mengubah skema, jalankan migrasi Prisma yang sesuai dan sertakan perubahan migration dalam pull request.

## Berkontribusi

Kontribusi sangat diterima. Baca [CONTRIBUTING.md](./CONTRIBUTING.md) untuk alur kerja, standar pull request, dan perintah verifikasi. Laporkan kerentanan melalui [SECURITY.md](./SECURITY.md), bukan melalui public issue.

## Status Keamanan

Sebelum deployment, gunakan secret baru untuk database, Resend, dan JWT. Untuk detail konfigurasi dan checklist rilis, baca [Open-Source Release Checklist](./docs/OPEN_SOURCE_RELEASE.md).
