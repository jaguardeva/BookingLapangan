<?php

use App\Models\ChatConversation;
use App\Models\InternalConversation;
use App\Models\User;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function (User $user, string $id) {
    return (string) $user->id === (string) $id;
});

Broadcast::channel('chat.conversation.{id}', function (User $user, string $id) {
    if ($user->isAdmin() || $user->isSuperAdmin()) {
        return true;
    }

    $conversation = ChatConversation::find($id);

    return $conversation && (string) $conversation->user_id === (string) $user->id;
});

Broadcast::channel('admin.inbox', function (User $user) {
    return $user->isAdmin() || $user->isSuperAdmin();
});

Broadcast::channel('internal.conversation.{id}', function (User $user, string $id) {
    $conversation = InternalConversation::find($id);

    if (! $conversation) {
        return false;
    }

    return $conversation->participants()->where('users.id', $user->id)->exists();
});
