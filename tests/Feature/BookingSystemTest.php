<?php

use App\Models\Booking;
use App\Models\Category;
use App\Models\Lapangan;
use App\Models\User;
use App\Notifications\PaymentApprovedNotification;
use App\Notifications\PaymentRejectedNotification;
use Carbon\Carbon;
use Illuminate\Support\Facades\Notification;

beforeEach(function () {
    $this->category = Category::firstOrCreate(
        ['slug' => 'futsal-test'],
        ['name' => 'Futsal Test', 'is_active' => true]
    );

    $this->lapangan = Lapangan::firstOrCreate(
        ['slug' => 'lapangan-test'],
        [
            'category_id' => $this->category->id,
            'name' => 'Lapangan Test Pro',
            'price_per_hour' => 100000,
            'operational_start' => '07:00',
            'operational_end' => '23:00',
            'slot_duration_minutes' => 60,
            'is_active' => true,
        ]
    );

    $this->superadmin = User::firstOrCreate(
        ['email' => 'superadmin.test@test.com'],
        [
            'name' => 'Super Admin Test',
            'password' => bcrypt('password'),
            'role' => 'superadmin',
            'email_verified_at' => now(),
        ]
    );

    $this->admin = User::firstOrCreate(
        ['email' => 'admin.test@test.com'],
        [
            'name' => 'Admin Kasir Test',
            'password' => bcrypt('password'),
            'role' => 'admin',
            'email_verified_at' => now(),
        ]
    );
    $this->admin->assignedLapangans()->sync([$this->lapangan->id]);

    $this->user = User::firstOrCreate(
        ['email' => 'customer.test@test.com'],
        [
            'name' => 'Customer Test',
            'password' => bcrypt('password'),
            'role' => 'user',
            'email_verified_at' => now(),
        ]
    );
    $this->user->markEmailAsVerified();
});

test('public can view home page and lapangan catalog', function () {
    $response = $this->get(route('home'));
    $response->assertOk();

    $catalogResponse = $this->get(route('lapangan.index'));
    $catalogResponse->assertOk();
});

test('public can view lapangan detail with slots data', function () {
    $response = $this->get(route('lapangan.show', $this->lapangan->slug));
    $response->assertOk();
});

test('user cannot book more than 2 days in advance (PRD Rule)', function () {
    $this->actingAs($this->user);

    // 4 days from now is invalid
    $invalidDate = Carbon::today()->addDays(4)->format('Y-m-d');

    $response = $this->post(route('booking.store'), [
        'lapangan_id' => $this->lapangan->id,
        'booking_date' => $invalidDate,
        'start_time' => '10:00',
        'duration_hours' => 2,
        'payment_method' => 'transfer',
        'customer_name' => 'John Doe',
        'customer_phone' => '08123456789',
    ]);

    $response->assertSessionHasErrors('booking_date');
});

test('user can book valid slot with 3-digit validation code generated', function () {
    $this->actingAs($this->user);

    $tomorrow = Carbon::tomorrow()->format('Y-m-d');

    $response = $this->post(route('booking.store'), [
        'lapangan_id' => $this->lapangan->id,
        'booking_date' => $tomorrow,
        'start_time' => '14:00',
        'duration_hours' => 2,
        'payment_method' => 'transfer',
        'customer_name' => 'Dimas Anggara',
        'customer_phone' => '081234567890',
        'notes' => 'Pesan bola 2',
    ]);

    $booking = Booking::where('customer_phone', '081234567890')->latest()->first();

    expect($booking)->not->toBeNull()
        ->and($booking->duration_hours)->toBe(2)
        ->and($booking->base_price)->toBe(200000)
        ->and($booking->validation_code)->toBeGreaterThanOrEqual(100)
        ->and($booking->validation_code)->toBeLessThanOrEqual(999)
        ->and($booking->total_price)->toBe($booking->base_price + $booking->validation_code)
        ->and($booking->payment_status)->toBe('pending');

    $response->assertRedirect(route('booking.show', $booking->booking_code));
});

test('user cannot double book overlapping slots', function () {
    $this->actingAs($this->user);

    $dayAfter = Carbon::today()->addDays(2)->format('Y-m-d');

    $firstBooking = Booking::create([
        'booking_code' => 'BKG-COLLISION-1',
        'user_id' => $this->user->id,
        'lapangan_id' => $this->lapangan->id,
        'booking_date' => $dayAfter,
        'start_time' => '10:00',
        'end_time' => '12:00',
        'duration_hours' => 2,
        'base_price' => 200000,
        'validation_code' => 123,
        'total_price' => 200123,
        'payment_method' => 'transfer',
        'payment_status' => 'approved',
        'customer_name' => 'First Booker',
        'customer_phone' => '0811111111',
        'payment_deadline' => now()->addHours(2),
    ]);

    // Second booking attempt overlapping 11:00 to 13:00
    $response = $this->post(route('booking.store'), [
        'lapangan_id' => $this->lapangan->id,
        'booking_date' => $dayAfter,
        'start_time' => '11:00',
        'duration_hours' => 2,
        'payment_method' => 'transfer',
        'customer_name' => 'Second Booker',
        'customer_phone' => '0822222222',
    ]);

    $response->assertSessionHasErrors('start_time');
});

