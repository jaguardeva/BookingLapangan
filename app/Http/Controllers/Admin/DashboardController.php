<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Lapangan;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $user = auth()->user();
        $isSuperAdmin = $user->isSuperAdmin();

        $lapanganQuery = Lapangan::where('is_active', true);
        $bookingQuery = Booking::query();

        if (! $isSuperAdmin) {
            $assignedIds = $user->assignedLapangans()->pluck('lapangans.id');
            $lapanganQuery->whereIn('id', $assignedIds);
            $bookingQuery->whereIn('lapangan_id', $assignedIds);
        }

        $today = Carbon::today()->format('Y-m-d');

        $todayBookingsCount = (clone $bookingQuery)
            ->where('booking_date', $today)
            ->whereIn('payment_status', ['pending', 'pending_validation', 'approved'])
            ->count();

        $todayRevenue = (clone $bookingQuery)
            ->where('booking_date', $today)
            ->where('payment_status', 'approved')
            ->sum('total_price');

        $totalRevenue = (clone $bookingQuery)
            ->where('payment_status', 'approved')
            ->sum('total_price');

        $pendingValidationCount = (clone $bookingQuery)
            ->where('payment_status', 'pending_validation')
            ->count();

        $totalBookings = (clone $bookingQuery)->count();

        // Status breakdown
        $statusCounts = (clone $bookingQuery)
            ->select('payment_status', DB::raw('count(*) as total'))
            ->groupBy('payment_status')
            ->pluck('total', 'payment_status')
            ->toArray();

        $statusDistribution = [
            'approved' => $statusCounts['approved'] ?? 0,
            'pending_validation' => $statusCounts['pending_validation'] ?? 0,
            'pending' => $statusCounts['pending'] ?? 0,
            'rejected' => $statusCounts['rejected'] ?? 0,
            'cancelled' => $statusCounts['cancelled'] ?? 0,
        ];

        // Payment method distribution
        $paymentMethods = (clone $bookingQuery)
            ->select('payment_method', DB::raw('count(*) as total'))
            ->groupBy('payment_method')
            ->pluck('total', 'payment_method')
            ->toArray();

        $paymentDistribution = [
            'transfer' => $paymentMethods['transfer'] ?? 0,
            'cash' => $paymentMethods['cash'] ?? 0,
        ];

        // Popular lapangans
        $popularLapangans = Lapangan::where('is_active', true)
            ->when(! $isSuperAdmin, function ($q) use ($user) {
                $q->whereIn('id', $user->assignedLapangans()->pluck('lapangans.id'));
            })
            ->withCount(['bookings' => function ($q) {
                $q->where('payment_status', 'approved');
            }])
            ->withSum(['bookings' => function ($q) {
                $q->where('payment_status', 'approved');
            }], 'total_price')
            ->orderByDesc('bookings_count')
            ->take(5)
            ->get()
            ->map(function ($lap) {
                return [
                    'id' => $lap->id,
                    'name' => $lap->name,
                    'bookings_count' => $lap->bookings_count ?? 0,
                    'revenue' => (int) ($lap->bookings_sum_total_price ?? 0),
                ];
            });

        // 7-day revenue chart
        $revenueChart = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = Carbon::today()->subDays($i);
            $dateStr = $date->format('Y-m-d');
            $rev = (clone $bookingQuery)
                ->where('booking_date', $dateStr)
                ->where('payment_status', 'approved')
                ->sum('total_price');

            $count = (clone $bookingQuery)
                ->where('booking_date', $dateStr)
                ->where('payment_status', 'approved')
                ->count();

            $revenueChart[] = [
                'date' => $date->translatedFormat('d M'),
                'revenue' => (int) $rev,
                'count' => $count,
            ];
        }

        // Recent bookings
        $recentBookings = (clone $bookingQuery)
            ->with(['lapangan', 'user'])
            ->latest()
            ->take(6)
            ->get();

        return Inertia::render('admin/dashboard', [
            'isSuperAdmin' => $isSuperAdmin,
            'stats' => [
                'today_bookings' => $todayBookingsCount,
                'today_revenue' => (int) $todayRevenue,
                'total_revenue' => (int) $totalRevenue,
                'pending_validation' => $pendingValidationCount,
                'total_bookings' => $totalBookings,
                'total_fields' => $lapanganQuery->count(),
            ],
            'statusDistribution' => $statusDistribution,
            'paymentDistribution' => $paymentDistribution,
            'popularLapangans' => $popularLapangans,
            'revenueChart' => $revenueChart,
            'recentBookings' => $recentBookings,
        ]);
    }
}
