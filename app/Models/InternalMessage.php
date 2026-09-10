<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InternalMessage extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'conversation_id',
        'sender_id',
        'body',
    ];

    protected $appends = [
        'sender_name',
        'sender_role',
    ];

    public function getSenderNameAttribute(): string
    {
        return $this->sender?->name ?? 'Staff';
    }

    public function getSenderRoleAttribute(): string
    {
        return $this->sender?->role ?? 'admin';
    }

    /**
     * @return BelongsTo<InternalConversation, $this>
     */
    public function conversation(): BelongsTo
    {
        return $this->belongsTo(InternalConversation::class, 'conversation_id');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_id');
    }
}
