<?php

namespace Database\Seeders;

use App\Models\ActivityLog;
use App\Models\BankAccount;
use App\Models\Booking;
use App\Models\Category;
use App\Models\Facility;
use App\Models\Lapangan;
use App\Models\Review;
use App\Models\User;
use App\Models\WhatsappContact;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Superadmin User
        $superadmin = User::firstOrCreate(
            ['email' => 'superadmin@gmail.com'],
            [
                'name' => 'Budi Hartono (Owner)',
                'password' => Hash::make('password'),
                'role' => 'superadmin',
                'phone' => '081234567890',
                'email_verified_at' => now(),
            ]
        );

        // Also update existing dev users if any to superadmin so the developer can access all roles
        User::whereIn('email', ['jaguardeva@gmail.com', 'jaguardeva54@gmail.com'])->update([
            'role' => 'superadmin',
        ]);

        // 2. Admin Lapangan
        $adminFutsal = User::firstOrCreate(
            ['email' => 'admin.futsal@gmail.com'],
            [
                'name' => 'Rian Pratama (Kasir Futsal)',
                'password' => Hash::make('password'),
                'role' => 'admin',
                'phone' => '081234567891',
                'email_verified_at' => now(),
            ]
        );

        $adminBadminton = User::firstOrCreate(
            ['email' => 'admin.badminton@gmail.com'],
            [
                'name' => 'Siti Rahma (Kasir Badminton)',
                'password' => Hash::make('password'),
                'role' => 'admin',
                'phone' => '081234567892',
                'email_verified_at' => now(),
            ]
        );

        // 3. Regular Customer User
        $customer = User::firstOrCreate(
            ['email' => 'user@gmail.com'],
            [
                'name' => 'Dimas Anggara',
                'password' => Hash::make('password'),
                'role' => 'user',
                'phone' => '081234567893',
                'email_verified_at' => now(),
            ]
        );

        // 4. Categories
        $categoriesData = [
            [
                'name' => 'Futsal',
                'slug' => 'futsal',
                'icon' => 'Flame',
                'description' => 'Lapangan futsal vinyl dan rumput sintetis standar inter',
            ],
            [
                'name' => 'Badminton',
                'slug' => 'badminton',
                'icon' => 'Target',
                'description' => 'Karpet badminton standar BWF dengan pencahayaan anti-silau',
            ],
            [
                'name' => 'Mini Soccer',
                'slug' => 'mini-soccer',
                'icon' => 'Trophy',
                'description' => 'Lapangan mini soccer 7 vs 7 dengan rumput sintetis lembut',
            ],
            [
                'name' => 'Basket',
                'slug' => 'basket',
                'icon' => 'Dribbble',
                'description' => 'Lapangan basket indoor lantai kayu hardwood dan outdoor interlocking',
            ],
            [
                'name' => 'Tenis',
                'slug' => 'tenis',
                'icon' => 'Zap',
                'description' => 'Lapangan tenis hardcourt dan clay berkualitas tinggi',
            ],
        ];

        $categories = [];
        foreach ($categoriesData as $data) {
            $categories[$data['slug']] = Category::firstOrCreate(['slug' => $data['slug']], $data);
        }

        // 5. Facilities
        $facilitiesData = [
            ['name' => 'WiFi High-Speed', 'icon' => 'Wifi'],
            ['name' => 'Ruang Ganti & Locker', 'icon' => 'Lock'],
            ['name' => 'Shower Air Hangat', 'icon' => 'Droplets'],
            ['name' => 'Toilet Bersih', 'icon' => 'Sparkles'],
            ['name' => 'Parkir Luas & Aman', 'icon' => 'Car'],
            ['name' => 'Kantin & Cafe', 'icon' => 'Coffee'],
            ['name' => 'Musholla Nyaman', 'icon' => 'Home'],
            ['name' => 'Tribun Penonton', 'icon' => 'Users'],
        ];

        $facilities = [];
        foreach ($facilitiesData as $data) {
            $facilities[$data['name']] = Facility::firstOrCreate(['name' => $data['name']], $data);
        }

        // 6. Lapangans
        $lapanganFutsal = Lapangan::firstOrCreate(
            ['slug' => 'arena-futsal-vinyl-pro'],
            [
                'category_id' => $categories['futsal']->id,
                'name' => 'Arena Futsal Vinyl Pro Court A',
                'description' => 'Lapangan futsal berstandar nasional dengan lantai vinyl impor tebal 8mm yang empuk dan mengurangi resiko cedera lutut. Dilengkapi sistem pencahayaan LED 500 Lux yang terang merata.',
                'price_per_hour' => 150000,
                'operational_start' => '08:00',
                'operational_end' => '23:00',
                'slot_duration_minutes' => 60,
                'images' => [
                    'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1000&q=80',
                    'https://images.unsplash.com/photo-1518604666860-9ed391f76460?auto=format&fit=crop&w=1000&q=80',
                ],
                'is_active' => true,
            ]
        );
        $lapanganFutsal->facilities()->sync([
            $facilities['WiFi High-Speed']->id,
            $facilities['Ruang Ganti & Locker']->id,
            $facilities['Shower Air Hangat']->id,
            $facilities['Parkir Luas & Aman']->id,
            $facilities['Kantin & Cafe']->id,
            $facilities['Musholla Nyaman']->id,
        ]);
        $lapanganFutsal->assignedAdmins()->sync([$adminFutsal->id]);

        $lapanganBadminton = Lapangan::firstOrCreate(
            ['slug' => 'grand-badminton-hall-court-1'],
            [
                'category_id' => $categories['badminton']->id,
                'name' => 'Grand Badminton Hall Court 1',
                'description' => 'Karpet badminton vinyl hijau berstandar BWF resmi. Sirkulasi udara sejuk dengan exhaust fan berkekuatan tinggi serta lampu samping anti-silau untuk kenyamanan smash.',
                'price_per_hour' => 85000,
                'operational_start' => '07:00',
                'operational_end' => '23:00',
                'slot_duration_minutes' => 60,
                'images' => [
                    'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=1000&q=80',
                    'https://images.unsplash.com/photo-1613918431703-aa503e9fdfcf?auto=format&fit=crop&w=1000&q=80',
                ],
                'is_active' => true,
            ]
        );
        $lapanganBadminton->facilities()->sync([
            $facilities['WiFi High-Speed']->id,
            $facilities['Ruang Ganti & Locker']->id,
            $facilities['Toilet Bersih']->id,
            $facilities['Parkir Luas & Aman']->id,
            $facilities['Kantin & Cafe']->id,
        ]);
        $lapanganBadminton->assignedAdmins()->sync([$adminBadminton->id]);

        $lapanganMiniSoccer = Lapangan::firstOrCreate(
            ['slug' => 'champions-mini-soccer-turf'],
            [
                'category_id' => $categories['mini-soccer']->id,
                'name' => 'Champions Mini Soccer Turf',
                'description' => 'Lapangan 7 vs 7 dengan rumput sintetis monofilament terbaru dan rubber crumb ramah lingkungan. Dilengkapi tiang gawang busa pengaman dan jaring keliling setinggi 8 meter.',
                'price_per_hour' => 350000,
                'operational_start' => '06:00',
                'operational_end' => '23:00',
                'slot_duration_minutes' => 60,
                'images' => [
                    'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&w=1000&q=80',
                    'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1000&q=80',
                ],
                'is_active' => true,
            ]
        );
        $lapanganMiniSoccer->facilities()->sync([
            $facilities['WiFi High-Speed']->id,
            $facilities['Ruang Ganti & Locker']->id,
            $facilities['Shower Air Hangat']->id,
            $facilities['Toilet Bersih']->id,
            $facilities['Parkir Luas & Aman']->id,
            $facilities['Tribun Penonton']->id,
            $facilities['Musholla Nyaman']->id,
        ]);
        $lapanganMiniSoccer->assignedAdmins()->sync([$adminFutsal->id]);

        $lapanganBasket = Lapangan::firstOrCreate(
            ['slug' => 'elite-indoor-basketball-court'],
            [
                'category_id' => $categories['basket']->id,
                'name' => 'Elite Indoor Basketball Court',
                'description' => 'Lantai kayu Maple kualitas NBA dengan ring hidrolik fleksibel dan papan pantul tempered glass. Full AC dan sound system terintegrasi.',
                'price_per_hour' => 200000,
                'operational_start' => '08:00',
                'operational_end' => '22:00',
                'slot_duration_minutes' => 60,
                'images' => [
                    'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1000&q=80',
                ],
                'is_active' => true,
            ]
        );
        $lapanganBasket->facilities()->sync([
            $facilities['WiFi High-Speed']->id,
            $facilities['Ruang Ganti & Locker']->id,
            $facilities['Shower Air Hangat']->id,
            $facilities['Parkir Luas & Aman']->id,
            $facilities['Tribun Penonton']->id,
        ]);

        // 7. Bank Accounts
        BankAccount::firstOrCreate(
            ['account_number' => '8830192841'],
            [
                'bank_name' => 'BCA',
                'account_name' => 'PT ARENA OLAHRAGA INDONESIA',
                'is_active' => true,
            ]
        );

        BankAccount::firstOrCreate(
            ['account_number' => '1370019284712'],
            [
                'bank_name' => 'Bank Mandiri',
                'account_name' => 'PT ARENA OLAHRAGA INDONESIA',
                'is_active' => true,
            ]
        );

        BankAccount::firstOrCreate(
            ['account_number' => '020601002938501'],
            [
                'bank_name' => 'BRI',
                'account_name' => 'PT ARENA OLAHRAGA INDONESIA',
                'is_active' => true,
            ]
        );

        // 8. Default WhatsApp Contacts
        WhatsappContact::firstOrCreate(
            ['phone' => '6281234567890'],
            [
                'name' => 'Customer Service',
                'description' => 'Bantuan booking dan informasi lapangan',
                'is_active' => true,
                'sort_order' => 1,
            ]
        );

        WhatsappContact::firstOrCreate(
            ['phone' => '6281234567891'],
            [
                'name' => 'Support Booking',
                'description' => 'Bantuan pembayaran dan perubahan jadwal',
                'is_active' => true,
                'sort_order' => 2,
            ]
        );

        // 9. Sample Bookings
        $tomorrow = Carbon::tomorrow()->format('Y-m-d');
        $sampleValidationCode = 145;
        $booking1 = Booking::firstOrCreate(
            ['booking_code' => 'BKG-'.date('Ymd').'-A101'],
            [
                'user_id' => $customer->id,
                'lapangan_id' => $lapanganFutsal->id,
                'booking_date' => $tomorrow,
                'start_time' => '19:00',
                'end_time' => '21:00',
                'duration_hours' => 2,
                'base_price' => 300000,
                'validation_code' => $sampleValidationCode,
                'total_price' => 300000 + $sampleValidationCode,
                'payment_method' => 'transfer',
                'payment_status' => 'approved',
                'customer_name' => 'Dimas Anggara',
                'customer_phone' => '081234567893',
                'notes' => 'Tolong sediakan bola futsal 2 buah',
                'user_submitted_code' => $sampleValidationCode,
                'validated_by' => $adminFutsal->id,
                'validated_at' => now(),
                'payment_deadline' => Carbon::parse($tomorrow.' 19:00'),
            ]
        );

        // Sample pending validation booking
        $dayAfterTomorrow = Carbon::tomorrow()->addDay()->format('Y-m-d');
        $valCodePending = 237;
        Booking::firstOrCreate(
            ['booking_code' => 'BKG-'.date('Ymd').'-P202'],
            [
                'user_id' => $customer->id,
                'lapangan_id' => $lapanganBadminton->id,
                'booking_date' => $dayAfterTomorrow,
                'start_time' => '16:00',
                'end_time' => '18:00',
                'duration_hours' => 2,
                'base_price' => 170000,
                'validation_code' => $valCodePending,
                'total_price' => 170000 + $valCodePending,
                'payment_method' => 'transfer',
                'payment_status' => 'pending_validation',
                'customer_name' => 'Dimas Anggara',
                'customer_phone' => '081234567893',
                'notes' => 'Sewa raket 2 pcs jika ada',
                'user_submitted_code' => $valCodePending,
                'payment_deadline' => Carbon::parse($dayAfterTomorrow.' 16:00'),
            ]
        );

        // 10. Sample Review
        Review::firstOrCreate(
            ['booking_id' => $booking1->id],
            [
                'lapangan_id' => $lapanganFutsal->id,
                'user_id' => $customer->id,
                'rating' => 5,
                'comment' => 'Lantai vinyl nya sangat nyaman, penerangan oke sekali dan kamar mandi bersih!',
            ]
        );

        // 11. Activity Log
        ActivityLog::log(
            'system_init',
            'Inisialisasi sistem booking lapangan dan seeding data dasar',
            ['seeded' => true],
            $superadmin
        );

        // DM: Superadmin ↔ Admin Futsal
    }
}
