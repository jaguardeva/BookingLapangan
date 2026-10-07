<?php

use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

test('profile page displays the user points balance', function () {
    $user = User::factory()->create();
    $user->forceFill([
        'points_balance' => 321,
    ])->save();

    $response = $this
        ->actingAs($user)
        ->get(route('profile.edit'));

    $response
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('profile')
            ->where('auth.user.points_balance', 321)
            ->where('auth.user.available_points', 321)
        );
});

test('profile avatar URL is generated from the public storage disk', function () {
    $user = User::factory()->create();
    $user->profile()->create(['avatar_path' => 'avatars/'.$user->id.'/avatar.webp']);

    $this->actingAs($user)
        ->get(route('profile.edit'))
        ->assertInertia(fn ($page) => $page
            ->where('auth.user.avatar', fn ($avatar): bool => str_ends_with($avatar, '/storage/avatars/'.$user->id.'/avatar.webp')));
});

test('admin profile page uses the admin settings layout', function () {
    $admin = User::factory()->create();
    $admin->forceFill(['role' => 'admin'])->save();

    $this->actingAs($admin)
        ->get(route('profile.edit'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('settings/profile'));
});

test('profile information can be updated', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->patch(route('profile.update'), [
            'name' => 'Test User',
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('profile.edit'));

    $user->refresh();

    expect($user->name)->toBe('Test User');
    expect($user->email_verified_at)->not->toBeNull();
});

test('regular users cannot change their email address', function () {
    $user = User::factory()->create(['email' => 'original@example.com']);

    $this
        ->actingAs($user)
        ->from(route('profile.edit'))
        ->patch(route('profile.update'), [
            'name' => $user->name,
            'email' => 'changed@example.com',
        ])
        ->assertSessionHasErrors('email')
        ->assertRedirect(route('profile.edit'));

    expect($user->refresh()->email)->toBe('original@example.com');
});

test('email verification status is unchanged when the email address is unchanged', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->patch(route('profile.update'), [
            'name' => 'Test User',
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('profile.edit'));

    expect($user->refresh()->email_verified_at)->not->toBeNull();
});

test('user can delete their account', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->delete(route('profile.destroy'), [
            'password' => 'password',
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('home'));

    $this->assertGuest();
    expect($user->fresh())->toBeNull();
});

test('correct password must be provided to delete account', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->from(route('profile.edit'))
        ->delete(route('profile.destroy'), [
            'password' => 'wrong-password',
        ]);

    $response
        ->assertSessionHasErrors('password')
        ->assertRedirect(route('profile.edit'));

    expect($user->fresh())->not->toBeNull();
});

test('profile completion tracks verification, avatar, and phone', function () {
    Storage::fake('public');
    $user = User::factory()->unverified()->create();

    expect($user->profileCompletion())->toMatchArray([
        'percentage' => 0,
        'is_complete' => false,
    ]);

    $this->actingAs($user)->patch(route('profile.update'), [
        'name' => $user->name,
        'phone' => '081234567890',
    ])->assertRedirect();
    $user->refresh();

    $this->actingAs($user)->post(route('profile.avatar.update'), [
        'avatar' => UploadedFile::fake()->image('avatar.jpg'),
    ])->assertRedirect();

    expect($user->fresh()->profileCompletion()['percentage'])->toBe(67);
    expect($user->fresh()->profile?->phone)->toBe('081234567890');
});

test('profile phone accepts only a 10 to 15 digit number starting with 08', function (string $phone) {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->patch(route('profile.update'), ['name' => $user->name, 'phone' => $phone])
        ->assertSessionHasErrors('phone');
})->with([
    'letters' => '0812345678abc',
    'wrong prefix' => '071234567890',
    'too short' => '081234567',
    'too long' => '0812345678901234',
    'international format' => '+6281234567890',
]);

test('invalid avatar uploads are rejected and avatars can be deleted', function () {
    Storage::fake('public');
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('profile.avatar.update'), ['avatar' => UploadedFile::fake()->create('document.pdf', 100, 'application/pdf')])
        ->assertSessionHasErrors('avatar');

    $this->actingAs($user)
        ->post(route('profile.avatar.update'), ['avatar' => UploadedFile::fake()->image('avatar.jpg')])
        ->assertRedirect();

    $path = $user->fresh()->profile?->avatar_path;
    expect($path)->not->toBeNull();
    Storage::disk('public')->assertExists($path);

    $this->actingAs($user)->delete(route('profile.avatar.destroy'))->assertRedirect();
    expect($user->fresh()->profile?->avatar_path)->toBeNull();
    Storage::disk('public')->assertMissing($path);
});
