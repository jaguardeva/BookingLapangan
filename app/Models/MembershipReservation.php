<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'membership_id', 'lapangan_id', 'weekday', 'start_time', 'end_time',
    'duration_hours', 'price_per_occurrence', 'occurrence_count', 'status',
])]
class MembershipReservation extends Model
{
    use HasUuids;

    protected function casts(): array
    {
        return [
            'weekday' => 'integer',
            'duration_hours' => 'integer',
            'price_per_occurrence' => 'integer',
            'occurrence_count' => 'integer',
        ];
    }

    /** @return BelongsTo<Membership, $this> */
    public function membership(): BelongsTo
    {
        return $this->belongsTo(Membership::class);
    }

    /** @return BelongsTo<Lapangan, $this> */
    public function lapangan(): BelongsTo
    {
        return $this->belongsTo(Lapangan::class);
    }

    /** @return HasMany<Booking, $this> */
    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }
}
