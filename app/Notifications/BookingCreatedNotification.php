<?php

namespace App\Notifications;

use App\Models\Booking;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class BookingCreatedNotification extends Notification implements ShouldQueue
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
        return ['database', 'mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $lapanganName = $this->booking->lapangan->name;
        $date = $this->booking->booking_date->format('d M Y');
        $time = "{$this->booking->start_time} - {$this->booking->end_time}";
        $price = 'Rp '.number_format($this->booking->total_price, 0, ',', '.');
        $deadline = $this->booking->payment_deadline->format('d M Y H:i');

        $mail = (new MailMessage)
            ->subject("Konfirmasi Booking Lapangan: {$this->booking->booking_code}")
            ->greeting("Halo {$notifiable->name},")
            ->line("Booking Anda untuk {$lapanganName} telah berhasil dibuat!")
            ->line('**Detail Booking:**')
            ->line("- **Kode Booking**: {$this->booking->booking_code}")
            ->line("- **Tanggal**: {$date}")
            ->line("- **Jam**: {$time}")
            ->line("- **Total Harga**: {$price}")
            ->line('- **Metode**: '.strtoupper($this->booking->payment_method));

        if ($this->booking->payment_method === 'transfer') {
            $mail->line("Harap transfer **tepat sesuai nominal** (termasuk 3 digit kode unik Rp {$this->booking->validation_code}) sebelum **{$deadline}**.")
                ->action('Lihat Invoice & Bayar', url("/booking/{$this->booking->booking_code}"));
        } else {
            $mail->line("Silakan lakukan pembayaran tunai di kasir lapangan sebelum **{$deadline}**.")
                ->action('Lihat Detail Booking', url("/booking/{$this->booking->booking_code}"));
        }

        return $mail->line('Terima kasih telah berolahraga bersama kami!');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
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
