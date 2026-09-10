<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Booking;
use App\Models\Lapangan;
use App\Notifications\PaymentApprovedNotification;
use App\Notifications\PaymentRejectedNotification;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BookingManagementController extends Controller
{
    public function index(Request $request): Response
    {
        $user = auth()->user();
        $isSuperAdmin = $user->isSuperAdmin();

        $query = Booking::with(['lapangan.category', 'user', 'validator'])
            ->latest();

        // Scope to assigned lapangan if regular admin
        if (! $isSuperAdmin) {
            $assignedIds = $user->assignedLapangans()->pluck('lapangans.id');
            $query->whereIn('lapangan_id', $assignedIds);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('booking_code', 'ilike', "%{$search}%")
                    ->orWhere('customer_name', 'ilike', "%{$search}%")
                    ->orWhere('customer_phone', 'ilike', "%{$search}%");
            });
        }

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('payment_status', $request->status);
        }

        if ($request->filled('lapangan_id') && $request->lapangan_id !== 'all') {
            $query->where('lapangan_id', $request->lapangan_id);
        }

        if ($request->filled('date')) {
            $query->where('booking_date', $request->date);
        }

        $bookings = $query->paginate(15)->withQueryString();

        $lapangans = $isSuperAdmin
            ? Lapangan::where('is_active', true)->get(['id', 'name'])
            : $user->assignedLapangans()->where('is_active', true)->get(['lapangans.id', 'lapangans.name']);

        return Inertia::render('admin/bookings/index', [
            'bookings' => $bookings,
            'lapangans' => $lapangans,
            'filters' => [
                'search' => $request->query('search', ''),
                'status' => $request->query('status', ''),
                'lapangan_id' => $request->query('lapangan_id', ''),
                'date' => $request->query('date', ''),
            ],
        ]);
    }

    public function approve(Request $request, Booking $booking): RedirectResponse
    {
        $user = auth()->user();
        if (! $user->canManageLapangan($booking->lapangan)) {
            abort(403, 'Anda tidak memiliki hak akses untuk memvalidasi lapangan ini.');
        }

        $booking->update([
            'payment_status' => 'approved',
            'validated_by' => $user->id,
            'validated_at' => now(),
            'rejection_reason' => null,
        ]);

        // Send Notification to customer
        if ($booking->user) {
            $booking->user->notify(new PaymentApprovedNotification($booking));
        }

        ActivityLog::log('payment_approved', "Admin {$user->name} menyetujui pembayaran booking #{$booking->booking_code} ({$booking->lapangan->name})", [
            'booking_id' => $booking->id,
            'amount' => $booking->total_price,
            'method' => $booking->payment_method,
        ]);

        return back()->with('success', "Pembayaran untuk booking #{$booking->booking_code} berhasil disetujui!");
    }

    public function reject(Request $request, Booking $booking): RedirectResponse
    {
        $user = auth()->user();
        if (! $user->canManageLapangan($booking->lapangan)) {
            abort(403, 'Anda tidak memiliki hak akses untuk memvalidasi lapangan ini.');
        }

        $validated = $request->validate([
            'reason' => ['required', 'string', 'max:500'],
        ]);

        $booking->update([
            'payment_status' => 'rejected',
            'rejection_reason' => $validated['reason'],
            'validated_by' => $user->id,
            'validated_at' => now(),
        ]);

        // Send notification to customer
        if ($booking->user) {
            $booking->user->notify(new PaymentRejectedNotification($booking, $validated['reason']));
        }

        ActivityLog::log('payment_rejected', "Admin {$user->name} menolak pembayaran booking #{$booking->booking_code}: {$validated['reason']}", [
            'booking_id' => $booking->id,
            'reason' => $validated['reason'],
        ]);

        return back()->with('info', "Pembayaran untuk booking #{$booking->booking_code} telah ditolak dengan alasan yang tercatat.");
    }
}
