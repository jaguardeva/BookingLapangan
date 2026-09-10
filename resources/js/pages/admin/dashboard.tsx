import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import {
    CalendarCheck,
    DollarSign,
    Clock,
    Layers,
    TrendingUp,
    ArrowRight,
    CheckCircle2,
    XCircle,
    User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Booking } from '@/types/booking';

interface Props {
    isSuperAdmin: boolean;
    stats: {
        today_bookings: number;
        today_revenue: number;
        total_revenue: number;
        pending_validation: number;
        total_bookings: number;
        total_fields: number;
    };
    revenueChart: { date: string; revenue: number }[];
    recentBookings: Booking[];
}

export default function AdminDashboard({
    isSuperAdmin,
    stats,
    revenueChart = [],
    recentBookings = [],
}: Props) {
    const breadcrumbs = [
        { title: 'Admin Workspace', href: '/admin' },
        { title: 'Dashboard', href: '/admin' },
    ];

    const maxRevenue = Math.max(...revenueChart.map((d) => d.revenue), 100000);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard Admin - SportBooking" />

            <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
                {/* Welcome strip */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">
                            {isSuperAdmin ? 'Superadmin Overview' : 'Kasir & Lapangan Dashboard'}
                        </h1>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Pantau transaksi booking, verifikasi pembayaran masuk, dan ketersediaan lapangan olahraga.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs h-9">
                            <Link href="/admin/bookings">
                                Kelola Pembayaran ({stats.pending_validation})
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* KPI Metrics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Metric 1 */}
                    <div className="p-5 rounded-2xl border border-border/80 bg-card shadow-sm space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Booking Hari Ini</span>
                            <div className="size-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                                <CalendarCheck className="size-4" />
                            </div>
                        </div>
                        <p className="text-2xl font-black text-foreground">{stats.today_bookings}</p>
                        <p className="text-[11px] text-muted-foreground">Jadwal main hari ini</p>
                    </div>

                    {/* Metric 2 */}
                    <div className="p-5 rounded-2xl border border-border/80 bg-card shadow-sm space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pendapatan Hari Ini</span>
                            <div className="size-8 rounded-xl bg-sky-500/10 text-sky-600 flex items-center justify-center">
                                <TrendingUp className="size-4" />
                            </div>
                        </div>
                        <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                            Rp {Number(stats.today_revenue).toLocaleString('id-ID')}
                        </p>
                        <p className="text-[11px] text-muted-foreground">Pembayaran terkonfirmasi</p>
                    </div>

                    {/* Metric 3 */}
                    <div className={`p-5 rounded-2xl border shadow-sm space-y-2 transition-all ${
                        stats.pending_validation > 0
                            ? 'bg-amber-500/10 border-amber-500/40 text-amber-900 dark:text-amber-100 ring-1 ring-amber-500/30'
                            : 'bg-card border-border/80'
                    }`}>
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Perlu Validasi</span>
                            <div className="size-8 rounded-xl bg-amber-500/20 text-amber-600 flex items-center justify-center">
                                <Clock className="size-4" />
                            </div>
                        </div>
                        <p className="text-2xl font-black text-foreground">{stats.pending_validation}</p>
                        <p className="text-[11px] text-muted-foreground">
                            {stats.pending_validation > 0 ? 'Menunggu persetujuan kasir!' : 'Semua pembayaran beres'}
                        </p>
                    </div>

                    {/* Metric 4 */}
                    <div className="p-5 rounded-2xl border border-border/80 bg-card shadow-sm space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Pendapatan</span>
                            <div className="size-8 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
                                <DollarSign className="size-4" />
                            </div>
                        </div>
                        <p className="text-2xl font-black text-foreground">
                            Rp {Number(stats.total_revenue).toLocaleString('id-ID')}
                        </p>
                        <p className="text-[11px] text-muted-foreground">Dari {stats.total_bookings} total booking</p>
                    </div>
                </div>

                {/* 7-Day Revenue Trend Chart */}
                <div className="p-6 rounded-2xl border border-border/80 bg-card shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-base font-bold text-foreground">Tren Pendapatan 7 Hari Terakhir</h2>
                            <p className="text-xs text-muted-foreground">Total omset harian dari pembayaran terkonfirmasi</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-7 gap-2 pt-6 items-end h-48 border-b border-border/60 pb-3">
                        {revenueChart.map((d, i) => {
                            const heightPercent = Math.max(Math.round((d.revenue / maxRevenue) * 100), 6);
                            return (
                                <div key={i} className="flex flex-col items-center gap-2 h-full justify-end group">
                                    <div className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity font-semibold">
                                        Rp {(d.revenue / 1000).toLocaleString('id-ID')}k
                                    </div>
                                    <div
                                        style={{ height: `${heightPercent}%` }}
                                        className="w-full max-w-[48px] rounded-t-lg bg-emerald-600/80 group-hover:bg-emerald-500 transition-all shadow-sm"
                                    />
                                    <span className="text-[11px] font-medium text-muted-foreground">{d.date}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Recent Bookings Table */}
                <div className="rounded-2xl border border-border/80 bg-card shadow-sm overflow-hidden space-y-0">
                    <div className="p-5 border-b border-border/60 flex items-center justify-between">
                        <div>
                            <h2 className="text-base font-bold text-foreground">Booking & Transaksi Terbaru</h2>
                            <p className="text-xs text-muted-foreground">Daftar transaksi yang baru saja dibuat atau diperbarui</p>
                        </div>

                        <Button variant="ghost" size="sm" asChild className="text-xs">
                            <Link href="/admin/bookings">
                                Buka Semua <ArrowRight className="size-3.5 ml-1" />
                            </Link>
                        </Button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                            <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border/60">
                                <tr>
                                    <th className="py-3 px-4">Kode Booking</th>
                                    <th className="py-3 px-4">Lapangan</th>
                                    <th className="py-3 px-4">Pemesan</th>
                                    <th className="py-3 px-4">Jadwal Main</th>
                                    <th className="py-3 px-4">Total</th>
                                    <th className="py-3 px-4">Status</th>
                                    <th className="py-3 px-4 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/40">
                                {recentBookings.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="py-8 text-center text-muted-foreground">
                                            Belum ada transaksi terbaru.
                                        </td>
                                    </tr>
                                ) : (
                                    recentBookings.map((b) => (
                                        <tr key={b.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="py-3 px-4 font-mono font-bold text-foreground">
                                                #{b.booking_code}
                                            </td>
                                            <td className="py-3 px-4 font-semibold text-foreground">
                                                {b.lapangan?.name}
                                            </td>
                                            <td className="py-3 px-4">
                                                <p className="font-semibold text-foreground">{b.customer_name}</p>
                                                <p className="text-[10px] text-muted-foreground">{b.customer_phone}</p>
                                            </td>
                                            <td className="py-3 px-4">
                                                <p className="font-medium text-foreground">{b.booking_date}</p>
                                                <p className="text-[10px] text-muted-foreground">{b.start_time} - {b.end_time} WIB</p>
                                            </td>
                                            <td className="py-3 px-4 font-bold text-emerald-600 dark:text-emerald-400">
                                                Rp {Number(b.total_price).toLocaleString('id-ID')}
                                            </td>
                                            <td className="py-3 px-4">
                                                {b.payment_status === 'approved' ? (
                                                    <Badge className="bg-emerald-600 text-white text-[10px]">Terkonfirmasi</Badge>
                                                ) : b.payment_status === 'pending_validation' ? (
                                                    <Badge className="bg-amber-500 text-white text-[10px] animate-pulse">Perlu Validasi</Badge>
                                                ) : b.payment_status === 'rejected' ? (
                                                    <Badge className="bg-rose-600 text-white text-[10px]">Ditolak</Badge>
                                                ) : (
                                                    <Badge className="bg-sky-600 text-white text-[10px]">Menunggu Bayar</Badge>
                                                )}
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                <Button asChild size="sm" variant="outline" className="h-7 text-[11px] rounded-lg">
                                                    <Link href={`/admin/bookings?search=${b.booking_code}`}>
                                                        Detail
                                                    </Link>
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
