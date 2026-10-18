<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Category;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class CategoryManagementController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:categories,name'],
            'icon' => ['nullable', 'string', 'max:100'],
            'description' => ['nullable', 'string', 'max:2000'],
        ]);

        $baseSlug = Str::slug($validated['name']) ?: 'category';
        $slug = $baseSlug;
        $suffix = 2;

        while (Category::query()->where('slug', $slug)->exists()) {
            $slug = $baseSlug.'-'.$suffix;
            $suffix++;
        }

        $category = Category::create([
            ...$validated,
            'slug' => $slug,
            'is_active' => true,
        ]);

        ActivityLog::log('category_created', "Superadmin menambahkan kategori: {$category->name}", [
            'category_id' => $category->id,
        ]);

        return back()->with('success', "Kategori {$category->name} berhasil ditambahkan.");
    }

    public function update(Request $request, Category $category): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', Rule::unique('categories', 'name')->ignore($category)],
            'icon' => ['nullable', 'string', 'max:100'],
            'description' => ['nullable', 'string', 'max:2000'],
        ]);

        $category->update($validated);

        ActivityLog::log('category_updated', "Superadmin memperbarui kategori: {$category->name}", [
            'category_id' => $category->id,
        ]);

        return back()->with('success', "Kategori {$category->name} berhasil diperbarui.");
    }

    public function toggle(Category $category): RedirectResponse
    {
        $category->update(['is_active' => ! $category->is_active]);

        $status = $category->is_active ? 'diaktifkan' : 'dinonaktifkan';
        ActivityLog::log('category_status_changed', "Superadmin {$status} kategori: {$category->name}", [
            'category_id' => $category->id,
            'is_active' => $category->is_active,
        ]);

        return back()->with('success', "Kategori {$category->name} berhasil {$status}.");
    }

    public function destroy(Category $category): RedirectResponse
    {
        if ($category->lapangans()->exists()) {
            return back()->with('error', "Kategori {$category->name} tidak dapat dihapus karena masih terhubung dengan {$category->lapangans()->count()} lapangan.");
        }

        $name = $category->name;
        $category->delete();

        ActivityLog::log('category_deleted', "Superadmin menghapus kategori: {$name}", [
            'category_id' => $category->id,
        ]);

        return back()->with('success', "Kategori {$name} berhasil dihapus.");
    }

    public function bulkDestroy(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['required', 'string', 'exists:categories,id'],
        ]);

        $categories = Category::query()->whereIn('id', $validated['ids'])->withCount('lapangans')->get();

        $blocked = $categories->filter(fn ($cat) => $cat->lapangans_count > 0);
        $deletable = $categories->filter(fn ($cat) => $cat->lapangans_count === 0);

        if ($deletable->isEmpty()) {
            return back()->with('error', 'Semua kategori yang dipilih masih terhubung dengan lapangan dan tidak dapat dihapus.');
        }

        $deletedCount = $deletable->count();
        Category::query()->whereIn('id', $deletable->pluck('id'))->delete();

        ActivityLog::log('category_bulk_deleted', "Superadmin menghapus {$deletedCount} kategori.", [
            'deleted_ids' => $deletable->pluck('id')->all(),
        ]);

        if ($blocked->isNotEmpty()) {
            return back()->with('warning', "Berhasil menghapus {$deletedCount} kategori. Sebanyak {$blocked->count()} kategori dilewati karena masih memiliki lapangan terkait.");
        }

        return back()->with('success', "Berhasil menghapus {$deletedCount} kategori.");
    }
}
