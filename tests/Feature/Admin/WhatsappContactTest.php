<?php

use App\Models\User;
use App\Models\WhatsappContact;

test('superadmin can manage whatsapp contacts', function () {
    $superadmin = User::factory()->create(['role' => 'superadmin']);

    $this->actingAs($superadmin)
        ->post('/admin/whatsapp-contacts', [
            'name' => 'Booking Support',
            'phone' => '628123456789',
            'description' => 'Bantuan booking',
            'sort_order' => 1,
            'is_active' => true,
        ])
        ->assertRedirect();

    $contact = WhatsappContact::firstOrFail();
    expect($contact->name)->toBe('Booking Support');

    $this->actingAs($superadmin)
        ->put("/admin/whatsapp-contacts/{$contact->id}", [
            'name' => 'Customer Care',
            'phone' => '628123456789',
            'description' => null,
            'sort_order' => 2,
            'is_active' => true,
        ])
        ->assertRedirect();

    expect($contact->fresh()->name)->toBe('Customer Care');
});

test('regular admins cannot manage whatsapp contacts', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $this->actingAs($admin)->get('/admin/whatsapp-contacts')->assertForbidden();
});

test('active whatsapp contacts are shared with public pages', function () {
    $active = WhatsappContact::factory()->create(['is_active' => true]);
    WhatsappContact::factory()->create(['is_active' => false]);

    $response = $this->get('/');

    $response->assertInertia(fn ($page) => $page
        ->where('whatsapp_contacts.0.id', $active->id)
        ->has('whatsapp_contacts', 1));
});
