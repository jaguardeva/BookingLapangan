<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['membership_discount_percentage'])]
class MembershipSetting extends Model
{
    public const ID = 1;

    protected function casts(): array
    {
        return ['membership_discount_percentage' => 'integer'];
    }
}
