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

test('members are redirected to the configured destination after authentication', function () {
    config(['auth.redirects.member' => '/member-landing']);
    $user = User::factory()->create(['role' => 'user']);

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertRedirect(url('/member-landing'));
});

test('admins are redirected to the configured destination after authentication', function () {
    config(['auth.redirects.admin' => '/staff-console']);
    $admin = User::factory()->create(['role' => 'admin']);

    $this->actingAs($admin)
        ->get(route('dashboard'))
        ->assertRedirect(url('/staff-console'));
});

test('external member redirect destinations fall back to the booking history route', function () {
    config(['auth.redirects.member' => 'https://outside.example/path']);
    $user = User::factory()->create(['role' => 'user']);

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertRedirect(route('booking.history'));
});

test('unverified users are redirected to verification notice from dashboard', function () {
    $user = User::factory()->unverified()->create(['role' => 'user']);
    $this->actingAs($user);

    $response = $this->get(route('dashboard'));
    $response->assertRedirect(route('verification.notice'));
});
