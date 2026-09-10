<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class InternalConversation extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'is_group',
        'group_name',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'is_group' => 'boolean',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * @return BelongsToMany<User, $this>
     */
    public function participants(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'internal_conversation_participants', 'conversation_id')
            ->withPivot('last_read_at');
    }

    /**
     * @return HasMany<InternalMessage, $this>
     */
    public function messages(): HasMany
    {
        return $this->hasMany(InternalMessage::class, 'conversation_id');
    }

    public function latestMessage()
    {
        return $this->hasOne(InternalMessage::class, 'conversation_id')->latest('created_at');
    }

    /**
     * Scope: only conversations that the given user is a participant of.
     */
    public function scopeForUser($query, string $userId)
    {
        return $query->whereHas('participants', function ($q) use ($userId) {
            $q->where('users.id', $userId);
        });
    }

    /**
     * Find an existing 1-to-1 conversation between two users, or create a new one.
     */
    public static function findOrCreateDirectBetween(string $userAId, string $userBId): self
    {
        // Find existing direct (non-group) conversation between these two users
        $conversation = static::where('is_group', false)
            ->whereHas('participants', function ($q) use ($userAId) {
                $q->where('users.id', $userAId);
            })
            ->whereHas('participants', function ($q) use ($userBId) {
                $q->where('users.id', $userBId);
            })
            ->has('participants', '=', 2)
            ->first();

        if ($conversation) {
            return $conversation;
        }

        $conversation = static::create([
            'is_group' => false,
            'created_by' => $userAId,
        ]);

        $conversation->participants()->attach([$userAId, $userBId]);

        return $conversation;
    }
}
