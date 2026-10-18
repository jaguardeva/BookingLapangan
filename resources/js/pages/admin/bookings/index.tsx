import { useEffect, useRef, useState } from 'react';
import { useMemo } from 'react';
import { createColumnHelper, rowPaginationFeature, rowSortingFeature, tableFeatures, useTable, type SortingState } from '@tanstack/react-table';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import { ArrowDown, ArrowUp, ArrowUpDown, Search, CheckCircle2, XCircle, Eye, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ResetFilterButton } from '@/components/reset-filter-button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import ConfirmDialog from '@/components/confirm-dialog';
import { Pagination } from '@/components/pagination';
import type { Booking, Lapangan } from '@/types/booking';
import {
    index as bookingsIndex,
    approve as approveAction,
    reject as rejectAction,
} from '@/actions/App/Http/Controllers/Admin/BookingManagementController';
import { createManual as manualCreate } from '@/actions/App/Http/Controllers/Admin/BookingManagementController';

interface Props {
    bookings: {
        data: Booking[];
        links: { url: string | null; label: string; active: boolean }[];
        from?: number | null;
        to?: number | null;
        total: number;
        last_page?: number;
        per_page?: number;
    };
    lapangans: Lapangan[];
    filters: {
        search?: string;
        status?: string;
        lapangan_id?: string;
        date?: string;
        sort?: string;
        direction?: string;
    };
}

const features = tableFeatures({ rowSortingFeature, rowPaginationFeature });
const columnHelper = createColumnHelper<typeof features, Booking>();

function SortIcon({ direction }: { direction: false | 'asc' | 'desc' }) {
    if (direction === 'asc') return <ArrowUp className="size-3.5" />;
    if (direction === 'desc') return <ArrowDown className="size-3.5" />;

    return <ArrowUpDown className="size-3.5 opacity-50" />;
}

const approve = Object.assign((id: number) => approveAction(String(id)), {
    url: (id: number) => approveAction.url(String(id)),
});
const reject = Object.assign((id: number) => rejectAction(String(id)), {
    url: (id: number) => rejectAction.url(String(id)),
});

