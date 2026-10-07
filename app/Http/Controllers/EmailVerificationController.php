<?php

namespace App\Http\Controllers;

use App\Services\EmailVerificationOtpService;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EmailVerificationController extends Controller
{
    public function __construct(private EmailVerificationOtpService $otpService) {}

    public function notice(Request $request): Response|RedirectResponse
    {
        if ($request->user()->hasVerifiedEmail()) {
            return redirect()->route('dashboard');
        }

        return Inertia::render('auth/verify-email', [
            'status' => $request->session()->get('status'),
        ]);
    }

    public function send(Request $request): RedirectResponse
    {
        $user = $request->user();

        if ($user->hasVerifiedEmail()) {
            return redirect()->route('dashboard');
        }

        $this->otpService->issueAndNotify($user);

        return back()->with('status', 'verification-otp-sent');
    }

    public function verify(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'digits:6'],
        ]);

        $user = $request->user();

        if ($user->hasVerifiedEmail()) {
            return redirect()->route('dashboard');
        }

        $this->otpService->verify($user, $validated['code']);

        if ($user->markEmailAsVerified()) {
            event(new Verified($user));
        }

        return redirect()->route('dashboard', ['verified' => 1])
            ->with('success', 'Email berhasil diverifikasi! Selamat datang di '.config('app.name').'.');
    }
}
