<?php

namespace App\Notifications;

use App\Models\Booking;
use Illuminate\Notifications\Notification;

class BookingCreatedDatabaseNotification extends Notification
{
    public function __construct(public Booking $booking) {}

    /** @return array<int, string> */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /** @return array<string, mixed> */
    public function toArray(object $notifiable): array
    {
        return [
            'title' => 'Booking Dibuat',
            'message' => "Booking #{$this->booking->booking_code} di {$this->booking->lapangan->name} ({$this->booking->booking_date->format('d M Y')}, {$this->booking->start_time}) berhasil dibuat.",
            'type' => 'info',
            'booking_id' => $this->booking->id,
            'booking_code' => $this->booking->booking_code,
            'url' => "/booking/{$this->booking->booking_code}",
        ];
    }
}
