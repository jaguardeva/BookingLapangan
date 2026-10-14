<?php

use App\Models\Booking;
use App\Models\Category;
use App\Models\Lapangan;
use App\Models\Membership;
use App\Models\User;

beforeEach(function () {
    $this->category = Category::firstOrCreate(
        ['slug' => 'filter-test'],
        ['name' => 'Filter Test', 'is_active' => true]
    );

    $this->lapangan = Lapangan::firstOrCreate(
        ['slug' => 'filter-lap-test'],
        [
            'category_id' => $this->category->id,
            'name' => 'Lapangan Filter Test',
            'price_per_hour' => 100000,
            'operational_start' => '07:00',
            'operational_end' => '23:00',
            'slot_duration_minutes' => 60,
            'is_active' => true,
        ]
    );

    $this->user = User::firstOrCreate(
        ['email' => 'filter-test@test.com'],
        [
            'name' => 'Filter Test User',
            'password' => bcrypt('password'),
            'role' => 'user',
            'email_verified_at' => now(),
        ]
    );
    $this->user->markEmailAsVerified();
});

test('booking history page loads with currentType prop', function () {
    $this->actingAs($this->user)
        ->get(route('booking.history'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('booking/history')
            ->has('currentType')
            ->where('currentType', 'all')
        );
});

test('type filter membership returns only membership bookings', function () {
    $membership = Membership::create([
        'user_id' => $this->user->id,
        'amount' => 400000,
        'subtotal' => 400000,
        'status' => 'active',
        'payment_status' => 'approved',
        'payment_method' => 'transfer',
        'validation_code' => 123,
    ]);

    // Membership booking
    Booking::create([
        'booking_code' => Booking::generateBookingCode(),
        'user_id' => $this->user->id,
        'lapangan_id' => $this->lapangan->id,
        'booking_date' => now()->addDay()->format('Y-m-d'),
        'start_time' => '10:00',
        'end_time' => '11:00',
        'duration_hours' => 1,
        'base_price' => 100000,
        'discount_amount' => 0,
        'total_price' => 100000,
        'points_redeemed' => 0,
        'payment_method' => 'transfer',
        'payment_status' => 'approved',
        'customer_name' => $this->user->name,
        'customer_phone' => '08123456789',
        'validation_code' => Booking::generateValidationCode(),
        'payment_deadline' => now()->addDay(),
        'booking_source' => 'membership',
        'membership_id' => $membership->id,
    ]);

    // Daily booking
    Booking::create([
        'booking_code' => Booking::generateBookingCode(),
        'user_id' => $this->user->id,
        'lapangan_id' => $this->lapangan->id,
        'booking_date' => now()->addDays(2)->format('Y-m-d'),
        'start_time' => '14:00',
        'end_time' => '15:00',
        'duration_hours' => 1,
        'base_price' => 100000,
        'discount_amount' => 0,
        'total_price' => 100000,
        'points_redeemed' => 0,
        'payment_method' => 'transfer',
        'payment_status' => 'pending',
        'customer_name' => $this->user->name,
        'customer_phone' => '08123456789',
        'validation_code' => Booking::generateValidationCode(),
        'payment_deadline' => now()->addDay(),
        'booking_source' => 'daily',
        'membership_id' => null,
    ]);

    $this->actingAs($this->user)
        ->get(route('booking.history', ['type' => 'membership']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('booking/history')
            ->where('currentType', 'membership')
            ->has('bookings.data', 1)
            ->where('bookings.data.0.membership_id', $membership->id)
        );
});

test('type filter regular returns only daily bookings', function () {
    $membership = Membership::create([
        'user_id' => $this->user->id,
        'amount' => 400000,
        'subtotal' => 400000,
        'status' => 'active',
        'payment_status' => 'approved',
        'payment_method' => 'transfer',
        'validation_code' => 456,
    ]);

    // Membership booking
    Booking::create([
        'booking_code' => Booking::generateBookingCode(),
        'user_id' => $this->user->id,
        'lapangan_id' => $this->lapangan->id,
        'booking_date' => now()->addDay()->format('Y-m-d'),
        'start_time' => '10:00',
        'end_time' => '11:00',
        'duration_hours' => 1,
        'base_price' => 100000,
        'discount_amount' => 0,
        'total_price' => 100000,
        'points_redeemed' => 0,
        'payment_method' => 'transfer',
        'payment_status' => 'approved',
        'customer_name' => $this->user->name,
        'customer_phone' => '08123456789',
        'validation_code' => Booking::generateValidationCode(),
        'payment_deadline' => now()->addDay(),
        'booking_source' => 'membership',
        'membership_id' => $membership->id,
    ]);

    // Daily booking
    Booking::create([
        'booking_code' => Booking::generateBookingCode(),
        'user_id' => $this->user->id,
        'lapangan_id' => $this->lapangan->id,
        'booking_date' => now()->addDays(2)->format('Y-m-d'),
        'start_time' => '14:00',
        'end_time' => '15:00',
        'duration_hours' => 1,
        'base_price' => 100000,
        'discount_amount' => 0,
        'total_price' => 100000,
        'points_redeemed' => 0,
        'payment_method' => 'transfer',
        'payment_status' => 'pending',
        'customer_name' => $this->user->name,
        'customer_phone' => '08123456789',
        'validation_code' => Booking::generateValidationCode(),
        'payment_deadline' => now()->addDay(),
        'booking_source' => 'daily',
        'membership_id' => null,
    ]);

    $this->actingAs($this->user)
        ->get(route('booking.history', ['type' => 'regular']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('booking/history')
            ->where('currentType', 'regular')
            ->has('bookings.data', 1)
            ->where('bookings.data.0.membership_id', null)
        );
});

test('booking history eager loads membership relation', function () {
    $membership = Membership::create([
        'user_id' => $this->user->id,
        'amount' => 400000,
        'subtotal' => 400000,
        'status' => 'active',
        'payment_status' => 'approved',
        'payment_method' => 'transfer',
        'validation_code' => 789,
    ]);

    Booking::create([
        'booking_code' => Booking::generateBookingCode(),
        'user_id' => $this->user->id,
        'lapangan_id' => $this->lapangan->id,
        'booking_date' => now()->addDay()->format('Y-m-d'),
        'start_time' => '10:00',
        'end_time' => '11:00',
        'duration_hours' => 1,
        'base_price' => 100000,
        'discount_amount' => 0,
        'total_price' => 100000,
        'points_redeemed' => 0,
        'payment_method' => 'transfer',
        'payment_status' => 'approved',
        'customer_name' => $this->user->name,
        'customer_phone' => '08123456789',
        'validation_code' => Booking::generateValidationCode(),
        'payment_deadline' => now()->addDay(),
        'booking_source' => 'membership',
        'membership_id' => $membership->id,
    ]);

    $this->actingAs($this->user)
        ->get(route('booking.history'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('booking/history')
            ->has('bookings.data.0.membership')
        );
});

test('membership with multiple sessions counts as only 1 item in pagination', function () {
    $membership = Membership::create([
        'user_id' => $this->user->id,
        'amount' => 500000,
        'subtotal' => 500000,
        'status' => 'active',
        'payment_status' => 'approved',
        'payment_method' => 'transfer',
        'validation_code' => 555,
    ]);

    // Create 5 sessions under the same membership
    for ($i = 1; $i <= 5; $i++) {
        Booking::create([
            'booking_code' => Booking::generateBookingCode(),
            'user_id' => $this->user->id,
            'lapangan_id' => $this->lapangan->id,
            'booking_date' => now()->addDays($i)->format('Y-m-d'),
            'start_time' => '10:00',
            'end_time' => '11:00',
            'duration_hours' => 1,
            'base_price' => 100000,
            'discount_amount' => 0,
            'total_price' => 100000,
            'points_redeemed' => 0,
            'payment_method' => 'transfer',
            'payment_status' => 'approved',
            'customer_name' => $this->user->name,
            'customer_phone' => '08123456789',
            'validation_code' => Booking::generateValidationCode(),
            'payment_deadline' => now()->addDay(),
            'booking_source' => 'membership',
            'membership_id' => $membership->id,
        ]);
    }

    // Create 2 regular bookings
    for ($j = 1; $j <= 2; $j++) {
        Booking::create([
            'booking_code' => Booking::generateBookingCode(),
            'user_id' => $this->user->id,
            'lapangan_id' => $this->lapangan->id,
            'booking_date' => now()->addDays(10 + $j)->format('Y-m-d'),
            'start_time' => '14:00',
            'end_time' => '15:00',
            'duration_hours' => 1,
            'base_price' => 100000,
            'discount_amount' => 0,
            'total_price' => 100000,
            'points_redeemed' => 0,
            'payment_method' => 'transfer',
            'payment_status' => 'approved',
            'customer_name' => $this->user->name,
            'customer_phone' => '08123456789',
            'validation_code' => Booking::generateValidationCode(),
            'payment_deadline' => now()->addDay(),
            'booking_source' => 'daily',
            'membership_id' => null,
        ]);
    }

    $this->actingAs($this->user)
        ->get(route('booking.history'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('booking/history')
            // 5 membership sessions + 2 regular = 3 total items in paginator, NOT 7!
            ->where('bookings.total', 3)
            ->has('bookings.data', 3)
            // The membership entry has its 5 sessions loaded in relation
            ->where('bookings.data', function ($items) {
                $membershipItem = collect($items)->firstWhere('membership_id', '!=', null);

                return $membershipItem !== null
                    && isset($membershipItem['membership']['bookings'])
                    && count($membershipItem['membership']['bookings']) === 5;
            })
        );
});

test('membership filter with multiple sessions counts as 1 item', function () {
    $membership = Membership::create([
        'user_id' => $this->user->id,
        'amount' => 400000,
        'subtotal' => 400000,
        'status' => 'active',
        'payment_status' => 'approved',
        'payment_method' => 'transfer',
        'validation_code' => 666,
    ]);

    for ($i = 1; $i <= 4; $i++) {
        Booking::create([
            'booking_code' => Booking::generateBookingCode(),
            'user_id' => $this->user->id,
            'lapangan_id' => $this->lapangan->id,
            'booking_date' => now()->addDays($i)->format('Y-m-d'),
            'start_time' => '10:00',
            'end_time' => '11:00',
            'duration_hours' => 1,
            'base_price' => 100000,
            'discount_amount' => 0,
            'total_price' => 100000,
            'points_redeemed' => 0,
            'payment_method' => 'transfer',
            'payment_status' => 'approved',
            'customer_name' => $this->user->name,
            'customer_phone' => '08123456789',
            'validation_code' => Booking::generateValidationCode(),
            'payment_deadline' => now()->addDay(),
            'booking_source' => 'membership',
            'membership_id' => $membership->id,
        ]);
    }

    $this->actingAs($this->user)
        ->get(route('booking.history', ['type' => 'membership']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('booking/history')
            ->where('bookings.total', 1)
            ->has('bookings.data', 1)
            ->where('bookings.data.0.membership_id', $membership->id)
        );
});
