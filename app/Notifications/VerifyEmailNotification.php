<?php

namespace App\Notifications;

use Illuminate\Auth\Notifications\VerifyEmail as BaseVerifyEmail;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\URL;

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
        $applicationUrl = (string) config('app.url');

        URL::useOrigin($applicationUrl);
        URL::forceScheme(parse_url($applicationUrl, PHP_URL_SCHEME) ?: 'http');

        return URL::temporarySignedRoute(
            'verification.verify',
            Carbon::now()->addMinutes(Config::get('auth.verification.expire', 60)),
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
            ->subject('Verifikasi Alamat Email Anda - SportBooking')
            ->greeting('Halo!')
            ->line('Terima kasih telah mendaftar di SportBooking Arena.')
            ->line('Silakan klik tombol di bawah ini untuk memverifikasi alamat email Anda dan mengaktifkan akses penuh pemesanan lapangan:')
            ->action('Verifikasi Alamat Email', $url)
            ->line('Tautan verifikasi ini akan kedaluwarsa dalam 60 menit.')
            ->line('Jika Anda tidak merasa membuat akun di SportBooking, Anda dapat mengabaikan email ini dengan aman.');
    }
}
