<?php

use App\Models\User;
use Illuminate\Support\Str;

test('marking a notification as read redirects to its internal target', function () {
    $user = User::factory()->create();
    $notification = $user->notifications()->create([
        'id' => (string) Str::uuid(),
        'type' => 'booking.updated',
        'data' => [
            'title' => 'Booking diperbarui',
            'message' => 'Status booking Anda berubah.',
            'url' => '/my-bookings',
        ],
    ]);

    $this->actingAs($user)
        ->post(route('notification.read', $notification->id), [
            'redirect' => '/my-bookings',
        ])
        ->assertRedirect('/my-bookings');

    expect($notification->fresh()->read_at)->not->toBeNull();
});

test('notification read redirects reject external targets', function () {
    $user = User::factory()->create();
    $notification = $user->notifications()->create([
        'id' => (string) Str::uuid(),
        'type' => 'booking.updated',
        'data' => [
            'title' => 'Booking diperbarui',
            'message' => 'Status booking Anda berubah.',
        ],
    ]);

    $this->actingAs($user)
        ->post(route('notification.read', $notification->id), [
            'redirect' => 'https://example.com',
        ])
        ->assertRedirect(route('notification.index'));
});
