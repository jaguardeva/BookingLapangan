import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import { PublicLayout } from '@/layouts/public-layout';
import {
    Clock,
    Star,
    Check,
    AlertCircle,
    Info,
    Calendar,
    ChevronRight,
    MapPin,
    ShieldCheck,
    CreditCard,
    Banknote,
    MessageSquare,
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
    DialogTrigger,
} from '@/components/ui/dialog';
import type { Lapangan, Booking } from '@/types/booking';
import type { User as AuthUser } from '@/types/auth';

interface AllowedDate {
    date: string;
    day_name: string;
    formatted: string;
}

interface Props {
    lapangan: Lapangan;
    allowedDates: AllowedDate[];
    existingBookings: Booking[];
    relatedLapangans: Lapangan[];
}

export default function LapanganShow({
    lapangan,
    allowedDates = [],
    existingBookings = [],
    relatedLapangans = [],
}: Props) {
    const { auth } = usePage<{ auth: { user: AuthUser | null } }>().props;
    const currentUser = auth.user;

    const [selectedDate, setSelectedDate] = useState<string>(allowedDates[0]?.date || '');
    const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

    // Form for booking submission
    const { data, setData, post, processing, errors, reset } = useForm({
        lapangan_id: lapangan.id,
        booking_date: allowedDates[0]?.date || '',
        start_time: '',
        duration_hours: 1,
        payment_method: 'transfer' as 'cash' | 'transfer',
        customer_name: currentUser?.name || '',
        customer_phone: currentUser?.phone || '',
        notes: '',
    });

    // Generate 1-hour hourly slots from operational_start to operational_end
    const hourlySlots = useMemo(() => {
        const slots: { start: string; end: string }[] = [];
        const startHour = parseInt(lapangan.operational_start.split(':')[0], 10);
        const endHour = parseInt(lapangan.operational_end.split(':')[0], 10);

        for (let h = startHour; h < endHour; h++) {
            const sHour = h.toString().padStart(2, '0') + ':00';
            const eHour = (h + 1).toString().padStart(2, '0') + ':00';
            slots.push({ start: sHour, end: eHour });
        }
        return slots;
    }, [lapangan.operational_start, lapangan.operational_end]);

    // Current time helper to disable past hours today
    const now = new Date();
    const isToday = selectedDate === allowedDates[0]?.date;
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    // Check if slot is booked in database
    const isSlotBooked = (start: string, end: string) => {
        return existingBookings.some((b) => {
            const bDate = typeof b.booking_date === 'string' ? b.booking_date.split('T')[0].split(' ')[0] : '';
            if (bDate !== selectedDate) return false;

            const bStart = b.start_time ? b.start_time.substring(0, 5) : '';
            const bEnd = b.end_time ? b.end_time.substring(0, 5) : '';

            // Overlap check
            return bStart < end && bEnd > start;
        });
    };

    // Check if slot is in past today
    const isSlotPast = (start: string) => {
        if (!isToday) return false;
        return start <= currentTime;
    };

    // Slot click handler with continuous selection logic
    const handleSlotClick = (startTime: string) => {
        const allHours = hourlySlots.map((s) => s.start);

        // Clicking a selected slot trims the range at that slot instead of creating a gap.
        if (selectedSlots.includes(startTime)) {
            const selectedIndexes = selectedSlots.map((slot) => allHours.indexOf(slot)).filter((index) => index >= 0);
            const clickedIndex = allHours.indexOf(startTime);
            const firstIndex = Math.min(...selectedIndexes);
            setSelectedSlots(allHours.slice(firstIndex, clickedIndex + 1));
            return;
        }

        // If no slot selected, start selection
        if (selectedSlots.length === 0) {
            setSelectedSlots([startTime]);
            return;
        }

        // Multiple selection: ensure continuity
        const existingIndexes = selectedSlots.map((s) => allHours.indexOf(s));
        const newIndex = allHours.indexOf(startTime);

        const minIndex = Math.min(...existingIndexes, newIndex);
        const maxIndex = Math.max(...existingIndexes, newIndex);

        // Build contiguous list
        const contiguousSlots: string[] = [];
        let hasConflict = false;

        for (let i = minIndex; i <= maxIndex; i++) {
            const slotStart = allHours[i];
            const slotEnd = hourlySlots[i].end;

            if (isSlotBooked(slotStart, slotEnd) || isSlotPast(slotStart)) {
                hasConflict = true;
                break;
            }
            contiguousSlots.push(slotStart);
        }

        if (hasConflict) {
            // If conflict, just select the clicked slot
            setSelectedSlots([startTime]);
        } else {
            setSelectedSlots(contiguousSlots);
        }
    };

    // Calculate booking summary
    const durationHours = selectedSlots.length;
    const sortedSlots = [...selectedSlots].sort();
    const startTimeStr = sortedSlots[0] || '';
    const endTimeStr = sortedSlots.length > 0
        ? hourlySlots.find((s) => s.start === sortedSlots[sortedSlots.length - 1])?.end || ''
        : '';
    const totalPrice = durationHours * lapangan.price_per_hour;

    // Handle Open Checkout
    const handleProceedToCheckout = () => {
        setData((prev) => ({
            ...prev,
            booking_date: selectedDate,
            start_time: startTimeStr,
            duration_hours: durationHours,
        }));
        setIsCheckoutOpen(true);
    };

    // Handle form submit
    const handleBookingSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/booking', {
            onSuccess: () => {
                setIsCheckoutOpen(false);
                reset();
            },
        });
    };

    return (
        <PublicLayout>
            <Head title={`${lapangan.name} - Sewa Lapangan`} />

            {/* Breadcrumbs strip */}
            <div className="border-b border-border/60 bg-muted/20 py-3 text-xs text-muted-foreground">
                <div className="container mx-auto px-4 sm:px-6 flex items-center gap-2">
                    <Link href="/" className="hover:text-foreground">Beranda</Link>
                    <ChevronRight className="size-3.5" />
                    <Link href="/lapangan" className="hover:text-foreground">Katalog Lapangan</Link>
                    <ChevronRight className="size-3.5" />
                    <span className="text-foreground font-medium truncate">{lapangan.name}</span>
                </div>
            </div>

            <div className="container mx-auto px-4 sm:px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Photos & Details (2 Cols) */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Main Photo Gallery */}
                        <div className="rounded-2xl overflow-hidden border border-border/80 bg-card shadow-sm aspect-[16/9] relative">
                            <img
                                src={lapangan.images?.[0] || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80'}
                                alt={lapangan.name}
                                className="size-full object-cover"
                            />
                            <div className="absolute top-4 left-4 flex gap-2">
                                <Badge className="bg-background/90 text-foreground backdrop-blur-md border border-border/40 font-semibold">
                                    {lapangan.category?.name}
                                </Badge>
                                <Badge className="bg-emerald-600 text-white font-semibold">
                                    Aktif & Tersedia
                                </Badge>
                            </div>
                        </div>

                        {/* Title & Stats */}
                        <div>
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                                    {lapangan.name}
                                </h1>
                                <div className="flex items-center gap-1.5 rounded-xl bg-card px-3 py-1.5 text-sm font-bold border border-border">
                                    <Star className="size-4 fill-amber-400 text-amber-400" />
                                    <span>{Number(lapangan.reviews_avg_rating ?? 5).toFixed(1)}</span>
                                    <span className="text-xs font-normal text-muted-foreground">({lapangan.reviews_count ?? 0} ulasan)</span>
                                </div>
                            </div>

                            <p className="text-sm text-muted-foreground mt-3 leading-relaxed whitespace-pre-line">
                                {lapangan.description}
                            </p>
                        </div>

                        {/* Facilities Checklist */}
                        <div className="p-6 rounded-2xl bg-card border border-border/70 space-y-4">
                            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                                <ShieldCheck className="size-4 text-emerald-600" /> Fasilitas Lapangan
                            </h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                                {lapangan.facilities?.map((f) => (
                                    <div key={f.id} className="flex items-center gap-2 text-foreground/90">
                                        <div className="size-5 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                                            <Check className="size-3" />
                                        </div>
                                        <span>{f.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Rules & Policy Box */}
                        <div className="p-5 rounded-2xl bg-muted/30 border border-border/60 text-xs space-y-2">
                            <h4 className="font-semibold text-foreground flex items-center gap-1.5">
                                <Info className="size-4 text-sky-500" /> Kebijakan Booking & Pembatalan:
                            </h4>
                            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                                <li>Booking hanya tersedia untuk maksimal 3 hari ke depan (hari ini, besok, lusa).</li>
                                <li>Pembatalan gratis dapat dilakukan paling lambat 24 jam sebelum jam bermain.</li>
                                <li>Untuk transfer bank, pastikan mentransfer nominal hingga 3-digit kode validasi unik agar terverifikasi otomatis.</li>
                                <li>Harap hadir di lokasi 10 menit sebelum waktu bermain dimulai.</li>
                            </ul>
                        </div>

                        {/* Customer Reviews */}
                        <div className="space-y-4 pt-4 border-t border-border/60">
                            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                                <MessageSquare className="size-5 text-emerald-600" /> Ulasan Pemain ({lapangan.reviews?.length ?? 0})
                            </h3>

                            {lapangan.reviews && lapangan.reviews.length > 0 ? (
                                <div className="space-y-3">
                                    {lapangan.reviews.map((rev) => (
                                        <div key={rev.id} className="p-4 rounded-xl border border-border/60 bg-card space-y-2 text-xs">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="size-7 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                                                        {rev.user?.name ? rev.user.name[0] : 'U'}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-foreground">{rev.user?.name}</p>
                                                        <p className="text-xs text-muted-foreground">Penyewa Terverifikasi</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1 text-amber-400">
                                                    {Array.from({ length: rev.rating }).map((_, i) => (
                                                        <Star key={i} className="size-3 fill-current" />
                                                    ))}
                                                </div>
                                            </div>
                                            {rev.comment && <p className="text-muted-foreground leading-relaxed">{rev.comment}</p>}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-muted-foreground">Belum ada ulasan untuk lapangan ini.</p>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Interactive Slot Booking Picker (1 Col Sticky) */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-20 rounded-2xl border border-border/80 bg-card p-6 shadow-md space-y-6">
                            <div>
                                <span className="text-xs text-muted-foreground">Harga Sewa</span>
                                <div className="flex items-baseline gap-1 mt-0.5">
                                    <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                                        Rp {Number(lapangan.price_per_hour).toLocaleString('id-ID')}
                                    </span>
                                    <span className="text-xs text-muted-foreground">/ jam</span>
                                </div>
                            </div>

                            {/* 1. Date Selector Tabs (Hari Ini, Besok, Lusa) */}
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Pilih Tanggal Main
                                </Label>
                                <div className="grid grid-cols-3 gap-2">
                                    {allowedDates.map((d) => {
                                        const isSelected = selectedDate === d.date;
                                        return (
                                            <button
                                                key={d.date}
                                                type="button"
                                                onClick={() => {
                                                    setSelectedDate(d.date);
                                                    setSelectedSlots([]);
                                                }}
                                                className={`p-2.5 rounded-xl border text-center transition-all ${
                                                    isSelected
                                                        ? 'border-emerald-600 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold ring-1 ring-emerald-600'
                                                        : 'border-border bg-card/60 text-muted-foreground hover:border-emerald-500/40 hover:text-foreground'
                                                }`}
                                            >
                                                <p className="text-xs uppercase tracking-wider">{d.day_name}</p>
                                                <p className="text-xs font-bold mt-0.5">{d.formatted.split(' ')[0]} {d.formatted.split(' ')[1]}</p>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* 2. Interactive Time Slot Grid */}
                            <div className="space-y-2.5">
                                <div className="flex items-center justify-between text-xs">
                                    <Label className="font-semibold uppercase tracking-wider text-muted-foreground">
                                        Pilih Jam Bermain
                                    </Label>
                                    <span className="text-xs text-muted-foreground">
                                        {lapangan.operational_start} - {lapangan.operational_end} WIB
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                                    {hourlySlots.map((slot) => {
                                        const booked = isSlotBooked(slot.start, slot.end);
                                        const past = isSlotPast(slot.start);
                                        if (past) return null;
                                        const selected = selectedSlots.includes(slot.start);
                                        const disabled = booked || past;

                                        return (
                                            <button
                                                key={slot.start}
                                                type="button"
                                                disabled={disabled} aria-disabled={disabled}
                                                onClick={disabled ? undefined : () => handleSlotClick(slot.start)}
                                                className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all ${
                                                    selected
                                                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20'
                                                        : disabled
                                                        ? 'bg-muted/40 text-muted-foreground/50 border-border/40 cursor-not-allowed'
                                                        : 'bg-card text-foreground border-border hover:border-emerald-500/50 hover:bg-emerald-500/5'
                                                }`}
                                            >
                                                <span>{slot.start} - {slot.end}</span>
                                                {selected ? (
                                                    <Check className="size-3.5 stroke-[3]" />
                                                ) : booked ? (
                                                    <span className="text-xs uppercase tracking-tight text-rose-500 font-bold">Terisi</span>
                                                ) : past ? (
                                                    <span className="text-xs uppercase tracking-tight text-muted-foreground font-bold">Lewat</span>
                                                ) : null}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Slot Legend */}
                                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/60">
                                    <div className="flex items-center gap-1.5">
                                        <div className="size-2.5 rounded bg-emerald-600" />
                                        <span>Terpilih</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="size-2.5 rounded border border-border bg-card" />
                                        <span>Tersedia</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="size-2.5 rounded bg-muted/80" />
                                        <span>Terisi / Lewat</span>
                                    </div>
                                </div>
                            </div>

                            {/* 3. Live Price & Duration Summary */}
                            {durationHours > 0 && (
                                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-1.5 text-xs">
                                    <div className="flex justify-between text-muted-foreground">
                                        <span>Waktu:</span>
                                        <span className="font-semibold text-foreground">{startTimeStr} - {endTimeStr} WIB</span>
                                    </div>
                                    <div className="flex justify-between text-muted-foreground">
                                        <span>Durasi:</span>
                                        <span className="font-semibold text-foreground">{durationHours} Jam</span>
                                    </div>
                                    <div className="flex justify-between pt-1.5 border-t border-emerald-500/20 text-sm font-bold text-foreground">
                                        <span>Total Biaya:</span>
                                        <span className="text-emerald-600 dark:text-emerald-400">
                                            Rp {totalPrice.toLocaleString('id-ID')}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Action Button */}
                            {currentUser ? (
                                <Button
                                    type="button"
                                    disabled={durationHours === 0}
                                    onClick={handleProceedToCheckout}
                                    className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-md shadow-emerald-600/20"
                                >
                                    {durationHours === 0 ? 'Pilih Jam Terlebih Dahulu' : 'Lanjut ke Pembayaran →'}
                                </Button>
                            ) : (
                                <Button asChild className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold">
                                    <Link href="/login">Masuk Untuk Booking</Link>
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Checkout Confirmation Dialog */}
            <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
                <DialogContent className="sm:max-w-md rounded-2xl border-border">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold">Konfirmasi Booking Lapangan</DialogTitle>
                        <DialogDescription className="text-xs">
                            Periksa kembali jadwal dan masukkan informasi kontak Anda untuk konfirmasi pesanan.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleBookingSubmit} className="space-y-4 pt-2">
                        {/* Summary Pill */}
                        <div className="p-3.5 rounded-xl bg-muted/40 border border-border/70 space-y-1 text-xs">
                            <p className="font-bold text-foreground text-sm">{lapangan.name}</p>
                            <p className="text-muted-foreground">
                                Tanggal: <span className="font-medium text-foreground">{selectedDate}</span>
                            </p>
                            <p className="text-muted-foreground">
                                Jam: <span className="font-medium text-foreground">{startTimeStr} - {endTimeStr} WIB ({durationHours} Jam)</span>
                            </p>
                            <p className="text-muted-foreground">
                                Total Harga Dasar: <span className="font-bold text-emerald-600 dark:text-emerald-400">Rp {totalPrice.toLocaleString('id-ID')}</span>
                            </p>
                        </div>

                        {/* Customer Information */}
                        <div className="space-y-3 text-xs">
                            <div className="space-y-1">
                                <Label htmlFor="customer_name">Nama Lengkap Pemesan</Label>
                                <Input
                                    id="customer_name"
                                    value={data.customer_name}
                                    onChange={(e) => setData('customer_name', e.target.value)}
                                    placeholder="Nama pemesan"
                                    required
                                    className="h-9 rounded-lg"
                                />
                                {errors.customer_name && <p className="text-rose-500 text-xs">{errors.customer_name}</p>}
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="customer_phone">Nomor WhatsApp / HP</Label>
                                <Input
                                    id="customer_phone"
                                    value={data.customer_phone}
                                    onChange={(e) => setData('customer_phone', e.target.value)}
                                    placeholder="Contoh: 081234567890"
                                    required
                                    className="h-9 rounded-lg"
                                />
                                {errors.customer_phone && <p className="text-rose-500 text-xs">{errors.customer_phone}</p>}
                            </div>

                            {/* Payment Method Option */}
                            <div className="space-y-1.5">
                                <Label>Metode Pembayaran</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setData('payment_method', 'transfer')}
                                        className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                                            data.payment_method === 'transfer'
                                                ? 'border-emerald-600 bg-emerald-500/10 font-bold ring-1 ring-emerald-600'
                                                : 'border-border bg-card text-muted-foreground hover:border-border/80'
                                        }`}
                                    >
                                        <CreditCard className="size-4 mb-1 text-emerald-600" />
                                        <div>
                                            <p className="text-xs text-foreground font-semibold">Transfer Bank</p>
                                            <p className="text-xs text-muted-foreground">Kode unik 3-digit</p>
                                        </div>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setData('payment_method', 'cash')}
                                        className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                                            data.payment_method === 'cash'
                                                ? 'border-emerald-600 bg-emerald-500/10 font-bold ring-1 ring-emerald-600'
                                                : 'border-border bg-card text-muted-foreground hover:border-border/80'
                                        }`}
                                    >
                                        <Banknote className="size-4 mb-1 text-emerald-600" />
                                        <div>
                                            <p className="text-xs text-foreground font-semibold">Cash di Lokasi</p>
                                            <p className="text-xs text-muted-foreground">Bayar ke kasir</p>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="notes">Catatan Tambahan (Opsional)</Label>
                                <Input
                                    id="notes"
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    placeholder="Contoh: Sewa rompi atau bola tambahan"
                                    className="h-9 rounded-lg"
                                />
                            </div>
                        </div>

                        {errors.start_time && (
                            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-600 text-xs flex items-center gap-2">
                                <AlertCircle className="size-4 shrink-0" />
                                <span>{errors.start_time}</span>
                            </div>
                        )}

                        {currentUser && currentUser.is_verified === false && (
                            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-700 dark:text-amber-300 flex items-start gap-2.5">
                                <AlertCircle className="size-4 text-amber-600 shrink-0 mt-0.5" />
                                <div className="space-y-1">
                                    <p className="font-semibold">Email Anda Belum Diverifikasi</p>
                                    <p className="text-xs leading-relaxed">
                                        Untuk melanjutkan pemesanan dan menjamin validitas invoice, silakan verifikasi email Anda ({currentUser.email}).
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="flex gap-2 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsCheckoutOpen(false)}
                                className="flex-1 rounded-xl h-10"
                            >
                                Batal
                            </Button>
                            {currentUser && currentUser.is_verified === false ? (
                                <Button
                                    asChild
                                    className="flex-1 bg-amber-600 hover:bg-amber-500 text-white rounded-xl h-10 font-bold"
                                >
                                    <Link href="/email/verify">Verifikasi Email Dulu</Link>
                                </Button>
                            ) : (
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl h-10 font-bold"
                                >
                                    {processing ? 'Memproses...' : 'Konfirmasi & Buat Invoice'}
                                </Button>
                            )}
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </PublicLayout>
    );
}
