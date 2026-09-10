<?php

namespace App\Console\Commands;

use App\Models\Booking;
use App\Notifications\BookingReminderNotification;
use Carbon\Carbon;
use Illuminate\Console\Command;

class ProcessBookingStatus extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'bookings:process-status';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Batalkan booking yang melewati deadline pembayaran dan kirim reminder jadwal main';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $now = now();

        // 1. Cancel expired pending bookings
        $expiredBookings = Booking::where('payment_status', 'pending')
            ->where('payment_deadline', '<', $now)
            ->get();

        foreach ($expiredBookings as $booking) {
            $booking->update([
                'payment_status' => 'cancelled',
                'cancelled_at' => $now,
                'rejection_reason' => 'Otomatis dibatalkan sistem karena melewati batas waktu pembayaran.',
            ]);
            $this->info("Booking #{$booking->booking_code} otomatis dibatalkan (expired deadline).");
        }

        // 2. Send 24h reminders for confirmed bookings tomorrow
        $tomorrowDate = Carbon::tomorrow()->format('Y-m-d');
        $upcoming24h = Booking::where('booking_date', $tomorrowDate)
            ->where('payment_status', 'approved')
            ->with(['user', 'lapangan'])
            ->get();

        foreach ($upcoming24h as $booking) {
            if ($booking->user) {
                // Avoid spamming if already notified recently
                $booking->user->notify(new BookingReminderNotification($booking, '24h'));
            }
        }

        $this->info('Status booking berhasil diproses.');

        return Command::SUCCESS;
    }
}
