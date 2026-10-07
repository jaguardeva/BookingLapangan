import { Head, Link, useForm, usePage } from "@inertiajs/react";
import { useMemo, useRef, useState } from "react";
import { PublicLayout } from "@/layouts/public-layout";
import {
    Clock,
    Star,
    Check,
    AlertCircle,
    Info,
    Calendar,
    ChevronLeft,
    ChevronRight,
    MapPin,
    ShieldCheck,
    CreditCard,
    Banknote,
    MessageSquare,
    User,
    RotateCcw,
    ShoppingCart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { store as storeBooking } from "@/routes/booking";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import type { Lapangan, Booking } from "@/types/booking";
import type { User as AuthUser } from "@/types/auth";
import { formatTimeIndonesia } from "@/lib/locale";

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
    const availablePoints = currentUser?.available_points ?? 0;

    const [selectedDate, setSelectedDate] = useState<string>(
        allowedDates[0]?.date || "",
    );
    const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const galleryImages = useMemo(
        () => lapangan.images?.filter((image) => image.length > 0) ?? [],
        [lapangan.images],
    );
    const photos =
        galleryImages.length > 0
            ? galleryImages
            : [
                  "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80",
              ];
    const [activePhotoIndex, setActivePhotoIndex] = useState(0);
    const currentPhotoIndex = Math.min(activePhotoIndex, photos.length - 1);
    const dragStartRef = useRef<{ x: number; y: number } | null>(null);
    const hasDraggedRef = useRef(false);

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
        if (event.pointerType === "mouse" && event.button !== 0) {
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

    const handleCarouselPointerCancel = (
        event: React.PointerEvent<HTMLDivElement>,
    ) => {
        dragStartRef.current = null;
        hasDraggedRef.current = false;

        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
        }
    };

    // Form for booking submission
    const { data, setData, post, processing, errors, reset } = useForm({
        lapangan_id: lapangan.id,
        booking_date: allowedDates[0]?.date || "",
        start_time: "",
        duration_hours: 1,
        payment_method: "transfer" as "cash" | "transfer",
        use_points: false,
        customer_name: currentUser?.name || "",
        customer_phone: currentUser?.phone || "",
        notes: "",
    });

    // Generate 1-hour hourly slots from operational_start to operational_end
    const hourlySlots = useMemo(() => {
        const slots: { start: string; end: string }[] = [];
        const startHour = parseInt(
            lapangan.operational_start.split(":")[0],
            10,
        );
        const endHour = parseInt(lapangan.operational_end.split(":")[0], 10);

        for (let h = startHour; h < endHour; h++) {
            const sHour = h.toString().padStart(2, "0") + ":00";
            const eHour = (h + 1).toString().padStart(2, "0") + ":00";
            slots.push({ start: sHour, end: eHour });
        }
        return slots;
    }, [lapangan.operational_start, lapangan.operational_end]);

    // Current time helper to disable past hours today
    const now = new Date();
    const isToday = selectedDate === allowedDates[0]?.date;
    const currentTime = formatTimeIndonesia(now);

    // Check if slot is booked in database
    const isSlotBooked = (start: string, end: string) => {
        return existingBookings.some((b) => {
            const bDate =
                typeof b.booking_date === "string"
                    ? b.booking_date.split("T")[0].split(" ")[0]
                    : "";
            if (bDate !== selectedDate) return false;

            const bStart = b.start_time ? b.start_time.substring(0, 5) : "";
            const bEnd = b.end_time ? b.end_time.substring(0, 5) : "";

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

    // Calculate booking summary
    const durationHours = selectedSlots.length;
    const sortedSlots = [...selectedSlots].sort();
    const startTimeStr = sortedSlots[0] || "";
    const endTimeStr =
        sortedSlots.length > 0
            ? hourlySlots.find(
                  (s) => s.start === sortedSlots[sortedSlots.length - 1],
              )?.end || ""
            : "";
    const totalPrice = durationHours * lapangan.price_per_hour;
    const pointsDiscount =
        data.payment_method === "transfer" && data.use_points
            ? Math.min(availablePoints, totalPrice)
            : 0;
    const priceAfterPoints = totalPrice - pointsDiscount;

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
        post(storeBooking.url(), {
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
                            className="group border-border/80 bg-card relative aspect-[16/9] touch-pan-y select-none overflow-hidden rounded-2xl border shadow-sm"
                            onPointerDown={handleCarouselPointerDown}
                            onPointerMove={handleCarouselPointerMove}
                            onPointerUp={handleCarouselPointerUp}
                            onPointerCancel={handleCarouselPointerCancel}
                            onClickCapture={handleCarouselClickCapture}
                        >
                            <img
                                src={photos[currentPhotoIndex]}
                                alt={`${lapangan.name} — foto ${currentPhotoIndex + 1}`}
                                draggable={false}
                                className="size-full object-cover"
                            />
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
                                                        ? "true"
                                                        : undefined
                                                }
                                                className={`rounded-full transition-all duration-200 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none ${currentPhotoIndex === index ? "size-2 bg-white ring-2 ring-white/25" : "size-1.5 bg-white/40 hover:bg-white/70"}`}
                                            />
                                        ))}
                                    </div>
                                    <span className="absolute right-4 bottom-4 rounded-full bg-black/35 px-2.5 py-1 text-[11px] font-medium text-white/90 backdrop-blur-sm">
                                        {currentPhotoIndex + 1} /{" "}
                                        {photos.length}
                                    </span>
                                </>
                            )}
                            <div className="absolute top-4 left-4 flex gap-2">
                                <Badge className="bg-background/90 text-foreground border-border/40 border font-semibold backdrop-blur-md">
                                    {lapangan.category?.name}
                                </Badge>
                                <Badge className="bg-primary text-primary-foreground font-semibold">
                                    Aktif & Tersedia
                                </Badge>
                            </div>
                        </div>

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
                                <ShieldCheck className="text-primary size-4" />{" "}
                                Fasilitas Lapangan
                            </h3>
                            <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-3">
                                {lapangan.facilities?.map((f) => (
                                    <div
                                        key={f.id}
                                        className="text-foreground/90 flex items-center gap-2"
                                    >
                                        <div className="bg-primary/10 text-primary flex size-5 shrink-0 items-center justify-center rounded-full">
                                            <Check className="size-3" />
                                        </div>
                                        <span>{f.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Rules & Policy Box */}
                        <div className="bg-muted/30 border-border/60 space-y-2 rounded-2xl border p-5 text-xs">
                            <h4 className="text-foreground flex items-center gap-1.5 font-semibold">
                                <Info className="size-4 text-sky-500" />{" "}
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
                                <MessageSquare className="text-primary size-5" />{" "}
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
                                                            : "U"}
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
                        <div className="border-border/70 bg-card shadow-foreground/5 sticky top-6 space-y-5 rounded-2xl border p-5 shadow-lg sm:p-6">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <span className="text-muted-foreground text-xs font-medium">
                                        Harga Sewa
                                    </span>
                                    <div className="mt-0.5 flex items-baseline gap-1">
                                        <span className="text-primary text-2xl font-extrabold tracking-tight sm:text-3xl">
                                            Rp{" "}
                                            {Number(
                                                lapangan.price_per_hour,
                                            ).toLocaleString("id-ID")}
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

                            {/* 1. Date Selector Tabs (Hari Ini, Besok, Lusa) */}
                            <div className="space-y-2.5">
                                <Label className="text-foreground text-xs font-bold tracking-wide uppercase">
                                    Pilih Tanggal Main
                                </Label>
                                <div className="grid grid-cols-3 gap-2">
                                    {allowedDates.map((d) => {
                                        const isSelected =
                                            selectedDate === d.date;
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
                                                        ? "border-primary bg-primary text-primary-foreground shadow-primary/20 shadow-sm"
                                                        : "border-border bg-muted/20 text-muted-foreground hover:border-primary/50 hover:bg-primary/5 hover:text-foreground"
                                                }`}
                                            >
                                                <p className="text-[10px] font-semibold tracking-wider uppercase opacity-80">
                                                    {d.day_name}
                                                </p>
                                                <p className="mt-1 text-xs font-bold">
                                                    {d.formatted.split(" ")[0]}{" "}
                                                    {d.formatted.split(" ")[1]}
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
                                            className="text-muted-foreground hover:bg-primary/10 hover:text-primary focus-visible:ring-primary inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:outline-none"
                                            aria-label="Reset pilihan jam"
                                        >
                                            <RotateCcw className="size-3" />
                                            Reset jam
                                        </button>
                                    )}
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground text-xs">
                                        {lapangan.operational_start} -{" "}
                                        {lapangan.operational_end} WIB
                                    </span>
                                    <span className="text-muted-foreground">
                                        {selectedSlots.length > 0
                                            ? `${selectedSlots.length} jam dipilih`
                                            : "Pilih jam berurutan"}
                                    </span>
                                </div>

                                <div className="grid max-h-64 grid-cols-2 gap-2 overflow-y-auto pr-1">
                                    {hourlySlots.map((slot) => {
                                        const booked = isSlotBooked(
                                            slot.start,
                                            slot.end,
                                        );
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
                                                className={`flex min-h-11 items-center justify-between gap-1.5 rounded-lg border px-2.5 py-2 text-xs font-semibold transition-colors ${
                                                    selected
                                                        ? "border-primary bg-primary text-primary-foreground shadow-primary/20 shadow-sm"
                                                        : disabled
                                                          ? "border-border/40 bg-muted/40 text-muted-foreground/50 cursor-not-allowed"
                                                          : "border-border bg-card text-foreground hover:border-primary/50 hover:bg-primary/5"
                                                }`}
                                            >
                                                <span>
                                                    {slot.start} - {slot.end}
                                                </span>
                                                {selected ? (
                                                    <Check className="size-3.5 stroke-[3]" />
                                                ) : booked ? (
                                                    <span className="text-xs font-bold tracking-tight text-rose-500 uppercase">
                                                        Terisi
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
                                            Rp{" "}
                                            {totalPrice.toLocaleString("id-ID")}
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
                                    className="bg-primary text-primary-foreground shadow-primary/20 hover:bg-primary/90 h-11 w-full rounded-xl font-bold shadow-md"
                                >
                                    {durationHours === 0
                                        ? "Pilih Jam Terlebih Dahulu"
                                        : "Lanjut ke Pembayaran →"}
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

            {/* Checkout Confirmation Dialog */}
            <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
                <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
                    <DialogHeader>
                        <div className="flex items-start gap-3">
                            <div className="bg-primary/10 text-primary mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl">
                                <ShoppingCart className="size-5" />
                            </div>
                            <div className="flex flex-col gap-1">
                                <DialogTitle>
                                    Konfirmasi Booking Lapangan
                                </DialogTitle>
                                <DialogDescription className="text-xs">
                                    Periksa kembali jadwal dan masukkan
                                    informasi kontak Anda untuk konfirmasi
                                    pesanan.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <form
                        onSubmit={handleBookingSubmit}
                        className="space-y-5 pt-2"
                    >
                        {/* Customer Information */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="customer_name">
                                    Nama Lengkap Pemesan
                                </Label>
                                <Input
                                    id="customer_name"
                                    value={data.customer_name}
                                    onChange={(e) =>
                                        setData("customer_name", e.target.value)
                                    }
                                    placeholder="Nama pemesan"
                                    required
                                    className="h-9 rounded-lg"
                                />
                                {errors.customer_name && (
                                    <p className="text-xs text-rose-500">
                                        {errors.customer_name}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="customer_phone">
                                    Nomor WhatsApp / HP
                                </Label>
                                <Input
                                    id="customer_phone"
                                    value={data.customer_phone}
                                    onChange={(e) =>
                                        setData(
                                            "customer_phone",
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Contoh: 081234567890"
                                    required
                                    className="h-9 rounded-lg"
                                />
                                {errors.customer_phone && (
                                    <p className="text-xs text-rose-500">
                                        {errors.customer_phone}
                                    </p>
                                )}
                            </div>

                            {/* Payment Method Option */}
                            <div className="space-y-2">
                                <Label className="text-sm">
                                    Metode Pembayaran
                                </Label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setData(
                                                "payment_method",
                                                "transfer",
                                            )
                                        }
                                        className={`flex flex-col justify-between rounded-xl border p-3 text-left transition-all ${
                                            data.payment_method === "transfer"
                                                ? "border-primary bg-primary/10 ring-primary font-bold ring-1"
                                                : "border-border bg-card text-muted-foreground hover:border-border/80"
                                        }`}
                                    >
                                        <CreditCard className="text-primary mb-1 size-4" />
                                        <div>
                                            <p className="text-foreground text-xs font-semibold">
                                                Transfer Bank
                                            </p>
                                            <p className="text-muted-foreground text-xs">
                                                Kode unik 3-digit
                                            </p>
                                        </div>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setData((previousData) => ({
                                                ...previousData,
                                                payment_method: "cash",
                                                use_points: false,
                                            }))
                                        }
                                        className={`flex flex-col justify-between rounded-xl border p-3 text-left transition-all ${
                                            data.payment_method === "cash"
                                                ? "border-primary bg-primary/10 ring-primary font-bold ring-1"
                                                : "border-border bg-card text-muted-foreground hover:border-border/80"
                                        }`}
                                    >
                                        <Banknote className="text-primary mb-1 size-4" />
                                        <div>
                                            <p className="text-foreground text-xs font-semibold">
                                                Cash di Lokasi
                                            </p>
                                            <p className="text-muted-foreground text-xs">
                                                Bayar ke kasir
                                            </p>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            {data.payment_method === "transfer" &&
                                availablePoints > 0 && (
                                    <div className="border-primary/30 bg-primary/10 space-y-2 rounded-xl border p-3">
                                        <div>
                                            <Label>
                                                Gunakan Poin Tersedia?
                                            </Label>
                                            <p className="text-muted-foreground text-xs">
                                                Saldo yang dapat digunakan:{" "}
                                                {availablePoints.toLocaleString(
                                                    "id-ID",
                                                )}{" "}
                                                poin. Poin mengurangi harga
                                                sewa, sedangkan kode unik tetap
                                                ditambahkan ke transfer.
                                            </p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant={
                                                    data.use_points
                                                        ? "default"
                                                        : "outline"
                                                }
                                                onClick={() =>
                                                    setData("use_points", true)
                                                }
                                            >
                                                Ya, Gunakan Poin
                                            </Button>
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant={
                                                    !data.use_points
                                                        ? "default"
                                                        : "outline"
                                                }
                                                onClick={() =>
                                                    setData("use_points", false)
                                                }
                                            >
                                                Tidak
                                            </Button>
                                        </div>
                                    </div>
                                )}

                            <div className="space-y-2">
                                <Label htmlFor="notes">
                                    Catatan Tambahan (Opsional)
                                </Label>
                                <Input
                                    id="notes"
                                    value={data.notes}
                                    onChange={(e) =>
                                        setData("notes", e.target.value)
                                    }
                                    placeholder="Contoh: Sewa rompi atau bola tambahan"
                                    className="h-9 rounded-lg"
                                />
                            </div>
                        </div>

                        {/* Booking Summary */}
                        <div className="bg-muted/40 border-border/70 space-y-2 rounded-xl border p-4 text-sm">
                            <p className="text-foreground font-semibold">
                                Ringkasan Booking
                            </p>
                            <p className="text-foreground font-bold">
                                {lapangan.name}
                            </p>
                            <p className="text-muted-foreground">
                                Tanggal:{" "}
                                <span className="text-foreground font-medium">
                                    {selectedDate}
                                </span>
                            </p>
                            <p className="text-muted-foreground">
                                Jam:{" "}
                                <span className="text-foreground font-medium">
                                    {startTimeStr} - {endTimeStr} WIB (
                                    {durationHours} Jam)
                                </span>
                            </p>
                            <p className="text-muted-foreground">
                                Total Harga Dasar:{" "}
                                <span className="text-primary dark:text-primary font-bold">
                                    Rp {totalPrice.toLocaleString("id-ID")}
                                </span>
                            </p>
                            {pointsDiscount > 0 && (
                                <p className="text-muted-foreground">
                                    Diskon Poin:{" "}
                                    <span className="text-primary dark:text-primary font-bold">
                                        - Rp{" "}
                                        {pointsDiscount.toLocaleString("id-ID")}
                                    </span>
                                </p>
                            )}
                            <p className="text-muted-foreground">
                                Harga setelah poin:{" "}
                                <span className="text-foreground font-bold">
                                    Rp{" "}
                                    {priceAfterPoints.toLocaleString("id-ID")}
                                </span>
                            </p>
                        </div>

                        {errors.start_time && (
                            <div className="flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-600">
                                <AlertCircle className="size-4 shrink-0" />
                                <span>{errors.start_time}</span>
                            </div>
                        )}

                        {currentUser && currentUser.is_verified === false && (
                            <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300">
                                <AlertCircle className="mt-0.5 size-4 shrink-0 text-amber-600" />
                                <div className="space-y-1">
                                    <p className="font-semibold">
                                        Email Anda Belum Diverifikasi
                                    </p>
                                    <p className="text-xs leading-relaxed">
                                        Untuk melanjutkan pemesanan dan menjamin
                                        validitas invoice, silakan verifikasi
                                        email Anda ({currentUser.email}).
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="flex gap-2 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsCheckoutOpen(false)}
                                className="h-10 flex-1 rounded-xl"
                            >
                                Batal
                            </Button>
                            {currentUser &&
                            currentUser.is_verified === false ? (
                                <Button
                                    asChild
                                    className="h-10 flex-1 rounded-xl bg-amber-600 font-bold text-white hover:bg-amber-500"
                                >
                                    <Link href="/email/verify">
                                        Verifikasi Email Dulu
                                    </Link>
                                </Button>
                            ) : (
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 flex-1 rounded-xl font-bold"
                                >
                                    {processing
                                        ? "Memproses..."
                                        : "Konfirmasi & Buat Invoice"}
                                </Button>
                            )}
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </PublicLayout>
    );
}
