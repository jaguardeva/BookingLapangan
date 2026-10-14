<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\BankAccount;
use App\Models\Booking;
use App\Models\Lapangan;
use App\Models\User;
use App\Notifications\BookingCreatedDatabaseNotification;
use App\Notifications\BookingCreatedNotification;
use App\Notifications\CashBookingCreatedNotification;
use App\Notifications\PaymentProofSubmittedNotification;
use App\Services\CouponService;
use App\Support\Pagination;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class BookingController extends Controller
{
    public function checkout(Request $request, Lapangan $lapangan): Response
    {
        $validated = $request->validate([
            'booking_date' => ['required', 'date_format:Y-m-d'],
            'start_time' => ['required', 'date_format:H:i'],
            'duration_hours' => ['required', 'integer', 'min:1', 'max:6'],
        ]);

        $bookingDate = Carbon::createFromFormat('Y-m-d', $validated['booking_date'])->startOfDay();

        if ($bookingDate->lt(Carbon::today()) || $bookingDate->gt(Carbon::today()->addDays(2)->endOfDay())) {
            throw ValidationException::withMessages([
                'booking_date' => 'Booking hanya diperbolehkan untuk hari ini, besok, atau lusa.',
            ]);
        }

        $lapangan->load('category');

        if (! $lapangan->is_active || ! $lapangan->category?->is_active) {
            abort(404);
        }

        return Inertia::render('booking/checkout', [
            'lapangan' => $lapangan,
            'selectedDate' => $validated['booking_date'],
            'startTime' => $validated['start_time'],
            'durationHours' => (int) $validated['duration_hours'],
        ]);
    }

    public function store(Request $request, CouponService $couponService): RedirectResponse
    {
        $validated = $request->validate([
            'lapangan_id' => ['required', 'exists:lapangans,id'],
            'booking_date' => ['required', 'date'],
            'start_time' => ['required', 'date_format:H:i'],
            'duration_hours' => ['required', 'integer', 'min:1', 'max:6'],
            'payment_method' => ['required', 'in:cash,transfer'],
            'use_points' => [
                'required',
                'boolean',
                function (string $attribute, mixed $value, \Closure $fail) use ($request): void {
                    if ($request->input('payment_method') === 'cash' && filter_var($value, FILTER_VALIDATE_BOOLEAN)) {
                        $fail('Poin hanya dapat digunakan untuk booking dengan transfer bank.');
                    }
                },
            ],
            'customer_name' => ['required', 'string', 'max:255'],
            'customer_phone' => ['required', 'string', 'max:20'],
            'notes' => ['nullable', 'string', 'max:500'],
            'coupon_code' => ['nullable', 'string', 'max:50'],
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

        $lapangan = Lapangan::query()
            ->whereKey($validated['lapangan_id'])
            ->where('is_active', true)
            ->whereHas('category', fn ($query) => $query->where('is_active', true))
            ->first();

        if ($lapangan === null) {
            throw ValidationException::withMessages([
                'lapangan_id' => 'Lapangan ini sedang tidak tersedia untuk booking.',
            ]);
        }

        // Check operational hours
        $opStart = Carbon::parse($validated['booking_date'].' '.$lapangan->operational_start);
        $opEnd = Carbon::parse($validated['booking_date'].' '.$lapangan->operational_end);

        if ($startCarbon->lt($opStart) || $endCarbon->gt($opEnd)) {
            throw ValidationException::withMessages([
                'start_time' => "Jadwal harus dalam jam operasional lapangan ({$lapangan->operational_start} - {$lapangan->operational_end}).",
            ]);
        }

        // Concurrency-safe Booking Creation inside DB Transaction
        $booking = DB::transaction(function () use ($lapangan, $validated, $bookingDate, $startTimeStr, $endTimeStr, $durationHours, $startCarbon, $couponService) {
            Lapangan::query()->whereKey($lapangan->id)->lockForUpdate()->firstOrFail();

            // 3. Collision check: lock and check overlapping slots
            $conflict = Booking::where('lapangan_id', $lapangan->id)
                ->whereDate('booking_date', $bookingDate->format('Y-m-d'))
                ->whereIn('payment_status', ['pending', 'pending_validation', 'approved'])
                ->where(function ($query) use ($startTimeStr, $endTimeStr) {
                    $query->where('start_time', '<', $endTimeStr)
                        ->where('end_time', '>', $startTimeStr);
                })
                ->lockForUpdate()
                ->first(['membership_id', 'booking_source']);

            if ($conflict !== null) {
                throw ValidationException::withMessages([
                    'start_time' => $conflict->membership_id !== null || $conflict->booking_source === 'membership'
                        ? 'Slot ini sedang dicadangkan untuk jadwal membership. Silakan pilih jam lain.'
                        : 'Slot waktu yang Anda pilih sudah terisi atau baru saja dibooking pengguna lain. Silakan pilih jam lain.',
                ]);
            }

            $basePrice = $lapangan->price_per_hour * $durationHours;
            $user = User::query()->lockForUpdate()->findOrFail(auth()->id());
            $couponData = $couponService->resolve($validated['coupon_code'] ?? null, $user, $basePrice);
            $validationCode = 0;
            $totalPrice = $basePrice - $couponData['discount'];
            $pointsRedeemed = 0;

            if ($validated['payment_method'] === 'transfer') {
                $validationCode = Booking::generateValidationCode();
                $pointsRedeemed = $validated['use_points']
                    ? min($user->availablePoints(), $totalPrice)
                    : 0;
                $totalPrice = $totalPrice - $pointsRedeemed + $validationCode;
            }

            // Payment deadline: 2 hours from now or at start of match if match is within 2 hours
            $deadline = now()->addHours(2);
            if ($startCarbon->lt($deadline)) {
                $deadline = $startCarbon;
            }

            $booking = Booking::create([
                'booking_code' => Booking::generateBookingCode(),
                'user_id' => auth()->id(),
                'lapangan_id' => $lapangan->id,
                'booking_date' => $bookingDate->format('Y-m-d'),
                'start_time' => $startTimeStr,
                'end_time' => $endTimeStr,
                'duration_hours' => $durationHours,
                'base_price' => $basePrice,
                'coupon_id' => $couponData['coupon']?->id,
                'discount_amount' => $couponData['discount'],
                'validation_code' => $validationCode,
                'total_price' => $totalPrice,
                'points_redeemed' => $pointsRedeemed,
                'payment_method' => $validated['payment_method'],
                'payment_status' => 'pending',
                'customer_name' => $validated['customer_name'],
                'customer_phone' => $validated['customer_phone'],
                'notes' => $validated['notes'] ?? null,
                'payment_deadline' => $deadline,
            ]);

            if ($couponData['coupon'] !== null) {
                $couponService->reserve($couponData['coupon'], $user, $booking, $couponData['discount']);
            }

            return $booking;
        });

        // Send notification to customer
        auth()->user()->notify(new BookingCreatedDatabaseNotification($booking));
        auth()->user()->notify(new BookingCreatedNotification($booking));

        if ($booking->payment_method === 'cash') {
            $admins = $lapangan->assignedAdmins;
            $superadmins = User::where('role', 'superadmin')->get();

            foreach ($admins->merge($superadmins)->unique('id') as $admin) {
                $admin->notify(new CashBookingCreatedNotification($booking));
            }
        }

        // Log activity
        ActivityLog::log('booking_created', "Booking #{$booking->booking_code} dibuat oleh ".auth()->user()->name, [
            'booking_id' => $booking->id,
            'lapangan' => $lapangan->name,
            'total_price' => $booking->total_price,
            'points_redeemed' => $booking->points_redeemed,
        ]);

        return redirect()->route('booking.show', $booking->booking_code)
            ->with('success', 'Booking berhasil dibuat! Silakan selesaikan pembayaran Anda.');
    }

    public function show(string $booking_code): Response
    {
        $query = Booking::query();

        if (Str::isUuid($booking_code)) {
            $query->where('id', $booking_code);
        } else {
            $query->where('booking_code', $booking_code);
        }

        $booking = $query
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
        $query = Booking::where('user_id', auth()->id());

        if (Str::isUuid($booking_code)) {
            $query->where('id', $booking_code);
        } else {
            $query->where('booking_code', $booking_code);
        }

        $booking = $query->firstOrFail();

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
        $query = Booking::where('user_id', auth()->id());

        if (Str::isUuid($booking_code)) {
            $query->where('id', $booking_code);
        } else {
            $query->where('booking_code', $booking_code);
        }

        $booking = $query->firstOrFail();

        // Check if user is allowed to cancel (must be >= 24h before play)
        if (! $booking->canBeCancelledByUser()) {
            return back()->with('error', 'Pembatalan hanya dapat dilakukan paling lambat 24 jam sebelum jam bermain.');
        }

        $booking->update([
            'payment_status' => 'cancelled',
            'cancelled_at' => now(),
            'rejection_reason' => 'Dibatalkan oleh pengguna.',
        ]);

        app(CouponService::class)->releaseForBooking($booking);

        ActivityLog::log('booking_cancelled', "Booking #{$booking->booking_code} dibatalkan oleh pengguna", [
            'booking_id' => $booking->id,
        ]);

        return back()->with('info', 'Booking Anda berhasil dibatalkan.');
    }

    public function history(): Response
    {
        return Inertia::render('booking/history');
    }

    public function data(Request $request): JsonResponse
    {
        $currentStatus = $request->query('status', 'all');
        $currentType = $request->query('type', 'all');

        $userId = auth()->id();
        $driver = DB::connection()->getDriverName();
        $minIdExpr = $driver === 'pgsql' ? 'MIN(id::text)::uuid' : 'MIN(id)';

        $query = Booking::where('user_id', $userId)
            ->where(function ($q) use ($userId, $minIdExpr, $request) {
                $q->whereNull('membership_id')
                    ->orWhereIn('id', function ($sub) use ($userId, $minIdExpr, $request) {
                        $sub->selectRaw($minIdExpr)
                            ->from('bookings')
                            ->where('user_id', $userId)
                            ->whereNotNull('membership_id');

                        if ($request->filled('status') && $request->status !== 'all') {
                            $sub->where('payment_status', $request->status);
                        }

                        $sub->groupBy('membership_id');
                    });
            })
            ->with([
                'lapangan.category',
                'review',
                'membership.reservations.lapangan.category',
                'membership.bookings.lapangan.category',
                'membership.bookings.review',
            ])
            ->latest();

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('payment_status', $request->status);
        }

        if ($request->filled('type') && $request->type !== 'all') {
            if ($request->type === 'membership') {
                $query->whereNotNull('membership_id');
            } elseif ($request->type === 'regular') {
                $query->whereNull('membership_id');
            }
        }

        $bookings = $query->paginate(Pagination::perPage($request, 10))->withQueryString();

        return response()->json([
            'bookings' => $bookings,
            'currentStatus' => $currentStatus,
            'currentType' => $currentType,
        ]);
    }
}
