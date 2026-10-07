<?php

namespace App\Notifications;

use App\Models\Booking;
use Illuminate\Notifications\Notification;

class BookingReminderDatabaseNotification extends Notification
{
    public function __construct(public Booking $booking, public string $timeFrame) {}

    /** @return array<int, string> */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /** @return array<string, mixed> */
    public function toArray(object $notifiable): array
    {
        $label = $this->timeFrame === '1h' ? '1 jam lagi' : '24 jam lagi';

        return [
            'title' => 'Pengingat Jadwal Bermain',
            'message' => "Jadwal main di {$this->booking->lapangan->name} akan dimulai {$label} ({$this->booking->start_time}).",
            'type' => 'warning',
            'booking_id' => $this->booking->id,
            'booking_code' => $this->booking->booking_code,
            'url' => "/booking/{$this->booking->booking_code}",
        ];
    }
}
