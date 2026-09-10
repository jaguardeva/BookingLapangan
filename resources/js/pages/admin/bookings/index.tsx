import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import {
    Search,
    Filter,
    CheckCircle2,
    XCircle,
    Clock,
    AlertCircle,
    Eye,
    Calendar,
    CreditCard,
    Banknote,
    User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import ConfirmDialog from '@/components/confirm-dialog';
import type { Booking, Lapangan } from '@/types/booking';

interface Props {
    bookings: {
        data: Booking[];
        links: { url: string | null; label: string; active: boolean }[];
        total: number;
    };
    lapangans: Lapangan[];
    filters: {
        search?: string;
        status?: string;
        lapangan_id?: string;
        date?: string;
    };
}

export default function AdminBookingsIndex({
    bookings,
    lapangans = [],
    filters = {},
}: Props) {
    const breadcrumbs = [
        { title: 'Admin Workspace', href: '/admin' },
        { title: 'Validasi & Booking', href: '/admin/bookings' },
    ];

    const [search, setSearch] = useState(typeof filters?.search === 'string' ? filters.search : '');
    const [selectedStatus, setSelectedStatus] = useState(typeof filters?.status === 'string' && filters.status ? filters.status : 'all');
    const [selectedLapangan, setSelectedLapangan] = useState(typeof filters?.lapangan_id === 'string' && filters.lapangan_id ? filters.lapangan_id : 'all');
    const [selectedDate, setSelectedDate] = useState(typeof filters?.date === 'string' ? filters.date : '');

    // State for Confirm Approval Modal
    const [approveBooking, setApproveBooking] = useState<Booking | null>(null);

    // State for Rejection Modal
    const [rejectBooking, setRejectBooking] = useState<Booking | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const applyFilters = (newFilters: Record<string, string>) => {
        const query: Record<string, string> = {
            search,
            status: selectedStatus !== 'all' ? selectedStatus : '',
            lapangan_id: selectedLapangan !== 'all' ? selectedLapangan : '',
            date: selectedDate,
            ...newFilters,
        };

        Object.keys(query).forEach((k) => {
            if (!query[k]) delete query[k];
        });

        router.get('/admin/bookings', query, { preserveState: true, preserveScroll: true });
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters({ search });
    };

    const handleApproveClick = (booking: Booking) => {
        setApproveBooking(booking);
    };

    const handleConfirmApprove = () => {
        if (!approveBooking) return;
        router.post(`/admin/bookings/${approveBooking.id}/approve`, {}, {
            preserveScroll: true,
            onFinish: () => setApproveBooking(null),
        });
    };

    const handleOpenReject = (booking: Booking) => {
        setRejectBooking(booking);
        setRejectionReason('Nominal transfer tidak sesuai dengan kode unik yang tertera.');
    };

    const handleRejectSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!rejectBooking) return;

        setIsSubmitting(true);
        router.post(`/admin/bookings/${rejectBooking.id}/reject`, {
            reason: rejectionReason,
        }, {
            preserveScroll: true,
            onFinish: () => {
                setIsSubmitting(false);
                setRejectBooking(null);
            },
        });
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'approved':
                return <Badge className="bg-emerald-600 text-white text-xs">Terkonfirmasi</Badge>;
            case 'pending_validation':
                return <Badge className="bg-amber-500 text-white text-xs animate-pulse">Perlu Validasi</Badge>;
            case 'rejected':
                return <Badge className="bg-rose-600 text-white text-xs">Ditolak</Badge>;
            case 'cancelled':
                return <Badge variant="destructive" className="text-xs">Dibatalkan</Badge>;
            default:
                return <Badge className="bg-sky-600 text-white text-xs">Menunggu Bayar</Badge>;
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Manajemen Booking & Validasi - Admin" />

            <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">
                            Manajemen Booking & Validasi Pembayaran
                        </h1>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Total {bookings.total} pesanan tercatat. Verifikasi kode validasi pembayaran untuk mengonfirmasi jadwal bermain.
                        </p>
                    </div>
                </div>

                {/* Filter Toolbar */}
                <div className="p-4 rounded-2xl border border-border/80 bg-card space-y-3">
                    <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
                        <div className="flex-1 relative">
                            <Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                            <Input
                                placeholder="Cari kode booking, nama pemesan, atau no telepon..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9 h-9 text-xs rounded-xl"
                            />
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            {/* Status Filter */}
                            <select
                                value={selectedStatus}
                                onChange={(e) => {
                                    setSelectedStatus(e.target.value);
                                    applyFilters({ status: e.target.value !== 'all' ? e.target.value : '' });
                                }}
                                className="h-9 rounded-xl border border-input bg-card px-3 text-xs text-foreground"
                            >
                                <option value="all">Semua Status</option>
                                <option value="pending_validation">Perlu Validasi</option>
                                <option value="pending">Menunggu Bayar</option>
                                <option value="approved">Terkonfirmasi (Lunas)</option>
                                <option value="rejected">Ditolak</option>
                                <option value="cancelled">Dibatalkan</option>
                            </select>

                            {/* Lapangan Filter */}
                            <select
                                value={selectedLapangan}
                                onChange={(e) => {
                                    setSelectedLapangan(e.target.value);
                                    applyFilters({ lapangan_id: e.target.value !== 'all' ? e.target.value : '' });
                                }}
                                className="h-9 rounded-xl border border-input bg-card px-3 text-xs text-foreground"
                            >
                                <option value="all">Semua Lapangan</option>
                                {lapangans.map((l) => (
                                    <option key={l.id} value={String(l.id)}>{l.name}</option>
                                ))}
                            </select>

                            {/* Date Filter */}
                            <Input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => {
                                    setSelectedDate(e.target.value);
                                    applyFilters({ date: e.target.value });
                                }}
                                className="h-9 w-36 text-xs rounded-xl"
                            />

                            <Button type="submit" size="sm" className="h-9 text-xs bg-emerald-600 hover:bg-emerald-500 rounded-xl text-white">
                                Filter
                            </Button>
                        </div>
                    </form>
                </div>

                {/* Bookings Table */}
                <div className="rounded-2xl border border-border/80 bg-card shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                            <thead className="bg-muted/50 text-muted-foreground uppercase text-xs tracking-wider border-b border-border/60">
                                <tr>
                                    <th className="py-3 px-4">Kode Booking</th>
                                    <th className="py-3 px-4">Lapangan</th>
                                    <th className="py-3 px-4">Pemesan</th>
                                    <th className="py-3 px-4">Jadwal Main</th>
                                    <th className="py-3 px-4">Kode Validasi</th>
                                    <th className="py-3 px-4">Total Bayar</th>
                                    <th className="py-3 px-4">Status</th>
                                    <th className="py-3 px-4 text-right">Aksi Kasir</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/40">
                                {bookings.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="py-12 text-center text-muted-foreground">
                                            Tidak ada data booking yang sesuai dengan kriteria filter.
                                        </td>
                                    </tr>
                                ) : (
                                    bookings.data.map((b) => (
                                        <tr key={b.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="py-3.5 px-4 font-mono font-bold text-foreground">
                                                <Link href={`/booking/${b.booking_code}`} target="_blank" className="hover:underline flex items-center gap-1">
                                                    #{b.booking_code}
                                                </Link>
                                                <span className="text-xs text-muted-foreground font-normal block uppercase">
                                                    {b.payment_method}
                                                </span>
                                            </td>

                                            <td className="py-3.5 px-4">
                                                <p className="font-semibold text-foreground">{b.lapangan?.name}</p>
                                                <span className="text-xs text-muted-foreground">{b.lapangan?.category?.name}</span>
                                            </td>

                                            <td className="py-3.5 px-4">
                                                <p className="font-semibold text-foreground">{b.customer_name}</p>
                                                <p className="text-xs text-muted-foreground">{b.customer_phone}</p>
                                            </td>

                                            <td className="py-3.5 px-4">
                                                <p className="font-medium text-foreground">{b.booking_date}</p>
                                                <p className="text-xs text-muted-foreground">{b.start_time} - {b.end_time} WIB</p>
                                            </td>

                                            {/* Validation Code & Total Verification */}
                                            <td className="py-3.5 px-4">
                                                {b.payment_method === 'transfer' ? (
                                                    <div className="space-y-0.5">
                                                        <p className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                                            +{b.validation_code} <span className="text-xs text-muted-foreground font-normal">(kode unik)</span>
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            Cek mutasi: <span className="font-semibold text-foreground">Rp {Number(b.total_price).toLocaleString('id-ID')}</span>
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">Cash Tunai</span>
                                                )}
                                            </td>

                                            <td className="py-3.5 px-4 font-bold text-emerald-600 dark:text-emerald-400">
                                                Rp {Number(b.total_price).toLocaleString('id-ID')}
                                            </td>

                                            <td className="py-3.5 px-4">
                                                {getStatusBadge(b.payment_status)}
                                            </td>

                                            {/* Admin Actions */}
                                            <td className="py-3.5 px-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    {(b.payment_status === 'pending_validation' || b.payment_status === 'pending') && (
                                                        <>
                                                            <Button
                                                                size="sm"
                                                                onClick={() => handleApproveClick(b)}
                                                                className="h-7 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold"
                                                                title="Setujui Pembayaran"
                                                            >
                                                                <CheckCircle2 className="size-3.5 mr-1" /> Setujui
                                                            </Button>

                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => handleOpenReject(b)}
                                                                className="h-7 px-2 text-xs text-rose-600 border-rose-200 dark:border-rose-900 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg"
                                                                title="Tolak Pembayaran"
                                                            >
                                                                <XCircle className="size-3.5" />
                                                            </Button>
                                                        </>
                                                    )}

                                                    <Button asChild size="sm" variant="ghost" className="h-7 px-2 text-xs rounded-lg">
                                                        <Link href={`/booking/${b.booking_code}`} target="_blank">
                                                            <Eye className="size-3.5" />
                                                        </Link>
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pagination */}
                {bookings.links && bookings.links.length > 3 && (
                    <div className="flex justify-center items-center gap-1.5 mt-2">
                        {bookings.links.map((link, idx) => (
                            <Link
                                key={idx}
                                href={link.url || '#'}
                                preserveScroll
                                className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                                    link.active
                                        ? 'bg-emerald-600 text-white border-emerald-600'
                                        : link.url
                                        ? 'bg-card text-foreground hover:bg-muted border-border'
                                        : 'text-muted-foreground/50 border-transparent cursor-not-allowed pointer-events-none'
                                }`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Confirm Approval Dialog */}
            <ConfirmDialog
                open={!!approveBooking}
                onOpenChange={(open) => !open && setApproveBooking(null)}
                title="Konfirmasi Persetujuan Pembayaran"
                description={`Apakah Anda yakin ingin menyetujui pembayaran untuk booking #${approveBooking?.booking_code} sebesar Rp ${Number(approveBooking?.total_price || 0).toLocaleString('id-ID')}?`}
                confirmLabel="Setujui Pembayaran"
                cancelLabel="Batal"
                variant="default"
                onConfirm={handleConfirmApprove}
            />

            {/* Rejection Dialog with Mandatory Reason */}
            <Dialog open={!!rejectBooking} onOpenChange={(open) => !open && setRejectBooking(null)}>
                <DialogContent className="sm:max-w-md rounded-2xl border-border">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold text-rose-600 flex items-center gap-2">
                            <AlertCircle className="size-5" /> Tolak Pembayaran Booking #{rejectBooking?.booking_code}
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Sistem mewajibkan pencatatan alasan penolakan. Pesan ini akan dikirim via email dan in-app notification kepada pemesan.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleRejectSubmit} className="space-y-4 pt-2">
                        <div className="space-y-2 text-xs">
                            <Label htmlFor="quick_reason">Template Alasan Umum</Label>
                            <select
                                onChange={(e) => setRejectionReason(e.target.value)}
                                className="w-full h-9 rounded-xl border border-input bg-card px-3 text-xs"
                            >
                                <option value="Nominal transfer tidak sesuai dengan kode unik yang tertera.">
                                    Nominal transfer tidak sesuai kode unik
                                </option>
                                <option value="Bukti transfer tidak dapat diverifikasi pada mutasi bank kami.">
                                    Transfer belum masuk di mutasi rekening
                                </option>
                                <option value="Pembayaran melewati batas waktu (deadline) yang ditentukan.">
                                    Melewati batas waktu pembayaran
                                </option>
                                <option value="Lainnya">Lainnya (Ketik sendiri di bawah)</option>
                            </select>

                            <Label htmlFor="reason">Alasan Lengkap</Label>
                            <Textarea
                                id="reason"
                                value={rejectionReason}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRejectionReason(e.target.value)}
                                rows={3}
                                required
                                className="rounded-xl text-xs"
                            />
                        </div>

                        <div className="flex gap-2 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setRejectBooking(null)}
                                className="flex-1 rounded-xl"
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex-1 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold"
                            >
                                {isSubmitting ? 'Memproses...' : 'Konfirmasi Tolak Pembayaran'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
