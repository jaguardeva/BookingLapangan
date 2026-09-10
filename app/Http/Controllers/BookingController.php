<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\BankAccount;
use App\Models\Booking;
use App\Models\Lapangan;
use App\Models\User;
use App\Notifications\BookingCreatedNotification;
use App\Notifications\PaymentProofSubmittedNotification;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class BookingController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'lapangan_id' => ['required', 'exists:lapangans,id'],
            'booking_date' => ['required', 'date'],
            'start_time' => ['required', 'date_format:H:i'],
            'duration_hours' => ['required', 'integer', 'min:1', 'max:6'],
            'payment_method' => ['required', 'in:cash,transfer'],
            'customer_name' => ['required', 'string', 'max:255'],
            'customer_phone' => ['required', 'string', 'max:20'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $bookingDate = Carbon::parse($validated['booking_date'])->startOfDay();
        $today = Carbon::today();
        $maxDate = Carbon::today()->addDays(2)->endOfDay();

        // 1. Business Rule: Only today, tomorrow, and day after tomorrow allowed
        if ($bookingDate->lt($today) || $bookingDate->gt($maxDate)) {
            throw ValidationException::withMessages([
                'booking_date' => 'Booking hanya diperbolehkan untuk hari ini, besok, atau lusa.',
            ]);
        }

        $startTimeStr = $validated['start_time'];
        $durationHours = (int) $validated['duration_hours'];
        $startCarbon = Carbon::parse($validated['booking_date'].' '.$startTimeStr);
        $endCarbon = (clone $startCarbon)->addHours($durationHours);
        $endTimeStr = $endCarbon->format('H:i');

        // 2. Business Rule: Cannot book past hours for today
        if ($bookingDate->isToday() && $startCarbon->lte(now())) {
            throw ValidationException::withMessages([
                'start_time' => 'Jam mulai tidak boleh kurang dari waktu sekarang.',
            ]);
        }

        $lapangan = Lapangan::findOrFail($validated['lapangan_id']);

        // Check operational hours
        $opStart = Carbon::parse($validated['booking_date'].' '.$lapangan->operational_start);
        $opEnd = Carbon::parse($validated['booking_date'].' '.$lapangan->operational_end);

        if ($startCarbon->lt($opStart) || $endCarbon->gt($opEnd)) {
            throw ValidationException::withMessages([
                'start_time' => "Jadwal harus dalam jam operasional lapangan ({$lapangan->operational_start} - {$lapangan->operational_end}).",
            ]);
        }

        // Concurrency-safe Booking Creation inside DB Transaction
        $booking = DB::transaction(function () use ($lapangan, $validated, $bookingDate, $startTimeStr, $endTimeStr, $durationHours, $startCarbon) {
            // 3. Collision check: lock and check overlapping slots
            $conflict = Booking::where('lapangan_id', $lapangan->id)
                ->whereDate('booking_date', $bookingDate->format('Y-m-d'))
                ->whereIn('payment_status', ['pending', 'pending_validation', 'approved'])
                ->where(function ($query) use ($startTimeStr, $endTimeStr) {
                    $query->where('start_time', '<', $endTimeStr)
                        ->where('end_time', '>', $startTimeStr);
                })
                ->lockForUpdate()
                ->exists();

            if ($conflict) {
                throw ValidationException::withMessages([
                    'start_time' => 'Slot waktu yang Anda pilih sudah terisi atau baru saja dibooking pengguna lain. Silakan pilih jam lain.',
                ]);
            }

            $basePrice = $lapangan->price_per_hour * $durationHours;
            $validationCode = 0;
            $totalPrice = $basePrice;

            if ($validated['payment_method'] === 'transfer') {
                $validationCode = Booking::generateValidationCode();
                $totalPrice = $basePrice + $validationCode;
            }

            // Payment deadline: 2 hours from now or at start of match if match is within 2 hours
            $deadline = now()->addHours(2);
            if ($startCarbon->lt($deadline)) {
                $deadline = $startCarbon;
            }

            return Booking::create([
                'booking_code' => Booking::generateBookingCode(),
                'user_id' => auth()->id(),
                'lapangan_id' => $lapangan->id,
                'booking_date' => $bookingDate->format('Y-m-d'),
                'start_time' => $startTimeStr,
                'end_time' => $endTimeStr,
                'duration_hours' => $durationHours,
                'base_price' => $basePrice,
                'validation_code' => $validationCode,
                'total_price' => $totalPrice,
                'payment_method' => $validated['payment_method'],
                'payment_status' => 'pending',
                'customer_name' => $validated['customer_name'],
                'customer_phone' => $validated['customer_phone'],
                'notes' => $validated['notes'] ?? null,
                'payment_deadline' => $deadline,
            ]);
        });

        // Send notification to customer
        auth()->user()->notify(new BookingCreatedNotification($booking));

        // Log activity
        ActivityLog::log('booking_created', "Booking #{$booking->booking_code} dibuat oleh ".auth()->user()->name, [
            'booking_id' => $booking->id,
            'lapangan' => $lapangan->name,
            'total_price' => $booking->total_price,
        ]);

        return redirect()->route('booking.show', $booking->booking_code)
            ->with('success', 'Booking berhasil dibuat! Silakan selesaikan pembayaran Anda.');
    }

    public function show(string $booking_code): Response
    {
        $booking = Booking::where('booking_code', $booking_code)
            ->with(['lapangan.category', 'lapangan.facilities', 'user', 'validator'])
            ->firstOrFail();

        $user = auth()->user();

        // Authorization check: only owner of booking or admin/superadmin can view
        if ($booking->user_id !== $user->id && ! $user->isSuperAdmin() && ! $user->isAdmin()) {
            abort(403, 'Anda tidak berhak melihat invoice ini.');
        }

        $bankAccounts = BankAccount::where('is_active', true)->get();

        return Inertia::render('booking/invoice', [
            'booking' => $booking,
            'bankAccounts' => $bankAccounts,
            'canCancel' => $booking->canBeCancelledByUser(),
        ]);
    }

    public function submitPayment(Request $request, string $booking_code): RedirectResponse
    {
        $booking = Booking::where('booking_code', $booking_code)
            ->where('user_id', auth()->id())
            ->firstOrFail();

        if ($booking->payment_status !== 'pending') {
            return back()->with('error', 'Status pembayaran booking ini tidak dalam status menunggu pembayaran.');
        }

        $booking->update([
            'payment_status' => 'pending_validation',
            'user_submitted_code' => $booking->validation_code,
        ]);

        // Notify admins assigned to this lapangan and superadmin
        $admins = $booking->lapangan->assignedAdmins;
        $superadmins = User::where('role', 'superadmin')->get();

        $recipients = $admins->merge($superadmins)->unique('id');
        foreach ($recipients as $admin) {
            $admin->notify(new PaymentProofSubmittedNotification($booking));
        }

        ActivityLog::log('payment_submitted', "User mengonfirmasi pembayaran untuk booking #{$booking->booking_code} (Total Rp ".number_format($booking->total_price, 0, ',', '.').')', [
            'booking_id' => $booking->id,
            'total_price' => $booking->total_price,
            'validation_code' => $booking->validation_code,
        ]);

        return back()->with('success', 'Konfirmasi pembayaran berhasil dikirim! Kasir kami akan segera memvalidasi pembayaran Anda.');
    }

    public function cancel(Request $request, string $booking_code): RedirectResponse
    {
        $booking = Booking::where('booking_code', $booking_code)
            ->where('user_id', auth()->id())
            ->firstOrFail();

        // Check if user is allowed to cancel (must be >= 24h before play)
        if (! $booking->canBeCancelledByUser()) {
            return back()->with('error', 'Pembatalan hanya dapat dilakukan paling lambat 24 jam sebelum jam bermain.');
        }

        $booking->update([
            'payment_status' => 'cancelled',
            'cancelled_at' => now(),
            'rejection_reason' => 'Dibatalkan oleh pengguna.',
        ]);

        ActivityLog::log('booking_cancelled', "Booking #{$booking->booking_code} dibatalkan oleh pengguna", [
            'booking_id' => $booking->id,
        ]);

        return back()->with('info', 'Booking Anda berhasil dibatalkan.');
    }

    public function history(Request $request): Response
    {
        $query = Booking::where('user_id', auth()->id())
            ->with(['lapangan.category', 'review'])
            ->latest();

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('payment_status', $request->status);
        }

        $bookings = $query->paginate(10)->withQueryString();

        return Inertia::render('booking/history', [
            'bookings' => $bookings,
            'currentStatus' => $request->query('status', 'all'),
        ]);
    }
}
