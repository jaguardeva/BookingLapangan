<?php

namespace App\Http\Controllers\User;

use App\Events\ChatMessageSent;
use App\Http\Controllers\Controller;
use App\Models\ChatConversation;
use App\Models\ChatMessage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ChatController extends Controller
{
    public function index(Request $request): Response|JsonResponse
    {
        $user = $request->user();

        $conversation = ChatConversation::with(['claimedByUser', 'messages.sender'])
            ->where('user_id', $user->id)
            ->whereIn('status', ['open', 'in_progress'])
            ->latest('updated_at')
            ->first();

        if ($request->wantsJson()) {
            return response()->json([
                'conversation' => $conversation,
            ]);
        }

        return Inertia::render('chat/index', [
            'conversation' => $conversation,
        ]);
    }

    public function storeMessage(Request $request): JsonResponse
    {
        $request->validate([
            'body' => ['required', 'string', 'max:2000'],
        ]);

        $user = $request->user();

        $conversation = ChatConversation::where('user_id', $user->id)
            ->whereIn('status', ['open', 'in_progress'])
            ->latest('updated_at')
            ->first();

        if (! $conversation) {
            $conversation = ChatConversation::create([
                'user_id' => $user->id,
                'status' => 'open',
                'last_message_at' => now(),
            ]);
        } else {
            $conversation->update(['last_message_at' => now()]);
        }

        $message = ChatMessage::create([
            'conversation_id' => $conversation->id,
            'sender_id' => $user->id,
            'body' => $request->body,
        ]);

        broadcast(new ChatMessageSent($message))->toOthers();

        return response()->json([
            'message' => [
                'id' => $message->id,
                'conversation_id' => $message->conversation_id,
                'sender_id' => $message->sender_id,
                'sender_name' => $user->name,
                'sender_role' => $user->role,
                'body' => $message->body,
                'created_at' => $message->created_at->toIso8601String(),
            ],
            'conversation' => $conversation->fresh(['claimedByUser']),
        ]);
    }

    public function markRead(Request $request, ChatConversation $conversation): JsonResponse
    {
        $user = $request->user();
        // Ensure the conversation belongs to the authenticated user
        if ($conversation->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        // Clear the unread flag for this user
        $conversation->update(['unread_at' => null]);

        return response()->json(['message' => 'Conversation marked as read']);
    }
}
