<?php

use App\Models\User;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\User as GoogleUser;

test('guests are redirected to google for authentication', function () {
    Socialite::fake('google');

    $this->get(route('auth.google.redirect'))->assertRedirect();
});

test('google callback creates a verified member account', function () {
    Socialite::fake('google', GoogleUser::fake([
        'id' => 'google-new-user',
        'name' => 'Google Member',
        'email' => 'google-member@example.com',
        'user' => ['email_verified' => true],
    ]));

    $this->get(route('auth.google.callback'))->assertRedirect(route('dashboard'));

    $user = User::query()->where('email', 'google-member@example.com')->firstOrFail();

    expect($user->google_id)->toBe('google-new-user')
        ->and($user->password_set_at)->toBeNull()
        ->and($user->role)->toBe('user')
        ->and($user->email_verified_at)->not->toBeNull();
    $this->assertDatabaseHas('user_profiles', ['user_id' => $user->id]);
});

test('google callback links an existing account by verified email', function () {
    $user = User::factory()->create([
        'email' => 'existing@example.com',
        'role' => 'admin',
    ]);

    Socialite::fake('google', GoogleUser::fake([
        'id' => 'google-existing-user',
        'name' => 'Existing Account',
        'email' => $user->email,
        'user' => ['email_verified' => true],
    ]));

    $this->get(route('auth.google.callback'))->assertRedirect(route('dashboard'));

    expect($user->refresh()->google_id)->toBe('google-existing-user')
        ->and($user->role)->toBe('admin');
    expect(User::query()->where('email', $user->email)->count())->toBe(1);
});

test('google callback sends accounts with authenticator to the two factor challenge', function () {
    $user = User::factory()->withTwoFactor()->create([
        'email' => 'secure@example.com',
    ]);

    Socialite::fake('google', GoogleUser::fake([
        'id' => 'google-secure-user',
        'name' => 'Secure Account',
        'email' => $user->email,
        'user' => ['email_verified' => true],
    ]));

    $this->get(route('auth.google.callback'))
        ->assertRedirect(route('two-factor.login'))
        ->assertSessionHas('login.id', $user->id);

    expect(auth()->check())->toBeFalse();
});

test('google callback rejects an unverified google email', function () {
    Socialite::fake('google', GoogleUser::fake([
        'id' => 'google-unverified-user',
        'name' => 'Unverified Account',
        'email' => 'unverified@example.com',
        'user' => ['email_verified' => false],
    ]));

    $this->get(route('auth.google.callback'))
        ->assertRedirect(route('login'))
        ->assertSessionHasErrors('email');

    $this->assertDatabaseMissing('users', ['email' => 'unverified@example.com']);
});
