<?php

use App\Models\Booking;
use App\Models\Category;
use App\Models\Lapangan;
use App\Models\Membership;
use App\Models\MembershipSetting;
use App\Models\PointTransaction;
use App\Models\User;
use Carbon\Carbon;

beforeEach(function () {
    Carbon::setTestNow('2026-10-18 10:00:00'); // Sunday

    $this->category = Category::create([
        'name' => 'Futsal',
        'slug' => 'futsal-'.uniqid(),
        'is_active' => true,
    ]);
    $this->lapangan = Lapangan::create([
        'category_id' => $this->category->id,
        'name' => 'Court A',
        'slug' => 'court-a-'.uniqid(),
        'is_active' => true,
        'price_per_hour' => 100000,
        'operational_start' => '07:00',
        'operational_end' => '23:00',
        'slot_duration_minutes' => 60,
    ]);

    $this->admin = User::factory()->create([
        'role' => 'admin',
        'email_verified_at' => now(),
    ]);

    $this->user = User::factory()->create([
        'role' => 'user',
        'email_verified_at' => now(),
        'points_balance' => 0,
    ]);

    MembershipSetting::query()->updateOrCreate(
        ['id' => MembershipSetting::ID],
        ['membership_discount_percentage' => 0],
    );
});

afterEach(function () {
    Carbon::setTestNow();
});

test('checkout membership adds 3 digit unique code to total amount', function () {
    $this->actingAs($this->user);

    $response = $this->post(route('membership.store'), [
        'reservations' => [
            [
                'lapangan_id' => $this->lapangan->id,
                'weekday' => 1, // Monday
                'start_time' => '10:00',
                'duration_hours' => 2,
            ],
        ],
        'use_points' => false,
    ]);

    $response->assertRedirect();
    $membership = $this->user->memberships()->latest()->firstOrFail();

    // 2 hours * 100,000 * occurrence_count
    $occurrenceCount = $membership->reservations->sum('occurrence_count');
    $expectedSubtotal = 200000 * $occurrenceCount;

    expect($membership->subtotal)->toBe($expectedSubtotal)
        ->and($membership->validation_code)->toBeGreaterThanOrEqual(100)
        ->and($membership->validation_code)->toBeLessThanOrEqual(999)
        ->and($membership->points_redeemed)->toBe(0)
        ->and($membership->amount)->toBe($expectedSubtotal + $membership->validation_code);
});

test('checkout membership can redeem points and reserves them while pending', function () {
    $this->user->forceFill(['points_balance' => 50000])->save();
    $this->actingAs($this->user);

    $response = $this->post(route('membership.store'), [
        'reservations' => [
            [
                'lapangan_id' => $this->lapangan->id,
                'weekday' => 1,
                'start_time' => '10:00',
                'duration_hours' => 2,
            ],
        ],
        'use_points' => true,
    ]);

    $response->assertRedirect();
    $membership = $this->user->memberships()->latest()->firstOrFail();
    $this->user->refresh();

    $occurrenceCount = $membership->reservations->sum('occurrence_count');
    $expectedSubtotal = 200000 * $occurrenceCount;

    expect($membership->points_redeemed)->toBe(50000)
        ->and($membership->amount)->toBe($expectedSubtotal - 50000 + $membership->validation_code)
        ->and($this->user->points_balance)->toBe(50000)
        ->and($this->user->availablePoints())->toBe(0);
});

test('approving membership debits redeemed points and credits validation code to points balance', function () {
    $this->user->forceFill(['points_balance' => 20000])->save();
    $this->actingAs($this->user);

    $this->post(route('membership.store'), [
        'reservations' => [
            [
                'lapangan_id' => $this->lapangan->id,
                'weekday' => 1,
                'start_time' => '10:00',
                'duration_hours' => 1,
            ],
        ],
        'use_points' => true,
    ])->assertRedirect();

    $membership = $this->user->memberships()->latest()->firstOrFail();
    $code = $membership->validation_code;

    // Submit payment
    $this->actingAs($this->user)->post(route('membership.submit-payment', $membership))->assertRedirect();

    // Admin approve
    $this->actingAs($this->admin)->post(route('admin.memberships.approve', $membership))
        ->assertRedirect()
        ->assertSessionHas('success');

    $this->user->refresh();
    $membership->refresh();

    // Points balance should be: initial (20000) - redeemed (20000) + earned ($code) = $code
    expect($this->user->points_balance)->toBe($code)
        ->and($this->user->availablePoints())->toBe($code)
        ->and($membership->status)->toBe('active')
        ->and($membership->payment_status)->toBe('approved');

    // Check PointTransaction records
    $this->assertDatabaseHas('point_transactions', [
        'user_id' => $this->user->id,
        'membership_id' => $membership->id,
        'type' => 'redeemed',
        'points' => 20000,
        'balance_after' => 0,
    ]);

    $this->assertDatabaseHas('point_transactions', [
        'user_id' => $this->user->id,
        'membership_id' => $membership->id,
        'type' => 'earned',
        'points' => $code,
        'balance_after' => $code,
    ]);
});

