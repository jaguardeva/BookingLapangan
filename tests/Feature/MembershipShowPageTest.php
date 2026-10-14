<?php

use App\Models\BankAccount;
use App\Models\Category;
use App\Models\Lapangan;
use App\Models\Membership;
use App\Models\MembershipReservation;
use App\Models\User;

beforeEach(function () {
    $this->category = Category::firstOrCreate(
        ['slug' => 'show-page-test'],
        ['name' => 'Show Page Test', 'is_active' => true]
    );

    $this->lapangan = Lapangan::firstOrCreate(
        ['slug' => 'show-page-lap'],
        [
            'category_id' => $this->category->id,
            'name' => 'Lapangan Show Test',
            'price_per_hour' => 100000,
            'operational_start' => '07:00',
            'operational_end' => '23:00',
            'slot_duration_minutes' => 60,
            'is_active' => true,
        ]
    );

    $this->user = User::firstOrCreate(
        ['email' => 'show-page-test@test.com'],
        [
            'name' => 'Show Page Test User',
            'password' => bcrypt('password'),
            'role' => 'user',
            'email_verified_at' => now(),
        ]
    );
    $this->user->markEmailAsVerified();
});

test('membership show page includes discount data when discount exists', function () {
    $membership = Membership::create([
        'user_id' => $this->user->id,
        'amount' => 380000,
        'subtotal' => 400000,
        'discount_value' => 5,
        'discount_amount' => 20000,
        'status' => 'active',
        'payment_status' => 'approved',
        'payment_method' => 'transfer',
        'validation_code' => 123,
        'starts_at' => now(),
        'ends_at' => now()->addDays(30),
    ]);

    MembershipReservation::create([
        'membership_id' => $membership->id,
        'lapangan_id' => $this->lapangan->id,
        'weekday' => 1,
        'start_time' => '10:00',
        'end_time' => '11:00',
        'duration_hours' => 1,
        'price_per_occurrence' => 100000,
        'occurrence_count' => 4,
        'status' => 'active',
    ]);

    $this->actingAs($this->user)
        ->get(route('membership.show', $membership))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('membership/invoice')
            ->has('membership')
            ->where('membership.subtotal', 400000)
            ->where('membership.discount_value', 5)
            ->where('membership.discount_amount', 20000)
            ->where('membership.amount', 380000)
        );
});

test('membership show page works without discount', function () {
    $membership = Membership::create([
        'user_id' => $this->user->id,
        'amount' => 400000,
        'subtotal' => 400000,
        'discount_value' => 0,
        'discount_amount' => 0,
        'status' => 'active',
        'payment_status' => 'approved',
        'payment_method' => 'transfer',
        'validation_code' => 456,
        'starts_at' => now(),
        'ends_at' => now()->addDays(30),
    ]);

    MembershipReservation::create([
        'membership_id' => $membership->id,
        'lapangan_id' => $this->lapangan->id,
        'weekday' => 3,
        'start_time' => '14:00',
        'end_time' => '15:00',
        'duration_hours' => 1,
        'price_per_occurrence' => 100000,
        'occurrence_count' => 4,
        'status' => 'active',
    ]);

    $this->actingAs($this->user)
        ->get(route('membership.show', $membership))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('membership/invoice')
            ->has('membership')
            ->where('membership.discount_amount', 0)
            ->where('membership.amount', 400000)
        );
});

test('membership show page returns bank accounts', function () {
    BankAccount::query()->delete();
    $bank = BankAccount::create([
        'bank_name' => 'BCA Test',
        'account_number' => '1234567890',
        'account_name' => 'Test Account',
        'is_active' => true,
    ]);

    $membership = Membership::create([
        'user_id' => $this->user->id,
        'amount' => 400000,
        'subtotal' => 400000,
        'discount_value' => 0,
        'discount_amount' => 0,
        'status' => 'pending',
        'payment_status' => 'pending',
        'payment_method' => 'transfer',
        'validation_code' => 789,
        'payment_deadline' => now()->addDay(),
    ]);

    $this->actingAs($this->user)
        ->get(route('membership.show', $membership))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('membership/invoice')
            ->has('bankAccounts', 1)
            ->where('bankAccounts.0.bank_name', 'BCA Test')
        );
});
