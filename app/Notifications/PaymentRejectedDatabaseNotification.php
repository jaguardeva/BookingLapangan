<?php

namespace App\Notifications;

use App\Models\Booking;
use Illuminate\Notifications\Notification;

class PaymentRejectedDatabaseNotification extends Notification
{
    public function __construct(public Booking $booking, public string $reason) {}

    /** @return array<int, string> */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /** @return array<string, mixed> */
    public function toArray(object $notifiable): array
    {
        return [
            'title' => 'Pembayaran Ditolak',
            'message' => "Pembayaran booking #{$this->booking->booking_code} ditolak: {$this->reason}",
            'type' => 'error',
            'booking_id' => $this->booking->id,
            'booking_code' => $this->booking->booking_code,
            'url' => "/booking/{$this->booking->booking_code}",
        ];
    }
}
