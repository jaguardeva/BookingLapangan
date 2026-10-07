import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import {
    ArrowRight,
    CalendarDays,
    Check,
    ChevronDown,
    CreditCard,
    Dribbble,
    Flame,
    Search,
    Star,
    Target,
    Trophy,
    Zap,
} from 'lucide-react';
import { LapanganCard } from '@/components/lapangan-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PublicLayout } from '@/layouts/public-layout';
import { index as lapanganIndex, show as lapanganShow } from '@/routes/lapangan';
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
        question: 'Bagaimana cara mencari lapangan yang tersedia?',
        answer: 'Gunakan pencarian di halaman ini atau buka katalog lapangan. Anda dapat melihat nama, kategori, fasilitas, rating, harga, dan slot yang masih tersedia.',
    },
    {
        question: 'Apakah saya bisa booking untuk hari yang sama?',
        answer: 'Bisa, selama slot tersebut masih tersedia dan booking dilakukan sebelum batas waktu yang ditentukan oleh lapangan.',
    },
    {
        question: 'Apa saja metode pembayarannya?',
        answer: 'Anda dapat memilih transfer bank dengan kode validasi unik atau pembayaran cash langsung di lokasi, sesuai pilihan yang tersedia pada lapangan.',
    },
    {
        question: 'Kapan booking saya dianggap berhasil?',
        answer: 'Booking transfer akan diproses setelah pembayaran tervalidasi. Untuk booking cash, ikuti instruksi pembayaran di lokasi dan simpan kode booking Anda.',
    },
    {
        question: 'Bagaimana jika saya perlu membatalkan booking?',
        answer: 'Buka menu booking saya, pilih booking terkait, lalu gunakan opsi pembatalan jika masih memenuhi ketentuan pembatalan lapangan.',
    },
];

function categoryIcon(slug: string) {
    const icons = {
        futsal: Flame,
        badminton: Target,
        basket: Dribbble,
        'mini-soccer': Trophy,
    } as Record<string, typeof Flame>;
    const Icon = icons[slug] ?? Zap;

    return <Icon className="size-5" strokeWidth={1.8} />;
}

