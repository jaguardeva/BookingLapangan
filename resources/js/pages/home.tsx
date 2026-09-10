import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { PublicLayout } from '@/layouts/public-layout';
import {
    Trophy,
    Search,
    Flame,
    Target,
    Dribbble,
    Zap,
    Star,
    Clock,
    ShieldCheck,
    CheckCircle2,
    ArrowRight,
    MapPin,
    Calendar,
    CreditCard,
    Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { LapanganCard } from '@/components/lapangan-card';
import type { Category, Facility, Lapangan, Review } from '@/types/booking';

interface Props {
    categories: Category[];
    featuredLapangans: Lapangan[];
    facilities: Facility[];
    testimonials: Review[];
    stats: {
        total_lapangan: number;
        total_categories: number;
        satisfaction_rate: number;
    };
}

export default function Home({
    categories = [],
    featuredLapangans = [],
    facilities = [],
    testimonials = [],
    stats,
}: Props) {
    const [search, setSearch] = useState('');

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.visit(`/lapangan?search=${encodeURIComponent(search)}`);
    };

    const getCategoryIcon = (slug: string) => {
        switch (slug) {
            case 'futsal':
                return <Flame className="size-5 text-orange-500" />;
            case 'badminton':
                return <Target className="size-5 text-emerald-500" />;
            case 'basket':
                return <Dribbble className="size-5 text-amber-500" />;
            case 'mini-soccer':
                return <Trophy className="size-5 text-sky-500" />;
            default:
                return <Zap className="size-5 text-purple-500" />;
        }
    };

    return (
        <PublicLayout>
            <Head title="Sewa Lapangan Olahraga Online - SportBooking" />

            {/* Hero Section */}
            <section className="relative overflow-hidden bg-gradient-to-b from-emerald-500/10 via-background to-background py-16 sm:py-24 border-b border-border/40">
                <div className="absolute inset-0 -z-10 opacity-30 dark:opacity-20 [background-image:radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-400 via-transparent to-transparent pointer-events-none" />

                <div className="container mx-auto px-4 sm:px-6">
                    <div className="max-w-3xl mx-auto text-center space-y-6">
                        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                            <Sparkles className="size-3.5" />
                            Booking Lapangan Lebih Cepat & Otomatis
                        </div>

                        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-foreground leading-[1.15]">
                            Booking Lapangan Olahraga Favoritmu{' '}
                            <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
                                Tanpa Ribet.
                            </span>
                        </h1>

                        <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                            Cek ketersediaan slot real-time untuk hari ini, besok, atau lusa. Pembayaran transparan dengan kode unik transfer instan atau cash di lokasi.
                        </p>

                        {/* Search Bar */}
                        <form onSubmit={handleSearchSubmit} className="max-w-xl mx-auto pt-2">
                            <div className="relative flex items-center shadow-lg rounded-2xl bg-card border border-border/80 p-1.5 focus-within:ring-2 focus-within:ring-emerald-500/40 transition-all">
                                <Search className="size-5 text-muted-foreground ml-3 shrink-0" />
                                <Input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Cari nama lapangan atau fasilitas (misal: Futsal Vinyl, AC, Rumput Sintetis)..."
                                    className="border-0 shadow-none focus-visible:ring-0 text-sm bg-transparent"
                                />
                                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl px-5 shrink-0">
                                    Cari
                                </Button>
                            </div>
                        </form>

                        {/* Category Quick Chips */}
                        <div className="flex flex-wrap justify-center items-center gap-2 pt-2">
                            <span className="text-xs text-muted-foreground mr-1">Kategori Populer:</span>
                            {categories.map((cat) => (
                                <Link
                                    key={cat.id}
                                    href={`/lapangan?category=${cat.slug}`}
                                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-medium text-foreground hover:border-emerald-500/50 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 transition-all"
                                >
                                    {cat.name}
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Stats Metric Strip */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-2xl mx-auto mt-14 pt-8 border-t border-border/60">
                        <div className="text-center">
                            <p className="text-2xl sm:text-3xl font-extrabold text-foreground">{stats?.total_lapangan ?? 5}+</p>
                            <p className="text-xs text-muted-foreground">Lapangan Tersedia</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl sm:text-3xl font-extrabold text-foreground">{stats?.total_categories ?? 5}</p>
                            <p className="text-xs text-muted-foreground">Cabang Olahraga</p>
                        </div>
                        <div className="text-center col-span-2 sm:col-span-1">
                            <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                                {stats?.satisfaction_rate ?? 99}%
                            </p>
                            <p className="text-xs text-muted-foreground">Rating Kepuasan Pemain</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Featured Lapangan Section */}
            <section className="py-16 sm:py-20 container mx-auto px-4 sm:px-6">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
                    <div>
                        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">
                            <Trophy className="size-4" /> Lapangan Pilihan
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                            Pilihan Lapangan Olahraga Terbaik
                        </h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            Fasilitas lengkap, karpet berkualitas standar turnamen, dan lokasi strategis.
                        </p>
                    </div>

                    <Button variant="outline" asChild className="rounded-xl border-border shrink-0">
                        <Link href="/lapangan">
                            Lihat Semua Lapangan <ArrowRight className="size-4 ml-1.5" />
                        </Link>
                    </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                    {featuredLapangans.map((item) => (
                        <LapanganCard key={item.id} item={item} />
                    ))}
                </div>
            </section>

            {/* How It Works Section */}
            <section className="py-16 sm:py-20 bg-muted/40 border-y border-border/60">
                <div className="container mx-auto px-4 sm:px-6">
                    <div className="text-center max-w-xl mx-auto mb-12">
                        <Badge variant="outline" className="mb-2 text-emerald-600 border-emerald-500/30">
                            Mudah & Praktis
                        </Badge>
                        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Cara Booking di SportBooking</h2>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                            Hanya 3 langkah sederhana untuk memastikan slot bermain Anda aman.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-card border border-border/60 shadow-sm relative">
                            <div className="size-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-extrabold text-lg mb-4">
                                1
                            </div>
                            <h3 className="font-bold text-base mb-2">Pilih Lapangan & Jam</h3>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Pilih lapangan dan slot jam yang Anda inginkan (hari ini, besok, atau lusa) dengan kalender interaktif.
                            </p>
                        </div>

                        <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-card border border-border/60 shadow-sm relative">
                            <div className="size-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-extrabold text-lg mb-4">
                                2
                            </div>
                            <h3 className="font-bold text-base mb-2">Bayar Transfer / Cash</h3>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Transfer dengan 3-digit kode validasi unik otomatis agar terverifikasi instan, atau bayar tunai di kasir.
                            </p>
                        </div>

                        <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-card border border-border/60 shadow-sm relative">
                            <div className="size-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-extrabold text-lg mb-4">
                                3
                            </div>
                            <h3 className="font-bold text-base mb-2">Terima Notifikasi & Main</h3>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Dapatkan konfirmasi otomatis via email & notifikasi aplikasi. Datang tepat waktu dan nikmati pertandingan!
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </PublicLayout>
    );
}
