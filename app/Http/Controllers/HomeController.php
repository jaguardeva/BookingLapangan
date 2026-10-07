<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Lapangan;
use App\Models\Review;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    public function index(): Response
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

        return Inertia::render('home', [
            'categories' => $categories,
            'featuredLapangans' => $featuredLapangans,
            'testimonials' => $testimonials,
            'stats' => [
                'total_lapangan' => Lapangan::where('is_active', true)
                    ->whereHas('category', fn ($query) => $query->where('is_active', true))
                    ->count(),
                'total_categories' => $categories->count(),
                'total_reviews' => $totalReviews,
                'average_rating' => round($averageRating, 1),
            ],
        ]);
    }
}
