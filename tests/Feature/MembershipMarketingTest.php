<?php

use App\Models\Banner;
use App\Models\Booking;
use App\Models\Category;
use App\Models\Coupon;
use App\Models\Lapangan;
use App\Models\Membership;
use App\Models\MembershipSetting;
use App\Models\User;
use App\Notifications\MembershipPaymentSubmittedNotification;
use App\Notifications\MembershipRenewalNotification;
use Carbon\Carbon;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;

function marketingLapangan(): Lapangan
{
    $category = Category::create([
        'name' => 'Futsal',
        'slug' => 'futsal-'.uniqid(),
        'is_active' => true,
    ]);

    return Lapangan::create([
        'category_id' => $category->id,
        'name' => 'Court Promo',
        'slug' => 'court-promo-'.uniqid(),
        'price_per_hour' => 100000,
        'operational_start' => '07:00',
        'operational_end' => '23:00',
        'slot_duration_minutes' => 60,
        'is_active' => true,
    ]);
}

test('a valid coupon is persisted as a booking discount', function () {
    $user = User::factory()->create(['email_verified_at' => now()]);
    $lapangan = marketingLapangan();
    Coupon::create([
        'code' => 'HEMAT10',
        'discount_type' => 'percentage',
        'discount_value' => 10,
        'is_active' => true,
    ]);

    $this->actingAs($user)->post(route('booking.store'), [
        'lapangan_id' => $lapangan->id,
        'booking_date' => now()->addDay()->toDateString(),
        'start_time' => '10:00',
        'duration_hours' => 1,
        'payment_method' => 'cash',
        'use_points' => false,
        'customer_name' => $user->name,
        'customer_phone' => '081234567890',
        'coupon_code' => 'hemat10',
    ])->assertRedirect()->assertSessionHasNoErrors();

    $booking = $user->bookings()->latest()->firstOrFail();
    expect($booking->discount_amount)->toBe(10000)
        ->and($booking->total_price)->toBe(90000)
        ->and($booking->coupon_id)->not->toBeNull();
    $this->assertDatabaseHas('coupon_redemptions', ['booking_id' => $booking->id, 'status' => 'reserved']);
});

test('admin approval activates a monthly membership without changing other memberships', function () {
    $admin = User::factory()->create(['role' => 'superadmin']);
    $user = User::factory()->create(['email_verified_at' => now()]);
    $oldEndsAt = now()->addDay();
    $old = Membership::create([
        'user_id' => $user->id,
        'amount' => 150000,
        'status' => 'active',
        'payment_status' => 'approved',
        'starts_at' => now()->subMonth(),
        'ends_at' => $oldEndsAt,
        'approved_at' => now()->subMonth(),
    ]);
    $lapangan = marketingLapangan();
    $oldBooking = Booking::create([
        'booking_code' => 'OLD-ACTIVE-MEMBERSHIP-BOOKING',
        'user_id' => $user->id,
        'membership_id' => $old->id,
        'booking_source' => 'membership',
        'lapangan_id' => $lapangan->id,
        'booking_date' => now()->addDays(2)->toDateString(),
        'start_time' => '10:00',
        'end_time' => '11:00',
        'duration_hours' => 1,
        'base_price' => 150000,
        'total_price' => 150000,
        'payment_method' => 'transfer',
        'payment_status' => 'approved',
        'customer_name' => $user->name,
        'customer_phone' => '081234567890',
        'customer_email' => $user->email,
        'payment_deadline' => now()->addDay(),
    ]);
    $pending = Membership::create([
        'user_id' => $user->id,
        'amount' => 150000,
        'status' => 'pending',
        'payment_status' => 'pending_validation',
        'validation_code' => 123,
    ]);

    $this->actingAs($admin)->post(route('admin.memberships.approve', $pending))->assertRedirect()->assertSessionHasNoErrors();

    expect($pending->fresh()->status)->toBe('active')
        ->and($pending->fresh()->payment_status)->toBe('approved')
        ->and((int) $pending->fresh()->starts_at->diffInSeconds($pending->fresh()->ends_at))->toBe(30 * 24 * 60 * 60 - 1)
        ->and($old->fresh()->status)->toBe('active')
        ->and($old->fresh()->ends_at->toDateTimeString())->toBe($oldEndsAt->toDateTimeString())
        ->and($oldBooking->fresh()->payment_status)->toBe('approved')
        ->and($user->fresh()->activeMembership()?->id)->toBe($pending->id);
});

