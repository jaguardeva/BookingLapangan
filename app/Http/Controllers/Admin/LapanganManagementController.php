<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Category;
use App\Models\Facility;
use App\Models\Lapangan;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class LapanganManagementController extends Controller
{
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

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'category_id' => ['required', 'exists:categories,id'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'price_per_hour' => ['required', 'integer', 'min:10000'],
            'operational_start' => ['required', 'string'],
            'operational_end' => ['required', 'string'],
            'slot_duration_minutes' => ['required', 'integer', 'in:30,60,90,120'],
            'image_url' => ['nullable', 'url'],
            'facilities' => ['nullable', 'array'],
            'facilities.*' => ['exists:facilities,id'],
        ]);

        $images = [];
        if (! empty($validated['image_url'])) {
            $images[] = $validated['image_url'];
        } else {
            $images[] = 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1000&q=80';
        }

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

        if (! empty($validated['facilities'])) {
            $lapangan->facilities()->sync($validated['facilities']);
        }

        ActivityLog::log('lapangan_created', "Superadmin membuat lapangan baru: {$lapangan->name}", [
            'lapangan_id' => $lapangan->id,
        ]);

        return back()->with('success', "Lapangan {$lapangan->name} berhasil ditambahkan!");
    }

    public function update(Request $request, Lapangan $lapangan): RedirectResponse
    {
        $validated = $request->validate([
            'category_id' => ['required', 'exists:categories,id'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'price_per_hour' => ['required', 'integer', 'min:10000'],
            'operational_start' => ['required', 'string'],
            'operational_end' => ['required', 'string'],
            'slot_duration_minutes' => ['required', 'integer'],
            'image_url' => ['nullable', 'url'],
            'facilities' => ['nullable', 'array'],
            'facilities.*' => ['exists:facilities,id'],
        ]);

        $images = $lapangan->images ?? [];
        if (! empty($validated['image_url'])) {
            $images = array_merge([$validated['image_url']], array_slice($images, 0, 3));
        }

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
}
