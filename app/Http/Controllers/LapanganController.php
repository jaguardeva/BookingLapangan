<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Category;
use App\Models\Facility;
use App\Models\Lapangan;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LapanganController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Lapangan::where('is_active', true)
            ->with(['category', 'facilities'])
            ->withAvg('reviews', 'rating')
            ->withCount('reviews');

        if ($request->filled('category')) {
            $query->whereHas('category', function ($q) use ($request) {
                $q->where('slug', $request->category);
            });
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'ilike', "%{$search}%")
                    ->orWhere('description', 'ilike', "%{$search}%");
            });
        }

        if ($request->filled('facility')) {
            $facilityId = $request->facility;
            $query->whereHas('facilities', function ($q) use ($facilityId) {
                $q->where('facilities.id', $facilityId);
            });
        }

        if ($request->filled('sort')) {
            match ($request->sort) {
                'price_asc' => $query->orderBy('price_per_hour', 'asc'),
                'price_desc' => $query->orderBy('price_per_hour', 'desc'),
                'rating' => $query->orderByDesc('reviews_avg_rating'),
                default => $query->latest(),
            };
        } else {
            $query->latest();
        }

        $lapangans = $query->paginate(9)->withQueryString();
        $categories = Category::where('is_active', true)->get();
        $facilities = Facility::all();

        return Inertia::render('lapangan/index', [
            'lapangans' => $lapangans,
            'categories' => $categories,
            'facilities' => $facilities,
            'filters' => [
                'search' => $request->query('search', ''),
                'category' => $request->query('category', ''),
                'facility' => $request->query('facility', ''),
                'sort' => $request->query('sort', 'latest'),
            ],
        ]);
    }

    public function show(string $slug): Response
    {
        $lapangan = Lapangan::where('slug', $slug)
            ->where('is_active', true)
            ->with(['category', 'facilities', 'reviews.user'])
            ->withAvg('reviews', 'rating')
            ->withCount('reviews')
            ->firstOrFail();

        // 3 Days allowed horizon: Today, Tomorrow, Day After Tomorrow
        $today = Carbon::today();
        $tomorrow = Carbon::tomorrow();
        $dayAfter = Carbon::today()->addDays(2);

        $allowedDates = [
            [
                'date' => $today->format('Y-m-d'),
                'day_name' => 'Hari Ini',
                'formatted' => $today->translatedFormat('d M Y'),
            ],
            [
                'date' => $tomorrow->format('Y-m-d'),
                'day_name' => 'Besok',
                'formatted' => $tomorrow->translatedFormat('d M Y'),
            ],
            [
                'date' => $dayAfter->format('Y-m-d'),
                'day_name' => 'Lusa',
                'formatted' => $dayAfter->translatedFormat('d M Y'),
            ],
        ];

        // Fetch all active bookings in this 3-day window to calculate occupied slots
        $bookings = Booking::where('lapangan_id', $lapangan->id)
            ->whereIn('booking_date', [$today->format('Y-m-d'), $tomorrow->format('Y-m-d'), $dayAfter->format('Y-m-d')])
            ->whereIn('payment_status', ['pending', 'pending_validation', 'approved'])
            ->get(['booking_date', 'start_time', 'end_time', 'duration_hours']);

        // Related lapangans in same category
        $relatedLapangans = Lapangan::where('category_id', $lapangan->category_id)
            ->where('id', '!=', $lapangan->id)
            ->where('is_active', true)
            ->with(['category'])
            ->withAvg('reviews', 'rating')
            ->take(3)
            ->get();

        return Inertia::render('lapangan/show', [
            'lapangan' => $lapangan,
            'allowedDates' => $allowedDates,
            'existingBookings' => $bookings,
            'relatedLapangans' => $relatedLapangans,
        ]);
    }

    public function getSlots(Request $request, Lapangan $lapangan): JsonResponse
    {
        $date = $request->query('date', Carbon::today()->format('Y-m-d'));

        $bookings = Booking::where('lapangan_id', $lapangan->id)
            ->where('booking_date', $date)
            ->whereIn('payment_status', ['pending', 'pending_validation', 'approved'])
            ->get(['start_time', 'end_time', 'duration_hours']);

        return response()->json([
            'date' => $date,
            'bookings' => $bookings,
        ]);
    }
}
