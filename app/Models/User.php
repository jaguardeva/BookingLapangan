<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Notifications\ResetPasswordNotification;
use App\Services\EmailVerificationOtpService;
use Database\Factories\UserFactory;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;
use Laravel\Fortify\TwoFactorAuthenticatable;

/**
 * @property string $id
 * @property string $name
 * @property string $email
 * @property string|null $google_id
 * @property Carbon|null $email_verified_at
 * @property string $password
 * @property Carbon|null $password_set_at
 * @property string|null $two_factor_secret
 * @property string|null $two_factor_recovery_codes
 * @property Carbon|null $two_factor_confirmed_at
 * @property string|null $remember_token
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property int $bookings_count
 * @property int $approved_bookings_count
 * @property int $pending_bookings_count
 * @property int $cancelled_or_rejected_bookings_count
 */
#[Fillable(['name', 'email', 'password', 'password_set_at', 'role', 'google_id'])]
#[Hidden(['password', 'two_factor_secret', 'two_factor_recovery_codes', 'remember_token'])]
class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, HasUuids, Notifiable, TwoFactorAuthenticatable;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'password_set_at' => 'datetime',
            'two_factor_confirmed_at' => 'datetime',
            'points_balance' => 'integer',
        ];
    }

    public function isSuperAdmin(): bool
    {
        return $this->role === 'superadmin';
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isUser(): bool
    {
        return $this->role === 'user';
    }

    public function hasLocalPassword(): bool
    {
        return $this->password_set_at !== null;
    }

    public function canManageLapangan(Lapangan $lapangan): bool
    {
        if ($this->isSuperAdmin()) {
            return true;
        }

        if ($this->isAdmin()) {
            return $this->assignedLapangans()->where('lapangans.id', $lapangan->id)->exists();
        }

        return false;
    }

    /**
     * @return HasMany<Booking, $this>
     */
    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }

    /** @return HasOne<UserProfile, $this> */
    public function profile(): HasOne
    {
        return $this->hasOne(UserProfile::class);
    }

    /** @return array{percentage: int, is_complete: bool, missing: array<int, string>} */
    public function profileCompletion(): array
    {
        $profile = $this->profile;
        $checks = [
            'email' => $this->hasVerifiedEmail(),
            'avatar' => filled($profile?->avatar_path),
            'phone' => filled($profile?->phone),
        ];

        $missingLabels = ['email' => 'Email terverifikasi', 'avatar' => 'Foto profil', 'phone' => 'Nomor WhatsApp/telepon'];
        $missing = array_values(array_map(fn (string $key): string => $missingLabels[$key], array_keys(array_filter($checks, fn (bool $complete): bool => ! $complete))));

        return [
            'percentage' => (int) round((count(array_filter($checks)) / count($checks)) * 100),
            'is_complete' => $missing === [],
            'missing' => $missing,
        ];
    }

    /**
     * @return HasMany<PointTransaction, $this>
     */
    public function pointTransactions(): HasMany
    {
        return $this->hasMany(PointTransaction::class);
    }

    public function availablePoints(): int
    {
        $reservedPoints = $this->bookings()
            ->where('payment_method', 'transfer')
            ->whereIn('payment_status', ['pending', 'pending_validation'])
            ->sum('points_redeemed');

        return max(0, $this->points_balance - $reservedPoints);
    }

    /**
     * @return BelongsToMany<Lapangan, $this>
     */
    public function assignedLapangans(): BelongsToMany
    {
        return $this->belongsToMany(Lapangan::class, 'admin_lapangan');
    }

    /**
     * @return HasMany<Review, $this>
     */
    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }

    /**
     * @return HasMany<ActivityLog, $this>
     */
    public function activityLogs(): HasMany
    {
        return $this->hasMany(ActivityLog::class);
    }

    public function sendEmailVerificationNotification(): void
    {
        app(EmailVerificationOtpService::class)->issueAndNotify($this);
    }

    public function sendPasswordResetNotification($token): void
    {
        $this->notify(new ResetPasswordNotification($token));
    }
}