export default function Home({
    categories = [],
    featuredLapangans = [],
    testimonials = [],
    stats,
}: Props) {
    const { name } = usePage<{ name?: string }>().props;
    const appName = name ?? 'Sportify';
    const [search, setSearch] = useState('');
    const heroImage = featuredLapangans[0]?.images?.[0];

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
            <Head title="Booking Lapangan Olahraga Online" />

            <div className="overflow-hidden">
                <section
                    className="relative bg-brand-deep bg-cover bg-center text-brand-foreground"
                    style={heroImage ? { backgroundImage: `url("${heroImage}")` } : undefined}
                >
                    <div className="absolute inset-0 bg-brand-deep/90" />
                    <div className="relative public-container max-w-[1240px] py-8 sm:py-12 lg:py-16">
                        <div className="grid items-end gap-10 lg:grid-cols-[1.02fr_0.98fr] lg:gap-16">
                            <div className="space-y-7">
                                <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-brand-soft"><span className="h-px w-8 bg-brand-soft" />Main lebih sering, urusan lebih sedikit</div>
                                <h1 className="max-w-2xl text-4xl font-black leading-[0.98] tracking-[-0.045em] sm:text-6xl lg:text-[5.25rem]">Cari tempat main. Booking. Berangkat.</h1>
                                <p className="max-w-xl text-base leading-7 text-brand-foreground/75 sm:text-lg">{appName} membantu Anda menemukan lapangan yang pas, melihat slot yang tersedia, dan mengamankan jadwal bermain tanpa chat bolak-balik.</p>
                                <form onSubmit={handleSearchSubmit} className="max-w-2xl">
                                    <div className="flex flex-col gap-2 rounded-2xl bg-brand-surface p-2 text-brand-deep shadow-2xl shadow-black/20 sm:flex-row sm:items-center">
                                        <Search className="ml-3 hidden size-5 shrink-0 text-primary sm:block" />
                                        <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari futsal, badminton, basket..." className="h-11 border-0 bg-transparent text-sm shadow-none focus-visible:ring-0" />
                                        <Button type="submit" className="h-11 rounded-xl bg-primary px-6 font-bold text-primary-foreground hover:bg-primary/90">Cari lapangan</Button>
                                    </div>
                                </form>
                                <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-brand-foreground/75"><span className="inline-flex items-center gap-2"><Check className="size-4 text-brand-soft" />Slot terlihat jelas</span><span className="inline-flex items-center gap-2"><Check className="size-4 text-brand-soft" />Harga transparan</span><span className="inline-flex items-center gap-2"><Check className="size-4 text-brand-soft" />Konfirmasi otomatis</span></div>
                            </div>

                            <div className="relative min-h-[360px] overflow-hidden rounded-[2rem] bg-brand-surface sm:min-h-[480px]">
                                {heroImage ? <img src={heroImage} alt={featuredLapangans[0]?.name ?? 'Lapangan olahraga'} className="absolute inset-0 size-full object-cover opacity-85" /> : <div className="absolute inset-0 bg-[linear-gradient(135deg,#355747,#9bb48b)]" />}
                                <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_35%,rgba(10,22,17,0.85))]" />
                                <div className="absolute left-5 top-5 flex items-center gap-2 rounded-full bg-brand-surface/95 px-3 py-2 text-xs font-bold text-brand-deep"><span className="size-2 rounded-full bg-primary" />Lapangan aktif hari ini</div>
                                <div className="absolute inset-x-5 bottom-5 space-y-2 text-brand-foreground"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-foreground/75">Pilihan minggu ini</p><h2 className="max-w-md text-2xl font-bold tracking-tight sm:text-3xl">{featuredLapangans[0]?.name ?? 'Temukan lapangan favoritmu'}</h2><Link href={featuredLapangans[0] ? lapanganShow.url({ slug: featuredLapangans[0].slug }) : lapanganIndex.url()} className="inline-flex items-center gap-2 text-sm font-bold text-brand-soft hover:text-brand-foreground">Lihat detail <ArrowRight className="size-4" /></Link></div>
                            </div>
                        </div>

                        <div className="mt-12 grid grid-cols-2 border-t border-white/15 pt-6 sm:grid-cols-4">
                            <div className="border-brand-foreground/15 px-3 py-2 first:pl-0 sm:border-r"><p className="text-2xl font-black sm:text-3xl">{stats?.total_lapangan ?? 0}</p><p className="mt-1 text-xs text-brand-foreground/75">Lapangan aktif</p></div>
                            <div className="border-brand-foreground/15 px-3 py-2 sm:border-r"><p className="text-2xl font-black sm:text-3xl">{stats?.total_categories ?? 0}</p><p className="mt-1 text-xs text-brand-foreground/75">Jenis olahraga</p></div>
                            <div className="border-brand-foreground/15 px-3 py-2 sm:border-r"><p className="text-2xl font-black sm:text-3xl">{stats?.total_reviews ?? 0}</p><p className="mt-1 text-xs text-brand-foreground/75">Review pemain</p></div>
                            <div className="px-3 py-2"><p className="flex items-center gap-2 text-2xl font-black sm:text-3xl"><Star className="size-5 fill-brand-soft text-brand-soft" />{stats?.average_rating ? stats.average_rating.toFixed(1) : '—'}</p><p className="mt-1 text-xs text-brand-foreground/75">Rata-rata rating</p></div>
                        </div>
                    </div>
                </section>

                <section className="public-container max-w-[1240px] py-16 sm:py-24">
                    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div className="max-w-xl space-y-3"><p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Pilihan lapangan</p><h2 className="text-3xl font-black tracking-[-0.035em] sm:text-4xl">Tempat yang layak jadi langganan.</h2><p className="text-sm leading-6 text-muted-foreground">Lihat fasilitas, harga, rating, dan slot sebelum Anda memutuskan.</p></div><Button variant="outline" asChild className="w-fit rounded-full px-5"><Link href={lapanganIndex.url()}>Buka semua lapangan <ArrowRight className="ml-2 size-4" /></Link></Button></div>
                    {featuredLapangans.length > 0 ? <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{featuredLapangans.slice(0, 6).map((item) => <LapanganCard key={item.id} item={item} />)}</div> : <div className="mt-10 rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">Belum ada lapangan aktif.</div>}
                </section>

                <section className="border-y border-border/70 bg-brand-surface dark:bg-brand-surface/60"><div className="public-container max-w-[1240px] py-16 sm:py-20"><div className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:items-end"><div className="space-y-4"><p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Pilih gaya mainmu</p><h2 className="text-3xl font-black tracking-[-0.035em] sm:text-4xl">Satu tempat untuk semua pertandingan.</h2><p className="max-w-md text-sm leading-6 text-muted-foreground">Mulai dari latihan sore sampai pertandingan akhir pekan, temukan venue yang cocok untuk tim Anda.</p></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{categories.map((category) => <Link key={category.id} href={lapanganIndex.url({ query: { category: category.slug } })} className="group flex min-h-28 flex-col justify-between rounded-2xl border border-primary/15 bg-background/70 p-4 transition hover:-translate-y-1 hover:border-primary/60"><span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">{categoryIcon(category.slug)}</span><span className="flex items-center justify-between gap-2 text-sm font-bold">{category.name}<ArrowRight className="size-4 -translate-x-1 opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100" /></span></Link>)}</div></div></div></section>

                <section className="public-container max-w-[1240px] py-16 sm:py-24"><div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr]"><div className="space-y-4"><p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Cara kerjanya</p><h2 className="text-3xl font-black tracking-[-0.035em] sm:text-4xl">Dari niat main sampai masuk lapangan.</h2><p className="text-sm leading-6 text-muted-foreground">Tidak perlu menunggu balasan admin untuk tahu slot kosong. Semua informasi penting ada di depan Anda.</p></div><div className="divide-y divide-border border-y border-border">{[{ icon: Search, title: 'Cari venue yang pas', text: 'Bandingkan lokasi, fasilitas, harga, dan rating dalam satu katalog.' }, { icon: CalendarDays, title: 'Pilih slot waktu', text: 'Lihat jadwal yang tersedia lalu pilih waktu yang sesuai dengan tim.' }, { icon: CreditCard, title: 'Konfirmasi dan main', text: 'Selesaikan pembayaran sesuai metode pilihan, lalu datang dengan tenang.' }].map(({ icon: Icon, title, text }, index) => <div key={title} className="grid gap-4 py-6 sm:grid-cols-[3rem_1fr] sm:items-start"><div className="flex size-10 items-center justify-center rounded-full bg-brand-deep text-brand-soft dark:bg-primary dark:text-primary-foreground">{index + 1}</div><div><h3 className="flex items-center gap-2 font-bold">{title} <Icon className="size-4 text-primary" /></h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p></div></div>)}</div></div></section>

                <section className="bg-brand-deep text-brand-foreground"><div className="public-container max-w-[1240px] py-16 sm:py-24"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div className="space-y-3"><p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-soft">Cerita dari lapangan</p><h2 className="text-3xl font-black tracking-[-0.035em] sm:text-4xl">Yang penting bukan cuma lapangannya.</h2></div><div className="flex items-center gap-2 text-sm text-brand-foreground/75"><Star className="size-4 fill-brand-soft text-brand-soft" />Berdasarkan pengalaman pemain</div></div>{testimonials.length > 0 ? <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{testimonials.slice(0, 6).map((review) => <article key={review.id} className="flex min-h-52 flex-col justify-between rounded-2xl border border-brand-foreground/15 bg-brand-foreground/[0.06] p-5"><div><div className="flex gap-1">{Array.from({ length: 5 }).map((_, index) => <Star key={index} className={`size-4 ${index < review.rating ? 'fill-brand-soft text-brand-soft' : 'text-brand-foreground/30'}`} />)}</div><p className="mt-5 text-base leading-7 text-brand-foreground">“{review.comment}”</p></div><div className="mt-6 flex items-end justify-between gap-3 text-xs"><div><p className="font-bold text-brand-foreground">{review.user?.name ?? 'Pemain Sportify'}</p><p className="mt-1 text-brand-foreground/65">{review.lapangan?.name ?? 'Lapangan pilihan'}</p></div><span className="rounded-full border border-brand-foreground/15 px-2.5 py-1 text-brand-soft">Terverifikasi</span></div></article>)}</div> : <div className="mt-10 rounded-2xl border border-brand-foreground/15 p-8 text-sm text-brand-foreground/75">Belum ada review pemain. Jadilah yang pertama berbagi pengalaman setelah bermain.</div>}</div></section>

                <section className="public-container max-w-[900px] py-16 sm:py-24"><div className="mb-10 max-w-xl space-y-3"><p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Pertanyaan umum</p><h2 className="text-3xl font-black tracking-[-0.035em] sm:text-4xl">Sebelum mulai booking.</h2><p className="text-sm leading-6 text-muted-foreground">Hal-hal yang biasanya ingin Anda tahu sebelum mengamankan slot.</p></div><div className="divide-y divide-border border-y border-border">{faqs.map((faq) => <details key={faq.question} className="group py-5"><summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-base font-bold marker:hidden [&::-webkit-details-marker]:hidden"><span>{faq.question}</span><ChevronDown className="size-5 shrink-0 text-primary transition-transform group-open:rotate-180" /></summary><p className="max-w-2xl pt-3 text-sm leading-6 text-muted-foreground">{faq.answer}</p></details>)}</div></section>

                <section className="public-container max-w-[1240px] pb-16 sm:pb-24"><div className="flex flex-col items-start justify-between gap-6 rounded-[2rem] bg-brand-soft p-7 text-brand-deep sm:p-10 md:flex-row md:items-center"><div className="max-w-2xl space-y-2"><p className="text-xs font-black uppercase tracking-[0.18em]">Waktunya memilih jadwal</p><h2 className="text-3xl font-black tracking-[-0.035em] sm:text-4xl">Jangan sampai tim Anda kebagian jam sisa.</h2><p className="max-w-xl text-sm leading-6 text-brand-deep/75">Cari lapangan, cek slot yang kosong, dan amankan pertandingan berikutnya hari ini.</p></div><Button asChild className="rounded-full bg-brand-deep px-6 text-brand-foreground hover:bg-brand-deep/90"><Link href={lapanganIndex.url()}>Cari lapangan <ArrowRight className="ml-2 size-4" /></Link></Button></div></section>
            </div>
        </PublicLayout>
    );
}
