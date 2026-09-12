# SportBooking

Aplikasi booking lapangan olahraga berbasis Laravel, Inertia.js, React, dan Tailwind CSS. Aplikasi ini menyediakan autentikasi pengguna, booking lapangan, notifikasi email, dashboard admin, serta widget kontak WhatsApp yang dapat dikelola superadmin.

## Persyaratan

- PHP 8.3 atau lebih baru
- Composer 2
- Node.js 20 atau lebih baru dan npm
- PostgreSQL 14 atau lebih baru
- Ekstensi PHP yang dibutuhkan Laravel, termasuk `pdo_pgsql`, `mbstring`, `openssl`, `fileinfo`, dan `bcmath`

## Instalasi lokal

Clone repository lalu masuk ke direktorinya:

```bash
git clone <URL_REPOSITORY>
cd belajarlaravelnotification
```

Siapkan environment:

```bash
cp .env.example .env
composer install
php artisan key:generate
```

Buat database PostgreSQL sesuai nilai `DB_DATABASE`, `DB_USERNAME`, dan `DB_PASSWORD` di `.env`, kemudian jalankan migrasi:

```bash
php artisan migrate
```

Pasang dependensi frontend dan buat asset:

```bash
npm install
npm run build
```

Untuk development, jalankan server Laravel, queue, dan Vite secara bersamaan:

```bash
composer run dev
```

Aplikasi tersedia di `http://localhost:8000` secara default.

> Alternatif: `composer run setup` menjalankan instalasi Composer, membuat `.env`, menghasilkan app key, migrasi, instalasi npm, dan build frontend secara otomatis. Pastikan konfigurasi database sudah benar sebelum menjalankannya.

## Konfigurasi environment penting

| Variabel | Keterangan |
| --- | --- |
| `APP_URL` | URL utama aplikasi. Digunakan untuk link verifikasi email. |
| `APP_KEY` | Kunci enkripsi Laravel; jangan dibagikan. |
| `DB_*` | Koneksi PostgreSQL. |
| `MAIL_*` | SMTP untuk pengiriman verifikasi email dan notifikasi. |
| `QUEUE_CONNECTION` | Default `database`; queue perlu diproses oleh worker. |
| `VITE_APP_NAME` | Nama aplikasi yang dibaca frontend. |

Jangan commit file `.env` karena dapat berisi kredensial database dan SMTP. Gunakan `.env.example` sebagai template konfigurasi baru.

## Akun dan fitur admin

- User biasa dapat melakukan booking dan menggunakan widget kontak WhatsApp.
- Admin mengelola operasional aplikasi melalui `/admin`.
- Superadmin mengelola nomor kontak WhatsApp melalui `/admin/whatsapp-contacts`.
- Kontak WhatsApp aktif ditampilkan otomatis pada widget publik.

Fitur chat realtime dan Laravel Reverb sudah tidak digunakan dalam versi ini, sehingga tidak perlu menjalankan `php artisan reverb:start`.

## Pengujian dan pemeriksaan kode

```bash
php artisan test --compact
npm run types:check
npm run check
```

## Deployment production

Set `APP_ENV=production`, `APP_DEBUG=false`, dan `APP_URL` ke domain production di environment server. Setelah kode tersedia, jalankan:

```bash
composer install --no-dev --optimize-autoloader
npm ci
npm run build
php artisan migrate --force
php artisan storage:link
php artisan optimize
```

Jika queue digunakan, jalankan worker dengan Supervisor, systemd, atau process manager lain:

```bash
php artisan queue:work --sleep=3 --tries=3
```

Setelah deployment berikutnya, restart worker agar memuat kode terbaru:

```bash
php artisan queue:restart
```

Aplikasi production harus dilayani oleh Nginx/Apache melalui PHP-FPM. Jangan menggunakan `php artisan serve` sebagai web server production.
