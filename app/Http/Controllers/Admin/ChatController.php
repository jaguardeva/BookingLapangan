<?php

namespace App\Http\Controllers\Admin;

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
        $conversations = ChatConversation::with(['user', 'claimedByUser', 'latestMessage'])
            ->orderByRaw("CASE WHEN status = 'open' THEN 1 WHEN status = 'in_progress' THEN 2 ELSE 3 END")
            ->orderByDesc('last_message_at')
            ->get();

        $unclaimedCount = ChatConversation::where('status', 'open')->count();

        $selectedId = $request->query('conversation');
        $selectedConversation = null;

        if ($selectedId) {
            $selectedConversation = ChatConversation::with(['user', 'claimedByUser', 'messages.sender'])
                ->find($selectedId);
        } elseif ($conversations->isNotEmpty()) {
            $selectedConversation = ChatConversation::with(['user', 'claimedByUser', 'messages.sender'])
                ->find($conversations->first()->id);
        }

        if ($request->wantsJson()) {
            return response()->json([
                'conversations' => $conversations,
                'selectedConversation' => $selectedConversation,
                'unclaimedCount' => $unclaimedCount,
            ]);
        }

        return Inertia::render('admin/chat/index', [
            'conversations' => $conversations,
            'selectedConversation' => $selectedConversation,
            'unclaimedCount' => $unclaimedCount,
        ]);
    }

    public function claim(Request $request, ChatConversation $conversation): JsonResponse
    {
        $user = $request->user();

        if ($conversation->claimed_by && $conversation->claimed_by !== $user->id && ! $user->isSuperAdmin()) {
            return response()->json([
                'message' => 'Chat ini sudah diklaim oleh admin lain.',
            ], 403);
        }

        $conversation->update([
            'claimed_by' => $user->id,
            'status' => 'in_progress',
        ]);

        $conversation->load(['user', 'claimedByUser', 'messages.sender']);

        return response()->json([
            'conversation' => $conversation,
            'message' => 'Chat berhasil diklaim',
        ]);
    }

    public function resolve(Request $request, ChatConversation $conversation): JsonResponse
    {
        if ($conversation->status !== 'in_progress') {
            return response()->json([
                'message' => 'Chat tidak bisa ditandai selesai jika belum diproses/diklaim.',
            ], 422);
        }

        $user = $request->user();
        if ($conversation->claimed_by && $conversation->claimed_by !== $user->id && ! $user->isSuperAdmin()) {
            return response()->json([
                'message' => 'Hanya admin penanggung jawab atau Superadmin yang dapat menyelesaikan chat ini.',
            ], 403);
        }

        $conversation->update([
            'status' => 'resolved',
        ]);

        $conversation->load(['user', 'claimedByUser', 'messages.sender']);

        return response()->json([
            'conversation' => $conversation,
            'message' => 'Chat ditandai sebagai selesai',
        ]);
    }

    public function storeMessage(Request $request, ChatConversation $conversation): JsonResponse
    {
        $request->validate([
            'body' => ['required', 'string', 'max:2000'],
        ]);

        $user = $request->user();

        // Check ownership if already claimed
        if ($conversation->claimed_by && $conversation->claimed_by !== $user->id && ! $user->isSuperAdmin()) {
            return response()->json([
                'message' => 'Chat ini sedang ditangani oleh admin lain. Anda tidak dapat mengirim pesan.',
            ], 403);
        }

        // Auto-claim if not claimed yet
        if (! $conversation->claimed_by) {
            $conversation->update([
                'claimed_by' => $user->id,
                'status' => 'in_progress',
            ]);
        }

        $conversation->update(['last_message_at' => now()]);

        $message = ChatMessage::create([
            'conversation_id' => $conversation->id,
            'sender_id' => $user->id,
            'body' => $request->body,
        ]);

        // Mark conversation as having a new unread admin reply for the user
        $conversation->update(['unread_at' => now()]);

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
            'conversation' => $conversation->refresh(['user', 'claimedByUser']),
        ]);
    }
}
