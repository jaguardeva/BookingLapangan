<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'user_id', 'phone', 'avatar_path', 'city', 'date_of_birth', 'gender',
    'favorite_sports', 'preferred_playing_time',
])]
class UserProfile extends Model
{
    use HasUuids;

    protected function casts(): array
    {
        return ['favorite_sports' => 'array', 'date_of_birth' => 'date:Y-m-d'];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
