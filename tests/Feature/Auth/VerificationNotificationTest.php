<?php

use App\Models\User;
use App\Notifications\VerifyEmailNotification;
use Illuminate\Support\Facades\Notification;
use Laravel\Fortify\Features;

beforeEach(function () {
    $this->skipUnlessFortifyHas(Features::emailVerification());
});

test('sends verification notification', function () {
    Notification::fake();

    $user = User::factory()->unverified()->create();

    $this->actingAs($user)
        ->post(route('verification.send'))
        ->assertRedirect(route('home'));

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

test('verification email uses the configured application URL', function () {
    config(['app.url' => 'https://sportbooking.example']);
    $user = User::factory()->unverified()->create();

    $mail = (new VerifyEmailNotification)->toMail($user);

    expect($mail->actionUrl)->toStartWith('https://sportbooking.example/');
});

test('verification email expiry matches the configured token lifetime', function () {
    config([
        'app.url' => 'https://sportbooking.example',
        'auth.verification.expire' => 37,
    ]);
    $user = User::factory()->unverified()->create();

    $mail = (new VerifyEmailNotification)->toMail($user);
    parse_str((string) parse_url($mail->actionUrl, PHP_URL_QUERY), $query);

    expect((int) $query['expires'])->toBe(now()->addMinutes(37)->timestamp)
        ->and(str_contains((string) $mail->render(), 'Tautan verifikasi ini akan kedaluwarsa dalam 37 menit.'))->toBeTrue();
});
