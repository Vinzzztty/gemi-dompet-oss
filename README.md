# Gemi Dompet

Aplikasi manajemen keuangan pribadi yang modern dan mudah digunakan untuk membantu Anda mengelola pendapatan, pengeluaran, dan dompet Anda.

![Gemi Dompet Dashboard](public/metadata/preview.png)

## Fitur

Aplikasi ini menyediakan berbagai fitur untuk mempermudah pencatatan keuangan Anda:

### 1. Manajemen Dompet
Kelola berbagai sumber dana Anda dengan mudah:
- 💳 **Multi-Dompet**: Tambahkan dan kelola banyak dompet (Bank, E-Wallet, Tunai, dll)
- 📊 **Saldo Real-time**: Pantau saldo terkini dari setiap dompet
- 📝 **Riwayat Transaksi**: Lihat riwayat transaksi spesifik untuk setiap dompet

### 2. Pencatatan Transaksi
Catat setiap pemasukan dan pengeluaran dengan detail:
- 💸 **Pemasukan & Pengeluaran**: Form input yang mudah untuk mencatat transaksi
- 🏷️ **Kategori Kustom**: Kategorikan transaksi Anda (Makan, Transportasi, Gaji, dll)
- 📅 **Filter Tanggal**: Filter transaksi berdasarkan periode waktu tertentu

### 3. Laporan & Analisis
Dapatkan wawasan mendalam tentang keuangan Anda:
- 📈 **Visualisasi Data**: Grafik interaktif untuk memvisualisasikan arus kas
- 📋 **Laporan Detail**: Ringkasan pemasukan dan pengeluaran per kategori
- 💡 **Pemantauan Budget**: Bantu Anda tetap dalam jalur anggaran

## Prasyarat

- [Node.js](https://nodejs.org/) (versi 18 atau lebih baru)
- [PostgreSQL](https://www.postgresql.org/) database
- [npm](https://www.npmjs.com/) atau package manager lainnya

## Instalasi

Ikuti langkah-langkah berikut untuk menjalankan proyek ini di mesin lokal Anda:

1.  **Clone repositori ini**
    ```bash
    git clone https://github.com/username/gemi-dompet.git
    cd gemi-dompet
    ```

2.  **Instal dependensi**
    ```bash
    npm install
    ```

3.  **Konfigurasi Environment Variable**
    Salin file `.env.example` menjadi `.env` dan sesuaikan dengan konfigurasi database Anda:
    ```bash
    cp .env.example .env
    ```
    Isi `DATABASE_URL` dengan koneksi string PostgreSQL Anda.

4.  **Jalankan Migrasi Database**
    Siapkan database dengan menjalankan migrasi Prisma:
    ```bash
    npx prisma migrate dev
    ```

5.  **Jalankan Aplikasi**
    Mulai server pengembangan:
    ```bash
    npm run dev
    ```
    Buka [http://localhost:3000](http://localhost:3000) di browser Anda.

## Pengembangan

Perintah-perintah berikut tersedia untuk pengembangan:

```bash
# Instal dependensi
npm install

# Jalankan server development
npm run dev

# Build untuk produksi
npm run build

# Jalankan migrasi database
npx prisma migrate dev

# Buka Prisma Studio (GUI Database)
npx prisma studio
```

## Teknologi

Dibuat dengan teknologi web modern:
- **Next.js 15** - Framework React
- **Tailwind CSS** - Styling
- **Prisma** - ORM Database
- **PostgreSQL** - Database
- **Lucide React** - Ikon
- **Radix UI** - Komponen UI
