import { Head, Link, useForm } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import {
    AlertCircle,
    ArrowLeft,
    CalendarDays,
    Check,
    CheckCircle2,
    CreditCard,
    Plus,
    ReceiptText,
    Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { PublicLayout } from '@/layouts/public-layout';
import MembershipController from '@/actions/App/Http/Controllers/MembershipController';
import { home } from '@/routes';
import { index as lapanganIndex, show as lapanganShow } from '@/routes/lapangan';
import type { BankAccount, Lapangan } from '@/types/booking';

type Slot = {
    start_time: string;
    end_time: string;
    available: boolean;
    occurrence_count: number;
    duration_minutes: number;
    start_date: string | null;
};

type Reservation = {
    lapangan_id: string;
    weekday: number;
    start_time: string;
    end_time: string;
    duration_hours: number;
    occurrence_count: number;
    price_per_occurrence: number;
    start_date: string | null;
};

interface Props {
    lapangan: Lapangan;
    bankAccounts: BankAccount[];
    membershipDiscountPercentage?: number;
}

const weekdays = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

function formatDate(date: string | null): string {
    if (!date) return '-';

    return new Date(`${date}T00:00:00`).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
}

export default function MembershipCheckout({
    lapangan,
    membershipDiscountPercentage = 0,
}: Props) {
    const [weekday, setWeekday] = useState<number | null>(null);
    const [slots, setSlots] = useState<Slot[]>([]);
    const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [slotError, setSlotError] = useState<string | null>(null);
    const [justAdded, setJustAdded] = useState<{
        weekday: number;
        start_time: string;
        end_time: string;
    } | null>(null);

    const form = useForm<{ lapangan_id: string; reservations: Reservation[] }>({
        lapangan_id: lapangan.id,
        reservations: [],
    });

    useEffect(() => {
        if (weekday === null) {
            setSlots([]);
            return;
        }

        const controller = new AbortController();
        setLoadingSlots(true);
        setSlotError(null);
        setSelectedSlots([]);

        fetch(MembershipController.slots.url({ query: { lapangan_id: lapangan.id, weekday } }), {
            signal: controller.signal,
        })
            .then(async (response) => {
                if (!response.ok) throw new Error('Slot gagal dimuat.');

                return response.json() as Promise<{ slots?: Slot[] }>;
            })
            .then((payload) => setSlots(payload.slots ?? []))
            .catch((error: unknown) => {
                if (error instanceof DOMException && error.name === 'AbortError') return;

                setSlots([]);
                setSlotError('Jadwal tidak dapat dimuat. Silakan coba lagi.');
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoadingSlots(false);
            });

        return () => controller.abort();
    }, [lapangan.id, weekday]);

    const selectedRange = useMemo(
        () => slots.filter((slot) => selectedSlots.includes(slot.start_time)),
        [selectedSlots, slots],
    );
    const preview = selectedRange[0];
    const totalMinutes = selectedRange.reduce((total, slot) => total + slot.duration_minutes, 0);

    const isSlotInReservation = (slot: Slot, day: number) => {
        return form.data.reservations.some(
            (res) => res.weekday === day && slot.start_time < res.end_time && slot.end_time > res.start_time,
        );
    };

    const isSlotJustAdded = (slot: Slot, day: number) => {
        if (!justAdded || justAdded.weekday !== day) return false;
        return slot.start_time < justAdded.end_time && slot.end_time > justAdded.start_time;
    };

    const selectSlot = (slot: Slot) => {
        if (weekday === null) return;
        const isAlreadyBooked = isSlotInReservation(slot, weekday);
        if (isAlreadyBooked) {
            toast.info(`Slot ${slot.start_time} - ${slot.end_time} sudah ada di daftar jadwal pilihan Anda.`);
            return;
        }
        if (!slot.available) return;

        const starts = slots.map((item) => item.start_time);
        const clickedIndex = starts.indexOf(slot.start_time);
        const selectedIndexes = selectedSlots.map((start) => starts.indexOf(start)).filter((i) => i >= 0);

        // Clicking an already-selected slot → shrink selection from first to clicked
        if (selectedSlots.includes(slot.start_time)) {
            const first = Math.min(...selectedIndexes);
            const shrunk = starts.slice(first, clickedIndex + 1);
            setSelectedSlots(shrunk);
            return;
        }

        // Nothing selected yet → select just this one
        if (selectedIndexes.length === 0) {
            setSelectedSlots([slot.start_time]);
            return;
        }

        // Determine the full range from min to max
        const first = Math.min(clickedIndex, ...selectedIndexes);
        const last = Math.max(clickedIndex, ...selectedIndexes);
        const range = slots.slice(first, last + 1);

        // If any slot in the range is unavailable OR already booked in form → break, restart from clicked
        if (range.some((item) => !item.available || isSlotInReservation(item, weekday))) {
            setSelectedSlots([slot.start_time]);
            return;
        }

        // All contiguous and available → extend
        setSelectedSlots(range.map((item) => item.start_time));
    };

    const selectSlotFromDoubleClick = (slot: Slot) => {
        if (weekday === null) return;
        if (isSlotInReservation(slot, weekday)) {
            toast.info(`Slot ${slot.start_time} - ${slot.end_time} sudah ada di daftar jadwal pilihan Anda.`);
            return;
        }
        if (!slot.available) return;
        setSelectedSlots([slot.start_time]);
    };

    const addReservation = () => {
        if (weekday === null || !preview || selectedRange.length === 0 || totalMinutes < 60) return;

        const newReservation: Reservation = {
            lapangan_id: lapangan.id,
            weekday,
            start_time: selectedRange[0].start_time,
            end_time: selectedRange[selectedRange.length - 1].end_time,
            duration_hours: totalMinutes / 60,
            occurrence_count: preview.occurrence_count,
            price_per_occurrence: lapangan.price_per_hour * (totalMinutes / 60),
            start_date: preview.start_date,
        };

        form.setData('reservations', [...form.data.reservations, newReservation]);
        setJustAdded({
            weekday,
            start_time: newReservation.start_time,
            end_time: newReservation.end_time,
        });
        setSelectedSlots([]);
        toast.success(
            `Jadwal hari ${weekdays[weekday]} (${newReservation.start_time} - ${newReservation.end_time}) berhasil ditambahkan.`,
        );
    };

    const removeReservation = (index: number) => {
        const removed = form.data.reservations[index];
        form.setData(
            'reservations',
            form.data.reservations.filter((_, itemIndex) => itemIndex !== index),
        );
        if (
            justAdded &&
            removed &&
            justAdded.weekday === removed.weekday &&
            justAdded.start_time === removed.start_time &&
            justAdded.end_time === removed.end_time
        ) {
            setJustAdded(null);
        }
        toast.info('Jadwal dihapus dari daftar.');
    };

    const subtotal = form.data.reservations.reduce(
        (total, reservation) => total + reservation.price_per_occurrence * reservation.occurrence_count,
        0,
    );
    const totalOccurrences = form.data.reservations.reduce(
        (total, reservation) => total + reservation.occurrence_count,
        0,
    );
    const discountPercentage = Number(membershipDiscountPercentage ?? 0);
    const discountAmount = discountPercentage > 0 ? Math.floor((subtotal * discountPercentage) / 100) : 0;
    const finalAmount = Math.max(0, subtotal - discountAmount);

    const formErrors = form.errors as Record<string, string | undefined>;
    const membershipError = formErrors.membership;
    const reservationsError = form.errors.reservations;
    const firstFieldError = Object.entries(formErrors).find(([key]) => key.startsWith('reservations.'))?.[1];

    const submit = () => {
        if (form.data.reservations.length === 0) {
            toast.error('Pilih minimal satu jadwal membership sebelum melanjutkan.');
            return;
        }

        form.post(MembershipController.store.url(), {
            onError: (errors) => {
                const message =
                    errors.membership ??
                    errors.reservations ??
                    Object.values(errors)[0] ??
                    'Membership belum dapat dibuat. Periksa kembali jadwal yang dipilih.';
                toast.error(message);
            },
        });
    };

    return (
        <PublicLayout>
            <Head title={`Atur Jadwal Membership - ${lapangan.name}`} />

            {/* Breadcrumb Strip (> 2 levels deep) */}
            <div className="border-border/60 bg-muted/20 text-muted-foreground border-b py-3 text-xs">
                <div className="public-container w-full max-w-[1240px]">
                    <Breadcrumbs
                        breadcrumbs={[
                            { title: 'Beranda', href: home() },
                            { title: 'Cari Lapangan', href: lapanganIndex() },
                            { title: lapangan.name, href: lapanganShow.url(lapangan.slug) },
                            { title: 'Checkout Membership', href: '#' },
                        ]}
                    />
                </div>
            </div>

            <div className="bg-background min-h-screen py-8 sm:py-10">
                <div className="public-container w-full max-w-[1240px] space-y-8">
                    {/* Hero Header */}
                    <div>
                        <Link
                            href={lapanganShow.url(lapangan.slug)}
                            className="text-muted-foreground hover:text-primary mb-4 inline-flex items-center gap-1.5 text-xs font-semibold transition-colors"
                        >
                            <ArrowLeft className="size-3.5" /> Kembali ke detail lapangan
                        </Link>

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <div className="flex flex-wrap items-center gap-2.5">
                                    <h1 className="text-foreground text-2xl font-black tracking-tight sm:text-3xl">
                                        Atur Jadwal Membership
                                    </h1>
                                    {lapangan.category?.name && (
                                        <Badge variant="secondary" className="text-xs font-semibold">
                                            {lapangan.category.name}
                                        </Badge>
                                    )}
                                </div>
                                <p className="text-muted-foreground mt-1.5 text-sm">
                                    Pilih jadwal rutin mingguan untuk <span className="font-semibold text-foreground">{lapangan.name}</span>. Jadwal dikunci selama 30 hari periode aktif.
                                </p>
                            </div>
                        </div>

                        {/* Metadata Strip */}
                        <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 border-y border-border/60 py-3 text-xs text-muted-foreground">
                            <div>
                                Tarif Lapangan: <span className="font-bold text-foreground">Rp {lapangan.price_per_hour.toLocaleString('id-ID')}</span> / jam
                            </div>
                            <div className="hidden sm:block text-border">•</div>
                            <div>
                                Masa Aktif: <span className="font-bold text-foreground">30 Hari Kalender</span>
                            </div>
                            <div className="hidden sm:block text-border">•</div>
                            <div>
                                Sistem: <span className="font-bold text-foreground">Jadwal Mingguan Otomatis</span>
                            </div>
                        </div>
                    </div>

                    {/* 2-Column Responsive Layout */}
                    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start">
                        {/* LEFT COLUMN: Interactive Builder */}
                        <div className="space-y-6">
                            {/* Step 1: Pilih Hari */}
                            <section className="border-border/70 bg-card rounded-2xl border p-5 shadow-xs sm:p-6 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                        <div className="bg-primary/10 text-primary flex size-8 items-center justify-center rounded-lg font-bold text-xs">
                                            1
                                        </div>
                                        <div>
                                            <h2 className="text-sm font-bold sm:text-base">Pilih Hari Rutin</h2>
                                            <p className="text-muted-foreground text-xs">
                                                Pilih hari bermain yang sama setiap minggunya
                                            </p>
                                        </div>
                                    </div>
                                    {weekday !== null && (
                                        <Badge variant="outline" className="border-primary/40 bg-primary/5 text-primary text-xs font-bold">
                                            {weekdays[weekday]} Terpilih
                                        </Badge>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7 pt-1">
                                    {weekdays.map((day, index) => {
                                        const isSelected = weekday === index;
                                        const dayReservationCount = form.data.reservations.filter(
                                            (r) => r.weekday === index,
                                        ).length;

                                        return (
                                            <button
                                                key={day}
                                                type="button"
                                                onClick={() => setWeekday(index)}
                                                className={`group relative rounded-xl border p-3 text-center transition-all ${
                                                    isSelected
                                                        ? 'border-primary bg-primary text-primary-foreground shadow-xs'
                                                        : 'border-border/70 bg-muted/20 hover:border-primary/50 hover:bg-muted/40 text-foreground'
                                                }`}
                                            >
                                                <p className="text-xs font-semibold opacity-75">
                                                    {day === 'Minggu' ? 'Ahad' : 'Hari'}
                                                </p>
                                                <p className="mt-0.5 text-sm font-bold tracking-tight">
                                                    {day}
                                                </p>
                                                {dayReservationCount > 0 && (
                                                    <span
                                                        className={`mt-1 block text-[10px] font-bold ${
                                                            isSelected
                                                                ? 'text-primary-foreground/90'
                                                                : 'text-emerald-600 dark:text-emerald-400'
                                                        }`}
                                                    >
                                                        {dayReservationCount} Jadwal
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </section>

                            {/* Step 2: Pilih Jam & Slot */}
                            {weekday !== null && (
                                <section className="border-border/70 bg-card rounded-2xl border p-5 shadow-xs sm:p-6 space-y-4">
                                    <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-center">
                                        <div className="flex items-center gap-2.5">
                                            <div className="bg-primary/10 text-primary flex size-8 items-center justify-center rounded-lg font-bold text-xs">
                                                2
                                            </div>
                                            <div>
                                                <h2 className="text-sm font-bold sm:text-base">
                                                    Pilih Jam Hari {weekdays[weekday]}
                                                </h2>
                                                <p className="text-muted-foreground text-xs">
                                                    Klik awal & akhir untuk rentang berurutan · Klik 2x untuk 1 slot
                                                </p>
                                            </div>
                                        </div>
                                        {loadingSlots && (
                                            <span className="text-muted-foreground animate-pulse text-xs">
                                                Memuat slot...
                                            </span>
                                        )}
                                    </div>

                                    {/* Legend Status */}
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-y border-border/50 py-2.5 text-[11px] text-muted-foreground">
                                        <span className="inline-flex items-center gap-1.5">
                                            <span className="size-2 rounded-full border border-border/80 bg-muted/40" />
                                            Tersedia
                                        </span>
                                        <span className="inline-flex items-center gap-1.5">
                                            <span className="size-2 rounded-full bg-primary" />
                                            Sedang Dipilih
                                        </span>
                                        <span className="inline-flex items-center gap-1.5">
                                            <span className="size-2 rounded-full bg-emerald-500" />
                                            Sudah di Jadwal
                                        </span>
                                        <span className="inline-flex items-center gap-1.5">
                                            <span className="size-2 rounded-full bg-muted-foreground/30" />
                                            Tidak Tersedia
                                        </span>
                                    </div>

                                    {slotError && (
                                        <div className="border-destructive/30 bg-destructive/10 text-destructive flex items-center gap-2 rounded-xl border p-3 text-xs">
                                            <AlertCircle className="size-4 shrink-0" />
                                            <span>{slotError}</span>
                                        </div>
                                    )}

                                    {/* Slots Grid */}
                                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 pt-1">
                                        {slots.map((slot) => {
                                            const isSelected = selectedSlots.includes(slot.start_time);
                                            const isBooked = isSlotInReservation(slot, weekday);
                                            const isJustAdded = isSlotJustAdded(slot, weekday);

                                            return (
                                                <button
                                                    key={slot.start_time}
                                                    type="button"
                                                    disabled={!slot.available && !isBooked}
                                                    onClick={() => selectSlot(slot)}
                                                    onDoubleClick={() => selectSlotFromDoubleClick(slot)}
                                                    className={`group relative rounded-xl border p-3 text-left transition-all ${
                                                        isJustAdded
                                                            ? 'border-emerald-500/80 bg-emerald-500/15 text-emerald-950 dark:text-emerald-100 ring-2 ring-emerald-500/30 shadow-xs'
                                                            : isBooked
                                                            ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200'
                                                            : isSelected
                                                            ? 'border-primary bg-primary text-primary-foreground shadow-xs ring-2 ring-primary/20'
                                                            : slot.available
                                                            ? 'border-border/70 bg-muted/15 hover:border-primary/50 hover:bg-muted/30 text-foreground'
                                                            : 'cursor-not-allowed border-border/40 bg-muted/40 text-muted-foreground/50 opacity-60'
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between font-mono font-bold text-sm">
                                                        <span>{slot.start_time} - {slot.end_time}</span>
                                                        {isJustAdded ? (
                                                            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                                                                <CheckCircle2 className="size-3.5 stroke-[2.5]" />
                                                            </span>
                                                        ) : isBooked ? (
                                                            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                                                                <CheckCircle2 className="size-3.5 stroke-[2.5]" />
                                                            </span>
                                                        ) : isSelected ? (
                                                            <Check className="size-4 shrink-0 stroke-[2.5]" />
                                                        ) : null}
                                                    </div>
                                                    <div className="mt-1.5 flex items-center justify-between text-[11px] opacity-85">
                                                        <span>
                                                            {isJustAdded
                                                                ? 'Baru Ditambahkan'
                                                                : isBooked
                                                                ? 'Sudah di Jadwal'
                                                                : slot.available
                                                                ? `${slot.occurrence_count}x sesi / bln`
                                                                : 'Tidak tersedia'}
                                                        </span>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Slot Action Banner */}
                                    {preview && (
                                        <div className="bg-muted/30 border-border/70 mt-2 flex flex-col justify-between gap-3 rounded-xl border p-4 sm:flex-row sm:items-center">
                                            <div>
                                                <p className="text-xs font-semibold text-muted-foreground">
                                                    Rentang Jam Terpilih:
                                                </p>
                                                <p className="text-sm font-bold text-foreground">
                                                    {selectedRange[0]?.start_time} - {selectedRange[selectedRange.length - 1]?.end_time} WIB
                                                    <span className="text-muted-foreground font-medium ml-1.5 text-xs">
                                                        ({totalMinutes / 60} Jam · {preview.occurrence_count}x pertemuan per bulan)
                                                    </span>
                                                </p>
                                                {totalMinutes < 60 && (
                                                    <p className="text-rose-600 dark:text-rose-400 mt-1 text-xs">
                                                        Durasi minimal membership adalah 1 jam. Tambah slot berurutan.
                                                    </p>
                                                )}
                                            </div>
                                            <Button
                                                type="button"
                                                onClick={addReservation}
                                                disabled={!preview || totalMinutes < 60}
                                                className="h-10 rounded-xl font-bold shrink-0 shadow-2xs"
                                            >
                                                <Plus className="mr-1.5 size-4" /> Tambah ke Jadwal
                                            </Button>
                                        </div>
                                    )}
                                </section>
                            )}

                            {/* Step 3: Jadwal Pilihan (Selected Schedules) */}
                            <section className="border-border/70 bg-card rounded-2xl border p-5 shadow-xs sm:p-6 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                        <div className="bg-primary/10 text-primary flex size-8 items-center justify-center rounded-lg font-bold text-xs">
                                            3
                                        </div>
                                        <div>
                                            <h2 className="text-sm font-bold sm:text-base">Jadwal Pilihan</h2>
                                            <p className="text-muted-foreground text-xs">
                                                Daftar jadwal rutin yang akan didaftarkan dalam membership
                                            </p>
                                        </div>
                                    </div>
                                    {form.data.reservations.length > 0 && (
                                        <Badge variant="secondary" className="text-xs font-bold">
                                            {form.data.reservations.length} Jadwal
                                        </Badge>
                                    )}
                                </div>

                                {form.data.reservations.length === 0 ? (
                                    <div className="border-border/70 bg-muted/15 rounded-xl border border-dashed p-8 text-center">
                                        <CalendarDays className="text-muted-foreground/60 mx-auto size-8" />
                                        <p className="text-foreground mt-2 text-sm font-bold">Belum Ada Jadwal Dipilih</p>
                                        <p className="text-muted-foreground mt-1 text-xs max-w-sm mx-auto">
                                            Pilih hari dan rentang jam di atas, lalu klik "Tambah ke Jadwal" untuk mendaftarkan jadwal rutin Anda.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-2.5 pt-1">
                                        {form.data.reservations.map((reservation, index) => (
                                            <div
                                                key={`${reservation.weekday}-${reservation.start_time}`}
                                                className="border-border/70 bg-muted/20 hover:bg-muted/30 flex items-center justify-between gap-3 rounded-xl border p-3.5 transition-colors"
                                            >
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-sm text-foreground">
                                                            Setiap {weekdays[reservation.weekday]}
                                                        </span>
                                                        <span className="text-muted-foreground">•</span>
                                                        <span className="font-mono font-semibold text-xs text-primary">
                                                            {reservation.start_time} - {reservation.end_time} WIB
                                                        </span>
                                                        <Badge variant="outline" className="text-[10px] font-semibold py-0">
                                                            {reservation.duration_hours} Jam
                                                        </Badge>
                                                    </div>
                                                    <p className="text-muted-foreground text-xs">
                                                        {reservation.occurrence_count}x sesi sebulan · Mulai {formatDate(reservation.start_date)} · Subtotal: <span className="font-semibold text-foreground">Rp {(reservation.price_per_occurrence * reservation.occurrence_count).toLocaleString('id-ID')}</span>
                                                    </p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeReservation(index)}
                                                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg p-2 transition-colors"
                                                    title="Hapus jadwal ini"
                                                    aria-label="Hapus jadwal"
                                                >
                                                    <Trash2 className="size-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </section>
                        </div>

                        {/* RIGHT COLUMN: Sticky Order Summary */}
                        <aside className="border-border/70 bg-card rounded-2xl border p-5 shadow-xs lg:sticky lg:top-24 space-y-4">
                            <div className="flex items-center gap-2">
                                <ReceiptText className="text-primary size-5" />
                                <h2 className="text-sm font-bold">Ringkasan Membership</h2>
                            </div>

                            <div className="border-border/60 border-b pb-4 space-y-2">
                                <p className="font-bold text-sm text-foreground">{lapangan.name}</p>
                                <p className="text-muted-foreground text-xs leading-relaxed">
                                    Membership aktif selama 30 hari kalender dengan jadwal terkunci otomatis setiap minggunya.
                                </p>
                            </div>

                            <div className="space-y-2.5 text-xs">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Jadwal Rutin</span>
                                    <span className="font-semibold text-foreground">
                                        {form.data.reservations.length} hari / minggu
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Total Sesi Bermain</span>
                                    <span className="font-semibold text-foreground">
                                        {totalOccurrences} sesi / bulan
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Periode Aktif</span>
                                    <span className="font-semibold text-foreground">30 Hari</span>
                                </div>
                            </div>

                            {discountPercentage > 0 && (
                                <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-800 dark:text-emerald-300">
                                    <Badge className="bg-emerald-600 text-white hover:bg-emerald-600 shrink-0">Promo</Badge>
                                    <span className="font-medium">
                                        Diskon membership {discountPercentage}% otomatis diterapkan!
                                    </span>
                                </div>
                            )}

                            <div className="border-border/60 border-t pt-4 space-y-2">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span className="font-semibold text-foreground">
                                        Rp {subtotal.toLocaleString('id-ID')}
                                    </span>
                                </div>

                                {discountPercentage > 0 && (
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
                                            <Badge variant="outline" className="h-5 border-emerald-500/40 bg-emerald-500/10 px-1.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                                                Diskon {discountPercentage}%
                                            </Badge>
                                            Diskon Membership
                                        </span>
                                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                            - Rp {discountAmount.toLocaleString('id-ID')}
                                        </span>
                                    </div>
                                )}

                                <div className="border-border/60 flex items-baseline justify-between border-t pt-2.5">
                                    <span className="text-xs font-bold text-muted-foreground">Total Pembayaran</span>
                                    <span className="text-primary text-xl font-black">
                                        Rp {finalAmount.toLocaleString('id-ID')}
                                    </span>
                                </div>
                            </div>

                            {/* Payment Method Callout */}
                            <div className="bg-muted/30 border-border/60 rounded-xl border p-3 text-xs space-y-1">
                                <div className="flex items-center gap-1.5 font-bold text-foreground">
                                    <CreditCard className="size-3.5 text-primary" />
                                    <span>Metode: Transfer Bank</span>
                                </div>
                                <p className="text-muted-foreground text-[11px] leading-relaxed">
                                    Nomor rekening tujuan dan kode unik verifikasi akan digenerate pada lembar invoice pembayaran setelah konfirmasi.
                                </p>
                            </div>

                            {/* Error Notifications */}
                            {membershipError && (
                                <div className="border-destructive/30 bg-destructive/10 text-destructive rounded-xl border p-3 text-xs flex items-start gap-2">
                                    <AlertCircle className="size-4 shrink-0 mt-0.5" />
                                    <span>{membershipError}</span>
                                </div>
                            )}
                            {reservationsError && (
                                <div className="border-destructive/30 bg-destructive/10 text-destructive rounded-xl border p-3 text-xs flex items-start gap-2">
                                    <AlertCircle className="size-4 shrink-0 mt-0.5" />
                                    <span>{reservationsError}</span>
                                </div>
                            )}
                            {firstFieldError && (
                                <div className="border-destructive/30 bg-destructive/10 text-destructive rounded-xl border p-3 text-xs flex items-start gap-2">
                                    <AlertCircle className="size-4 shrink-0 mt-0.5" />
                                    <span>{firstFieldError}</span>
                                </div>
                            )}

                            {form.data.reservations.length === 0 && (
                                <p className="text-muted-foreground text-center text-xs">
                                    Tambahkan minimal satu jadwal untuk membuat invoice membership.
                                </p>
                            )}

                            <Button
                                type="button"
                                disabled={form.processing || form.data.reservations.length === 0}
                                onClick={submit}
                                className="h-11 w-full rounded-xl font-bold shadow-xs"
                            >
                                {form.processing ? 'Memproses...' : 'Konfirmasi & Buat Invoice'}
                            </Button>
                        </aside>
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
}
