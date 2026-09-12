<?php

namespace App\Models;

use Database\Factories\WhatsappContactFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WhatsappContact extends Model
{
    /** @use HasFactory<WhatsappContactFactory> */
    use HasFactory;

    protected $fillable = [
        'name',
        'phone',
        'description',
        'is_active',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ];
    }
}
