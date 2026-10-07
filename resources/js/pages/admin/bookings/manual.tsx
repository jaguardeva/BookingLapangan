import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { CalendarPlus, Check, Clock, ImageOff, LockKeyhole, RotateCcw, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { Lapangan } from '@/types/booking';
import { index as bookingsIndex, storeManual as manualBooking } from '@/actions/App/Http/Controllers/Admin/BookingManagementController';
import { slots as lapanganSlots } from '@/routes/lapangan/index';

interface Props { lapangans: Lapangan[]; }
interface Slot { start_time: string; end_time: string; }

const localDate = (date = new Date()): string => [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');

export default function AdminManualBooking({ lapangans }: Props) {
    const form = useForm({ lapangan_id: '', booking_date: localDate(), start_time: '', duration_hours: '1', customer_name: '', customer_phone: '', customer_email: '', notes: '' });
    const [bookings, setBookings] = useState<Slot[]>([]);
    const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [searchInput, setSearchInput] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [currentTime, setCurrentTime] = useState(() => new Date());
    const lapangan = lapangans.find((item) => String(item.id) === form.data.lapangan_id);
    const categories = useMemo(() => {
        const categoryMap = new Map<string, string>();
        lapangans.forEach((item) => { if (item.category?.id && item.category.name) categoryMap.set(item.category.id, item.category.name); });
        return Array.from(categoryMap, ([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name, 'id'));
    }, [lapangans]);
    const filteredLapangans = useMemo(() => {
        const query = debouncedSearch.trim().toLocaleLowerCase('id-ID');
        return lapangans.filter((item) => {
            const matchesSearch = !query || item.name.toLocaleLowerCase('id-ID').includes(query) || item.category?.name?.toLocaleLowerCase('id-ID').includes(query);
            return matchesSearch && (categoryFilter === 'all' || item.category?.id === categoryFilter);
        });
    }, [categoryFilter, debouncedSearch, lapangans]);
    const dates = useMemo(() => [0, 1, 2].map((offset) => {
        const date = new Date();
        date.setDate(date.getDate() + offset);
        return { value: localDate(date), label: offset === 0 ? 'Hari ini' : offset === 1 ? 'Besok' : 'Lusa', detail: date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }) };
    }), []);
    const slots = useMemo(() => {
        if (!lapangan) return [];
        const result: Slot[] = [];
        for (let hour = Number(lapangan.operational_start.slice(0, 2)); hour < Number(lapangan.operational_end.slice(0, 2)); hour += 1) result.push({ start_time: String(hour).padStart(2, '0') + ':00', end_time: String(hour + 1).padStart(2, '0') + ':00' });
        return result;
    }, [lapangan]);
    const isToday = form.data.booking_date === localDate(currentTime);
    const currentTimeValue = String(currentTime.getHours()).padStart(2, '0') + ':' + String(currentTime.getMinutes()).padStart(2, '0');
    const isBooked = (slot: Slot): boolean => bookings.some((booking) => booking.start_time.slice(0, 5) < slot.end_time && booking.end_time.slice(0, 5) > slot.start_time);
    const isPast = (slot: Slot): boolean => isToday && slot.start_time <= currentTimeValue;
    const visibleSlots = slots.filter((slot) => !isPast(slot));

    useEffect(() => {
        const timeout = window.setTimeout(() => setDebouncedSearch(searchInput), 300);
        return () => window.clearTimeout(timeout);
    }, [searchInput]);
    useEffect(() => {
        const interval = window.setInterval(() => setCurrentTime(new Date()), 60_000);
        return () => window.clearInterval(interval);
    }, []);
    useEffect(() => {
        if (!lapangan || !form.data.booking_date) { setBookings([]); return; }
        const controller = new AbortController();
        setLoadingSlots(true);
        fetch(lapanganSlots.url(lapangan.id, { query: { date: form.data.booking_date } }), { headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' }, credentials: 'same-origin', signal: controller.signal })
            .then((response) => response.ok ? response.json() : Promise.reject(new Error('failed')))
            .then((data) => setBookings(data.bookings ?? []))
            .catch((error: Error) => { if (error.name !== 'AbortError') setBookings([]); })
            .finally(() => setLoadingSlots(false));
        return () => controller.abort();
    }, [lapangan, form.data.booking_date]);

    const resetFilters = () => { setSearchInput(''); setDebouncedSearch(''); setCategoryFilter('all'); };
    const resetTimeSelection = () => { setSelectedSlots([]); form.setData({ ...form.data, start_time: '', duration_hours: '1' }); };
    const selectLapangan = (id: string) => { form.setData({ ...form.data, lapangan_id: id, start_time: '', duration_hours: '1' }); setSelectedSlots([]); };
    const selectDate = (date: string) => { form.setData({ ...form.data, booking_date: date, start_time: '', duration_hours: '1' }); setSelectedSlots([]); };
    const selectSlot = (start: string) => {
        const starts = slots.map((slot) => slot.start_time);
        const index = starts.indexOf(start);
        const selectedIndexes = selectedSlots.map((slot) => starts.indexOf(slot));
        if (selectedSlots.includes(start)) {
            const first = Math.min(...selectedIndexes);
            const next = starts.slice(first, index + 1);
            setSelectedSlots(next);
            form.setData({ ...form.data, start_time: next[0] ?? '', duration_hours: String(next.length || 1) });
            return;
        }
        const first = selectedSlots.length ? Math.min(index, ...selectedIndexes) : index;
        const last = selectedSlots.length ? Math.max(index, ...selectedIndexes) : index;
        const range = slots.slice(first, last + 1);
        const next = range.some((slot) => isBooked(slot) || isPast(slot)) ? [start] : range.map((slot) => slot.start_time);
        setSelectedSlots(next);
        form.setData({ ...form.data, start_time: next[0] ?? '', duration_hours: String(next.length || 1) });
    };
    const selectSlotFromDoubleClick = (start: string) => {
        const slot = slots.find((item) => item.start_time === start);
        if (!slot || isBooked(slot) || isPast(slot)) return;
        setSelectedSlots([start]);
        form.setData({ ...form.data, start_time: start, duration_hours: '1' });
    };
    const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); form.post(manualBooking.url(), { onSuccess: () => router.visit(bookingsIndex.url()) }); };

    return (
        <AppLayout breadcrumbs={[{ title: 'Admin Workspace', href: '/admin' }, { title: 'Validasi & Booking', href: bookingsIndex.url() }, { title: 'Booking Manual', href: manualBooking.url() }]}>
            <Head title="Booking Manual" />
            <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
                <div><h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight"><CalendarPlus className="size-6 text-primary" />Booking Manual</h1><p className="mt-1 text-sm text-muted-foreground">Buat booking walk-in dengan pembayaran cash yang langsung dikonfirmasi.</p></div>
                <form onSubmit={submit} className="max-w-6xl space-y-6">
                    <section className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm sm:p-7">
                        <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Langkah 1</p><Label className="mt-1 block text-lg font-bold">Pilih lapangan</Label><p className="mt-1 text-sm text-muted-foreground">Pilih venue yang akan digunakan untuk booking walk-in.</p></div><span className="text-xs text-muted-foreground">{filteredLapangans.length} dari {lapangans.length} lapangan</span></div>
                        <div className="mb-4 flex flex-col gap-3 rounded-xl border border-border/70 bg-muted/20 p-3 md:flex-row"><div className="relative flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Cari nama atau kategori lapangan..." className="bg-background pl-9" /></div><Select value={categoryFilter} onValueChange={setCategoryFilter}><SelectTrigger className="bg-background md:w-56"><SelectValue placeholder="Semua kategori" /></SelectTrigger><SelectContent><SelectItem value="all">Semua kategori</SelectItem>{categories.map((category) => <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>)}</SelectContent></Select>{(searchInput || categoryFilter !== 'all') && <Button type="button" variant="ghost" size="icon" onClick={resetFilters} aria-label="Reset filter"><X className="size-4" /></Button>}</div>
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{filteredLapangans.map((item) => { const selected = form.data.lapangan_id === String(item.id); const image = item.images?.[0] || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80'; return <button key={item.id} type="button" aria-pressed={selected} onClick={() => selectLapangan(String(item.id))} className={selected ? 'group overflow-hidden rounded-xl border border-primary bg-primary/5 text-left shadow-sm ring-2 ring-primary/20' : 'group overflow-hidden rounded-xl border border-border/80 bg-background text-left hover:border-primary/50 hover:shadow-sm'}><div className="relative aspect-[16/8] overflow-hidden bg-muted"><img src={image} alt={item.name} className="size-full object-cover transition duration-300 group-hover:scale-105" />{selected && <span className="absolute right-2 top-2 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow"><Check className="size-3.5" /></span>}</div><div className="space-y-1.5 p-3"><div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="truncate text-sm font-bold text-foreground">{item.name}</p><p className="mt-0.5 truncate text-[11px] text-muted-foreground">{item.category?.name || 'Lapangan olahraga'}</p></div><span className="shrink-0 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">{item.slot_duration_minutes || 60} mnt</span></div><div className="flex items-center justify-between gap-2 border-t border-border/60 pt-2 text-[11px]"><span className="text-muted-foreground">{item.operational_start} - {item.operational_end}</span><span className="font-bold text-primary">Rp {Number(item.price_per_hour).toLocaleString('id-ID')}<span className="font-normal text-muted-foreground">/jam</span></span></div></div></button>; })}</div>
                        {lapangans.length > 0 && filteredLapangans.length === 0 && <div className="mt-4 rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground"><Search className="mx-auto mb-3 size-7" /><p>Tidak ada lapangan yang cocok dengan pencarian atau filter.</p><Button type="button" variant="link" className="mt-2" onClick={resetFilters}>Reset filter</Button></div>}{lapangans.length === 0 && <div className="mt-4 rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground"><ImageOff className="mx-auto mb-3 size-8" /><p>Tidak ada lapangan aktif yang tersedia untuk akun ini.</p></div>}{form.errors.lapangan_id && <p className="mt-3 text-xs text-destructive">{form.errors.lapangan_id}</p>}
                    </section>
                    <section className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm sm:p-7">
                        <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Langkah 2</p><Label className="mt-1 block text-lg font-bold">Atur jadwal</Label><p className="mt-1 text-sm text-muted-foreground">Pilih tanggal dan slot yang masih tersedia.</p></div>{lapangan && <div className="flex items-center gap-2 text-xs font-semibold text-primary"><span className="size-2 rounded-full bg-primary" />{lapangan.name}</div>}</div>
                        <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
                            <div className="space-y-2"><Label>Tanggal bermain</Label><div className="grid grid-cols-3 gap-2">{dates.map((date) => <label key={date.value} className={form.data.booking_date === date.value ? 'cursor-pointer rounded-xl border border-primary bg-primary/10 p-3 transition' : 'cursor-pointer rounded-xl border border-border p-3 transition hover:border-primary/40'}><input type="radio" className="sr-only" checked={form.data.booking_date === date.value} onChange={() => selectDate(date.value)} /><span className="block font-semibold">{date.label}</span><span className="text-xs text-muted-foreground">{date.detail}</span></label>)}</div>{form.errors.booking_date && <p className="text-xs text-destructive">{form.errors.booking_date}</p>}</div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between gap-3"><div><Label>Pilih slot waktu</Label><p className="mt-1 text-[11px] text-muted-foreground">Klik dua kali untuk menjadikan jam mulai.</p></div>{selectedSlots.length > 0 && <Button type="button" variant="ghost" size="sm" onClick={resetTimeSelection}><RotateCcw className="mr-1.5 size-3.5" />Reset jam</Button>}</div>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground"><span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-primary" />Tersedia</span><span className="inline-flex items-center gap-1.5"><LockKeyhole className="size-3.5" />Sudah dibooking</span><span className="ml-auto text-right">{loadingSlots ? 'Memuat...' : lapangan ? lapangan.operational_start + ' - ' + lapangan.operational_end + ' WIB' : 'Pilih lapangan terlebih dahulu'}</span></div>
                                {lapangan ? visibleSlots.length > 0 ? <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{visibleSlots.map((slot) => { const disabled = isBooked(slot); const selected = selectedSlots.includes(slot.start_time); const disabledReason = disabled ? 'Slot sudah dibooking' : undefined; return <button key={slot.start_time} type="button" disabled={disabled} title={disabledReason} aria-label={slot.start_time + ' - ' + slot.end_time + (disabledReason ? ', ' + disabledReason : ', tersedia')} onClick={() => selectSlot(slot.start_time)} onDoubleClick={() => selectSlotFromDoubleClick(slot.start_time)} className={selected ? 'flex items-center justify-between rounded-xl border border-primary bg-primary p-3 text-left text-xs text-primary-foreground transition' : disabled ? 'flex cursor-not-allowed items-center justify-between rounded-xl border border-border/40 bg-muted/40 p-3 text-left text-xs text-muted-foreground/50 transition' : 'flex items-center justify-between rounded-xl border border-border p-3 text-left text-xs transition hover:border-primary/50'}><span><Clock className="mr-1 inline size-3.5" />{slot.start_time} - {slot.end_time}</span>{disabled && <LockKeyhole className="size-3.5 shrink-0" aria-hidden="true" />}{selected && <Check className="size-4" />}</button>; })}</div> : <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">Tidak ada slot waktu yang tersisa untuk hari ini.</div> : <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">Pilih lapangan untuk melihat slot waktu.</div>}
                                {form.errors.start_time && <p className="text-xs text-destructive">{form.errors.start_time}</p>}
                            </div>
                        </div>
                    </section>
                    <section className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm sm:p-7"><div className="mb-5"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Langkah 3</p><Label className="mt-1 block text-lg font-bold">Data pelanggan</Label><p className="mt-1 text-sm text-muted-foreground">Masukkan data pelanggan walk-in untuk bukti booking.</p></div><div className="grid gap-5 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="customer_name">Nama pelanggan</Label><Input id="customer_name" value={form.data.customer_name} onChange={(event) => form.setData('customer_name', event.target.value)} required />{form.errors.customer_name && <p className="text-xs text-destructive">{form.errors.customer_name}</p>}</div><div className="space-y-2"><Label htmlFor="customer_phone">Nomor telepon</Label><Input id="customer_phone" value={form.data.customer_phone} onChange={(event) => form.setData('customer_phone', event.target.value)} required />{form.errors.customer_phone && <p className="text-xs text-destructive">{form.errors.customer_phone}</p>}</div><div className="space-y-2 sm:col-span-2"><Label htmlFor="customer_email">Email pelanggan (opsional)</Label><Input id="customer_email" type="email" value={form.data.customer_email} onChange={(event) => form.setData('customer_email', event.target.value)} /></div><div className="space-y-2 sm:col-span-2"><Label htmlFor="notes">Catatan (opsional)</Label><Textarea id="notes" value={form.data.notes} onChange={(event) => form.setData('notes', event.target.value)} rows={3} /></div></div></section>
                    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="text-sm text-muted-foreground">{lapangan && selectedSlots.length > 0 ? <><span className="font-semibold text-foreground">{lapangan.name}</span> · {form.data.booking_date} · {selectedSlots.length} jam · Cash</> : 'Pilih lapangan dan slot untuk melanjutkan.'}</div><div className="flex gap-3"><Button type="button" variant="outline" asChild><Link href={bookingsIndex.url()}>Batal</Link></Button><Button type="submit" disabled={form.processing || selectedSlots.length === 0}><CalendarPlus className="mr-2 size-4" />Buat Booking Manual</Button></div></div>
                </form>
            </div>
        </AppLayout>
    );
}
