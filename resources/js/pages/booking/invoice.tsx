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
    ShieldCheck,
    Info,
    Send,
    Trophy,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import type { Booking, BankAccount } from '@/types/booking';
import ConfirmDialog from '@/components/confirm-dialog';
import { formatDateTimeIndonesia } from '@/lib/locale';

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

    const getStatusBadge = () => {
        switch (booking.payment_status) {
            case 'approved':
                return (
                    <Badge className="bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">
                        <CheckCircle2 className="mr-1 size-3.5" /> Terkonfirmasi
                        (Lunas)
                    </Badge>
                );
            case 'pending_validation':
                return (
                    <Badge className="animate-pulse bg-amber-500 px-3 py-1 text-xs font-bold text-white">
                        <Clock className="mr-1 size-3.5" /> Menunggu Validasi
                        Kasir
                    </Badge>
                );
            case 'rejected':
                return (
                    <Badge className="bg-rose-600 px-3 py-1 text-xs font-bold text-white">
                        <XCircle className="mr-1 size-3.5" /> Pembayaran Ditolak
                    </Badge>
                );
            case 'cancelled':
                return (
                    <Badge
                        variant="destructive"
                        className="px-3 py-1 text-xs font-bold"
                    >
                        Dibatalkan
                    </Badge>
                );
            default:
                return (
                    <Badge className="bg-sky-600 px-3 py-1 text-xs font-bold text-white">
                        <Clock className="mr-1 size-3.5" /> Menunggu Pembayaran
                    </Badge>
                );
        }
    };

    return (
        <PublicLayout>
            <Head title={`Invoice #${booking.booking_code}`} />

            <div className="public-container max-w-4xl py-8 print:m-0 print:max-w-none print:p-0">
                {/* Header Back & Print buttons */}
                <div className="no-print mb-6 flex items-center justify-between print:hidden">
                    <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="text-xs"
                    >
                        <Link href="/my-bookings">
                            <ArrowLeft className="size-3.5" /> Riwayat
                            Booking
                        </Link>
                    </Button>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.print()}
                            className="rounded-xl text-xs"
                        >
                            <Printer className="size-3.5" /> Cetak /
                            Simpan PDF
                        </Button>
                    </div>
                </div>

                {/* Main Invoice Card */}
                <div className="border-border/80 bg-card space-y-8 rounded-2xl border p-6 shadow-lg sm:p-8 print:border-none print:bg-transparent print:p-0 print:shadow-none print:space-y-6">
                    {/* Official Print Header (Only shown when printing) */}
                    <div className="hidden border-b-2 border-primary/40 pb-4 print:flex print:items-center print:justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                                <Trophy className="size-5" />
                            </div>
                            <div>
                                <h2 className="text-lg font-black tracking-tight text-foreground">{appName}</h2>
                                <p className="text-[10px] text-muted-foreground">Platform Sewa Lapangan Olahraga Resmi</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="inline-block text-xs font-bold uppercase tracking-wider text-primary">
                                Bukti Reservasi Resmi
                            </span>
                            <p className="text-[10px] text-muted-foreground">ID: #{booking.booking_code}</p>
                        </div>
                    </div>

                    {/* Invoice Top Strip */}
                    <div className="border-border/60 flex flex-col justify-between gap-4 border-b pb-6 sm:flex-row sm:items-center">
                        <div>
                            <span className="text-xs font-semibold tracking-wider text-primary uppercase dark:text-primary">
                                Invoice Pembayaran
                            </span>
                            <h1 className="text-foreground mt-0.5 text-2xl font-black sm:text-3xl">
                                #{booking.booking_code}
                            </h1>
                            <p className="text-muted-foreground mt-1 text-xs">
                                Dibuat pada:{' '}
                                {formatDateTimeIndonesia(booking.created_at)} WIB
                            </p>
                        </div>

                        <div className="flex flex-col gap-1.5 sm:items-end">
                            {getStatusBadge()}
                            {booking.payment_status === 'pending' &&
                                timeLeft && (
                                    <p className="flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400 no-print print:hidden">
                                        <Clock className="size-3.5" /> Sisa
                                        waktu: {timeLeft}
                                    </p>
                                )}
                            {booking.payment_status === 'pending' && (
                                <p className="hidden text-[11px] text-muted-foreground print:block">
                                    Batas Pembayaran: {formatDateTimeIndonesia(booking.payment_deadline)} WIB
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Booking & Customer Details Grid */}
                    <div className="grid grid-cols-1 gap-6 text-xs sm:grid-cols-2">
                        <div className="bg-muted/30 border-border/60 space-y-2 rounded-xl border p-4">
                            <p className="text-foreground text-sm font-bold tracking-wider uppercase">
                                Detail Lapangan
                            </p>
                            <div className="text-muted-foreground space-y-1">
                                <p className="text-foreground text-sm font-semibold">
                                    {booking.lapangan?.name}
                                </p>
                                <p>
                                    Kategori:{' '}
                                    <span className="text-foreground">
                                        {booking.lapangan?.category?.name}
                                    </span>
                                </p>
                                <p>
                                    Tanggal Main:{' '}
                                    <span className="text-foreground font-semibold">
                                        {booking.booking_date}
                                    </span>
                                </p>
                                <p>
                                    Waktu:{' '}
                                    <span className="text-foreground font-semibold">
                                        {booking.start_time} -{' '}
                                        {booking.end_time} WIB
                                    </span>{' '}
                                    ({booking.duration_hours} Jam)
                                </p>
                            </div>
                        </div>

                        <div className="bg-muted/30 border-border/60 space-y-2 rounded-xl border p-4">
                            <p className="text-foreground text-sm font-bold tracking-wider uppercase">
                                Detail Pemesan
                            </p>
                            <div className="text-muted-foreground space-y-1">
                                <p>
                                    Nama:{' '}
                                    <span className="text-foreground font-semibold">
                                        {booking.customer_name}
                                    </span>
                                </p>
                                <p>
                                    Telepon:{' '}
                                    <span className="text-foreground font-semibold">
                                        {booking.customer_phone}
                                    </span>
                                </p>
                                <p>
                                    Metode:{' '}
                                    <span className="text-foreground font-bold uppercase">
                                        {booking.payment_method}
                                    </span>
                                </p>
                                {booking.notes && (
                                    <p>
                                        Catatan:{' '}
                                        <span className="text-foreground italic">
                                            "{booking.notes}"
                                        </span>
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Rejection Alert if any */}
                    {booking.payment_status === 'rejected' &&
                        booking.rejection_reason && (
                            <div className="space-y-1 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-600">
                                <p className="flex items-center gap-1.5 text-sm font-bold">
                                    <AlertCircle className="size-4" /> Alasan
                                    Penolakan dari Kasir:
                                </p>
                                <p className="leading-relaxed">
                                    {booking.rejection_reason}
                                </p>
                            </div>
                        )}

                    {/* Price Breakdown Box */}
                    <div className="border-border/70 overflow-hidden rounded-xl border">
                        <div className="bg-muted/50 text-muted-foreground flex justify-between px-4 py-2.5 text-xs font-bold tracking-wider uppercase">
                            <span>Rincian Pembayaran</span>
                            <span>Jumlah</span>
                        </div>
                        <div className="space-y-2.5 p-4 text-xs">
                            <div className="text-muted-foreground flex justify-between">
                                <span>
                                    Sewa Lapangan ({booking.duration_hours} Jam
                                    x Rp{' '}
                                    {Number(
                                        booking.base_price /
                                            booking.duration_hours,
                                    ).toLocaleString('id-ID')}
                                    )
                                </span>
                                <span className="text-foreground font-semibold">
                                    Rp{' '}
                                    {Number(booking.base_price).toLocaleString(
                                        'id-ID',
                                    )}
                                </span>
                            </div>

                            {booking.payment_method === 'transfer' && (
                                <div className="flex justify-between font-medium text-primary dark:text-primary">
                                    <span className="flex items-center gap-1">
                                        Kode Unik Validasi
                                        <span className="rounded bg-primary/10 px-1.5 py-0.5 text-xs">
                                            Otomatis
                                        </span>
                                    </span>
                                    <span>+ Rp {booking.validation_code}</span>
                                </div>
                            )}

                            {booking.points_redeemed > 0 && (
                                <div className="flex justify-between font-medium text-primary dark:text-primary">
                                    <span>Poin Digunakan</span>
                                    <span>
                                        - Rp{' '}
                                        {Number(
                                            booking.points_redeemed,
                                        ).toLocaleString('id-ID')}
                                    </span>
                                </div>
                            )}

                            <div className="border-border flex items-center justify-between border-t pt-3 text-sm font-black">
                                <span className="text-foreground">
                                    Total yang Harus Dibayar:
                                </span>
                                <div className="text-right">
                                    <span className="text-xl font-extrabold text-primary dark:text-primary">
                                        Rp{' '}
                                        {Number(
                                            booking.total_price,
                                        ).toLocaleString('id-ID')}
                                    </span>
                                    {booking.payment_method === 'transfer' && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                copyToClipboard(
                                                    String(booking.total_price),
                                                    'amount',
                                                )
                                            }
                                            className="text-muted-foreground hover:text-foreground no-print ml-2 inline-flex items-center gap-1 text-xs print:hidden"
                                        >
                                            {copiedAmount ? (
                                                <Check className="size-3 text-primary" />
                                            ) : (
                                                <Copy className="size-3" />
                                            )}
                                            {copiedAmount
                                                ? 'Tersalin'
                                                : 'Salin Nominal'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bank Transfer Instructions & Active Accounts (if Transfer) */}
                    {booking.payment_method === 'transfer' &&
                        booking.payment_status === 'pending' && (
                            <div className="no-print space-y-4 pt-2 print:hidden">
                                <div className="space-y-3 rounded-2xl border border-primary/20 bg-primary/5 p-5">
                                    <div className="flex items-center gap-2">
                                        <CreditCard className="size-5 text-primary" />
                                        <h3 className="text-foreground text-sm font-bold">
                                            Instruksi Transfer Bank
                                        </h3>
                                    </div>
                                    <p className="text-muted-foreground text-xs leading-relaxed">
                                        Silakan transfer ke salah satu rekening
                                        resmi kami di bawah ini.{' '}
                                        <strong>PENTING:</strong> Pastikan
                                        nominal transfer persis hingga digit
                                        terakhir{' '}
                                        <strong>
                                            (Rp{' '}
                                            {Number(
                                                booking.total_price,
                                            ).toLocaleString('id-ID')}
                                            )
                                        </strong>{' '}
                                        agar pembayaran Anda dapat diverifikasi
                                        dengan cepat.
                                    </p>

                                    <div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-3">
                                        {bankAccounts.map((b) => (
                                            <div
                                                key={b.id}
                                                className="border-border bg-card space-y-1.5 rounded-xl border p-3.5 text-xs"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <Badge
                                                        variant="outline"
                                                        className="text-xs font-bold"
                                                    >
                                                        {b.bank_name}
                                                    </Badge>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            copyToClipboard(
                                                                b.account_number,
                                                                'account',
                                                            )
                                                        }
                                                        className="text-muted-foreground hover:text-foreground p-1"
                                                        title="Salin Nomor Rekening"
                                                    >
                                                        {copiedAccount ===
                                                        b.account_number ? (
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
                                </div>

                                {/* User payment confirmation */}
                                <form
                                    onSubmit={handleConfirmTransfer}
                                    className="bg-card border-border/80 space-y-4 rounded-2xl border p-5"
                                >
                                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                                        <div className="space-y-1">
                                            <h4 className="text-foreground flex items-center gap-2 text-sm font-bold">
                                                <Send className="size-4 text-primary" />{' '}
                                                Konfirmasi Pembayaran Anda
                                            </h4>
                                            <p className="text-muted-foreground text-xs leading-relaxed">
                                                Sudah melakukan transfer sesuai
                                                nominal tepat{' '}
                                                <strong className="font-bold text-primary dark:text-primary">
                                                    Rp{' '}
                                                    {Number(
                                                        booking.total_price,
                                                    ).toLocaleString('id-ID')}
                                                </strong>
                                                ? Klik tombol di samping untuk
                                                memberi tahu kasir/admin.
                                            </p>
                                        </div>

                                        <Button
                                            type="submit"
                                            disabled={processing}
                                            className="h-10 w-full shrink-0 rounded-xl bg-primary px-6 font-bold text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90 sm:w-auto"
                                        >
                                            {processing
                                                ? 'Mengirim...'
                                                : 'Saya Sudah Transfer'}
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        )}

                    {/* Cash Instructions (if Cash) */}
                    {booking.payment_method === 'cash' &&
                        booking.payment_status === 'pending' && (
                            <div className="bg-muted/40 border-border/70 no-print space-y-2 rounded-2xl border p-5 text-xs print:hidden">
                                <h3 className="text-foreground flex items-center gap-2 text-sm font-bold">
                                    <Banknote className="size-5 text-primary" />{' '}
                                    Pembayaran Tunai (Cash di Lokasi)
                                </h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    Anda telah memilih pembayaran tunai langsung
                                    di tempat. Silakan datang ke kasir lapangan
                                    sebelum jadwal bermain dimulai dan sebutkan
                                    kode booking{' '}
                                    <strong>#{booking.booking_code}</strong>{' '}
                                    untuk pelunasan.
                                </p>
                            </div>
                        )}

                    {/* Footer Actions: Cancel if allowed */}
                    {canCancel && (
                        <div className="border-border/60 no-print flex justify-end border-t pt-4 print:hidden">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={cancelProcessing}
                                onClick={handleCancelBooking}
                                className="rounded-xl border-rose-200 text-xs text-rose-600 hover:bg-rose-50 dark:border-rose-950/60 dark:hover:bg-rose-950/30"
                            >
                                {cancelProcessing
                                    ? 'Membatalkan...'
                                    : 'Batalkan Booking Ini'}
                            </Button>

                            <ConfirmDialog
                                open={showCancelConfirm}
                                onOpenChange={setShowCancelConfirm}
                                title="Batalkan Booking"
                                description="Apakah Anda yakin ingin membatalkan booking ini? Tindakan ini tidak dapat dibatalkan."
                                variant="destructive"
                                icon={XCircle}
                                onConfirm={() => {
                                    cancelPost(
                                        `/booking/${booking.booking_code}/cancel`,
                                        { preserveScroll: true },
                                    );
                                    setShowCancelConfirm(false);
                                }}
                            />
                        </div>
                    )}

                    {/* Official Print Footer Note (Only shown when printing) */}
                    <div className="hidden border-t border-border/60 pt-6 text-center text-[10px] text-muted-foreground space-y-1 print:block">
                        <p className="font-semibold text-foreground">
                            Terima kasih atas pemesanan Anda di {appName}.
                        </p>
                        <p>
                            Harap tunjukkan lembar invoice ini atau sebutkan Kode Booking #{booking.booking_code} saat tiba di lokasi lapangan.
                        </p>
                        <p className="text-[9px] text-muted-foreground/80">
                            Dicetak secara resmi oleh sistem {appName}
                        </p>
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
}
