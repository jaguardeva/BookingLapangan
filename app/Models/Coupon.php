<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'code', 'discount_type', 'discount_value', 'minimum_order_amount', 'maximum_discount_amount',
    'usage_limit', 'per_user_limit', 'used_count', 'starts_at', 'ends_at', 'is_active',
])]
class Coupon extends Model
{
    use HasUuids;

    protected function casts(): array
    {
        return [
            'discount_value' => 'decimal:2',
            'minimum_order_amount' => 'integer',
            'maximum_discount_amount' => 'integer',
            'usage_limit' => 'integer',
            'per_user_limit' => 'integer',
            'used_count' => 'integer',
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
            'is_active' => 'boolean',
        ];
    }

    /** @return HasMany<CouponRedemption, $this> */
    public function redemptions(): HasMany
    {
        return $this->hasMany(CouponRedemption::class);
    }

    public function isCurrentlyValid(): bool
    {
        $now = now();
        $startsAt = $this->getRawOriginal('starts_at');
        $endsAt = $this->getRawOriginal('ends_at');

        return $this->is_active
            && ($startsAt === null || Carbon::parse($startsAt)->lte($now))
            && ($endsAt === null || Carbon::parse($endsAt)->gte($now));
    }
}
