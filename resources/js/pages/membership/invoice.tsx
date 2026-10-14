import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import {
    AlertCircle,
    ArrowLeft,
    ArrowRight,
    CalendarDays,
    Check,
    CheckCircle2,
    Clock,
    Copy,
    CreditCard,
    MapPin,
    Printer,
    RefreshCw,
    Trophy,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { PublicLayout } from '@/layouts/public-layout';
import { formatDateIndonesia } from '@/lib/locale';
import MembershipController from '@/actions/App/Http/Controllers/MembershipController';
import { home } from '@/routes';
import { index as membershipIndex } from '@/routes/membership/index';
import type { BankAccount, Membership } from '@/types/booking';

interface Props {
    membership: Membership;
    bankAccounts: BankAccount[];
}

const weekdays = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

const statusLabels: Record<string, string> = {
    pending: 'Menunggu Pembayaran',
    pending_validation: 'Menunggu Validasi',
    approved: 'Terkonfirmasi',
    active: 'Aktif',
    expired: 'Kedaluwarsa',
    rejected: 'Ditolak',
    cancelled: 'Dibatalkan',
};

function formatDate(value?: string | null): string {
    return value ? formatDateIndonesia(value) : '-';
}

function statusVariant(status?: string): 'default' | 'secondary' | 'destructive' | 'outline' {
    if (status === 'active' || status === 'approved') return 'default';
    if (status === 'rejected' || status === 'cancelled') return 'destructive';
    if (status === 'pending' || status === 'pending_validation') return 'secondary';

    return 'outline';
}

export default function MembershipInvoice({ membership, bankAccounts }: Props) {
    const { name: appName = 'SportBooking' } = usePage<{ name?: string }>().props;
    const [copiedAccount, setCopiedAccount] = useState<string | null>(null);
    const [submittingPayment, setSubmittingPayment] = useState(false);
    const [renewing, setRenewing] = useState(false);

    const primaryReservation = membership.reservations?.[0];
    const lapanganName = primaryReservation?.lapangan?.name ?? 'Membership Lapangan';
    const categoryName = primaryReservation?.lapangan?.category?.name;

    const isPendingPayment = membership.payment_status === 'pending';
    const isPendingValidation = membership.payment_status === 'pending_validation';
    const isActive = membership.status === 'active';

    const now = new Date();
    const endsAtDate = membership.ends_at ? new Date(membership.ends_at) : null;
    const diffDays = endsAtDate
        ? Math.ceil((endsAtDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : null;
    const daysLeft = diffDays !== null ? Math.max(0, diffDays) : null;
    const isWithinRenewalWindow = daysLeft !== null && daysLeft <= 7;
    const canRenew = membership.status === 'expired' || (isActive && isWithinRenewalWindow);
    const hasDiscount = Number(membership.discount_amount) > 0;
    const renewalOpensDate = endsAtDate
        ? new Date(endsAtDate.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
        : null;

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        setCopiedAccount(text);
        toast.success(`${label} berhasil disalin ke clipboard.`);
        setTimeout(() => setCopiedAccount(null), 2000);
    };

    const handleConfirmPayment = () => {
        setSubmittingPayment(true);
        router.post(
            MembershipController.submitPayment.url(membership.id),
            {},
            {
                onFinish: () => setSubmittingPayment(false),
            },
        );
    };

    const handleRenew = () => {
        setRenewing(true);
        router.post(
            MembershipController.renew.url(membership.id),
            {},
            {
                onFinish: () => setRenewing(false),
            },
        );
    };

    return (
        <PublicLayout>
            <Head title={`Detail Membership - ${lapanganName}`} />

            {/* Breadcrumb Strip (> 2 levels deep) */}
            <div className="border-border/60 bg-muted/20 text-muted-foreground border-b py-3 text-xs">
                <div className="public-container w-full max-w-[1240px]">
                    <Breadcrumbs
                        breadcrumbs={[
                            { title: 'Beranda', href: home() },
                            { title: 'Membership', href: membershipIndex.url() },
                            { title: `Detail #${membership.id.substring(0, 8)}`, href: MembershipController.show.url(membership.id) },
                        ]}
                    />
                </div>
            </div>

            <div className="min-h-screen py-6 sm:py-10 print:min-h-0 print:py-0">
                <div className="public-container w-full max-w-[1240px] space-y-6 print:max-w-none print:space-y-4">
                    {/* Back Link + Print Button */}
                    <div className="flex items-center justify-between no-print">
                        <Link
                            href={membershipIndex.url()}
                            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-xs font-semibold transition-colors"
                        >
                            <ArrowLeft className="size-4" /> Kembali ke Daftar Membership
                        </Link>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.print()}
                            className="rounded-xl text-xs"
                        >
                            <Printer className="size-3.5" /> Cetak / Simpan PDF
                        </Button>
                    </div>

                    {/* Hero Header Card */}
                    <div className="border-border/70 bg-card rounded-2xl border p-5 shadow-xs sm:p-7 print:border-none print:bg-transparent print:p-0 print:shadow-none">
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
                                    Bukti Membership Resmi
                                </span>
                                <p className="text-[10px] text-muted-foreground">ID: #{membership.id.substring(0, 8)}</p>
                            </div>
                        </div>

                        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start print:mt-4">
                            <div className="space-y-1.5">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-muted-foreground font-mono text-xs font-semibold">
                                        #{membership.id.substring(0, 8)}
                                    </span>
                                    {categoryName && (
                                        <Badge variant="secondary" className="text-[11px] font-semibold">
                                            {categoryName}
                                        </Badge>
                                    )}
                                    <Badge
                                        variant={statusVariant(
                                            isPendingPayment || isPendingValidation
                                                ? membership.payment_status
                                                : membership.status,
                                        )}
                                        className="text-[11px] font-semibold"
                                    >
                                        {statusLabels[
                                            isPendingPayment || isPendingValidation
                                                ? membership.payment_status
                                                : membership.status
                                        ] ?? membership.status}
                                    </Badge>
                                </div>
                                <h1 className="text-foreground text-2xl font-black tracking-tight sm:text-3xl print:text-xl">
                                    {lapanganName}
                                </h1>
                            </div>

                            <div className="text-left sm:text-right">
                                <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                                    Total Biaya
                                </span>
                                <p className="text-primary text-2xl font-black sm:text-3xl print:text-xl">
                                    Rp {membership.amount.toLocaleString('id-ID')}
                                </p>
                            </div>
                        </div>

                        {/* Summary Metrics Bar */}
                        <div className="border-border/60 mt-6 grid grid-cols-1 gap-4 border-t pt-5 sm:grid-cols-3 print:grid-cols-3 print:mt-4 print:pt-3">
                            <div>
                                <span className="text-muted-foreground text-xs">Periode Mulai</span>
                                <p className="mt-0.5 text-sm font-bold text-foreground">
                                    {formatDate(membership.starts_at ?? membership.reservation_start_date)}
                                </p>
                            </div>
                            <div>
                                <span className="text-muted-foreground text-xs">Periode Berakhir</span>
                                <p className="mt-0.5 text-sm font-bold text-foreground">
                                    {formatDate(membership.ends_at)}
                                </p>
                            </div>
                            <div>
                                <span className="text-muted-foreground text-xs">Jadwal Rutin</span>
                                <p className="mt-0.5 text-sm font-bold text-foreground">
                                    {membership.reservations?.map((r) => `${weekdays[r.weekday]} (${r.start_time} - ${r.end_time})`).join(', ') || '-'}
                                </p>
                            </div>
                        </div>

                        {/* Discount Breakdown (shown for all states when discount exists) */}
                        {hasDiscount && (
                            <div className="border-border/60 mt-5 rounded-xl border p-4 print:mt-3 print:p-3">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2.5">
                                    Rincian Biaya
                                </h3>
                                <div className="space-y-1.5 text-xs">
                                    <div className="flex justify-between text-muted-foreground">
                                        <span>Subtotal ({membership.reservations?.length ?? 0} jadwal)</span>
                                        <span>
                                            Rp {Number(membership.subtotal ?? (membership.amount + Number(membership.discount_amount))).toLocaleString('id-ID')}
                                        </span>
                                    </div>
                                    <div className="flex justify-between font-medium text-emerald-600 dark:text-emerald-400">
                                        <span>Diskon Membership ({membership.discount_value ?? 0}%)</span>
                                        <span>
                                            - Rp {Number(membership.discount_amount).toLocaleString('id-ID')}
                                        </span>
                                    </div>
                                    <div className="flex justify-between border-t border-border/50 pt-2 font-bold text-foreground">
                                        <span>Total Dibayar</span>
                                        <span className="text-primary text-sm font-black">
                                            Rp {membership.amount.toLocaleString('id-ID')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Rejection / Cancellation Alert (if applicable) */}
                    {membership.rejection_reason && (
                        <div className="border-destructive/30 bg-destructive/10 text-destructive flex items-start gap-3 rounded-2xl border p-4 text-xs font-medium">
                            <AlertCircle className="mt-0.5 size-4 shrink-0" />
                            <div>
                                <p className="font-bold">Alasan Penolakan:</p>
                                <p className="mt-0.5">{membership.rejection_reason}</p>
                            </div>
                        </div>
                    )}

                    {/* Main Two-Column Content */}
                    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_21rem] lg:items-start print:block print:space-y-4">
                        {/* Left Column: Schedule & Sesi Bermain */}
                        <main className="space-y-6">
                            {/* Jadwal Rutin Card */}
                            <section className="border-border/70 bg-card rounded-2xl border p-5 shadow-xs sm:p-6">
                                <h2 className="flex items-center gap-2 text-sm font-bold tracking-tight">
                                    <CalendarDays className="text-primary size-4" /> Jadwal Mingguan Terdaftar
                                </h2>

                                <div className="mt-4 space-y-2.5">
                                    {membership.reservations?.map((res) => (
                                        <div
                                            key={res.id}
                                            className="bg-muted/30 border-border/60 flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3.5 text-sm"
                                        >
                                            <div>
                                                <p className="font-bold text-foreground">
                                                    Setiap {weekdays[res.weekday]}
                                                </p>
                                                <p className="text-muted-foreground mt-0.5 text-xs">
                                                    {res.start_time} - {res.end_time} WIB · {res.duration_hours} jam
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-muted-foreground text-xs font-semibold">
                                                    {res.occurrence_count ?? 0} Pertemuan (30 hari)
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Timeline Sesi Bermain */}
                            <section className="border-border/70 bg-card rounded-2xl border p-5 shadow-xs sm:p-6">
                                <div className="flex items-center justify-between">
                                    <h2 className="flex items-center gap-2 text-sm font-bold tracking-tight">
                                        <Clock className="text-primary size-4" /> Daftar Sesi Bermain
                                    </h2>
                                    <span className="text-muted-foreground text-xs font-medium">
                                        {membership.bookings?.length ?? 0} Sesi Terjadwal
                                    </span>
                                </div>

                                <div className="divide-border/50 mt-4 divide-y">
                                    {membership.bookings && membership.bookings.length > 0 ? (
                                        membership.bookings.map((booking) => (
                                            <div
                                                key={booking.id}
                                                className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-1 last:pb-0 text-xs"
                                            >
                                                <div className="space-y-0.5">
                                                    <p className="font-bold text-foreground">
                                                        {formatDate(booking.booking_date)}
                                                    </p>
                                                    <p className="text-muted-foreground">
                                                        {booking.start_time} - {booking.end_time} WIB
                                                    </p>
                                                </div>
                                                <Badge
                                                    variant={
                                                        booking.payment_status === 'approved'
                                                            ? 'default'
                                                            : booking.payment_status === 'pending'
                                                              ? 'outline'
                                                              : 'secondary'
                                                    }
                                                    className="text-[10px]"
                                                >
                                                    {booking.payment_status === 'approved'
                                                        ? 'Terkonfirmasi'
                                                        : booking.payment_status === 'pending'
                                                          ? 'Menunggu Bayar'
                                                          : 'Verifikasi'}
                                                </Badge>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-muted-foreground py-4 text-xs">
                                            Sesi bermain akan dibuat otomatis saat periode dimulai.
                                        </p>
                                    )}
                                </div>
                            </section>
                        </main>

                        {/* Right Column: Context-Aware Action Sidebar (hidden in print) */}
                        <aside className="space-y-5 lg:sticky lg:top-24 no-print">
                            {/* CASE 1: Menunggu Pembayaran */}
                            {isPendingPayment && (
                                <section className="border-border/70 bg-card rounded-2xl border p-5 shadow-xs">
                                    <div className="flex items-center gap-2">
                                        <CreditCard className="text-primary size-5" />
                                        <h2 className="text-sm font-bold">Instruksi Pembayaran</h2>
                                    </div>

                                    {/* Subtotal & Total */}
                                    <div className="border-border/60 mt-4 space-y-2 border-y py-3 text-xs">
                                        {membership.discount_amount && Number(membership.discount_amount) > 0 ? (
                                            <>
                                                <div className="flex justify-between text-muted-foreground">
                                                    <span>Subtotal</span>
                                                    <span>
                                                        Rp {Number(membership.subtotal ?? (membership.amount + Number(membership.discount_amount))).toLocaleString('id-ID')}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between font-medium text-emerald-600 dark:text-emerald-400">
                                                    <span>Diskon Membership ({membership.discount_value ?? 0}%)</span>
                                                    <span>
                                                        - Rp {Number(membership.discount_amount).toLocaleString('id-ID')}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between border-t border-border/50 pt-1.5 font-bold text-foreground">
                                                    <span>Jumlah Tagihan</span>
                                                    <span className="text-primary text-sm font-black">
                                                        Rp {membership.amount.toLocaleString('id-ID')}
                                                    </span>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Jumlah Tagihan</span>
                                                <span className="font-semibold">
                                                    Rp {membership.amount.toLocaleString('id-ID')}
                                                </span>
                                            </div>
                                        )}
                                        {membership.payment_deadline && (
                                            <div className="flex justify-between text-amber-700 dark:text-amber-300">
                                                <span>Batas Waktu</span>
                                                <span className="font-semibold">
                                                    {new Date(membership.payment_deadline).toLocaleString('id-ID', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Kode Validasi */}
                                    <div className="bg-primary/5 border-primary/20 mt-4 rounded-xl border p-3.5 text-xs">
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground text-[11px] font-semibold uppercase">
                                                Kode Validasi
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => copyToClipboard(String(membership.validation_code), 'Kode validasi')}
                                                className="text-primary hover:text-primary/80 inline-flex items-center gap-1 font-bold"
                                            >
                                                {copiedAccount === String(membership.validation_code) ? (
                                                    <Check className="size-3 text-emerald-600" />
                                                ) : (
                                                    <Copy className="size-3" />
                                                )}
                                                Salin
                                            </button>
                                        </div>
                                        <p className="mt-1 text-xl font-black tracking-widest text-primary">
                                            {membership.validation_code}
                                        </p>
                                        <p className="text-muted-foreground mt-1 text-[11px]">
                                            Sertakan kode ini pada berita/keterangan transfer.
                                        </p>
                                    </div>

                                    {/* Rekening Tujuan */}
                                    <div className="mt-4 space-y-2">
                                        <p className="text-muted-foreground text-[11px] font-bold uppercase tracking-wider">
                                            Rekening Pembayaran
                                        </p>
                                        {bankAccounts.map((bank) => (
                                            <div
                                                key={bank.id}
                                                className="bg-muted/30 border-border/60 rounded-xl border p-3 text-xs"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="font-bold">{bank.bank_name}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => copyToClipboard(bank.account_number, 'Nomor rekening')}
                                                        className="text-primary hover:text-primary/80 inline-flex items-center gap-1 text-[11px] font-semibold"
                                                    >
                                                        {copiedAccount === bank.account_number ? (
                                                            <Check className="size-3 text-emerald-600" />
                                                        ) : (
                                                            <Copy className="size-3" />
                                                        )}
                                                        Salin
                                                    </button>
                                                </div>
                                                <p className="mt-1 font-mono font-bold text-foreground">
                                                    {bank.account_number}
                                                </p>
                                                <p className="text-muted-foreground text-[11px]">
                                                    a.n. {bank.account_name}
                                                </p>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Konfirmasi Button */}
                                    <Button
                                        type="button"
                                        disabled={submittingPayment}
                                        onClick={handleConfirmPayment}
                                        className="mt-5 h-11 w-full rounded-xl font-bold"
                                    >
                                        {submittingPayment ? 'Memproses...' : 'Saya Sudah Transfer'}
                                    </Button>
                                </section>
                            )}

                            {/* CASE 2: Menunggu Validasi Admin */}
                            {isPendingValidation && (
                                <section className="border-border/70 bg-card rounded-2xl border p-5 shadow-xs">
                                    <div className="flex items-start gap-3">
                                        <CheckCircle2 className="text-primary mt-0.5 size-5 shrink-0" />
                                        <div className="space-y-1">
                                            <h2 className="text-sm font-bold">Pembayaran Sedang Diverifikasi</h2>
                                            <p className="text-muted-foreground text-xs leading-relaxed">
                                                Konfirmasi pembayaran Anda telah kami terima. Admin akan memverifikasi mutasi bank dalam 1x24 jam.
                                            </p>
                                        </div>
                                    </div>
                                </section>
                            )}

                            {/* CASE 3: Membership Aktif / Expired */}
                            {(isActive || membership.status === 'expired') && (
                                <section className="border-border/70 bg-card rounded-2xl border p-5 shadow-xs space-y-4">
                                    <div className="space-y-1">
                                        <h2 className="text-sm font-bold">Status Membership</h2>
                                        <p className="text-muted-foreground text-xs">
                                            {isActive
                                                ? 'Membership Anda aktif dan sesi bermain telah dikonfirmasi.'
                                                : 'Masa aktif membership Anda telah berakhir.'}
                                        </p>
                                    </div>

                                    <div className="border-border/60 bg-muted/20 rounded-xl border p-3.5 text-xs space-y-1.5">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Pembayaran</span>
                                            <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                                Lunas
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Periode Aktif</span>
                                            <span className="font-semibold">30 Hari</span>
                                        </div>
                                        {membership.ends_at && (
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Berlaku Hingga</span>
                                                <span className="font-semibold">{formatDate(membership.ends_at)}</span>
                                            </div>
                                        )}
                                    </div>

                                    {canRenew ? (
                                        <div className="space-y-2">
                                            <div className="bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-200 rounded-xl border p-3 text-xs leading-relaxed">
                                                <p className="font-bold">Masa Perpanjangan Dibuka</p>
                                                <p className="opacity-90 mt-0.5">
                                                    {membership.status === 'expired'
                                                        ? 'Membership sudah berakhir. Perpanjang sekarang untuk melanjutkan jadwal rutin Anda.'
                                                        : `Masa aktif tersisa ${daysLeft === 0 ? 'hari ini' : `${daysLeft} hari lagi`}. Perpanjang sekarang untuk mengamankan slot periode berikutnya.`}
                                                </p>
                                            </div>
                                            <Button
                                                type="button"
                                                disabled={renewing}
                                                onClick={handleRenew}
                                                className="h-10 w-full rounded-xl font-bold"
                                            >
                                                <RefreshCw className={`mr-2 size-4 ${renewing ? 'animate-spin' : ''}`} />
                                                {renewing ? 'Memproses...' : 'Perpanjang Membership'}
                                            </Button>
                                        </div>
                                    ) : (
                                        isActive && (
                                            <div className="space-y-2">
                                                <div className="bg-muted/40 border-border/70 text-muted-foreground rounded-xl border p-3 text-xs leading-relaxed">
                                                    <p className="font-semibold text-foreground">Perpanjangan Belum Dibuka</p>
                                                    <p className="mt-0.5">
                                                        Membership hanya dapat diperpanjang mulai 1 minggu sebelum masa aktif berakhir
                                                        {renewalOpensDate ? ` (${formatDate(renewalOpensDate)})` : ''}.
                                                    </p>
                                                </div>
                                                <Button
                                                    type="button"
                                                    disabled
                                                    className="h-10 w-full rounded-xl font-bold opacity-50 cursor-not-allowed"
                                                >
                                                    <RefreshCw className="mr-2 size-4" />
                                                    Perpanjang Membership
                                                </Button>
                                            </div>
                                        )
                                    )}
                                </section>
                            )}
                        </aside>
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
}
