<?php

namespace App\Models;

use Database\Factories\PointTransactionFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['user_id', 'booking_id', 'membership_id', 'type', 'points', 'balance_after'])]
class PointTransaction extends Model
{
    /** @use HasFactory<PointTransactionFactory> */
    use HasFactory, HasUuids;

    protected $appends = [
        'title',
        'description',
        'reference_url',
    ];

    protected function casts(): array
    {
        return [
            'points' => 'integer',
            'balance_after' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }

    public function membership(): BelongsTo
    {
        return $this->belongsTo(Membership::class);
    }

    public function getTitleAttribute(): string
    {
        if ($this->type === 'earned') {
            if ($this->booking_id) {
                return 'Kode Unik Booking';
            }
            if ($this->membership_id) {
                return 'Kode Unik Membership';
            }

            return 'Poin Diperoleh';
        }

        if ($this->booking_id) {
            return 'Potongan Booking';
        }
        if ($this->membership_id) {
            return 'Potongan Membership';
        }

        return 'Penukaran Poin';
    }

    public function getDescriptionAttribute(): string
    {
        if ($this->type === 'earned') {
            if ($this->booking) {
                $lapanganName = $this->booking->lapangan?->name;
                $code = $this->booking->booking_code;

                return "Poin dari 3 digit kode unik transfer booking #{$code}".($lapanganName ? " ({$lapanganName})" : '');
            }
            if ($this->membership) {
                return 'Poin dari 3 digit kode unik transfer membership';
            }

            return 'Poin ditambahkan ke akun Anda.';
        }

        if ($this->booking) {
            $lapanganName = $this->booking->lapangan?->name;
            $code = $this->booking->booking_code;

            return "Penggunaan poin sebagai potongan harga booking #{$code}".($lapanganName ? " ({$lapanganName})" : '');
        }
        if ($this->membership) {
            return 'Penggunaan poin sebagai potongan harga membership';
        }

        return 'Poin digunakan untuk transaksi.';
    }

    public function getReferenceUrlAttribute(): ?string
    {
        if ($this->booking) {
            return route('booking.show', ['booking_code' => $this->booking->booking_code], false);
        }
        if ($this->membership_id) {
            return route('membership.show', ['membership' => $this->membership_id], false);
        }

        return null;
    }
}