test('rejecting membership releases reserved points', function () {
    $this->user->forceFill(['points_balance' => 30000])->save();
    $this->actingAs($this->user);

    $this->post(route('membership.store'), [
        'reservations' => [
            [
                'lapangan_id' => $this->lapangan->id,
                'weekday' => 1,
                'start_time' => '10:00',
                'duration_hours' => 1,
            ],
        ],
        'use_points' => true,
    ])->assertRedirect();

    $membership = $this->user->memberships()->latest()->firstOrFail();
    expect($this->user->fresh()->availablePoints())->toBe(0);

    // Admin rejects
    $this->actingAs($this->admin)->post(route('admin.memberships.reject', $membership), [
        'rejection_reason' => 'Bukti transfer tidak sesuai',
    ])->assertRedirect();

    $membership->refresh();
    expect($membership->status)->toBe('rejected')
        ->and($this->user->fresh()->availablePoints())->toBe(30000)
        ->and($this->user->fresh()->points_balance)->toBe(30000);
});

test('points earned from membership can be used in daily booking checkout', function () {
    // 1. User starts with 0 points, checks out membership without points
    $this->actingAs($this->user);
    $this->post(route('membership.store'), [
        'reservations' => [
            [
                'lapangan_id' => $this->lapangan->id,
                'weekday' => 1,
                'start_time' => '10:00',
                'duration_hours' => 1,
            ],
        ],
        'use_points' => false,
    ]);

    $membership = $this->user->memberships()->latest()->firstOrFail();
    $uniqueCode = $membership->validation_code;

    // 2. Submit payment and admin approves
    $this->post(route('membership.submit-payment', $membership));
    $this->actingAs($this->admin)->post(route('admin.memberships.approve', $membership));

    $this->user->refresh();
    expect($this->user->points_balance)->toBe($uniqueCode)
        ->and($this->user->availablePoints())->toBe($uniqueCode);

    // 3. User makes a daily booking using the earned points!
    $this->actingAs($this->user);
    $response = $this->post(route('booking.store'), [
        'lapangan_id' => $this->lapangan->id,
        'booking_date' => Carbon::tomorrow()->format('Y-m-d'),
        'start_time' => '15:00',
        'duration_hours' => 1,
        'payment_method' => 'transfer',
        'use_points' => true,
        'customer_name' => 'Tester User',
        'customer_phone' => '081234567890',
    ]);

    $response->assertRedirect();
    $booking = Booking::query()->where('customer_phone', '081234567890')->latest()->firstOrFail();

    expect($booking->points_redeemed)->toBe($uniqueCode)
        ->and($booking->total_price)->toBe(100000 - $uniqueCode + $booking->validation_code)
        ->and($this->user->fresh()->availablePoints())->toBe(0);
});

test('points earned from membership can be used in subsequent membership checkout', function () {
    // 1. Give user 1000 points
    $this->user->forceFill(['points_balance' => 1000])->save();
    $this->actingAs($this->user);

    // 2. Checkout second membership using points
    $response = $this->post(route('membership.store'), [
        'reservations' => [
            [
                'lapangan_id' => $this->lapangan->id,
                'weekday' => 2, // Tuesday
                'start_time' => '10:00',
                'duration_hours' => 1,
            ],
        ],
        'use_points' => true,
    ]);

    $response->assertRedirect();
    $membership = $this->user->memberships()->latest()->firstOrFail();
    $subtotal = $membership->subtotal;

    expect($membership->points_redeemed)->toBe(1000)
        ->and($membership->amount)->toBe($subtotal - 1000 + $membership->validation_code)
        ->and($this->user->fresh()->availablePoints())->toBe(0);

    // 3. User submits payment and admin approves
    $this->post(route('membership.submit-payment', $membership));
    $this->actingAs($this->admin)->post(route('admin.memberships.approve', $membership))->assertRedirect();

    $this->user->refresh();
    // Points after approval: initial (1000) - redeemed (1000) + earned ($membership->validation_code)
    expect($this->user->points_balance)->toBe($membership->validation_code)
        ->and($this->user->availablePoints())->toBe($membership->validation_code);
});
