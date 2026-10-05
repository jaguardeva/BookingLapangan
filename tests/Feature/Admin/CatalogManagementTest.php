<?php

use App\Models\Booking;
use App\Models\Category;
use App\Models\Facility;
use App\Models\Lapangan;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

test('superadmin can create categories with unique generated slugs', function () {
    $superadmin = User::factory()->create(['role' => 'superadmin']);

    $this->actingAs($superadmin)
        ->post(route('admin.categories.store'), [
            'name' => 'Pickle Ball',
            'icon' => 'Trophy',
            'description' => 'Lapangan pickle ball outdoor.',
        ])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $category = Category::query()->where('name', 'Pickle Ball')->firstOrFail();

    expect($category->slug)->toBe('pickle-ball')
        ->and($category->icon)->toBe('Trophy')
        ->and($category->is_active)->toBeTrue();

    $this->put(route('admin.categories.update', $category), [
        'name' => 'Pickle Ball Indoor',
        'icon' => 'Dribbble',
        'description' => 'Lapangan indoor.',
    ])->assertRedirect()->assertSessionHasNoErrors();

    expect($category->fresh()->name)->toBe('Pickle Ball Indoor')
        ->and($category->fresh()->slug)->toBe('pickle-ball');
    $this->assertDatabaseHas('activity_logs', ['action' => 'category_created']);
});

test('regular admins cannot access catalog management', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $this->actingAs($admin)
        ->get(route('admin.catalog.index'))
        ->assertForbidden();

    $this->actingAs($admin)
        ->post(route('admin.facilities.store'), ['name' => 'Loker'])
        ->assertForbidden();
});

test('deactivating a category hides its lapangan from public pages without deleting existing records', function () {
    $superadmin = User::factory()->create(['role' => 'superadmin']);
    $user = User::factory()->create(['role' => 'user']);
    $category = Category::create([
        'name' => 'Pickle Ball',
        'slug' => 'pickle-ball',
        'is_active' => true,
    ]);
    $lapangan = Lapangan::create([
        'category_id' => $category->id,
        'name' => 'Court A',
        'slug' => 'pickle-court-a',
        'price_per_hour' => 100000,
        'operational_start' => '07:00',
        'operational_end' => '23:00',
        'slot_duration_minutes' => 60,
        'images' => ['https://example.test/court-a.jpg'],
        'is_active' => true,
    ]);
    $booking = Booking::create([
        'booking_code' => 'BKG-CATEGORY-001',
        'user_id' => $user->id,
        'lapangan_id' => $lapangan->id,
        'booking_date' => now()->addDay()->toDateString(),
        'start_time' => '18:00',
        'end_time' => '19:00',
        'duration_hours' => 1,
        'base_price' => 100000,
        'validation_code' => 0,
        'total_price' => 100000,
        'payment_method' => 'cash',
        'payment_status' => 'approved',
        'customer_name' => 'Pelanggan Tes',
        'customer_phone' => '081234567890',
        'payment_deadline' => now()->addHours(2),
    ]);

    $this->actingAs($superadmin)
        ->post(route('admin.categories.toggle', $category))
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $this->get(route('lapangan.index'))
        ->assertInertia(fn ($page) => $page->where('lapangans.data', []));
    $this->get(route('home'))
        ->assertInertia(fn ($page) => $page->where('featuredLapangans', []));
    $this->get(route('lapangan.show', $lapangan->slug))->assertNotFound();

    $this->actingAs($user)
        ->post(route('booking.store'), [
            'lapangan_id' => $lapangan->id,
            'booking_date' => now()->addDay()->toDateString(),
            'start_time' => '18:00',
            'duration_hours' => 1,
            'payment_method' => 'transfer',
            'use_points' => false,
            'customer_name' => 'Pelanggan Tes',
            'customer_phone' => '081234567890',
        ])
        ->assertSessionHasErrors('lapangan_id');

    expect($category->fresh()->is_active)->toBeFalse();
    $this->assertModelExists($lapangan);
    $this->assertModelExists($booking);
});