test('expired memberships notify the user once when renewal is due', function () {
    Notification::fake();
    $user = User::factory()->create(['email_verified_at' => now()]);
    $membership = Membership::create([
        'user_id' => $user->id,
        'amount' => 150000,
        'status' => 'active',
        'payment_status' => 'approved',
        'starts_at' => now()->subDays(31),
        'ends_at' => now()->subDay(),
    ]);

    $this->artisan('memberships:process-status')->assertSuccessful();

    expect($membership->fresh()->status)->toBe('expired')
        ->and($membership->fresh()->renewal_notified_at)->not->toBeNull();
    Notification::assertSentTo($user, MembershipRenewalNotification::class);

    $this->artisan('memberships:process-status')->assertSuccessful();
    Notification::assertSentToTimes($user, MembershipRenewalNotification::class, 1);
});

test('membership payment expiry releases its held occurrences', function () {
    $user = User::factory()->create(['email_verified_at' => now()]);
    $membership = Membership::create([
        'user_id' => $user->id,
        'amount' => 100000,
        'status' => 'pending',
        'payment_status' => 'pending',
        'payment_deadline' => now()->subMinute(),
    ]);
    $booking = Booking::create([
        'booking_code' => Booking::generateBookingCode(),
        'user_id' => $user->id,
        'membership_id' => $membership->id,
        'booking_source' => 'membership',
        'lapangan_id' => marketingLapangan()->id,
        'booking_date' => now()->addWeek()->toDateString(),
        'start_time' => '10:00',
        'end_time' => '11:00',
        'duration_hours' => 1,
        'base_price' => 100000,
        'total_price' => 100000,
        'payment_method' => 'transfer',
        'payment_status' => 'pending',
        'payment_deadline' => now()->subMinute(),
        'customer_name' => $user->name,
        'customer_email' => $user->email,
        'customer_phone' => '',
        'validation_code' => 0,
    ]);

    $this->artisan('memberships:process-status')->assertSuccessful();

    expect($membership->fresh()->status)->toBe('cancelled')
        ->and($booking->fresh()->payment_status)->toBe('cancelled');
});

test('membership reservations use lapangan pricing, optional discount, and lock occurrences', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $user = User::factory()->create(['email_verified_at' => now()]);
    $lapangan = marketingLapangan();
    $this->actingAs($user)->post(route('membership.store'), [
        'reservations' => [[
            'lapangan_id' => $lapangan->id,
            'weekday' => 1,
            'start_time' => '10:00',
            'duration_hours' => 2,
        ]],
    ])->assertRedirect()->assertSessionHasNoErrors();

    $membership = $user->memberships()->latest()->firstOrFail();
    $firstOccurrence = now()->startOfWeek()->addWeek();
    $occurrences = collect(range(0, 29))
        ->filter(fn (int $day): bool => $firstOccurrence->copy()->addDays($day)->dayOfWeek === 1)
        ->count();
    expect($membership->subtotal)->toBe(200000 * $occurrences)
        ->and($membership->reservation_start_date?->toDateString())->toBe($firstOccurrence->toDateString());
    expect(Booking::query()->where('membership_id', $membership->id)->where('payment_status', 'pending')->count())->toBe($occurrences);

    $this->actingAs($user)->post(route('membership.submit-payment', $membership))->assertRedirect();
    MembershipSetting::query()->updateOrCreate(['id' => MembershipSetting::ID], ['membership_discount_percentage' => 10]);
    $this->actingAs($admin)->post(route('admin.memberships.approve', $membership))->assertRedirect()->assertSessionHasNoErrors();

    $membership->refresh();
    expect($membership->discount_amount)->toBe((int) floor($membership->subtotal * 0.1))
        ->and($membership->amount)->toBe($membership->subtotal - $membership->discount_amount)
        ->and(Booking::query()->where('membership_id', $membership->id)->count())->toBe($occurrences);
});

