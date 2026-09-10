<?php

namespace App\Notifications;

use App\Models\Booking;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class PaymentProofSubmittedNotification extends Notification
{
    use Queueable;

    public function __construct(public Booking $booking) {}

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'title' => 'Pembayaran Menunggu Validasi',
            'message' => "User {$this->booking->customer_name} telah mengirim kode transfer {$this->booking->user_submitted_code} untuk booking #{$this->booking->booking_code} ({$this->booking->lapangan->name}).",
            'type' => 'alert',
            'booking_id' => $this->booking->id,
            'booking_code' => $this->booking->booking_code,
            'url' => "/admin/bookings?search={$this->booking->booking_code}",
        ];
    }
}
