<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Facility;
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
            ->with(['category', 'facilities'])
            ->withAvg('reviews', 'rating')
            ->withCount('reviews')
            ->take(6)
            ->get();

        $facilities = Facility::all();

        $testimonials = Review::with(['user', 'lapangan'])
            ->where('rating', '>=', 4)
            ->latest()
            ->take(4)
            ->get();

        return Inertia::render('home', [
            'categories' => $categories,
            'featuredLapangans' => $featuredLapangans,
            'facilities' => $facilities,
            'testimonials' => $testimonials,
            'stats' => [
                'total_lapangan' => Lapangan::where('is_active', true)->count(),
                'total_categories' => $categories->count(),
                'satisfaction_rate' => 99,
            ],
        ]);
    }
}