test('membership allows unlimited recurring schedules without a membership plan', function () {
    $user = User::factory()->create(['email_verified_at' => now()]);
    $lapangan = marketingLapangan();
    $reservations = collect(range(0, 5))->map(fn (int $weekday): array => [
        'lapangan_id' => $lapangan->id,
        'weekday' => $weekday,
        'start_time' => '10:00',
        'duration_hours' => 1,
    ])->all();

    $this->actingAs($user)->post(route('membership.store'), [
        'reservations' => $reservations,
    ])->assertRedirect()->assertSessionHasNoErrors();

    $membership = $user->memberships()->latest()->firstOrFail();

    expect($membership->reservations()->count())->toBe(6);
});

test('membership slot availability follows the selected lapangan and weekday', function () {
    $user = User::factory()->create(['email_verified_at' => now()]);
    $lapangan = marketingLapangan();

    $response = $this->actingAs($user)->getJson(route('membership.slots', [
        'lapangan_id' => $lapangan->id,
        'start_date' => now()->startOfWeek()->addWeek()->format('Y-m-d'),
        'weekday' => 1,
    ]));

    $response->assertOk()
        ->assertJsonPath('lapangan_id', $lapangan->id)
        ->assertJsonPath('weekday', 1)
        ->assertJsonStructure(['dates', 'slots']);
    expect($response->json('slots'))->not->toBeEmpty();
});

test('membership slots support lapangan operating times with seconds', function () {
    $user = User::factory()->create(['email_verified_at' => now()]);
    $lapangan = marketingLapangan();
    $lapangan->update([
        'operational_start' => '07:00:00',
        'operational_end' => '23:00:00',
    ]);

    $response = $this->actingAs($user)->getJson(route('membership.slots', [
        'lapangan_id' => $lapangan->id,
        'start_date' => now()->startOfWeek()->addWeek()->format('Y-m-d'),
        'weekday' => 1,
    ]));

    $response->assertOk();
    expect($response->json('slots.0.start_time'))->toBe('07:00');
});

test('admin membership table supports search filters and sorting', function () {
    $admin = User::factory()->create(['role' => 'superadmin']);
    $matchedUser = User::factory()->create([
        'name' => 'Alice Membership',
        'email' => 'alice-membership@example.test',
        'email_verified_at' => now(),
    ]);
    $otherUser = User::factory()->create([
        'name' => 'Bob Membership',
        'email' => 'bob-membership@example.test',
        'email_verified_at' => now(),
    ]);
    $membership = Membership::create([
        'user_id' => $matchedUser->id,
        'amount' => 250000,
        'status' => 'active',
        'payment_status' => 'approved',
        'starts_at' => now(),
        'ends_at' => now()->addMonth(),
    ]);
    Membership::create([
        'user_id' => $otherUser->id,
        'amount' => 100000,
        'status' => 'pending',
        'payment_status' => 'pending',
        'starts_at' => now(),
        'ends_at' => now()->addMonth(),
    ]);

    $this->actingAs($admin)
        ->get(route('admin.memberships.index', [
            'search' => 'Alice Membership',
            'status' => 'active',
            'payment_status' => 'approved',
            'sort' => 'amount',
            'direction' => 'asc',
            'per_page' => 1,
        ]))
        ->assertStatus(200)
        ->assertInertia(fn ($page) => $page
            ->component('admin/memberships/index')
            ->where('filters.search', 'Alice Membership')
            ->where('filters.status', 'active')
            ->where('filters.payment_status', 'approved')
            ->where('filters.sort', 'amount')
            ->where('filters.direction', 'asc')
            ->where('memberships.total', 1)
            ->where('memberships.data.0.id', $membership->id)
        );
});

test('only superadmin can update the global membership discount percentage', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $superadmin = User::factory()->create(['role' => 'superadmin']);

    $this->actingAs($admin)
        ->patch(route('admin.memberships.settings.update'), ['membership_discount_percentage' => 15])
        ->assertForbidden();

    $this->actingAs($superadmin)
        ->patch(route('admin.memberships.settings.update'), ['membership_discount_percentage' => 15])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    expect(MembershipSetting::query()->findOrFail(MembershipSetting::ID)->membership_discount_percentage)->toBe(15);

    $this->actingAs($superadmin)
        ->patch(route('admin.memberships.settings.update'), ['membership_discount_percentage' => 101])
        ->assertSessionHasErrors('membership_discount_percentage');
});

