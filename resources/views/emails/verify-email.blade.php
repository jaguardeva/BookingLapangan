<x-mail::message>
# Verifikasi alamat email

Halo{{ isset($notifiable) && $notifiable?->name ? ' '.$notifiable->name : '' }},

Terima kasih telah mendaftar di {{ config('app.name') }}. Gunakan kode berikut untuk memverifikasi alamat email Anda.

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;">
    <tr>
        <td align="center" style="padding:22px 16px 20px;">
            <div style="color:#008b52;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">Kode OTP</div>
            <div class="otp-code" style="color:#153b25;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-size:32px;font-weight:800;letter-spacing:8px;line-height:1.2;margin:10px 0 0 8px;">{{ $code }}</div>
        </td>
    </tr>
</table>

Kode ini berlaku selama **10 menit** dan hanya dapat digunakan satu kali.

Jika Anda tidak merasa membuat akun di {{ config('app.name') }}, abaikan email ini.

Terima kasih,<br>
{{ config('app.name') }}
</x-mail::message>
