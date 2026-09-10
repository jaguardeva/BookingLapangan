<?php

namespace App\Notifications;

use Illuminate\Auth\Notifications\ResetPassword as BaseResetPassword;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;

class ResetPasswordNotification extends BaseResetPassword implements ShouldQueue
{
    use Queueable;

    /**
     * Build the mail representation of the notification.
     *
     * @param  mixed  $notifiable
     */
    public function toMail($notifiable): MailMessage
    {
        $url = url(route('password.reset', [
            'token' => $this->token,
            'email' => $notifiable->getEmailForPasswordReset(),
        ], false));

        return (new MailMessage)
            ->subject('Permintaan Reset Password Akun - SportBooking')
            ->greeting("Halo {$notifiable->name},")
            ->line('Anda menerima email ini karena kami menerima permintaan reset password untuk akun Anda di SportBooking.')
            ->action('Reset Password Akun', $url)
            ->line('Tautan reset password ini akan kedaluwarsa dalam 60 menit.')
            ->line('Jika Anda tidak pernah meminta reset password, abaikan pesan ini dan password Anda tetap aman.');
    }
}
