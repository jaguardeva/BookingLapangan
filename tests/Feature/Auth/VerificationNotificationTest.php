<?php

use App\Models\User;
use App\Notifications\VerifyEmailNotification;
use Illuminate\Support\Facades\Notification;

test('sends verification OTP notification', function () {
    Notification::fake();
    $user = User::factory()->unverified()->create();

    $this->actingAs($user)->from(route('verification.notice'))
        ->post(route('verification.send'))
        ->assertRedirect(route('verification.notice', absolute: false))
        ->assertSessionHas('status', 'verification-otp-sent');

    Notification::assertSentTo($user, VerifyEmailNotification::class);
});

test('does not send verification notification if email is verified', function () {
    Notification::fake();
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('verification.send'))
        ->assertRedirect(route('dashboard', absolute: false));

    Notification::assertNothingSent();
});

test('verification notification contains a six digit OTP', function () {
    $user = User::factory()->unverified()->create();
    $notification = new VerifyEmailNotification('123456');
    $mail = $notification->toMail($user);

    expect($notification->via($user))->toBe(['mail']);
    expect(str_contains($mail->render(), '123456'))->toBeTrue();
    expect(str_contains($mail->render(), '10 menit'))->toBeTrue();
});
