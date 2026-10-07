<?php

namespace App\Services;

use App\Models\EmailVerificationOtp;
use App\Models\User;
use App\Notifications\VerifyEmailNotification;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class EmailVerificationOtpService
{
    private const int MAX_ATTEMPTS = 5;

    public function issueAndNotify(User $user): void
    {
        $lastOtp = EmailVerificationOtp::query()
            ->where('user_id', $user->id)
            ->latest()
            ->first();

        if ($lastOtp?->created_at?->greaterThan(now()->subSeconds(60))) {
            throw ValidationException::withMessages([
                'code' => 'Kode OTP baru dapat dikirim setelah 60 detik.',
            ]);
        }

        EmailVerificationOtp::query()
            ->where('user_id', $user->id)
            ->whereNull('used_at')
            ->update(['used_at' => now()]);

        $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        EmailVerificationOtp::create([
            'user_id' => $user->id,
            'code_hash' => Hash::make($code),
            'expires_at' => now()->addMinutes(10),
        ]);

        $user->notify(new VerifyEmailNotification($code));
    }

    public function verify(User $user, string $code): void
    {
        $otp = EmailVerificationOtp::query()
            ->where('user_id', $user->id)
            ->whereNull('used_at')
            ->latest()
            ->first();

        if ($otp === null || $otp->isExpired()) {
            throw ValidationException::withMessages([
                'code' => 'Kode OTP sudah kedaluwarsa. Silakan kirim ulang kode baru.',
            ]);
        }

        if ($otp->attempts >= self::MAX_ATTEMPTS) {
            throw ValidationException::withMessages([
                'code' => 'Terlalu banyak percobaan. Silakan kirim ulang kode OTP baru.',
            ]);
        }

        $otp->increment('attempts');

        if (! Hash::check($code, $otp->code_hash)) {
            throw ValidationException::withMessages([
                'code' => 'Kode OTP salah. Silakan periksa kembali email Anda.',
            ]);
        }

        $otp->update(['used_at' => now()]);
    }
}
