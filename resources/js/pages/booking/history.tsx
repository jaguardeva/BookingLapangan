import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { PublicLayout } from '@/layouts/public-layout';
import {
    Calendar,
    Clock,
    CheckCircle2,
    XCircle,
    Star,
    ArrowRight,
    MessageSquare,
    AlertCircle,
    CalendarPlus,
    Search,
    CreditCard,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { formatDateIndonesia } from '@/lib/locale';
import { Pagination } from '@/components/pagination';
import type { Booking } from '@/types/booking';

interface Props {
    bookings: {
        data: Booking[];
        links: { url: string | null; label: string; active: boolean }[];
        total: number;
        from?: number | null;
        to?: number | null;
        current_page?: number;
        last_page?: number;
        per_page?: number;
    };
    currentStatus: string;
}

export default function BookingHistory({
    bookings,
    currentStatus = 'all',
}: Props) {
    const [selectedBookingForReview, setSelectedBookingForReview] =
        useState<Booking | null>(null);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');

    const {
        post: postReview,
        processing: reviewProcessing,
        reset: resetReview,
    } = useForm({
        booking_id: 0,
        rating: 5,
        comment: '',
    });

    const filterStatus = (status: string) => {
        router.get(
            '/my-bookings',
            { status: status !== 'all' ? status : '' },
            { preserveScroll: true },
        );
    };

    const handleOpenReview = (booking: Booking) => {
        setSelectedBookingForReview(booking);
        setRating(5);
        setComment('');
    };

    const handleReviewSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedBookingForReview) return;

        router.post(
            '/reviews',
            {
                booking_id: selectedBookingForReview.id,
                rating,
                comment,
            },
            {
                onSuccess: () => {
                    setSelectedBookingForReview(null);
                    resetReview();
                },
            },
        );
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'approved':
                return (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                        <CheckCircle2 className="size-3 shrink-0" />{' '}
                        Terkonfirmasi
                    </span>
                );
            case 'pending_validation':
                return (
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/25 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                        <Clock className="size-3 shrink-0" /> Menunggu Validasi
                    </span>
                );
            case 'rejected':
                return (
                    <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/25 bg-rose-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-rose-700 dark:text-rose-400">
                        <XCircle className="size-3 shrink-0" /> Ditolak
                    </span>
                );
            case 'cancelled':
                return (
                    <span className="border-border/70 bg-muted/60 text-muted-foreground inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold">
                        <XCircle className="size-3 shrink-0" /> Dibatalkan
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1 rounded-full border border-sky-500/25 bg-sky-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-sky-700 dark:text-sky-400">
                        <Clock className="size-3 shrink-0" /> Menunggu Bayar
                    </span>
                );
        }
    };

    const tabs = [
        { key: 'all', label: 'Semua' },
        { key: 'pending', label: 'Menunggu Bayar' },
        { key: 'pending_validation', label: 'Menunggu Validasi' },
        { key: 'approved', label: 'Terkonfirmasi' },
        { key: 'cancelled', label: 'Dibatalkan' },
    ];

    return (
        <PublicLayout>
            <Head title="Riwayat Booking Saya" />

            <div className="public-container max-w-5xl py-8">
                <div className="border-border/60 flex flex-col justify-between gap-4 border-b pb-6 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl">
                            Riwayat Booking Saya
                        </h1>
                        <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
                            Kelola semua pesanan lapangan olahraga, unduh
                            invoice, dan beri penilaian permainan.
                        </p>
                    </div>

                    <Button
                        asChild
                        className="bg-primary hover:bg-primary/90 text-primary-foreground h-10 w-full rounded-xl px-4 text-sm font-semibold sm:w-auto sm:px-5"
                    >
                        <Link href="/lapangan">
                            <CalendarPlus className="size-4 shrink-0" />
                            Booking Lapangan Baru
                        </Link>
                    </Button>
                </div>

                {/* Status Filter Tabs */}
                <div className="border-border/40 no-scrollbar -mx-4 flex gap-2 overflow-x-auto border-b px-4 py-4 sm:mx-0 sm:px-0">
                    {tabs.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => filterStatus(tab.key)}
                            className={`inline-flex shrink-0 items-center justify-center rounded-full px-3.5 py-1.5 text-xs leading-none font-semibold whitespace-nowrap transition-colors ${
                                currentStatus === tab.key
                                    ? 'bg-primary text-primary-foreground shadow-sm'
                                    : 'bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <Pagination
                    links={bookings.links}
                    from={bookings.from}
                    to={bookings.to}
                    total={bookings.total}
                    lastPage={bookings.last_page}
                    perPage={bookings.per_page}
                    variant="summary"
                    className="pt-6"
                />

                {/* Bookings List */}
                <div className="space-y-4 pt-6">
                    {bookings.data.length === 0 ? (
                        <div className="border-border bg-card rounded-2xl border border-dashed p-16 text-center">
                            <Calendar className="text-muted-foreground/40 mx-auto mb-3 size-10" />
                            <h3 className="text-foreground text-base font-bold">
                                Belum Ada Riwayat Booking
                            </h3>
                            <p className="text-muted-foreground mx-auto mt-1 max-w-sm text-xs">
                                Anda belum memiliki riwayat booking untuk status
                                ini. Ayo sewa lapangan favoritmu sekarang!
                            </p>
                            <Button
                                asChild
                                size="sm"
                                className="bg-primary hover:bg-primary/90 text-primary-foreground mt-4 rounded-xl"
                            >
                                <Link href="/lapangan">Cari Lapangan</Link>
                            </Button>
                        </div>
                    ) : (
                        bookings.data.map((item) => (
                            <div
                                key={item.id}
                                className="group border-border/70 bg-card hover:border-border relative flex min-w-0 flex-col overflow-hidden rounded-2xl border shadow-xs transition-all duration-200 hover:shadow-md"
                            >
                                {/* Card Top Bar: Code + Category & Status */}
                                <div className="border-border/50 bg-muted/20 flex items-center justify-between gap-2 border-b px-3.5 py-2.5 sm:px-5 sm:py-3">
                                    <div className="flex min-w-0 items-center gap-2">
                                        <span className="border-border/60 bg-background text-foreground inline-flex items-center rounded-lg border px-2 py-0.5 font-mono text-[11px] font-bold shadow-2xs">
                                            #{item.booking_code}
                                        </span>
                                        {item.lapangan?.category && (
                                            <span className="bg-primary/10 text-primary hidden items-center rounded-md px-2 py-0.5 text-[11px] font-semibold sm:inline-flex">
                                                {item.lapangan.category.name}
                                            </span>
                                        )}
                                    </div>
                                    <div className="shrink-0">
                                        {getStatusBadge(item.payment_status)}
                                    </div>
                                </div>

                                {/* Card Body */}
                                <div className="flex min-w-0 flex-col gap-3.5 p-3.5 sm:p-5">
                                    {/* Main Row: Thumbnail + Title + Details */}
                                    <div className="flex items-start gap-3 sm:gap-4">
                                        <div className="border-border/60 bg-muted relative size-16 shrink-0 overflow-hidden rounded-xl border sm:size-20">
                                            <img
                                                src={
                                                    item.lapangan
                                                        ?.images?.[0] ||
                                                    'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=400&q=80'
                                                }
                                                alt={
                                                    item.lapangan?.name ??
                                                    'Lapangan'
                                                }
                                                className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                loading="lazy"
                                            />
                                        </div>

                                        <div className="min-w-0 flex-1 space-y-1">
                                            {item.lapangan?.category && (
                                                <span className="bg-primary/10 text-primary inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold sm:hidden">
                                                    {
                                                        item.lapangan.category
                                                            .name
                                                    }
                                                </span>
                                            )}
                                            <h3 className="text-foreground line-clamp-1 text-sm font-bold sm:text-base">
                                                {item.lapangan?.name}
                                            </h3>
                                            <p className="text-muted-foreground line-clamp-1 text-xs">
                                                Durasi sesi:{' '}
                                                <strong>
                                                    {item.duration_hours} Jam
                                                </strong>{' '}
                                                bermain
                                            </p>
                                        </div>
                                    </div>

                                    {/* Info Grid Strip: Clean glanceable chips */}
                                    <div className="bg-muted/40 grid grid-cols-1 gap-2 rounded-xl p-2.5 text-xs sm:grid-cols-3 sm:p-3">
                                        <div className="text-foreground/90 flex items-center gap-2">
                                            <span className="border-border/60 bg-background text-primary flex size-7 shrink-0 items-center justify-center rounded-lg border">
                                                <Calendar className="size-3.5" />
                                            </span>
                                            <div className="min-w-0 leading-tight">
                                                <span className="text-muted-foreground block text-[10px] font-medium">
                                                    Tanggal Main
                                                </span>
                                                <span className="block truncate font-semibold">
                                                    {formatDateIndonesia(
                                                        item.booking_date,
                                                    )}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="text-foreground/90 flex items-center gap-2">
                                            <span className="border-border/60 bg-background text-primary flex size-7 shrink-0 items-center justify-center rounded-lg border">
                                                <Clock className="size-3.5" />
                                            </span>
                                            <div className="min-w-0 leading-tight">
                                                <span className="text-muted-foreground block text-[10px] font-medium">
                                                    Waktu Sesi
                                                </span>
                                                <span className="block truncate font-semibold">
                                                    {item.start_time} -{' '}
                                                    {item.end_time} WIB
                                                </span>
                                            </div>
                                        </div>

                                        <div className="text-foreground/90 flex items-center gap-2">
                                            <span className="border-border/60 bg-background text-primary flex size-7 shrink-0 items-center justify-center rounded-lg border">
                                                <CreditCard className="size-3.5" />
                                            </span>
                                            <div className="min-w-0 leading-tight">
                                                <span className="text-muted-foreground block text-[10px] font-medium">
                                                    Metode Bayar
                                                </span>
                                                <span className="block truncate font-semibold uppercase">
                                                    {item.payment_method}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Rejection Alert Box */}
                                    {item.payment_status === 'rejected' &&
                                        item.rejection_reason && (
                                            <div className="flex items-start gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-2.5 text-xs text-rose-700 dark:text-rose-400">
                                                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                                                <div className="min-w-0 flex-1 leading-snug">
                                                    <strong className="font-semibold">
                                                        Alasan Penolakan:
                                                    </strong>{' '}
                                                    {item.rejection_reason}
                                                </div>
                                            </div>
                                        )}
                                </div>

                                {/* Card Footer: Total Price & Actions */}
                                <div className="border-border/60 bg-muted/15 flex flex-col gap-3 border-t p-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                                    <div className="flex items-center justify-between sm:block">
                                        <span className="text-muted-foreground block text-[10px] font-semibold tracking-wider uppercase sm:text-[11px]">
                                            Total Pembayaran
                                        </span>
                                        <p className="text-primary text-base font-black tracking-tight sm:text-lg">
                                            Rp{' '}
                                            {Number(
                                                item.total_price,
                                            ).toLocaleString('id-ID')}
                                        </p>
                                    </div>

                                    <div className="flex w-full items-center gap-2 sm:w-auto">
                                        {item.payment_status === 'approved' &&
                                            !item.review && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() =>
                                                        handleOpenReview(item)
                                                    }
                                                    className="h-9 flex-1 rounded-xl border-amber-500/30 text-xs font-semibold text-amber-600 hover:bg-amber-500/10 sm:flex-initial dark:text-amber-400"
                                                >
                                                    <Star className="size-3.5 fill-amber-400 text-amber-400" />{' '}
                                                    Beri Ulasan
                                                </Button>
                                            )}

                                        <Button
                                            asChild
                                            size="sm"
                                            className="bg-primary text-primary-foreground hover:bg-primary/90 h-9 flex-1 rounded-xl text-xs font-semibold shadow-xs sm:flex-initial"
                                        >
                                            <Link
                                                href={`/booking/${item.booking_code}`}
                                            >
                                                Lihat Invoice{' '}
                                                <ArrowRight className="size-3.5" />
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Pagination */}
                {bookings.links && (
                    <Pagination
                        links={bookings.links}
                        from={bookings.from}
                        to={bookings.to}
                        total={bookings.total}
                        lastPage={bookings.last_page}
                        perPage={bookings.per_page}
                        variant="navigation"
                        className="border-border/50 mt-8 border-t pt-6"
                    />
                )}
            </div>

            {/* Rating Modal */}
            <Dialog
                open={!!selectedBookingForReview}
                onOpenChange={(open) =>
                    !open && setSelectedBookingForReview(null)
                }
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <div className="flex items-start gap-3">
                            <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
                                <Star className="size-5" />
                            </div>
                            <div className="flex flex-col gap-1">
                                <DialogTitle>
                                    Beri Penilaian Lapangan
                                </DialogTitle>
                                <DialogDescription className="text-xs">
                                    Bagaimana pengalaman bermain Anda di{' '}
                                    {selectedBookingForReview?.lapangan?.name}?
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <form
                        onSubmit={handleReviewSubmit}
                        className="space-y-4 pt-2"
                    >
                        <div className="flex items-center justify-center gap-2 py-3">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    className="p-1 transition-transform hover:scale-110"
                                >
                                    <Star
                                        className={`size-7 ${
                                            star <= rating
                                                ? 'fill-amber-400 text-amber-400'
                                                : 'text-muted-foreground/40'
                                        }`}
                                    />
                                </button>
                            ))}
                        </div>

                        <div className="space-y-1 text-xs">
                            <Label htmlFor="comment">
                                Komentar & Ulasan Anda
                            </Label>
                            <Textarea
                                id="comment"
                                value={comment}
                                onChange={(
                                    e: React.ChangeEvent<HTMLTextAreaElement>,
                                ) => setComment(e.target.value)}
                                placeholder="Ceritakan kondisi rumput/lantai, fasilitas penerangan, kebersihan, dll..."
                                rows={3}
                                className="rounded-xl text-xs"
                            />
                        </div>

                        <div className="flex gap-2 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() =>
                                    setSelectedBookingForReview(null)
                                }
                                className="flex-1 rounded-xl"
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                className="bg-primary hover:bg-primary/90 text-primary-foreground flex-1 rounded-xl font-bold"
                            >
                                Kirim Penilaian
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </PublicLayout>
    );
}
