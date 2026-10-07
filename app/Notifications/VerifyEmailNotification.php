<?php

namespace App\Notifications;

use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class VerifyEmailNotification extends Notification
{
    public function __construct(public string $code) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Verifikasi Alamat Email Anda - '.config('app.name'))
            ->greeting('Halo!')
            ->line('Terima kasih telah mendaftar di '.config('app.name').'.')
            ->line('Gunakan kode OTP berikut untuk memverifikasi alamat email Anda:')
            ->line('## '.$this->code)
            ->line('Kode ini berlaku selama 10 menit dan hanya dapat digunakan satu kali.')
            ->line('Jika Anda tidak merasa membuat akun di '.config('app.name').', abaikan email ini.');
    }
}
