import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { PublicLayout } from '@/layouts/public-layout';
import { CatalogIcon } from '@/components/catalog-icon';
import { LapanganDetailSkeleton } from '@/components/lapangan-detail-skeleton';
import {
    Clock,
    Star,
    Check,
    Info,
    Calendar,
    ChevronLeft,
    ChevronRight,
    MapPin,
    ShieldCheck,
    MessageSquare,
    User,
    RotateCcw,
    ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from '@/components/ui/dialog';
import { checkout as bookingCheckout } from '@/routes/booking';
import LapanganController from '@/actions/App/Http/Controllers/LapanganController';
import MembershipController from '@/actions/App/Http/Controllers/MembershipController';
import type { Lapangan, Booking } from '@/types/booking';
import type { User as AuthUser } from '@/types/auth';
import { formatTimeIndonesia } from '@/lib/locale';

interface AllowedDate {
    date: string;
    day_name: string;
    formatted: string;
}

interface LapanganDetailData {
    lapangan: Lapangan;
    allowedDates: AllowedDate[];
    existingBookings: Booking[];
    relatedLapangans: Lapangan[];
}

interface Props {
    slug?: string;
}

const emptyLapangan: Lapangan = {
    id: '',
    category_id: '',
    name: '',
    slug: '',
    price_per_hour: 0,
    operational_start: '00:00',
    operational_end: '00:00',
    slot_duration_minutes: 60,
    is_active: false,
};

export default function LapanganShow({ slug }: Props) {
    const { auth } = usePage<{ auth: { user: AuthUser | null } }>().props;
    const currentUser = auth.user;
    const [lapanganData, setLapanganData] = useState<Lapangan | null>(null);
    const [allowedDates, setAllowedDates] = useState<AllowedDate[]>([]);
    const [existingBookings, setExistingBookings] = useState<Booking[]>([]);
    const [relatedLapangans, setRelatedLapangans] = useState<Lapangan[]>([]);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [hasError, setHasError] = useState(false);
    const lapangan = lapanganData ?? emptyLapangan;

    const [selectedDate, setSelectedDate] = useState<string>('');
    const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
    const [currentTime, setCurrentTime] = useState(() => new Date());
    const galleryImages = useMemo(
        () => lapangan.images?.filter((image) => image.length > 0) ?? [],
        [lapangan.images],
    );
    const photos =
        galleryImages.length > 0
            ? galleryImages
            : [
                  'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80',
              ];
    const [activePhotoIndex, setActivePhotoIndex] = useState(0);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const currentPhotoIndex = Math.min(activePhotoIndex, photos.length - 1);
    const dragStartRef = useRef<{ x: number; y: number } | null>(null);
    const hasDraggedRef = useRef(false);

    useEffect(() => {
        const controller = new AbortController();
        const detailSlug = slug ?? '';

        const fetchLapangan = async () => {
            if (!detailSlug) {
                setHasError(true);
                setLoading(false);
                return;
            }

            try {
                const response = await fetch(
                    LapanganController.showData.url(detailSlug),
                    {
                        signal: controller.signal,
                        headers: {
                            Accept: 'application/json',
                            'X-Requested-With': 'XMLHttpRequest',
                        },
                    },
                );

                if (response.status === 404) {
                    setNotFound(true);
                    return;
                }

                if (!response.ok) {
                    throw new Error('Gagal mengambil detail lapangan.');
                }

                const data: LapanganDetailData = await response.json();
                setLapanganData(data.lapangan);
                setAllowedDates(data.allowedDates);
                setExistingBookings(data.existingBookings);
                setRelatedLapangans(data.relatedLapangans);
                setSelectedDate(data.allowedDates[0]?.date ?? '');
            } catch (error) {
                if (
                    error instanceof DOMException &&
                    error.name === 'AbortError'
                ) {
                    return;
                }

                setHasError(true);
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        };

        void fetchLapangan();

        return () => controller.abort();
    }, [slug]);

    const showPreviousPhoto = () => {
        setActivePhotoIndex(
            (currentPhotoIndex - 1 + photos.length) % photos.length,
        );
    };

    const showNextPhoto = () => {
        setActivePhotoIndex((currentPhotoIndex + 1) % photos.length);
    };

    const handleCarouselPointerDown = (
        event: React.PointerEvent<HTMLDivElement>,
    ) => {
        if (event.pointerType === 'mouse' && event.button !== 0) {
            return;
        }

        dragStartRef.current = { x: event.clientX, y: event.clientY };
        hasDraggedRef.current = false;
        event.currentTarget.setPointerCapture(event.pointerId);
    };

    const handleCarouselPointerMove = (
        event: React.PointerEvent<HTMLDivElement>,
    ) => {
        if (!dragStartRef.current) {
            return;
        }

        const deltaX = event.clientX - dragStartRef.current.x;
        const deltaY = event.clientY - dragStartRef.current.y;

        if (!hasDraggedRef.current) {
            const hasPassedDragThreshold = Math.abs(deltaX) >= 10;
            const isHorizontalGesture = Math.abs(deltaX) > Math.abs(deltaY);

            if (!hasPassedDragThreshold || !isHorizontalGesture) {
                return;
            }

            hasDraggedRef.current = true;
        }

        event.preventDefault();
    };

    const handleCarouselPointerUp = (
        event: React.PointerEvent<HTMLDivElement>,
    ) => {
        if (dragStartRef.current && hasDraggedRef.current) {
            const deltaX = event.clientX - dragStartRef.current.x;

            if (Math.abs(deltaX) >= 50) {
                if (deltaX < 0) {
                    showNextPhoto();
                } else {
                    showPreviousPhoto();
                }
            }
        }

        dragStartRef.current = null;

        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
        }
    };

    const handleCarouselClickCapture = (
        event: React.MouseEvent<HTMLDivElement>,
    ) => {
        if (!hasDraggedRef.current) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();
        hasDraggedRef.current = false;
    };

    const handleCarouselClick = (event: React.MouseEvent<HTMLDivElement>) => {
        if ((event.target as HTMLElement).closest('button')) {
            return;
        }

        setIsLightboxOpen(true);
    };

    const handleCarouselPointerCancel = (
        event: React.PointerEvent<HTMLDivElement>,
    ) => {
        dragStartRef.current = null;
        hasDraggedRef.current = false;

        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
        }
    };

    // Generate 1-hour hourly slots from operational_start to operational_end
    const hourlySlots = useMemo(() => {
        const slots: { start: string; end: string }[] = [];
        const startHour = parseInt(
            lapangan.operational_start.split(':')[0],
            10,
        );
        const endHour = parseInt(lapangan.operational_end.split(':')[0], 10);

        for (let h = startHour; h < endHour; h++) {
            const sHour = h.toString().padStart(2, '0') + ':00';
            const eHour = (h + 1).toString().padStart(2, '0') + ':00';
            slots.push({ start: sHour, end: eHour });
        }
        return slots;
    }, [lapangan.operational_start, lapangan.operational_end]);

    // Current time helper to disable past hours today
    const isToday = selectedDate === allowedDates[0]?.date;
    const currentTimeValue = formatTimeIndonesia(currentTime);

    useEffect(() => {
        const interval = window.setInterval(
            () => setCurrentTime(new Date()),
            60_000,
        );

        return () => window.clearInterval(interval);
    }, []);

    const findBookingForSlot = (start: string, end: string) => {
        return existingBookings.find((b) => {
            const bDate =
                typeof b.booking_date === 'string'
                    ? b.booking_date.split('T')[0].split(' ')[0]
                    : '';
            if (bDate !== selectedDate) return false;

            const bStart = b.start_time ? b.start_time.substring(0, 5) : '';
            const bEnd = b.end_time ? b.end_time.substring(0, 5) : '';

            return bStart < end && bEnd > start;
        });
    };

    // Check if slot is booked in database
    const isSlotBooked = (start: string, end: string) =>
        findBookingForSlot(start, end) !== undefined;

    // Check if slot is in past today
    const isSlotPast = (start: string) => {
        if (!isToday) return false;
        return start <= currentTimeValue;
    };

    // Slot click handler with continuous selection logic
    const handleSlotClick = (startTime: string) => {
        const allHours = hourlySlots.map((s) => s.start);

        // Clicking a selected slot trims the range at that slot instead of creating a gap.
        if (selectedSlots.includes(startTime)) {
            const selectedIndexes = selectedSlots
                .map((slot) => allHours.indexOf(slot))
                .filter((index) => index >= 0);
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

    const handleSlotDoubleClick = (startTime: string) => {
        const slot = hourlySlots.find((item) => item.start === startTime);

        if (
            !slot ||
            isSlotBooked(slot.start, slot.end) ||
            isSlotPast(slot.start)
        ) {
            return;
        }

        setSelectedSlots([startTime]);
    };

    // Calculate booking summary
    const durationHours = selectedSlots.length;
    const sortedSlots = [...selectedSlots].sort();
    const startTimeStr = sortedSlots[0] || '';
    const endTimeStr =
        sortedSlots.length > 0
            ? hourlySlots.find(
                  (s) => s.start === sortedSlots[sortedSlots.length - 1],
              )?.end || ''
            : '';
    const totalPrice = durationHours * lapangan.price_per_hour;
    // Navigate to the dedicated checkout page after a slot is selected.
    const handleProceedToCheckout = () => {
        router.visit(
            bookingCheckout.url(lapangan.slug, {
                query: {
                    booking_date: selectedDate,
                    start_time: startTimeStr,
                    duration_hours: durationHours,
                },
            }),
        );
    };

    if (loading) {
        return <LapanganDetailSkeleton />;
    }

    if (notFound) {
        return (
            <PublicLayout>
                <Head title="Lapangan Tidak Ditemukan" />
                <div className="public-container flex min-h-[60vh] max-w-[1240px] items-center justify-center py-16">
                    <div className="border-border bg-card w-full max-w-lg rounded-2xl border border-dashed p-10 text-center shadow-xs">
                        <h1 className="text-foreground text-xl font-bold">
                            Lapangan Tidak Ditemukan
                        </h1>
                        <p className="text-muted-foreground mt-2 text-sm">
                            Lapangan yang Anda cari tidak tersedia atau sudah
                            tidak aktif.
                        </p>
                        <Button asChild className="mt-5 rounded-xl">
                            <Link href="/lapangan">Kembali ke Katalog</Link>
                        </Button>
                    </div>
                </div>
            </PublicLayout>
        );
    }

    if (hasError) {
        return (
            <PublicLayout>
                <Head title="Gagal Memuat Lapangan" />
                <div className="public-container flex min-h-[60vh] max-w-[1240px] items-center justify-center py-16">
                    <div
                        role="alert"
                        className="border-destructive/20 bg-destructive/5 text-destructive w-full max-w-lg rounded-2xl border p-10 text-center"
                    >
                        <h1 className="text-xl font-bold">Gagal Memuat Data</h1>
                        <p className="mt-2 text-sm">
                            Detail lapangan belum dapat dimuat. Silakan coba
                            lagi.
                        </p>
                        <Button
                            type="button"
                            onClick={() => window.location.reload()}
                            className="mt-5 rounded-xl"
                        >
                            Coba Lagi
                        </Button>
                    </div>
                </div>
            </PublicLayout>
        );
    }

    return (
        <PublicLayout>
            <Head title={`${lapangan.name} - Sewa Lapangan`} />

            {/* Breadcrumbs strip */}
            <div className="border-border/60 bg-muted/20 text-muted-foreground border-b py-3 text-xs">
                <div className="public-container flex max-w-[1240px] items-center gap-2">
                    <Link href="/" className="hover:text-foreground">
                        Beranda
                    </Link>
                    <ChevronRight className="size-3.5" />
                    <Link href="/lapangan" className="hover:text-foreground">
                        Katalog Lapangan
                    </Link>
                    <ChevronRight className="size-3.5" />
                    <span className="text-foreground truncate font-medium">
                        {lapangan.name}
                    </span>
                </div>
            </div>

            <div className="public-container max-w-[1240px] py-8">
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                    {/* Left Column: Photos & Details (2 Cols) */}
                    <div className="space-y-8 lg:col-span-2">
                        {/* Main Photo Gallery */}
                        <div
                            className="group border-border/80 bg-card relative aspect-[16/9] touch-pan-y overflow-hidden rounded-2xl border shadow-sm select-none"
                            onPointerDown={handleCarouselPointerDown}
                            onPointerMove={handleCarouselPointerMove}
                            onPointerUp={handleCarouselPointerUp}
                            onPointerCancel={handleCarouselPointerCancel}
                            onClickCapture={handleCarouselClickCapture}
                            onClick={handleCarouselClick}
                        >
                            <button
                                type="button"
                                onClick={() => setIsLightboxOpen(true)}
                                aria-label={`Perbesar foto ${currentPhotoIndex + 1} dari ${lapangan.name}`}
                                className="absolute inset-0 size-full cursor-zoom-in text-left focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none focus-visible:ring-inset"
                            >
                                <img
                                    src={photos[currentPhotoIndex]}
                                    alt={`${lapangan.name} â€” foto ${currentPhotoIndex + 1}`}
                                    draggable={false}
                                    className="size-full object-cover"
                                />
                            </button>
                            {photos.length > 1 && (
                                <>
                                    <button
                                        type="button"
                                        onPointerDown={(event) =>
                                            event.stopPropagation()
                                        }
                                        onClick={showPreviousPhoto}
                                        aria-label="Lihat foto sebelumnya"
                                        className="absolute top-1/2 left-3 flex size-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/25 text-white/90 opacity-0 shadow-md backdrop-blur-sm transition-opacity duration-200 group-hover:opacity-100 hover:bg-black/45 hover:text-white focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none max-sm:opacity-100"
                                    >
                                        <ChevronLeft className="size-5" />
                                    </button>
                                    <button
                                        type="button"
                                        onPointerDown={(event) =>
                                            event.stopPropagation()
                                        }
                                        onClick={showNextPhoto}
                                        aria-label="Lihat foto berikutnya"
                                        className="absolute top-1/2 right-3 flex size-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/25 text-white/90 opacity-0 shadow-md backdrop-blur-sm transition-opacity duration-200 group-hover:opacity-100 hover:bg-black/45 hover:text-white focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none max-sm:opacity-100"
                                    >
                                        <ChevronRight className="size-5" />
                                    </button>
                                    <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-black/25 px-2.5 py-1.5 backdrop-blur-sm">
                                        {photos.map((_, index) => (
                                            <button
                                                key={index}
                                                type="button"
                                                onPointerDown={(event) =>
                                                    event.stopPropagation()
                                                }
                                                onClick={() =>
                                                    setActivePhotoIndex(index)
                                                }
                                                aria-label={`Lihat foto ${index + 1}`}
                                                aria-current={
                                                    currentPhotoIndex === index
                                                        ? 'true'
                                                        : undefined
                                                }
                                                className={`rounded-full transition-all duration-200 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none ${currentPhotoIndex === index ? 'size-2 bg-white ring-2 ring-white/25' : 'size-1.5 bg-white/40 hover:bg-white/70'}`}
                                            />
                                        ))}
                                    </div>
                                    <span className="absolute right-4 bottom-4 rounded-full bg-black/35 px-2.5 py-1 text-[11px] font-medium text-white/90 backdrop-blur-sm">
                                        {currentPhotoIndex + 1} /{' '}
                                        {photos.length}
                                    </span>
                                </>
                            )}
                            <div className="absolute top-4 left-4 flex gap-2">
                                <Badge className="bg-background/90 text-foreground border-border/40 border font-semibold backdrop-blur-md">
                                    <CatalogIcon
                                        name={
                                            lapangan.category?.icon ??
                                            lapangan.category?.slug
                                        }
                                        className="mr-1.5 size-3.5"
                                    />
                                    {lapangan.category?.name}
                                </Badge>
                                <Badge className="bg-primary text-primary-foreground font-semibold">
                                    Aktif & Tersedia
                                </Badge>
                            </div>
                        </div>

                        <Dialog
                            open={isLightboxOpen}
                            onOpenChange={setIsLightboxOpen}
                        >
                            <DialogContent
                                className="inset-0 top-0 left-0 flex h-screen max-h-none w-screen max-w-none translate-x-0 translate-y-0 items-center justify-center overflow-hidden rounded-none border-none bg-transparent p-0 shadow-none sm:w-screen sm:max-w-none"
                                showCloseButton
                            >
                                <DialogTitle className="sr-only">
                                    Pratinjau foto {currentPhotoIndex + 1} dari{' '}
                                    {lapangan.name}
                                </DialogTitle>
                                <DialogDescription className="sr-only">
                                    Gunakan tombol navigasi untuk melihat foto
                                    lainnya.
                                </DialogDescription>
                                <div className="relative flex h-[calc(100vh-1rem)] min-h-0 w-[calc(100vw-1rem)] items-center justify-center sm:h-[calc(100vh-2rem)] sm:w-screen">
                                    <img
                                        src={photos[currentPhotoIndex]}
                                        alt={`${lapangan.name} Ã¢â‚¬â€ foto ${currentPhotoIndex + 1}`}
                                        className="size-full max-h-[calc(100vh-2rem)] max-w-full object-contain"
                                    />
                                    {photos.length > 1 && (
                                        <>
                                            <button
                                                type="button"
                                                onClick={showPreviousPhoto}
                                                aria-label="Lihat foto sebelumnya"
                                                className="absolute top-1/2 left-2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none sm:left-4"
                                            >
                                                <ChevronLeft className="size-5" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={showNextPhoto}
                                                aria-label="Lihat foto berikutnya"
                                                className="absolute top-1/2 right-2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none sm:right-4"
                                            >
                                                <ChevronRight className="size-5" />
                                            </button>
                                            <span className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-xs font-medium text-white/90 sm:bottom-4">
                                                {currentPhotoIndex + 1} /{' '}
                                                {photos.length}
                                            </span>
                                        </>
                                    )}
                                </div>
                            </DialogContent>
                        </Dialog>

                        {/* Title & Stats */}
                        <div>
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <h1 className="text-foreground text-2xl font-extrabold tracking-tight sm:text-3xl">
                                    {lapangan.name}
                                </h1>
                                <div className="bg-card border-border flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-sm font-bold">
                                    <Star className="size-4 fill-amber-400 text-amber-400" />
                                    <span>
                                        {Number(
                                            lapangan.reviews_avg_rating ?? 5,
                                        ).toFixed(1)}
                                    </span>
                                    <span className="text-muted-foreground text-xs font-normal">
                                        ({lapangan.reviews_count ?? 0} ulasan)
                                    </span>
                                </div>
                            </div>

                            <p className="text-muted-foreground mt-3 text-sm leading-relaxed whitespace-pre-line">
                                {lapangan.description}
                            </p>
                        </div>

                        {/* Facilities Checklist */}
                        <div className="bg-card border-border/70 space-y-4 rounded-2xl border p-6">
                            <h3 className="text-foreground flex items-center gap-2 text-base font-bold">
                                <ShieldCheck className="text-primary size-4" />{' '}
                                Fasilitas Lapangan
                            </h3>
                            <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-3">
                                {lapangan.facilities?.map((f) => (
                                    <div
                                        key={f.id}
                                        className="text-foreground/90 flex items-center gap-2"
                                    >
                                        <div className="bg-primary/10 text-primary flex size-5 shrink-0 items-center justify-center rounded-full">
                                            <CatalogIcon
                                                name={f.icon}
                                                className="size-3.5"
                                            />
                                        </div>
                                        <span>{f.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Rules & Policy Box */}
                        <div className="bg-muted/30 border-border/60 space-y-2 rounded-2xl border p-5 text-xs">
                            <h4 className="text-foreground flex items-center gap-1.5 font-semibold">
                                <Info className="size-4 text-sky-500" />{' '}
                                Kebijakan Booking & Pembatalan:
                            </h4>
                            <ul className="text-muted-foreground list-inside list-disc space-y-1">
                                <li>
                                    Booking hanya tersedia untuk maksimal 3 hari
                                    ke depan (hari ini, besok, lusa).
                                </li>
                                <li>
                                    Pembatalan gratis dapat dilakukan paling
                                    lambat 24 jam sebelum jam bermain.
                                </li>
                                <li>
                                    Untuk transfer bank, pastikan mentransfer
                                    nominal hingga 3-digit kode validasi unik
                                    agar terverifikasi otomatis.
                                </li>
                                <li>
                                    Harap hadir di lokasi 10 menit sebelum waktu
                                    bermain dimulai.
                                </li>
                            </ul>
                        </div>

                        {/* Customer Reviews */}
                        <div className="border-border/60 space-y-4 border-t pt-4">
                            <h3 className="text-foreground flex items-center gap-2 text-lg font-bold">
                                <MessageSquare className="text-primary size-5" />{' '}
                                Ulasan Pemain ({lapangan.reviews?.length ?? 0})
                            </h3>

                            {lapangan.reviews && lapangan.reviews.length > 0 ? (
                                <div className="space-y-3">
                                    {lapangan.reviews.map((rev) => (
                                        <div
                                            key={rev.id}
                                            className="border-border/60 bg-card space-y-2 rounded-xl border p-4 text-xs"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="bg-primary/10 text-primary flex size-7 items-center justify-center rounded-full font-bold">
                                                        {rev.user?.name
                                                            ? rev.user.name[0]
                                                            : 'U'}
                                                    </div>
                                                    <div>
                                                        <p className="text-foreground font-semibold">
                                                            {rev.user?.name}
                                                        </p>
                                                        <p className="text-muted-foreground text-xs">
                                                            Penyewa
                                                            Terverifikasi
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1 text-amber-400">
                                                    {Array.from({
                                                        length: rev.rating,
                                                    }).map((_, i) => (
                                                        <Star
                                                            key={i}
                                                            className="size-3 fill-current"
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                            {rev.comment && (
                                                <p className="text-muted-foreground leading-relaxed">
                                                    {rev.comment}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-muted-foreground text-xs">
                                    Belum ada ulasan untuk lapangan ini.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Interactive Slot Booking Picker (1 Col Sticky) */}
                    <div className="lg:col-span-1">
                        <div className="border-border/70 bg-card shadow-foreground/5 space-y-5 self-start rounded-2xl border p-5 shadow-lg sm:p-6 lg:sticky lg:top-24">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <span className="text-muted-foreground text-xs font-medium">
                                        Harga Sewa
                                    </span>
                                    <div className="mt-0.5 flex items-baseline gap-1">
                                        <span className="text-primary text-2xl font-extrabold tracking-tight sm:text-3xl">
                                            Rp{' '}
                                            {Number(
                                                lapangan.price_per_hour,
                                            ).toLocaleString('id-ID')}
                                        </span>
                                        <span className="text-muted-foreground text-xs">
                                            / jam
                                        </span>
                                    </div>
                                </div>
                                <div className="bg-primary/10 text-primary mt-1 flex size-10 shrink-0 items-center justify-center rounded-xl">
                                    <Calendar className="size-5" />
                                </div>
                            </div>

                            {/* 1. Date Selector Tabs (hari ini sampai 7 hari ke depan) */}
                            <div className="space-y-2.5">
                                <Label className="text-foreground text-xs font-bold tracking-wide uppercase">
                                    Pilih Tanggal Main
                                </Label>
                                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                                    {allowedDates.map((d) => {
                                        const isSelected =
                                            selectedDate === d.date;
                                        const isCurrentDate =
                                            d.date === allowedDates[0]?.date;
                                        return (
                                            <button
                                                key={d.date}
                                                type="button"
                                                onClick={() => {
                                                    setSelectedDate(d.date);
                                                    setSelectedSlots([]);
                                                }}
                                                aria-pressed={isSelected}
                                                className={`rounded-xl border px-2 py-3 text-center transition-colors ${
                                                    isSelected
                                                        ? `border-primary bg-primary text-primary-foreground shadow-primary/20 shadow-sm ${isCurrentDate ? 'border-dashed' : ''}`
                                                        : `border-border bg-muted/20 text-muted-foreground hover:border-primary/50 hover:bg-primary/5 hover:text-foreground ${isCurrentDate ? 'border-primary/70 bg-primary/5 border-dashed' : ''}`
                                                }`}
                                            >
                                                <p className="text-[10px] font-semibold tracking-wider uppercase opacity-80">
                                                    {d.day_name}
                                                </p>
                                                <p className="mt-1 text-xs font-bold">
                                                    {d.formatted.split(' ')[0]}{' '}
                                                    {d.formatted.split(' ')[1]}
                                                </p>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* 2. Interactive Time Slot Grid */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between gap-2">
                                    <Label className="text-foreground text-xs font-bold tracking-wide uppercase">
                                        Pilih Jam Bermain
                                    </Label>
                                    {selectedSlots.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => setSelectedSlots([])}
                                            className="border-border bg-background text-foreground hover:border-primary hover:bg-primary/10 hover:text-primary focus-visible:ring-primary inline-flex min-h-9 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-semibold shadow-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
                                            aria-label="Reset pilihan jam"
                                        >
                                            <RotateCcw className="size-3" />
                                            Reset waktu
                                        </button>
                                    )}
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground text-xs">
                                        {lapangan.operational_start} -{' '}
                                        {lapangan.operational_end} WIB
                                    </span>
                                    <span className="text-muted-foreground">
                                        {selectedSlots.length > 0
                                            ? `${selectedSlots.length} jam dipilih`
                                            : 'Pilih jam berurutan'}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-2 pr-1">
                                    {hourlySlots.map((slot) => {
                                        const booking = findBookingForSlot(
                                            slot.start,
                                            slot.end,
                                        );
                                        const booked = booking !== undefined;
                                        const memberReserved =
                                            booking?.is_membership === true;
                                        const past = isSlotPast(slot.start);
                                        if (past) return null;
                                        const selected = selectedSlots.includes(
                                            slot.start,
                                        );
                                        const disabled = booked || past;

                                        return (
                                            <button
                                                key={slot.start}
                                                type="button"
                                                disabled={disabled}
                                                aria-disabled={disabled}
                                                onClick={
                                                    disabled
                                                        ? undefined
                                                        : () =>
                                                              handleSlotClick(
                                                                  slot.start,
                                                              )
                                                }
                                                onDoubleClick={
                                                    disabled
                                                        ? undefined
                                                        : () =>
                                                              handleSlotDoubleClick(
                                                                  slot.start,
                                                              )
                                                }
                                                className={`flex min-h-11 items-center justify-between gap-1.5 rounded-lg border px-2.5 py-2 text-xs font-semibold transition-colors ${
                                                    selected
                                                        ? 'border-primary bg-primary text-primary-foreground shadow-primary/20 shadow-sm'
                                                        : disabled
                                                          ? 'border-border/40 bg-muted/40 text-muted-foreground/50 cursor-not-allowed'
                                                          : 'border-border bg-card text-foreground hover:border-primary/50 hover:bg-primary/5'
                                                }`}
                                            >
                                                <span>
                                                    {slot.start} - {slot.end}
                                                </span>
                                                {selected ? (
                                                    <Check className="size-3.5 stroke-[3]" />
                                                ) : booked ? (
                                                    <span className="text-xs font-bold tracking-tight text-rose-500 uppercase">
                                                        {memberReserved
                                                            ? 'Jadwal member'
                                                            : 'Terisi'}
                                                    </span>
                                                ) : past ? (
                                                    <span className="text-muted-foreground text-xs font-bold tracking-tight uppercase">
                                                        Lewat
                                                    </span>
                                                ) : null}
                                            </button>
                                        );
                                    })}
                                </div>

                                <p className="text-muted-foreground text-[11px]">
                                    Slot bertanda Jadwal member dicadangkan
                                    untuk jadwal rutin member dan tidak dapat
                                    dibooking harian.
                                </p>

                                {/* Slot Legend */}
                                <div className="text-muted-foreground border-border/60 flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5 border-t pt-3 text-[11px]">
                                    <div className="flex items-center gap-1.5">
                                        <div className="bg-primary size-2.5 rounded" />
                                        <span>Terpilih</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="border-border bg-card size-2.5 rounded border" />
                                        <span>Tersedia</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="bg-muted/80 size-2.5 rounded" />
                                        <span>Terisi / Lewat</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="size-2.5 rounded bg-rose-100 dark:bg-rose-950" />
                                        <span>Jadwal member</span>
                                    </div>
                                </div>
                            </div>

                            {/* 3. Live Price & Duration Summary */}
                            {durationHours > 0 && (
                                <div className="border-primary/20 bg-primary/10 space-y-1.5 rounded-xl border p-3.5 text-xs">
                                    <div className="text-muted-foreground flex justify-between">
                                        <span>Waktu:</span>
                                        <span className="text-foreground font-semibold">
                                            {startTimeStr} - {endTimeStr} WIB
                                        </span>
                                    </div>
                                    <div className="text-muted-foreground flex justify-between">
                                        <span>Durasi:</span>
                                        <span className="text-foreground font-semibold">
                                            {durationHours} Jam
                                        </span>
                                    </div>
                                    <div className="text-foreground border-primary/20 flex justify-between border-t pt-1.5 text-sm font-bold">
                                        <span>Total Biaya:</span>
                                        <span className="text-primary dark:text-primary">
                                            Rp{' '}
                                            {totalPrice.toLocaleString('id-ID')}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Action Button */}
                            <div className="border-primary/20 bg-primary/5 rounded-xl border p-3.5">
                                <p className="text-foreground text-sm font-bold">
                                    Ingin jadwal rutin?
                                </p>
                                <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                                    Daftar membership untuk mengunci jadwal
                                    bermain selama 30 hari.
                                </p>
                                {currentUser ? (
                                    <Button
                                        asChild
                                        variant="outline"
                                        className="border-primary/40 text-primary hover:bg-primary/10 mt-3 h-10 w-full rounded-xl font-bold"
                                    >
                                        <Link
                                            href={MembershipController.checkout.url(
                                                lapangan.slug,
                                            )}
                                        >
                                            Daftar Membership
                                            <ArrowRight
                                                className="size-4"
                                                aria-hidden="true"
                                            />
                                        </Link>
                                    </Button>
                                ) : (
                                    <Button
                                        asChild
                                        variant="outline"
                                        className="border-primary/40 text-primary hover:bg-primary/10 mt-3 h-10 w-full rounded-xl font-bold"
                                    >
                                        <Link href="/login">
                                            Masuk untuk Membership
                                        </Link>
                                    </Button>
                                )}
                            </div>

                            {currentUser ? (
                                <Button
                                    type="button"
                                    disabled={durationHours === 0}
                                    onClick={handleProceedToCheckout}
                                    className="bg-primary text-primary-foreground shadow-primary/20 hover:bg-primary/90 h-11 w-full rounded-xl font-bold shadow-md"
                                >
                                    {durationHours === 0
                                        ? 'Pilih Jam Terlebih Dahulu'
                                        : 'Lanjut ke Pembayaran'}
                                    {durationHours > 0 && (
                                        <ArrowRight
                                            className="size-4 shrink-0"
                                            aria-hidden="true"
                                        />
                                    )}
                                </Button>
                            ) : (
                                <Button
                                    asChild
                                    className="bg-primary text-primary-foreground hover:bg-primary/90 h-11 w-full rounded-xl font-bold"
                                >
                                    <Link href="/login">
                                        Masuk Untuk Booking
                                    </Link>
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
}
