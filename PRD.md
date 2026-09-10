# Product Requirements Document (PRD)
## Sistem Booking Lapangan Olahraga

**Tanggal**: September 2026  
**Versi**: 1.0  
**Status**: Draft  

---

## 📋 Daftar Isi
1. [Gambaran Umum](#gambaran-umum)
2. [Target User](#target-user)
3. [Fitur Utama](#fitur-utama)
4. [Spesifikasi Teknis](#spesifikasi-teknis)
5. [User Stories & Use Cases](#user-stories--use-cases)
6. [Role & Permission](#role--permission)
7. [Sistem Pembayaran](#sistem-pembayaran)
8. [Notifikasi](#notifikasi)
9. [Business Rules](#business-rules)
10. [Timeline Implementasi](#timeline-implementasi)

---

## 🎯 Gambaran Umum

Sistem booking lapangan olahraga adalah platform digital yang memungkinkan pengguna untuk menyewa lapangan olahraga secara online dengan proses pembayaran yang sederhana dan transparan. Sistem ini terbagi menjadi 3 role utama dengan fitur-fitur yang disesuaikan dengan kebutuhan masing-masing.

### Tujuan Utama:
- Memudahkan pengguna dalam menyewa lapangan olahraga
- Mengotomatisasi proses booking dan validasi pembayaran
- Memberikan visibilitas real-time kepada admin tentang status booking
- Meningkatkan transparansi dengan notifikasi otomatis

---

## 👥 Target User

### 1. **Superadmin (Owner)**
- Pemilik fasilitas lapangan olahraga
- Mengelola keseluruhan sistem
- Mengatur konfigurasi platform

### 2. **Admin (Kasir/Admin Lapangan)**
- Kasir atau admin di lokasi lapangan
- Memvalidasi pembayaran
- Mengelola jadwal dan ketersediaan lapangan

### 3. **User (Penyewa)**
- Pengguna umum yang ingin menyewa lapangan
- Melakukan booking dan pembayaran
- Menerima notifikasi

---

## ✨ Fitur Utama

### A. Manajemen Lapangan (Superadmin & Admin)

#### 1. Data Lapangan
- [x] Tambah/Edit/Hapus lapangan
- [x] Informasi lapangan: nama, deskripsi, foto, harga per jam
- [x] Kategori lapangan (futsal, badminton, basket, dll)
- [x] Kapasitas dan fasilitas
- [x] Jam operasional lapangan
- [x] Status aktif/tidak aktif

#### 2. Jam Booking
- [x] Slot waktu per lapangan (misal: 08:00-09:00, 09:00-10:00)
- [x] Durasi booking fleksibel
- [x] Atur jam buka-tutup
- [x] Blackout dates (tanggal tutup)

#### 3. Manajemen Harga
- [x] Harga berdasarkan jam (normal, prime time)
- [x] Diskon periode tertentu
- [x] Harga khusus untuk member

---

### B. Sistem Booking (User)

#### 1. Pencarian & Pemilihan
- [x] Cari lapangan berdasarkan kategori/lokasi
- [x] Filter harga, rating, fasilitas
- [x] Lihat ketersediaan lapangan
- [x] Melihat foto dan detail lapangan

#### 2. Pemesanan
- [x] Pilih tanggal dan jam
- [x] Peringatan: tidak boleh booking lebih dari 2 hari sebelum bermain
  - Booking hanya untuk hari ini, besok, dan lusa saja
- [x] Lihat total harga
- [x] Input data tambahan (nama, nomor telepon, catatan khusus)
- [x] Konfirmasi booking

#### 3. Riwayat Booking
- [x] Lihat semua booking (upcoming, completed, cancelled)
- [x] Detail booking dan status pembayaran
- [x] Opsi cancel booking (dengan syarat)
- [x] Rating & review lapangan

---

### C. Sistem Pembayaran

#### 1. Metode Pembayaran
- [x] **Cash**: Pembayaran langsung ke kasir
- [x] **Transfer Bank**: Pengguna transfer ke rekening yang ditunjuk

#### 2. Validasi Pembayaran
- [x] **Kode Validasi Dinamis**: 
  - Setiap invoice memiliki kode unik
  - Contoh: Harga Rp 25.000 → Kode bayar Rp 25.145 (3 digit unik)
  - Admin memvalidasi berdasarkan kode ini
  
- [x] **Alur Validasi**:
  1. User membuat booking
  2. Sistem generate invoice dengan kode bayar
  3. User melakukan pembayaran (cash/transfer)
  4. Admin menerima notifikasi pembayaran pending
  5. Admin verifikasi kode (untuk transfer, masukkan kode dari bukti transfer)
  6. Pembayaran validated ✓

#### 3. Rekening Bank
- [x] Superadmin dapat menambah/edit/hapus rekening bank
- [x] Tampilkan rekening bank aktif di booking form
- [x] Informasi: nama bank, nomor rekening, atas nama

#### 4. Invoice & Bukti Pembayaran
- [x] Generate invoice otomatis
- [x] Invoice berisi: detail lapangan, jam, harga, kode bayar
- [x] Bukti pembayaran setelah validated
- [x] Export invoice (PDF)

---

### D. Admin Dashboard

#### 1. Dashboard Overview
- [x] Total booking hari ini
- [x] Total revenue
- [x] Booking pending validation
- [x] Lapangan dengan booking terbanyak
- [x] Chart revenue per hari/minggu/bulan

#### 2. Manajemen Booking
- [x] Daftar semua booking
- [x] Filter: status, tanggal, lapangan
- [x] Detail booking
- [x] Tombol validasi pembayaran
- [x] Lihat input kode validasi pembayaran dari user
- [x] Approve/Reject pembayaran dengan alasan

#### 3. Laporan
- [x] Laporan revenue harian/mingguan/bulanan
- [x] Laporan booking dan occupancy rate
- [x] Laporan pembayaran
- [x] Export data (CSV/Excel)

---

### E. Superadmin Dashboard

#### 1. Dashboard Statistik
- [x] Total revenue seluruh lapangan
- [x] Total booking
- [x] Growth metrics
- [x] Performance lapangan

#### 2. Manajemen Admin
- [x] Tambah/edit/hapus admin
- [x] Assign admin ke lapangan
- [x] Lihat activity log admin

#### 3. Manajemen Lapangan
- [x] CRUD lapangan (lengkap)
- [x] Manajemen kategori lapangan
- [x] Manajemen fasilitas

#### 4. Konfigurasi Sistem
- [x] Manajemen rekening bank
- [x] Pengaturan jam operasional global
- [x] Pengaturan pembatasan booking (2 hari)
- [x] Manajemen diskon/promo

#### 5. Audit & Log
- [x] Activity log semua user
- [x] Log pembayaran
- [x] Backup data

---

### F. Sistem Notifikasi

#### 1. Email Notification
- [x] Notifikasi booking berhasil dibuat
- [x] Notifikasi reminder pembayaran (24 jam sebelum jam main)
- [x] Notifikasi pembayaran sudah divalidasi
- [x] Notifikasi pembayaran ditolak dengan alasan
- [x] Notifikasi booking akan dimulai (1 jam sebelum)
- [x] Invoice dikirim via email

#### 2. In-App Notification
- [x] Notifikasi status booking
- [x] Notifikasi pembayaran pending validation
- [x] Notifikasi pembayaran approved/rejected
- [x] Notifikasi reminder booking
- [x] Notifikasi update dari admin
- [x] Badge counter notifikasi

#### 3. Template Email
- Email welcome
- Email konfirmasi booking
- Email reminder pembayaran
- Email konfirmasi pembayaran
- Email rejection pembayaran
- Email reminder 1 jam sebelum bermain

---

## 🔧 Spesifikasi Teknis

### Tech Stack
- **Backend**: Laravel 11
- **Frontend**: React dengan Inertia.js
- **Database**: MySQL/PostgreSQL
- **Storage**: Laravel Storage (local/S3)
- **Authentication**: Laravel Sanctum
- **Email**: SMTP (Mailtrap dev, production menggunakan provider)

### Requirement Teknis
- PHP 8.2+
- Node.js 18+
- Composer
- npm/yarn

### Infrastruktur
- Web Server: Nginx/Apache
- Database Server: MySQL 8.0+
- File Storage: Local storage (development), S3/MinIO (production)
- Email Service: SMTP provider

---

## 📖 User Stories & Use Cases

### User Story 1: User melakukan booking

**As a** User  
**I want to** Menyewa lapangan olahraga dengan mudah  
**So that** Saya dapat bermain di waktu yang saya inginkan

**Acceptance Criteria:**
- User dapat melihat lapangan yang tersedia
- User hanya bisa booking untuk 3 hari ke depan (hari ini, besok, lusa)
- Sistem menampilkan harga total dengan jelas
- Booking berhasil dibuat dan dapat dilihat di riwayat

---

### User Story 2: User melakukan pembayaran

**As a** User  
**I want to** Membayar booking dengan metode cash atau transfer bank  
**So that** Booking saya dapat divalidasi oleh admin

**Acceptance Criteria:**
- User dapat memilih metode pembayaran
- Untuk transfer, sistem menampilkan rekening bank
- Invoice digenerate dengan kode validasi
- User dapat input kode pembayaran (untuk transfer) atau langsung ke kasir (cash)
- Email konfirmasi dikirim

---

### User Story 3: Admin validasi pembayaran

**As an** Admin  
**I want to** Memvalidasi pembayaran yang masuk  
**So that** Booking dapat dikonfirmasi dan user bisa bermain

**Acceptance Criteria:**
- Admin melihat daftar booking dengan status pembayaran pending
- Admin dapat menerima atau menolak pembayaran
- Admin dapat melihat bukti transfer/catatan pembayaran
- Notifikasi dikirim ke user setelah validasi
- Status booking berubah menjadi confirmed/cancelled

---

### User Story 4: Superadmin mengelola system

**As a** Superadmin  
**I want to** Mengelola seluruh aspek sistem  
**So that** Platform berjalan optimal dan menghasilkan revenue

**Acceptance Criteria:**
- Superadmin dapat CRUD lapangan, admin, rekening bank
- Superadmin dapat melihat statistik dan laporan
- Superadmin dapat mengatur konfigurasi sistem
- Activity log tercatat lengkap

---

## 👮 Role & Permission

### Superadmin (Owner)
```
✓ Dashboard & Reporting
  - View all statistics
  - View all revenue
  - Export reports
  
✓ Lapangan Management
  - Create, Read, Update, Delete lapangan
  - Manage lapangan categories
  - Manage fasilitas
  - Set availability
  
✓ Admin Management
  - Create, Read, Update, Delete admin
  - Assign admin ke lapangan
  - View admin activity
  
✓ Sistem Configuration
  - Manage bank accounts
  - Set booking restriction rules
  - Manage promotions
  - System settings
  
✓ Audit
  - View activity logs
  - View payment logs
  - Backup data
```

### Admin (Kasir/Admin Lapangan)
```
✓ Booking Management
  - View bookings
  - View booking details
  - Cannot edit/delete booking
  
✓ Payment Validation
  - View pending payments
  - Validate/reject payments
  - View payment history
  
✓ Dashboard
  - View today's bookings
  - View today's revenue
  - View payment status
  
✗ Cannot:
  - Manage lapangan
  - Manage admin
  - Manage bank accounts
  - Access other fields' data
```

### User (Penyewa)
```
✓ Booking
  - View available lapangan
  - Search & filter lapangan
  - Create booking
  - View booking history
  - Cancel booking (dengan syarat)
  - Rate & review
  
✓ Payment
  - View invoice
  - Input pembayaran
  - Download invoice
  
✓ Notifikasi
  - View in-app notifications
  - View email notifications
  
✗ Cannot:
  - Edit booking yang sudah dibuat
  - Akses admin features
```

---

## 💳 Sistem Pembayaran

### Alur Pembayaran - Cash

```
1. User membuat booking
   ↓
2. Sistem generate invoice dengan kode validasi
   ↓
3. User datang ke lokasi dan bayar cash ke kasir (admin)
   ↓
4. Admin input/verifikasi pembayaran langsung di sistem
   ↓
5. Sistem approved payment → Notifikasi ke user
   ↓
6. Booking confirmed ✓
```

### Alur Pembayaran - Transfer Bank

```
1. User membuat booking
   ↓
2. Sistem generate invoice dengan:
   - Nomor rekening tujuan
   - Harga + kode validasi (misal 25.145)
   ↓
3. User transfer dengan amount = harga + kode validasi
   ↓
4. User input kode validasi di aplikasi (input manual)
   ↓
5. Admin menerima notifikasi → verifikasi
   ↓
6. Admin approve payment → Notifikasi ke user
   ↓
7. Booking confirmed ✓
```

### Kode Validasi

**Konsep:**
- Harga dasar: Rp 25.000
- Kode validasi: 3 digit random (000-999)
- Total bayar: 25.000 + kode (misal 25.145)

**Implementasi:**
```javascript
// Contoh di backend
function generateValidationCode() {
  return Math.floor(Math.random() * 1000); // 0-999
}

const basePrice = 25000;
const validationCode = generateValidationCode(); // misal 145
const totalPrice = basePrice + validationCode; // 25145

// Invoice: "Bayar Rp 25.145 (base: Rp 25.000 + kode: 145)"
```

### Invoice Details

Setiap invoice harus menampilkan:
- Invoice number (unique)
- Lapangan name
- Tanggal & jam booking
- Durasi
- Harga dasar
- Kode validasi (jika transfer bank)
- Total harga
- Status pembayaran
- Instruksi pembayaran
- QR Code (opsional, untuk payment link)

---

## 📬 Notifikasi

### Email Notifications

#### 1. Booking Confirmation
```
Subjek: Konfirmasi Booking Lapangan Anda - INV-xxx

Halo [User Name],

Booking Anda telah berhasil dibuat!

Detail Booking:
- Lapangan: [Lapangan Name]
- Tanggal: [Date]
- Jam: [Time]
- Durasi: [Duration]
- Total Harga: Rp [Price]
- Status: Menunggu Pembayaran

Silakan lakukan pembayaran sebelum [Payment Deadline]

[Action Button: Lihat Invoice & Pembayaran]

Terima kasih,
Admin
```

#### 2. Payment Reminder (24 jam sebelum jam main)
```
Subjek: Pengingat Pembayaran - [Lapangan Name]

Halo [User Name],

Booking Anda akan dimulai dalam 24 jam tetapi pembayaran belum divalidasi.

[Action Button: Proses Pembayaran Sekarang]

Jika sudah membayar, abaikan email ini.
```

#### 3. Payment Approved
```
Subjek: Pembayaran Berhasil - [Lapangan Name]

Halo [User Name],

Pembayaran Anda telah divalidasi!

Detail Booking:
- Lapangan: [Lapangan Name]
- Tanggal: [Date]
- Jam: [Time]
- Total Harga: Rp [Price]
- Status: CONFIRMED ✓

[Action Button: Lihat Booking Details]

Terima kasih, sampai jumpa!
```

#### 4. Payment Rejected
```
Subjek: Pembayaran Ditolak - [Lapangan Name]

Halo [User Name],

Sayangnya, pembayaran Anda tidak dapat divalidasi.

Alasan: [Rejection Reason]

Detail Booking:
- Lapangan: [Lapangan Name]
- Tanggal: [Date]
- Jam: [Time]

[Action Button: Hubungi Admin / Coba Lagi]

Silakan hubungi admin untuk informasi lebih lanjut.
```

#### 5. Reminder 1 Jam Sebelum Bermain
```
Subjek: Pengingat - Bermain dalam 1 jam! 🎾

Halo [User Name],

Booking Anda akan dimulai dalam 1 jam!

- Lapangan: [Lapangan Name]
- Jam: [Time]
- Alamat: [Address]

Jangan sampai telat! 😊
```

### In-App Notifications

**Type & Priority:**

| Event | Type | Priority | Action |
|-------|------|----------|--------|
| Booking created | Info | Medium | View booking |
| Payment pending | Alert | High | Process payment |
| Payment approved | Success | Medium | View details |
| Payment rejected | Error | High | Retry/Contact admin |
| Booking reminder | Warning | Medium | View booking |
| Admin message | Alert | High | View message |

**Notification Center:**
- Tampilkan notifikasi terbaru di atas
- Mark as read functionality
- Filter by type
- Delete old notifications
- Badge counter untuk unread

---

## 📏 Business Rules

### Booking Rules

1. **Batasan Waktu Booking**
   - User hanya bisa booking untuk 3 hari ke depan (hari ini, besok, lusa)
   - Tidak bisa booking mundur ke hari sebelumnya
   - Contoh: Jika hari Senin, bisa booking: Senin, Selasa, Rabu (jam yang belum lewat untuk Senin)

2. **Slot Availability**
   - Setiap slot lapangan hanya bisa di-booking oleh 1 user
   - Jika sudah di-booking, slot tidak tersedia untuk user lain
   - Pembatalan membuat slot tersedia kembali

3. **Multiple Booking**
   - User dapat booking multiple slots sekaligus untuk lanjutan (misal 08:00-09:00 + 09:00-10:00)
   - User dapat memiliki multiple booking di hari berbeda

4. **Cancellation**
   - Booking bisa dibatalkan sampai 24 jam sebelum jam bermain
   - Setelah 24 jam, tidak bisa dibatalkan (kecuali admin)
   - Refund untuk pembayaran yang sudah divalidasi: policy sesuai T&C

### Payment Rules

1. **Validation Code**
   - Kode validasi unik per invoice
   - Kode random 3 digit (0-999)
   - Total bayar = harga dasar + kode
   - Contoh: Rp 25.000 + 145 = Rp 25.145

2. **Payment Deadline**
   - Pembayaran harus dilakukan sebelum jam main
   - Jika belum dibayar sebelum jam main, booking otomatis dibatalkan
   - Notifikasi pengingat dikirim 24 jam sebelum

3. **Payment Status**
   - **Pending**: Booking dibuat, menunggu pembayaran
   - **Pending Validation**: Pembayaran sudah diterima, menunggu validasi admin
   - **Approved**: Pembayaran sudah divalidasi, booking confirmed
   - **Rejected**: Pembayaran ditolak, user bisa retry atau cancel booking
   - **Cancelled**: Booking dibatalkan, refund sesuai policy

### Admin Rules

1. **Assignment**
   - Setiap admin di-assign ke 1 atau lebih lapangan
   - Admin hanya bisa melihat booking di lapangan yang di-assign
   - Admin tidak bisa edit data lapangan (hanya superadmin)

2. **Validation**
   - Admin hanya bisa approve/reject pembayaran
   - Harus memberikan reason jika reject
   - Tidak bisa edit invoice atau harga
   - Activity log terekam untuk setiap action

### Superadmin Rules

1. **Account Security**
   - Superadmin adalah owner, hanya 1 superadmin
   - Password harus complex (minimum 12 karakter)
   - Enable 2FA recommended

2. **Data Access**
   - Superadmin dapat akses semua data
   - Setiap action dicatat di audit log
   - Backup data dilakukan otomatis

---

## 📅 Timeline Implementasi

### Phase 1: Core Features (2-3 minggu)
- [ ] Setup project structure (Laravel + Inertia + React)
- [ ] Database schema & migrations
- [ ] Authentication & Authorization
- [ ] User registration & login
- [ ] Lapangan CRUD
- [ ] Basic booking system
- [ ] Payment validation (basic)

### Phase 2: Notifikasi & Enhancement (2 minggu)
- [ ] Email notification system
- [ ] In-app notification system
- [ ] Invoice generation
- [ ] Admin dashboard
- [ ] Laporan dasar

### Phase 3: Testing & Deployment (1 minggu)
- [ ] Unit testing
- [ ] Integration testing
- [ ] UAT
- [ ] Performance optimization
- [ ] Security audit
- [ ] Deploy to production

### Phase 4: Post-Launch (ongoing)
- [ ] Bug fixes & improvements
- [ ] Additional features (analytics, advanced reports)
- [ ] User support & training
- [ ] Monitoring & maintenance

---

## 📊 Metric & KPI

### User Metrics
- Total users registered
- Active users (daily/monthly)
- Conversion rate (booking completion)
- Average booking per user per month

### Business Metrics
- Total revenue
- Average booking value
- Payment success rate
- Cancellation rate
- Peak hours & lapangan usage

### System Metrics
- Page load time
- API response time
- Uptime percentage (99.9%)
- Error rate

---

## 🔒 Security & Privacy

### Data Protection
- HTTPS/TLS untuk semua komunikasi
- Password hashing (bcrypt)
- SQL injection prevention
- XSS protection
- CSRF tokens

### Privacy
- Privacy policy yang jelas
- GDPR compliance (jika diperlukan)
- Data encryption for sensitive info
- User data retention policy

### Authentication
- Login dengan email & password
- Session management
- Auto-logout setelah inactivity
- 2FA untuk superadmin (recommended)

---

## 📋 Glossary

| Term | Definition |
|------|-----------|
| Lapangan | Fasilitas olahraga yang dapat di-booking |
| Slot | Durasi waktu tertentu di lapangan (misal 08:00-09:00) |
| Booking | Reservasi slot lapangan oleh user |
| Invoice | Dokumen pembayaran dengan detail booking |
| Validation Code | Kode unik 3 digit untuk verifikasi pembayaran |
| Occupancy Rate | Persentase slot yang ter-booking dari total slot |
| Revenue | Total uang yang diterima dari pembayaran |

---

## 📞 Support & Contact

Untuk pertanyaan atau bantuan:
- Email: support@sportbooking.local
- Phone: [nomor telepon]
- Documentation: [link docs]

---

**End of PRD Document**
