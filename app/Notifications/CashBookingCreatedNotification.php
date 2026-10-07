<?php

namespace App\Notifications;

use App\Models\Booking;
use Illuminate\Notifications\Notification;

class CashBookingCreatedNotification extends Notification
{
    public function __construct(public Booking $booking) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * @return array<string, int|string>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'title' => 'Booking Cash Baru',
            'message' => "{$this->booking->customer_name} membuat booking cash #{$this->booking->booking_code} di {$this->booking->lapangan->name}.",
            'type' => 'info',
            'booking_id' => $this->booking->id,
            'booking_code' => $this->booking->booking_code,
            'url' => "/admin/bookings?search={$this->booking->booking_code}",
        ];
    }
}
