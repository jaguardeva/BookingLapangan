import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { PublicLayout } from '@/layouts/public-layout';
import {
    Clock,
    CheckCircle2,
    AlertCircle,
    XCircle,
    Copy,
    Check,
    Printer,
    ArrowLeft,
    CreditCard,
    Banknote,
    Send,
    Trophy,
    Calendar,
    Phone,
    Mail,
    User as UserIcon,
    FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import type { Booking, BankAccount } from '@/types/booking';
import ConfirmDialog from '@/components/confirm-dialog';
import { formatDateIndonesia, formatDateTimeIndonesia } from '@/lib/locale';

interface Props {
    booking: Booking;
    bankAccounts: BankAccount[];
    canCancel: boolean;
}

export default function BookingInvoice({
    booking,
    bankAccounts = [],
    canCancel,
}: Props) {
    const { name: appName = 'SportBooking' } = usePage<{ name?: string }>().props;
    const [copiedAccount, setCopiedAccount] = useState<string | null>(null);
    const [copiedAmount, setCopiedAmount] = useState(false);
    const [timeLeft, setTimeLeft] = useState<string>('');
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);

    // Payment confirmation form
    const { post, processing } = useForm();

    // Cancellation form
    const { post: cancelPost, processing: cancelProcessing } = useForm();

    // Live countdown timer to payment deadline
    useEffect(() => {
        const updateTimer = () => {
            const now = new Date().getTime();
            const deadline = new Date(booking.payment_deadline).getTime();
            const diff = deadline - now;

            if (diff <= 0) {
                setTimeLeft('Batas waktu pembayaran telah habis');
                return;
            }

            const hours = Math.floor(
                (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
            );
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            setTimeLeft(
                `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
            );
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [booking.payment_deadline]);

    const copyToClipboard = (text: string, type: 'account' | 'amount') => {
        navigator.clipboard.writeText(text);
        if (type === 'amount') {
            setCopiedAmount(true);
            setTimeout(() => setCopiedAmount(false), 2000);
            toast.success('Nominal transfer berhasil disalin!');
        } else {
            setCopiedAccount(text);
            setTimeout(() => setCopiedAccount(null), 2000);
            toast.success('Nomor rekening berhasil disalin!');
        }
    };

    const handleConfirmTransfer = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/booking/${booking.booking_code}/submit-payment`, {
            preserveScroll: true,
        });
    };

    const handleCancelBooking = () => {
        setShowCancelConfirm(true);
    };

    const isPaid = booking.payment_status === 'approved';
    const isPending = booking.payment_status === 'pending';
    const isPendingValidation = booking.payment_status === 'pending_validation';
    const isCancelled = booking.payment_status === 'cancelled';
    const isRejected = booking.payment_status === 'rejected';

    const getStatusBadge = () => {
        switch (booking.payment_status) {
            case 'approved':
                return (
                    <Badge className="bg-emerald-600 px-3 py-1 text-xs font-bold text-white shadow-xs">
                        <CheckCircle2 className="mr-1 size-3.5" /> Terkonfirmasi (Lunas)
                    </Badge>
                );
            case 'pending_validation':
                return (
                    <Badge className="animate-pulse bg-amber-500 px-3 py-1 text-xs font-bold text-white shadow-xs">
                        <Clock className="mr-1 size-3.5" /> Menunggu Validasi Kasir
                    </Badge>
                );
            case 'rejected':
                return (
                    <Badge className="bg-rose-600 px-3 py-1 text-xs font-bold text-white shadow-xs">
                        <XCircle className="mr-1 size-3.5" /> Pembayaran Ditolak
                    </Badge>
                );
            case 'cancelled':
                return (
                    <Badge variant="destructive" className="px-3 py-1 text-xs font-bold shadow-xs">
                        Dibatalkan
                    </Badge>
                );
            default:
                return (
                    <Badge className="bg-sky-600 px-3 py-1 text-xs font-bold text-white shadow-xs">
                        <Clock className="mr-1 size-3.5" /> Menunggu Pembayaran
                    </Badge>
                );
        }
    };

    return (
        <PublicLayout>
            <Head title={`Invoice #${booking.booking_code}`} />

            <div className="public-container min-w-0 max-w-4xl py-4 sm:py-8 print:m-0 print:max-w-none print:p-0">
                {/* Header Back & Print buttons (hidden on print) */}
                <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden sm:mb-6">
                    <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="text-xs"
                    >
                        <Link href="/my-bookings">
                            <ArrowLeft className="mr-1.5 size-3.5" /> Riwayat Booking
                        </Link>
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.print()}
                        className="rounded-xl text-xs font-semibold shadow-xs hover:bg-muted"
                    >
                        <Printer className="mr-1.5 size-3.5 text-primary" /> Cetak / Simpan PDF
                    </Button>
                </div>

                {/* Main Invoice Sheet */}
                <div className="border-border/80 bg-card min-w-0 rounded-2xl border p-4 shadow-lg sm:p-9 print:border-none print:bg-transparent print:p-0 print:shadow-none space-y-5 print:space-y-5 sm:space-y-6">

                    {/* 1. KOP SURAT & INVOICE HEADER */}
                    <div className="border-b-2 border-primary/30 pb-5 print:pb-4">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            {/* Logo & Info Perusahaan / Venue */}
                            <div className="flex min-w-0 items-start gap-3">
                                <div className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs print:size-10 print:border print:border-slate-800">
                                    <Trophy className="size-6 text-primary-foreground print:size-5" />
                                </div>
                                <div className="min-w-0 space-y-0.5">
                                    <h1 className="break-words text-xl font-black tracking-tight text-foreground sm:text-2xl print:text-xl">
                                        {appName}
                                    </h1>
                                    <p className="break-words text-xs font-medium text-muted-foreground print:text-slate-600">
                                        Platform & Arena Sewa Lapangan Olahraga Resmi
                                    </p>
                                    <p className="text-[11px] text-muted-foreground print:text-slate-500">
                                        Layanan Pelanggan & Reservasi Online 24/7
                                    </p>
                                </div>
                            </div>

                            {/* Dokumen Metadata & Status Box */}
                            <div className="flex min-w-0 flex-col items-start gap-1.5 sm:items-end">
                                <div className="min-w-0 max-w-full text-left sm:text-right">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-primary print:text-slate-800">
                                        Bukti Reservasi Resmi
                                    </span>
                                    <h2 className="break-all font-mono text-lg font-black tracking-tight text-foreground sm:text-2xl print:text-xl">
                                        #{booking.booking_code}
                                    </h2>
                                    <p className="text-[11px] text-muted-foreground print:text-slate-600">
                                        Dibuat: {formatDateTimeIndonesia(booking.created_at)} WIB
                                    </p>
                                </div>

                                {/* Status Cap / Stamp */}
                                <div className="mt-1">
                                    {isPaid && (
                                        <div className="invoice-stamp-paid px-3 py-1 rounded text-xs font-black inline-flex items-center gap-1">
                                            <CheckCircle2 className="size-3.5" /> LUNAS / PAID
                                        </div>
                                    )}
                                    {isPending && (
                                        <div className="invoice-stamp-pending px-3 py-1 rounded text-xs font-bold inline-flex items-center gap-1">
                                            <Clock className="size-3.5" /> MENUNGGU PEMBAYARAN
                                        </div>
                                    )}
                                    {isPendingValidation && (
                                        <div className="border-2 border-sky-600 bg-sky-50 text-sky-800 px-3 py-1 rounded text-xs font-bold inline-flex items-center gap-1">
                                            <Clock className="size-3.5" /> MENUNGGU VALIDASI
                                        </div>
                                    )}
                                    {(isCancelled || isRejected) && (
                                        <div className="invoice-stamp-cancelled px-3 py-1 rounded text-xs font-black inline-flex items-center gap-1">
                                            <XCircle className="size-3.5" /> {isRejected ? 'DITOLAK' : 'DIBATALKAN'}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 2. DUA KOLOM: DITAGIHKAN KEPADA & INFORMASI TRANSAKSI */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs print:grid-cols-2 print:gap-4 print-avoid-break">
                        {/* Ditagihkan Kepada (Pelanggan) */}
                        <div className="rounded-xl border border-border/80 bg-muted/20 p-4 space-y-2.5 print:border-slate-300 print:bg-slate-50/50">
                            <div className="flex items-center gap-1.5 border-b border-border/60 pb-1.5 text-foreground font-bold tracking-wider uppercase text-[11px] print:border-slate-200">
                                <UserIcon className="size-3.5 text-primary print:text-slate-700" />
                                <span>Ditagihkan Kepada</span>
                            </div>
                            <div className="space-y-1.5 text-muted-foreground print:text-slate-700">
                                <div className="flex min-w-0 flex-wrap items-start justify-between gap-x-2 gap-y-1 sm:justify-start sm:gap-2">
                                        <span className="w-24 shrink-0 text-muted-foreground print:text-slate-500">Nama:</span>
                                    <span className="min-w-0 break-words text-right font-bold text-foreground sm:text-left print:text-slate-900">{booking.customer_name}</span>
                                </div>
                                <div className="flex min-w-0 flex-wrap items-start justify-between gap-x-2 gap-y-1 sm:justify-start sm:gap-2">
                                    <span className="w-24 shrink-0 text-muted-foreground print:text-slate-500">No. Telepon:</span>
                                    <span className="min-w-0 break-words text-right font-semibold text-foreground sm:text-left print:text-slate-900">{booking.customer_phone}</span>
                                </div>
                                <div className="flex min-w-0 flex-wrap items-start justify-between gap-x-2 gap-y-1 sm:justify-start sm:gap-2">
                                    <span className="w-24 shrink-0 text-muted-foreground print:text-slate-500">Email:</span>
                                    <span className="min-w-0 break-all text-right text-foreground sm:text-left print:text-slate-900">{booking.customer_email || booking.user?.email || '-'}</span>
                                </div>
                                {booking.notes && (
                                    <div className="flex min-w-0 flex-wrap items-start justify-between gap-x-2 gap-y-1 pt-0.5 sm:justify-start sm:gap-2">
                                        <span className="w-24 shrink-0 text-muted-foreground print:text-slate-500">Catatan:</span>
                                        <span className="min-w-0 break-words text-right italic text-foreground sm:text-left print:text-slate-800">"{booking.notes}"</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Informasi Reservasi & Pembayaran */}
                        <div className="rounded-xl border border-border/80 bg-muted/20 p-4 space-y-2.5 print:border-slate-300 print:bg-slate-50/50">
                            <div className="flex items-center gap-1.5 border-b border-border/60 pb-1.5 text-foreground font-bold tracking-wider uppercase text-[11px] print:border-slate-200">
                                <FileText className="size-3.5 text-primary print:text-slate-700" />
                                <span>Detail Reservasi & Status</span>
                            </div>
                            <div className="space-y-1.5 text-muted-foreground print:text-slate-700">
                                <div className="flex min-w-0 flex-wrap items-start justify-between gap-x-2 gap-y-1 sm:justify-start sm:gap-2">
                                    <span className="w-28 text-muted-foreground print:text-slate-500">Layanan:</span>
                                    <span className="font-semibold text-foreground print:text-slate-900">Sewa Lapangan Harian (Reguler)</span>
                                </div>
                                <div className="flex min-w-0 flex-wrap items-start justify-between gap-x-2 gap-y-1 sm:justify-start sm:gap-2">
                                    <span className="w-28 text-muted-foreground print:text-slate-500">Metode Bayar:</span>
                                    <span className="font-bold uppercase text-foreground print:text-slate-900">
                                        {booking.payment_method === 'transfer' ? 'Transfer Bank' : 'Tunai di Kasir'}
                                    </span>
                                </div>
                                <div className="flex min-w-0 flex-wrap items-start justify-between gap-x-2 gap-y-1 sm:justify-start sm:gap-2">
                                    <span className="w-28 text-muted-foreground print:text-slate-500">Batas Waktu:</span>
                                    <span className="font-medium text-foreground print:text-slate-900">
                                        {formatDateTimeIndonesia(booking.payment_deadline)} WIB
                                    </span>
                                </div>
                                {booking.validated_at && (
                                    <div className="flex min-w-0 flex-wrap items-start justify-between gap-x-2 gap-y-1 sm:justify-start sm:gap-2">
                                        <span className="w-28 text-muted-foreground print:text-slate-500">Diverifikasi:</span>
                                        <span className="font-semibold text-emerald-700 print:text-emerald-900">
                                            {formatDateTimeIndonesia(booking.validated_at)} WIB
                                            {booking.validator?.name ? ` (${booking.validator.name})` : ''}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Alert Penolakan jika Ditolak */}
                    {booking.payment_status === 'rejected' && booking.rejection_reason && (
                        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-700 print:border-rose-400 print:bg-rose-50 print-avoid-break">
                            <p className="flex items-center gap-1.5 text-sm font-bold">
                                <AlertCircle className="size-4" /> Alasan Penolakan Kasir:
                            </p>
                            <p className="mt-1 leading-relaxed">{booking.rejection_reason}</p>
                        </div>
                    )}

                    {/* 3. TABEL RINCIAN LAYANAN (ITEMIZED TABLE) */}
                    <div className="overflow-hidden rounded-xl border border-border/80 print:border-slate-300 print-avoid-break">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr className="bg-muted/70 text-foreground font-bold border-b border-border/80 print:bg-slate-100 print:text-slate-900 print:border-slate-300">
                                        <th className="py-3 px-3.5 text-center w-10">No</th>
                                        <th className="py-3 px-3.5">Deskripsi Layanan & Lapangan</th>
                                        <th className="py-3 px-3.5">Jadwal Bermain</th>
                                        <th className="py-3 px-3.5 text-center">Durasi</th>
                                        <th className="py-3 px-3.5 text-right">Tarif / Jam</th>
                                        <th className="py-3 px-3.5 text-right">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/60 print:divide-slate-200">
                                    <tr className="text-foreground hover:bg-muted/30">
                                        <td className="py-3.5 px-3.5 text-center font-mono text-muted-foreground print:text-slate-600">
                                            1
                                        </td>
                                        <td className="py-3.5 px-3.5">
                                            <p className="font-bold text-foreground print:text-slate-900">
                                                {booking.lapangan?.name}
                                            </p>
                                            <p className="text-[11px] text-muted-foreground print:text-slate-600">
                                                Kategori: {booking.lapangan?.category?.name || 'Olahraga'}
                                            </p>
                                        </td>
                                        <td className="py-3.5 px-3.5">
                                            <p className="font-semibold text-foreground print:text-slate-900">
                                                {formatDateIndonesia(booking.booking_date)}
                                            </p>
                                            <p className="text-[11px] text-muted-foreground print:text-slate-600">
                                                Pukul {booking.start_time} - {booking.end_time} WIB
                                            </p>
                                        </td>
                                        <td className="py-3.5 px-3.5 text-center font-medium">
                                            {booking.duration_hours} Jam
                                        </td>
                                        <td className="py-3.5 px-3.5 text-right font-medium text-muted-foreground print:text-slate-700">
                                            Rp {Number(booking.base_price / Math.max(1, booking.duration_hours)).toLocaleString('id-ID')}
                                        </td>
                                        <td className="py-3.5 px-3.5 text-right font-bold text-foreground print:text-slate-900">
                                            Rp {Number(booking.base_price).toLocaleString('id-ID')}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* 4. KALKULASI FINANSIAL & INSTRUKSI PEMBAYARAN */}
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 pt-1 print:grid-cols-2 print:gap-6 print-avoid-break">
                        {/* Kolom Kiri: Informasi Rekening / Catatan Pembayaran */}
                        <div className="space-y-3">
                            <div className="rounded-xl border border-border/80 bg-muted/20 p-4 space-y-2 text-xs print:border-slate-300 print:bg-slate-50/50">
                                <p className="font-bold uppercase tracking-wider text-foreground text-[11px] print:text-slate-900">
                                    Informasi Pembayaran
                                </p>
                                {booking.payment_method === 'transfer' ? (
                                    <div className="space-y-1.5 text-muted-foreground print:text-slate-700 leading-relaxed">
                                        <p>
                                            Pembayaran via Transfer Bank ke rekening resmi pengelola arena:
                                        </p>
                                        {bankAccounts.length > 0 ? (
                                            <div className="space-y-1 pt-1">
                                                {bankAccounts.map((b) => (
                                                    <div key={b.id} className="font-mono text-[11px] text-foreground print:text-slate-900">
                                                        • <strong>{b.bank_name}</strong>: {b.account_number} a.n {b.account_name}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="italic">Rekening transfer terdaftar di sistem.</p>
                                        )}
                                        <p className="text-[11px] text-primary font-semibold pt-1 print:text-slate-800">
                                            *Pastikan nominal transfer tepat hingga 3 digit terakhir untuk verifikasi otomatis.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-1 text-muted-foreground print:text-slate-700 leading-relaxed">
                                        <p>
                                            Pembayaran Tunai (Cash) dilakukan langsung kepada kasir di lokasi lapangan sebelum jam bermain dimulai.
                                        </p>
                                        <p className="font-semibold text-foreground print:text-slate-900">
                                            Tunjukkan kode booking #{booking.booking_code} saat pembayaran di kasir.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Kolom Kanan: Rincian Angka Finansial */}
                        <div className="space-y-2 text-xs">
                            <div className="rounded-xl border border-border/80 bg-card p-4 space-y-2.5 print:border-slate-300 print:bg-slate-50/30">
                                <div className="flex flex-col justify-between gap-1 text-muted-foreground sm:flex-row sm:items-baseline print:text-slate-700">
                                    <span>Subtotal Sewa Lapangan</span>
                                    <span className="font-semibold text-foreground print:text-slate-900">
                                        Rp {Number(booking.base_price).toLocaleString('id-ID')}
                                    </span>
                                </div>

                                {booking.discount_amount > 0 && (
                                    <div className="flex flex-col justify-between gap-1 font-medium text-emerald-600 sm:flex-row sm:items-baseline dark:text-emerald-400 print:text-emerald-800">
                                        <span>Potongan Diskon Kupon</span>
                                        <span>- Rp {Number(booking.discount_amount).toLocaleString('id-ID')}</span>
                                    </div>
                                )}

                                {booking.points_redeemed > 0 && (
                                    <div className="flex flex-col justify-between gap-1 font-medium text-emerald-600 sm:flex-row sm:items-baseline dark:text-emerald-400 print:text-emerald-800">
                                        <span>Potongan Poin Loyalitas</span>
                                        <span>- Rp {Number(booking.points_redeemed).toLocaleString('id-ID')}</span>
                                    </div>
                                )}

                                {booking.payment_method === 'transfer' && booking.validation_code > 0 && (
                                    <div className="flex flex-col justify-between gap-1 text-muted-foreground sm:flex-row sm:items-baseline print:text-slate-700">
                                        <span className="flex items-center gap-1">
                                            Kode Unik Validasi Transfer
                                            <span className="rounded bg-muted px-1.5 py-0.2 text-[10px] print:hidden">
                                                Otomatis
                                            </span>
                                        </span>
                                        <span className="font-medium text-foreground print:text-slate-900">
                                            + Rp {booking.validation_code}
                                        </span>
                                    </div>
                                )}

                                <div className="border-t-2 border-border/80 flex flex-col gap-1 pt-3 text-sm font-black sm:flex-row sm:items-center sm:justify-between print:border-slate-300">
                                    <span className="text-foreground print:text-slate-900">TOTAL PEMBAYARAN:</span>
                                    <span className="text-right text-xl font-extrabold text-primary print:text-slate-950">
                                        Rp {Number(booking.total_price).toLocaleString('id-ID')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 5. CATATAN RESERVASI */}
                    <div className="rounded-xl border border-border/60 bg-muted/20 p-3.5 text-xs text-muted-foreground print:border-slate-300 print:bg-slate-50/50 print:text-slate-700 print-avoid-break">
                        <p className="font-bold text-foreground text-[11px] print:text-slate-900">
                            Catatan Penting:
                        </p>
                        <p className="text-[11px] mt-0.5 leading-relaxed">
                            Harap hadir di lokasi arena minimal 15 menit sebelum waktu pemesanan dimulai. Tunjukkan lembar invoice ini atau sebutkan kode booking <strong className="text-foreground print:text-slate-950">#{booking.booking_code}</strong> kepada petugas kasir saat check-in.
                        </p>
                    </div>

                    {/* 6. FOOTER CETAK RESMI */}
                    <div className="text-center text-[10px] text-muted-foreground print:text-slate-500 pt-2 border-t border-border/60 print:border-slate-200">
                        <p>
                            Terima kasih atas pemesanan Anda di {appName}. Dokumen ini diterbitkan secara resmi sebagai bukti sah reservasi lapangan olahraga.
                        </p>
                    </div>
                </div>

                {/* 8. INTERACTIVE PANELS: BANK TRANSFER & PAYMENT CONFIRMATION (WEB ONLY: NO-PRINT) */}
                <div className="no-print mt-6 space-y-5 print:hidden">
                    {/* Bank Transfer Instructions with copy buttons */}
                    {booking.payment_method === 'transfer' && booking.payment_status === 'pending' && (
                        <div className="space-y-4 rounded-2xl border border-primary/25 bg-primary/5 p-5">
                            <div className="flex flex-wrap items-start justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <CreditCard className="size-5 text-primary" />
                                    <h3 className="text-foreground text-sm font-bold">
                                        Instruksi Pembayaran Transfer Bank
                                    </h3>
                                </div>
                                {timeLeft && (
                                    <span className="flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
                                        <Clock className="size-3.5" /> Sisa Waktu: {timeLeft}
                                    </span>
                                )}
                            </div>

                            <p className="text-muted-foreground text-xs leading-relaxed">
                                Silakan transfer ke salah satu rekening resmi kami di bawah ini.
                                <strong> PENTING:</strong> Pastikan nominal transfer persis hingga digit terakhir{' '}
                                <strong className="text-primary font-bold">
                                    Rp {Number(booking.total_price).toLocaleString('id-ID')}
                                </strong>{' '}
                                agar diverifikasi secara otomatis.
                            </p>

                            <div className="grid grid-cols-1 gap-3 pt-1 sm:grid-cols-3">
                                {bankAccounts.map((b) => (
                                    <div
                                        key={b.id}
                                        className="border-border bg-card space-y-1.5 rounded-xl border p-3.5 text-xs shadow-xs"
                                    >
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <Badge variant="outline" className="text-xs font-bold">
                                                {b.bank_name}
                                            </Badge>
                                            <button
                                                type="button"
                                                onClick={() => copyToClipboard(b.account_number, 'account')}
                                                className="text-muted-foreground hover:text-foreground p-1 transition-colors"
                                                title="Salin Nomor Rekening"
                                            >
                                                {copiedAccount === b.account_number ? (
                                                    <Check className="size-3.5 text-primary" />
                                                ) : (
                                                    <Copy className="size-3.5" />
                                                )}
                                            </button>
                                        </div>
                                        <p className="text-foreground font-mono text-sm font-bold tracking-wider">
                                            {b.account_number}
                                        </p>
                                        <p className="text-muted-foreground text-xs uppercase">
                                            {b.account_name}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            {/* User payment confirmation form */}
                            <form
                                onSubmit={handleConfirmTransfer}
                                className="bg-card border-border/80 mt-2 space-y-3 rounded-xl border p-4 shadow-xs"
                            >
                                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                                    <div className="space-y-0.5">
                                        <h4 className="text-foreground flex items-center gap-2 text-xs font-bold">
                                            <Send className="size-3.5 text-primary" /> Konfirmasi Pembayaran Anda
                                        </h4>
                                        <p className="text-muted-foreground text-xs leading-relaxed">
                                            Sudah transfer tepat{' '}
                                            <strong className="font-bold text-primary">
                                                Rp {Number(booking.total_price).toLocaleString('id-ID')}
                                            </strong>
                                            ? Klik tombol di samping untuk memberi tahu kasir.
                                        </p>
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        className="h-9 w-full rounded-xl bg-primary px-5 font-bold text-primary-foreground shadow-sm hover:bg-primary/90 sm:w-auto"
                                    >
                                        {processing ? 'Mengirim...' : 'Saya Sudah Transfer'}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Cash Instructions */}
                    {booking.payment_method === 'cash' && booking.payment_status === 'pending' && (
                        <div className="bg-muted/40 border-border/70 space-y-2 rounded-2xl border p-5 text-xs">
                            <h3 className="text-foreground flex items-center gap-2 text-sm font-bold">
                                <Banknote className="size-5 text-primary" /> Pembayaran Tunai (Cash di Lokasi)
                            </h3>
                            <p className="text-muted-foreground leading-relaxed">
                                Anda memilih pembayaran tunai langsung di tempat. Silakan datang ke kasir lapangan sebelum jam bermain dimulai dan tunjukkan kode booking{' '}
                                <strong className="text-foreground">#{booking.booking_code}</strong> untuk pelunasan.
                            </p>
                        </div>
                    )}

                    {/* Cancel action if permitted */}
                    {canCancel && (
                        <div className="flex justify-end pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={cancelProcessing}
                                onClick={handleCancelBooking}
                                className="rounded-xl border-rose-200 text-xs text-rose-600 hover:bg-rose-50 dark:border-rose-950/60 dark:hover:bg-rose-950/30"
                            >
                                {cancelProcessing ? 'Membatalkan...' : 'Batalkan Booking Ini'}
                            </Button>

                            <ConfirmDialog
                                open={showCancelConfirm}
                                onOpenChange={setShowCancelConfirm}
                                title="Batalkan Booking"
                                description="Apakah Anda yakin ingin membatalkan booking ini? Tindakan ini tidak dapat dibatalkan."
                                variant="destructive"
                                icon={XCircle}
                                onConfirm={() => {
                                    cancelPost(`/booking/${booking.booking_code}/cancel`, {
                                        preserveScroll: true,
                                    });
                                    setShowCancelConfirm(false);
                                }}
                            />
                        </div>
                    )}
                </div>
            </div>
        </PublicLayout>
    );
}
