import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import {
    ArrowRight,
    CalendarDays,
    ChevronDown,
    CircleCheck,
    CreditCard,
    Search,
    ShieldCheck,
    Star,
} from 'lucide-react';
import { CatalogIcon } from '@/components/catalog-icon';
import { LapanganCard } from '@/components/lapangan-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PublicLayout } from '@/layouts/public-layout';
import { index as lapanganIndex } from '@/routes/lapangan';
import type { Category, Lapangan, Review } from '@/types/booking';

interface Props {
    categories: Category[];
    featuredLapangans: Lapangan[];
    testimonials: Review[];
    stats: {
        total_lapangan: number;
        total_categories: number;
        total_reviews: number;
        average_rating: number;
    };
}

const faqs = [
    {
        question: 'Bagaimana cara booking lapangan di Sportify?',
        answer: 'Pilih lapangan, lihat jadwal yang tersedia, tentukan waktu bermain, lalu ikuti proses konfirmasi dan pembayaran yang tersedia.',
    },
    {
        question: 'Apakah bisa booking untuk hari yang sama?',
        answer: 'Bisa, selama slot masih tersedia dan booking dilakukan sebelum batas waktu yang ditentukan oleh Sportify.',
    },
    {
        question: 'Apa saja metode pembayarannya?',
        answer: 'Sportify menyediakan metode pembayaran yang tampil pada proses booking, termasuk transfer bank atau pembayaran cash di lokasi jika tersedia.',
    },
    {
        question: 'Kapan booking saya dianggap berhasil?',
        answer: 'Booking berhasil setelah pembayaran tervalidasi dan Anda menerima kode booking. Simpan kode tersebut saat datang ke Sportify.',
    },
];

const steps = [
    {
        icon: Search,
        number: '01',
        title: 'Pilih lapangan',
        text: 'Lihat jenis lapangan, fasilitas, harga, dan detail venue Sportify.',
    },
    {
        icon: CalendarDays,
        number: '02',
        title: 'Tentukan jadwal',
        text: 'Pilih tanggal dan slot waktu yang paling pas untuk tim Anda.',
    },
    {
        icon: CreditCard,
        number: '03',
        title: 'Konfirmasi booking',
        text: 'Selesaikan pembayaran, simpan kode booking, lalu datang untuk bermain.',
    },
];

const quickSearches = ['Futsal', 'Badminton', 'Basket', 'Mini Soccer'];

