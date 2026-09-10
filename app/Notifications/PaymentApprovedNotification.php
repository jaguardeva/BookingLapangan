<?php

namespace App\Notifications;

use App\Models\Booking;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PaymentApprovedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public Booking $booking) {}

    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $lapanganName = $this->booking->lapangan->name;
        $date = $this->booking->booking_date->format('d M Y');
        $time = "{$this->booking->start_time} - {$this->booking->end_time}";
        $price = 'Rp '.number_format($this->booking->total_price, 0, ',', '.');

        return (new MailMessage)
            ->subject("Pembayaran Dikonfirmasi: Booking {$this->booking->booking_code} Berhasil!")
            ->greeting("Halo {$notifiable->name},")
            ->line('Kabar gembira! Pembayaran untuk booking lapangan Anda telah berhasil divalidasi.')
            ->line('**Status: CONFIRMED ✓**')
            ->line("- **Lapangan**: {$lapanganName}")
            ->line("- **Tanggal**: {$date}")
            ->line("- **Jam Main**: {$time}")
            ->line("- **Total Bayar**: {$price}")
            ->action('Lihat Detail Booking & Invoice', url("/booking/{$this->booking->booking_code}"))
            ->line('Harap hadir 10 menit sebelum jadwal bermain. Selamat berolahraga!');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'title' => 'Pembayaran Dikonfirmasi ✓',
            'message' => "Pembayaran booking #{$this->booking->booking_code} ({$this->booking->lapangan->name}) telah disetujui! Status booking: Terkonfirmasi.",
            'type' => 'success',
            'booking_id' => $this->booking->id,
            'booking_code' => $this->booking->booking_code,
            'url' => "/booking/{$this->booking->booking_code}",
        ];
    }
}
