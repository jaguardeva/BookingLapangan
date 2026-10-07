<?php

use App\Models\Booking;
use App\Models\Category;
use App\Models\Lapangan;
use App\Models\Review;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('landing page exposes real venue and review statistics', function () {
    $category = Category::create([
        'name' => 'Futsal',
        'slug' => 'futsal',
        'is_active' => true,
    ]);
    $lapangan = Lapangan::create([
        'category_id' => $category->id,
        'name' => 'Test Court',
        'slug' => 'test-court',
        'price_per_hour' => 100000,
        'operational_start' => '08:00',
        'operational_end' => '22:00',
        'slot_duration_minutes' => 60,
        'images' => [],
        'is_active' => true,
    ]);
    $user = User::factory()->create();
    $booking = Booking::create([
        'booking_code' => 'TEST-HOME-001',
        'user_id' => $user->id,
        'lapangan_id' => $lapangan->id,
        'booking_date' => now()->toDateString(),
        'start_time' => '10:00',
        'end_time' => '11:00',
        'duration_hours' => 1,
        'base_price' => 100000,
        'validation_code' => 123,
        'total_price' => 100123,
        'payment_method' => 'cash',
        'payment_status' => 'approved',
        'customer_name' => $user->name,
        'customer_phone' => '081234567890',
        'payment_deadline' => now()->addHour(),
    ]);
    Review::create([
        'booking_id' => $booking->id,
        'lapangan_id' => $lapangan->id,
        'user_id' => $user->id,
        'rating' => 5,
        'comment' => 'Lapangan nyaman.',
    ]);

    $this->get(route('home'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('home')
            ->where('stats.total_lapangan', 1)
            ->where('stats.total_categories', 1)
            ->where('stats.total_reviews', 1)
            ->where('stats.average_rating', 5)
            ->has('testimonials', 1),
        );
});

test('landing page renders an empty review collection safely', function () {
    $this->get(route('home'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('home')
            ->where('stats.total_reviews', 0)
            ->where('stats.average_rating', 0)
            ->has('testimonials', 0),
        );
});
