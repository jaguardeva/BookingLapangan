<?php

use App\Models\Category;
use App\Models\Lapangan;

beforeEach(function () {
    $this->category = Category::create([
        'name' => 'Lapangan Index Test',
        'slug' => 'lapangan-index-test',
        'is_active' => true,
    ]);

    $this->lapangan = Lapangan::create([
        'category_id' => $this->category->id,
        'name' => 'Lapangan Index Test',
        'slug' => 'lapangan-index-test',
        'description' => 'Lapangan untuk pengujian katalog.',
        'price_per_hour' => 100000,
        'operational_start' => '08:00',
        'operational_end' => '22:00',
        'slot_duration_minutes' => 60,
        'images' => [],
        'is_active' => true,
    ]);
});

test('lapangan index renders a shell without catalog data', function () {
    $this->get(route('lapangan.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('lapangan/index')
            ->missing('lapangans')
            ->missing('categories')
            ->missing('filters')
        );
});

test('lapangan data endpoint returns the catalog payload', function () {
    $this->getJson(route('lapangan.data'))
        ->assertOk()
        ->assertJsonStructure([
            'lapangans' => ['data', 'links', 'total'],
            'categories',
            'filters' => ['search', 'category', 'sort'],
        ])
        ->assertJsonPath('lapangans.data.0.id', $this->lapangan->id)
        ->assertJsonPath('categories.0.id', $this->category->id)
        ->assertJsonPath('filters.sort', 'latest');
});

test('lapangan data endpoint applies catalog filters', function () {
    $otherLapangan = Lapangan::create([
        'category_id' => $this->category->id,
        'name' => 'Lapangan Lainnya',
        'slug' => 'lapangan-lainnya',
        'description' => 'Lapangan lain.',
        'price_per_hour' => 150000,
        'operational_start' => '08:00',
        'operational_end' => '22:00',
        'slot_duration_minutes' => 60,
        'images' => [],
        'is_active' => true,
    ]);

    $this->getJson(route('lapangan.data', [
        'search' => 'Lainnya',
        'category' => $this->category->slug,
        'sort' => 'price_desc',
    ]))
        ->assertOk()
        ->assertJsonCount(1, 'lapangans.data')
        ->assertJsonPath('lapangans.data.0.id', $otherLapangan->id)
        ->assertJsonPath('filters.search', 'Lainnya')
        ->assertJsonPath('filters.category', $this->category->slug)
        ->assertJsonPath('filters.sort', 'price_desc');
});
