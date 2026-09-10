<?php

use App\Models\User;

test('guests are redirected to the login page', function () {
    $response = $this->get(route('dashboard'));
    $response->assertRedirect(route('login'));
});

test('authenticated users are redirected from dashboard based on role', function () {
    $user = User::factory()->create(['role' => 'user']);
    $this->actingAs($user);

    $response = $this->get(route('dashboard'));
    $response->assertRedirect(route('booking.history'));
});

test('unverified users are redirected to verification notice from dashboard', function () {
    $user = User::factory()->unverified()->create(['role' => 'user']);
    $this->actingAs($user);

    $response = $this->get(route('dashboard'));
    $response->assertRedirect(route('verification.notice'));
});
