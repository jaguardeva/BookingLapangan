import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Download, Calendar, DollarSign, Filter, FileText, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Booking, Lapangan } from '@/types/booking';

interface Props {
    bookings: {
        data: Booking[];
        links: { url: string | null; label: string; active: boolean }[];
        total: number;
    };
    lapangans: Lapangan[];
    summary: {
        total_revenue: number;
        total_bookings: number;
        approved_bookings: number;
        cancelled_bookings: number;
    };
    filters: {
        start_date: string;
        end_date: string;
        lapangan_id: string;
        status: string;
    };
}

export default function AdminReportsIndex({
    bookings,
    lapangans = [],
    summary,
    filters,
}: Props) {
    const breadcrumbs = [
        { title: 'Admin Workspace', href: '/admin' },
        { title: 'Laporan & Export', href: '/admin/reports' },
    ];

    const [startDate, setStartDate] = useState(filters.start_date || '');
    const [endDate, setEndDate] = useState(filters.end_date || '');
    const [selectedLapangan, setSelectedLapangan] = useState(filters.lapangan_id || 'all');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || 'all');

    const handleFilterSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/admin/reports', {
            start_date: startDate,
            end_date: endDate,
            lapangan_id: selectedLapangan,
            status: selectedStatus,
        }, { preserveState: true, preserveScroll: true });
    };

    const exportUrl = `/admin/reports/export?start_date=${startDate}&end_date=${endDate}&lapangan_id=${selectedLapangan}&status=${selectedStatus}`;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Laporan & Ekspor Data - Admin" />

            <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">
                            Laporan Transaksi & Pendapatan
                        </h1>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Analisis pendapatan sewa lapangan dan unduh arsip laporan dalam format CSV/Excel.
                        </p>
                    </div>

                    <Button asChild className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs h-9">
                        <a href={exportUrl} target="_blank" rel="noreferrer">
                            <Download className="size-4 mr-1.5" /> Ekspor Laporan CSV
                        </a>
                    </Button>
                </div>

                {/* Metric Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-5 rounded-2xl border border-border/80 bg-card shadow-sm space-y-1.5">
                        <span className="text-xs font-semibold text-muted-foreground uppercase">Total Pendapatan Terkonfirmasi</span>
                        <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                            Rp {Number(summary.total_revenue).toLocaleString('id-ID')}
                        </p>
                        <p className="text-xs text-muted-foreground">Pada rentang tanggal yang dipilih</p>
                    </div>

                    <div className="p-5 rounded-2xl border border-border/80 bg-card shadow-sm space-y-1.5">
                        <span className="text-xs font-semibold text-muted-foreground uppercase">Total Pesanan</span>
                        <p className="text-2xl font-black text-foreground">{summary.total_bookings}</p>
                        <p className="text-xs text-muted-foreground">Termasuk pending & lunas</p>
                    </div>

                    <div className="p-5 rounded-2xl border border-border/80 bg-card shadow-sm space-y-1.5">
                        <span className="text-xs font-semibold text-muted-foreground uppercase">Booking Selesai / Lunas</span>
                        <p className="text-2xl font-black text-foreground">{summary.approved_bookings}</p>
                        <p className="text-xs text-muted-foreground">Telah divalidasi kasir</p>
                    </div>

                    <div className="p-5 rounded-2xl border border-border/80 bg-card shadow-sm space-y-1.5">
                        <span className="text-xs font-semibold text-muted-foreground uppercase">Booking Dibatalkan</span>
                        <p className="text-2xl font-black text-rose-600">{summary.cancelled_bookings}</p>
                        <p className="text-xs text-muted-foreground">Kadaluarsa atau dibatalkan user</p>
                    </div>
                </div>

                {/* Filter Toolbar */}
                <div className="p-4 rounded-2xl border border-border/80 bg-card">
                    <form onSubmit={handleFilterSubmit} className="flex flex-wrap items-end gap-3 text-xs">
                        <div className="space-y-1">
                            <Label>Dari Tanggal</Label>
                            <Input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="h-9 rounded-xl text-xs"
                            />
                        </div>

                        <div className="space-y-1">
                            <Label>Sampai Tanggal</Label>
                            <Input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="h-9 rounded-xl text-xs"
                            />
                        </div>

                        <div className="space-y-1">
                            <Label>Lapangan</Label>
                            <select
                                value={selectedLapangan}
                                onChange={(e) => setSelectedLapangan(e.target.value)}
                                className="h-9 rounded-xl border border-input bg-card px-3 text-xs"
                            >
                                <option value="all">Semua Lapangan</option>
                                {lapangans.map((l) => (
                                    <option key={l.id} value={String(l.id)}>{l.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1">
                            <Label>Status Pembayaran</Label>
                            <select
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                                className="h-9 rounded-xl border border-input bg-card px-3 text-xs"
                            >
                                <option value="all">Semua Status</option>
                                <option value="approved">Lunas (Terkonfirmasi)</option>
                                <option value="pending">Menunggu Pembayaran</option>
                                <option value="pending_validation">Menunggu Validasi</option>
                                <option value="cancelled">Dibatalkan</option>
                            </select>
                        </div>

                        <Button type="submit" size="sm" className="h-9 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white">
                            Terapkan Filter
                        </Button>
                    </form>
                </div>

                {/* Reports Table */}
                <div className="rounded-2xl border border-border/80 bg-card shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                            <thead className="bg-muted/50 text-muted-foreground uppercase text-xs tracking-wider border-b border-border/60">
                                <tr>
                                    <th className="py-3 px-4">Kode Booking</th>
                                    <th className="py-3 px-4">Tanggal</th>
                                    <th className="py-3 px-4">Lapangan</th>
                                    <th className="py-3 px-4">Pemesan</th>
                                    <th className="py-3 px-4">Jam</th>
                                    <th className="py-3 px-4">Metode</th>
                                    <th className="py-3 px-4">Total</th>
                                    <th className="py-3 px-4">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/40">
                                {bookings.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="py-12 text-center text-muted-foreground">
                                            Tidak ada data laporan pada periode ini.
                                        </td>
                                    </tr>
                                ) : (
                                    bookings.data.map((b) => (
                                        <tr key={b.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="py-3 px-4 font-mono font-bold text-foreground">
                                                #{b.booking_code}
                                            </td>
                                            <td className="py-3 px-4">{b.booking_date}</td>
                                            <td className="py-3 px-4 font-semibold text-foreground">{b.lapangan?.name}</td>
                                            <td className="py-3 px-4">{b.customer_name}</td>
                                            <td className="py-3 px-4">{b.start_time} - {b.end_time}</td>
                                            <td className="py-3 px-4 uppercase font-semibold">{b.payment_method}</td>
                                            <td className="py-3 px-4 font-bold text-emerald-600 dark:text-emerald-400">
                                                Rp {Number(b.total_price).toLocaleString('id-ID')}
                                            </td>
                                            <td className="py-3 px-4">
                                                {b.payment_status === 'approved' ? (
                                                    <Badge className="bg-emerald-600 text-white text-xs">Lunas</Badge>
                                                ) : b.payment_status === 'pending_validation' ? (
                                                    <Badge className="bg-amber-500 text-white text-xs">Validasi</Badge>
                                                ) : b.payment_status === 'rejected' ? (
                                                    <Badge className="bg-rose-600 text-white text-xs">Ditolak</Badge>
                                                ) : (
                                                    <Badge variant="outline" className="text-xs">{b.payment_status}</Badge>
                                                )}
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
        </AppLayout>
    );
}
