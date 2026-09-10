<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Lapangan;
use Carbon\Carbon;
use Illuminate\Http\Request;
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

        // 7-day revenue chart
        $revenueChart = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = Carbon::today()->subDays($i);
            $dateStr = $date->format('Y-m-d');
            $rev = (clone $bookingQuery)
                ->where('booking_date', $dateStr)
                ->where('payment_status', 'approved')
                ->sum('total_price');

            $revenueChart[] = [
                'date' => $date->translatedFormat('d M'),
                'revenue' => (int) $rev,
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
            'revenueChart' => $revenueChart,
            'recentBookings' => $recentBookings,
        ]);
    }
}
