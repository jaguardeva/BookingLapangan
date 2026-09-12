<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Booking;
use App\Models\Lapangan;
use App\Notifications\ManualBookingCreatedNotification;
use App\Notifications\PaymentApprovedNotification;
use App\Notifications\PaymentRejectedNotification;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class BookingManagementController extends Controller
{
    public function storeManual(Request $request): RedirectResponse
    {
        $user = $request->user();
        $validated = $request->validate([
            'lapangan_id' => ['required', 'exists:lapangans,id'],
            'booking_date' => ['required', 'date'],
            'start_time' => ['required', 'date_format:H:i'],
            'duration_hours' => ['required', 'integer', 'min:1', 'max:6'],
            'customer_name' => ['required', 'string', 'max:255'],
            'customer_phone' => ['required', 'string', 'max:20'],
            'customer_email' => ['nullable', 'email', 'max:255'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $lapangan = Lapangan::query()->where('is_active', true)->findOrFail($validated['lapangan_id']);
        if (! $user->canManageLapangan($lapangan)) {
            abort(403, 'Anda tidak memiliki hak akses untuk membuat booking pada lapangan ini.');
        }

        $bookingDate = Carbon::parse($validated['booking_date'])->startOfDay();
        if ($bookingDate->lt(Carbon::today()) || $bookingDate->gt(Carbon::today()->addDays(2)->endOfDay())) {
            throw ValidationException::withMessages([
                'booking_date' => 'Booking hanya diperbolehkan untuk hari ini, besok, atau lusa.',
            ]);
        }

        $startTime = $validated['start_time'];
        $durationHours = (int) $validated['duration_hours'];
        $start = Carbon::parse($validated['booking_date'].' '.$startTime);
        $end = (clone $start)->addHours($durationHours);

        if ($bookingDate->isToday() && $start->lte(now())) {
            throw ValidationException::withMessages([
                'start_time' => 'Jam mulai tidak boleh kurang dari waktu sekarang.',
            ]);
        }

        $operationalStart = Carbon::parse($validated['booking_date'].' '.$lapangan->operational_start);
        $operationalEnd = Carbon::parse($validated['booking_date'].' '.$lapangan->operational_end);
        if ($start->lt($operationalStart) || $end->gt($operationalEnd)) {
            throw ValidationException::withMessages([
                'start_time' => "Jadwal harus dalam jam operasional lapangan ({$lapangan->operational_start} - {$lapangan->operational_end}).",
            ]);
        }

        $booking = DB::transaction(function () use ($lapangan, $validated, $bookingDate, $startTime, $durationHours, $end, $user): Booking {
            $conflict = Booking::query()
                ->where('lapangan_id', $lapangan->id)
                ->whereDate('booking_date', $bookingDate->format('Y-m-d'))
                ->whereIn('payment_status', ['pending', 'pending_validation', 'approved'])
                ->where(function ($query) use ($startTime, $end): void {
                    $query->where('start_time', '<', $end->format('H:i'))
                        ->where('end_time', '>', $startTime);
                })
                ->lockForUpdate()
                ->exists();

            if ($conflict) {
                throw ValidationException::withMessages([
                    'start_time' => 'Slot waktu yang dipilih sudah terisi. Silakan pilih jam lain.',
                ]);
            }

            $basePrice = $lapangan->price_per_hour * $durationHours;

            return Booking::create([
                'booking_code' => Booking::generateBookingCode(),
                'user_id' => null,
                'lapangan_id' => $lapangan->id,
                'booking_date' => $bookingDate->format('Y-m-d'),
                'start_time' => $startTime,
                'end_time' => $end->format('H:i'),
                'duration_hours' => $durationHours,
                'base_price' => $basePrice,
                'validation_code' => 0,
                'total_price' => $basePrice,
                'payment_method' => 'cash',
                'payment_status' => 'approved',
                'customer_name' => $validated['customer_name'],
                'customer_phone' => $validated['customer_phone'],
                'customer_email' => $validated['customer_email'] ?? null,
                'notes' => trim('[Booking manual oleh '.$user->name.'] '.($validated['notes'] ?? '')),
                'validated_by' => $user->id,
                'validated_at' => now(),
                'payment_deadline' => now(),
            ]);
        });

        ActivityLog::log('manual_booking_created', "Booking manual #{$booking->booking_code} dibuat oleh {$user->name}", [
            'booking_id' => $booking->id,
            'lapangan' => $lapangan->name,
            'customer_name' => $booking->customer_name,
            'total_price' => $booking->total_price,
        ]);

        if (! empty($booking->customer_email)) {
            Notification::route('mail', $booking->customer_email)
                ->notify(new ManualBookingCreatedNotification($booking));
        }

        return back()->with('success', "Booking manual #{$booking->booking_code} berhasil dibuat dan langsung dikonfirmasi.");
    }

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

        $lapanganColumns = ['id', 'name', 'operational_start', 'operational_end', 'price_per_hour'];
        $lapangans = $isSuperAdmin
            ? Lapangan::where('is_active', true)->get($lapanganColumns)
            : $user->assignedLapangans()->where('is_active', true)->get(array_map(
                static fn (string $column): string => $column === 'id' ? 'lapangans.id' : "lapangans.{$column}",
                $lapanganColumns,
            ));

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