export default function Home({
    categories = [],
    featuredLapangans = [],
    testimonials = [],
    stats,
}: Props) {
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    const { name } = usePage<{ name?: string }>().props;
    const appName = name ?? 'Sportify';
    const [search, setSearch] = useState('');
    const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        router.visit(
            lapanganIndex.url({
                query: search.trim() ? { search: search.trim() } : {},
            }),
        );
    };

    return (
        <PublicLayout>
            <Head title="Booking Lapangan Sportify" />
            <div className="overflow-hidden">
                <section className="bg-brand-surface text-brand-deep dark:bg-brand-deep dark:text-brand-foreground relative isolate min-h-[100svh] overflow-hidden">
                    <div className="absolute inset-0 -z-10 [background-image:linear-gradient(to_right,oklch(0.58_0.17_150_/_0.10)_1px,transparent_1px),linear-gradient(to_bottom,oklch(0.58_0.17_150_/_0.10)_1px,transparent_1px)] [background-size:48px_48px] opacity-60 dark:opacity-40" />
                    <div className="border-primary/10 dark:border-primary/15 absolute -top-24 -right-24 -z-10 size-[20rem] rounded-full border-[2rem] sm:-top-40 sm:-right-40 sm:size-[34rem] sm:border-[3rem]" />
                    <div className="border-primary/15 dark:border-primary/20 absolute -bottom-40 left-1/2 -z-10 size-[24rem] -translate-x-1/2 rounded-full border sm:-bottom-64 sm:size-[42rem]" />
                    <div className="border-primary/15 dark:border-primary/20 absolute top-1/2 left-1/2 -z-10 size-40 -translate-x-1/2 -translate-y-1/2 rounded-full border sm:size-56" />
                    <div className="bg-primary/15 dark:bg-primary/20 absolute top-1/2 left-1/2 -z-10 h-px w-[180%] -translate-x-1/2 sm:w-[120%]" />
                    <div className="public-container mx-auto flex min-h-[100svh] max-w-[1240px] flex-col justify-start px-4 pt-20 pb-12 sm:px-6 sm:pt-24 sm:pb-16 lg:px-8 lg:pt-28">
                        <div className="mx-auto mt-4 max-w-3xl text-center sm:mt-6">
                            <div className="border-primary/20 bg-primary/10 text-primary mb-4 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold tracking-[0.12em] uppercase sm:mb-5 sm:gap-2 sm:px-3 sm:py-1.5 sm:text-xs sm:tracking-[0.16em]">
                                <span className="bg-primary size-1.5 rounded-full" />
                                Venue olahraga Sportify
                            </div>
                            <h1 className="text-4xl leading-[0.98] font-black tracking-[-0.055em] sm:text-7xl sm:leading-[0.95] sm:tracking-[-0.06em] lg:text-[5.8rem]">
                                Temukan waktu terbaik
                                <br />
                                <span className="text-primary">
                                    untuk mulai bermain.
                                </span>
                            </h1>
                            <p className="text-brand-deep/70 dark:text-brand-foreground/72 mx-auto mt-4 max-w-[19rem] text-sm leading-6 sm:mt-6 sm:max-w-xl sm:text-lg sm:leading-7">
                                Pilih lapangan, tentukan waktunya, dan ajak tim
                                Anda bermain di Sportify.
                            </p>
                        </div>

                        <div className="mx-auto mt-8 w-full max-w-3xl sm:mt-12">
                            <div className="text-primary mb-3 flex items-center justify-center gap-1.5 text-[10px] font-bold tracking-[0.12em] uppercase sm:mb-4 sm:gap-2 sm:text-xs sm:tracking-[0.18em]">
                                <span className="bg-primary/50 h-px w-6 sm:w-8" />
                                Cari dan booking di Sportify
                                <span className="bg-primary/50 h-px w-6 sm:w-8" />
                            </div>
                            <form
                                onSubmit={handleSearchSubmit}
                                className="group border-primary/30 bg-background/95 focus-within:border-primary/55 dark:border-primary/35 dark:bg-card/95 dark:focus-within:border-primary/60 rounded-2xl border p-2 shadow-[0_28px_70px_-28px_oklch(0.24_0.06_160_/_0.48)] backdrop-blur-xl transition-shadow focus-within:shadow-[0_28px_80px_-28px_oklch(0.55_0.15_160_/_0.42)] sm:rounded-[1.75rem] sm:p-3 dark:shadow-black/40"
                            >
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                                    <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl px-2 py-2 sm:gap-3 sm:rounded-2xl sm:px-3">
                                        <span className="bg-primary text-primary-foreground shadow-primary/20 flex size-10 shrink-0 items-center justify-center rounded-xl shadow-lg sm:size-12 sm:rounded-2xl">
                                            <Search className="size-4 sm:size-5" />
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <label
                                                htmlFor="hero-search"
                                                className="text-primary text-[10px] font-bold tracking-[0.12em] uppercase sm:text-[11px] sm:tracking-[0.14em]"
                                            >
                                                Cari jadwal bermain
                                            </label>
                                            <Input
                                                id="hero-search"
                                                value={search}
                                                onChange={(event) =>
                                                    setSearch(
                                                        event.target.value,
                                                    )
                                                }
                                                placeholder="Futsal, badminton, basket..."
                                                className="text-foreground placeholder:text-muted-foreground/75 mt-0.5 h-8 border-0 bg-transparent px-0 text-sm font-medium shadow-none focus-visible:ring-0 sm:h-9 sm:text-base"
                                            />
                                        </div>
                                    </div>
                                    <Button
                                        type="submit"
                                        className="shadow-primary/25 h-11 w-full rounded-xl px-5 font-bold shadow-lg transition-transform group-focus-within:scale-[1.01] sm:h-12 sm:w-auto sm:rounded-2xl sm:px-6"
                                    >
                                        Lihat jadwal{' '}
                                        <ArrowRight className="size-4" />
                                    </Button>
                                </div>
                                <div className="border-border/70 mt-1.5 flex flex-wrap items-center gap-1.5 border-t px-1.5 pt-2 sm:mt-2 sm:gap-2 sm:px-3 sm:pt-3">
                                    <span className="text-muted-foreground mr-0.5 text-[10px] font-semibold sm:mr-1 sm:text-[11px]">
                                        Coba cari:
                                    </span>
                                    {quickSearches.map((item) => (
                                        <button
                                            key={item}
                                            type="button"
                                            onClick={() => setSearch(item)}
                                            className="border-primary/15 bg-primary/5 text-primary hover:border-primary/35 hover:bg-primary/10 focus-visible:ring-primary/40 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors focus-visible:ring-2 focus-visible:outline-none sm:px-3 sm:py-1.5 sm:text-xs"
                                        >
                                            {item}
                                        </button>
                                    ))}
                                </div>
                            </form>
                            <div className="text-brand-deep/65 dark:text-brand-foreground/70 mt-3 flex flex-wrap justify-center gap-x-3 gap-y-1.5 text-[11px] font-semibold sm:mt-4 sm:gap-x-5 sm:gap-y-2 sm:text-xs">
                                {[
                                    'Jadwal real-time',
                                    'Harga transparan',
                                    'Konfirmasi aman',
                                ].map((item) => (
                                    <span
                                        key={item}
                                        className="inline-flex items-center gap-1"
                                    >
                                        <CircleCheck className="text-primary size-3 sm:size-3.5" />
                                        {item}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="border-brand-deep/10 dark:border-brand-foreground/15 mx-auto mt-10 w-full max-w-4xl border-t pt-6 sm:mt-16 sm:pt-8">
                            <div className="grid grid-cols-2 gap-y-6 sm:grid-cols-4 sm:gap-y-0">
                                {[
                                    [
                                        stats?.total_lapangan ?? 0,
                                        'Lapangan aktif',
                                    ],
                                    [
                                        stats?.total_categories ?? 0,
                                        'Jenis olahraga',
                                    ],
                                    [
                                        stats?.total_reviews ?? 0,
                                        'Review pemain',
                                    ],
                                    [
                                        stats?.average_rating
                                            ? stats.average_rating.toFixed(1)
                                            : '—',
                                        'Rating pemain',
                                    ],
                                ].map(([value, label]) => (
                                    <div
                                        key={label}
                                        className="[&:nth-child(odd)]:border-brand-deep/10 sm:border-brand-deep/10 dark:[&:nth-child(odd)]:border-brand-foreground/15 dark:sm:border-brand-foreground/15 flex flex-col items-center justify-center px-3 text-center sm:border-r sm:last:border-r-0 [&:nth-child(odd)]:border-r sm:[&:nth-child(odd)]:border-r-0"
                                    >
                                        <p className="text-3xl font-black tracking-tight sm:text-4xl">
                                            {value}
                                        </p>
                                        <p className="text-brand-deep/70 dark:text-brand-foreground/70 mt-1 text-xs font-medium">
                                            {label}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                <section className="public-container mx-auto max-w-[1240px] px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
                    <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
                        <div className="max-w-xl">
                            <p className="eyebrow">Lapangan Sportify</p>
                            <h2 className="section-title mt-3">
                                Pilih tempat bermain yang terasa pas.
                            </h2>
                            <p className="section-copy mt-4">
                                Lihat lapangan unggulan kami, lengkap dengan
                                fasilitas, harga, rating, dan jam
                                operasionalnya.
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            asChild
                            className="w-fit rounded-full px-5"
                        >
                            <Link href={lapanganIndex.url()}>
                                Lihat semua lapangan{' '}
                                <ArrowRight className="size-4" />
                            </Link>
                        </Button>
                    </div>
                    {featuredLapangans.length > 0 ? (
                        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            {featuredLapangans.slice(0, 6).map((item) => (
                                <LapanganCard key={item.id} item={item} />
                            ))}
                        </div>
                    ) : (
                        <div className="border-border text-muted-foreground mt-10 rounded-2xl border border-dashed p-10 text-center text-sm">
                            Belum ada lapangan aktif.
                        </div>
                    )}
                </section>

                <section className="border-border/70 bg-brand-surface/70 dark:bg-brand-surface/50 border-y">
                    <div className="public-container mx-auto max-w-[1240px] px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
                        <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:items-end">
                            <div className="max-w-md">
                                <p className="eyebrow">Pilih olahraga</p>
                                <h2 className="section-title mt-3">
                                    Satu venue. Banyak cara untuk bermain.
                                </h2>
                                <p className="section-copy mt-4">
                                    Mulai dari latihan rutin, pertandingan antar
                                    tim, sampai sesi santai setelah
                                    kerja—semuanya tersedia di Sportify.
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                                {categories.map((category) => (
                                    <Link
                                        key={category.id}
                                        href={lapanganIndex.url({
                                            query: { category: category.slug },
                                        })}
                                        className="group border-primary/15 bg-background/80 hover:border-primary/60 hover:shadow-primary/10 flex min-h-32 flex-col justify-between rounded-2xl border p-5 transition duration-300 hover:-translate-y-1 hover:shadow-lg"
                                    >
                                        <span className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-xl">
                                            <CatalogIcon
                                                name={
                                                    category.icon ??
                                                    category.slug
                                                }
                                                className="size-5"
                                            />
                                        </span>
                                        <span className="flex items-center justify-between gap-2 text-sm font-bold">
                                            {category.name}
                                            <ArrowRight className="size-4 -translate-x-1 opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100" />
                                        </span>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                <section className="public-container mx-auto max-w-[1240px] px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
                    <div className="grid gap-12 lg:grid-cols-[0.7fr_1.3fr]">
                        <div className="max-w-md">
                            <p className="eyebrow">Cara booking</p>
                            <h2 className="section-title mt-3">
                                Dari niat main sampai masuk lapangan.
                            </h2>
                            <p className="section-copy mt-4">
                                Semua informasi penting ada di depan Anda. Tidak
                                perlu menunggu balasan untuk tahu jadwal yang
                                masih kosong.
                            </p>
                            <div className="border-primary/15 bg-primary/5 text-primary mt-8 inline-flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold">
                                <ShieldCheck className="size-5" />
                                Booking tercatat dengan aman
                            </div>
                        </div>
                        <div className="divide-border border-border divide-y border-y">
                            {steps.map(
                                ({ icon: Icon, number, title, text }) => (
                                    <div
                                        key={number}
                                        className="grid gap-5 py-7 sm:grid-cols-[4rem_1fr] sm:items-start"
                                    >
                                        <div className="bg-primary text-primary-foreground shadow-primary/20 flex size-12 items-center justify-center rounded-2xl text-sm font-black shadow-lg">
                                            {number}
                                        </div>
                                        <div>
                                            <h3 className="flex items-center gap-2 text-lg font-bold">
                                                {title}
                                                <Icon className="text-primary size-4" />
                                            </h3>
                                            <p className="text-muted-foreground mt-2 max-w-xl text-sm leading-6">
                                                {text}
                                            </p>
                                        </div>
                                    </div>
                                ),
                            )}
                        </div>
                    </div>
                </section>

                <section className="bg-brand-deep text-brand-foreground">
                    <div className="public-container mx-auto max-w-[1240px] px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
                        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
                            <div>
                                <p className="eyebrow text-brand-soft">
                                    Cerita dari lapangan
                                </p>
                                <h2 className="mt-3 max-w-xl text-3xl font-black tracking-[-0.035em] sm:text-4xl">
                                    Main lebih seru ketika venue-nya siap.
                                </h2>
                            </div>
                            <div className="text-brand-foreground/70 flex items-center gap-2 text-sm">
                                <Star className="fill-brand-soft text-brand-soft size-4" />
                                Pengalaman pemain Sportify
                            </div>
                        </div>
                        {testimonials.length > 0 ? (
                            <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {testimonials.slice(0, 6).map((review) => (
                                    <article
                                        key={review.id}
                                        className="border-brand-foreground/15 bg-brand-foreground/[0.06] hover:bg-brand-foreground/[0.1] flex min-h-56 flex-col justify-between rounded-2xl border p-6 transition"
                                    >
                                        <div>
                                            <div className="flex gap-1">
                                                {Array.from({ length: 5 }).map(
                                                    (_, index) => (
                                                        <Star
                                                            key={index}
                                                            className={`size-4 ${index < review.rating ? 'fill-brand-soft text-brand-soft' : 'text-brand-foreground/30'}`}
                                                        />
                                                    ),
                                                )}
                                            </div>
                                            <p className="text-brand-foreground mt-5 text-base leading-7">
                                                “{review.comment}”
                                            </p>
                                        </div>
                                        <div className="mt-6 flex items-end justify-between gap-3 text-xs">
                                            <div>
                                                <p className="text-brand-foreground font-bold">
                                                    {review.user?.name ??
                                                        'Pemain Sportify'}
                                                </p>
                                                <p className="text-brand-foreground/60 mt-1">
                                                    {review.lapangan?.name ??
                                                        'Lapangan pilihan'}
                                                </p>
                                            </div>
                                            <span className="border-brand-foreground/15 text-brand-soft rounded-full border px-2.5 py-1">
                                                Pemain Sportify
                                            </span>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        ) : (
                            <div className="border-brand-foreground/15 text-brand-foreground/70 mt-10 rounded-2xl border p-8 text-sm">
                                Belum ada review pemain. Jadilah yang pertama
                                berbagi pengalaman setelah bermain.
                            </div>
                        )}
                    </div>
                </section>

                <section className="public-container mx-auto max-w-[1000px] px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
                    <div className="mb-10 max-w-xl">
                        <p className="eyebrow">Pertanyaan umum</p>
                        <h2 className="section-title mt-3">
                            Sebelum mulai booking.
                        </h2>
                        <p className="section-copy mt-4">
                            Jawaban singkat untuk membantu Anda bermain dengan
                            lebih tenang di Sportify.
                        </p>
                    </div>
                    <div className="divide-border border-border divide-y border-y">
                        {faqs.map((faq, index) => (
                            <details
                                key={faq.question}
                                open={openFaq === index}
                                className="group py-5"
                            >
                                <summary
                                    className="flex cursor-pointer list-none items-center justify-between gap-6 text-base font-bold marker:hidden [&::-webkit-details-marker]:hidden"
                                    aria-controls={`faq-answer-${index}`}
                                    aria-expanded={openFaq === index}
                                    onClick={(event) => {
                                        event.preventDefault();
                                        setOpenFaq((current) =>
                                            current === index ? null : index,
                                        );
                                    }}
                                >
                                    <span>{faq.question}</span>
                                    <ChevronDown className="text-primary size-5 shrink-0 transition-transform group-open:rotate-180" />
                                </summary>
                                <p
                                    id={`faq-answer-${index}`}
                                    className="text-muted-foreground max-w-2xl pt-3 text-sm leading-6"
                                >
                                    {faq.answer}
                                </p>
                            </details>
                        ))}
                    </div>
                </section>

                <section className="public-container mx-auto max-w-[1240px] px-4 pb-20 sm:px-6 sm:pb-28 lg:px-8">
                    <div className="bg-primary text-primary-foreground shadow-primary/20 relative overflow-hidden rounded-[2rem] p-8 shadow-2xl sm:p-12">
                        <div className="border-primary-foreground/10 absolute -top-24 -right-16 size-64 rounded-full border-[28px]" />
                        <div className="relative flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
                            <div className="max-w-2xl">
                                <p className="text-primary-foreground/75 text-xs font-black tracking-[0.18em] uppercase">
                                    Jadwal berikutnya menunggu
                                </p>
                                <h2 className="mt-3 text-3xl font-black tracking-[-0.035em] sm:text-4xl">
                                    Ajak tim Anda, pilih waktunya, mulai
                                    bermain.
                                </h2>
                                <p className="text-primary-foreground/75 mt-3 max-w-xl text-sm leading-6">
                                    Cek lapangan Sportify yang tersedia dan
                                    amankan sesi bermain berikutnya hari ini.
                                </p>
                            </div>
                            <Button
                                asChild
                                className="bg-brand-deep text-brand-foreground hover:bg-brand-deep/90 shrink-0 rounded-full px-6"
                            >
                                <Link href={lapanganIndex.url()}>
                                    Cek jadwal <ArrowRight className="size-4" />
                                </Link>
                            </Button>
                        </div>
                    </div>
                </section>
            </div>
        </PublicLayout>
    );
}
