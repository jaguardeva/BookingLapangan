<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Banner;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class BannerManagementController extends Controller
{
    public function index(): Response
    {
        $banners = Banner::query()->latest('sort_order')->latest()->paginate(15);
        $banners->getCollection()->transform(function (Banner $banner): Banner {
            $banner->setAttribute(
                'image_url',
                str_starts_with($banner->image_path, 'http')
                    ? $banner->image_path
                    : Storage::disk('public')->url($banner->image_path),
            );

            return $banner;
        });

        return Inertia::render('admin/banners/index', ['banners' => $banners]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $this->validated($request);
        $validated['image_path'] = $request->file('image')->store('banners', 'public');
        $validated['created_by'] = auth()->id();
        $validated['updated_by'] = auth()->id();
        unset($validated['image']);
        $banner = Banner::create($validated);

        ActivityLog::log('banner_created', "Banner {$banner->title} dibuat.", ['banner_id' => $banner->id]);

        return back()->with('success', 'Banner berhasil dibuat.');
    }

    public function update(Request $request, Banner $banner): RedirectResponse
    {
        $validated = $this->validated($request, false);
        if ($request->hasFile('image')) {
            Storage::disk('public')->delete($banner->image_path);
            $validated['image_path'] = $request->file('image')->store('banners', 'public');
        }
        $validated['updated_by'] = auth()->id();
        unset($validated['image']);
        $banner->update($validated);

        return back()->with('success', 'Banner berhasil diperbarui.');
    }

    public function toggle(Banner $banner): RedirectResponse
    {
        $banner->update(['is_active' => ! $banner->is_active, 'updated_by' => auth()->id()]);

        return back()->with('info', 'Status banner berhasil diperbarui.');
    }

    public function destroy(Banner $banner): RedirectResponse
    {
        Storage::disk('public')->delete($banner->image_path);
        $banner->delete();

        return back()->with('info', 'Banner berhasil dihapus.');
    }

    /** @return array<string, mixed> */
    private function validated(Request $request, bool $creating = true): array
    {
        return $request->validate([
            'title' => ['required', 'string', 'max:160'],
            'body' => ['nullable', 'string', 'max:2000'],
            'image' => [$creating ? 'required' : 'nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'alt_text' => ['nullable', 'string', 'max:255'],
            'link_url' => ['nullable', 'url', 'max:2048'],
            'placement' => ['required', Rule::in(['home'])],
            'sort_order' => ['required', 'integer', 'min:0'],
            'is_active' => ['required', 'boolean'],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date', 'after_or_equal:starts_at'],
        ]);
    }
}
