import { Head, Link } from '@inertiajs/react';
import { AlertCircle, ArrowRight, CalendarDays, CalendarPlus, Clock, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PublicLayout } from '@/layouts/public-layout';
import { formatDateIndonesia } from '@/lib/locale';
import MembershipController from '@/actions/App/Http/Controllers/MembershipController';
import { index as lapanganIndex } from '@/routes/lapangan';
import type { Membership } from '@/types/booking';

interface Props {
    membership: Membership | null;
    memberships: { data: Membership[] };
    activeMemberships: Membership[];
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

export default function MembershipIndex({ memberships, activeMemberships }: Props) {
    const activeCount = activeMemberships.length;
    const now = new Date();

    // Check for any pending payment membership needing attention
    const pendingMembership = memberships.data.find(
        (m) => m.payment_status === 'pending' || m.payment_status === 'pending_validation',
    );

    // Find nearest expiring membership
    const activeWithEndsAt = activeMemberships.filter((m) => Boolean(m.ends_at));
    const sortedByNearestExpiry = [...activeWithEndsAt].sort((a, b) => {
        return new Date(a.ends_at!).getTime() - new Date(b.ends_at!).getTime();
    });
    const nearestMembership = sortedByNearestExpiry[0] ?? null;

    const nearestEndsAt = nearestMembership?.ends_at ? new Date(nearestMembership.ends_at) : null;
    const diffDays = nearestEndsAt
        ? Math.ceil((nearestEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : null;
    const daysLeft = diffDays !== null ? Math.max(0, diffDays) : null;

    const isExpiringSoon = daysLeft !== null && daysLeft <= 7;
    const isUrgent = daysLeft !== null && daysLeft <= 3;

    return (
        <PublicLayout>
            <Head title="Membership" />
            <div className="public-container w-full max-w-[1240px] py-8 sm:py-10">
                {/* Header Section */}
                <div className="border-border/60 flex flex-col justify-between gap-4 border-b pb-6 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="text-foreground text-2xl font-black tracking-tight sm:text-3xl">Membership</h1>
                        <p className="text-muted-foreground mt-1 text-sm">
                            Kelola jadwal rutin mingguan dan masa aktif membership Anda.
                        </p>
                    </div>
                    <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground h-10 w-full rounded-xl px-5 text-sm font-bold shadow-xs sm:w-auto">
                        <Link href={lapanganIndex.url()}>
                            <CalendarPlus className="mr-2 size-4" /> Membership Baru
                        </Link>
                    </Button>
                </div>

                <div className="space-y-6 pt-6">
                    {/* Pending Payment Notice Banner */}
                    {pendingMembership && (
                        <div className="border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200 flex flex-col justify-between gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:px-5">
                            <div className="flex items-start gap-3">
                                <Clock className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400" />
                                <div>
                                    <p className="text-sm font-bold">
                                        {pendingMembership.payment_status === 'pending'
                                            ? 'Menunggu Pembayaran Membership'
                                            : 'Pembayaran Sedang Diverifikasi'}
                                    </p>
                                    <p className="mt-0.5 text-xs text-amber-800/80 dark:text-amber-300/80">
                                        {pendingMembership.payment_status === 'pending'
                                            ? 'Selesaikan pembayaran sebelum batas waktu agar jadwal tetap tersimpan.'
                                            : 'Admin sedang memeriksa bukti pembayaran Anda.'}
                                    </p>
                                </div>
                            </div>
                            <Button asChild size="sm" variant="outline" className="border-amber-500/40 bg-card hover:bg-muted shrink-0 text-xs font-bold shadow-2xs">
                                <Link href={MembershipController.show.url(pendingMembership.id)}>
                                    Lihat Invoice <ArrowRight className="ml-1.5 size-3.5" />
                                </Link>
                            </Button>
                        </div>
                    )}

                    {/* Expiration / Renewal Notification Banner (Within 1 week before expiration) */}
                    {isExpiringSoon && nearestMembership && (
                        <div
                            className={`flex flex-col justify-between gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:px-5 ${
                                isUrgent
                                    ? 'border-rose-500/40 bg-rose-500/10 text-rose-950 dark:text-rose-100'
                                    : 'border-amber-500/40 bg-amber-500/10 text-amber-950 dark:text-amber-100'
                            }`}
                        >
                            <div className="flex items-start gap-3">
                                <AlertCircle className={`mt-0.5 size-5 shrink-0 ${isUrgent ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'}`} />
                                <div>
                                    <p className="text-sm font-bold">
                                        Perpanjangan Membership Tersedia ({daysLeft === 0 ? 'Hari ini berakhir' : `${daysLeft} hari lagi`})
                                    </p>
                                    <p className="mt-0.5 text-xs opacity-90">
                                        Masa aktif membership Anda untuk {nearestMembership.reservations?.[0]?.lapangan?.name ?? 'lapangan'} akan berakhir pada {formatDate(nearestMembership.ends_at)}. Perpanjang sekarang untuk mengamankan slot jadwal rutin periode berikutnya.
                                    </p>
                                </div>
                            </div>
                            <Button asChild size="sm" className="shrink-0 text-xs font-bold shadow-2xs">
                                <Link href={MembershipController.show.url(nearestMembership.id)}>
                                    Perpanjang Sekarang <ArrowRight className="ml-1.5 size-3.5" />
                                </Link>
                            </Button>
                        </div>
                    )}

                    {/* Active Memberships Section */}
                    {activeCount > 0 ? (
                        <section className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-base font-bold tracking-tight">Membership Aktif ({activeCount})</h2>
                            </div>

                            <div className="grid gap-3 sm:gap-4">
                                {activeMemberships.map((item) => {
                                    const primaryReservation = item.reservations?.[0];
                                    const lapanganName = primaryReservation?.lapangan?.name ?? 'Lapangan Olahraga';
                                    const categoryName = primaryReservation?.lapangan?.category?.name;
                                    const itemDaysLeft = item.ends_at
                                        ? Math.max(0, Math.ceil((new Date(item.ends_at).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
                                        : null;
                                    const itemCanRenew = itemDaysLeft !== null && itemDaysLeft <= 7;
                                    const renewalOpensDate = item.ends_at
                                        ? new Date(new Date(item.ends_at).getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
                                        : null;

                                    return (
                                        <article
                                            key={item.id}
                                            className="border-border/70 bg-card hover:border-border transition-all rounded-2xl border p-5 shadow-xs"
                                        >
                                            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                                                <div className="space-y-1.5">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <h3 className="text-base font-bold text-foreground">{lapanganName}</h3>
                                                        {categoryName && (
                                                            <Badge variant="secondary" className="text-[11px] font-semibold">
                                                                {categoryName}
                                                            </Badge>
                                                        )}
                                                        <Badge variant={statusVariant(item.status)} className="text-[11px] font-semibold">
                                                            {statusLabels[item.status] ?? item.status}
                                                        </Badge>
                                                        {itemCanRenew && (
                                                            <Badge
                                                                variant="outline"
                                                                className="border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold"
                                                            >
                                                                Dapat Diperpanjang
                                                            </Badge>
                                                        )}
                                                    </div>

                                                    {/* Routine Schedule */}
                                                    <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                                                        {item.reservations?.map((res) => (
                                                            <span key={res.id} className="inline-flex items-center gap-1.5 font-medium">
                                                                <CalendarDays className="text-primary size-3.5" />
                                                                Setiap {weekdays[res.weekday]} · {res.start_time} - {res.end_time} WIB
                                                            </span>
                                                        ))}
                                                    </div>

                                                    {/* Validity Period & Renewal Open Date */}
                                                    <p className="text-muted-foreground text-xs">
                                                        Berlaku hingga <span className="font-semibold text-foreground">{formatDate(item.ends_at)}</span>
                                                        {itemCanRenew ? (
                                                            <span className="text-emerald-700 dark:text-emerald-400 font-semibold ml-1.5">
                                                                · {itemDaysLeft === 0 ? 'Berakhir hari ini' : `${itemDaysLeft} hari lagi`}
                                                            </span>
                                                        ) : renewalOpensDate ? (
                                                            <span className="opacity-75 ml-1.5">
                                                                · Perpanjangan dibuka {formatDate(renewalOpensDate)}
                                                            </span>
                                                        ) : null}
                                                    </p>
                                                </div>

                                                <div className="flex shrink-0 items-center gap-2">
                                                    {itemCanRenew && (
                                                        <Button asChild size="sm" className="font-bold shadow-2xs">
                                                            <Link href={MembershipController.show.url(item.id)}>
                                                                Perpanjang
                                                            </Link>
                                                        </Button>
                                                    )}
                                                    <Button asChild variant="outline" size="sm" className="font-bold shadow-2xs">
                                                        <Link href={MembershipController.show.url(item.id)}>
                                                            Lihat Detail <ExternalLink className="ml-1.5 size-3.5" />
                                                        </Link>
                                                    </Button>
                                                </div>
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        </section>
                    ) : (
                        /* Empty State (when user has no active memberships) */
                        <div className="border-border/70 bg-card/60 rounded-3xl border border-dashed p-10 text-center shadow-xs sm:p-14">
                            <div className="bg-primary/10 text-primary mx-auto flex size-12 items-center justify-center rounded-2xl">
                                <CalendarDays className="size-6" />
                            </div>
                            <h2 className="mt-4 text-lg font-bold">Belum Ada Membership Aktif</h2>
                            <p className="text-muted-foreground mx-auto mt-1.5 max-w-sm text-sm">
                                Amankan slot bermain rutin Anda setiap minggu dengan harga lebih hemat dan tanpa repot booking manual.
                            </p>
                            <Button asChild className="mt-6 rounded-xl font-bold">
                                <Link href={lapanganIndex.url()}>
                                    Pilih Lapangan & Jadwal <ArrowRight className="ml-1.5 size-4" />
                                </Link>
                            </Button>
                        </div>
                    )}

                    {/* History Section (Compact & Essential) */}
                    {memberships.data.length > 0 && (
                        <section className="border-border/70 bg-card rounded-2xl border p-5 shadow-xs sm:p-6">
                            <h2 className="text-sm font-bold tracking-tight uppercase tracking-wider text-muted-foreground">
                                Riwayat Membership
                            </h2>

                            <div className="divide-border/50 mt-3 divide-y text-sm">
                                {memberships.data.map((item) => {
                                    const primaryRes = item.reservations?.[0];
                                    const fieldName = primaryRes?.lapangan?.name ?? 'Lapangan';

                                    return (
                                        <div
                                            key={item.id}
                                            className="flex flex-wrap items-center justify-between gap-3 py-3.5 first:pt-2 last:pb-0"
                                        >
                                            <div className="space-y-0.5">
                                                <p className="font-bold text-foreground">
                                                    {fieldName} · {formatDate(item.starts_at ?? item.reservation_start_date)}
                                                </p>
                                                <p className="text-muted-foreground text-xs">
                                                    Rp {item.amount.toLocaleString('id-ID')} · {item.bookings_count ?? 0} sesi bermain
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <Badge variant={statusVariant(item.status)} className="text-[11px]">
                                                    {statusLabels[item.status] ?? item.status}
                                                </Badge>
                                                <Button asChild variant="ghost" size="sm" className="h-8 px-2 text-xs font-bold">
                                                    <Link href={MembershipController.show.url(item.id)}>
                                                        Detail <ArrowRight className="ml-1 size-3" />
                                                    </Link>
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    )}
                </div>
            </div>
        </PublicLayout>
    );
}
