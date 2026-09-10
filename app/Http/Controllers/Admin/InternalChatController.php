<?php

namespace App\Http\Controllers\Admin;

use App\Events\InternalConversationDeleted;
use App\Events\InternalMessageDeleted;
use App\Events\InternalMessageSent;
use App\Http\Controllers\Controller;
use App\Models\InternalConversation;
use App\Models\InternalMessage;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class InternalChatController extends Controller
{
    public function index(Request $request): Response|JsonResponse
    {
        $user = $request->user();

        $conversations = InternalConversation::forUser($user->id)
            ->with(['participants', 'latestMessage.sender'])
            ->withCount([
                'messages as unread_count' => function ($query) use ($user) {
                    $query->where('sender_id', '!=', $user->id)
                        ->where('created_at', '>', function ($sub) use ($user) {
                            $sub->select('last_read_at')
                                ->from('internal_conversation_participants')
                                ->whereColumn('conversation_id', 'internal_conversations.id')
                                ->where('user_id', $user->id)
                                ->limit(1);
                        });
                },
            ])
            ->orderByDesc(
                InternalMessage::select('created_at')
                    ->whereColumn('conversation_id', 'internal_conversations.id')
                    ->latest('created_at')
                    ->limit(1)
            )
            ->get();

        $selectedId = $request->query('conversation');
        $selectedConversation = null;

        if ($selectedId) {
            $selectedConversation = InternalConversation::forUser($user->id)
                ->with(['participants', 'messages.sender'])
                ->find($selectedId);
        } elseif ($conversations->isNotEmpty()) {
            $selectedConversation = InternalConversation::forUser($user->id)
                ->with(['participants', 'messages.sender'])
                ->find($conversations->first()->id);
        }

        // Mark as read when opening a conversation
        if ($selectedConversation) {
            $selectedConversation->participants()->updateExistingPivot($user->id, [
                'last_read_at' => now(),
            ]);
        }

        if ($request->wantsJson()) {
            return response()->json([
                'conversations' => $conversations,
                'selectedConversation' => $selectedConversation,
            ]);
        }

        return Inertia::render('admin/internal-chat/index', [
            'conversations' => $conversations,
            'selectedConversation' => $selectedConversation,
        ]);
    }

    /**
     * List available staff members for starting a new conversation.
     */
    public function staffList(Request $request): JsonResponse
    {
        $user = $request->user();

        $staff = User::whereIn('role', ['admin', 'superadmin'])
            ->where('id', '!=', $user->id)
            ->select('id', 'name', 'role', 'email')
            ->orderBy('name')
            ->get();

        return response()->json(['staff' => $staff]);
    }

    /**
     * Start a 1-to-1 conversation with another staff member.
     */
    public function startDirect(Request $request): JsonResponse
    {
        $request->validate([
            'user_id' => ['required', 'uuid', 'exists:users,id'],
        ]);

        $user = $request->user();
        $targetId = $request->user_id;

        // Ensure target is staff
        $target = User::whereIn('role', ['admin', 'superadmin'])->findOrFail($targetId);

        $conversation = InternalConversation::findOrCreateDirectBetween($user->id, $target->id);

        $conversation->load(['participants', 'messages.sender']);

        return response()->json([
            'conversation' => $conversation,
            'message' => 'Conversation dimulai dengan '.$target->name,
        ]);
    }

    /**
     * Create a group conversation.
     */
    public function createGroup(Request $request): JsonResponse
    {
        $request->validate([
            'group_name' => ['required', 'string', 'max:100'],
            'participant_ids' => ['required', 'array', 'min:1'],
            'participant_ids.*' => ['required', 'uuid', 'exists:users,id'],
        ]);

        $user = $request->user();

        // Ensure all participants are staff
        $participantIds = $request->participant_ids;
        $validStaff = User::whereIn('role', ['admin', 'superadmin'])
            ->whereIn('id', $participantIds)
            ->count();

        if ($validStaff !== count($participantIds)) {
            return response()->json([
                'message' => 'Semua peserta harus merupakan admin atau superadmin.',
            ], 422);
        }

        $conversation = InternalConversation::create([
            'is_group' => true,
            'group_name' => $request->group_name,
            'created_by' => $user->id,
        ]);

        // Add creator + selected participants
        $allParticipants = array_unique(array_merge([$user->id], $participantIds));
        $conversation->participants()->attach($allParticipants);

        $conversation->load(['participants', 'messages.sender']);

        return response()->json([
            'conversation' => $conversation,
            'message' => 'Grup "'.$request->group_name.'" berhasil dibuat',
        ]);
    }

    /**
     * Send a message in an internal conversation.
     */
    public function storeMessage(Request $request, InternalConversation $conversation): JsonResponse
    {
        $request->validate([
            'body' => ['required', 'string', 'max:2000'],
        ]);

        $user = $request->user();

        // Verify user is a participant
        if (! $conversation->participants()->where('users.id', $user->id)->exists()) {
            return response()->json([
                'message' => 'Anda bukan peserta dalam conversation ini.',
            ], 403);
        }

        $message = InternalMessage::create([
            'conversation_id' => $conversation->id,
            'sender_id' => $user->id,
            'body' => $request->body,
        ]);

        // Update sender's last_read_at
        $conversation->participants()->updateExistingPivot($user->id, [
            'last_read_at' => now(),
        ]);

        broadcast(new InternalMessageSent($message))->toOthers();

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
        ]);
    }

    /**
     * Mark a conversation as read.
     */
    public function markRead(Request $request, InternalConversation $conversation): JsonResponse
    {
        $user = $request->user();

        if (! $conversation->participants()->where('users.id', $user->id)->exists()) {
            return response()->json(['message' => 'Bukan peserta.'], 403);
        }

        $conversation->participants()->updateExistingPivot($user->id, [
            'last_read_at' => now(),
        ]);

        return response()->json(['message' => 'Dibaca']);
    }

    /**
     * Delete an internal message.
     */
    public function destroyMessage(Request $request, InternalMessage $message): JsonResponse
    {
        $user = $request->user();

        // User must be the sender or a superadmin
        if ($message->sender_id !== $user->id && ! $user->isSuperAdmin()) {
            return response()->json([
                'message' => 'Anda tidak memiliki izin untuk menghapus pesan ini.',
            ], 403);
        }

        $conversationId = $message->conversation_id;
        $messageId = $message->id;

        $message->delete();

        broadcast(new InternalMessageDeleted($conversationId, $messageId))->toOthers();

        return response()->json([
            'message' => 'Pesan berhasil dihapus.',
            'message_id' => $messageId,
            'conversation_id' => $conversationId,
        ]);
    }

    /**
     * Delete an entire internal conversation.
     */
    public function destroyConversation(Request $request, InternalConversation $conversation): JsonResponse
    {
        $user = $request->user();

        // For group conversations: only creator or superadmin can delete
        if ($conversation->is_group && $conversation->created_by !== $user->id && ! $user->isSuperAdmin()) {
            return response()->json([
                'message' => 'Hanya pembuat grup atau superadmin yang dapat menghapus grup ini.',
            ], 403);
        }

        // For 1-to-1 conversations: must be a participant or superadmin
        if (! $conversation->is_group && ! $conversation->participants()->where('users.id', $user->id)->exists() && ! $user->isSuperAdmin()) {
            return response()->json([
                'message' => 'Anda bukan peserta dalam percakapan ini.',
            ], 403);
        }

        $conversationId = $conversation->id;

        broadcast(new InternalConversationDeleted($conversationId))->toOthers();

        $conversation->delete();

        return response()->json([
            'message' => 'Percakapan berhasil dihapus.',
            'conversation_id' => $conversationId,
        ]);
    }
}
