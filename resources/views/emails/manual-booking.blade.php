<x-mail::message>
# Booking berhasil dikonfirmasi

Halo **{{ $customerName }}**, 

Booking Anda telah dicatat oleh tim {{ config('app.name') }}. Simpan email ini sebagai invoice Anda.

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;">
    <tr>
        <td style="padding:15px 16px 5px;color:#008b52;font-size:11px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;">Kode booking</td>
    </tr>
    <tr>
        <td class="booking-code" style="padding:0 16px 15px;color:#153b25;font-size:24px;font-weight:800;letter-spacing:1px;">{{ $booking->booking_code }}</td>
    </tr>
</table>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:14px;">
    <tr><td style="padding:8px 0;color:#64756e;">Lapangan</td><td align="right" style="padding:8px 0;color:#25332f;font-weight:700;">{{ $booking->lapangan->name }}</td></tr>
    <tr><td style="padding:8px 0;color:#64756e;">Tanggal</td><td align="right" style="padding:8px 0;color:#25332f;font-weight:700;">{{ $booking->booking_date->translatedFormat('d F Y') }}</td></tr>
    <tr><td style="padding:8px 0;color:#64756e;">Jam bermain</td><td align="right" style="padding:8px 0;color:#25332f;font-weight:700;">{{ substr($booking->start_time, 0, 5) }} - {{ substr($booking->end_time, 0, 5) }} WIB</td></tr>
    <tr><td style="padding:8px 0;color:#64756e;">Durasi</td><td align="right" style="padding:8px 0;color:#25332f;font-weight:700;">{{ $booking->duration_hours }} jam</td></tr>
    <tr><td style="border-top:1px solid #e7e5e4;padding:14px 0 0;color:#64756e;">Total</td><td align="right" style="border-top:1px solid #e7e5e4;padding:14px 0 0;color:#008b52;font-size:18px;font-weight:800;">Rp {{ number_format($booking->total_price, 0, ',', '.') }}</td></tr>
</table>

Pembayaran tercatat sebagai **cash di lokasi**. Jika ada perubahan jadwal, silakan hubungi pengelola lapangan.

Terima kasih telah berolahraga bersama {{ config('app.name') }}.
</x-mail::message>
