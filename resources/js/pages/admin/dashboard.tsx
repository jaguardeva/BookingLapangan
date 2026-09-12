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
    PieChart as PieChartIcon,
    CreditCard,
    Trophy,
    Activity,
    BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Booking } from '@/types/booking';

interface PopularLapangan {
    id: number;
    name: string;
    bookings_count: number;
    revenue: number;
}

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
    statusDistribution: {
        approved: number;
        pending_validation: number;
        pending: number;
        rejected: number;
        cancelled: number;
    };
    paymentDistribution: {
        transfer: number;
        cash: number;
    };
    popularLapangans: PopularLapangan[];
    revenueChart: { date: string; revenue: number; count: number }[];
    recentBookings: Booking[];
}

export default function AdminDashboard({
    isSuperAdmin,
    stats,
    statusDistribution = { approved: 0, pending_validation: 0, pending: 0, rejected: 0, cancelled: 0 },
    paymentDistribution = { transfer: 0, cash: 0 },
    popularLapangans = [],
    revenueChart = [],
    recentBookings = [],
}: Props) {
    const breadcrumbs = [
        { title: 'Admin Workspace', href: '/admin' },
        { title: 'Dashboard Analytics', href: '/admin' },
    ];

    const maxRevenue = Math.max(...revenueChart.map((d) => d.revenue), 100000);
    const maxBookingsCount = Math.max(...popularLapangans.map((l) => l.bookings_count), 1);
    const totalStatusCount = Object.values(statusDistribution).reduce((a, b) => a + b, 0) || 1;
    const totalPaymentsCount = (paymentDistribution.transfer + paymentDistribution.cash) || 1;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard Analytics - SportBooking" />

            <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
                {/* Header Strip */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                            <Activity className="size-6 text-emerald-600 dark:text-emerald-400" />
                            {isSuperAdmin ? 'Superadmin Analytics Dashboard' : 'Kasir & Lapangan Analytics'}
                        </h1>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Ikhtisar kinerja usaha, tren pendapatan, ketersediaan lapangan, dan validasi transaksi harian.
                        </p>
                    </div>

                    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                        <Button asChild size="sm" className="h-9 w-full rounded-xl bg-emerald-600 text-xs text-white shadow-sm hover:bg-emerald-500 sm:w-auto">
                            <Link href="/admin/bookings">
                                Validasi Pembayaran ({stats.pending_validation})
                            </Link>
                        </Button>
                        <Button asChild size="sm" variant="outline" className="h-9 w-full rounded-xl text-xs sm:w-auto">
                            <Link href="/admin/bookings?manual=1">
                                Booking Manual
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* KPI Metrics Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Metric 1 */}
                    <div className="p-5 rounded-2xl border border-border/80 bg-card shadow-sm space-y-2 hover:border-emerald-500/30 transition-all">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Booking Hari Ini</span>
                            <div className="size-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                                <CalendarCheck className="size-5" />
                            </div>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <p className="text-3xl font-black text-foreground">{stats.today_bookings}</p>
                            <span className="text-xs text-emerald-600 font-semibold">jadwal</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Main pada hari ini</p>
                    </div>

                    {/* Metric 2 */}
                    <div className="p-5 rounded-2xl border border-border/80 bg-card shadow-sm space-y-2 hover:border-emerald-500/30 transition-all">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Omset Hari Ini</span>
                            <div className="size-9 rounded-xl bg-sky-500/10 text-sky-600 flex items-center justify-center">
                                <TrendingUp className="size-5" />
                            </div>
                        </div>
                        <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                            Rp {Number(stats.today_revenue).toLocaleString('id-ID')}
                        </p>
                        <p className="text-xs text-muted-foreground">Pembayaran terkonfirmasi</p>
                    </div>

                    {/* Metric 3 */}
                    <div className={`p-5 rounded-2xl border shadow-sm space-y-2 transition-all ${
                        stats.pending_validation > 0
                            ? 'bg-amber-500/10 border-amber-500/40 ring-1 ring-amber-500/30'
                            : 'bg-card border-border/80'
                    }`}>
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Perlu Validasi</span>
                            <div className="size-9 rounded-xl bg-amber-500/20 text-amber-600 flex items-center justify-center">
                                <Clock className="size-5" />
                            </div>
                        </div>
                        <p className="text-3xl font-black text-foreground">{stats.pending_validation}</p>
                        <p className="text-xs text-muted-foreground">
                            {stats.pending_validation > 0 ? 'Segera periksa mutasi bank!' : 'Semua pembayaran beres'}
                        </p>
                    </div>

                    {/* Metric 4 */}
                    <div className="p-5 rounded-2xl border border-border/80 bg-card shadow-sm space-y-2 hover:border-purple-500/30 transition-all">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Omset Kumulatif</span>
                            <div className="size-9 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
                                <DollarSign className="size-5" />
                            </div>
                        </div>
                        <p className="text-2xl font-black text-foreground">
                            Rp {Number(stats.total_revenue).toLocaleString('id-ID')}
                        </p>
                        <p className="text-xs text-muted-foreground">Dari total {stats.total_bookings} pesanan</p>
                    </div>
                </div>

                {/* Section 2: Charts Grid (Revenue Trend + Status Breakdown) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Revenue Bar Chart (2 Cols) */}
                    <div className="lg:col-span-2 p-6 rounded-2xl border border-border/80 bg-card shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                                    <BarChart3 className="size-5 text-emerald-600" />
                                    Grafik Tren Omset 7 Hari Terakhir
                                </h2>
                                <p className="text-xs text-muted-foreground">Total rupiah & jumlah transaksi yang terkonfirmasi lunas harian</p>
                            </div>
                            <span className="text-xs font-bold text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                                Real-Time
                            </span>
                        </div>

                        <div className="grid grid-cols-7 gap-3 pt-6 items-end h-56 border-b border-border/60 pb-3">
                            {revenueChart.map((d, i) => {
                                const heightPercent = Math.max(Math.round((d.revenue / maxRevenue) * 100), 8);
                                return (
                                    <div key={i} className="flex flex-col items-center gap-2 h-full justify-end group">
                                        {/* Hover Tooltip */}
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-popover text-popover-foreground text-[10px] font-bold p-1.5 rounded-lg shadow-md border border-border text-center pointer-events-none whitespace-nowrap z-10">
                                            <p>Rp {Number(d.revenue).toLocaleString('id-ID')}</p>
                                            <p className="text-muted-foreground font-normal">{d.count} booking</p>
                                        </div>

                                        <div
                                            style={{ height: `${heightPercent}%` }}
                                            className="w-full max-w-[44px] rounded-t-xl bg-gradient-to-t from-emerald-700 to-emerald-500 group-hover:from-emerald-600 group-hover:to-emerald-400 transition-all shadow-md flex items-start justify-center pt-1"
                                        >
                                            {d.count > 0 && (
                                                <span className="text-[10px] font-bold text-white opacity-80">
                                                    {d.count}
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-xs font-semibold text-muted-foreground">{d.date}</span>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                            <span className="flex items-center gap-1.5">
                                <span className="size-3 rounded-full bg-emerald-500 inline-block" /> Omset Lunas
                            </span>
                            <span className="font-semibold text-foreground">
                                Rata-rata 7 hari: Rp {Number(Math.round(revenueChart.reduce((a, b) => a + b.revenue, 0) / (revenueChart.length || 1))).toLocaleString('id-ID')} / hari
                            </span>
                        </div>
                    </div>

                    {/* Status Breakdown Widget (1 Col) */}
                    <div className="p-6 rounded-2xl border border-border/80 bg-card shadow-sm space-y-4 flex flex-col justify-between">
                        <div>
                            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                                <PieChartIcon className="size-5 text-sky-600" />
                                Distribusi Status Booking
                            </h2>
                            <p className="text-xs text-muted-foreground">Breakdown status seluruh pesanan masuk</p>
                        </div>

                        <div className="space-y-3.5 py-2">
                            {/* Approved */}
                            <div className="space-y-1">
                                <div className="flex justify-between text-xs font-semibold">
                                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                                        <CheckCircle2 className="size-3.5" /> Terkonfirmasi (Lunas)
                                    </span>
                                    <span>{statusDistribution.approved} ({Math.round((statusDistribution.approved / totalStatusCount) * 100)}%)</span>
                                </div>
                                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                                    <div
                                        className="h-full bg-emerald-600 rounded-full"
                                        style={{ width: `${(statusDistribution.approved / totalStatusCount) * 100}%` }}
                                    />
                                </div>
                            </div>

                            {/* Pending Validation */}
                            <div className="space-y-1">
                                <div className="flex justify-between text-xs font-semibold">
                                    <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                                        <Clock className="size-3.5" /> Perlu Validasi
                                    </span>
                                    <span>{statusDistribution.pending_validation} ({Math.round((statusDistribution.pending_validation / totalStatusCount) * 100)}%)</span>
                                </div>
                                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                                    <div
                                        className="h-full bg-amber-500 rounded-full"
                                        style={{ width: `${(statusDistribution.pending_validation / totalStatusCount) * 100}%` }}
                                    />
                                </div>
                            </div>

                            {/* Pending Payment */}
                            <div className="space-y-1">
                                <div className="flex justify-between text-xs font-semibold">
                                    <span className="text-sky-600 dark:text-sky-400 flex items-center gap-1.5">
                                        <Clock className="size-3.5" /> Menunggu Bayar
                                    </span>
                                    <span>{statusDistribution.pending} ({Math.round((statusDistribution.pending / totalStatusCount) * 100)}%)</span>
                                </div>
                                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                                    <div
                                        className="h-full bg-sky-500 rounded-full"
                                        style={{ width: `${(statusDistribution.pending / totalStatusCount) * 100}%` }}
                                    />
                                </div>
                            </div>

                            {/* Rejected & Cancelled */}
                            <div className="space-y-1">
                                <div className="flex justify-between text-xs font-semibold">
                                    <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                                        <XCircle className="size-3.5" /> Ditolak / Dibatalkan
                                    </span>
                                    <span>
                                        {statusDistribution.rejected + statusDistribution.cancelled} ({Math.round(((statusDistribution.rejected + statusDistribution.cancelled) / totalStatusCount) * 100)}%)
                                    </span>
                                </div>
                                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                                    <div
                                        className="h-full bg-rose-500 rounded-full"
                                        style={{ width: `${((statusDistribution.rejected + statusDistribution.cancelled) / totalStatusCount) * 100}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Payment Method Distribution */}
                        <div className="p-3.5 rounded-xl border border-border/80 bg-muted/30 space-y-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                                Metode Pembayaran Diterima
                            </span>
                            <div className="flex items-center justify-between text-xs font-bold">
                                <span className="flex items-center gap-1.5 text-foreground">
                                    <CreditCard className="size-4 text-emerald-600" /> Transfer Bank
                                </span>
                                <span className="text-emerald-600 font-mono">
                                    {Math.round((paymentDistribution.transfer / totalPaymentsCount) * 100)}% ({paymentDistribution.transfer})
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-xs font-bold">
                                <span className="flex items-center gap-1.5 text-foreground">
                                    <DollarSign className="size-4 text-sky-600" /> Cash Tunai
                                </span>
                                <span className="text-sky-600 font-mono">
                                    {Math.round((paymentDistribution.cash / totalPaymentsCount) * 100)}% ({paymentDistribution.cash})
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section 3: Popular Fields Ranking + Recent Bookings */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Top Lapangan Performance (1 Col) */}
                    <div className="min-w-0 rounded-2xl border border-border/80 bg-card p-4 shadow-sm space-y-4 sm:p-6">
                        <div>
                            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                                <Trophy className="size-5 text-amber-500" />
                                Lapangan Terpopuler
                            </h2>
                            <p className="text-xs text-muted-foreground">Peringkat ketersediaan & total omset per lapangan</p>
                        </div>

                        <div className="space-y-4 pt-1">
                            {popularLapangans.length === 0 ? (
                                <p className="text-xs text-muted-foreground py-4 text-center">Belum ada data transaksi lapangan.</p>
                            ) : (
                                popularLapangans.map((lap, idx) => (
                                    <div key={lap.id} className="space-y-1.5">
                                        <div className="flex min-w-0 items-start justify-between gap-2 text-xs font-semibold">
                                            <span className="flex min-w-0 items-center gap-2 text-foreground">
                                                <span className={`size-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 ${
                                                    idx === 0 ? 'bg-amber-500' : idx === 1 ? 'bg-slate-400' : 'bg-amber-700'
                                                }`}>
                                                    {idx + 1}
                                                </span>
                                                <span className="truncate">{lap.name}</span>
                                            </span>
                                            <span className="shrink-0 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                                Rp {Number(lap.revenue).toLocaleString('id-ID')}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="h-2 flex-1 rounded-full bg-muted overflow-hidden">
                                                <div
                                                    className="h-full bg-emerald-600 rounded-full"
                                                    style={{ width: `${Math.max((lap.bookings_count / maxBookingsCount) * 100, 5)}%` }}
                                                />
                                            </div>
                                            <span className="text-[11px] text-muted-foreground font-medium w-16 text-right">
                                                {lap.bookings_count} main
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Recent Bookings Table (2 Cols) */}
                    <div className="lg:col-span-2 rounded-2xl border border-border/80 bg-card shadow-sm overflow-hidden flex flex-col justify-between">
                        <div>
                            <div className="flex flex-col gap-2 border-b border-border/60 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                                <div>
                                    <h2 className="text-base font-bold text-foreground">Booking & Transaksi Terbaru</h2>
                                    <p className="text-xs text-muted-foreground">Daftar transaksi yang baru saja masuk atau diperbarui</p>
                                </div>

                                <Button variant="ghost" size="sm" asChild className="self-start px-0 text-xs sm:self-auto sm:px-3">
                                    <Link href="/admin/bookings">
                                        Buka Semua <ArrowRight className="size-3.5 ml-1" />
                                    </Link>
                                </Button>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-xs text-left">
                                    <thead className="bg-muted/50 text-muted-foreground uppercase text-xs tracking-wider border-b border-border/60">
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
                                                        <p className="text-xs text-muted-foreground">{b.customer_phone}</p>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <p className="font-medium text-foreground">{b.booking_date}</p>
                                                        <p className="text-xs text-muted-foreground">{b.start_time} - {b.end_time} WIB</p>
                                                    </td>
                                                    <td className="py-3 px-4 font-bold text-emerald-600 dark:text-emerald-400">
                                                        Rp {Number(b.total_price).toLocaleString('id-ID')}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        {b.payment_status === 'approved' ? (
                                                            <Badge className="bg-emerald-600 text-white text-xs">Terkonfirmasi</Badge>
                                                        ) : b.payment_status === 'pending_validation' ? (
                                                            <Badge className="bg-amber-500 text-white text-xs animate-pulse">Perlu Validasi</Badge>
                                                        ) : b.payment_status === 'rejected' ? (
                                                            <Badge className="bg-rose-600 text-white text-xs">Ditolak</Badge>
                                                        ) : (
                                                            <Badge className="bg-sky-600 text-white text-xs">Menunggu Bayar</Badge>
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-4 text-right">
                                                        <Button asChild size="sm" variant="outline" className="h-7 text-xs rounded-lg">
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
                </div>
            </div>
        </AppLayout>
    );
}
