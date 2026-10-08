import { Head, router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import {
    Download,
    Calendar,
    DollarSign,
    FileText,
    CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ResetFilterButton } from '@/components/reset-filter-button';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/pagination';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { Booking, Lapangan } from '@/types/booking';
import { index as reportsIndex } from '@/routes/admin/reports/index';

interface Props {
    bookings: {
        data: Booking[];
        links: { url: string | null; label: string; active: boolean }[];
        total: number;
        from?: number | null;
        to?: number | null;
        last_page?: number;
        per_page?: number;
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

const formatDateInput = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
};

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
    const [selectedLapangan, setSelectedLapangan] = useState(
        filters.lapangan_id || 'all',
    );
    const [selectedStatus, setSelectedStatus] = useState(
        filters.status || 'all',
    );
    const filterKey = JSON.stringify([
        startDate,
        endDate,
        selectedLapangan,
        selectedStatus,
    ]);
    const latestFilterKey = useRef(filterKey);
    const lastAppliedFilterKey = useRef(filterKey);
    const pendingFilterTimeout = useRef<number | undefined>(undefined);
    const defaultEndDate = formatDateInput(new Date());
    const defaultStartDate = formatDateInput(
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    );
    const hasActiveFilters =
        startDate !== defaultStartDate ||
        endDate !== defaultEndDate ||
        selectedLapangan !== 'all' ||
        selectedStatus !== 'all';

    useEffect(() => {
        latestFilterKey.current = filterKey;

        if (lastAppliedFilterKey.current === filterKey) {
            return;
        }

        const timeoutId = window.setTimeout(() => {
            lastAppliedFilterKey.current = filterKey;
            const query: Record<string, string> = {
                start_date: startDate,
                end_date: endDate,
                lapangan_id: selectedLapangan !== 'all' ? selectedLapangan : '',
                status: selectedStatus !== 'all' ? selectedStatus : '',
            };
            const activeFilters = Object.fromEntries(
                Object.entries(query).filter(([, value]) => value !== ''),
            );

            router.get(reportsIndex.url(), activeFilters, {
                preserveState: true,
                preserveScroll: true,
                onSuccess: (page) => {
                    if (latestFilterKey.current !== filterKey) {
                        return;
                    }

                    const resolvedFilters = page.props
                        .filters as Props['filters'];
                    lastAppliedFilterKey.current = JSON.stringify([
                        resolvedFilters.start_date,
                        resolvedFilters.end_date,
                        resolvedFilters.lapangan_id,
                        resolvedFilters.status,
                    ]);
                    setStartDate(resolvedFilters.start_date);
                    setEndDate(resolvedFilters.end_date);
                    setSelectedLapangan(resolvedFilters.lapangan_id);
                    setSelectedStatus(resolvedFilters.status);
                },
            });
        }, 300);
        pendingFilterTimeout.current = timeoutId;

        return () => {
            window.clearTimeout(timeoutId);
            if (pendingFilterTimeout.current === timeoutId) {
                pendingFilterTimeout.current = undefined;
            }
        };
    }, [filterKey, startDate, endDate, selectedLapangan, selectedStatus]);

    const resetFilters = () => {
        if (pendingFilterTimeout.current !== undefined) {
            window.clearTimeout(pendingFilterTimeout.current);
            pendingFilterTimeout.current = undefined;
        }

        router.get(
            reportsIndex.url(),
            {},
            {
                preserveState: false,
                preserveScroll: true,
            },
        );
    };

    const exportUrl = `/admin/reports/export?start_date=${startDate}&end_date=${endDate}&lapangan_id=${selectedLapangan}&status=${selectedStatus}`;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Laporan & Ekspor Data - Admin" />

            <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="text-foreground text-2xl font-bold tracking-tight">
                            Laporan Transaksi & Pendapatan
                        </h1>
                        <p className="text-muted-foreground mt-0.5 text-xs">
                            Analisis pendapatan sewa lapangan dan unduh arsip
                            laporan dalam format CSV/Excel.
                        </p>
                    </div>

                    <Button
                        asChild
                        className="bg-primary hover:bg-primary/90 text-primary-foreground h-9 rounded-xl text-xs"
                    >
                        <a href={exportUrl} target="_blank" rel="noreferrer">
                            <Download className="size-4" /> Ekspor
                            Laporan CSV
                        </a>
                    </Button>
                </div>

                {/* Metric Summary Cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="border-border/80 bg-card space-y-1.5 rounded-2xl border p-5 shadow-sm">
                        <span className="text-muted-foreground text-xs font-semibold uppercase">
                            Total Pendapatan Terkonfirmasi
                        </span>
                        <p className="text-primary dark:text-primary text-2xl font-black">
                            Rp{' '}
                            {Number(summary.total_revenue).toLocaleString(
                                'id-ID',
                            )}
                        </p>
                        <p className="text-muted-foreground text-xs">
                            Pada rentang tanggal yang dipilih
                        </p>
                    </div>

                    <div className="border-border/80 bg-card space-y-1.5 rounded-2xl border p-5 shadow-sm">
                        <span className="text-muted-foreground text-xs font-semibold uppercase">
                            Total Pesanan
                        </span>
                        <p className="text-foreground text-2xl font-black">
                            {summary.total_bookings}
                        </p>
                        <p className="text-muted-foreground text-xs">
                            Termasuk pending & lunas
                        </p>
                    </div>

                    <div className="border-border/80 bg-card space-y-1.5 rounded-2xl border p-5 shadow-sm">
                        <span className="text-muted-foreground text-xs font-semibold uppercase">
                            Booking Selesai / Lunas
                        </span>
                        <p className="text-foreground text-2xl font-black">
                            {summary.approved_bookings}
                        </p>
                        <p className="text-muted-foreground text-xs">
                            Telah divalidasi kasir
                        </p>
                    </div>

                    <div className="border-border/80 bg-card space-y-1.5 rounded-2xl border p-5 shadow-sm">
                        <span className="text-muted-foreground text-xs font-semibold uppercase">
                            Booking Dibatalkan
                        </span>
                        <p className="text-2xl font-black text-rose-600">
                            {summary.cancelled_bookings}
                        </p>
                        <p className="text-muted-foreground text-xs">
                            Kadaluarsa atau dibatalkan user
                        </p>
                    </div>
                </div>

                {/* Filter Toolbar */}
                <div className="border-border/80 bg-card rounded-2xl border p-3 shadow-sm sm:p-4">
                    <div className="grid grid-cols-2 items-end gap-3 sm:flex sm:flex-wrap">
                        <div className="flex min-w-0 flex-col gap-2">
                            <Label className="text-sm leading-none font-medium">
                                Dari tanggal
                            </Label>
                            <Input
                                type="date"
                                value={startDate}
                                onChange={(event) =>
                                    setStartDate(event.target.value)
                                }
                                className="h-10 w-full min-w-0 rounded-xl text-sm"
                            />
                        </div>

                        <div className="flex min-w-0 flex-col gap-2">
                            <Label className="text-sm leading-none font-medium">
                                Sampai tanggal
                            </Label>
                            <Input
                                type="date"
                                value={endDate}
                                onChange={(event) =>
                                    setEndDate(event.target.value)
                                }
                                className="h-10 w-full min-w-0 rounded-xl text-sm"
                            />
                        </div>

                        <div className="flex min-w-0 flex-col gap-2 sm:max-w-xs">
                            <Label className="text-sm leading-none font-medium">
                                Lapangan
                            </Label>
                            <Select
                                value={selectedLapangan}
                                onValueChange={setSelectedLapangan}
                            >
                                <SelectTrigger className="h-10 w-full rounded-xl text-sm">
                                    <SelectValue placeholder="Semua lapangan" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        Semua lapangan
                                    </SelectItem>
                                    {lapangans.map((lapangan) => (
                                        <SelectItem
                                            key={lapangan.id}
                                            value={String(lapangan.id)}
                                        >
                                            {lapangan.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex min-w-0 flex-col gap-2 sm:max-w-xs">
                            <Label className="text-sm leading-none font-medium">
                                Status pembayaran
                            </Label>
                            <Select
                                value={selectedStatus}
                                onValueChange={setSelectedStatus}
                            >
                                <SelectTrigger className="h-10 w-full rounded-xl text-sm">
                                    <SelectValue placeholder="Semua status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        Semua status
                                    </SelectItem>
                                    <SelectItem value="approved">
                                        Lunas (terkonfirmasi)
                                    </SelectItem>
                                    <SelectItem value="pending">
                                        Menunggu pembayaran
                                    </SelectItem>
                                    <SelectItem value="pending_validation">
                                        Menunggu validasi
                                    </SelectItem>
                                    <SelectItem value="cancelled">
                                        Dibatalkan
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {hasActiveFilters && (
                            <ResetFilterButton
                                onClick={resetFilters}
                                className="col-span-2 h-10 w-full rounded-xl sm:col-span-1 sm:w-auto"
                            />
                        )}
                    </div>
                </div>

                <Pagination
                    links={bookings.links}
                    from={bookings.from}
                    to={bookings.to}
                    total={bookings.total}
                    lastPage={bookings.last_page}
                    perPage={bookings.per_page}
                    variant="summary"
                    className="mb-4"
                />

                {/* Reports Table */}
                <div className="border-border/80 bg-card overflow-hidden rounded-2xl border shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-muted/50 text-muted-foreground border-border/60 border-b text-xs tracking-wider uppercase">
                                <tr>
                                    <th className="px-4 py-3">Kode Booking</th>
                                    <th className="px-4 py-3">Tanggal</th>
                                    <th className="px-4 py-3">Lapangan</th>
                                    <th className="px-4 py-3">Pemesan</th>
                                    <th className="px-4 py-3">Jam</th>
                                    <th className="px-4 py-3">Metode</th>
                                    <th className="px-4 py-3">Total</th>
                                    <th className="px-4 py-3">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-border/40 divide-y">
                                {bookings.data.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={8}
                                            className="text-muted-foreground py-12 text-center"
                                        >
                                            Tidak ada data laporan pada periode
                                            ini.
                                        </td>
                                    </tr>
                                ) : (
                                    bookings.data.map((b) => (
                                        <tr
                                            key={b.id}
                                            className="hover:bg-muted/30 transition-colors"
                                        >
                                            <td className="text-foreground px-4 py-3 font-mono font-bold">
                                                #{b.booking_code}
                                            </td>
                                            <td className="px-4 py-3">
                                                {b.booking_date}
                                            </td>
                                            <td className="text-foreground px-4 py-3 font-semibold">
                                                {b.lapangan?.name}
                                            </td>
                                            <td className="px-4 py-3">
                                                {b.customer_name}
                                            </td>
                                            <td className="px-4 py-3">
                                                {b.start_time} - {b.end_time}
                                            </td>
                                            <td className="px-4 py-3 font-semibold uppercase">
                                                {b.payment_method}
                                            </td>
                                            <td className="text-primary dark:text-primary px-4 py-3 font-bold">
                                                Rp{' '}
                                                {Number(
                                                    b.total_price,
                                                ).toLocaleString('id-ID')}
                                            </td>
                                            <td className="px-4 py-3">
                                                {b.payment_status ===
                                                'approved' ? (
                                                    <Badge className="bg-primary text-primary-foreground text-xs">
                                                        Lunas
                                                    </Badge>
                                                ) : b.payment_status ===
                                                  'pending_validation' ? (
                                                    <Badge className="bg-amber-500 text-xs text-white">
                                                        Validasi
                                                    </Badge>
                                                ) : b.payment_status ===
                                                  'rejected' ? (
                                                    <Badge className="bg-rose-600 text-xs text-white">
                                                        Ditolak
                                                    </Badge>
                                                ) : (
                                                    <Badge
                                                        variant="outline"
                                                        className="text-xs"
                                                    >
                                                        {b.payment_status}
                                                    </Badge>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <Pagination
                    links={bookings.links}
                    from={bookings.from}
                    to={bookings.to}
                    total={bookings.total}
                    lastPage={bookings.last_page}
                    perPage={bookings.per_page}
                    variant="navigation"
                    className="mt-2"
                />
            </div>
        </AppLayout>
    );
}
