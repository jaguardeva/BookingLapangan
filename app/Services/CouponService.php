<?php

namespace App\Services;

use App\Models\Booking;
use App\Models\Coupon;
use App\Models\CouponRedemption;
use App\Models\User;
use Illuminate\Validation\ValidationException;

class CouponService
{
    /** @return array{coupon: Coupon|null, discount: int} */
    public function resolve(?string $code, User $user, int $subtotal): array
    {
        if (blank($code)) {
            return ['coupon' => null, 'discount' => 0];
        }

        $coupon = Coupon::query()->where('code', strtoupper(trim($code)))->lockForUpdate()->first();

        if ($coupon === null || ! $coupon->isCurrentlyValid()) {
            throw ValidationException::withMessages(['coupon_code' => 'Kode kupon tidak valid atau sudah tidak berlaku.']);
        }

        if ($subtotal < $coupon->minimum_order_amount) {
            throw ValidationException::withMessages([
                'coupon_code' => 'Nilai booking belum memenuhi minimum penggunaan kupon.',
            ]);
        }

        $activeUserRedemptions = $coupon->redemptions()
            ->whereBelongsTo($user)
            ->whereIn('status', ['reserved', 'consumed'])
            ->count();

        if ($coupon->per_user_limit !== null && $activeUserRedemptions >= $coupon->per_user_limit) {
            throw ValidationException::withMessages(['coupon_code' => 'Batas penggunaan kupon Anda sudah tercapai.']);
        }

        $discount = $coupon->discount_type === 'percentage'
            ? (int) floor($subtotal * ((float) $coupon->discount_value / 100))
            : (int) $coupon->discount_value;

        if ($coupon->maximum_discount_amount !== null) {
            $discount = min($discount, $coupon->maximum_discount_amount);
        }

        return ['coupon' => $coupon, 'discount' => min($discount, $subtotal)];
    }

    public function reserve(Coupon $coupon, User $user, Booking $booking, int $discount): CouponRedemption
    {
        $coupon = Coupon::query()->whereKey($coupon->id)->lockForUpdate()->firstOrFail();

        $reservedCount = $coupon->redemptions()->whereIn('status', ['reserved', 'consumed'])->count();
        if ($coupon->usage_limit !== null && $reservedCount >= $coupon->usage_limit) {
            throw ValidationException::withMessages(['coupon_code' => 'Kupon baru saja habis digunakan.']);
        }

        return $coupon->redemptions()->create([
            'user_id' => $user->id,
            'booking_id' => $booking->id,
            'discount_amount' => $discount,
            'status' => 'reserved',
            'reserved_at' => now(),
        ]);
    }

    public function consume(CouponRedemption $redemption): void
    {
        if ($redemption->status !== 'reserved') {
            return;
        }

        $redemption->update(['status' => 'consumed', 'consumed_at' => now()]);
        $redemption->coupon()->increment('used_count');
    }

    public function releaseForBooking(Booking $booking): void
    {
        $redemption = CouponRedemption::query()->whereBelongsTo($booking)->where('status', 'reserved')->first();

        $redemption?->update(['status' => 'released', 'released_at' => now()]);
    }
}