test('superadmin can add and edit facilities without breaking lapangan assignments', function () {
    $superadmin = User::factory()->create(['role' => 'superadmin']);
    $category = Category::create([
        'name' => 'Badminton',
        'slug' => 'badminton',
        'is_active' => true,
    ]);
    $lapangan = Lapangan::create([
        'category_id' => $category->id,
        'name' => 'Court Badminton',
        'slug' => 'court-badminton',
        'price_per_hour' => 100000,
        'operational_start' => '07:00',
        'operational_end' => '23:00',
        'slot_duration_minutes' => 60,
        'is_active' => true,
    ]);

    $this->actingAs($superadmin)
        ->post(route('admin.facilities.store'), ['name' => 'Ruang Bilas', 'icon' => 'Droplets'])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $facility = Facility::query()->where('name', 'Ruang Bilas')->firstOrFail();
    $lapangan->facilities()->sync([$facility->id]);

    $this->put(route('admin.facilities.update', $facility), [
        'name' => 'Ruang Bilas Bersih',
        'icon' => 'Sparkles',
    ])->assertRedirect()->assertSessionHasNoErrors();

    expect($lapangan->fresh()->facilities->sole()->name)->toBe('Ruang Bilas Bersih');
    $this->assertDatabaseHas('activity_logs', ['action' => 'facility_created']);
    $this->assertDatabaseHas('activity_logs', ['action' => 'facility_updated']);
});

test('superadmin can create a lapangan with multiple photos', function () {
    Storage::fake('public');
    $superadmin = User::factory()->create(['role' => 'superadmin']);
    $category = Category::create([
        'name' => 'Futsal',
        'slug' => 'futsal',
        'is_active' => true,
    ]);

    $this->actingAs($superadmin)
        ->post(route('admin.lapangans.store'), [
            'name' => 'Futsal Arena',
            'category_id' => $category->id,
            'description' => 'Lapangan baru.',
            'price_per_hour' => 100000,
            'operational_start' => '07:00',
            'operational_end' => '23:00',
            'slot_duration_minutes' => 60,
            'image_files' => [
                UploadedFile::fake()->image('front.jpg'),
                UploadedFile::fake()->image('side.jpg'),
            ],
            'facilities' => [],
        ])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $lapangan = Lapangan::query()->where('name', 'Futsal Arena')->firstOrFail();

    expect($lapangan->images)->toHaveCount(2);
    foreach ($lapangan->images as $imageUrl) {
        Storage::disk('public')->assertExists('lapangans/'.basename((string) parse_url($imageUrl, PHP_URL_PATH)));
    }
});

test('lapangan detail exposes all stored photos in their saved order', function () {
    $category = Category::create([
        'name' => 'Voli Pantai',
        'slug' => 'voli-pantai',
        'is_active' => true,
    ]);
    $photos = [
        'https://example.test/first.jpg',
        'https://example.test/second.jpg',
        'https://example.test/third.jpg',
    ];
    $lapangan = Lapangan::create([
        'category_id' => $category->id,
        'name' => 'Voli Pantai Arena',
        'slug' => 'voli-pantai-arena',
        'price_per_hour' => 100000,
        'operational_start' => '07:00',
        'operational_end' => '23:00',
        'slot_duration_minutes' => 60,
        'images' => $photos,
        'is_active' => true,
    ]);

    $this->get(route('lapangan.show', $lapangan->slug))
        ->assertInertia(fn ($page) => $page
            ->component('lapangan/show')
            ->where('lapangan.images', $photos));
});

test('lapangan image uploads reject more than four files', function () {
    Storage::fake('public');
    $superadmin = User::factory()->create(['role' => 'superadmin']);
    $category = Category::create([
        'name' => 'Tenis',
        'slug' => 'tenis',
        'is_active' => true,
    ]);

    $this->actingAs($superadmin)
        ->post(route('admin.lapangans.store'), [
            'name' => 'Tenis Court',
            'category_id' => $category->id,
            'price_per_hour' => 100000,
            'operational_start' => '07:00',
            'operational_end' => '23:00',
            'slot_duration_minutes' => 60,
            'image_files' => [
                UploadedFile::fake()->image('one.jpg'),
                UploadedFile::fake()->image('two.jpg'),
                UploadedFile::fake()->image('three.jpg'),
                UploadedFile::fake()->image('four.jpg'),
                UploadedFile::fake()->image('five.jpg'),
            ],
        ])
        ->assertSessionHasErrors('image_files');

    $this->assertDatabaseMissing('lapangans', ['name' => 'Tenis Court']);
    expect(Storage::disk('public')->allFiles('lapangans'))->toBeEmpty();
});

