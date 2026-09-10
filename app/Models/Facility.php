<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

#[Fillable(['name', 'icon'])]
class Facility extends Model
{
    use HasFactory, HasUuids;

    /**
     * @return BelongsToMany<Lapangan, $this>
     */
    public function lapangans(): BelongsToMany
    {
        return $this->belongsToMany(Lapangan::class, 'facility_lapangan');
    }
}