export default function AdminBookingsIndex({
    bookings,
    lapangans = [],
    filters = {},
}: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [status, setStatus] = useState(filters.status || 'all');
    const [lapanganId, setLapanganId] = useState(filters.lapangan_id || 'all');
    const [date, setDate] = useState(filters.date ?? '');
    const [sorting, setSorting] = useState<SortingState>(
        filters.sort && filters.sort !== 'created_at'
            ? [{ id: filters.sort, desc: filters.direction !== 'asc' }]
            : [],
    );
    const [isFiltering, setIsFiltering] = useState(false);
    const filterKey = JSON.stringify([search, status, lapanganId, date, sorting]);
    const lastKey = useRef(filterKey);
    const hasActiveFilters =
        search.trim() !== '' ||
        status !== 'all' ||
        lapanganId !== 'all' ||
        date !== '';
    const [approveBooking, setApproveBooking] = useState<Booking | null>(null);
    const [rejectBooking, setRejectBooking] = useState<Booking | null>(null);
    const [reason, setReason] = useState(
        'Nominal transfer tidak sesuai dengan kode unik yang tertera.',
    );

    useEffect(() => {
        if (lastKey.current === filterKey) return;
        const timeout = window.setTimeout(() => {
            lastKey.current = filterKey;
            const activeSort = sorting[0];
            setIsFiltering(true);
            router.get(bookingsIndex.url({
                query: {
                    search: search.trim() || undefined,
                    status: status === 'all' ? undefined : status,
                    lapangan_id: lapanganId === 'all' ? undefined : lapanganId,
                    date: date || undefined,
                    sort: activeSort?.id ?? 'created_at',
                    direction: activeSort ? (activeSort.desc ? 'desc' : 'asc') : 'desc',
                    page: 1,
                },
            }), {}, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                onFinish: () => setIsFiltering(false),
            });
        }, 300);
        return () => window.clearTimeout(timeout);
    }, [filterKey, search, status, lapanganId, date, sorting]);

    const resetFilters = () => {
        setSearch('');
        setStatus('all');
        setLapanganId('all');
        setDate('');
        setSorting([]);
    };

    const columns = useMemo(() => columnHelper.columns([
        columnHelper.accessor('booking_code', {
            header: ({ column }) => <button type="button" onClick={() => column.toggleSorting()} className="inline-flex items-center gap-1.5 hover:text-foreground">Kode Booking <SortIcon direction={column.getIsSorted()} /></button>,
            cell: ({ row }) => <><Link href={`/booking/${row.original.booking_code}`} target="_blank" className="font-mono font-bold hover:underline">#{row.original.booking_code}</Link><span className="text-muted-foreground block uppercase">{row.original.payment_method}</span></>,
        }),
        columnHelper.display({
            id: 'source',
            header: 'Sumber',
            enableSorting: false,
            cell: ({ row }) => isMembershipBooking(row.original) ? <Badge variant="secondary">Membership</Badge> : <Badge variant="outline">Booking harian</Badge>,
        }),
        columnHelper.accessor((row) => row.lapangan?.name ?? '', {
            id: 'lapangan',
            header: 'Lapangan',
            enableSorting: false,
            cell: ({ row }) => <><p className="font-semibold">{row.original.lapangan?.name}</p><span className="text-muted-foreground">{row.original.lapangan?.category?.name}</span></>,
        }),
        columnHelper.accessor('customer_name', {
            header: 'Pemesan',
            enableSorting: false,
            cell: ({ row }) => <><p className="font-semibold">{row.original.customer_name}</p><span className="text-muted-foreground">{row.original.customer_phone}</span></>,
        }),
        columnHelper.accessor('booking_date', {
            header: ({ column }) => <button type="button" onClick={() => column.toggleSorting()} className="inline-flex items-center gap-1.5 hover:text-foreground">Jadwal Main <SortIcon direction={column.getIsSorted()} /></button>,
            cell: ({ row }) => <><p className="font-medium">{row.original.booking_date}</p><span className="text-muted-foreground">{row.original.start_time} - {row.original.end_time} WIB</span></>,
        }),
        columnHelper.accessor('total_price', {
            header: ({ column }) => <button type="button" onClick={() => column.toggleSorting()} className="inline-flex items-center gap-1.5 hover:text-foreground">Total Bayar <SortIcon direction={column.getIsSorted()} /></button>,
            cell: ({ row }) => <span className="text-primary font-bold">Rp {Number(row.original.total_price).toLocaleString('id-ID')}</span>,
        }),
        columnHelper.accessor('payment_status', {
            header: ({ column }) => <button type="button" onClick={() => column.toggleSorting()} className="inline-flex items-center gap-1.5 hover:text-foreground">Status <SortIcon direction={column.getIsSorted()} /></button>,
            cell: ({ row }) => statusBadge(row.original.payment_status),
        }),
        columnHelper.display({
            id: 'actions',
            header: 'Aksi',
            enableSorting: false,
            cell: ({ row }) => {
                const booking = row.original;

                return <div className="flex items-center gap-1.5">
                    <Button asChild size="sm" variant="ghost"><Link href={`/booking/${booking.booking_code}`} target="_blank"><Eye className="size-4" /></Link></Button>
                    {isMembershipBooking(booking) ? <span className="text-muted-foreground max-w-28 text-center text-[11px] leading-tight">Kelola di Membership</span> : (booking.payment_status === 'pending' || booking.payment_status === 'pending_validation') && <>
                        <Button size="sm" onClick={() => setApproveBooking(booking)}><CheckCircle2 className="size-3.5" />Setujui</Button>
                        <Button size="sm" variant="outline" onClick={() => setRejectBooking(booking)}><XCircle className="size-4" /></Button>
                    </>}
                </div>;
            },
        }),
    ]), []);

    const table = useTable({
        features,
        data: bookings.data,
        columns,
        state: { sorting },
        onSortingChange: setSorting,
        manualSorting: true,
        manualPagination: true,
        rowCount: bookings.total,
    });

    const statusBadge = (value: string) =>
        value === 'approved' ? (
            <Badge className="bg-primary text-primary-foreground">
                Terkonfirmasi
            </Badge>
        ) : value === 'pending_validation' ? (
            <Badge className="bg-amber-500 text-white">Perlu Validasi</Badge>
        ) : value === 'rejected' ? (
            <Badge className="bg-rose-600 text-white">Ditolak</Badge>
        ) : value === 'cancelled' ? (
            <Badge variant="destructive">Dibatalkan</Badge>
        ) : (
            <Badge className="bg-sky-600 text-white">Menunggu Bayar</Badge>
        );

    const isMembershipBooking = (booking: Booking) =>
        Boolean(
            booking.is_membership ||
                booking.membership_id ||
                booking.booking_source === 'membership',
        );

    return (
        <AdminLayout
            breadcrumbs={[
                { title: 'Admin Workspace', href: '/admin' },
                { title: 'Validasi & Booking', href: '/admin/bookings' },
            ]}
        >
            <Head title="Manajemen Booking & Validasi" />
            <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            Manajemen Booking & Validasi Pembayaran
                        </h1>
                        <p className="text-muted-foreground mt-1 text-sm">
                            Total {bookings.total} pesanan tercatat.
                        </p>
                    </div>
                    <Button asChild className="rounded-xl">
                        <Link href={manualCreate.url()}>
                            <Plus className="size-4" />
                            Booking Manual
                        </Link>
                    </Button>
                </div>
                <div className="border-border/80 bg-card rounded-2xl border p-4 shadow-sm">
                    <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center">
                        <div className="relative flex-1">
                            <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                            <Input
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                placeholder="Cari kode booking, nama, atau telepon..."
                                className="pl-9"
                            />
                        </div>
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger className="md:w-48">
                                <SelectValue placeholder="Semua status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">
                                    Semua status
                                </SelectItem>
                                <SelectItem value="pending_validation">
                                    Perlu validasi
                                </SelectItem>
                                <SelectItem value="pending">
                                    Menunggu bayar
                                </SelectItem>
                                <SelectItem value="approved">
                                    Terkonfirmasi
                                </SelectItem>
                                <SelectItem value="rejected">
                                    Ditolak
                                </SelectItem>
                                <SelectItem value="cancelled">
                                    Dibatalkan
                                </SelectItem>
                            </SelectContent>
                        </Select>
                        <Select
                            value={lapanganId}
                            onValueChange={setLapanganId}
                        >
                            <SelectTrigger className="md:w-52">
                                <SelectValue placeholder="Semua lapangan" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">
                                    Semua lapangan
                                </SelectItem>
                                {lapangans.map((item) => (
                                    <SelectItem
                                        key={item.id}
                                        value={String(item.id)}
                                    >
                                        {item.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Input
                            type="date"
                            value={date}
                            onChange={(event) => setDate(event.target.value)}
                            className="md:w-40"
                        />
                        {hasActiveFilters && (
                            <ResetFilterButton
                                onClick={resetFilters}
                                className="h-10 w-full shrink-0 rounded-xl md:w-auto"
                            />
                        )}
                        {isFiltering && <span className="text-muted-foreground text-xs">Memuat data...</span>}
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

                <div className="border-border/80 bg-card overflow-x-auto rounded-2xl border shadow-sm" aria-busy={isFiltering}>
                    <table className="w-full text-left text-xs">
                        <thead className="border-border/60 bg-muted/50 text-muted-foreground border-b tracking-wider uppercase">
                            <tr>
                                {table.getHeaderGroups().map((headerGroup) => headerGroup.headers.map((header) => (
                                    <th key={header.id} className={`px-4 py-3 ${header.column.id === 'actions' ? 'text-right' : ''}`}>
                                        {header.isPlaceholder ? null : <table.FlexRender header={header} />}
                                    </th>
                                )))}
                            </tr>
                        </thead>
                        <tbody className="divide-border/40 divide-y">
                            {table.getRowModel().rows.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={8}
                                        className="text-muted-foreground py-12 text-center"
                                    >
                                        Tidak ada data booking.
                                    </td>
                                </tr>
                            ) : (
                                table.getRowModel().rows.map((row) => {
                                    const booking = row.original;

                                    return (
                                    <tr
                                        key={booking.id}
                                        className="hover:bg-muted/30 transition-colors"
                                    >
                                        <td className="px-4 py-3.5">
                                            <Link
                                                href={`/booking/${booking.booking_code}`}
                                                target="_blank"
                                                className="font-mono font-bold hover:underline"
                                            >
                                                #{booking.booking_code}
                                            </Link>
                                            <span className="text-muted-foreground block uppercase">
                                                {booking.payment_method}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3.5">
                                            {isMembershipBooking(booking) ? (
                                                <Badge variant="secondary">Membership</Badge>
                                            ) : (
                                                <Badge variant="outline">Booking harian</Badge>
                                            )}
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <p className="font-semibold">
                                                {booking.lapangan?.name}
                                            </p>
                                            <span className="text-muted-foreground">
                                                {
                                                    booking.lapangan?.category
                                                        ?.name
                                                }
                                            </span>
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <p className="font-semibold">
                                                {booking.customer_name}
                                            </p>
                                            <span className="text-muted-foreground">
                                                {booking.customer_phone}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <p className="font-medium">
                                                {booking.booking_date}
                                            </p>
                                            <span className="text-muted-foreground">
                                                {booking.start_time} -{' '}
                                                {booking.end_time} WIB
                                            </span>
                                        </td>
                                        <td className="text-primary px-4 py-3.5 font-bold">
                                            Rp{' '}
                                            {Number(
                                                booking.total_price,
                                            ).toLocaleString('id-ID')}
                                        </td>
                                        <td className="px-4 py-3.5">
                                            {statusBadge(
                                                booking.payment_status,
                                            )}
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <div className="flex items-center gap-1.5">
                                                <Button
                                                    asChild
                                                    size="sm"
                                                    variant="ghost"
                                                >
                                                    <Link
                                                        href={`/booking/${booking.booking_code}`}
                                                        target="_blank"
                                                    >
                                                        <Eye className="size-4" />
                                                    </Link>
                                                </Button>
                                                {isMembershipBooking(booking) ? (
                                                    <span className="text-muted-foreground max-w-28 text-center text-[11px] leading-tight">
                                                        Kelola di Membership
                                                    </span>
                                                ) : (booking.payment_status ===
                                                    'pending' ||
                                                    booking.payment_status ===
                                                        'pending_validation') && (
                                                    <>
                                                        <Button
                                                            size="sm"
                                                            onClick={() =>
                                                                setApproveBooking(
                                                                    booking,
                                                                )
                                                            }
                                                        >
                                                            <CheckCircle2 className="size-3.5" />
                                                            Setujui
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() =>
                                                                setRejectBooking(
                                                                    booking,
                                                                )
                                                            }
                                                        >
                                                            <XCircle className="size-4" />
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
                <Pagination
                    links={bookings.links}
                    from={bookings.from}
                    to={bookings.to}
                    total={bookings.total}
                    lastPage={bookings.last_page}
                    perPage={bookings.per_page}
                    variant="navigation"
                />
            </div>
            <ConfirmDialog
                open={approveBooking !== null}
                onOpenChange={(open) => !open && setApproveBooking(null)}
                title="Setujui pembayaran?"
                description={`Pembayaran booking #${approveBooking?.booking_code} akan disetujui.`}
                confirmLabel="Setujui"
                icon={CheckCircle2}
                onConfirm={() => {
                    if (approveBooking)
                        router.post(
                            approve.url(approveBooking.id),
                            {},
                            { onFinish: () => setApproveBooking(null) },
                        );
                }}
            />
            <Dialog
                open={rejectBooking !== null}
                onOpenChange={(open) => !open && setRejectBooking(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Tolak pembayaran</DialogTitle>
                    </DialogHeader>
                    <form
                        onSubmit={(event) => {
                            event.preventDefault();
                            if (rejectBooking)
                                router.post(
                                    reject.url(rejectBooking.id),
                                    { reason },
                                    { onFinish: () => setRejectBooking(null) },
                                );
                        }}
                        className="space-y-4"
                    >
                        <Label htmlFor="reason">Alasan</Label>
                        <Textarea
                            id="reason"
                            value={reason}
                            onChange={(event) => setReason(event.target.value)}
                            required
                        />
                        <Button type="submit" className="w-full">
                            Tolak Pembayaran
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}
