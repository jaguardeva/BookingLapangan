<?php

use App\Models\Booking;
use App\Models\Category;
use App\Models\Coupon;
use App\Models\CouponRedemption;
use App\Models\Lapangan;
use App\Models\User;

beforeEach(function () {
    $this->admin = User::factory()->create(['role' => 'superadmin']);
    $category = Category::create(['name' => 'Coupon Test', 'slug' => 'coupon-test']);
    $this->lapangan = Lapangan::create([
        'category_id' => $category->id,
        'name' => 'Lapangan Coupon Test',
        'slug' => 'lapangan-coupon-test',
        'price_per_hour' => 100000,
        'operational_start' => '07:00',
        'operational_end' => '23:00',
        'slot_duration_minutes' => 60,
        'is_active' => true,
    ]);
});

test('admin coupon page provides filtered data and statistics', function () {
    Coupon::create([
        'code' => 'HEMAT10',
        'discount_type' => 'percentage',
        'discount_value' => 10,
        'minimum_order_amount' => 100000,
        'used_count' => 3,
        'is_active' => true,
    ]);
    Coupon::create([
        'code' => 'OFF50K',
        'discount_type' => 'fixed',
        'discount_value' => 50000,
        'minimum_order_amount' => 200000,
        'is_active' => false,
    ]);

    $this->actingAs($this->admin)
        ->get(route('admin.coupons.index', ['search' => 'hemat', 'status' => 'active', 'sort' => 'used_count', 'direction' => 'desc']))
        ->assertInertia(fn ($page) => $page
            ->component('admin/coupons/index')
            ->has('coupons.data', 1)
            ->where('coupons.data.0.code', 'HEMAT10')
            ->where('filters.search', 'hemat')
            ->where('filters.status', 'active')
            ->where('filters.sort', 'used_count')
            ->where('stats.total', 2)
            ->where('stats.active', 1)
            ->where('stats.inactive', 1)
            ->where('stats.total_usage', 3));
});

test('admin can create update toggle and delete an unused coupon', function () {
    $this->actingAs($this->admin);

    $this->post(route('admin.coupons.store'), [
        'code' => 'hemat20',
        'discount_type' => 'percentage',
        'discount_value' => 20,
        'minimum_order_amount' => 100000,
        'maximum_discount_amount' => 50000,
        'usage_limit' => 10,
        'per_user_limit' => 2,
        'starts_at' => now()->toDateString(),
        'ends_at' => now()->addMonth()->toDateString(),
        'is_active' => true,
    ])->assertRedirect()->assertSessionHas('success');

    $coupon = Coupon::query()->where('code', 'HEMAT20')->firstOrFail();
    expect($coupon->discount_value)->toBe('20.00');

    $this->put(route('admin.coupons.update', $coupon), [
        'code' => 'HEMAT25',
        'discount_type' => 'percentage',
        'discount_value' => 25,
        'minimum_order_amount' => 150000,
        'maximum_discount_amount' => null,
        'usage_limit' => null,
        'per_user_limit' => null,
        'starts_at' => null,
        'ends_at' => null,
        'is_active' => true,
    ])->assertRedirect()->assertSessionHas('success');

    $this->post(route('admin.coupons.toggle', $coupon))->assertRedirect();
    expect($coupon->fresh()->is_active)->toBeFalse();

    $this->delete(route('admin.coupons.destroy', $coupon))->assertRedirect();
    $this->assertDatabaseMissing('coupons', ['id' => $coupon->id]);
});

test('used coupon cannot be deleted', function () {
    $coupon = Coupon::create([
        'code' => 'USED10',
        'discount_type' => 'percentage',
        'discount_value' => 10,
        'minimum_order_amount' => 0,
        'used_count' => 1,
        'is_active' => true,
    ]);
    $user = User::factory()->create();
    $booking = Booking::create([
        'booking_code' => 'COUPON-USED-001',
        'user_id' => $user->id,
        'lapangan_id' => $this->lapangan->id,
        'booking_date' => now()->toDateString(),
        'start_time' => '10:00',
        'end_time' => '11:00',
        'duration_hours' => 1,
        'base_price' => 100000,
        'validation_code' => 123,
        'total_price' => 90000,
        'payment_method' => 'transfer',
        'payment_status' => 'pending',
        'customer_name' => $user->name,
        'customer_phone' => '081234567890',
        'payment_deadline' => now()->addHour(),
    ]);
    CouponRedemption::create([
        'coupon_id' => $coupon->id,
        'user_id' => $user->id,
        'booking_id' => $booking->id,
        'discount_amount' => 10000,
        'reserved_at' => now(),
    ]);

    $this->actingAs($this->admin)
        ->delete(route('admin.coupons.destroy', $coupon))
        ->assertStatus(422);

    $this->assertDatabaseHas('coupons', ['id' => $coupon->id]);
});
