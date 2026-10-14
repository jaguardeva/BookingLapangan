<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Booking;
use App\Models\Membership;
use App\Models\MembershipSetting;
use App\Services\MembershipOccurrenceService;
use App\Support\Pagination;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class MembershipManagementController extends Controller
{
    public function __construct(private MembershipOccurrenceService $occurrences) {}

    public function index(Request $request): Response
    {
        $sortColumns = [
            'created_at' => 'memberships.created_at',
            'amount' => 'memberships.amount',
            'reservation_start_date' => 'memberships.reservation_start_date',
            'status' => 'memberships.status',
            'payment_status' => 'memberships.payment_status',
        ];
        $sort = $request->string('sort')->toString();
        $sort = array_key_exists($sort, $sortColumns) ? $sort : 'created_at';
        $direction = $request->string('direction')->lower()->toString() === 'asc' ? 'asc' : 'desc';
        $status = $request->string('status')->toString();
        $paymentStatus = $request->string('payment_status')->toString();
        $query = Membership::query()
            ->with(['user', 'reservations.lapangan'])
            ->when($request->filled('search'), function ($query) use ($request): void {
                $search = $request->string('search')->trim()->toString();

                $query->where(function ($query) use ($search): void {
                    $query->where('memberships.id', 'like', "%{$search}%")
                        ->orWhereHas('user', function ($userQuery) use ($search): void {
                            $userQuery->where('name', 'like', "%{$search}%")
                                ->orWhere('email', 'like', "%{$search}%");
                        });
                });
            })
            ->when(in_array($status, ['pending', 'active', 'expired', 'rejected', 'cancelled'], true), fn ($query) => $query->where('status', $status))
            ->when(in_array($paymentStatus, ['pending', 'pending_validation', 'approved', 'rejected', 'cancelled'], true), fn ($query) => $query->where('payment_status', $paymentStatus))
            ->orderBy($sortColumns[$sort], $direction);

        $memberships = $query
            ->orderBy('memberships.id')
            ->paginate(Pagination::perPage($request, 15))
            ->withQueryString();

        $now = now();
        $activeMemberships = Membership::query()->where('status', 'active')->where('ends_at', '>', $now);

        return Inertia::render('admin/memberships/index', [
            'memberships' => $memberships,
            'membershipDiscountPercentage' => MembershipSetting::query()->firstOrCreate(
                ['id' => MembershipSetting::ID],
                ['membership_discount_percentage' => 0],
            )->membership_discount_percentage,
            'filters' => [
                'search' => $request->query('search', ''),
                'status' => $status,
                'payment_status' => $paymentStatus,
                'sort' => $sort,
                'direction' => $direction,
            ],
            'stats' => [
                'active' => (clone $activeMemberships)->count(),
                'pending_validation' => Membership::query()->where('payment_status', 'pending_validation')->count(),
                'expiring_soon' => (clone $activeMemberships)->whereBetween('ends_at', [$now, $now->copy()->addDays(7)])->count(),
                'active_value_this_month' => (clone $activeMemberships)
                    ->whereBetween('starts_at', [$now->copy()->startOfMonth(), $now->copy()->endOfMonth()])
                    ->sum('amount'),
            ],
        ]);
    }

    public function show(Membership $membership): Response
    {
        $membership->load([
            'user',
            'validator',
            'reservations.lapangan',
            'bookings' => fn ($query) => $query->with('lapangan')->orderBy('booking_date')->orderBy('start_time'),
        ]);

        return Inertia::render('admin/memberships/show', ['membership' => $membership]);
    }

    public function approve(Membership $membership): RedirectResponse
    {
        $approved = DB::transaction(function () use ($membership): Membership {
            $membership = Membership::query()->with('reservations.lapangan')->lockForUpdate()->findOrFail($membership->id);
            if ($membership->status !== 'pending' || $membership->payment_status !== 'pending_validation') {
                throw ValidationException::withMessages(['membership' => 'Membership ini belum siap divalidasi.']);
            }

            $subtotal = (int) $membership->subtotal;
            $discountValue = (int) ($membership->discount_amount > 0
                ? $membership->discount_value
                : MembershipSetting::query()->firstOrCreate(
                    ['id' => MembershipSetting::ID],
                    ['membership_discount_percentage' => 0],
                )->membership_discount_percentage);
            $discountAmount = (int) ($membership->discount_amount > 0
                ? $membership->discount_amount
                : floor($subtotal * $discountValue / 100));
            $startDate = $membership->reservation_start_date
                ? Carbon::parse($membership->reservation_start_date)->startOfDay()
                : now()->startOfDay();
            $periodEnd = $startDate->copy()->addDays(30)->subSecond();

            foreach ($membership->reservations as $reservation) {
                $dates = $this->occurrences->datesForPeriod($startDate, $periodEnd, $reservation->weekday);
                foreach ($dates as $date) {
                    $conflict = Booking::query()->where('lapangan_id', $reservation->lapangan_id)
                        ->whereDate('booking_date', $date)
                        ->whereIn('payment_status', ['pending', 'pending_validation', 'approved'])
                        ->where('start_time', '<', $reservation->end_time)
                        ->where('end_time', '>', $reservation->start_time)
                        ->where(function ($query) use ($membership): void {
                            $query->whereNull('membership_id')->orWhere('membership_id', '!=', $membership->id);
                        })
                        ->lockForUpdate()->exists();
                    if ($conflict) {
                        throw ValidationException::withMessages(['membership' => "Slot {$reservation->lapangan->name} ".Carbon::parse($date)->format('d-m-Y')." {$reservation->start_time} sudah terisi."]);
                    }
                }
            }

            $membership->update([
                'status' => 'active', 'payment_status' => 'approved', 'validated_by' => auth()->id(),
                'validated_at' => now(), 'approved_at' => now(), 'starts_at' => $startDate,
                'ends_at' => $startDate->copy()->addDays(30)->subSecond(), 'renewal_notified_at' => null,
                'discount_value' => $discountValue, 'discount_amount' => $discountAmount, 'amount' => $subtotal - $discountAmount,
            ]);

            foreach ($membership->reservations as $reservation) {
                $reservation->update(['status' => 'active']);
                $price = $reservation->price_per_occurrence;
                $occurrenceDiscount = $subtotal > 0 ? (int) floor($discountAmount * $price / $subtotal) : 0;
                Booking::query()->where('membership_reservation_id', $reservation->id)
                    ->whereIn('payment_status', ['pending', 'pending_validation'])
                    ->update([
                        'payment_status' => 'approved',
                        'discount_amount' => $occurrenceDiscount,
                        'total_price' => $price - $occurrenceDiscount,
                        'validated_by' => auth()->id(),
                        'validated_at' => now(),
                        'payment_deadline' => now(),
                    ]);
            }

            return $membership;
        });

        ActivityLog::log('membership_approved', "Membership {$approved->id} disetujui.", ['membership_id' => $approved->id]);

        return back()->with('success', 'Membership disetujui dan seluruh jadwal berhasil dikunci.');
    }

    public function reject(Request $request, Membership $membership): RedirectResponse
    {
        if ($membership->status !== 'pending' || ! in_array($membership->payment_status, ['pending', 'pending_validation'], true)) {
            throw ValidationException::withMessages(['membership' => 'Membership ini tidak dapat ditolak pada status sekarang.']);
        }

        $validated = $request->validate(['rejection_reason' => ['required', 'string', 'max:1000']]);
        $membership->update(['status' => 'rejected', 'payment_status' => 'rejected', 'rejection_reason' => $validated['rejection_reason'], 'validated_by' => auth()->id(), 'validated_at' => now()]);
        Booking::query()->where('membership_id', $membership->id)->whereIn('payment_status', ['pending', 'pending_validation'])->update([
            'payment_status' => 'cancelled',
            'cancelled_at' => now(),
            'rejection_reason' => $validated['rejection_reason'],
        ]);

        ActivityLog::log('membership_rejected', "Membership {$membership->id} ditolak.", ['membership_id' => $membership->id]);

        return back()->with('info', 'Pengajuan membership ditolak.');
    }

    public function cancel(Request $request, Membership $membership): RedirectResponse
    {
        if ($membership->status !== 'active' || $membership->ends_at?->isPast()) {
            throw ValidationException::withMessages(['membership' => 'Membership ini tidak dapat dibatalkan pada status sekarang.']);
        }

        $validated = $request->validate(['rejection_reason' => ['required', 'string', 'max:1000']]);
        DB::transaction(function () use ($membership, $validated): void {
            $membership->update(['status' => 'cancelled', 'payment_status' => 'cancelled', 'rejection_reason' => $validated['rejection_reason'], 'validated_by' => auth()->id(), 'validated_at' => now()]);
            Booking::query()->where('membership_id', $membership->id)->whereDate('booking_date', '>=', today())->update(['payment_status' => 'cancelled', 'cancelled_at' => now(), 'rejection_reason' => $validated['rejection_reason']]);
        });

        ActivityLog::log('membership_cancelled', "Membership {$membership->id} dibatalkan.", ['membership_id' => $membership->id]);

        return back()->with('info', 'Membership dan jadwal mendatang berhasil dibatalkan.');
    }
}
