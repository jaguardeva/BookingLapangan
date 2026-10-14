<?php

namespace App\Http\Controllers;

use App\Models\BankAccount;
use App\Models\Booking;
use App\Models\Lapangan;
use App\Models\Membership;
use App\Models\MembershipReservation;
use App\Models\MembershipSetting;
use App\Models\User;
use App\Notifications\MembershipPaymentSubmittedNotification;
use App\Services\MembershipOccurrenceService;
use Carbon\Carbon;
use Carbon\CarbonInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class MembershipController extends Controller
{
    public function __construct(private MembershipOccurrenceService $occurrences) {}

    public function slots(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'lapangan_id' => ['required', 'uuid', 'exists:lapangans,id'],
            'month' => ['nullable', 'date_format:Y-m'],
            'start_date' => ['nullable', 'date_format:Y-m-d'],
            'weekday' => ['required', 'integer', 'between:0,6'],
        ]);
        $lapangan = Lapangan::query()->whereKey($validated['lapangan_id'])->where('is_active', true)->firstOrFail();
        $slots = [];
        $dates = [];
        $start = Carbon::parse($lapangan->operational_start);
        $end = Carbon::parse($lapangan->operational_end);
        $durationMinutes = max(30, (int) $lapangan->slot_duration_minutes);
        while ($start->copy()->addMinutes($durationMinutes)->lte($end)) {
            $slotStart = $start->format('H:i');
            $slotEnd = $start->copy()->addMinutes($durationMinutes)->format('H:i');
            $startDate = $this->resolveReservationStartDate([
                'lapangan_id' => $lapangan->id,
                'weekday' => (int) $validated['weekday'],
                'start_time' => $slotStart,
                'duration_hours' => $durationMinutes / 60,
            ]);
            $dates = $startDate === null
                ? []
                : $this->occurrences->datesForPeriod($startDate, $startDate->copy()->addDays(29), (int) $validated['weekday']);
            $slots[] = [
                'start_time' => $slotStart,
                'end_time' => $slotEnd,
                'available' => $startDate !== null,
                'start_date' => $startDate?->toDateString(),
                'occurrence_count' => count($dates),
                'duration_minutes' => $durationMinutes,
            ];
            $start->addMinutes($durationMinutes);
        }

        return response()->json(['lapangan_id' => $lapangan->id, 'month' => $validated['month'] ?? null, 'weekday' => (int) $validated['weekday'], 'dates' => $dates, 'slots' => $slots]);
    }

    public function index(): Response
    {
        $user = auth()->user();
        $memberships = $user->memberships()
            ->with('reservations.lapangan')
            ->withCount('bookings')
            ->latest()
            ->paginate(10);
        $activeMemberships = $user->memberships()
            ->where('status', 'active')
            ->where('ends_at', '>', now())
            ->with('reservations.lapangan')
            ->withCount('bookings')
            ->latest('ends_at')
            ->get();

        return Inertia::render('membership/index', [
            'membership' => $memberships->first(),
            'memberships' => $memberships,
            'activeMemberships' => $activeMemberships,
        ]);
    }

    public function checkout(Lapangan $lapangan): Response
    {
        abort_unless($lapangan->is_active, 404);

        $discountPercentage = MembershipSetting::query()->firstOrCreate(
            ['id' => MembershipSetting::ID],
            ['membership_discount_percentage' => 0],
        )->membership_discount_percentage;

        return Inertia::render('membership/checkout', [
            'lapangan' => $lapangan->load('category'),
            'bankAccounts' => BankAccount::query()->where('is_active', true)->get(),
            'membershipDiscountPercentage' => $discountPercentage,
        ]);
    }

    public function show(string $membership): Response
    {
        $record = auth()->user()->memberships()
            ->with(['reservations.lapangan.category', 'bookings.lapangan.category'])
            ->whereKey($membership)
            ->firstOrFail();

        return Inertia::render('membership/invoice', [
            'membership' => $record,
            'bankAccounts' => BankAccount::query()->where('is_active', true)->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'reservations' => ['required', 'array', 'min:1'],
            'reservations.*.lapangan_id' => ['required', 'uuid', 'exists:lapangans,id'],
            'reservations.*.weekday' => ['required', 'integer', 'between:0,6'],
            'reservations.*.start_time' => ['required', 'date_format:H:i'],
            'reservations.*.duration_hours' => ['required', 'integer', 'min:1', 'max:6'],
        ], [
            'reservations.required' => 'Pilih minimal satu jadwal membership.',
            'reservations.min' => 'Pilih minimal satu jadwal membership.',
            'reservations.*.duration_hours.integer' => 'Durasi setiap jadwal membership harus minimal 1 jam penuh.',
            'reservations.*.duration_hours.min' => 'Durasi setiap jadwal membership harus minimal 1 jam.',
        ]);

        $user = $request->user();

        $startDate = null;
        foreach ($validated['reservations'] as $reservation) {
            $reservationStartDate = $this->resolveReservationStartDate($reservation);
            if ($reservationStartDate === null) {
                throw ValidationException::withMessages(['reservations' => 'Sebagian jadwal sudah terisi untuk periode membership 30 hari. Pilih hari atau jam lain.']);
            }

            if ($startDate === null || $reservationStartDate->gt($startDate)) {
                $startDate = $reservationStartDate;
            }
        }

        $periodEnd = $startDate->copy()->addDays(30)->subSecond();

        $membership = DB::transaction(function () use ($user, $startDate, $periodEnd, $validated): Membership {
            $prepared = $this->prepareReservations($validated['reservations'], $startDate, $periodEnd);
            $subtotal = collect($prepared)->sum(fn (array $reservation): int => $reservation['price_per_occurrence'] * $reservation['occurrence_count']);
            $discountPercentage = MembershipSetting::query()->firstOrCreate(
                ['id' => MembershipSetting::ID],
                ['membership_discount_percentage' => 0],
            )->membership_discount_percentage;
            $discountAmount = (int) floor($subtotal * $discountPercentage / 100);
            $amount = $subtotal - $discountAmount;

            $membership = Membership::create([
                'user_id' => $user->id,
                'reservation_start_date' => $startDate->toDateString(),
                'amount' => $amount,
                'subtotal' => $subtotal,
                'discount_value' => $discountPercentage,
                'discount_amount' => $discountAmount,
                'status' => 'pending',
                'payment_method' => 'transfer',
                'payment_status' => 'pending',
                'validation_code' => Membership::generateValidationCode(),
                'payment_deadline' => now()->addDay(),
            ]);

            foreach ($prepared as $reservation) {
                $schedule = MembershipReservation::create(['membership_id' => $membership->id, ...$reservation]);
                $price = $schedule->price_per_occurrence;
                $occurrenceDiscount = $subtotal > 0 ? (int) floor($discountAmount * $price / $subtotal) : 0;
                $occurrenceTotalPrice = $price - $occurrenceDiscount;

                foreach ($this->occurrences->datesForPeriod($startDate, $periodEnd, $schedule->weekday) as $date) {
                    Booking::create([
                        'booking_code' => Booking::generateBookingCode(),
                        'user_id' => $user->id,
                        'membership_id' => $membership->id,
                        'membership_reservation_id' => $schedule->id,
                        'booking_source' => 'membership',
                        'lapangan_id' => $schedule->lapangan_id,
                        'booking_date' => $date,
                        'start_time' => $schedule->start_time,
                        'end_time' => $schedule->end_time,
                        'duration_hours' => $schedule->duration_hours,
                        'base_price' => $price,
                        'discount_amount' => $occurrenceDiscount,
                        'total_price' => $occurrenceTotalPrice,
                        'payment_method' => 'transfer',
                        'payment_status' => 'pending',
                        'customer_name' => $user->name,
                        'customer_phone' => $user->phone ?? '',
                        'customer_email' => $user->email,
                        'notes' => 'Reservasi membership menunggu validasi pembayaran.',
                        'validation_code' => 0,
                        'payment_deadline' => $membership->payment_deadline,
                    ]);
                }
            }

            return $membership;
        });

        return redirect()->route('membership.show', $membership)->with('success', 'Pengajuan membership berhasil dibuat dan slot ditahan sampai pembayaran kedaluwarsa.');
    }

    public function submitPayment(string $membership): RedirectResponse
    {
        $record = auth()->user()->memberships()->whereKey($membership)->firstOrFail();

        if ($record->payment_status !== 'pending') {
            return back()->with('error', 'Pengajuan membership ini tidak sedang menunggu pembayaran.');
        }

        $record->update(['payment_status' => 'pending_validation', 'user_submitted_code' => $record->validation_code]);
        Booking::query()->where('membership_id', $record->id)->where('payment_status', 'pending')->update(['payment_status' => 'pending_validation']);

        foreach (User::query()->whereIn('role', ['admin', 'superadmin'])->get() as $admin) {
            $admin->notify(new MembershipPaymentSubmittedNotification($record->load('user')));
        }

        return back()->with('success', 'Konfirmasi pembayaran membership berhasil dikirim.');
    }

    public function renew(string $membership): RedirectResponse
    {
        $user = auth()->user();
        $previous = $user->memberships()->with('reservations')->whereKey($membership)->firstOrFail();
        if (! in_array($previous->status, ['active', 'expired'], true)) {
            throw ValidationException::withMessages(['membership' => 'Membership ini belum dapat diperpanjang.']);
        }

        if (! $previous->canBeRenewed()) {
            $earliestRenewalDate = Carbon::parse($previous->ends_at)->subDays(7);
            $formattedDate = $earliestRenewalDate->format('d/m/Y');
            throw ValidationException::withMessages([
                'membership' => "Membership baru dapat diperpanjang 1 minggu (7 hari) sebelum masa aktif berakhir (mulai {$formattedDate}).",
            ]);
        }
        $minimumStart = $previous->ends_at !== null
            ? Carbon::parse($previous->ends_at)->addSecond()
            : now()->startOfWeek()->addWeek();

        $reservations = $previous->reservations->map(fn (MembershipReservation $reservation): array => [
            'lapangan_id' => $reservation->lapangan_id,
            'weekday' => $reservation->weekday,
            'start_time' => $reservation->start_time,
            'duration_hours' => $reservation->duration_hours,
        ])->all();
        $startDate = $this->occurrences->firstDateForRollingPeriod($reservations, $minimumStart);
        if ($startDate === null) {
            throw ValidationException::withMessages(['membership' => 'Bulan perpanjangan tidak memiliki occurrence yang tersedia.']);
        }
        $periodEnd = $startDate->copy()->addDays(30)->subSecond();
        $renewed = DB::transaction(function () use ($user, $reservations, $startDate, $periodEnd): Membership {
            $prepared = $this->prepareReservations($reservations, $startDate, $periodEnd);
            $subtotal = collect($prepared)->sum(fn (array $reservation): int => $reservation['price_per_occurrence'] * $reservation['occurrence_count']);
            $discountPercentage = MembershipSetting::query()->firstOrCreate(
                ['id' => MembershipSetting::ID],
                ['membership_discount_percentage' => 0],
            )->membership_discount_percentage;
            $discountAmount = (int) floor($subtotal * $discountPercentage / 100);
            $amount = $subtotal - $discountAmount;

            $membership = Membership::create([
                'user_id' => $user->id,
                'reservation_start_date' => $startDate->toDateString(),
                'amount' => $amount,
                'subtotal' => $subtotal,
                'discount_value' => $discountPercentage,
                'discount_amount' => $discountAmount,
                'status' => 'pending',
                'payment_method' => 'transfer',
                'payment_status' => 'pending',
                'validation_code' => Membership::generateValidationCode(),
                'payment_deadline' => now()->addDay(),
            ]);
            foreach ($prepared as $reservation) {
                $schedule = MembershipReservation::create(['membership_id' => $membership->id, ...$reservation]);
                $price = $schedule->price_per_occurrence;
                $occurrenceDiscount = $subtotal > 0 ? (int) floor($discountAmount * $price / $subtotal) : 0;
                $occurrenceTotalPrice = $price - $occurrenceDiscount;

                foreach ($this->occurrences->datesForPeriod($startDate, $periodEnd, $schedule->weekday) as $date) {
                    Booking::create([
                        'booking_code' => Booking::generateBookingCode(), 'user_id' => $user->id,
                        'membership_id' => $membership->id, 'membership_reservation_id' => $schedule->id,
                        'booking_source' => 'membership', 'lapangan_id' => $schedule->lapangan_id,
                        'booking_date' => $date, 'start_time' => $schedule->start_time,
                        'end_time' => $schedule->end_time, 'duration_hours' => $schedule->duration_hours,
                        'base_price' => $price, 'discount_amount' => $occurrenceDiscount,
                        'total_price' => $occurrenceTotalPrice, 'payment_method' => 'transfer',
                        'payment_status' => 'pending', 'customer_name' => $user->name,
                        'customer_phone' => $user->phone ?? '', 'customer_email' => $user->email,
                        'notes' => 'Reservasi membership menunggu validasi pembayaran.',
                        'validation_code' => 0, 'payment_deadline' => $membership->payment_deadline,
                    ]);
                }
            }

            return $membership;
        });

        return redirect()->route('membership.index')->with('success', 'Perpanjangan membership berhasil dibuat.');
    }

    /**
     * @param  array<int, array{lapangan_id: string, weekday: int, start_time: string, duration_hours: int}>  $reservations
     * @return array<int, array{lapangan_id: string, weekday: int, start_time: string, end_time: string, duration_hours: int, price_per_occurrence: int, occurrence_count: int, status: string}>
     */
    private function prepareReservations(array $reservations, CarbonInterface $startDate, CarbonInterface $periodEnd): array
    {
        $prepared = [];
        $keys = [];

        foreach ($reservations as $reservation) {
            $lapangan = Lapangan::query()->whereKey($reservation['lapangan_id'])->where('is_active', true)->lockForUpdate()->firstOrFail();
            $start = Carbon::createFromFormat('H:i', $reservation['start_time']);
            $end = $start->copy()->addHours((int) $reservation['duration_hours']);
            $opStart = Carbon::parse($lapangan->operational_start);
            $opEnd = Carbon::parse($lapangan->operational_end);

            if ($start->lt($opStart) || $end->gt($opEnd)) {
                throw ValidationException::withMessages(['reservations' => "Jadwal {$lapangan->name} berada di luar jam operasional."]);
            }

            $key = implode('|', [$lapangan->id, $reservation['weekday'], $reservation['start_time'], $end->format('H:i')]);
            if (in_array($key, $keys, true)) {
                throw ValidationException::withMessages(['reservations' => 'Jadwal membership tidak boleh duplikat.']);
            }
            $keys[] = $key;

            $occurrenceDates = $this->occurrences->datesForPeriod($startDate, $periodEnd, (int) $reservation['weekday']);
            $occurrenceCount = count($occurrenceDates);

            if ($occurrenceCount === 0) {
                throw ValidationException::withMessages(['reservations' => "Hari {$reservation['weekday']} tidak memiliki jadwal pada periode 30 hari."]);
            }

            $hasConflict = Booking::query()
                ->where('lapangan_id', $lapangan->id)
                ->whereIn('booking_date', $occurrenceDates)
                ->whereIn('payment_status', ['pending', 'pending_validation', 'approved'])
                ->where('start_time', '<', $end->format('H:i'))
                ->where('end_time', '>', $reservation['start_time'])
                ->lockForUpdate()
                ->exists();

            if ($hasConflict) {
                throw ValidationException::withMessages(['reservations' => "Sebagian jadwal {$lapangan->name} pada hari {$reservation['weekday']} sudah terisi."]);
            }

            $prepared[] = [
                'lapangan_id' => $lapangan->id,
                'weekday' => (int) $reservation['weekday'],
                'start_time' => $reservation['start_time'],
                'end_time' => $end->format('H:i'),
                'duration_hours' => (int) $reservation['duration_hours'],
                'price_per_occurrence' => $lapangan->price_per_hour * (int) $reservation['duration_hours'],
                'occurrence_count' => $occurrenceCount,
                'status' => 'pending',
            ];
        }

        return $prepared;
    }

    /**
     * @param  array{lapangan_id: string, weekday: int, start_time: string, duration_hours: int|float}  $reservation
     */
    private function resolveReservationStartDate(array $reservation): ?Carbon
    {
        $now = now();
        $lapangan = Lapangan::query()->whereKey($reservation['lapangan_id'])->where('is_active', true)->firstOrFail();
        $start = Carbon::createFromFormat('H:i', $reservation['start_time']);
        $end = $start->copy()->addMinutes((int) round(((float) $reservation['duration_hours']) * 60));
        $candidate = $this->occurrences->nextDateForWeekday($now, (int) $reservation['weekday']);
        $canShiftToNextWeek = true;

        if ($candidate->isSameDay($now) && $end->format('H:i') <= $now->format('H:i')) {
            $candidate->addWeek();
            $canShiftToNextWeek = false;
        }

        if (! $this->reservationHasConflict($lapangan, $reservation, $candidate)) {
            return $candidate;
        }

        if (! $canShiftToNextWeek) {
            return null;
        }

        $nextCandidate = $candidate->copy()->addWeek();

        return $this->reservationHasConflict($lapangan, $reservation, $nextCandidate)
            ? null
            : $nextCandidate;
    }

    /**
     * @param  array{weekday: int, start_time: string, duration_hours: int|float}  $reservation
     */
    private function reservationHasConflict(Lapangan $lapangan, array $reservation, CarbonInterface $startDate): bool
    {
        $start = Carbon::createFromFormat('H:i', $reservation['start_time']);
        $end = $start->copy()->addMinutes((int) round(((float) $reservation['duration_hours']) * 60));
        $dates = $this->occurrences->datesForPeriod($startDate, $startDate->copy()->addDays(29), (int) $reservation['weekday']);

        return $lapangan->bookings()
            ->whereIn('booking_date', $dates)
            ->whereIn('payment_status', ['pending', 'pending_validation', 'approved'])
            ->where('start_time', '<', $end->format('H:i'))
            ->where('end_time', '>', $reservation['start_time'])
            ->exists();
    }
}
