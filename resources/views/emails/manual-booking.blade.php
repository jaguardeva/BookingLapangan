<!doctype html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Booking {{ $booking->booking_code }}</title>
</head>
<body style="margin:0;background:#f1f5f9;color:#0f172a;font-family:Arial,sans-serif;line-height:1.5">
    <div style="max-width:620px;margin:0 auto;padding:28px 16px">
        <div style="background:#059669;color:#fff;border-radius:18px 18px 0 0;padding:28px 24px">
            <div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;opacity:.85">SportBooking</div>
            <h1 style="margin:8px 0 0;font-size:24px">Booking berhasil dikonfirmasi</h1>
        </div>
        <div style="background:#fff;border:1px solid #e2e8f0;border-top:0;border-radius:0 0 18px 18px;padding:24px">
            <p style="margin-top:0">Halo <strong>{{ $customerName }}</strong>,</p>
            <p>Booking Anda telah dicatat oleh tim kami dan siap digunakan. Simpan email ini sebagai invoice Anda.</p>
            <div style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:12px;padding:16px;margin:20px 0">
                <div style="color:#047857;font-size:12px;text-transform:uppercase;letter-spacing:1px">Kode booking</div>
                <div style="font-size:22px;font-weight:700;color:#065f46">{{ $booking->booking_code }}</div>
            </div>
            <table role="presentation" style="width:100%;border-collapse:collapse;font-size:14px">
                <tr><td style="padding:7px 0;color:#64748b">Lapangan</td><td style="padding:7px 0;text-align:right;font-weight:700">{{ $booking->lapangan->name }}</td></tr>
                <tr><td style="padding:7px 0;color:#64748b">Tanggal</td><td style="padding:7px 0;text-align:right;font-weight:700">{{ $booking->booking_date->translatedFormat('d F Y') }}</td></tr>
                <tr><td style="padding:7px 0;color:#64748b">Jam</td><td style="padding:7px 0;text-align:right;font-weight:700">{{ substr($booking->start_time, 0, 5) }} - {{ substr($booking->end_time, 0, 5) }} WIB</td></tr>
                <tr><td style="padding:7px 0;color:#64748b">Durasi</td><td style="padding:7px 0;text-align:right;font-weight:700">{{ $booking->duration_hours }} jam</td></tr>
                <tr><td style="padding:12px 0 0;color:#64748b;border-top:1px solid #e2e8f0">Total</td><td style="padding:12px 0 0;text-align:right;font-size:18px;font-weight:700;color:#059669;border-top:1px solid #e2e8f0">Rp {{ number_format($booking->total_price, 0, ',', '.') }}</td></tr>
            </table>
            <p style="font-size:13px;color:#64748b;margin:24px 0 0">Pembayaran tercatat sebagai cash di lokasi. Jika ada perubahan jadwal, silakan hubungi pengelola lapangan.</p>
        </div>
        <p style="font-size:12px;color:#94a3b8;text-align:center;margin:18px 0 0">Email ini dikirim otomatis oleh SportBooking.</p>
    </div>
</body>
</html>
