<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Lapangan;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    public function index(Request $request): Response
    {
        $user = auth()->user();
        $isSuperAdmin = $user->isSuperAdmin();

        $startDate = $request->query('start_date', Carbon::today()->subDays(30)->format('Y-m-d'));
        $endDate = $request->query('end_date', Carbon::today()->format('Y-m-d'));

        $query = Booking::with(['lapangan', 'user', 'validator'])
            ->whereBetween('booking_date', [$startDate, $endDate]);

        if (! $isSuperAdmin) {
            $assignedIds = $user->assignedLapangans()->pluck('lapangans.id');
            $query->whereIn('lapangan_id', $assignedIds);
        }

        if ($request->filled('lapangan_id') && $request->lapangan_id !== 'all') {
            $query->where('lapangan_id', $request->lapangan_id);
        }

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('payment_status', $request->status);
        }

        $totalRevenue = (clone $query)->where('payment_status', 'approved')->sum('total_price');
        $totalBookings = (clone $query)->count();
        $approvedBookings = (clone $query)->where('payment_status', 'approved')->count();
        $cancelledBookings = (clone $query)->where('payment_status', 'cancelled')->count();

        $bookings = $query->latest('booking_date')->paginate(20)->withQueryString();

        $lapangans = $isSuperAdmin
            ? Lapangan::where('is_active', true)->get(['id', 'name'])
            : $user->assignedLapangans()->where('is_active', true)->get(['lapangans.id', 'lapangans.name']);

        return Inertia::render('admin/reports/index', [
            'bookings' => $bookings,
            'lapangans' => $lapangans,
            'summary' => [
                'total_revenue' => (int) $totalRevenue,
                'total_bookings' => $totalBookings,
                'approved_bookings' => $approvedBookings,
                'cancelled_bookings' => $cancelledBookings,
            ],
            'filters' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
                'lapangan_id' => $request->query('lapangan_id', 'all'),
                'status' => $request->query('status', 'all'),
            ],
        ]);
    }

    public function exportCsv(Request $request): StreamedResponse
    {
        $user = auth()->user();
        $isSuperAdmin = $user->isSuperAdmin();

        $startDate = $request->query('start_date', Carbon::today()->subDays(30)->format('Y-m-d'));
        $endDate = $request->query('end_date', Carbon::today()->format('Y-m-d'));

        $query = Booking::with(['lapangan', 'user'])
            ->whereBetween('booking_date', [$startDate, $endDate]);

        if (! $isSuperAdmin) {
            $assignedIds = $user->assignedLapangans()->pluck('lapangans.id');
            $query->whereIn('lapangan_id', $assignedIds);
        }

        if ($request->filled('lapangan_id') && $request->lapangan_id !== 'all') {
            $query->where('lapangan_id', $request->lapangan_id);
        }

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('payment_status', $request->status);
        }

        $bookings = $query->latest('booking_date')->get();

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"laporan-booking-{$startDate}-to-{$endDate}.csv\"",
        ];

        return response()->stream(function () use ($bookings) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, [
                'Kode Booking',
                'Tanggal Booking',
                'Lapangan',
                'Nama Pemesan',
                'No Telepon',
                'Jam Mulai',
                'Jam Selesai',
                'Durasi (Jam)',
                'Harga Dasar',
                'Kode Unik',
                'Total Bayar',
                'Metode',
                'Status Pembayaran',
                'Waktu Dibuat',
            ]);

            foreach ($bookings as $b) {
                fputcsv($handle, [
                    $b->booking_code,
                    $b->booking_date->format('Y-m-d'),
                    $b->lapangan->name ?? '-',
                    $b->customer_name,
                    $b->customer_phone,
                    $b->start_time,
                    $b->end_time,
                    $b->duration_hours,
                    $b->base_price,
                    $b->validation_code,
                    $b->total_price,
                    strtoupper($b->payment_method),
                    strtoupper($b->payment_status),
                    $b->created_at->format('Y-m-d H:i:s'),
                ]);
            }

            fclose($handle);
        }, 200, $headers);
    }
}
