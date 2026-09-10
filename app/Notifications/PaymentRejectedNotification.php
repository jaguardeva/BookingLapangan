<?php

namespace App\Notifications;

use App\Models\Booking;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Contracts\Queue\ShouldQueue;

class PaymentRejectedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public Booking $booking, public string $reason) {}

    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $lapanganName = $this->booking->lapangan->name;

        return (new MailMessage)
            ->subject("Pemberitahuan: Pembayaran Booking {$this->booking->booking_code} Ditolak")
            ->greeting("Halo {$notifiable->name},")
            ->line("Mohon maaf, pembayaran Anda untuk booking **{$this->booking->booking_code}** ({$lapanganName}) belum dapat divalidasi.")
            ->line('**Alasan Penolakan:**')
            ->line("> {$this->reason}")
            ->line('Silakan periksa kembali transfer Anda atau hubungi kasir/admin lapangan.')
            ->action('Periksa Invoice & Coba Lagi', url("/booking/{$this->booking->booking_code}"))
            ->line('Jika Anda merasa ini adalah kekeliruan, mohon segera hubungi kami.');
    }

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
