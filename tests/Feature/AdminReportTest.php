<?php

use App\Models\Booking;
use App\Models\Category;
use App\Models\Lapangan;
use App\Models\User;
use Carbon\Carbon;

beforeEach(function () {
    $category = Category::create(['name' => 'Laporan Test', 'slug' => 'laporan-test']);
    $this->lapangan = Lapangan::create([
        'category_id' => $category->id,
        'name' => 'Lapangan Laporan',
        'slug' => 'lapangan-laporan',
        'price_per_hour' => 100000,
        'operational_start' => '07:00',
        'operational_end' => '23:00',
        'slot_duration_minutes' => 60,
        'is_active' => true,
    ]);
    $this->admin = User::factory()->create(['role' => 'superadmin']);
});

function reportBooking(Lapangan $lapangan, array $attributes): Booking
{
    return Booking::create(array_merge([
        'booking_code' => 'RPT-'.fake()->unique()->numerify('#####'),
        'lapangan_id' => $lapangan->id,
        'booking_date' => Carbon::today()->subDays(2),
        'start_time' => '10:00',
        'end_time' => '11:00',
        'duration_hours' => 1,
        'base_price' => 100000,
        'validation_code' => 123,
        'total_price' => 100123,
        'payment_method' => 'transfer',
        'payment_status' => 'approved',
        'payment_deadline' => now()->addDay(),
        'customer_name' => 'Pelanggan Laporan',
        'customer_phone' => '081234567890',
    ], $attributes));
}

test('admin report supports search and safe sorting', function () {
    reportBooking($this->lapangan, ['booking_code' => 'RPT-ALPHA', 'customer_name' => 'Alpha Report', 'total_price' => 200000]);
    reportBooking($this->lapangan, ['booking_code' => 'RPT-BETA', 'customer_name' => 'Beta Report', 'total_price' => 100000]);

    $this->actingAs($this->admin)
        ->get(route('admin.reports.index', [
            'search' => 'Alpha Report',
            'sort' => 'total_price',
            'direction' => 'asc',
        ]))
        ->assertInertia(fn ($page) => $page
            ->component('admin/reports/index')
            ->has('bookings.data', 1)
            ->where('bookings.data.0.booking_code', 'RPT-ALPHA')
            ->where('filters.search', 'Alpha Report')
            ->where('filters.sort', 'total_price')
            ->where('filters.direction', 'asc'));
});

test('report export applies search and sorting filters', function () {
    reportBooking($this->lapangan, ['booking_code' => 'RPT-EXPORT', 'customer_name' => 'Exportable Report']);
    reportBooking($this->lapangan, ['booking_code' => 'RPT-OTHER', 'customer_name' => 'Other Report']);

    $response = $this->actingAs($this->admin)
        ->get(route('admin.reports.export', ['search' => 'Exportable Report']));

    $response->assertOk()
        ->assertHeader('content-type', 'text/csv; charset=UTF-8');
    expect($response->streamedContent())->toContain('RPT-EXPORT')->not->toContain('RPT-OTHER');
});
