<?php

use App\Models\User;
use Laravel\Fortify\Features;

beforeEach(function () {
    $this->skipUnlessFortifyHas(Features::registration());
});

test('registration screen can be rendered', function () {
    $response = $this->get(route('register'));

    $response->assertOk();
});

test('new users can register', function () {
    $response = $this->post(route('register.store'), [
        'name' => 'Test User',
        'email' => 'test@example.com',
        'password' => 'ValidPass1!',
        'password_confirmation' => 'ValidPass1!',
    ]);

    $this->assertAuthenticated();
    $response->assertRedirect(route('dashboard', absolute: false));
});

test('registration rejects passwords that do not meet the password requirements', function (array $data, string $message) {
    $response = $this->post(route('register.store'), [
        'name' => 'Test User',
        'email' => fake()->unique()->safeEmail(),
        'password' => $data['password'],
        'password_confirmation' => $data['password'],
    ]);

    $response->assertSessionHasErrors(['password' => $message]);
    expect(User::query()->where('name', 'Test User')->exists())->toBeFalse();
})->with([
    'too short' => [['password' => 'Aa1!'], 'kata sandi minimal harus terdiri dari 8 karakter.'],
    'contains spaces' => [['password' => 'Aa1! 234'], 'kata sandi tidak boleh mengandung spasi.'],
    'missing uppercase' => [['password' => 'aa1!aaaa'], 'kata sandi harus mengandung setidaknya satu huruf besar dan satu huruf kecil.'],
    'missing lowercase' => [['password' => 'AA1!AAAA'], 'kata sandi harus mengandung setidaknya satu huruf besar dan satu huruf kecil.'],
    'missing number' => [['password' => 'Aa!aaaaa'], 'kata sandi harus mengandung setidaknya satu angka.'],
    'missing symbol' => [['password' => 'Aa1aaaaa'], 'kata sandi harus mengandung setidaknya satu simbol.'],
]);