test('membership dashboard exposes operational statistics and detail page exposes occurrences', function () {
    $superadmin = User::factory()->create(['role' => 'superadmin']);
    $user = User::factory()->create(['email_verified_at' => now()]);
    $lapangan = marketingLapangan();
    $membership = Membership::create([
        'user_id' => $user->id,
        'amount' => 90000,
        'subtotal' => 100000,
        'discount_value' => 10,
        'discount_amount' => 10000,
        'status' => 'active',
        'payment_status' => 'approved',
        'starts_at' => now()->subDay(),
        'ends_at' => now()->addDays(6),
    ]);
    $reservation = $membership->reservations()->create([
        'lapangan_id' => $lapangan->id,
        'weekday' => 1,
        'start_time' => '10:00',
        'end_time' => '11:00',
        'duration_hours' => 1,
        'price_per_occurrence' => 100000,
        'occurrence_count' => 1,
        'status' => 'active',
    ]);
    $membership->bookings()->create([
        'booking_code' => 'BKG-MEMBERSHIP-DETAIL',
        'user_id' => $user->id,
        'membership_reservation_id' => $reservation->id,
        'booking_source' => 'membership',
        'lapangan_id' => $lapangan->id,
        'booking_date' => now()->addDay()->toDateString(),
        'start_time' => '10:00',
        'end_time' => '11:00',
        'duration_hours' => 1,
        'base_price' => 100000,
        'discount_amount' => 10000,
        'total_price' => 90000,
        'payment_method' => 'transfer',
        'payment_status' => 'approved',
        'customer_name' => $user->name,
        'customer_phone' => '',
        'customer_email' => $user->email,
        'payment_deadline' => now()->addDay(),
        'validation_code' => 0,
    ]);

    $this->actingAs($superadmin)
        ->get(route('admin.memberships.index'))
        ->assertInertia(fn ($page) => $page
            ->component('admin/memberships/index')
            ->where('stats.active', 1)
            ->where('stats.expiring_soon', 1)
            ->where('stats.active_value_this_month', 90000)
        );

    $this->get(route('admin.memberships.show', $membership))
        ->assertInertia(fn ($page) => $page
            ->component('admin/memberships/show')
            ->where('membership.id', $membership->id)
            ->has('membership.reservations', 1)
            ->has('membership.bookings', 1)
        );
});

test('membership management actions follow the membership lifecycle', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $user = User::factory()->create(['email_verified_at' => now()]);
    $active = Membership::create([
        'user_id' => $user->id,
        'amount' => 100000,
        'status' => 'active',
        'payment_status' => 'approved',
        'starts_at' => now()->subDay(),
        'ends_at' => now()->addDays(10),
    ]);

    $this->actingAs($admin)
        ->post(route('admin.memberships.reject', $active), ['rejection_reason' => 'Tidak valid'])
        ->assertSessionHasErrors('membership');
    expect($active->fresh()->status)->toBe('active');

    $this->post(route('admin.memberships.cancel', $active), ['rejection_reason' => 'Permintaan customer'])
        ->assertRedirect()
        ->assertSessionHasNoErrors();
    expect($active->fresh()->status)->toBe('cancelled')
        ->and($active->fresh()->payment_status)->toBe('cancelled');
});

test('membership can start in the current week when the selected slot is free', function () {
    Carbon::setTestNow('2026-10-12 09:00:00');

    $user = User::factory()->create(['email_verified_at' => now()]);
    $lapangan = marketingLapangan();

    $this->actingAs($user)->post(route('membership.store'), [
        'reservations' => [[
            'lapangan_id' => $lapangan->id,
            'weekday' => 1,
            'start_time' => '10:00',
            'duration_hours' => 1,
        ]],
    ])->assertRedirect()->assertSessionHasNoErrors();

    $membership = $user->memberships()->latest()->firstOrFail();
    expect($membership->reservation_start_date?->toDateString())->toBe('2026-10-12')
        ->and($membership->reservations()->firstOrFail()->occurrence_count)->toBe(5);

    Carbon::setTestNow();
});

