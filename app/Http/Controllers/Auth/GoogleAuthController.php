<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Laravel\Socialite\AbstractUser;
use Laravel\Socialite\Facades\Socialite;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

class GoogleAuthController extends Controller
{
    public function redirect(): Response
    {
        return Socialite::driver('google')->redirect();
    }

    public function callback(): RedirectResponse
    {
        try {
            $googleUser = Socialite::driver('google')->user();
        } catch (Throwable $exception) {
            Log::warning('Google authentication failed.', ['exception' => $exception]);

            return to_route('login')->withErrors([
                'email' => 'Login dengan Google gagal. Silakan coba lagi.',
            ]);
        }

        $email = Str::lower(trim((string) $googleUser->getEmail()));
        $googleId = (string) $googleUser->getId();
        $rawGoogleUser = $googleUser instanceof AbstractUser ? $googleUser->getRaw() : [];
        $emailVerified = filter_var(
            data_get($rawGoogleUser, 'email_verified', false),
            FILTER_VALIDATE_BOOL,
            FILTER_NULL_ON_FAILURE,
        );

        if ($email === '' || $googleId === '' || $emailVerified === false) {
            return to_route('login')->withErrors([
                'email' => 'Akun Google harus memiliki email yang terverifikasi.',
            ]);
        }

        $user = User::query()->where('google_id', $googleId)->first();

        if (! $user) {
            $user = User::query()->where('email', $email)->first();

            if ($user?->google_id && $user->google_id !== $googleId) {
                return to_route('login')->withErrors([
                    'email' => 'Email Google tersebut sudah terhubung ke akun lain.',
                ]);
            }
        }

        if (! $user) {
            $user = User::create([
                'name' => $googleUser->getName() ?: $email,
                'email' => $email,
                'password' => Hash::make(Str::random(64)),
                'password_set_at' => null,
                'role' => 'user',
                'google_id' => $googleId,
            ]);
            $user->forceFill(['email_verified_at' => now()])->save();
            $user->profile()->create();
        } else {
            $user->forceFill([
                'google_id' => $googleId,
                'email_verified_at' => $user->email_verified_at ?? now(),
            ])->save();
        }

        $request = request();
        $request->session()->regenerate();

        if ($user->hasEnabledTwoFactorAuthentication()) {
            $request->session()->put([
                'login.id' => $user->getAuthIdentifier(),
                'login.remember' => false,
            ]);

            return to_route('two-factor.login');
        }

        Auth::login($user, remember: false);

        return to_route('dashboard');
    }
}
