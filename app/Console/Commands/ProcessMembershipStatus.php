<?php

namespace App\Console\Commands;

use App\Models\Booking;
use App\Models\Membership;
use App\Notifications\MembershipRenewalNotification;
use Illuminate\Console\Command;

class ProcessMembershipStatus extends Command
{
    protected $signature = 'memberships:process-status';

    protected $description = 'Expire memberships that have passed their end date.';

    public function handle(): int
    {
        $expiredPayments = Membership::query()
            ->whereIn('status', ['pending'])
            ->whereIn('payment_status', ['pending', 'pending_validation'])
            ->whereNotNull('payment_deadline')
            ->where('payment_deadline', '<=', now())
            ->get();

        foreach ($expiredPayments as $membership) {
            $membership->update([
                'status' => 'cancelled',
                'payment_status' => 'cancelled',
                'rejection_reason' => 'Pengajuan membership melewati batas waktu pembayaran.',
            ]);
            Booking::query()->where('membership_id', $membership->id)->whereIn('payment_status', ['pending', 'pending_validation'])->update([
                'payment_status' => 'cancelled',
                'cancelled_at' => now(),
                'rejection_reason' => 'Pengajuan membership melewati batas waktu pembayaran.',
            ]);
        }

        $memberships = Membership::query()
            ->where('status', 'active')
            ->whereNotNull('ends_at')
            ->where('ends_at', '<=', now())
            ->whereNull('renewal_notified_at')
            ->with('user')
            ->get();

        foreach ($memberships as $membership) {
            $membership->update(['status' => 'expired', 'renewal_notified_at' => now()]);
            Booking::query()->where('membership_id', $membership->id)->whereDate('booking_date', '>=', today())->update(['payment_status' => 'cancelled', 'cancelled_at' => now(), 'rejection_reason' => 'Masa membership berakhir.']);
            $membership->user?->notify(new MembershipRenewalNotification($membership));
        }
        $count = $memberships->count() + $expiredPayments->count();

        $this->info("{$count} membership berhasil ditandai expired.");

        return self::SUCCESS;
    }
}