test('membership starts next week when the selected current-week slot is booked', function () {
    Carbon::setTestNow('2026-10-12 09:00:00');

    $user = User::factory()->create(['email_verified_at' => now()]);
    $lapangan = marketingLapangan();
    Booking::create([
        'booking_code' => 'CURRENT-WEEK-MEMBERSHIP-BOOKING',
        'user_id' => $user->id,
        'lapangan_id' => $lapangan->id,
        'booking_date' => '2026-10-12',
        'start_time' => '10:00',
        'end_time' => '11:00',
        'duration_hours' => 1,
        'base_price' => 100000,
        'total_price' => 100000,
        'payment_method' => 'transfer',
        'payment_status' => 'approved',
        'customer_name' => $user->name,
        'customer_phone' => '081234567890',
        'payment_deadline' => now()->addDay(),
    ]);

    $response = $this->actingAs($user)->getJson(route('membership.slots', [
        'lapangan_id' => $lapangan->id,
        'weekday' => 1,
    ]));

    $slot = collect($response->json('slots'))->firstWhere('start_time', '10:00');
    expect($slot['available'])->toBeTrue()
        ->and($slot['start_date'])->toBe('2026-10-19');

    Carbon::setTestNow();
});

test('verified user can open membership checkout for a specific lapangan', function () {
    $user = User::factory()->create(['email_verified_at' => now()]);
    $lapangan = marketingLapangan();

    $this->actingAs($user)
        ->get(route('membership.checkout', $lapangan))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('membership/checkout')
            ->where('lapangan.id', $lapangan->id)
            ->has('bankAccounts')
        );
});

test('membership checkout creates invoice and recurring booking occurrences', function () {
    $user = User::factory()->create(['email_verified_at' => now()]);
    $lapangan = marketingLapangan();

    $response = $this->actingAs($user)->post(route('membership.store'), [
        'lapangan_id' => $lapangan->id,
        'reservations' => [
            [
                'lapangan_id' => $lapangan->id,
                'weekday' => 1,
                'start_time' => '10:00',
                'duration_hours' => 1,
            ],
        ],
    ]);

    $membership = $user->memberships()->latest()->firstOrFail();

    $response->assertRedirect(route('membership.show', $membership))
        ->assertSessionHas('success', 'Pengajuan membership berhasil dibuat dan slot ditahan sampai pembayaran kedaluwarsa.');
    expect($membership->payment_status)->toBe('pending')
        ->and($membership->reservations()->count())->toBe(1)
        ->and($membership->bookings()->count())->toBeGreaterThan(0);
});

test('membership checkout rejects a duration shorter than one hour with a clear validation message', function () {
    $user = User::factory()->create(['email_verified_at' => now()]);
    $lapangan = marketingLapangan();

    $this->actingAs($user)
        ->post(route('membership.store'), [
            'reservations' => [[
                'lapangan_id' => $lapangan->id,
                'weekday' => 1,
                'start_time' => '10:00',
                'duration_hours' => 0,
            ]],
        ])
        ->assertSessionHasErrors([
            'reservations.0.duration_hours' => 'Durasi setiap jadwal membership harus minimal 1 jam.',
        ]);

    expect($user->memberships()->count())->toBe(0);
});

test('user can create multiple memberships with different schedules', function () {
    $user = User::factory()->create(['email_verified_at' => now()]);
    $lapangan = marketingLapangan();

    $firstResponse = $this->actingAs($user)->post(route('membership.store'), [
        'reservations' => [[
            'lapangan_id' => $lapangan->id,
            'weekday' => 1,
            'start_time' => '10:00',
            'duration_hours' => 1,
        ]],
    ]);
    $firstMembership = $user->memberships()->firstOrFail();

    $secondResponse = $this->actingAs($user)->post(route('membership.store'), [
        'reservations' => [[
            'lapangan_id' => $lapangan->id,
            'weekday' => 2,
            'start_time' => '10:00',
            'duration_hours' => 1,
        ]],
    ]);
    $secondMembership = $user->memberships()
        ->where('id', '!=', $firstMembership->id)
        ->firstOrFail();

    $firstResponse->assertRedirect();
    $secondResponse->assertRedirect();
    expect($user->memberships()->count())->toBe(2)
        ->and($firstMembership->id)->not->toBe($secondMembership->id);
});

test('membership index exposes all active memberships', function () {
    $user = User::factory()->create(['email_verified_at' => now()]);

    Membership::create([
        'user_id' => $user->id,
        'amount' => 100000,
        'status' => 'active',
        'payment_status' => 'approved',
        'starts_at' => now()->subDay(),
        'ends_at' => now()->addDays(29),
    ]);
    Membership::create([
        'user_id' => $user->id,
        'amount' => 150000,
        'status' => 'active',
        'payment_status' => 'approved',
        'starts_at' => now(),
        'ends_at' => now()->addDays(30),
    ]);

    $this->actingAs($user)
        ->getJson(route('membership.data'))
        ->assertOk()
        ->assertJsonCount(2, 'activeMemberships')
        ->assertJsonPath('activeMemberships.0.ends_at', fn ($endsAt) => $endsAt !== null);
});

