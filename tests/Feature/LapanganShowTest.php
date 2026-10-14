<?php

use App\Models\Category;
use App\Models\Lapangan;

beforeEach(function () {
    $category = Category::create([
        'name' => 'Lapangan Detail Test',
        'slug' => 'lapangan-detail-test',
        'is_active' => true,
    ]);

    $this->lapangan = Lapangan::create([
        'category_id' => $category->id,
        'name' => 'Lapangan Detail Test',
        'slug' => 'lapangan-detail-test',
        'description' => 'Lapangan untuk pengujian detail.',
        'price_per_hour' => 100000,
        'operational_start' => '08:00',
        'operational_end' => '22:00',
        'slot_duration_minutes' => 60,
        'images' => [],
        'is_active' => true,
    ]);
});

test('lapangan detail page renders a shell before client data loads', function () {
    $this->get(route('lapangan.show', $this->lapangan->slug))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('lapangan/show')
            ->where('slug', $this->lapangan->slug)
            ->missing('lapangan')
            ->missing('allowedDates')
            ->missing('existingBookings')
            ->missing('relatedLapangans')
        );
});

test('lapangan detail JSON response contains dynamic field data', function () {
    $this->getJson(route('lapangan.show-data', $this->lapangan->slug))
        ->assertOk()
        ->assertJsonStructure([
            'lapangan',
            'allowedDates',
            'existingBookings',
            'relatedLapangans',
        ])
        ->assertJsonPath('lapangan.slug', $this->lapangan->slug)
        ->assertJsonCount(3, 'allowedDates');
});

test('invalid lapangan slugs return graceful not found responses', function () {
    $this->get(route('lapangan.show', 'does-not-exist'))
        ->assertNotFound();

    $this->getJson(route('lapangan.show-data', 'does-not-exist'))
        ->assertNotFound()
        ->assertJsonPath('message', 'Lapangan tidak ditemukan atau sudah tidak tersedia.');
});

test('inactive lapangan slugs are unavailable', function () {
    $this->lapangan->update(['is_active' => false]);

    $this->getJson(route('lapangan.show-data', $this->lapangan->slug))
        ->assertNotFound();
});
