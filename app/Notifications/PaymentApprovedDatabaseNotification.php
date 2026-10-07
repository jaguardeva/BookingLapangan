<?php

namespace App\Notifications;

use App\Models\Booking;
use Illuminate\Notifications\Notification;

class PaymentApprovedDatabaseNotification extends Notification
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
            'title' => 'Pembayaran Dikonfirmasi',
            'message' => "Pembayaran booking #{$this->booking->booking_code} ({$this->booking->lapangan->name}) telah disetujui! Status booking: Terkonfirmasi.",
            'type' => 'success',
            'booking_id' => $this->booking->id,
            'booking_code' => $this->booking->booking_code,
            'url' => "/booking/{$this->booking->booking_code}",
        ];
    }
}