test('user can create another membership while an existing membership is active', function () {
    $user = User::factory()->create(['email_verified_at' => now()]);
    $lapangan = marketingLapangan();

    Membership::create([
        'user_id' => $user->id,
        'amount' => 100000,
        'status' => 'active',
        'payment_status' => 'approved',
        'starts_at' => now()->subDay(),
        'ends_at' => now()->addDays(29),
    ]);

    $this->actingAs($user)
        ->post(route('membership.store'), [
            'reservations' => [[
                'lapangan_id' => $lapangan->id,
                'weekday' => 1,
                'start_time' => '10:00',
                'duration_hours' => 1,
            ]],
        ])
        ->assertRedirect();

    expect($user->memberships()->count())->toBe(2);
});

test('membership index exposes a membership summary without occurrence details', function () {
    $user = User::factory()->create(['email_verified_at' => now()]);
    $lapangan = marketingLapangan();
    $membership = Membership::create([
        'user_id' => $user->id,
        'amount' => 100000,
        'status' => 'active',
        'payment_status' => 'approved',
        'starts_at' => now(),
        'ends_at' => now()->addDays(30),
    ]);
    $booking = Booking::create([
        'booking_code' => 'MEMBERSHIP-OCCURRENCE-1',
        'user_id' => $user->id,
        'membership_id' => $membership->id,
        'booking_source' => 'membership',
        'lapangan_id' => $lapangan->id,
        'booking_date' => '2026-10-20',
        'start_time' => '20:00',
        'end_time' => '21:00',
        'duration_hours' => 1,
        'base_price' => 100000,
        'total_price' => 100000,
        'payment_method' => 'transfer',
        'payment_status' => 'approved',
        'customer_name' => $user->name,
        'customer_phone' => '081234567890',
        'payment_deadline' => now()->addDay(),
    ]);

    $this->actingAs($user)
        ->getJson(route('membership.data'))
        ->assertOk()
        ->assertJsonPath('membership.id', $membership->id)
        ->assertJsonPath('membership.bookings_count', 1)
        ->assertJsonMissingPath('membership.bookings');
});

test('membership index serves a lightweight shell and an empty JSON state', function () {
    $user = User::factory()->create(['email_verified_at' => now()]);

    $this->actingAs($user)
        ->get(route('membership.index'))
        ->assertInertia(fn ($page) => $page
            ->component('membership/index')
            ->missing('memberships')
            ->missing('activeMemberships')
        );

    $this->actingAs($user)
        ->getJson(route('membership.data'))
        ->assertOk()
        ->assertJsonPath('membership', null)
        ->assertJsonPath('memberships.data', [])
        ->assertJsonPath('activeMemberships', []);
});

test('membership invoice is limited to its owner and payment confirmation updates occurrences', function () {
    Notification::fake();
    $admin = User::factory()->create(['role' => 'superadmin']);
    $user = User::factory()->create(['email_verified_at' => now()]);
    $otherUser = User::factory()->create(['email_verified_at' => now()]);
    $lapangan = marketingLapangan();

    $this->actingAs($user)->post(route('membership.store'), [
        'lapangan_id' => $lapangan->id,
        'reservations' => [[
            'lapangan_id' => $lapangan->id,
            'weekday' => 1,
            'start_time' => '10:00',
            'duration_hours' => 1,
        ]],
    ]);
    $membership = $user->memberships()->latest()->firstOrFail();

    $this->actingAs($otherUser)
        ->get(route('membership.show', $membership))
        ->assertNotFound();

    $this->actingAs($user)
        ->get(route('membership.show', $membership))
        ->assertInertia(fn ($page) => $page
            ->component('membership/invoice')
            ->where('membership.id', $membership->id)
            ->has('membership.reservations')
            ->has('bankAccounts')
        );

    $this->actingAs($user)
        ->post(route('membership.submit-payment', $membership))
        ->assertRedirect();

    expect($membership->fresh()->payment_status)->toBe('pending_validation')
        ->and($membership->bookings()->where('payment_status', 'pending_validation')->count())->toBeGreaterThan(0);
    Notification::assertSentTo($admin, MembershipPaymentSubmittedNotification::class);
});

