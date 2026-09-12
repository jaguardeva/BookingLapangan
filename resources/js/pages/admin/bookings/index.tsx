import { Head, Link, router, useForm } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
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
    Plus,
    ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import { manual as manualBooking } from '@/routes/admin/bookings/index';
import { slots as lapanganSlots } from '@/routes/lapangan/index';

const getLocalDateString = (date: Date = new Date()): string => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

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
    const [isManualBookingOpen, setIsManualBookingOpen] = useState(() =>
        typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('manual') === '1'
    );
    const [manualBookings, setManualBookings] = useState<{ start_time: string; end_time: string }[]>([]);
    const [manualSelectedSlots, setManualSelectedSlots] = useState<string[]>([]);
    const [isLoadingManualSlots, setIsLoadingManualSlots] = useState(false);
    const [isLapanganPickerOpen, setIsLapanganPickerOpen] = useState(false);
    const [lapanganSearch, setLapanganSearch] = useState('');
    const manualForm = useForm({
        lapangan_id: '',
        booking_date: getLocalDateString(),
        start_time: '',
        duration_hours: '1',
        customer_name: '',
        customer_phone: '',
        customer_email: '',
        notes: '',
    });

    const selectedManualLapangan = lapangans.find((lapangan) => String(lapangan.id) === manualForm.data.lapangan_id);
    const manualDates = useMemo(() => {
        const today = new Date();
        return [0, 1, 2].map((offset) => {
            const date = new Date(today);
            date.setDate(today.getDate() + offset);
            return {
                value: getLocalDateString(date),
                label: offset === 0 ? 'Hari ini' : offset === 1 ? 'Besok' : 'Lusa',
                detail: date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
            };
        });
    }, []);
    const filteredLapangans = lapangans.filter((lapangan) => lapangan.name.toLowerCase().includes(lapanganSearch.toLowerCase()));
    const manualHourlySlots = useMemo(() => {
        if (!selectedManualLapangan?.operational_start || !selectedManualLapangan.operational_end) return [];
        const slots: { start: string; end: string }[] = [];
        let hour = Number(selectedManualLapangan.operational_start.slice(0, 2));
        const endHour = Number(selectedManualLapangan.operational_end.slice(0, 2));
        while (hour < endHour) {
            slots.push({ start: `${String(hour).padStart(2, '0')}:00`, end: `${String(hour + 1).padStart(2, '0')}:00` });
            hour += 1;
        }
        return slots;
    }, [selectedManualLapangan]);

    useEffect(() => {
        if (!isManualBookingOpen || !manualForm.data.lapangan_id || !manualForm.data.booking_date) {
            setManualBookings([]);
            return;
        }

        const controller = new AbortController();
        setIsLoadingManualSlots(true);
        fetch(lapanganSlots.url(manualForm.data.lapangan_id, { query: { date: manualForm.data.booking_date } }), {
            headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            credentials: 'same-origin',
            signal: controller.signal,
        })
            .then((response) => response.ok ? response.json() : Promise.reject(new Error('Gagal memuat slot')))
            .then((data) => setManualBookings(data.bookings ?? []))
            .catch((error: Error) => { if (error.name !== 'AbortError') setManualBookings([]); })
            .finally(() => setIsLoadingManualSlots(false));

        return () => controller.abort();
    }, [isManualBookingOpen, manualForm.data.lapangan_id, manualForm.data.booking_date]);

    const currentDate = new Date();
    const manualIsToday = manualForm.data.booking_date === getLocalDateString(currentDate);
    const currentTime = `${String(currentDate.getHours()).padStart(2, '0')}:${String(currentDate.getMinutes()).padStart(2, '0')}`;
    const isManualSlotBooked = (start: string, end: string) => manualBookings.some((booking) => booking.start_time.slice(0, 5) < end && booking.end_time.slice(0, 5) > start);
    const isManualSlotPast = (start: string) => manualIsToday && start <= currentTime;
    const syncManualSelection = (selection: string[]) => {
        setManualSelectedSlots(selection);
        manualForm.setData('start_time', selection[0] ?? '');
        manualForm.setData('duration_hours', String(selection.length || 1));
    };
    const handleManualSlotClick = (start: string) => {
        const allStarts = manualHourlySlots.map((slot) => slot.start);

        // Keep the selection contiguous: clicking inside the range trims its end.
        if (manualSelectedSlots.includes(start)) {
            const selectedIndexes = manualSelectedSlots.map((slot) => allStarts.indexOf(slot)).filter((index) => index >= 0);
            const clickedIndex = allStarts.indexOf(start);
            const firstIndex = Math.min(...selectedIndexes);
            syncManualSelection(allStarts.slice(firstIndex, clickedIndex + 1));
            return;
        }

        if (manualSelectedSlots.length === 0) {
            syncManualSelection([start]);
            return;
        }

        const clickedIndex = allStarts.indexOf(start);
        const selectedIndexes = manualSelectedSlots.map((slot) => allStarts.indexOf(slot));
        const minIndex = Math.min(clickedIndex, ...selectedIndexes);
        const maxIndex = Math.max(clickedIndex, ...selectedIndexes);
        const contiguousSelection = manualHourlySlots.slice(minIndex, maxIndex + 1);
        const hasGap = contiguousSelection.some((slot) => isManualSlotBooked(slot.start, slot.end) || isManualSlotPast(slot.start));

        syncManualSelection(hasGap ? [start] : contiguousSelection.slice(0, 6).map((slot) => slot.start));
    };

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
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">
                            Manajemen Booking & Validasi Pembayaran
                        </h1>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Total {bookings.total} pesanan tercatat. Verifikasi kode validasi pembayaran untuk mengonfirmasi jadwal bermain.
                        </p>
                    </div>
                    <Button
                        type="button"
                        onClick={() => setIsManualBookingOpen(true)}
                        className="h-9 w-full rounded-xl bg-emerald-600 text-xs text-white hover:bg-emerald-500 sm:w-auto"
                    >
                        <Plus className="mr-1.5 size-4" /> Booking Manual
                    </Button>
                </div>

                {/* Filter Toolbar */}
                <div className="rounded-2xl border border-border/80 bg-card p-3 shadow-sm sm:p-4">
                    <form onSubmit={handleSearchSubmit} className="flex flex-col gap-3 md:flex-row md:items-end">
                        <div className="relative w-full min-w-0 flex-1">
                            <Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                            <Input
                                placeholder="Cari kode booking, nama pemesan, atau no telepon..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="h-10 rounded-xl pl-9 text-sm"
                            />
                        </div>

                        <div className="grid w-full grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:items-end md:w-auto">
                            {/* Status Filter */}
                            <Select value={selectedStatus} onValueChange={(value) => {
                                setSelectedStatus(value);
                                applyFilters({ status: value !== 'all' ? value : '' });
                            }}>
                                <SelectTrigger className="h-10 w-full min-w-0 rounded-xl text-sm sm:w-auto"><SelectValue placeholder="Semua status" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua status</SelectItem>
                                    <SelectItem value="pending_validation">Perlu validasi</SelectItem>
                                    <SelectItem value="pending">Menunggu bayar</SelectItem>
                                    <SelectItem value="approved">Terkonfirmasi (lunas)</SelectItem>
                                    <SelectItem value="rejected">Ditolak</SelectItem>
                                    <SelectItem value="cancelled">Dibatalkan</SelectItem>
                                </SelectContent>
                            </Select>

                            {/* Lapangan Filter */}
                            <Select value={selectedLapangan} onValueChange={(value) => {
                                setSelectedLapangan(value);
                                applyFilters({ lapangan_id: value !== 'all' ? value : '' });
                            }}>
                                <SelectTrigger className="h-10 w-full min-w-0 rounded-xl text-sm sm:w-auto"><SelectValue placeholder="Semua lapangan" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua lapangan</SelectItem>
                                    {lapangans.map((lapangan) => <SelectItem key={lapangan.id} value={String(lapangan.id)}>{lapangan.name}</SelectItem>)}
                                </SelectContent>
                            </Select>

                            {/* Date Filter */}
                            <Input
                                type="date"
                                value={selectedDate}
                                onChange={(event) => {
                                    setSelectedDate(event.target.value);
                                    applyFilters({ date: event.target.value });
                                }}
                                className="h-10 w-full min-w-0 rounded-xl text-sm sm:w-36"
                            />

                            <Button type="submit" size="sm" className="col-span-2 h-10 w-full rounded-xl bg-emerald-600 text-sm text-white hover:bg-emerald-500 sm:col-span-1 sm:w-auto">
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

            <Dialog open={isManualBookingOpen} onOpenChange={setIsManualBookingOpen}>
                <DialogContent className="max-h-[92vh] overflow-y-auto rounded-2xl border-border p-5 sm:max-w-2xl sm:p-7">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold">Booking Manual / Walk-in</DialogTitle>
                        <DialogDescription className="text-xs">
                            Buat booking untuk pelanggan yang datang langsung ke lapangan. Pembayaran dicatat sebagai cash dan langsung dikonfirmasi.
                        </DialogDescription>
                    </DialogHeader>

                    <form
                        onSubmit={(event) => {
                            event.preventDefault();
                            manualForm.post(manualBooking.url(), {
                                preserveScroll: true,
                                onSuccess: () => {
                                    setIsManualBookingOpen(false);
                                    setManualSelectedSlots([]);
                                    manualForm.reset();
                                },
                            });
                        }}
                        className="grid gap-5 pt-3 text-xs"
                    >
                        <div className="grid gap-5 sm:grid-cols-2">
                            <div className="flex flex-col gap-2 sm:col-span-2">
                                <Label htmlFor="manual_lapangan_id" className="text-sm font-medium leading-none">Lapangan</Label>
                                <div className="relative">
                                    <button
                                        id="manual_lapangan_id"
                                        type="button"
                                        onClick={() => setIsLapanganPickerOpen((open) => !open)}
                                        className="flex h-10 w-full items-center justify-between rounded-xl border border-input bg-background px-3 text-left text-sm shadow-xs transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    >
                                        <span className={selectedManualLapangan ? 'text-foreground' : 'text-muted-foreground'}>
                                            {selectedManualLapangan?.name ?? 'Pilih lapangan'}
                                        </span>
                                        <ChevronDown className="size-4 text-muted-foreground" />
                                    </button>
                                    {isLapanganPickerOpen && (
                                        <div className="absolute inset-x-0 top-12 z-50 rounded-xl border border-border bg-popover p-2 shadow-xl">
                                            <Input
                                                autoFocus
                                                value={lapanganSearch}
                                                onChange={(event) => setLapanganSearch(event.target.value)}
                                                placeholder="Cari nama lapangan..."
                                                className="mb-2 h-10 rounded-lg text-sm"
                                            />
                                            <div className="max-h-48 overflow-y-auto">
                                                {filteredLapangans.length === 0 ? (
                                                    <p className="p-3 text-xs text-muted-foreground">Lapangan tidak ditemukan.</p>
                                                ) : filteredLapangans.map((lapangan) => (
                                                    <button
                                                        key={lapangan.id}
                                                        type="button"
                                                        onClick={() => {
                                                            manualForm.setData('lapangan_id', String(lapangan.id));
                                                            syncManualSelection([]);
                                                            setIsLapanganPickerOpen(false);
                                                            setLapanganSearch('');
                                                        }}
                                                        className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-xs transition hover:bg-accent ${String(lapangan.id) === manualForm.data.lapangan_id ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : ''}`}
                                                    >
                                                        <span className="font-medium">{lapangan.name}</span>
                                                        <span className="text-[11px] text-muted-foreground">Rp {Number(lapangan.price_per_hour).toLocaleString('id-ID')}/jam</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                {manualForm.errors.lapangan_id && <p className="text-xs leading-4 text-rose-500">{manualForm.errors.lapangan_id}</p>}
                            </div>

                            <div className="flex flex-col gap-2 sm:col-span-2">
                                <Label className="text-sm font-medium leading-none">Tanggal bermain</Label>
                                <div className="grid grid-cols-3 gap-2">
                                    {manualDates.map((date) => {
                                        const checked = manualForm.data.booking_date === date.value;
                                        return (
                                            <label key={date.value} className={`relative flex cursor-pointer flex-col gap-1 rounded-xl border p-3 transition ${checked ? 'border-emerald-600 bg-emerald-500/10 ring-2 ring-emerald-500/20' : 'border-border bg-card hover:border-emerald-500/50'}`}>
                                                <input
                                                    type="radio"
                                                    name="manual_booking_date"
                                                    value={date.value}
                                                    checked={checked}
                                                    onChange={(event) => {
                                                        manualForm.setData('booking_date', event.target.value);
                                                        syncManualSelection([]);
                                                    }}
                                                    className="sr-only"
                                                />
                                                <span className={`text-sm font-semibold ${checked ? 'text-emerald-700 dark:text-emerald-300' : 'text-foreground'}`}>{date.label}</span>
                                                <span className="text-xs text-muted-foreground">{date.detail}</span>
                                                <span className={`absolute right-3 top-3 size-3 rounded-full border ${checked ? 'border-emerald-600 bg-emerald-600 ring-2 ring-emerald-600/20' : 'border-muted-foreground/40'}`} />
                                            </label>
                                        );
                                    })}
                                </div>
                                {manualForm.errors.booking_date && <p className="text-xs leading-4 text-rose-500">{manualForm.errors.booking_date}</p>}
                            </div>

                            <div className="flex flex-col gap-2 sm:col-span-2">
                                <div className="flex items-center justify-between">
                                    <Label className="text-sm font-medium leading-none">Pilih slot tersedia</Label>
                                    <span className="text-[11px] text-muted-foreground">{isLoadingManualSlots ? 'Memuat...' : 'Maks. 6 jam, harus berurutan'}</span>
                                </div>
                                {!manualForm.data.booking_date || !manualForm.data.lapangan_id ? (
                                    <p className="rounded-xl border border-dashed border-border p-3 text-xs text-muted-foreground">Pilih lapangan dan tanggal untuk melihat slot.</p>
                                ) : (
                                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                                        {manualHourlySlots.map((slot) => {
                                            const booked = isManualSlotBooked(slot.start, slot.end);
                                            const past = isManualSlotPast(slot.start);
                                            const selected = manualSelectedSlots.includes(slot.start);
                                            const disabled = booked || past;
                                            return (
                                                <button
                                                    key={slot.start}
                                                    type="button"
                                                    disabled={disabled}
                                                    onClick={() => handleManualSlotClick(slot.start)}
                                                    className={`rounded-xl border px-2 py-2 text-left text-xs transition ${selected ? 'border-emerald-600 bg-emerald-600 text-white' : disabled ? 'cursor-not-allowed border-border/40 bg-muted/40 text-muted-foreground/50' : 'border-border bg-card hover:border-emerald-500'}`}
                                                >
                                                    <span className="font-semibold">{slot.start} - {slot.end}</span>
                                                    <span className="mt-0.5 block text-[11px]">{selected ? 'Terpilih' : booked ? 'Terisi' : past ? 'Lewat' : 'Tersedia'}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                                {manualForm.errors.start_time && <p className="text-xs leading-4 text-rose-500">{manualForm.errors.start_time}</p>}
                            </div>

                            <div className="flex flex-col gap-2 sm:col-span-2">
                                <Label htmlFor="manual_customer_name" className="text-sm font-medium leading-none">Nama pelanggan</Label>
                                <Input
                                    id="manual_customer_name"
                                    value={manualForm.data.customer_name}
                                    onChange={(event) => manualForm.setData('customer_name', event.target.value)}
                                    placeholder="Nama pelanggan"
                                    className="h-10 rounded-xl text-sm"
                                    required
                                />
                                {manualForm.errors.customer_name && <p className="text-xs leading-4 text-rose-500">{manualForm.errors.customer_name}</p>}
                            </div>

                            <div className="flex flex-col gap-2">
                                <Label htmlFor="manual_customer_phone" className="text-sm font-medium leading-none">Nomor HP / WhatsApp</Label>
                                <Input
                                    id="manual_customer_phone"
                                    value={manualForm.data.customer_phone}
                                    onChange={(event) => manualForm.setData('customer_phone', event.target.value)}
                                    placeholder="08xxxxxxxxxx"
                                    className="h-10 rounded-xl text-sm"
                                    required
                                />
                                {manualForm.errors.customer_phone && <p className="text-xs leading-4 text-rose-500">{manualForm.errors.customer_phone}</p>}
                            </div>

                            <div className="flex flex-col gap-2">
                                <Label htmlFor="manual_customer_email" className="text-sm font-medium leading-none">Email <span className="font-normal text-muted-foreground">(opsional)</span></Label>
                                <Input
                                    id="manual_customer_email"
                                    type="email"
                                    value={manualForm.data.customer_email}
                                    onChange={(event) => manualForm.setData('customer_email', event.target.value)}
                                    placeholder="pelanggan@email.com"
                                    className="h-10 rounded-xl text-sm"
                                />
                                {manualForm.errors.customer_email && <p className="text-xs leading-4 text-rose-500">{manualForm.errors.customer_email}</p>}
                            </div>

                            <div className="flex flex-col gap-2 sm:col-span-2">
                                <Label htmlFor="manual_notes" className="text-sm font-medium leading-none">Catatan <span className="font-normal text-muted-foreground">(opsional)</span></Label>
                                <Textarea
                                    id="manual_notes"
                                    value={manualForm.data.notes}
                                    onChange={(event) => manualForm.setData('notes', event.target.value)}
                                    placeholder="Catatan tambahan untuk booking ini"
                                    rows={3}
                                    className="min-h-24 rounded-xl text-sm"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                            <Button type="button" variant="outline" onClick={() => setIsManualBookingOpen(false)} className="w-full rounded-xl sm:w-auto">
                                Batal
                            </Button>
                            <Button type="submit" disabled={manualForm.processing} className="w-full rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 sm:w-auto">
                                {manualForm.processing ? 'Menyimpan...' : 'Simpan Booking Manual'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

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
                            <Select value={rejectionReason} onValueChange={setRejectionReason}>
                                <SelectTrigger className="h-10 w-full rounded-xl text-sm"><SelectValue placeholder="Pilih template alasan" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Nominal transfer tidak sesuai dengan kode unik yang tertera.">Nominal transfer tidak sesuai kode unik</SelectItem>
                                    <SelectItem value="Bukti transfer tidak dapat diverifikasi pada mutasi bank kami.">Transfer belum masuk di mutasi rekening</SelectItem>
                                    <SelectItem value="Pembayaran melewati batas waktu (deadline) yang ditentukan.">Melewati batas waktu pembayaran</SelectItem>
                                    <SelectItem value="Lainnya">Lainnya</SelectItem>
                                </SelectContent>
                            </Select>

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
