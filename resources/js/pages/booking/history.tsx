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
    };
    currentStatus: string;
}

export default function BookingHistory({ bookings, currentStatus = 'all' }: Props) {
    const [selectedBookingForReview, setSelectedBookingForReview] = useState<Booking | null>(null);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');

    const { post: postReview, processing: reviewProcessing, reset: resetReview } = useForm({
        booking_id: 0,
        rating: 5,
        comment: '',
    });

    const filterStatus = (status: string) => {
        router.get('/my-bookings', { status: status !== 'all' ? status : '' }, { preserveScroll: true });
    };

    const handleOpenReview = (booking: Booking) => {
        setSelectedBookingForReview(booking);
        setRating(5);
        setComment('');
    };

    const handleReviewSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedBookingForReview) return;

        router.post('/reviews', {
            booking_id: selectedBookingForReview.id,
            rating,
            comment,
        }, {
            onSuccess: () => {
                setSelectedBookingForReview(null);
                resetReview();
            },
        });
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'approved':
                return (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                        <CheckCircle2 className="size-3 shrink-0" /> Terkonfirmasi
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
                    <span className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-muted/60 px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
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
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-border/60 gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                            Riwayat Booking Saya
                        </h1>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                            Kelola semua pesanan lapangan olahraga, unduh invoice, dan beri penilaian permainan.
                        </p>
                    </div>

                    <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-xs h-10">
                        <Link href="/lapangan">+ Booking Lapangan Baru</Link>
                    </Button>
                </div>

                {/* Status Filter Tabs */}
                <div className="-mx-4 flex overflow-x-auto gap-2 border-b border-border/40 px-4 py-4 no-scrollbar sm:mx-0 sm:px-0">
                    {tabs.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => filterStatus(tab.key)}
                            className={`shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                                currentStatus === tab.key
                                    ? 'bg-primary text-primary-foreground shadow-sm'
                                    : 'bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Bookings List */}
                <div className="space-y-4 pt-6">
                    {bookings.data.length === 0 ? (
                        <div className="p-16 text-center rounded-2xl border border-dashed border-border bg-card">
                            <Calendar className="size-10 text-muted-foreground/40 mx-auto mb-3" />
                            <h3 className="font-bold text-base text-foreground">Belum Ada Riwayat Booking</h3>
                            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                                Anda belum memiliki riwayat booking untuk status ini. Ayo sewa lapangan favoritmu sekarang!
                            </p>
                            <Button asChild size="sm" className="mt-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl">
                                <Link href="/lapangan">Cari Lapangan</Link>
                            </Button>
                        </div>
                    ) : (
                        bookings.data.map((item) => (
                            <div
                                key={item.id}
                                className="group relative flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-xs transition-all duration-200 hover:border-border hover:shadow-md"
                            >
                                {/* Card Top Bar: Code + Category & Status */}
                                <div className="flex items-center justify-between gap-2 border-b border-border/50 bg-muted/20 px-3.5 py-2.5 sm:px-5 sm:py-3">
                                    <div className="flex min-w-0 items-center gap-2">
                                        <span className="inline-flex items-center rounded-lg border border-border/60 bg-background px-2 py-0.5 font-mono text-[11px] font-bold text-foreground shadow-2xs">
                                            #{item.booking_code}
                                        </span>
                                        {item.lapangan?.category && (
                                            <span className="hidden sm:inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
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
                                        <div className="relative size-16 sm:size-20 shrink-0 overflow-hidden rounded-xl border border-border/60 bg-muted">
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
                                            {item.lapangan?.category && (
                                                <span className="inline-flex sm:hidden items-center rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                                                    {item.lapangan.category.name}
                                                </span>
                                            )}
                                            <h3 className="line-clamp-1 text-sm sm:text-base font-bold text-foreground">
                                                {item.lapangan?.name}
                                            </h3>
                                            <p className="line-clamp-1 text-xs text-muted-foreground">
                                                Durasi sesi: <strong>{item.duration_hours} Jam</strong> bermain
                                            </p>
                                        </div>
                                    </div>

                                    {/* Info Grid Strip: Clean glanceable chips */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 rounded-xl bg-muted/40 p-2.5 sm:p-3 text-xs">
                                        <div className="flex items-center gap-2 text-foreground/90">
                                            <span className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-background text-primary">
                                                <Calendar className="size-3.5" />
                                            </span>
                                            <div className="min-w-0 leading-tight">
                                                <span className="block text-[10px] font-medium text-muted-foreground">Tanggal Main</span>
                                                <span className="block truncate font-semibold">
                                                    {formatDateIndonesia(item.booking_date)}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 text-foreground/90">
                                            <span className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-background text-primary">
                                                <Clock className="size-3.5" />
                                            </span>
                                            <div className="min-w-0 leading-tight">
                                                <span className="block text-[10px] font-medium text-muted-foreground">Waktu Sesi</span>
                                                <span className="block truncate font-semibold">
                                                    {item.start_time} - {item.end_time} WIB
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 text-foreground/90">
                                            <span className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-background text-primary">
                                                <CreditCard className="size-3.5" />
                                            </span>
                                            <div className="min-w-0 leading-tight">
                                                <span className="block text-[10px] font-medium text-muted-foreground">Metode Bayar</span>
                                                <span className="block truncate font-semibold uppercase">
                                                    {item.payment_method}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Rejection Alert Box */}
                                    {item.payment_status === 'rejected' && item.rejection_reason && (
                                        <div className="flex items-start gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-2.5 text-xs text-rose-700 dark:text-rose-400">
                                            <AlertCircle className="size-4 shrink-0 mt-0.5" />
                                            <div className="min-w-0 flex-1 leading-snug">
                                                <strong className="font-semibold">Alasan Penolakan:</strong> {item.rejection_reason}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Card Footer: Total Price & Actions */}
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-border/60 bg-muted/15 p-3.5 sm:px-5">
                                    <div className="flex items-center justify-between sm:block">
                                        <span className="text-[10px] sm:text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                                            Total Pembayaran
                                        </span>
                                        <p className="text-base sm:text-lg font-black text-primary tracking-tight">
                                            Rp {Number(item.total_price).toLocaleString('id-ID')}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2 w-full sm:w-auto">
                                        {item.payment_status === 'approved' && !item.review && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleOpenReview(item)}
                                                className="h-9 flex-1 sm:flex-initial rounded-xl text-xs font-semibold border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
                                            >
                                                <Star className="size-3.5 mr-1 fill-amber-400 text-amber-400" /> Beri Ulasan
                                            </Button>
                                        )}

                                        <Button
                                            asChild
                                            size="sm"
                                            className="h-9 flex-1 sm:flex-initial rounded-xl bg-primary text-xs font-semibold text-primary-foreground hover:bg-primary/90 shadow-xs"
                                        >
                                            <Link href={`/booking/${item.booking_code}`}>
                                                Lihat Invoice <ArrowRight className="size-3.5 ml-1" />
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Pagination */}
                {bookings.links && bookings.links.length > 3 && (
                    <Pagination
                        links={bookings.links}
                        from={bookings.from}
                        to={bookings.to}
                        total={bookings.total}
                        className="mt-8 pt-6 border-t border-border/50"
                    />
                )}
            </div>

            {/* Rating Modal */}
            <Dialog open={!!selectedBookingForReview} onOpenChange={(open) => !open && setSelectedBookingForReview(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <div className="flex items-start gap-3">
                            <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
                                <Star className="size-5" />
                            </div>
                            <div className="flex flex-col gap-1">
                                <DialogTitle>Beri Penilaian Lapangan</DialogTitle>
                                <DialogDescription className="text-xs">
                                    Bagaimana pengalaman bermain Anda di {selectedBookingForReview?.lapangan?.name}?
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <form onSubmit={handleReviewSubmit} className="space-y-4 pt-2">
                        <div className="flex justify-center items-center gap-2 py-3">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    className="p-1 hover:scale-110 transition-transform"
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
                            <Label htmlFor="comment">Komentar & Ulasan Anda</Label>
                            <Textarea
                                id="comment"
                                value={comment}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setComment(e.target.value)}
                                placeholder="Ceritakan kondisi rumput/lantai, fasilitas penerangan, kebersihan, dll..."
                                rows={3}
                                className="rounded-xl text-xs"
                            />
                        </div>

                        <div className="flex gap-2 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setSelectedBookingForReview(null)}
                                className="flex-1 rounded-xl"
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl"
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
