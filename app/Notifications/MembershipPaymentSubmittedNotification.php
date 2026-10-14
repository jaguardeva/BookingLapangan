<?php

namespace App\Notifications;

use App\Models\Membership;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class MembershipPaymentSubmittedNotification extends Notification
{
    use Queueable;

    public function __construct(public Membership $membership) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /** @return array<string, mixed> */
    public function toArray(object $notifiable): array
    {
        return [
            'title' => 'Membership Menunggu Validasi',
            'message' => "Pembayaran membership {$this->membership->user->name} menunggu validasi.",
            'type' => 'alert',
            'url' => '/admin/memberships',
        ];
    }
}
