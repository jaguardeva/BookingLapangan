<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

#[Fillable([
    'booking_code',
    'user_id',
    'lapangan_id',
    'booking_date',
    'start_time',
    'end_time',
    'duration_hours',
    'base_price',
    'validation_code',
    'total_price',
    'payment_method',
    'payment_status',
    'customer_name',
    'customer_phone',
    'notes',
    'user_submitted_code',
    'rejection_reason',
    'validated_by',
    'validated_at',
    'payment_deadline',
    'cancelled_at',
])]
class Booking extends Model
{
    use HasFactory;

    protected function casts(): array
    {
        return [
            'booking_date' => 'date',
            'duration_hours' => 'integer',
            'base_price' => 'integer',
            'validation_code' => 'integer',
            'total_price' => 'integer',
            'user_submitted_code' => 'integer',
            'validated_at' => 'datetime',
            'payment_deadline' => 'datetime',
            'cancelled_at' => 'datetime',
        ];
    }

    public static function generateBookingCode(): string
    {
        $date = now()->format('Ymd');
        $random = strtoupper(substr(uniqid(), -4));

        return "BKG-{$date}-{$random}";
    }

    public static function generateValidationCode(): int
    {
        // 3-digit validation code (100 - 999)
        return random_int(100, 999);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function lapangan(): BelongsTo
    {
        return $this->belongsTo(Lapangan::class);
    }

    public function validator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'validated_by');
    }

    public function review(): HasOne
    {
        return $this->hasOne(Review::class);
    }

    /**
     * User can only cancel booking at least 24 hours before game start time
     */
    public function canBeCancelledByUser(): bool
    {
        if (in_array($this->payment_status, ['cancelled', 'rejected'])) {
            return false;
        }

        $gameDateTime = Carbon::parse($this->booking_date->format('Y-m-d').' '.$this->start_time);

        return now()->diffInHours($gameDateTime, false) >= 24;
    }

    public function isPending(): bool
    {
        return $this->payment_status === 'pending';
    }

    public function isPendingValidation(): bool
    {
        return $this->payment_status === 'pending_validation';
    }

    public function isApproved(): bool
    {
        return $this->payment_status === 'approved';
    }

    public function isRejected(): bool
    {
        return $this->payment_status === 'rejected';
    }

    public function isCancelled(): bool
    {
        return $this->payment_status === 'cancelled';
    }
}
