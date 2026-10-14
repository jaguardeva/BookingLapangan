<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'user_id', 'reservation_month', 'reservation_start_date', 'amount', 'subtotal',
    'discount_value', 'discount_amount', 'status', 'payment_method', 'payment_status',
    'validation_code', 'user_submitted_code', 'rejection_reason', 'validated_by', 'validated_at',
    'payment_deadline', 'starts_at', 'ends_at', 'renewal_notified_at', 'approved_at',
])]
class Membership extends Model
{
    use HasUuids;

    protected function casts(): array
    {
        return [
            'reservation_month' => 'date:Y-m-d',
            'reservation_start_date' => 'date:Y-m-d',
            'amount' => 'integer',
            'subtotal' => 'integer',
            'discount_value' => 'integer',
            'discount_amount' => 'integer',
            'validation_code' => 'integer',
            'user_submitted_code' => 'integer',
            'validated_at' => 'datetime',
            'payment_deadline' => 'datetime',
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
            'renewal_notified_at' => 'datetime',
            'approved_at' => 'datetime',
        ];
    }

    public static function generateValidationCode(): int
    {
        return random_int(100, 999);
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return BelongsTo<User, $this> */
    public function validator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'validated_by');
    }

    /** @return HasMany<MembershipReservation, $this> */
    public function reservations(): HasMany
    {
        return $this->hasMany(MembershipReservation::class);
    }

    /** @return HasMany<Booking, $this> */
    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }

    public function isActive(): bool
    {
        $endsAt = $this->getRawOriginal('ends_at');

        return $this->status === 'active'
            && $endsAt !== null
            && Carbon::parse($endsAt)->isFuture();
    }

    public function canBeRenewed(): bool
    {
        if ($this->status === 'expired') {
            return true;
        }

        if ($this->status !== 'active' || $this->ends_at === null) {
            return false;
        }

        $endsAt = Carbon::parse($this->ends_at);

        return now()->gte($endsAt->subDays(7));
    }
}
