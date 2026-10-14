import { Head, Link, router, useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';
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
    CreditCard,
    Crown,
    Layers,
    Eye,
    Receipt,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
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
    currentType: string;
}

export default function BookingHistory({
    bookings,
    currentStatus = 'all',
    currentType = 'all',
}: Props) {
    const [selectedBookingForReview, setSelectedBookingForReview] =
        useState<Booking | null>(null);
    const [selectedMembershipForDetail, setSelectedMembershipForDetail] =
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
            {
                status: status !== 'all' ? status : '',
                type: currentType !== 'all' ? currentType : '',
            },
            { preserveScroll: true },
        );
    };

    const filterType = (type: string) => {
        router.get(
            '/my-bookings',
            {
                status: currentStatus !== 'all' ? currentStatus : '',
                type: type !== 'all' ? type : '',
            },
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

        postReview(
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

    const statusTabs = [
        { key: 'all', label: 'Semua' },
        { key: 'pending', label: 'Menunggu Bayar' },
        { key: 'pending_validation', label: 'Menunggu Validasi' },
        { key: 'approved', label: 'Terkonfirmasi' },
        { key: 'cancelled', label: 'Dibatalkan' },
    ];

    const typeTabs = [
        { key: 'all', label: 'Semua Pesanan' },
        { key: 'regular', label: 'Booking Harian' },
        { key: 'membership', label: 'Paket Membership' },
    ];

    return (
        <PublicLayout>
            <Head title="Riwayat Booking Saya" />

            <div className="w-full max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 overflow-x-clip">
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

                {/* Type Filter Tabs - Segmented on Mobile, Pills on Desktop */}
                <div className="pt-4 pb-2 sm:pt-5 sm:pb-3">
                    <div className="bg-muted/70 dark:bg-muted/40 p-1 rounded-2xl grid grid-cols-3 gap-1 sm:flex sm:w-auto sm:gap-2 sm:bg-transparent sm:p-0">
                        {typeTabs.map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => filterType(tab.key)}
                                className={`inline-flex items-center justify-center rounded-xl px-2 py-2 sm:px-4 sm:py-2 text-xs font-semibold whitespace-nowrap transition-all duration-200 active:scale-95 ${
                                    currentType === tab.key
                                        ? tab.key === 'membership'
                                            ? 'bg-background text-indigo-700 shadow-xs ring-1 ring-indigo-500/30 sm:bg-indigo-500/15 sm:ring-1 sm:ring-indigo-500/30 dark:bg-card dark:text-indigo-300'
                                            : 'bg-background text-primary shadow-xs ring-1 ring-primary/20 sm:bg-primary/10 sm:ring-primary/30 dark:bg-card'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 sm:bg-muted/50'
                                }`}
                            >
                                {tab.key === 'membership' && (
                                    <Crown className="mr-1 sm:mr-1.5 size-3 sm:size-3.5 shrink-0" />
                                )}
                                <span className="truncate">
                                    {tab.key === 'all' && (
                                        <>
                                            <span className="sm:hidden">Semua</span>
                                            <span className="hidden sm:inline">Semua Pesanan</span>
                                        </>
                                    )}
                                    {tab.key === 'regular' && (
                                        <>
                                            <span className="sm:hidden">Harian</span>
                                            <span className="hidden sm:inline">Booking Harian</span>
                                        </>
                                    )}
                                    {tab.key === 'membership' && (
                                        <>
                                            <span className="sm:hidden">Membership</span>
                                            <span className="hidden sm:inline">Paket Membership</span>
                                        </>
                                    )}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Status Filter Tabs */}
                <div className="border-border/40 border-b pb-3 pt-1 sm:pb-4 sm:pt-2">
                    <div className="no-scrollbar -mx-4 flex items-center gap-2 overflow-x-auto px-4 overscroll-x-contain touch-pan-x scroll-smooth sm:mx-0 sm:px-0">
                        {statusTabs.map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => filterStatus(tab.key)}
                                className={`inline-flex shrink-0 items-center justify-center rounded-full px-3.5 py-1.5 text-xs leading-none font-semibold whitespace-nowrap transition-all duration-200 active:scale-95 ${
                                    currentStatus === tab.key
                                        ? 'bg-primary text-primary-foreground shadow-sm'
                                        : 'bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                        <div className="w-4 shrink-0 sm:hidden" aria-hidden="true" />
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
                                Anda belum memiliki riwayat booking untuk filter
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
                        bookings.data.map((item) =>
                            item.membership_id ? (
                                <MembershipItemCard
                                    key={`membership-${item.membership_id}-${item.id}`}
                                    item={item}
                                    getStatusBadge={getStatusBadge}
                                    onOpenDetail={() =>
                                        setSelectedMembershipForDetail(item)
                                    }
                                />
                            ) : (
                                <RegularBookingCard
                                    key={item.id}
                                    item={item}
                                    getStatusBadge={getStatusBadge}
                                    onReview={handleOpenReview}
                                />
                            ),
                        )
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

            {/* Membership Detail Sessions Modal */}
            <MembershipDetailModal
                booking={selectedMembershipForDetail}
                onClose={() => setSelectedMembershipForDetail(null)}
                getStatusBadge={getStatusBadge}
                onReview={(session) => {
                    handleOpenReview(session);
                }}
            />

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

                        <div className="space-y-1.5">
                            <Label htmlFor="comment" className="text-xs">
                                Ulasan Anda (Opsional)
                            </Label>
                            <Textarea
                                id="comment"
                                placeholder="Bagikan kesan Anda tentang fasilitas, kebersihan, dan kenyamanan lapangan ini..."
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                rows={3}
                                className="resize-none text-xs"
                            />
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedBookingForReview(null)}
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                size="sm"
                                disabled={reviewProcessing}
                                className="bg-amber-500 hover:bg-amber-600 text-white"
                            >
                                {reviewProcessing
                                    ? 'Menyimpan...'
                                    : 'Kirim Ulasan'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </PublicLayout>
    );
}

// ─── Regular Booking Card ─────────────────────────────────────────────────────

function RegularBookingCard({
    item,
    getStatusBadge,
    onReview,
}: {
    item: Booking;
    getStatusBadge: (status: string) => React.ReactNode;
    onReview: (booking: Booking) => void;
}) {
    return (
        <div className="group border-border/70 bg-card hover:border-border relative flex min-w-0 flex-col overflow-hidden rounded-2xl border shadow-xs transition-all duration-200 hover:shadow-md">
            {/* Card Top Bar */}
            <div className="border-border/50 bg-muted/20 flex items-center justify-between gap-2 border-b px-3.5 py-2.5 sm:px-5 sm:py-3">
                <div className="flex min-w-0 items-center gap-2">
                    <span className="border-border/60 bg-background text-foreground inline-flex items-center rounded-lg border px-2 py-0.5 font-mono text-[11px] font-bold shadow-2xs">
                        #{item.booking_code}
                    </span>
                    <Badge
                        variant="outline"
                        className="border-border/70 bg-background/50 text-muted-foreground hidden text-[11px] font-medium sm:inline-flex"
                    >
                        Booking Harian
                    </Badge>
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
                {/* Main Row */}
                <div className="flex items-start gap-3 sm:gap-4">
                    <div className="border-border/60 bg-muted relative size-16 shrink-0 overflow-hidden rounded-xl border sm:size-20">
                        <img
                            src={
                                item.lapangan?.images?.[0] ||
                                'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=400&q=80'
                            }
                            alt={item.lapangan?.name ?? 'Lapangan'}
                            className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                            loading="lazy"
                        />
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-1.5 sm:hidden">
                            {item.lapangan?.category && (
                                <span className="bg-primary/10 text-primary inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold">
                                    {item.lapangan.category.name}
                                </span>
                            )}
                            <Badge
                                variant="outline"
                                className="border-border/70 bg-background/50 text-muted-foreground text-[10px] font-medium"
                            >
                                Harian
                            </Badge>
                        </div>
                        <h3 className="text-foreground line-clamp-1 text-sm font-bold sm:text-base">
                            {item.lapangan?.name}
                        </h3>
                        <p className="text-muted-foreground line-clamp-1 text-xs">
                            Durasi sesi:{' '}
                            <strong>{item.duration_hours} Jam</strong> bermain
                        </p>
                    </div>
                </div>

                {/* Info Grid Strip */}
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
                                {formatDateIndonesia(item.booking_date)}
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
                                {item.start_time} - {item.end_time} WIB
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

                {/* Rejection Alert */}
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

            {/* Card Footer */}
            <div className="border-border/60 bg-muted/15 flex flex-col gap-3 border-t p-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <div className="flex items-center justify-between sm:block">
                    <span className="text-muted-foreground block text-[10px] font-semibold tracking-wider uppercase sm:text-[11px]">
                        Total Pembayaran
                    </span>
                    <p className="text-primary text-base font-black tracking-tight sm:text-lg">
                        Rp{' '}
                        {Number(item.total_price).toLocaleString('id-ID')}
                    </p>
                </div>

                <div className="flex w-full items-center gap-2 sm:w-auto">
                    {item.payment_status === 'approved' && !item.review && (
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onReview(item)}
                            className="h-9 flex-1 gap-1.5 rounded-xl border-amber-500/30 text-xs font-semibold text-amber-600 hover:bg-amber-500/10 sm:flex-initial dark:text-amber-400"
                        >
                            <Star className="size-3.5 fill-amber-400 text-amber-400" />
                            Beri Ulasan
                        </Button>
                    )}

                    {item.review && (
                        <div className="bg-amber-500/10 hidden items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-amber-700 sm:flex dark:text-amber-300">
                            <Star className="size-3.5 fill-amber-400 text-amber-400" />
                            <span>Rating: {item.review.rating}/5</span>
                        </div>
                    )}

                    <Button
                        asChild
                        size="sm"
                        className="bg-primary hover:bg-primary/90 text-primary-foreground h-9 flex-1 rounded-xl text-xs font-semibold sm:flex-initial"
                    >
                        <Link href={`/booking/${item.booking_code}`}>
                            Lihat Detail <ArrowRight className="size-3.5" />
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}

// ─── Membership Item Card (Grouped as 1 Data) ─────────────────────────────────

function MembershipItemCard({
    item,
    getStatusBadge,
    onOpenDetail,
}: {
    item: Booking;
    getStatusBadge: (status: string) => React.ReactNode;
    onOpenDetail: () => void;
}) {
    const membership = item.membership;
    const sessions = useMemo(() => {
        const rawSessions = membership?.bookings?.length
            ? membership.bookings
            : [item];
        return [...rawSessions].sort(
            (a, b) =>
                new Date(a.booking_date).getTime() -
                    new Date(b.booking_date).getTime() ||
                a.start_time.localeCompare(b.start_time),
        );
    }, [membership, item]);

    const sessionCount = sessions.length;
    const earliestDate = sessions[0]?.booking_date ?? item.booking_date;
    const latestDate =
        sessions[sessions.length - 1]?.booking_date ?? item.booking_date;

    const totalPrice = membership?.amount ?? Number(item.total_price);
    const dominantStatus =
        membership?.payment_status ?? item.payment_status;

    const lapanganName =
        item.lapangan?.name ??
        membership?.reservations?.[0]?.lapangan?.name ??
        'Lapangan Membership';
    const categoryName =
        item.lapangan?.category?.name ??
        membership?.reservations?.[0]?.lapangan?.category?.name ??
        '';
    const lapanganImage =
        item.lapangan?.images?.[0] ??
        membership?.reservations?.[0]?.lapangan?.images?.[0] ??
        null;

    return (
        <div className="border-indigo-500/20 bg-card relative flex min-w-0 flex-col overflow-hidden rounded-2xl border shadow-xs transition-all duration-200 hover:shadow-md">
            {/* Card Top Bar */}
            <div className="border-indigo-500/15 bg-indigo-500/[0.04] flex items-center justify-between gap-2 border-b px-3.5 py-2.5 sm:px-5 sm:py-3">
                <div className="flex min-w-0 items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-2 py-0.5 text-[11px] font-bold text-indigo-700 shadow-2xs dark:text-indigo-300">
                        <Crown className="size-3 text-indigo-500" /> Paket
                        Membership
                    </span>
                    {categoryName && (
                        <span className="bg-primary/10 text-primary hidden items-center rounded-md px-2 py-0.5 text-[11px] font-semibold sm:inline-flex">
                            {categoryName}
                        </span>
                    )}
                </div>
                <div className="shrink-0">{getStatusBadge(dominantStatus)}</div>
            </div>

            {/* Card Body */}
            <div className="flex min-w-0 flex-col gap-3.5 p-3.5 sm:p-5">
                {/* Main Row */}
                <div className="flex items-start gap-3 sm:gap-4">
                    <div className="border-indigo-500/20 bg-muted relative size-16 shrink-0 overflow-hidden rounded-xl border sm:size-20">
                        <img
                            src={
                                lapanganImage ||
                                'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=400&q=80'
                            }
                            alt={lapanganName}
                            className="size-full object-cover"
                            loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/30 to-transparent" />
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-1.5 sm:hidden">
                            {categoryName && (
                                <span className="bg-primary/10 text-primary inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold">
                                    {categoryName}
                                </span>
                            )}
                        </div>
                        <h3 className="text-foreground line-clamp-1 text-sm font-bold sm:text-base">
                            {lapanganName}
                        </h3>
                        <p className="text-muted-foreground text-xs">
                            <Layers className="mr-1 inline size-3 text-indigo-500" />
                            <strong className="text-indigo-700 dark:text-indigo-300">
                                {sessionCount} Sesi
                            </strong>{' '}
                            terjadwal dalam paket
                        </p>
                    </div>
                </div>

                {/* Quick Info Grid Strip */}
                <div className="bg-indigo-500/[0.04] border-indigo-500/10 grid grid-cols-1 gap-2 rounded-xl border p-2.5 text-xs sm:grid-cols-3 sm:p-3">
                    <div className="text-foreground/90 flex items-center gap-2">
                        <span className="border-indigo-500/20 bg-background flex size-7 shrink-0 items-center justify-center rounded-lg border text-indigo-500">
                            <Calendar className="size-3.5" />
                        </span>
                        <div className="min-w-0 leading-tight">
                            <span className="text-muted-foreground block text-[10px] font-medium">
                                Rentang Jadwal
                            </span>
                            <span className="block truncate font-semibold">
                                {earliestDate === latestDate
                                    ? formatDateIndonesia(earliestDate)
                                    : `${formatDateIndonesia(earliestDate)} s/d ${formatDateIndonesia(latestDate)}`}
                            </span>
                        </div>
                    </div>

                    <div className="text-foreground/90 flex items-center gap-2">
                        <span className="border-indigo-500/20 bg-background flex size-7 shrink-0 items-center justify-center rounded-lg border text-indigo-500">
                            <Layers className="size-3.5" />
                        </span>
                        <div className="min-w-0 leading-tight">
                            <span className="text-muted-foreground block text-[10px] font-medium">
                                Total Sesi
                            </span>
                            <span className="block truncate font-semibold">
                                {sessionCount} Sesi Terjadwal
                            </span>
                        </div>
                    </div>

                    <div className="text-foreground/90 flex items-center gap-2">
                        <span className="border-indigo-500/20 bg-background flex size-7 shrink-0 items-center justify-center rounded-lg border text-indigo-500">
                            <CreditCard className="size-3.5" />
                        </span>
                        <div className="min-w-0 leading-tight">
                            <span className="text-muted-foreground block text-[10px] font-medium">
                                Total Biaya
                            </span>
                            <span className="block truncate font-semibold">
                                Rp {totalPrice.toLocaleString('id-ID')}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Card Footer */}
            <div className="border-indigo-500/15 bg-indigo-500/[0.03] flex flex-col gap-3 border-t p-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <div className="flex items-center justify-between sm:block">
                    <span className="text-muted-foreground block text-[10px] font-semibold tracking-wider uppercase sm:text-[11px]">
                        Total Paket Membership
                    </span>
                    <p className="text-base font-black tracking-tight text-indigo-700 sm:text-lg dark:text-indigo-300">
                        Rp {totalPrice.toLocaleString('id-ID')}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={onOpenDetail}
                        className="h-9 flex-1 gap-1.5 rounded-xl border-indigo-500/30 text-xs font-semibold text-indigo-700 hover:bg-indigo-500/10 sm:flex-initial dark:text-indigo-300"
                    >
                        <Eye className="size-3.5" />
                        Lihat Detail Sesi ({sessionCount})
                    </Button>

                    {item.membership_id && (
                        <Button
                            asChild
                            size="sm"
                            className="bg-indigo-600 hover:bg-indigo-700 text-white h-9 flex-1 rounded-xl text-xs font-semibold sm:flex-initial"
                        >
                            <Link href={`/membership/${item.membership_id}`}>
                                Detail Membership{' '}
                                <ArrowRight className="size-3.5" />
                            </Link>
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Membership Detail Modal (Popup Sesi Lengkap) ─────────────────────────────

function MembershipDetailModal({
    booking,
    onClose,
    getStatusBadge,
    onReview,
}: {
    booking: Booking | null;
    onClose: () => void;
    getStatusBadge: (status: string) => React.ReactNode;
    onReview: (session: Booking) => void;
}) {
    if (!booking) return null;

    const membership = booking.membership;
    const rawSessions = membership?.bookings?.length
        ? membership.bookings
        : [booking];
    const sessions = [...rawSessions].sort(
        (a, b) =>
            new Date(a.booking_date).getTime() -
                new Date(b.booking_date).getTime() ||
            a.start_time.localeCompare(b.start_time),
    );

    const lapanganName =
        booking.lapangan?.name ??
        membership?.reservations?.[0]?.lapangan?.name ??
        'Lapangan';
    const categoryName =
        booking.lapangan?.category?.name ??
        membership?.reservations?.[0]?.lapangan?.category?.name ??
        '';
    const totalPrice = membership?.amount ?? Number(booking.total_price);
    const dominantStatus =
        membership?.payment_status ?? booking.payment_status;

    return (
        <Dialog open={!!booking} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-h-[92vh] flex flex-col gap-0 p-0 w-[calc(100vw-1.5rem)] sm:w-full sm:max-w-2xl overflow-hidden rounded-2xl">
                {/* Header dengan pr-10 agar aman dari tombol X */}
                <DialogHeader className="p-4 sm:p-5 pb-3 sm:pb-4 border-b border-border/60 bg-muted/20 text-left">
                    <div className="pr-8 sm:pr-10 space-y-1.5">
                        {/* Baris Badge */}
                        <div className="flex flex-wrap items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:text-indigo-300">
                                <Crown className="size-3 text-indigo-500" />{' '}
                                Paket Membership
                            </span>
                            {categoryName && (
                                <span className="bg-primary/10 text-primary rounded-md px-2 py-0.5 text-[10px] font-semibold">
                                    {categoryName}
                                </span>
                            )}
                            <div>{getStatusBadge(dominantStatus)}</div>
                        </div>

                        {/* Judul Lapangan */}
                        <DialogTitle className="text-base sm:text-lg font-bold text-foreground leading-snug">
                            {lapanganName}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                            Seluruh rincian {sessions.length} sesi jadwal permainan dalam paket membership ini.
                        </DialogDescription>
                    </div>

                    {/* Ringkasan 3 Kolom Compact */}
                    <div className="grid grid-cols-3 gap-2 mt-3 p-2.5 rounded-xl border border-border/50 bg-background/70 dark:bg-card/70 text-left">
                        <div className="min-w-0">
                            <span className="text-[10px] text-muted-foreground block font-medium">
                                Total Sesi
                            </span>
                            <span className="text-xs font-bold text-foreground truncate block">
                                {sessions.length} Sesi
                            </span>
                        </div>
                        <div className="min-w-0">
                            <span className="text-[10px] text-muted-foreground block font-medium">
                                Total Biaya
                            </span>
                            <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 truncate block">
                                Rp {totalPrice.toLocaleString('id-ID')}
                            </span>
                        </div>
                        <div className="min-w-0">
                            <span className="text-[10px] text-muted-foreground block font-medium">
                                Metode
                            </span>
                            <span className="text-xs font-bold uppercase text-foreground truncate block">
                                {booking.payment_method}
                            </span>
                        </div>
                    </div>
                </DialogHeader>

                {/* Daftar Sesi Ramping */}
                <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-2 max-h-[52vh]">
                    <div className="flex items-center justify-between pb-1 px-0.5">
                        <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                            <Calendar className="size-3.5 text-indigo-500" />
                            Jadwal Sesi Permainan
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                            Urutan tanggal main
                        </span>
                    </div>

                    {sessions.map((session, index) => (
                        <div
                            key={session.id}
                            className="bg-card hover:bg-muted/30 border border-border/60 rounded-xl p-3 transition-colors space-y-2"
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20 font-bold text-[10px]">
                                        {index + 1}
                                    </span>
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold text-foreground truncate">
                                            {formatDateIndonesia(session.booking_date)}
                                        </p>
                                        <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                            <Clock className="size-3 shrink-0" />
                                            <span>{session.start_time} – {session.end_time} WIB</span>
                                            <span>·</span>
                                            <span className="font-mono text-[10px]">#{session.booking_code}</span>
                                        </p>
                                    </div>
                                </div>

                                <div className="shrink-0">
                                    {getStatusBadge(session.payment_status)}
                                </div>
                            </div>

                            {/* Action Review Jika Approved */}
                            {session.payment_status === 'approved' && (
                                <div className="flex justify-end pt-1.5 border-t border-border/30">
                                    {!session.review ? (
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            onClick={() => onReview(session)}
                                            className="h-6 px-2 text-[10px] rounded-lg border-amber-500/30 text-amber-600 hover:bg-amber-500/10 dark:text-amber-400 gap-1"
                                        >
                                            <Star className="size-2.5 fill-amber-400 text-amber-400" />
                                            Beri Ulasan
                                        </Button>
                                    ) : (
                                        <span className="text-muted-foreground inline-flex items-center gap-1 text-[10px] bg-amber-500/10 px-2 py-0.5 rounded-md font-semibold text-amber-700 dark:text-amber-300">
                                            <Star className="size-2.5 fill-amber-400 text-amber-400" />
                                            {session.review.rating}/5
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Footer 1 Baris Sejajar */}
                <DialogFooter className="p-3 sm:p-4 border-t border-border/60 bg-muted/20 flex flex-row items-center justify-between gap-2">
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={onClose}
                        className="text-xs rounded-xl flex-1 sm:flex-initial"
                    >
                        Tutup
                    </Button>

                    {booking.membership_id && (
                        <Button
                            asChild
                            size="sm"
                            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded-xl flex-1 sm:flex-initial gap-1.5"
                        >
                            <Link href={`/membership/${booking.membership_id}`}>
                                <Receipt className="size-3.5" />
                                Tagihan & Invoice
                            </Link>
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
