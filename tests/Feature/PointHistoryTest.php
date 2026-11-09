<?php

use App\Models\Booking;
use App\Models\Category;
use App\Models\Lapangan;
use App\Models\PointTransaction;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->user = User::factory()->create([
        'role' => 'user',
        'points_balance' => 500,
        'email_verified_at' => now(),
    ]);

    $this->category = Category::create([
        'name' => 'Futsal',
        'slug' => 'futsal-'.uniqid(),
        'is_active' => true,
    ]);

    $this->lapangan = Lapangan::create([
        'category_id' => $this->category->id,
        'name' => 'Lapangan Utama',
        'slug' => 'lapangan-utama-'.uniqid(),
        'is_active' => true,
        'price_per_hour' => 100000,
        'operational_start' => '07:00',
        'operational_end' => '23:00',
        'slot_duration_minutes' => 60,
    ]);
});

test('unauthenticated users cannot access point history page', function () {
    $response = $this->get('/points/history');
    $response->assertRedirect('/login');
});

test('authenticated user can view point history page with correct stats', function () {
    // Create an earned transaction
    PointTransaction::create([
        'user_id' => $this->user->id,
        'type' => 'earned',
        'points' => 350,
        'balance_after' => 350,
    ]);

    // Create a redeemed transaction
    PointTransaction::create([
        'user_id' => $this->user->id,
        'type' => 'redeemed',
        'points' => 100,
        'balance_after' => 250,
    ]);

    $response = $this->actingAs($this->user)->get('/points/history');

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('points/history')
        ->has('transactions.data', 2)
        ->where('stats.points_balance', 500)
        ->where('stats.total_earned', 350)
        ->where('stats.total_redeemed', 100)
        ->where('currentFilter', 'all')
    );
});

test('user can filter point transactions by earned and redeemed', function () {
    PointTransaction::create([
        'user_id' => $this->user->id,
        'type' => 'earned',
        'points' => 200,
        'balance_after' => 200,
    ]);

    PointTransaction::create([
        'user_id' => $this->user->id,
        'type' => 'redeemed',
        'points' => 50,
        'balance_after' => 150,
    ]);

    // Filter earned
    $responseEarned = $this->actingAs($this->user)->get('/points/history?type=earned');
    $responseEarned->assertOk();
    $responseEarned->assertInertia(fn (Assert $page) => $page
        ->component('points/history')
        ->has('transactions.data', 1)
        ->where('transactions.data.0.type', 'earned')
        ->where('currentFilter', 'earned')
    );

    // Filter redeemed
    $responseRedeemed = $this->actingAs($this->user)->get('/points/history?type=redeemed');
    $responseRedeemed->assertOk();
    $responseRedeemed->assertInertia(fn (Assert $page) => $page
        ->component('points/history')
        ->has('transactions.data', 1)
        ->where('transactions.data.0.type', 'redeemed')
        ->where('currentFilter', 'redeemed')
    );
});

test('point transaction provides descriptive reason from related booking and membership', function () {
    $booking = Booking::create([
        'booking_code' => 'BK-TEST-12345',
        'user_id' => $this->user->id,
        'lapangan_id' => $this->lapangan->id,
        'booking_date' => now()->toDateString(),
        'start_time' => '10:00',
        'end_time' => '11:00',
        'duration_hours' => 1,
        'base_price' => 100000,
        'validation_code' => 321,
        'total_price' => 100321,
        'payment_method' => 'transfer',
        'payment_status' => 'approved',
        'payment_deadline' => now()->addHours(2),
        'customer_name' => $this->user->name,
        'customer_email' => $this->user->email,
        'customer_phone' => '08123456789',
    ]);

    $earnedTx = PointTransaction::create([
        'user_id' => $this->user->id,
        'booking_id' => $booking->id,
        'type' => 'earned',
        'points' => 321,
        'balance_after' => 821,
    ]);

    $redeemedTx = PointTransaction::create([
        'user_id' => $this->user->id,
        'booking_id' => $booking->id,
        'type' => 'redeemed',
        'points' => 200,
        'balance_after' => 621,
    ]);

    expect($earnedTx->title)->toBe('Kode Unik Booking');
    expect($earnedTx->description)->toContain('BK-TEST-12345');
    expect($earnedTx->description)->toContain('Lapangan Utama');
    expect($earnedTx->reference_url)->toBe(route('booking.show', ['booking_code' => 'BK-TEST-12345'], false));

    expect($redeemedTx->title)->toBe('Potongan Booking');
    expect($redeemedTx->description)->toContain('BK-TEST-12345');
    expect($redeemedTx->description)->toContain('Lapangan Utama');
});

test('point history honors valid per_page parameter and defaults to 10', function () {
    // Create 15 transactions
    for ($i = 1; $i <= 15; $i++) {
        PointTransaction::create([
            'user_id' => $this->user->id,
            'type' => 'earned',
            'points' => 10,
            'balance_after' => 10 * $i,
        ]);
    }

    // Default per_page should be 10
    $responseDefault = $this->actingAs($this->user)->get('/points/history');
    $responseDefault->assertOk();
    $responseDefault->assertInertia(fn (Assert $page) => $page
        ->component('points/history')
        ->where('transactions.per_page', 10)
        ->has('transactions.data', 10)
        ->where('transactions.total', 15)
    );

    // Custom valid per_page (25) should load all 15 in page 1
    $response25 = $this->actingAs($this->user)->get('/points/history?per_page=25');
    $response25->assertOk();
    $response25->assertInertia(fn (Assert $page) => $page
        ->component('points/history')
        ->where('transactions.per_page', 25)
        ->has('transactions.data', 15)
    );

    // Invalid per_page should fallback to default 10
    $responseInvalid = $this->actingAs($this->user)->get('/points/history?per_page=999');
    $responseInvalid->assertOk();
    $responseInvalid->assertInertia(fn (Assert $page) => $page
        ->component('points/history')
        ->where('transactions.per_page', 10)
        ->has('transactions.data', 10)
    );
});
