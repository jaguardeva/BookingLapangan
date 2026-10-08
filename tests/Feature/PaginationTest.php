<?php

use App\Models\User;

test('user management accepts an allowed page size and exposes pagination metadata', function () {
    $superadmin = User::factory()->create(['role' => 'superadmin']);
    User::factory()->count(26)->create(['role' => 'user']);

    $response = $this->actingAs($superadmin)->get(route('admin.users.index', [
        'per_page' => 25,
        'role' => 'user',
    ]));

    $response->assertInertia(fn ($page) => $page
        ->component('admin/users/index')
        ->where('users.per_page', 25)
        ->where('users.current_page', 1)
        ->where('users.last_page', 2)
        ->where('filters.role', 'user')
    );
});

test('invalid page sizes fall back to the endpoint default', function () {
    $superadmin = User::factory()->create(['role' => 'superadmin']);

    $response = $this->actingAs($superadmin)->get(route('admin.users.index', [
        'per_page' => 1000,
    ]));

    $response->assertInertia(fn ($page) => $page
        ->component('admin/users/index')
        ->where('users.per_page', 10)
    );
});

test('user management pagination remains protected from non-superadmins', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $this->actingAs($admin)
        ->get(route('admin.users.index', ['per_page' => 25]))
        ->assertForbidden();
});
