<?php

namespace App\Http\Controllers;

use App\Models\Banner;
use App\Models\Category;
use App\Models\Lapangan;
use App\Models\Review;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('home');
    }

    public function data(): JsonResponse
    {
        $categories = Category::where('is_active', true)
            ->withCount(['lapangans' => fn ($q) => $q->where('is_active', true)])
            ->get();

        $featuredLapangans = Lapangan::where('is_active', true)
            ->whereHas('category', fn ($query) => $query->where('is_active', true))
            ->with(['category', 'facilities'])
            ->withAvg('reviews', 'rating')
            ->withCount('reviews')
            ->take(6)
            ->get();

        $testimonials = Review::query()
            ->with([
                'user:id,name',
                'lapangan:id,name,slug',
            ])
            ->whereHas('lapangan', fn ($query) => $query->where('is_active', true))
            ->where('rating', '>=', 4)
            ->whereNotNull('comment')
            ->where('comment', '!=', '')
            ->latest()
            ->take(6)
            ->get();

        $activeReviews = Review::query()
            ->whereHas('lapangan', fn ($query) => $query->where('is_active', true));
        $totalReviews = (clone $activeReviews)->count();
        $averageRating = (float) ((clone $activeReviews)->avg('rating') ?? 0);

        $data = [
            'categories' => $categories,
            'featuredLapangans' => $featuredLapangans,
            'testimonials' => $testimonials,
            'banners' => Banner::visible()->get()->each(function (Banner $banner): void {
                $banner->setAttribute(
                    'image_url',
                    str_starts_with($banner->image_path, 'http')
                        ? $banner->image_path
                        : Storage::disk('public')->url($banner->image_path),
                );
            }),
            'stats' => [
                'total_lapangan' => Lapangan::where('is_active', true)
                    ->whereHas('category', fn ($query) => $query->where('is_active', true))
                    ->count(),
                'total_categories' => $categories->count(),
                'total_reviews' => $totalReviews,
                'average_rating' => round($averageRating, 1),
            ],
        ];

        return response()->json($data);
    }
}
