<?php

use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Support\Facades\Storage;

test('only superadmins can access user management', function () {
    $user = User::factory()->create(['role' => 'user']);
    $admin = User::factory()->create(['role' => 'admin']);

    $this->actingAs($user)->get(route('admin.users.index'))->assertForbidden();
    $this->actingAs($admin)->get(route('admin.users.index'))->assertForbidden();
});

test('superadmin can search filter and sort manageable users', function () {
    $superadmin = User::factory()->create(['role' => 'superadmin']);
    User::factory()->create(['name' => 'Zahra Admin', 'email' => 'zahra@example.com', 'role' => 'admin']);
    $matchingUser = User::factory()->create(['name' => 'Budi User', 'email' => 'budi@example.com', 'role' => 'user']);
    User::factory()->create(['name' => 'Other User', 'email' => 'other@example.com', 'role' => 'user']);

    $this->actingAs($superadmin)
        ->get(route('admin.users.index', [
            'search' => 'budi',
            'role' => 'user',
            'verification' => 'verified',
            'sort' => 'name',
            'direction' => 'asc',
        ]))
        ->assertInertia(fn ($page) => $page
            ->component('admin/users/index')
            ->where('users.data', fn ($users): bool => $users->count() === 1 && $users->first()['id'] === $matchingUser->id)
            ->where('filters.search', 'budi')
            ->where('filters.role', 'user')
            ->where('filters.sort', 'name')
            ->where('filters.direction', 'asc'));
});

test('user management includes public avatar urls for manageable users', function () {
    Storage::fake('public');
    $superadmin = User::factory()->create(['role' => 'superadmin']);
    $user = User::factory()->create(['role' => 'user']);
    $user->profile()->create(['avatar_path' => 'avatars/'.$user->id.'/profile.webp']);

    $this->actingAs($superadmin)
        ->get(route('admin.users.index'))
        ->assertInertia(fn ($page) => $page
            ->where('users.data', function ($users) use ($user): bool {
                $managedUser = collect($users)->firstWhere('id', $user->id);

                return $managedUser['avatar_url'] === Storage::disk('public')->url('avatars/'.$user->id.'/profile.webp');
            }));
});

test('superadmin can create update verify and delete a manageable user', function () {
    $superadmin = User::factory()->create(['role' => 'superadmin']);

    $this->actingAs($superadmin)
        ->post(route('admin.users.store'), [
            'name' => 'New Admin',
            'email' => 'new-admin@example.com',
            'phone' => '081234567890',
            'role' => 'admin',
            'password' => 'Password123!',
            'lapangan_ids' => [],
        ])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $managedUser = User::query()->where('email', 'new-admin@example.com')->firstOrFail();
    expect($managedUser->role)->toBe('admin')->and($managedUser->email_verified_at)->not->toBeNull();
    $this->assertDatabaseHas('activity_logs', ['action' => 'user_created']);

    $this->put(route('admin.users.update', $managedUser), [
        'name' => 'Updated Admin',
        'email' => $managedUser->email,
        'phone' => '089876543210',
        'role' => 'user',
        'password' => '',
        'lapangan_ids' => [],
    ])->assertRedirect()->assertSessionHasNoErrors();

    expect($managedUser->fresh()->name)->toBe('Updated Admin')->and($managedUser->fresh()->role)->toBe('user');

    $this->patch(route('admin.users.verification', $managedUser))->assertRedirect();
    expect($managedUser->fresh()->email_verified_at)->toBeNull();

    $this->delete(route('admin.users.destroy', $managedUser))->assertRedirect();
    $this->assertDatabaseMissing('users', ['id' => $managedUser->id]);
    expect(ActivityLog::query()->where('action', 'user_deleted')->exists())->toBeTrue();
});

test('superadmin cannot delete their own account or manage a superadmin account', function () {
    $superadmin = User::factory()->create(['role' => 'superadmin']);
    $anotherSuperadmin = User::factory()->create(['role' => 'superadmin']);

    $this->actingAs($superadmin)
        ->delete(route('admin.users.destroy', $superadmin))
        ->assertNotFound();

    $this->actingAs($superadmin)
        ->put(route('admin.users.update', $anotherSuperadmin), [
            'name' => 'Not Allowed',
            'email' => $anotherSuperadmin->email,
            'role' => 'user',
            'password' => '',
        ])
        ->assertNotFound();
});

test('user management validates role and unique email', function () {
    $superadmin = User::factory()->create(['role' => 'superadmin']);
    $existingUser = User::factory()->create(['role' => 'user']);

    $this->actingAs($superadmin)
        ->post(route('admin.users.store'), [
            'name' => '',
            'email' => $existingUser->email,
            'role' => 'superadmin',
            'password' => '',
        ])
        ->assertSessionHasErrors(['name', 'email', 'role', 'password']);
});

test('user management rejects invalid phone formats', function () {
    $superadmin = User::factory()->create(['role' => 'superadmin']);

    $this->actingAs($superadmin)
        ->post(route('admin.users.store'), [
            'name' => 'Invalid Phone',
            'email' => 'invalid-phone@example.com',
            'phone' => '08123abc',
            'role' => 'user',
            'password' => 'Password123!',
        ])
        ->assertSessionHasErrors('phone');
});

test('superadmin can view a manageable user detail and other roles return not found', function () {
    $superadmin = User::factory()->create(['role' => 'superadmin']);
    $user = User::factory()->create(['role' => 'user']);
    $user->profile()->create(['phone' => '081234567890', 'city' => 'Jakarta']);
    $anotherSuperadmin = User::factory()->create(['role' => 'superadmin']);

    $this->actingAs($superadmin)
        ->get(route('admin.users.show', $user))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/users/show')
            ->where('user.id', $user->id)
            ->where('profile.phone', '081234567890')
            ->where('summary.total', 0));

    $this->actingAs($superadmin)->get(route('admin.users.show', $anotherSuperadmin))->assertNotFound();
    $this->actingAs(User::factory()->create(['role' => 'admin']))->get(route('admin.users.show', $user))->assertForbidden();
});