test('active scheduled banners are exposed publicly and inactive banners are hidden', function () {
    Storage::fake('public');
    $admin = User::factory()->create(['role' => 'admin']);
    $user = User::factory()->create(['role' => 'user', 'email_verified_at' => now()]);

    $this->actingAs($admin)->post(route('admin.banners.store'), [
        'title' => 'Promo Ramadhan',
        'body' => 'Diskon spesial.',
        'image' => UploadedFile::fake()->image('promo.jpg'),
        'alt_text' => 'Promo',
        'placement' => 'home',
        'sort_order' => 1,
        'is_active' => true,
    ])->assertRedirect()->assertSessionHasNoErrors();

    $banner = Banner::firstOrFail();
    $this->actingAs($user)->getJson(route('home.data'))->assertJsonPath('banners.0.title', 'Promo Ramadhan');

    $banner->update(['is_active' => false]);
    $this->actingAs($user)->getJson(route('home.data'))->assertJsonPath('banners', []);
});

test('banner can be created with external image url and updated or deleted', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    // Validation error when neither image nor image_url is provided
    $this->actingAs($admin)->post(route('admin.banners.store'), [
        'title' => 'Promo Invalid',
        'placement' => 'home',
        'sort_order' => 0,
        'is_active' => true,
    ])->assertSessionHasErrors('image');

    // Create with image_url
    $this->actingAs($admin)->post(route('admin.banners.store'), [
        'title' => 'Promo Website',
        'body' => 'Gunakan URL eksternal',
        'image_url' => 'https://images.unsplash.com/photo-1574629810360-7efbbe195018',
        'placement' => 'home',
        'sort_order' => 2,
        'is_active' => true,
    ])->assertRedirect()->assertSessionHasNoErrors();

    $banner = Banner::where('title', 'Promo Website')->firstOrFail();
    expect($banner->image_path)->toBe('https://images.unsplash.com/photo-1574629810360-7efbbe195018');

    // Update banner
    $this->actingAs($admin)->put(route('admin.banners.update', $banner), [
        'title' => 'Promo Website Updated',
        'image_url' => 'https://images.unsplash.com/photo-example',
        'placement' => 'home',
        'sort_order' => 5,
        'is_active' => false,
    ])->assertRedirect()->assertSessionHasNoErrors();

    expect($banner->fresh()->title)->toBe('Promo Website Updated')
        ->and($banner->fresh()->image_path)->toBe('https://images.unsplash.com/photo-example')
        ->and($banner->fresh()->is_active)->toBeFalse();

    // Toggle banner
    $this->actingAs($admin)->post(route('admin.banners.toggle', $banner))->assertRedirect();
    expect($banner->fresh()->is_active)->toBeTrue();

    // Delete banner
    $this->actingAs($admin)->delete(route('admin.banners.destroy', $banner))->assertRedirect();
    expect(Banner::find($banner->id))->toBeNull();
});

test('membership cannot be renewed if expiration is more than 7 days away', function () {
    $user = User::factory()->create(['email_verified_at' => now()]);
    $lapangan = marketingLapangan();

    $this->actingAs($user)->post(route('membership.store'), [
        'reservations' => [[
            'lapangan_id' => $lapangan->id,
            'weekday' => 1,
            'start_time' => '10:00',
            'duration_hours' => 1,
        ]],
    ])->assertRedirect()->assertSessionHasNoErrors();

    $membership = $user->memberships()->latest()->firstOrFail();
    $membership->update([
        'status' => 'active',
        'payment_status' => 'paid',
        'ends_at' => now()->addDays(20),
    ]);

    expect($membership->canBeRenewed())->toBeFalse();

    $this->actingAs($user)
        ->post(route('membership.renew', $membership))
        ->assertSessionHasErrors(['membership']);

    expect($user->memberships()->count())->toBe(1);
});

