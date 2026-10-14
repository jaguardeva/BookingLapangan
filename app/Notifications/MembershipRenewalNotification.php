<?php

namespace App\Notifications;

use App\Models\Membership;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class MembershipRenewalNotification extends Notification
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
            'title' => 'Membership perlu diperpanjang',
            'message' => 'Masa membership Anda selama 30 hari telah berakhir. Ajukan perpanjangan untuk mengamankan jadwal berikutnya.',
            'type' => 'warning',
            'url' => route('membership.index', absolute: false),
            'membership_id' => $this->membership->id,
        ];
    }
}
