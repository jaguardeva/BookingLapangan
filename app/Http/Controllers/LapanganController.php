<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Category;
use App\Models\Lapangan;
use App\Support\Pagination;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LapanganController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('lapangan/index');
    }

    public function data(Request $request): JsonResponse
    {
        $query = Lapangan::where('is_active', true)
            ->whereHas('category', fn ($query) => $query->where('is_active', true))
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
                $q->whereLike('name', "%{$search}%")
                    ->orWhereLike('description', "%{$search}%");
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

        return response()->json([
            'lapangans' => $query->paginate(Pagination::perPage($request, 10))->withQueryString(),
            'categories' => Category::where('is_active', true)->get(),
            'filters' => [
                'search' => $request->query('search', ''),
                'category' => $request->query('category', ''),
                'sort' => $request->query('sort', 'latest'),
            ],
        ]);
    }

    public function show(string $slug): Response
    {
        $lapanganQuery = fn () => Lapangan::where('slug', $slug)
            ->where('is_active', true)
            ->whereHas('category', fn ($query) => $query->where('is_active', true));

        abort_unless($lapanganQuery()->exists(), 404);

        return Inertia::render('lapangan/show', [
            'slug' => $slug,
        ]);
    }

    public function showData(string $slug): JsonResponse
    {
        $lapanganQuery = fn () => Lapangan::where('slug', $slug)
            ->where('is_active', true)
            ->whereHas('category', fn ($query) => $query->where('is_active', true));

        $lapangan = $lapanganQuery()
            ->with(['category', 'facilities', 'reviews.user'])
            ->withAvg('reviews', 'rating')
            ->withCount('reviews')
            ->first();

        if (! $lapangan) {
            return response()->json([
                'message' => 'Lapangan tidak ditemukan atau sudah tidak tersedia.',
            ], 404);
        }

        $today = Carbon::today();
        $allowedDates = collect(range(0, 7))
            ->map(function (int $dayOffset) use ($today): array {
                $date = $today->copy()->addDays($dayOffset);

                return [
                    'date' => $date->format('Y-m-d'),
                    'day_name' => $date->translatedFormat('l'),
                    'formatted' => $date->translatedFormat('d M Y'),
                ];
            })
            ->all();

        // Fetch all active bookings in this 8-day window to calculate occupied slots
        $bookings = Booking::where('lapangan_id', $lapangan->id)
            ->whereBetween('booking_date', [
                $today->format('Y-m-d'),
                $today->copy()->addDays(7)->format('Y-m-d'),
            ])
            ->whereIn('payment_status', ['pending', 'pending_validation', 'approved'])
            ->get(['id', 'booking_date', 'start_time', 'end_time', 'duration_hours', 'membership_id', 'booking_source'])
            ->map(function (Booking $booking): array {
                return [
                    'id' => $booking->id,
                    'booking_date' => $booking->booking_date?->format('Y-m-d'),
                    'start_time' => $booking->start_time,
                    'end_time' => $booking->end_time,
                    'duration_hours' => $booking->duration_hours,
                    'membership_id' => $booking->membership_id,
                    'booking_source' => $booking->booking_source,
                    'is_membership' => $booking->membership_id !== null || $booking->booking_source === 'membership',
                ];
            });

        // Related lapangans in same category
        $relatedLapangans = Lapangan::where('category_id', $lapangan->category_id)
            ->where('id', '!=', $lapangan->id)
            ->where('is_active', true)
            ->with(['category'])
            ->withAvg('reviews', 'rating')
            ->take(3)
            ->get();

        $data = [
            'lapangan' => $lapangan,
            'allowedDates' => $allowedDates,
            'existingBookings' => $bookings,
            'relatedLapangans' => $relatedLapangans,
        ];

        return response()->json($data);
    }

    public function getSlots(Request $request, Lapangan $lapangan): JsonResponse
    {
        $date = $request->query('date', Carbon::today()->format('Y-m-d'));

        $bookings = Booking::where('lapangan_id', $lapangan->id)
            ->where('booking_date', $date)
            ->whereIn('payment_status', ['pending', 'pending_validation', 'approved'])
            ->get(['id', 'start_time', 'end_time', 'duration_hours', 'membership_id', 'booking_source'])
            ->map(fn (Booking $booking): array => [
                'id' => $booking->id,
                'start_time' => $booking->start_time,
                'end_time' => $booking->end_time,
                'duration_hours' => $booking->duration_hours,
                'membership_id' => $booking->membership_id,
                'booking_source' => $booking->booking_source,
                'is_membership' => $booking->membership_id !== null || $booking->booking_source === 'membership',
            ]);

        return response()->json([
            'date' => $date,
            'bookings' => $bookings,
        ]);
    }
}