test('user can submit payment validation code', function () {
    $this->actingAs($this->user);

    $booking = Booking::create([
        'booking_code' => 'BKG-SUBMIT-TEST',
        'user_id' => $this->user->id,
        'lapangan_id' => $this->lapangan->id,
        'booking_date' => Carbon::tomorrow()->format('Y-m-d'),
        'start_time' => '09:00',
        'end_time' => '10:00',
        'duration_hours' => 1,
        'base_price' => 100000,
        'validation_code' => 456,
        'total_price' => 100456,
        'payment_method' => 'transfer',
        'payment_status' => 'pending',
        'customer_name' => 'Customer Test',
        'customer_phone' => '08123456789',
        'payment_deadline' => now()->addHours(2),
    ]);

    $response = $this->post(route('booking.submit-payment', $booking->booking_code), [
        'submitted_code' => 456,
    ]);

    $booking->refresh();
    expect($booking->payment_status)->toBe('pending_validation')
        ->and($booking->user_submitted_code)->toBe(456);
});

test('admin can approve payment and notification is dispatched', function () {
    Notification::fake();

    $this->actingAs($this->admin);

    $booking = Booking::create([
        'booking_code' => 'BKG-APPROVE-TEST',
        'user_id' => $this->user->id,
        'lapangan_id' => $this->lapangan->id,
        'booking_date' => Carbon::tomorrow()->format('Y-m-d'),
        'start_time' => '15:00',
        'end_time' => '16:00',
        'duration_hours' => 1,
        'base_price' => 100000,
        'validation_code' => 789,
        'total_price' => 100789,
        'payment_method' => 'transfer',
        'payment_status' => 'pending_validation',
        'customer_name' => 'Customer Test',
        'customer_phone' => '08123456789',
        'user_submitted_code' => 789,
        'payment_deadline' => now()->addHours(2),
    ]);

    $response = $this->post(route('admin.bookings.approve', $booking->id));

    $booking->refresh();
    expect($booking->payment_status)->toBe('approved')
        ->and($booking->validated_by)->toBe($this->admin->id);

    Notification::assertSentTo($this->user, PaymentApprovedNotification::class);
});

test('admin can reject payment with reason and notification is dispatched', function () {
    Notification::fake();

    $this->actingAs($this->admin);

    $booking = Booking::create([
        'booking_code' => 'BKG-REJECT-TEST',
        'user_id' => $this->user->id,
        'lapangan_id' => $this->lapangan->id,
        'booking_date' => Carbon::tomorrow()->format('Y-m-d'),
        'start_time' => '16:00',
        'end_time' => '17:00',
        'duration_hours' => 1,
        'base_price' => 100000,
        'validation_code' => 321,
        'total_price' => 100321,
        'payment_method' => 'transfer',
        'payment_status' => 'pending_validation',
        'customer_name' => 'Customer Test',
        'customer_phone' => '08123456789',
        'user_submitted_code' => 321,
        'payment_deadline' => now()->addHours(2),
    ]);

    $reason = 'Nominal transfer tidak sesuai dengan mutasi bank kami.';

    $response = $this->post(route('admin.bookings.reject', $booking->id), [
        'reason' => $reason,
    ]);

    $booking->refresh();
    expect($booking->payment_status)->toBe('rejected')
        ->and($booking->rejection_reason)->toBe($reason);

    Notification::assertSentTo($this->user, PaymentRejectedNotification::class);
});

test('user can cancel booking if >= 24h before play but cannot if < 24h (PRD Rule)', function () {
    $this->actingAs($this->user);

    // Booking 2 days from now (more than 24h)
    $bookingFuture = Booking::create([
        'booking_code' => 'BKG-CANCEL-FUTURE',
        'user_id' => $this->user->id,
        'lapangan_id' => $this->lapangan->id,
        'booking_date' => Carbon::today()->addDays(2)->format('Y-m-d'),
        'start_time' => '20:00',
        'end_time' => '21:00',
        'duration_hours' => 1,
        'base_price' => 100000,
        'total_price' => 100000,
        'payment_method' => 'cash',
        'payment_status' => 'pending',
        'customer_name' => 'Customer Test',
        'customer_phone' => '08123456789',
        'payment_deadline' => now()->addHours(2),
    ]);

    // Should succeed
    $responseFuture = $this->post(route('booking.cancel', $bookingFuture->booking_code));
    $bookingFuture->refresh();
    expect($bookingFuture->payment_status)->toBe('cancelled');

    // Booking within 5 hours (less than 24h)
    $bookingSoon = Booking::create([
        'booking_code' => 'BKG-CANCEL-SOON',
        'user_id' => $this->user->id,
        'lapangan_id' => $this->lapangan->id,
        'booking_date' => Carbon::today()->format('Y-m-d'),
        'start_time' => Carbon::now()->addHours(4)->format('H:i'),
        'end_time' => Carbon::now()->addHours(5)->format('H:i'),
        'duration_hours' => 1,
        'base_price' => 100000,
        'total_price' => 100000,
        'payment_method' => 'cash',
        'payment_status' => 'pending',
        'customer_name' => 'Customer Test',
        'customer_phone' => '08123456789',
        'payment_deadline' => now()->addHours(1),
    ]);

    // Should be blocked by 24h policy
    $responseSoon = $this->post(route('booking.cancel', $bookingSoon->booking_code));
    $bookingSoon->refresh();
    expect($bookingSoon->payment_status)->toBe('pending');
});

test('regular user cannot access admin workspace', function () {
    $this->actingAs($this->user);

    $response = $this->get(route('admin.dashboard'));
    $response->assertForbidden();
});

test('superadmin can access admin workspace and manage lapangans', function () {
    $this->actingAs($this->superadmin);

    $response = $this->get(route('admin.dashboard'));
    $response->assertOk();

    $lapangansResponse = $this->get(route('admin.lapangans.index'));
    $lapangansResponse->assertOk();
});

test('public user can view lapangan catalog page and receives structured filters', function () {
    $response = $this->get(route('lapangan.index'));
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('lapangan/index')
        ->has('lapangans.data')
        ->has('categories')
        ->has('facilities')
        ->where('filters.sort', 'latest')
    );
});
