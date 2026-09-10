<?php

use App\Models\InternalConversation;
use App\Models\InternalMessage;
use App\Models\User;

test('admin can access internal chat page', function () {
    $admin = User::factory()->create([
        'role' => 'admin',
    ]);

    $response = $this->actingAs($admin)->get('/admin/internal-chat');

    $response->assertStatus(200);
});

test('superadmin can access internal chat page', function () {
    $superadmin = User::factory()->create([
        'role' => 'superadmin',
    ]);

    $response = $this->actingAs($superadmin)->get('/admin/internal-chat');

    $response->assertStatus(200);
});

test('internal chat page renders with conversations and messages', function () {
    $superadmin = User::factory()->create(['role' => 'superadmin']);
    $admin = User::factory()->create(['role' => 'admin']);

    $conv = InternalConversation::create([
        'is_group' => false,
        'created_by' => $superadmin->id,
    ]);
    $conv->participants()->attach([$superadmin->id, $admin->id]);

    InternalMessage::create([
        'conversation_id' => $conv->id,
        'sender_id' => $superadmin->id,
        'body' => 'Test message',
    ]);

    $response = $this->actingAs($superadmin)->get('/admin/internal-chat');

    $response->assertStatus(200);
    $data = $response->viewData('page');
    expect($data['props']['conversations'])->not->toBeEmpty();
});

test('staff can start direct chat with another staff', function () {
    $superadmin = User::factory()->create(['role' => 'superadmin']);
    $admin = User::factory()->create(['role' => 'admin']);

    $response = $this->actingAs($superadmin)->postJson('/admin/internal-chat/start-direct', [
        'user_id' => $admin->id,
    ]);

    $response->assertStatus(200);
    $response->assertJsonStructure(['conversation' => ['id', 'is_group']]);

    // Calling it again returns the same conversation without duplicate
    $response2 = $this->actingAs($superadmin)->postJson('/admin/internal-chat/start-direct', [
        'user_id' => $admin->id,
    ]);

    $response2->assertStatus(200);
    expect($response2->json('conversation.id'))->toBe($response->json('conversation.id'));
});

test('staff can create a group chat', function () {
    $superadmin = User::factory()->create(['role' => 'superadmin']);
    $admin1 = User::factory()->create(['role' => 'admin']);
    $admin2 = User::factory()->create(['role' => 'admin']);

    $response = $this->actingAs($superadmin)->postJson('/admin/internal-chat/create-group', [
        'group_name' => 'Tim Operasional',
        'participant_ids' => [$admin1->id, $admin2->id],
    ]);

    $response->assertStatus(200);
    $response->assertJsonStructure(['conversation' => ['id', 'is_group', 'group_name']]);
    expect($response->json('conversation.is_group'))->toBeTrue();
});

test('staff can delete their own message', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $other = User::factory()->create(['role' => 'admin']);

    $conv = InternalConversation::create([
        'is_group' => false,
        'created_by' => $admin->id,
    ]);
    $conv->participants()->attach([$admin->id, $other->id]);

    $message = InternalMessage::create([
        'conversation_id' => $conv->id,
        'sender_id' => $admin->id,
        'body' => 'Pesan akan dihapus',
    ]);

    $response = $this->actingAs($admin)->deleteJson("/admin/internal-chat/messages/{$message->id}");

    $response->assertStatus(200);
    $this->assertDatabaseMissing('internal_messages', ['id' => $message->id]);
});

test('staff cannot delete another staff message', function () {
    $admin1 = User::factory()->create(['role' => 'admin']);
    $admin2 = User::factory()->create(['role' => 'admin']);

    $conv = InternalConversation::create([
        'is_group' => false,
        'created_by' => $admin1->id,
    ]);
    $conv->participants()->attach([$admin1->id, $admin2->id]);

    $message = InternalMessage::create([
        'conversation_id' => $conv->id,
        'sender_id' => $admin1->id,
        'body' => 'Pesan admin 1',
    ]);

    $response = $this->actingAs($admin2)->deleteJson("/admin/internal-chat/messages/{$message->id}");

    $response->assertStatus(403);
    $this->assertDatabaseHas('internal_messages', ['id' => $message->id]);
});

test('superadmin can delete any message', function () {
    $superadmin = User::factory()->create(['role' => 'superadmin']);
    $admin = User::factory()->create(['role' => 'admin']);

    $conv = InternalConversation::create([
        'is_group' => false,
        'created_by' => $admin->id,
    ]);
    $conv->participants()->attach([$admin->id, $superadmin->id]);

    $message = InternalMessage::create([
        'conversation_id' => $conv->id,
        'sender_id' => $admin->id,
        'body' => 'Pesan admin',
    ]);

    $response = $this->actingAs($superadmin)->deleteJson("/admin/internal-chat/messages/{$message->id}");

    $response->assertStatus(200);
    $this->assertDatabaseMissing('internal_messages', ['id' => $message->id]);
});

test('participant can delete a 1-to-1 conversation', function () {
    $admin1 = User::factory()->create(['role' => 'admin']);
    $admin2 = User::factory()->create(['role' => 'admin']);

    $conv = InternalConversation::create([
        'is_group' => false,
        'created_by' => $admin1->id,
    ]);
    $conv->participants()->attach([$admin1->id, $admin2->id]);

    InternalMessage::create([
        'conversation_id' => $conv->id,
        'sender_id' => $admin1->id,
        'body' => 'Pesan di direct chat',
    ]);

    $response = $this->actingAs($admin2)->deleteJson("/admin/internal-chat/{$conv->id}");

    $response->assertStatus(200);
    $this->assertDatabaseMissing('internal_conversations', ['id' => $conv->id]);
    $this->assertDatabaseMissing('internal_messages', ['conversation_id' => $conv->id]);
});

test('group creator can delete group conversation', function () {
    $creator = User::factory()->create(['role' => 'admin']);
    $member = User::factory()->create(['role' => 'admin']);

    $conv = InternalConversation::create([
        'is_group' => true,
        'group_name' => 'Group Test',
        'created_by' => $creator->id,
    ]);
    $conv->participants()->attach([$creator->id, $member->id]);

    $response = $this->actingAs($creator)->deleteJson("/admin/internal-chat/{$conv->id}");

    $response->assertStatus(200);
    $this->assertDatabaseMissing('internal_conversations', ['id' => $conv->id]);
});

test('non-creator staff cannot delete group conversation', function () {
    $creator = User::factory()->create(['role' => 'admin']);
    $member = User::factory()->create(['role' => 'admin']);

    $conv = InternalConversation::create([
        'is_group' => true,
        'group_name' => 'Group Test 2',
        'created_by' => $creator->id,
    ]);
    $conv->participants()->attach([$creator->id, $member->id]);

    $response = $this->actingAs($member)->deleteJson("/admin/internal-chat/{$conv->id}");

    $response->assertStatus(403);
    $this->assertDatabaseHas('internal_conversations', ['id' => $conv->id]);
});
