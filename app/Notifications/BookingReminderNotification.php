<?php

namespace App\Notifications;

use App\Models\Booking;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class BookingReminderNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public Booking $booking, public string $timeFrame) // '24h' or '1h'
    {}

    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $lapanganName = $this->booking->lapangan->name;
        $date = $this->booking->booking_date->format('d M Y');
        $time = "{$this->booking->start_time} - {$this->booking->end_time}";

        if ($this->timeFrame === '1h') {
            return (new MailMessage)
                ->subject('Pengingat: Jadwal Bermain Anda Dimulai Dalam 1 Jam! ⚽')
                ->greeting("Halo {$notifiable->name},")
                ->line("Siapkan perlengkapan olahraga Anda! Jadwal bermain Anda di **{$lapanganName}** akan dimulai dalam **1 jam**.")
                ->line("- **Tanggal**: {$date}")
                ->line("- **Jam**: {$time}")
                ->action('Lihat Detail Booking', url("/booking/{$this->booking->booking_code}"))
                ->line('Jangan sampai terlambat ya!');
        }

        return (new MailMessage)
            ->subject('Pengingat: Jadwal Booking Lapangan Besok 🎾')
            ->greeting("Halo {$notifiable->name},")
            ->line("Ini adalah pengingat untuk jadwal booking Anda di **{$lapanganName}** besok.")
            ->line("- **Tanggal**: {$date}")
            ->line("- **Jam**: {$time}")
            ->action('Lihat Detail Booking', url("/booking/{$this->booking->booking_code}"))
            ->line('Sampai jumpa di lapangan!');
    }

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
