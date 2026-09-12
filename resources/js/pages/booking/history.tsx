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
import type { Booking } from '@/types/booking';

interface Props {
    bookings: {
        data: Booking[];
        links: { url: string | null; label: string; active: boolean }[];
        total: number;
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
                    <Badge className="bg-emerald-600 text-white text-xs font-semibold">
                        <CheckCircle2 className="size-3 mr-1" /> Terkonfirmasi
                    </Badge>
                );
            case 'pending_validation':
                return (
                    <Badge className="bg-amber-500 text-white text-xs font-semibold animate-pulse">
                        <Clock className="size-3 mr-1" /> Menunggu Validasi
                    </Badge>
                );
            case 'rejected':
                return (
                    <Badge className="bg-rose-600 text-white text-xs font-semibold">
                        <XCircle className="size-3 mr-1" /> Ditolak
                    </Badge>
                );
            case 'cancelled':
                return (
                    <Badge variant="destructive" className="text-xs font-semibold">
                        Dibatalkan
                    </Badge>
                );
            default:
                return (
                    <Badge className="bg-sky-600 text-white text-xs font-semibold">
                        <Clock className="size-3 mr-1" /> Menunggu Pembayaran
                    </Badge>
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
            <Head title="Riwayat Booking Saya - SportBooking" />

            <div className="container mx-auto px-4 sm:px-6 py-8 max-w-5xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-border/60 gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                            Riwayat Booking Saya
                        </h1>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                            Kelola semua pesanan lapangan olahraga, unduh invoice, dan beri penilaian permainan.
                        </p>
                    </div>

                    <Button asChild className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs h-10">
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
                                    ? 'bg-emerald-600 text-white shadow-sm'
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
                            <Button asChild size="sm" className="mt-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl">
                                <Link href="/lapangan">Cari Lapangan</Link>
                            </Button>
                        </div>
                    ) : (
                        bookings.data.map((item) => (
                            <div
                                key={item.id}
                                className="flex min-w-0 flex-col gap-4 rounded-2xl border border-border/70 bg-card p-4 shadow-sm transition-all hover:border-border sm:flex-row sm:justify-between sm:p-5"
                            >
                                <div className="min-w-0 space-y-2">
                                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                                        <span className="font-mono text-xs font-bold text-foreground">
                                            #{item.booking_code}
                                        </span>
                                        {getStatusBadge(item.payment_status)}
                                    </div>

                                    <h3 className="break-words text-base font-bold text-foreground">
                                        {item.lapangan?.name}
                                    </h3>

                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                        <div className="flex min-w-0 items-start gap-1.5">
                                            <Calendar className="size-3.5 text-emerald-500" />
                                            <span className="break-words">Tanggal: <strong>{item.booking_date}</strong></span>
                                        </div>
                                        <div className="flex min-w-0 items-start gap-1.5">
                                            <Clock className="size-3.5 text-emerald-500" />
                                            <span className="break-words">Jam: <strong>{item.start_time} - {item.end_time} WIB</strong> ({item.duration_hours} Jam)</span>
                                        </div>
                                        <div className="flex min-w-0 items-start gap-1.5">
                                            <CreditCard className="size-3.5 text-emerald-500" />
                                            <span className="break-words">Metode: <strong className="uppercase">{item.payment_method}</strong></span>
                                        </div>
                                    </div>

                                    {item.payment_status === 'rejected' && item.rejection_reason && (
                                        <p className="text-xs text-rose-600 bg-rose-500/10 p-2 rounded-lg">
                                            Alasan penolakan: {item.rejection_reason}
                                        </p>
                                    )}
                                </div>

                                <div className="flex flex-col items-stretch gap-3 border-t border-border/60 pt-3 sm:items-end sm:justify-center sm:border-t-0 sm:pt-0">
                                    <div className="text-right">
                                        <span className="text-xs text-muted-foreground">Total Tagihan</span>
                                        <p className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                                            Rp {Number(item.total_price).toLocaleString('id-ID')}
                                        </p>
                                    </div>

                                    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                                        {item.payment_status === 'approved' && !item.review && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleOpenReview(item)}
                                                className="h-9 w-full rounded-xl text-xs sm:w-auto"
                                            >
                                                <Star className="size-3.5 mr-1 text-amber-400" /> Beri Ulasan
                                            </Button>
                                        )}

                                        <Button asChild size="sm" className="h-9 w-full rounded-xl bg-emerald-600 text-xs text-white hover:bg-emerald-500 sm:w-auto">
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
                    <div className="flex justify-center items-center gap-1.5 mt-8">
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

            {/* Rating Modal */}
            <Dialog open={!!selectedBookingForReview} onOpenChange={(open) => !open && setSelectedBookingForReview(null)}>
                <DialogContent className="sm:max-w-md rounded-2xl border-border">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold">Beri Penilaian Lapangan</DialogTitle>
                        <DialogDescription className="text-xs">
                            Bagaimana pengalaman bermain Anda di {selectedBookingForReview?.lapangan?.name}?
                        </DialogDescription>
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
                                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl"
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
