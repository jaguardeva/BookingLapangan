<?php

namespace App\Events;

use App\Models\InternalMessage;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class InternalMessageSent implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public array $messageData;

    public function __construct(public InternalMessage $message)
    {
        $this->message->load('sender');

        $this->messageData = [
            'id' => $this->message->id,
            'conversation_id' => $this->message->conversation_id,
            'sender_id' => $this->message->sender_id,
            'sender_name' => $this->message->sender?->name ?? 'Staff',
            'sender_role' => $this->message->sender?->role ?? 'admin',
            'body' => $this->message->body,
            'created_at' => $this->message->created_at->toIso8601String(),
        ];
    }

    /**
     * @return array<int, PrivateChannel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('internal.conversation.'.$this->message->conversation_id),
        ];
    }

    public function broadcastAs(): string
    {
        return 'InternalMessageSent';
    }
}
