<?php

namespace App\Notifications;

use App\Models\Booking;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ManualBookingCreatedNotification extends Notification implements ShouldQueue
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
        return ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $this->booking->loadMissing('lapangan');

        return (new MailMessage)
            ->subject("Booking SportBooking {$this->booking->booking_code} berhasil dikonfirmasi")
            ->view('emails.manual-booking', [
                'booking' => $this->booking,
                'customerName' => $this->booking->customer_name,
            ]);
    }
}
