<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Banner;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class BannerManagementController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Banner::query();

        if ($request->filled('search')) {
            $search = trim($request->string('search')->value());
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('body', 'like', "%{$search}%")
                    ->orWhere('alt_text', 'like', "%{$search}%")
                    ->orWhere('link_url', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            $status = $request->string('status')->value();
            if ($status === 'active') {
                $query->where('is_active', true);
            } elseif ($status === 'inactive') {
                $query->where('is_active', false);
            }
        }

        $banners = $query->latest('sort_order')->latest()->paginate(12)->withQueryString();
        $banners->getCollection()->transform(function (Banner $banner): Banner {
            $banner->setAttribute(
                'image_url',
                str_starts_with($banner->image_path, 'http')
                    ? $banner->image_path
                    : Storage::disk('public')->url($banner->image_path),
            );

            return $banner;
        });

        return Inertia::render('admin/banners/index', [
            'banners' => $banners,
            'filters' => [
                'search' => $request->query('search', ''),
                'status' => $request->query('status', 'all'),
            ],
            'stats' => [
                'total' => Banner::count(),
                'active' => Banner::where('is_active', true)->count(),
                'inactive' => Banner::where('is_active', false)->count(),
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $this->validated($request);
        if ($request->hasFile('image')) {
            $validated['image_path'] = $request->file('image')->store('banners', 'public');
        } else {
            $validated['image_path'] = $validated['image_url'];
        }
        $validated['created_by'] = auth()->id();
        $validated['updated_by'] = auth()->id();
        unset($validated['image'], $validated['image_url']);
        $banner = Banner::create($validated);

        ActivityLog::log('banner_created', "Banner {$banner->title} dibuat.", ['banner_id' => $banner->id]);

        return back()->with('success', 'Banner berhasil dibuat.');
    }

    public function update(Request $request, Banner $banner): RedirectResponse
    {
        $validated = $this->validated($request, false);
        if ($request->hasFile('image')) {
            if (! str_starts_with($banner->image_path, 'http')) {
                Storage::disk('public')->delete($banner->image_path);
            }
            $validated['image_path'] = $request->file('image')->store('banners', 'public');
        } elseif (! empty($validated['image_url'])) {
            if (! str_starts_with($banner->image_path, 'http')) {
                Storage::disk('public')->delete($banner->image_path);
            }
            $validated['image_path'] = $validated['image_url'];
        }
        $validated['updated_by'] = auth()->id();
        unset($validated['image'], $validated['image_url']);
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
        if (! str_starts_with($banner->image_path, 'http')) {
            Storage::disk('public')->delete($banner->image_path);
        }
        $banner->delete();

        return back()->with('info', 'Banner berhasil dihapus.');
    }

    /** @return array<string, mixed> */
    private function validated(Request $request, bool $creating = true): array
    {
        $rules = [
            'title' => ['required', 'string', 'max:160'],
            'body' => ['nullable', 'string', 'max:2000'],
            'image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'image_url' => ['nullable', 'url', 'max:2048'],
            'alt_text' => ['nullable', 'string', 'max:255'],
            'link_url' => ['nullable', 'url', 'max:2048'],
            'placement' => ['required', Rule::in(['home'])],
            'sort_order' => ['required', 'integer', 'min:0'],
            'is_active' => ['required', 'boolean'],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date', 'after_or_equal:starts_at'],
        ];

        $validator = Validator::make($request->all(), $rules);

        if ($creating) {
            $validator->after(function ($validator) use ($request) {
                if (! $request->hasFile('image') && ! $request->filled('image_url')) {
                    $validator->errors()->add('image', 'Pilih file gambar atau masukkan URL gambar.');
                }
            });
        }

        return $validator->validate();
    }
}
