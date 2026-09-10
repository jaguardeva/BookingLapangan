<?php

namespace App\Notifications;

use Illuminate\Auth\Notifications\VerifyEmail as BaseVerifyEmail;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;

class VerifyEmailNotification extends BaseVerifyEmail implements ShouldQueue
{
    use Queueable;

    /**
     * Get the verify email notification mail message for the given URL.
     *
     * @param  string  $url
     */
    protected function buildMailMessage($url): MailMessage
    {
        return (new MailMessage)
            ->subject('Verifikasi Alamat Email Anda - SportBooking')
            ->greeting('Halo!')
            ->line('Terima kasih telah mendaftar di SportBooking Arena.')
            ->line('Silakan klik tombol di bawah ini untuk memverifikasi alamat email Anda dan mengaktifkan akses penuh pemesanan lapangan:')
            ->action('Verifikasi Alamat Email', $url)
            ->line('Tautan verifikasi ini akan kedaluwarsa dalam 60 menit.')
            ->line('Jika Anda tidak merasa membuat akun di SportBooking, Anda dapat mengabaikan email ini dengan aman.');
    }
}
