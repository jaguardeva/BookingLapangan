import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import {
    AlertCircle,
    ArrowLeft,
    Calendar,
    CalendarDays,
    Check,
    CheckCircle2,
    Clock,
    Copy,
    CreditCard,
    FileText,
    Mail,
    Phone,
    Printer,
    RefreshCw,
    Trophy,
    User as UserIcon,
    XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { PublicLayout } from '@/layouts/public-layout';
import { formatDateIndonesia, formatDateTimeIndonesia } from '@/lib/locale';
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
    approved: 'Terkonfirmasi (Lunas)',
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
    const { auth, name: appName = 'SportBooking' } = usePage<{ auth?: { user?: any }; name?: string }>().props;
    const [copiedAccount, setCopiedAccount] = useState<string | null>(null);
    const [submittingPayment, setSubmittingPayment] = useState(false);
    const [renewing, setRenewing] = useState(false);

    const memberUser = membership.user ?? auth?.user;
    const primaryReservation = membership.reservations?.[0];
    const lapanganName = primaryReservation?.lapangan?.name ?? 'Membership Lapangan';
    const categoryName = primaryReservation?.lapangan?.category?.name;

    const isPendingPayment = membership.payment_status === 'pending';
    const isPendingValidation = membership.payment_status === 'pending_validation';
    const isPaid = membership.payment_status === 'approved' || membership.status === 'active';
    const isExpired = membership.status === 'expired';
    const isCancelled = membership.payment_status === 'cancelled' || membership.status === 'cancelled';
    const isRejected = membership.payment_status === 'rejected' || membership.status === 'rejected';

    const now = new Date();
    const endsAtDate = membership.ends_at ? new Date(membership.ends_at) : null;
    const diffDays = endsAtDate
        ? Math.ceil((endsAtDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : null;
    const daysLeft = diffDays !== null ? Math.max(0, diffDays) : null;
    const isWithinRenewalWindow = daysLeft !== null && daysLeft <= 7;
    const canRenew = membership.status === 'expired' || (membership.status === 'active' && isWithinRenewalWindow);
    const hasDiscount = Number(membership.discount_amount) > 0;

    const invoiceSubtotal = Number(membership.subtotal ?? (membership.amount + Number(membership.discount_amount || 0)));

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
            <Head title={`Invoice Membership #${membership.id.substring(0, 8)} - ${lapanganName}`} />

            {/* Breadcrumb Strip (hidden on print) */}
            <div className="border-border/60 bg-muted/20 text-muted-foreground border-b py-3 text-xs no-print print:hidden">
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

            <div className="min-h-screen min-w-0 py-4 sm:py-8 print:min-h-0 print:py-0">
                <div className="public-container min-w-0 w-full max-w-4xl space-y-5 print:m-0 print:max-w-none print:p-0 print:space-y-5 sm:space-y-6">
                    {/* Back Link + Print Button (hidden on print) */}
                    <div className="flex flex-wrap items-center justify-between gap-3 no-print print:hidden">
                        <Link
                            href={membershipIndex.url()}
                            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-xs font-semibold transition-colors"
                        >
                            <ArrowLeft className="size-3.5" /> Kembali ke Daftar Membership
                        </Link>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.print()}
                            className="rounded-xl text-xs font-semibold shadow-xs hover:bg-muted"
                        >
                            <Printer className="mr-1.5 size-3.5 text-primary" /> Cetak / Simpan PDF
                        </Button>
                    </div>

                    {/* MAIN INVOICE SHEET (Struktur Faktur Standar A4) */}
                    <div className="border-border/80 bg-card min-w-0 rounded-2xl border p-4 shadow-lg sm:p-9 print:border-none print:bg-transparent print:p-0 print:shadow-none space-y-5 print:space-y-5 sm:space-y-6">

                        {/* 1. KOP SURAT & INVOICE HEADER */}
                        <div className="border-b-2 border-primary/30 pb-5 print:pb-4">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                {/* Logo & Venue Identity */}
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
                                            Layanan Membership Bulanan & Reservasi Rutin
                                        </p>
                                    </div>
                                </div>

                                {/* Metadata Invoice & Stamp Box */}
                                <div className="flex min-w-0 flex-col items-start gap-1.5 sm:items-end">
                                    <div className="min-w-0 max-w-full text-left sm:text-right">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-primary print:text-slate-800">
                                            Bukti Membership Resmi
                                        </span>
                                        <h2 className="break-all font-mono text-lg font-black tracking-tight text-foreground sm:text-2xl print:text-xl">
                                            #MBR-{membership.id.substring(0, 8).toUpperCase()}
                                        </h2>
                                        <p className="text-[11px] text-muted-foreground print:text-slate-600">
                                            Dibuat: {formatDateTimeIndonesia(membership.created_at || new Date())} WIB
                                        </p>
                                    </div>

                                    {/* Cap Stempel Status */}
                                    <div className="mt-1">
                                        {isPaid && (
                                            <div className="invoice-stamp-paid px-3 py-1 rounded text-xs font-black inline-flex items-center gap-1">
                                                <CheckCircle2 className="size-3.5" /> LUNAS / MEMBER AKTIF
                                            </div>
                                        )}
                                        {isPendingPayment && (
                                            <div className="invoice-stamp-pending px-3 py-1 rounded text-xs font-bold inline-flex items-center gap-1">
                                                <Clock className="size-3.5" /> MENUNGGU PEMBAYARAN
                                            </div>
                                        )}
                                        {isPendingValidation && (
                                            <div className="border-2 border-sky-600 bg-sky-50 text-sky-800 px-3 py-1 rounded text-xs font-bold inline-flex items-center gap-1">
                                                <Clock className="size-3.5" /> MENUNGGU VALIDASI
                                            </div>
                                        )}
                                        {isExpired && (
                                            <div className="invoice-stamp-cancelled px-3 py-1 rounded text-xs font-black inline-flex items-center gap-1">
                                                <Clock className="size-3.5" /> KEDALUWARSA
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

                        {/* 2. DUA KOLOM: DATA MEMBER & INFORMASI PAKET MEMBERSHIP */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs print:grid-cols-2 print:gap-4 print-avoid-break">
                            {/* Ditagihkan Kepada (Member Identity) */}
                            <div className="rounded-xl border border-border/80 bg-muted/20 p-4 space-y-2.5 print:border-slate-300 print:bg-slate-50/50">
                                <div className="flex items-center gap-1.5 border-b border-border/60 pb-1.5 text-foreground font-bold tracking-wider uppercase text-[11px] print:border-slate-200">
                                    <UserIcon className="size-3.5 text-primary print:text-slate-700" />
                                    <span>Ditagihkan Kepada (Member)</span>
                                </div>
                                <div className="space-y-1.5 text-muted-foreground print:text-slate-700">
                                    <div className="flex min-w-0 flex-wrap items-start justify-between gap-x-2 gap-y-1 sm:justify-start sm:gap-2">
                                        <span className="w-24 text-muted-foreground print:text-slate-500">Nama:</span>
                                        <span className="font-bold text-foreground print:text-slate-900">{memberUser?.name || 'Member Terdaftar'}</span>
                                    </div>
                                    <div className="flex min-w-0 flex-wrap items-start justify-between gap-x-2 gap-y-1 sm:justify-start sm:gap-2">
                                        <span className="w-24 text-muted-foreground print:text-slate-500">No. Telepon:</span>
                                        <span className="font-semibold text-foreground print:text-slate-900">{memberUser?.phone || '-'}</span>
                                    </div>
                                    <div className="flex min-w-0 flex-wrap items-start justify-between gap-x-2 gap-y-1 sm:justify-start sm:gap-2">
                                        <span className="w-24 text-muted-foreground print:text-slate-500">Email:</span>
                                        <span className="text-foreground print:text-slate-900">{memberUser?.email || '-'}</span>
                                    </div>
                                    <div className="flex min-w-0 flex-wrap items-start justify-between gap-x-2 gap-y-1 sm:justify-start sm:gap-2">
                                        <span className="w-24 text-muted-foreground print:text-slate-500">ID Member:</span>
                                        <span className="font-mono text-foreground print:text-slate-900">
                                            #{memberUser?.id ? String(memberUser.id).substring(0, 8).toUpperCase() : (membership.user_id ? String(membership.user_id).substring(0, 8).toUpperCase() : '-')}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Detail Paket Membership & Periode */}
                            <div className="rounded-xl border border-border/80 bg-muted/20 p-4 space-y-2.5 print:border-slate-300 print:bg-slate-50/50">
                                <div className="flex items-center gap-1.5 border-b border-border/60 pb-1.5 text-foreground font-bold tracking-wider uppercase text-[11px] print:border-slate-200">
                                    <FileText className="size-3.5 text-primary print:text-slate-700" />
                                    <span>Detail Paket & Periode</span>
                                </div>
                                <div className="space-y-1.5 text-muted-foreground print:text-slate-700">
                                    <div className="flex min-w-0 flex-wrap items-start justify-between gap-x-2 gap-y-1 sm:justify-start sm:gap-2">
                                        <span className="w-28 text-muted-foreground print:text-slate-500">Layanan:</span>
                                        <span className="font-semibold text-foreground print:text-slate-900">Membership Rutin 30 Hari</span>
                                    </div>
                                    <div className="flex min-w-0 flex-wrap items-start justify-between gap-x-2 gap-y-1 sm:justify-start sm:gap-2">
                                        <span className="w-28 text-muted-foreground print:text-slate-500">Lapangan:</span>
                                        <span className="font-bold text-foreground print:text-slate-900">
                                            {lapanganName} {categoryName ? `(${categoryName})` : ''}
                                        </span>
                                    </div>
                                    <div className="flex min-w-0 flex-wrap items-start justify-between gap-x-2 gap-y-1 sm:justify-start sm:gap-2">
                                        <span className="w-28 text-muted-foreground print:text-slate-500">Periode Aktif:</span>
                                        <span className="font-medium text-foreground print:text-slate-900">
                                            {formatDate(membership.starts_at ?? membership.reservation_start_date)} s/d {formatDate(membership.ends_at)}
                                        </span>
                                    </div>
                                    <div className="flex min-w-0 flex-wrap items-start justify-between gap-x-2 gap-y-1 sm:justify-start sm:gap-2">
                                        <span className="w-28 text-muted-foreground print:text-slate-500">Metode Bayar:</span>
                                        <span className="font-semibold uppercase text-foreground print:text-slate-900">
                                            {membership.payment_method === 'transfer' ? 'Transfer Bank' : 'Transfer'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Alert Penolakan jika Ada */}
                        {membership.rejection_reason && (
                            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-700 print:border-rose-400 print:bg-rose-50 print-avoid-break">
                                <p className="flex items-center gap-1.5 text-sm font-bold">
                                    <AlertCircle className="size-4" /> Alasan Penolakan Kasir:
                                </p>
                                <p className="mt-1 leading-relaxed">{membership.rejection_reason}</p>
                            </div>
                        )}

                        {/* 3. TABEL ITEM DETAIL PAKET & JADWAL MINGGUAN */}
                        <div className="overflow-hidden rounded-xl border border-border/80 print:border-slate-300 print-avoid-break">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                        <tr className="bg-muted/70 text-foreground font-bold border-b border-border/80 print:bg-slate-100 print:text-slate-900 print:border-slate-300">
                                            <th className="py-3 px-3.5 text-center w-10">No</th>
                                            <th className="py-3 px-3.5">Layanan / Lapangan</th>
                                            <th className="py-3 px-3.5">Jadwal Rutin Mingguan</th>
                                            <th className="py-3 px-3.5 text-center">Durasi</th>
                                            <th className="py-3 px-3.5 text-center">Total Pertemuan</th>
                                            <th className="py-3 px-3.5 text-right">Tarif / Sesi</th>
                                            <th className="py-3 px-3.5 text-right">Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/60 print:divide-slate-200">
                                        {membership.reservations && membership.reservations.length > 0 ? (
                                            membership.reservations.map((res, idx) => {
                                                const occ = res.occurrence_count ?? 4;
                                                const unitPrice = res.price_per_occurrence ?? 0;
                                                const lineSubtotal = unitPrice * occ;
                                                return (
                                                    <tr key={res.id || idx} className="text-foreground hover:bg-muted/30">
                                                        <td className="py-3.5 px-3.5 text-center font-mono text-muted-foreground print:text-slate-600">
                                                            {idx + 1}
                                                        </td>
                                                        <td className="py-3.5 px-3.5">
                                                            <p className="font-bold text-foreground print:text-slate-900">
                                                                Paket 30 Hari - {res.lapangan?.name || lapanganName}
                                                            </p>
                                                            <p className="text-[11px] text-muted-foreground print:text-slate-600">
                                                                Kategori: {res.lapangan?.category?.name || categoryName || 'Olahraga'}
                                                            </p>
                                                        </td>
                                                        <td className="py-3.5 px-3.5">
                                                            <p className="font-semibold text-foreground print:text-slate-900">
                                                                Setiap {weekdays[res.weekday]}
                                                            </p>
                                                            <p className="text-[11px] text-muted-foreground print:text-slate-600">
                                                                Pukul {res.start_time} - {res.end_time} WIB
                                                            </p>
                                                        </td>
                                                        <td className="py-3.5 px-3.5 text-center font-medium">
                                                            {res.duration_hours} Jam
                                                        </td>
                                                        <td className="py-3.5 px-3.5 text-center font-bold text-foreground print:text-slate-900">
                                                            {occ} Sesi
                                                        </td>
                                                        <td className="py-3.5 px-3.5 text-right font-medium text-muted-foreground print:text-slate-700">
                                                            Rp {Number(unitPrice).toLocaleString('id-ID')}
                                                        </td>
                                                        <td className="py-3.5 px-3.5 text-right font-bold text-foreground print:text-slate-900">
                                                            Rp {Number(lineSubtotal).toLocaleString('id-ID')}
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        ) : (
                                            <tr className="text-foreground">
                                                <td className="py-3.5 px-3.5 text-center font-mono text-muted-foreground">1</td>
                                                <td className="py-3.5 px-3.5 font-bold">{lapanganName}</td>
                                                <td className="py-3.5 px-3.5">Jadwal Rutin Membership</td>
                                                <td className="py-3.5 px-3.5 text-center">-</td>
                                                <td className="py-3.5 px-3.5 text-center">4 Sesi</td>
                                                <td className="py-3.5 px-3.5 text-right">-</td>
                                                <td className="py-3.5 px-3.5 text-right font-bold">
                                                    Rp {membership.amount.toLocaleString('id-ID')}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* 4. TABEL RINCIAN SESI BERMAIN 30 HARI (TERJADWAL) */}
                        {membership.bookings && membership.bookings.length > 0 && (
                            <div className="space-y-2 print-avoid-break">
                                <div className="flex flex-wrap items-start justify-between gap-2 text-xs">
                                    <h3 className="font-bold uppercase tracking-wider text-foreground text-[11px] print:text-slate-900 flex items-center gap-1.5">
                                        <CalendarDays className="size-3.5 text-primary print:text-slate-700" />
                                        Daftar Sesi Bermain Terjadwal (30 Hari)
                                    </h3>
                                    <span className="text-muted-foreground text-[11px] print:text-slate-600">
                                        {membership.bookings.length} Sesi Terdaftar
                                    </span>
                                </div>
                                <div className="overflow-hidden rounded-xl border border-border/80 print:border-slate-300">
                                    <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs border-collapse">
                                        <thead>
                                            <tr className="bg-muted/50 text-foreground font-semibold border-b border-border/70 print:bg-slate-100 print:text-slate-900 print:border-slate-300 text-[11px]">
                                                <th className="py-2.5 px-3 text-center w-10">Sesi</th>
                                                <th className="py-2.5 px-3">Hari & Tanggal Main</th>
                                                <th className="py-2.5 px-3">Waktu Main</th>
                                                <th className="py-2.5 px-3">Lapangan</th>
                                                <th className="py-2.5 px-3 text-center">Status Sesi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/50 print:divide-slate-200 text-[11px]">
                                            {membership.bookings.map((b, i) => (
                                                <tr key={b.id || i} className="text-foreground hover:bg-muted/20">
                                                    <td className="py-2 px-3 text-center font-mono text-muted-foreground print:text-slate-600">
                                                        #{i + 1}
                                                    </td>
                                                    <td className="py-2 px-3 font-semibold text-foreground print:text-slate-900">
                                                        {formatDate(b.booking_date)}
                                                    </td>
                                                    <td className="py-2 px-3 text-muted-foreground print:text-slate-700">
                                                        {b.start_time} - {b.end_time} WIB
                                                    </td>
                                                    <td className="py-2 px-3 text-foreground print:text-slate-900">
                                                        {b.lapangan?.name || lapanganName}
                                                    </td>
                                                    <td className="py-2 px-3 text-center">
                                                        <span className="font-semibold text-emerald-700 dark:text-emerald-400 print:text-emerald-900">
                                                            Terkonfirmasi
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 5. KALKULASI FINANSIAL & INSTRUKSI PEMBAYARAN */}
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 pt-1 print:grid-cols-2 print:gap-6 print-avoid-break">
                            {/* Kolom Kiri: Informasi Rekening / Catatan */}
                            <div className="space-y-3">
                                <div className="rounded-xl border border-border/80 bg-muted/20 p-4 space-y-2 text-xs print:border-slate-300 print:bg-slate-50/50">
                                    <p className="font-bold uppercase tracking-wider text-foreground text-[11px] print:text-slate-900">
                                        Informasi Pembayaran
                                    </p>
                                    <div className="space-y-1.5 text-muted-foreground print:text-slate-700 leading-relaxed">
                                        <p>
                                            Pembayaran Paket Membership via Transfer Bank resmi pengelola arena:
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
                                        {isPendingPayment && membership.validation_code && (
                                            <p className="text-[11px] text-primary font-semibold pt-1 print:text-slate-800">
                                                *Sertakan Kode Validasi transfer: <strong>{membership.validation_code}</strong>
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Kolom Kanan: Rincian Angka Finansial */}
                            <div className="space-y-2 text-xs">
                                <div className="rounded-xl border border-border/80 bg-card p-4 space-y-2.5 print:border-slate-300 print:bg-slate-50/30">
                                    <div className="flex flex-col justify-between gap-1 text-muted-foreground sm:flex-row sm:items-baseline print:text-slate-700">
                                        <span>Subtotal Paket Membership</span>
                                        <span className="font-semibold text-foreground print:text-slate-900">
                                            Rp {invoiceSubtotal.toLocaleString('id-ID')}
                                        </span>
                                    </div>

                                    {hasDiscount && (
                                        <div className="flex flex-col justify-between gap-1 font-medium text-emerald-600 sm:flex-row sm:items-baseline dark:text-emerald-400 print:text-emerald-800">
                                            <span>Diskon Membership ({membership.discount_value ?? 0}%)</span>
                                            <span>- Rp {Number(membership.discount_amount).toLocaleString('id-ID')}</span>
                                        </div>
                                    )}

                                    {membership.payment_method === 'transfer' && membership.validation_code > 0 && isPendingPayment && (
                                        <div className="flex flex-col justify-between gap-1 text-muted-foreground sm:flex-row sm:items-baseline print:text-slate-700">
                                            <span className="flex items-center gap-1">
                                                Kode Unik Transfer
                                                <span className="rounded bg-muted px-1.5 py-0.2 text-[10px] print:hidden">
                                                    Otomatis
                                                </span>
                                            </span>
                                            <span className="font-medium text-foreground print:text-slate-900">
                                                + Rp {membership.validation_code}
                                            </span>
                                        </div>
                                    )}

                                    <div className="border-t-2 border-border/80 flex flex-col gap-1 pt-3 text-sm font-black sm:flex-row sm:items-center sm:justify-between print:border-slate-300">
                                        <span className="text-foreground print:text-slate-900">TOTAL TAGIHAN:</span>
                                        <span className="text-right text-xl font-extrabold text-primary print:text-slate-950">
                                            Rp {Number(membership.amount).toLocaleString('id-ID')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 6. CATATAN KEANGGOTAAN */}
                        <div className="rounded-xl border border-border/60 bg-muted/20 p-3.5 text-xs text-muted-foreground print:border-slate-300 print:bg-slate-50/50 print:text-slate-700 print-avoid-break">
                            <p className="font-bold text-foreground text-[11px] print:text-slate-900">
                                Catatan Keanggotaan:
                            </p>
                            <p className="text-[11px] mt-0.5 leading-relaxed">
                                Invoice membership ini berlaku selama 30 hari kalender. Jadwal mingguan Anda telah terkunci secara otomatis. Tunjukkan invoice ini kepada petugas kasir saat kedatangan untuk setiap sesi bermain.
                            </p>
                        </div>

                        {/* 7. FOOTER CETAK RESMI */}
                        <div className="text-center text-[10px] text-muted-foreground print:text-slate-500 pt-2 border-t border-border/60 print:border-slate-200">
                            <p>
                                Terima kasih atas keanggotaan Anda di {appName}. Dokumen ini diterbitkan secara resmi sebagai bukti sah keanggotaan dan reservasi membership.
                            </p>
                        </div>
                    </div>

                    {/* 9. INTERACTIVE ACTION PANELS (WEB ONLY: NO-PRINT) */}
                    <div className="no-print space-y-5 print:hidden">
                        {/* CASE: ACTIVE MEMBERSHIP / RENEWAL ALERT */}
                        {membership.status === 'active' && daysLeft !== null && (
                            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
                                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                                    <div className="space-y-1">
                                        <h3 className="text-foreground text-sm font-bold flex items-center gap-2">
                                            <Calendar className="size-4 text-primary" /> Status Masa Aktif Membership
                                        </h3>
                                        <p className="text-muted-foreground text-xs leading-relaxed">
                                            Membership Anda aktif hingga{' '}
                                            <strong className="text-foreground">{formatDate(membership.ends_at)}</strong>{' '}
                                            ({daysLeft} hari tersisa).
                                            {isWithinRenewalWindow && ' Masa perpanjangan telah dibuka! Anda dapat memperpanjang paket sekarang.'}
                                        </p>
                                    </div>

                                    {canRenew && (
                                        <Button
                                            type="button"
                                            onClick={handleRenew}
                                            disabled={renewing}
                                            className="h-9 w-full rounded-xl bg-primary px-5 font-bold text-primary-foreground shadow-sm hover:bg-primary/90 sm:w-auto"
                                        >
                                            <RefreshCw className={`mr-1.5 size-3.5 ${renewing ? 'animate-spin' : ''}`} />
                                            {renewing ? 'Memproses...' : 'Perpanjang Membership'}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* CASE: PENDING PAYMENT INSTRUCTIONS */}
                        {isPendingPayment && (
                            <div className="space-y-4 rounded-2xl border border-primary/25 bg-primary/5 p-5">
                                <div className="flex items-center gap-2">
                                    <CreditCard className="size-5 text-primary" />
                                    <h3 className="text-foreground text-sm font-bold">
                                        Instruksi Pembayaran Transfer Bank
                                    </h3>
                                </div>

                                <p className="text-muted-foreground text-xs leading-relaxed">
                                    Silakan transfer ke salah satu rekening resmi kami di bawah ini dengan nominal tepat{' '}
                                    <strong className="text-primary font-bold">
                                        Rp {membership.amount.toLocaleString('id-ID')}
                                    </strong>.
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
                                                    onClick={() => copyToClipboard(b.account_number, b.bank_name)}
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

                                {/* Confirmation Button */}
                                <div className="bg-card border-border/80 mt-2 flex flex-col justify-between gap-3 rounded-xl border p-4 shadow-xs sm:flex-row sm:items-center">
                                    <div className="space-y-0.5">
                                        <h4 className="text-foreground text-xs font-bold">
                                            Konfirmasi Pembayaran
                                        </h4>
                                        <p className="text-muted-foreground text-xs">
                                            Sudah melakukan transfer sesuai nominal di atas? Klik tombol di samping untuk memberi tahu kasir.
                                        </p>
                                    </div>
                                    <Button
                                        type="button"
                                        onClick={handleConfirmPayment}
                                        disabled={submittingPayment}
                                        className="h-9 w-full rounded-xl bg-primary px-5 font-bold text-primary-foreground shadow-sm hover:bg-primary/90 sm:w-auto"
                                    >
                                        {submittingPayment ? 'Mengirim...' : 'Saya Sudah Transfer'}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
}
