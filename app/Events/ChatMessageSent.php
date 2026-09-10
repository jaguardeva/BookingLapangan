<?php

namespace App\Events;

use App\Models\ChatMessage;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ChatMessageSent implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public array $messageData;

    public function __construct(public ChatMessage $message)
    {
        $this->message->load(['sender', 'conversation.user', 'conversation.claimedByUser']);

        $this->messageData = [
            'id' => $this->message->id,
            'conversation_id' => $this->message->conversation_id,
            'sender_id' => $this->message->sender_id,
            'sender_name' => $this->message->sender?->name ?? 'User',
            'sender_role' => $this->message->sender?->role ?? 'user',
            'body' => $this->message->body,
            'created_at' => $this->message->created_at->toIso8601String(),
            'conversation' => [
                'id' => $this->message->conversation->id,
                'user_id' => $this->message->conversation->user_id,
                'user_name' => $this->message->conversation->user?->name ?? 'User',
                'claimed_by' => $this->message->conversation->claimed_by,
                'claimed_by_name' => $this->message->conversation->claimedByUser?->name,
                'status' => $this->message->conversation->status,
                'last_message_at' => $this->message->conversation->last_message_at ? $this->message->conversation->last_message_at->toIso8601String() : null,
                'unread_at' => $this->message->conversation->unread_at ? $this->message->conversation->unread_at->toIso8601String() : null,
            ],
        ];
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('chat.conversation.'.$this->message->conversation_id),
            new PrivateChannel('admin.inbox'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'ChatMessageSent';
    }
}
