<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\PasswordUpdateRequest;
use App\Http\Requests\Settings\TwoFactorAuthenticationRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password as PasswordBroker;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;
use Laravel\Fortify\Features;

class SecurityController extends Controller
{
    /**
     * Show the user's security settings page.
     */
    public function edit(TwoFactorAuthenticationRequest $request): Response
    {
        $props = [
            'canManageTwoFactor' => Features::canManageTwoFactorAuthentication(),
            'passwordRules' => Password::defaults()->toPasswordRulesString(),
            'hasLocalPassword' => $request->user()->hasLocalPassword(),
            'passwordResetEmail' => $request->user()->email,
        ];

        if (Features::canManageTwoFactorAuthentication()) {
            $request->ensureStateIsValid();

            $props['twoFactorEnabled'] = $request->user()->hasEnabledTwoFactorAuthentication();
            $props['requiresConfirmation'] = Features::optionEnabled(Features::twoFactorAuthentication(), 'confirm');
        }

        $page = $request->user()->isAdmin() || $request->user()->isSuperAdmin()
            ? 'settings/security'
            : 'security';

        return Inertia::render($page, $props);
    }

    /**
     * Update the user's password.
     */
    public function update(PasswordUpdateRequest $request): RedirectResponse
    {
        $request->user()->update([
            'password' => $request->password,
            'password_set_at' => now(),
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Password updated.')]);

        return back();
    }

    public function requestPasswordReset(Request $request): RedirectResponse
    {
        abort_unless($request->user()->hasLocalPassword() === false, 422, 'Password lokal akun ini sudah tersedia.');

        PasswordBroker::sendResetLink(['email' => $request->user()->email]);

        return back()->with('success', 'Tautan untuk membuat password lokal telah dikirim ke email Anda.');
    }
}
