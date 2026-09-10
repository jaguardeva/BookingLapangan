<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ChatMessage extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'conversation_id',
        'sender_id',
        'body',
        'read_at',
    ];

    protected $appends = [
        'sender_name',
        'sender_role',
    ];

    public function getSenderNameAttribute(): string
    {
        return $this->sender?->name ?? 'Pengguna';
    }

    public function getSenderRoleAttribute(): string
    {
        return $this->sender?->role ?? 'customer';
    }

    protected function casts(): array
    {
        return [
            'read_at' => 'datetime',
        ];
    }

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(ChatConversation::class, 'conversation_id');
    }

    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_id');
    }
}