test('lapangan image uploads reject non-image files', function () {
    Storage::fake('public');
    $superadmin = User::factory()->create(['role' => 'superadmin']);
    $category = Category::create([
        'name' => 'Voli',
        'slug' => 'voli',
        'is_active' => true,
    ]);

    $this->actingAs($superadmin)
        ->post(route('admin.lapangans.store'), [
            'name' => 'Voli Arena',
            'category_id' => $category->id,
            'price_per_hour' => 100000,
            'operational_start' => '07:00',
            'operational_end' => '23:00',
            'slot_duration_minutes' => 60,
            'image_files' => [UploadedFile::fake()->create('document.pdf', 10, 'application/pdf')],
        ])
        ->assertSessionHasErrors('image_files.0');

    $this->assertDatabaseMissing('lapangans', ['name' => 'Voli Arena']);
    expect(Storage::disk('public')->allFiles('lapangans'))->toBeEmpty();
});

test('editing a lapangan keeps selected old photos and removes deleted stored photos', function () {
    Storage::fake('public');
    $superadmin = User::factory()->create(['role' => 'superadmin']);
    $category = Category::create([
        'name' => 'Basket',
        'slug' => 'basket',
        'is_active' => true,
    ]);
    Storage::disk('public')->put('lapangans/front.jpg', 'front-image');
    Storage::disk('public')->put('lapangans/side.jpg', 'side-image');
    $frontUrl = Storage::disk('public')->url('lapangans/front.jpg');
    $sideUrl = Storage::disk('public')->url('lapangans/side.jpg');
    $lapangan = Lapangan::create([
        'category_id' => $category->id,
        'name' => 'Basket Court',
        'slug' => 'basket-court',
        'price_per_hour' => 100000,
        'operational_start' => '07:00',
        'operational_end' => '23:00',
        'slot_duration_minutes' => 60,
        'images' => [$frontUrl, $sideUrl],
        'is_active' => true,
    ]);

    $this->actingAs($superadmin)
        ->post(route('admin.lapangans.update', $lapangan), [
            '_method' => 'put',
            'name' => $lapangan->name,
            'category_id' => $category->id,
            'description' => '',
            'price_per_hour' => 100000,
            'operational_start' => '07:00',
            'operational_end' => '23:00',
            'slot_duration_minutes' => 60,
            'images_to_keep' => [$sideUrl],
            'image_files' => [UploadedFile::fake()->image('new.jpg')],
            'image_url' => '',
            'facilities' => [],
        ])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $updatedLapangan = $lapangan->fresh();

    expect($updatedLapangan->images)->toHaveCount(2)
        ->and($updatedLapangan->images)->toContain($sideUrl)
        ->and($updatedLapangan->images)->not->toContain($frontUrl);
    Storage::disk('public')->assertMissing('lapangans/front.jpg');
    Storage::disk('public')->assertExists('lapangans/side.jpg');
    Storage::disk('public')->assertExists('lapangans/'.basename((string) parse_url($updatedLapangan->images[1], PHP_URL_PATH)));
});

test('editing a lapangan can remove its entire photo gallery', function () {
    Storage::fake('public');
    $superadmin = User::factory()->create(['role' => 'superadmin']);
    $category = Category::create([
        'name' => 'Badminton Indoor',
        'slug' => 'badminton-indoor',
        'is_active' => true,
    ]);
    Storage::disk('public')->put('lapangans/only-photo.jpg', 'photo');
    $photoUrl = Storage::disk('public')->url('lapangans/only-photo.jpg');
    $lapangan = Lapangan::create([
        'category_id' => $category->id,
        'name' => 'Badminton Indoor Court',
        'slug' => 'badminton-indoor-court',
        'price_per_hour' => 100000,
        'operational_start' => '07:00',
        'operational_end' => '23:00',
        'slot_duration_minutes' => 60,
        'images' => [$photoUrl],
        'is_active' => true,
    ]);

    $this->actingAs($superadmin)
        ->post(route('admin.lapangans.update', $lapangan), [
            '_method' => 'put',
            'name' => $lapangan->name,
            'category_id' => $category->id,
            'description' => '',
            'price_per_hour' => 100000,
            'operational_start' => '07:00',
            'operational_end' => '23:00',
            'slot_duration_minutes' => 60,
            'images_to_keep_count' => 0,
            'image_files' => [],
            'image_url' => '',
            'facilities' => [],
        ])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    expect($lapangan->fresh()->images)->toBe([]);
    Storage::disk('public')->assertMissing('lapangans/only-photo.jpg');
});
