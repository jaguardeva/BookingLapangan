<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

#[Fillable([
    'category_id',
    'name',
    'slug',
    'description',
    'price_per_hour',
    'operational_start',
    'operational_end',
    'slot_duration_minutes',
    'images',
    'is_active',
])]
class Lapangan extends Model
{
    use HasFactory, HasUuids;

    protected function casts(): array
    {
        return [
            'price_per_hour' => 'integer',
            'slot_duration_minutes' => 'integer',
            'images' => 'array',
            'is_active' => 'boolean',
        ];
    }

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($lapangan) {
            if (empty($lapangan->slug)) {
                $lapangan->slug = Str::slug($lapangan->name);
            }
        });
    }

    /**
     * @return BelongsTo<Category, $this>
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    /**
     * @return BelongsToMany<Facility, $this>
     */
    public function facilities(): BelongsToMany
    {
        return $this->belongsToMany(Facility::class, 'facility_lapangan');
    }

    /**
     * @return BelongsToMany<User, $this>
     */
    public function assignedAdmins(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'admin_lapangan');
    }

    /**
     * @return HasMany<Booking, $this>
     */
    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }

    /**
     * @return HasMany<Review, $this>
     */
    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }

    public function getAverageRatingAttribute(): float
    {
        return (float) ($this->reviews()->avg('rating') ?? 5.0);
    }

    public function getTotalReviewsAttribute(): int
    {
        return $this->reviews()->count();
    }
}
