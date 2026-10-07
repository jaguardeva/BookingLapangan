<?php

use App\Models\EmailVerificationOtp;
use App\Models\User;
use App\Notifications\VerifyEmailNotification;
use Illuminate\Auth\Events\Verified;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;

test('email verification screen can be rendered', function () {
    $user = User::factory()->unverified()->create();

    $this->actingAs($user)->get(route('verification.notice'))->assertOk();
});

test('email can be verified with the emailed OTP', function () {
    $user = User::factory()->unverified()->create();
    Notification::fake();
    Event::fake();

    $this->actingAs($user)->post(route('verification.send'));

    $code = null;
    Notification::assertSentTo($user, VerifyEmailNotification::class, function (VerifyEmailNotification $notification) use (&$code): bool {
        $code = $notification->code;

        return true;
    });

    $response = $this->actingAs($user)->post(route('verification.verify'), ['code' => $code]);

    Event::assertDispatched(Verified::class);
    expect($user->fresh()->hasVerifiedEmail())->toBeTrue();
    $response->assertRedirect(route('dashboard', absolute: false).'?verified=1');
    expect(EmailVerificationOtp::where('user_id', $user->id)->whereNotNull('used_at')->exists())->toBeTrue();
});

test('email is not verified with an invalid OTP', function () {
    $user = User::factory()->unverified()->create();
    Notification::fake();

    $this->actingAs($user)->post(route('verification.send'));
    $response = $this->actingAs($user)->from(route('verification.notice'))
        ->post(route('verification.verify'), ['code' => '000000']);

    $response->assertSessionHasErrors('code');
    expect($user->fresh()->hasVerifiedEmail())->toBeFalse();
});

test('expired OTP cannot verify email', function () {
    $user = User::factory()->unverified()->create();
    EmailVerificationOtp::create([
        'user_id' => $user->id,
        'code_hash' => Hash::make('123456'),
        'expires_at' => now()->subMinute(),
    ]);

    $this->actingAs($user)->post(route('verification.verify'), ['code' => '123456'])
        ->assertSessionHasErrors('code');

    expect($user->fresh()->hasVerifiedEmail())->toBeFalse();
});

test('verified user is redirected to dashboard from verification prompt', function () {
    $user = User::factory()->create();

    $this->actingAs($user)->get(route('verification.notice'))
        ->assertRedirect(route('dashboard', absolute: false));
});

test('verified users are redirected to the configured destination after verification', function () {
    config(['auth.redirects.after_verification' => '/welcome-back']);
    $user = User::factory()->create();

    $this->actingAs($user)->get(route('dashboard', ['verified' => 1]))
        ->assertRedirect(url('/welcome-back'));
});