test('membership can be renewed if expiration is within 7 days', function () {
    $user = User::factory()->create(['email_verified_at' => now()]);
    $lapangan = marketingLapangan();

    $this->actingAs($user)->post(route('membership.store'), [
        'reservations' => [[
            'lapangan_id' => $lapangan->id,
            'weekday' => 1,
            'start_time' => '10:00',
            'duration_hours' => 1,
        ]],
    ])->assertRedirect()->assertSessionHasNoErrors();

    $membership = $user->memberships()->latest()->firstOrFail();
    $membership->bookings()->delete();
    $membership->update([
        'status' => 'active',
        'payment_status' => 'paid',
        'ends_at' => now()->addDays(5),
    ]);

    expect($membership->canBeRenewed())->toBeTrue();

    $this->actingAs($user)
        ->post(route('membership.renew', $membership))
        ->assertSessionHasNoErrors()
        ->assertRedirect();

    expect($user->memberships()->count())->toBe(2);
    $renewed = $user->memberships()->where('id', '!=', $membership->id)->firstOrFail();
    expect($renewed->status)->toBe('pending');
});

test('expired membership can be renewed', function () {
    $user = User::factory()->create(['email_verified_at' => now()]);
    $lapangan = marketingLapangan();

    $this->actingAs($user)->post(route('membership.store'), [
        'reservations' => [[
            'lapangan_id' => $lapangan->id,
            'weekday' => 1,
            'start_time' => '10:00',
            'duration_hours' => 1,
        ]],
    ])->assertRedirect()->assertSessionHasNoErrors();

    $membership = $user->memberships()->latest()->firstOrFail();
    $membership->bookings()->delete();
    $membership->update([
        'status' => 'expired',
        'payment_status' => 'paid',
        'ends_at' => now()->subDays(2),
    ]);

    expect($membership->canBeRenewed())->toBeTrue();

    $this->actingAs($user)
        ->post(route('membership.renew', $membership))
        ->assertSessionHasNoErrors()
        ->assertRedirect();

    expect($user->memberships()->count())->toBe(2);
});

test('membership checkout exposes active discount percentage configured by admin', function () {
    $user = User::factory()->create(['email_verified_at' => now()]);
    $lapangan = marketingLapangan();
    MembershipSetting::query()->updateOrCreate(['id' => MembershipSetting::ID], ['membership_discount_percentage' => 15]);

    $this->actingAs($user)
        ->get(route('membership.checkout', $lapangan))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('membership/checkout')
            ->where('membershipDiscountPercentage', 15)
            ->has('lapangan')
            ->has('bankAccounts')
        );
});

test('membership store applies configured discount immediately to invoice and bookings', function () {
    $user = User::factory()->create(['email_verified_at' => now()]);
    $admin = User::factory()->create(['role' => 'admin']);
    $lapangan = marketingLapangan();
    MembershipSetting::query()->updateOrCreate(['id' => MembershipSetting::ID], ['membership_discount_percentage' => 20]);

    $this->actingAs($user)->post(route('membership.store'), [
        'reservations' => [[
            'lapangan_id' => $lapangan->id,
            'weekday' => 1,
            'start_time' => '10:00',
            'duration_hours' => 2,
        ]],
    ])->assertRedirect()->assertSessionHasNoErrors();

    $membership = $user->memberships()->latest()->firstOrFail();
    $expectedSubtotal = $membership->subtotal;
    $expectedDiscount = (int) floor($expectedSubtotal * 0.20);
    $expectedAmount = $expectedSubtotal - $expectedDiscount;

    expect($membership->discount_value)->toBe(20)
        ->and($membership->discount_amount)->toBe($expectedDiscount)
        ->and($membership->amount)->toBe($expectedAmount);

    $booking = Booking::query()->where('membership_id', $membership->id)->firstOrFail();
    expect($booking->discount_amount)->toBeGreaterThan(0)
        ->and($booking->total_price)->toBe($booking->base_price - $booking->discount_amount);

    $this->actingAs($user)
        ->get(route('membership.show', $membership))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('membership/invoice')
            ->where('membership.id', $membership->id)
            ->where('membership.discount_value', 20)
            ->where('membership.discount_amount', $expectedDiscount)
            ->where('membership.amount', $expectedAmount)
        );

    $this->actingAs($user)->post(route('membership.submit-payment', $membership))->assertRedirect();
    $this->actingAs($admin)->post(route('admin.memberships.approve', $membership))->assertRedirect()->assertSessionHasNoErrors();

    $membership->refresh();
    expect($membership->status)->toBe('active')
        ->and($membership->discount_amount)->toBe($expectedDiscount)
        ->and($membership->amount)->toBe($expectedAmount);
});
