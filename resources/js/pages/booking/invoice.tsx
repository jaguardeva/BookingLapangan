import { Head, Link, useForm } from '@inertiajs/react';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import type { Booking, BankAccount } from '@/types/booking';
import ConfirmDialog from '@/components/confirm-dialog';

interface Props {
    booking: Booking;
    bankAccounts: BankAccount[];
    canCancel: boolean;
}

export default function BookingInvoice({ booking, bankAccounts = [], canCancel }: Props) {
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

            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            setTimeLeft(
                `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
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
                    <Badge className="bg-emerald-600 text-white text-xs px-3 py-1 font-bold">
                        <CheckCircle2 className="size-3.5 mr-1" /> Terkonfirmasi (Lunas)
                    </Badge>
                );
            case 'pending_validation':
                return (
                    <Badge className="bg-amber-500 text-white text-xs px-3 py-1 font-bold animate-pulse">
                        <Clock className="size-3.5 mr-1" /> Menunggu Validasi Kasir
                    </Badge>
                );
            case 'rejected':
                return (
                    <Badge className="bg-rose-600 text-white text-xs px-3 py-1 font-bold">
                        <XCircle className="size-3.5 mr-1" /> Pembayaran Ditolak
                    </Badge>
                );
            case 'cancelled':
                return (
                    <Badge variant="destructive" className="text-xs px-3 py-1 font-bold">
                        Dibatalkan
                    </Badge>
                );
            default:
                return (
                    <Badge className="bg-sky-600 text-white text-xs px-3 py-1 font-bold">
                        <Clock className="size-3.5 mr-1" /> Menunggu Pembayaran
                    </Badge>
                );
        }
    };

    return (
        <PublicLayout>
            <Head title={`Invoice #${booking.booking_code} - SportBooking`} />

            <div className="container mx-auto px-4 sm:px-6 py-8 max-w-4xl">
                {/* Header Back & Print buttons */}
                <div className="flex items-center justify-between mb-6 no-print">
                    <Button variant="ghost" size="sm" asChild className="text-xs">
                        <Link href="/my-bookings">
                            <ArrowLeft className="size-3.5 mr-1" /> Riwayat Booking
                        </Link>
                    </Button>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.print()}
                            className="text-xs rounded-xl"
                        >
                            <Printer className="size-3.5 mr-1.5" /> Cetak / Simpan PDF
                        </Button>
                    </div>
                </div>

                {/* Main Invoice Card */}
                <div className="rounded-2xl border border-border/80 bg-card p-6 sm:p-8 shadow-lg space-y-8 print:border-none print:shadow-none">
                    {/* Invoice Top Strip */}
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center pb-6 border-b border-border/60 gap-4">
                        <div>
                            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                                Invoice Pembayaran
                            </span>
                            <h1 className="text-2xl sm:text-3xl font-black text-foreground mt-0.5">
                                #{booking.booking_code}
                            </h1>
                            <p className="text-xs text-muted-foreground mt-1">
                                Dibuat pada: {new Date(booking.created_at).toLocaleDateString('id-ID', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })} WIB
                            </p>
                        </div>

                        <div className="flex flex-col sm:items-end gap-1.5">
                            {getStatusBadge()}
                            {booking.payment_status === 'pending' && timeLeft && (
                                <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                                    <Clock className="size-3.5" /> Sisa waktu: {timeLeft}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Booking & Customer Details Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
                        <div className="p-4 rounded-xl bg-muted/30 border border-border/60 space-y-2">
                            <p className="font-bold text-foreground text-sm uppercase tracking-wider">Detail Lapangan</p>
                            <div className="space-y-1 text-muted-foreground">
                                <p className="text-foreground font-semibold text-sm">{booking.lapangan?.name}</p>
                                <p>Kategori: <span className="text-foreground">{booking.lapangan?.category?.name}</span></p>
                                <p>Tanggal Main: <span className="text-foreground font-semibold">{booking.booking_date}</span></p>
                                <p>Waktu: <span className="text-foreground font-semibold">{booking.start_time} - {booking.end_time} WIB</span> ({booking.duration_hours} Jam)</p>
                            </div>
                        </div>

                        <div className="p-4 rounded-xl bg-muted/30 border border-border/60 space-y-2">
                            <p className="font-bold text-foreground text-sm uppercase tracking-wider">Detail Pemesan</p>
                            <div className="space-y-1 text-muted-foreground">
                                <p>Nama: <span className="text-foreground font-semibold">{booking.customer_name}</span></p>
                                <p>Telepon: <span className="text-foreground font-semibold">{booking.customer_phone}</span></p>
                                <p>Metode: <span className="text-foreground uppercase font-bold">{booking.payment_method}</span></p>
                                {booking.notes && <p>Catatan: <span className="text-foreground italic">"{booking.notes}"</span></p>}
                            </div>
                        </div>
                    </div>

                    {/* Rejection Alert if any */}
                    {booking.payment_status === 'rejected' && booking.rejection_reason && (
                        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 text-xs space-y-1">
                            <p className="font-bold flex items-center gap-1.5 text-sm">
                                <AlertCircle className="size-4" /> Alasan Penolakan dari Kasir:
                            </p>
                            <p className="leading-relaxed">{booking.rejection_reason}</p>
                        </div>
                    )}

                    {/* Price Breakdown Box */}
                    <div className="rounded-xl border border-border/70 overflow-hidden">
                        <div className="bg-muted/50 px-4 py-2.5 text-xs font-bold text-muted-foreground uppercase tracking-wider flex justify-between">
                            <span>Rincian Pembayaran</span>
                            <span>Jumlah</span>
                        </div>
                        <div className="p-4 space-y-2.5 text-xs">
                            <div className="flex justify-between text-muted-foreground">
                                <span>Sewa Lapangan ({booking.duration_hours} Jam x Rp {Number(booking.base_price / booking.duration_hours).toLocaleString('id-ID')})</span>
                                <span className="font-semibold text-foreground">Rp {Number(booking.base_price).toLocaleString('id-ID')}</span>
                            </div>

                            {booking.payment_method === 'transfer' && (
                                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                                    <span className="flex items-center gap-1">
                                        Kode Unik Validasi
                                        <span className="text-xs bg-emerald-500/10 px-1.5 py-0.5 rounded">Otomatis</span>
                                    </span>
                                    <span>+ Rp {booking.validation_code}</span>
                                </div>
                            )}

                            <div className="pt-3 border-t border-border flex justify-between items-center text-sm font-black">
                                <span className="text-foreground">Total yang Harus Dibayar:</span>
                                <div className="text-right">
                                    <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                                        Rp {Number(booking.total_price).toLocaleString('id-ID')}
                                    </span>
                                    {booking.payment_method === 'transfer' && (
                                        <button
                                            type="button"
                                            onClick={() => copyToClipboard(String(booking.total_price), 'amount')}
                                            className="ml-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground no-print"
                                        >
                                            {copiedAmount ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
                                            {copiedAmount ? 'Tersalin' : 'Salin Nominal'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bank Transfer Instructions & Active Accounts (if Transfer) */}
                    {booking.payment_method === 'transfer' && booking.payment_status === 'pending' && (
                        <div className="space-y-4 pt-2 no-print">
                            <div className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-3">
                                <div className="flex items-center gap-2">
                                    <CreditCard className="size-5 text-emerald-600" />
                                    <h3 className="text-sm font-bold text-foreground">Instruksi Transfer Bank</h3>
                                </div>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Silakan transfer ke salah satu rekening resmi kami di bawah ini. <strong>PENTING:</strong> Pastikan nominal transfer persis hingga digit terakhir <strong>(Rp {Number(booking.total_price).toLocaleString('id-ID')})</strong> agar pembayaran Anda dapat diverifikasi dengan cepat.
                                </p>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                                    {bankAccounts.map((b) => (
                                        <div key={b.id} className="p-3.5 rounded-xl border border-border bg-card space-y-1.5 text-xs">
                                            <div className="flex items-center justify-between">
                                                <Badge variant="outline" className="font-bold text-xs">
                                                    {b.bank_name}
                                                </Badge>
                                                <button
                                                    type="button"
                                                    onClick={() => copyToClipboard(b.account_number, 'account')}
                                                    className="text-muted-foreground hover:text-foreground p-1"
                                                    title="Salin Nomor Rekening"
                                                >
                                                    {copiedAccount === b.account_number ? (
                                                        <Check className="size-3.5 text-emerald-500" />
                                                    ) : (
                                                        <Copy className="size-3.5" />
                                                    )}
                                                </button>
                                            </div>
                                            <p className="font-mono text-sm font-bold text-foreground tracking-wider">
                                                {b.account_number}
                                            </p>
                                            <p className="text-xs text-muted-foreground uppercase">{b.account_name}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* User payment confirmation */}
                            <form onSubmit={handleConfirmTransfer} className="p-5 rounded-2xl bg-card border border-border/80 space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="space-y-1">
                                        <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                                            <Send className="size-4 text-emerald-600" /> Konfirmasi Pembayaran Anda
                                        </h4>
                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                            Sudah melakukan transfer sesuai nominal tepat <strong className="text-emerald-600 dark:text-emerald-400 font-bold">Rp {Number(booking.total_price).toLocaleString('id-ID')}</strong>? Klik tombol di samping untuk memberi tahu kasir/admin.
                                        </p>
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        className="w-full sm:w-auto h-10 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl px-6 shrink-0 shadow-md shadow-emerald-600/20"
                                    >
                                        {processing ? 'Mengirim...' : 'Saya Sudah Transfer'}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Cash Instructions (if Cash) */}
                    {booking.payment_method === 'cash' && booking.payment_status === 'pending' && (
                        <div className="p-5 rounded-2xl bg-muted/40 border border-border/70 space-y-2 text-xs no-print">
                            <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                                <Banknote className="size-5 text-emerald-600" /> Pembayaran Tunai (Cash di Lokasi)
                            </h3>
                            <p className="text-muted-foreground leading-relaxed">
                                Anda telah memilih pembayaran tunai langsung di tempat. Silakan datang ke kasir lapangan sebelum jadwal bermain dimulai dan sebutkan kode booking <strong>#{booking.booking_code}</strong> untuk pelunasan.
                            </p>
                        </div>
                    )}

                    {/* Footer Actions: Cancel if allowed */}
                    {canCancel && (
                        <div className="pt-4 border-t border-border/60 flex justify-end no-print">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={cancelProcessing}
                                onClick={handleCancelBooking}
                                className="text-rose-600 border-rose-200 dark:border-rose-950/60 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs rounded-xl"
                            >
                                {cancelProcessing ? 'Membatalkan...' : 'Batalkan Booking Ini'}
                            </Button>

                            <ConfirmDialog
                                open={showCancelConfirm}
                                onOpenChange={setShowCancelConfirm}
                                title="Batalkan Booking"
                                description="Apakah Anda yakin ingin membatalkan booking ini? Tindakan ini tidak dapat dibatalkan."
                                variant="destructive"
                                onConfirm={() => {
                                    cancelPost(`/booking/${booking.booking_code}/cancel`, { preserveScroll: true });
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
