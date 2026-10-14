import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, Check, CircleX, X } from 'lucide-react';
import AdminLayout from '@/layouts/admin-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import membershipRoutes, { approve, cancel, reject } from '@/actions/App/Http/Controllers/Admin/MembershipManagementController';
import type { Membership } from '@/types/booking';

type Props = { membership: Membership };

const weekdays = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

function formatDate(date?: string | null): string {
    if (!date) return '-';

    return new Date(`${date.slice(0, 10)}T00:00:00`).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}

function formatDateTime(date?: string | null): string {
    if (!date) return '-';

    return new Date(date).toLocaleString('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
    });
}

function formatMoney(value?: number | null): string {
    return `Rp ${Number(value ?? 0).toLocaleString('id-ID')}`;
}

function statusLabel(value?: string | null): string {
    return ({
        pending: 'Menunggu',
        pending_validation: 'Perlu Validasi',
        active: 'Aktif',
        approved: 'Disetujui',
        expired: 'Kedaluwarsa',
        rejected: 'Ditolak',
        cancelled: 'Dibatalkan',
    } as Record<string, string>)[value ?? ''] ?? value ?? '-';
}

export default function MembershipsShow({ membership }: Props) {
    const { auth } = usePage<{ auth: { user?: { role?: string } } }>().props;
    const reasonForm = useForm({ rejection_reason: '' });
    const canApprove = membership.payment_status === 'pending_validation';
    const canReject = membership.status === 'pending' && ['pending', 'pending_validation'].includes(membership.payment_status);
    const canCancel = membership.status === 'active';

    const submitReason = (endpoint: string) => (event: React.FormEvent) => {
        event.preventDefault();
        reasonForm.post(endpoint, { onSuccess: () => reasonForm.reset() });
    };

    return (
        <AdminLayout breadcrumbs={[
            { title: 'Membership', href: membershipRoutes.index.url() },
            { title: 'Detail', href: membershipRoutes.show.url(membership.id) },
        ]}>
            <Head title={`Membership ${membership.id}`} />
            <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <Button variant="ghost" size="sm" asChild className="mb-2 -ml-3">
                            <Link href={membershipRoutes.index.url()}><ArrowLeft className="size-4" />Kembali ke Membership</Link>
                        </Button>
                        <h1 className="text-foreground text-2xl font-bold tracking-tight">Detail Membership</h1>
                        <p className="text-muted-foreground mt-1 font-mono text-xs">{membership.id}</p>
                    </div>
                    <div className="flex gap-2">
                        <Badge variant={membership.status === 'active' ? 'default' : membership.status === 'rejected' || membership.status === 'cancelled' ? 'destructive' : 'secondary'}>{statusLabel(membership.status)}</Badge>
                        <Badge variant={membership.payment_status === 'approved' ? 'default' : membership.payment_status === 'rejected' || membership.payment_status === 'cancelled' ? 'destructive' : 'secondary'}>{statusLabel(membership.payment_status)}</Badge>
                    </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                    <section className="border-border/80 bg-card rounded-2xl border p-5 shadow-sm lg:col-span-2">
                        <h2 className="font-semibold">Informasi membership</h2>
                        <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
                            <div><p className="text-muted-foreground">Customer</p><p className="font-medium">{membership.user?.name ?? '-'}</p><p className="text-muted-foreground">{membership.user?.email ?? '-'}</p></div>
                            <div><p className="text-muted-foreground">Periode</p><p className="font-medium">{formatDate(membership.starts_at)} – {formatDate(membership.ends_at)}</p></div>
                            <div><p className="text-muted-foreground">Dibuat</p><p className="font-medium">{formatDateTime(membership.created_at)}</p></div>
                            <div><p className="text-muted-foreground">Batas pembayaran</p><p className="font-medium">{formatDateTime(membership.payment_deadline)}</p></div>
                            <div><p className="text-muted-foreground">Subtotal</p><p className="font-medium">{formatMoney(membership.subtotal)}</p></div>
                            <div><p className="text-muted-foreground">Diskon membership</p><p className="font-medium">{membership.discount_value ?? 0}% ({formatMoney(membership.discount_amount)})</p></div>
                            <div><p className="text-muted-foreground">Total akhir</p><p className="text-primary text-lg font-bold">{formatMoney(membership.amount)}</p></div>
                            <div><p className="text-muted-foreground">Validator</p><p className="font-medium">{membership.validator?.name ?? '-'}</p></div>
                        </div>
                        {membership.rejection_reason && <div className="bg-destructive/10 text-destructive mt-5 rounded-xl p-3 text-sm">{membership.rejection_reason}</div>}
                    </section>

                    <section className="border-border/80 bg-card rounded-2xl border p-5 shadow-sm">
                        <h2 className="font-semibold">Aksi membership</h2>
                        {canApprove && <Button className="mt-4 w-full" onClick={() => router.post(approve.url(membership.id))}><Check className="size-4" />Setujui pembayaran</Button>}
                        {canReject && <form onSubmit={submitReason(reject.url(membership.id))} className="mt-4 space-y-3"><Input placeholder="Alasan penolakan" value={reasonForm.data.rejection_reason} onChange={(event) => reasonForm.setData('rejection_reason', event.target.value)} /><Button type="submit" variant="outline" className="w-full" disabled={reasonForm.processing}><X className="size-4" />Tolak pengajuan</Button></form>}
                        {canCancel && <form onSubmit={submitReason(cancel.url(membership.id))} className="mt-4 space-y-3"><Input placeholder="Alasan pembatalan" value={reasonForm.data.rejection_reason} onChange={(event) => reasonForm.setData('rejection_reason', event.target.value)} /><Button type="submit" variant="destructive" className="w-full" disabled={reasonForm.processing}><CircleX className="size-4" />Batalkan membership</Button></form>}
                        {!canApprove && !canReject && !canCancel && <p className="text-muted-foreground mt-4 text-sm">Tidak ada aksi yang tersedia untuk status membership ini.</p>}
                        {auth.user?.role !== 'superadmin' && <p className="text-muted-foreground mt-5 text-xs">Pengaturan diskon global hanya dapat diubah oleh superadmin.</p>}
                    </section>
                </div>

                <section className="border-border/80 bg-card rounded-2xl border p-5 shadow-sm">
                    <h2 className="font-semibold">Jadwal berulang</h2>
                    <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {membership.reservations?.map((reservation) => <div key={reservation.id} className="bg-muted/40 rounded-xl p-4 text-sm"><p className="font-semibold">{reservation.lapangan?.name ?? '-'}</p><p className="text-muted-foreground mt-1">{weekdays[reservation.weekday]} · {reservation.start_time}–{reservation.end_time}</p><p className="text-muted-foreground mt-1">{reservation.occurrence_count ?? 0} occurrence · {formatMoney(reservation.price_per_occurrence)} / sesi</p></div>)}
                    </div>
                </section>

                <section className="border-border/80 bg-card overflow-hidden rounded-2xl border shadow-sm">
                    <div className="border-border/60 border-b p-5"><h2 className="font-semibold">Occurrence booking</h2><p className="text-muted-foreground mt-1 text-sm">Seluruh jadwal yang dibuat oleh membership ini.</p></div>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[820px] text-left text-sm">
                            <thead className="bg-muted/50 text-muted-foreground border-b text-xs uppercase"><tr><th className="px-5 py-3">Tanggal</th><th className="px-5 py-3">Lapangan</th><th className="px-5 py-3">Jam</th><th className="px-5 py-3">Status</th><th className="px-5 py-3 text-right">Total</th></tr></thead>
                            <tbody className="divide-border/40 divide-y">{membership.bookings?.map((booking) => <tr key={booking.id}><td className="px-5 py-3">{formatDate(booking.booking_date)}</td><td className="px-5 py-3">{booking.lapangan?.name ?? '-'}</td><td className="px-5 py-3">{booking.start_time}–{booking.end_time}</td><td className="px-5 py-3"><Badge variant={booking.payment_status === 'approved' ? 'default' : booking.payment_status === 'cancelled' || booking.payment_status === 'rejected' ? 'destructive' : 'secondary'}>{statusLabel(booking.payment_status)}</Badge></td><td className="px-5 py-3 text-right font-medium">{formatMoney(booking.total_price)}</td></tr>)}</tbody>
                        </table>
                    </div>
                </section>
            </div>
        </AdminLayout>
    );
}
