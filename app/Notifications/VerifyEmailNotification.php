<?php

namespace App\Notifications;

use App\Support\AppUrl;
use Illuminate\Auth\Notifications\VerifyEmail as BaseVerifyEmail;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Config;

class VerifyEmailNotification extends BaseVerifyEmail implements ShouldQueue
{
    use Queueable;

    /**
     * Build the signed verification URL from the configured application origin.
     *
     * This prevents queued notifications from inheriting a temporary request host.
     */
    protected function verificationUrl($notifiable): string
    {
        return AppUrl::temporarySignedRoute(
            'verification.verify',
            Carbon::now()->addMinutes(Config::get('auth.verification.expire')),
            [
                'id' => $notifiable->getKey(),
                'hash' => sha1($notifiable->getEmailForVerification()),
            ],
        );
    }

    /**
     * Get the verify email notification mail message for the given URL.
     *
     * @param  string  $url
     */
    protected function buildMailMessage($url): MailMessage
    {
        return (new MailMessage)
            ->subject('Verifikasi Alamat Email Anda - '.config('app.name'))
            ->greeting('Halo!')
            ->line('Terima kasih telah mendaftar di '.config('app.name').'.')
            ->line('Silakan klik tombol di bawah ini untuk memverifikasi alamat email Anda dan mengaktifkan akses penuh pemesanan lapangan:')
            ->action('Verifikasi Alamat Email', $url)
            ->line('Tautan verifikasi ini akan kedaluwarsa dalam '.Config::get('auth.verification.expire').' menit.')
            ->line('Jika Anda tidak merasa membuat akun di '.config('app.name').', Anda dapat mengabaikan email ini dengan aman.');
    }
}
