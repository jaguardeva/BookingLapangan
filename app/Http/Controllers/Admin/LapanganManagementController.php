<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Category;
use App\Models\Facility;
use App\Models\Lapangan;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class LapanganManagementController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('admin/lapangan/create', $this->formProps());
    }

    public function edit(Lapangan $lapangan): Response
    {
        $lapangan->load(['category', 'facilities']);

        return Inertia::render('admin/lapangan/edit', [
            ...$this->formProps(),
            'lapangan' => $lapangan,
        ]);
    }

    public function index(): Response
    {
        $lapangans = Lapangan::with(['category', 'facilities'])
            ->withCount('bookings')
            ->latest()
            ->paginate(10);

        $categories = Category::all();
        $facilities = Facility::all();

        return Inertia::render('admin/lapangan/index', [
            'lapangans' => $lapangans,
            'categories' => $categories,
            'facilities' => $facilities,
        ]);
    }

    /**
     * @return array{categories: Collection<int, Category>, facilities: Collection<int, Facility>}
     */
    private function formProps(): array
    {
        return [
            'categories' => Category::all(),
            'facilities' => Facility::all(),
        ];
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'category_id' => ['required', Rule::exists('categories', 'id')->where('is_active', true)],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'price_per_hour' => ['required', 'integer', 'min:10000'],
            'operational_start' => ['required', 'string'],
            'operational_end' => ['required', 'string'],
            'slot_duration_minutes' => ['required', 'integer', 'in:30,60,90,120'],
            'image_files' => ['nullable', 'array', 'max:4'],
            'image_files.*' => ['image', 'mimes:jpeg,png,jpg,webp,gif', 'max:5120'],
            'facilities' => ['nullable', 'array'],
            'facilities.*' => ['exists:facilities,id'],
        ]);

        $imageFiles = $request->file('image_files', []);

        if (count($imageFiles) > 4) {
            throw ValidationException::withMessages([
                'image_files' => 'Maksimal 4 foto dapat disimpan untuk satu lapangan.',
            ]);
        }

        $storedPaths = [];

        try {
            $images = [];

            foreach ($imageFiles as $imageFile) {
                $path = $imageFile->store('lapangans', 'public');

                if ($path === false) {
                    throw new \RuntimeException('Foto lapangan gagal disimpan.');
                }

                $storedPaths[] = $path;
                $images[] = Storage::disk('public')->url($path);
            }

            if ($images === []) {
                $images[] = 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1000&q=80';
            }

            $lapangan = DB::transaction(function () use ($validated, $images): Lapangan {
                $lapangan = Lapangan::create([
                    'category_id' => $validated['category_id'],
                    'name' => $validated['name'],
                    'slug' => Str::slug($validated['name']).'-'.Str::random(4),
                    'description' => $validated['description'] ?? null,
                    'price_per_hour' => $validated['price_per_hour'],
                    'operational_start' => $validated['operational_start'],
                    'operational_end' => $validated['operational_end'],
                    'slot_duration_minutes' => $validated['slot_duration_minutes'],
                    'images' => $images,
                    'is_active' => true,
                ]);

                $lapangan->facilities()->sync($validated['facilities'] ?? []);

                return $lapangan;
            });
        } catch (Throwable $exception) {
            Storage::disk('public')->delete($storedPaths);

            throw $exception;
        }

        ActivityLog::log('lapangan_created', "Superadmin membuat lapangan baru: {$lapangan->name}", [
            'lapangan_id' => $lapangan->id,
        ]);

        return back()->with('success', "Lapangan {$lapangan->name} berhasil ditambahkan!");
    }

    public function update(Request $request, Lapangan $lapangan): RedirectResponse
    {
        $validated = $request->validate([
            'category_id' => [
                'required',
                Rule::exists('categories', 'id')->where(function ($query) use ($lapangan): void {
                    $query->where('is_active', true)->orWhere('id', $lapangan->category_id);
                }),
            ],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'price_per_hour' => ['required', 'integer', 'min:10000'],
            'operational_start' => ['required', 'string'],
            'operational_end' => ['required', 'string'],
            'slot_duration_minutes' => ['required', 'integer'],
            'image_files' => ['nullable', 'array', 'max:4'],
            'image_files.*' => ['image', 'mimes:jpeg,png,jpg,webp,gif', 'max:5120'],
            'images_to_keep' => ['nullable', 'array', 'max:4'],
            'images_to_keep.*' => ['string', 'distinct', Rule::in($lapangan->images ?? [])],
            'images_to_keep_count' => ['nullable', 'integer', 'between:0,4'],
            'facilities' => ['nullable', 'array'],
            'facilities.*' => ['exists:facilities,id'],
        ]);

        $existingImages = $lapangan->images ?? [];
        $imagesToKeep = array_key_exists('images_to_keep_count', $validated)
            ? ($validated['images_to_keep'] ?? [])
            : ($validated['images_to_keep'] ?? $existingImages);

        if (array_key_exists('images_to_keep_count', $validated) && (int) $validated['images_to_keep_count'] !== count($imagesToKeep)) {
            throw ValidationException::withMessages([
                'images_to_keep' => 'Daftar foto yang dipertahankan tidak valid. Muat ulang form dan coba lagi.',
            ]);
        }

        $imagesToKeep = array_values(array_filter(
            $existingImages,
            fn (string $image): bool => in_array($image, $imagesToKeep, true),
        ));
        $imageFiles = $request->file('image_files', []);

        if (count($imagesToKeep) + count($imageFiles) > 4) {
            throw ValidationException::withMessages([
                'image_files' => 'Maksimal 4 foto dapat disimpan untuk satu lapangan. Hapus foto lama atau kurangi foto baru.',
            ]);
        }

        $storedPaths = [];

        try {
            $images = $imagesToKeep;

            foreach ($imageFiles as $imageFile) {
                $path = $imageFile->store('lapangans', 'public');

                if ($path === false) {
                    throw new \RuntimeException('Foto lapangan gagal disimpan.');
                }

                $storedPaths[] = $path;
                $images[] = Storage::disk('public')->url($path);
            }

            DB::transaction(function () use ($lapangan, $validated, $images): void {
                $lapangan->update([
                    'category_id' => $validated['category_id'],
                    'name' => $validated['name'],
                    'description' => $validated['description'] ?? null,
                    'price_per_hour' => $validated['price_per_hour'],
                    'operational_start' => $validated['operational_start'],
                    'operational_end' => $validated['operational_end'],
                    'slot_duration_minutes' => $validated['slot_duration_minutes'],
                    'images' => $images,
                ]);

                if (isset($validated['facilities'])) {
                    $lapangan->facilities()->sync($validated['facilities']);
                }
            });
        } catch (Throwable $exception) {
            Storage::disk('public')->delete($storedPaths);

            throw $exception;
        }

        foreach (array_diff($existingImages, $imagesToKeep) as $removedImage) {
            $path = $this->lapanganImagePath($removedImage);

            if ($path !== null) {
                Storage::disk('public')->delete($path);
            }
        }

        ActivityLog::log('lapangan_updated', "Superadmin memperbarui lapangan: {$lapangan->name}", [
            'lapangan_id' => $lapangan->id,
        ]);

        return back()->with('success', "Lapangan {$lapangan->name} berhasil diperbarui!");
    }

    public function toggleStatus(Lapangan $lapangan): RedirectResponse
    {
        $lapangan->update(['is_active' => ! $lapangan->is_active]);

        $status = $lapangan->is_active ? 'diaktifkan' : 'dinonaktifkan';

        return back()->with('info', "Lapangan {$lapangan->name} berhasil {$status}.");
    }

    public function destroy(Lapangan $lapangan): RedirectResponse
    {
        $name = $lapangan->name;
        $lapangan->delete();

        ActivityLog::log('lapangan_deleted', "Superadmin menghapus lapangan: {$name}");

        return back()->with('info', "Lapangan {$name} berhasil dihapus.");
    }

    private function lapanganImagePath(string $imageUrl): ?string
    {
        $path = parse_url($imageUrl, PHP_URL_PATH);

        if (! is_string($path) || ! str_starts_with($path, '/storage/lapangans/')) {
            return null;
        }

        return substr($path, strlen('/storage/'));
    }
}
