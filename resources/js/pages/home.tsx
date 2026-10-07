import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { ArrowRight, CalendarDays, ChevronDown, CircleCheck, CreditCard, Search, ShieldCheck, Star } from 'lucide-react';
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
    stats: { total_lapangan: number; total_categories: number; total_reviews: number; average_rating: number };
}

const faqs = [
    { question: 'Bagaimana cara booking lapangan di Sportify?', answer: 'Pilih lapangan, lihat jadwal yang tersedia, tentukan waktu bermain, lalu ikuti proses konfirmasi dan pembayaran yang tersedia.' },
    { question: 'Apakah bisa booking untuk hari yang sama?', answer: 'Bisa, selama slot masih tersedia dan booking dilakukan sebelum batas waktu yang ditentukan oleh Sportify.' },
    { question: 'Apa saja metode pembayarannya?', answer: 'Sportify menyediakan metode pembayaran yang tampil pada proses booking, termasuk transfer bank atau pembayaran cash di lokasi jika tersedia.' },
    { question: 'Kapan booking saya dianggap berhasil?', answer: 'Booking berhasil setelah pembayaran tervalidasi dan Anda menerima kode booking. Simpan kode tersebut saat datang ke Sportify.' },
];

const steps = [
    { icon: Search, number: '01', title: 'Pilih lapangan', text: 'Lihat jenis lapangan, fasilitas, harga, dan detail venue Sportify.' },
    { icon: CalendarDays, number: '02', title: 'Tentukan jadwal', text: 'Pilih tanggal dan slot waktu yang paling pas untuk tim Anda.' },
    { icon: CreditCard, number: '03', title: 'Konfirmasi booking', text: 'Selesaikan pembayaran, simpan kode booking, lalu datang untuk bermain.' },
];

const quickSearches = ['Futsal', 'Badminton', 'Basket', 'Mini Soccer'];

export default function Home({ categories = [], featuredLapangans = [], testimonials = [], stats }: Props) {
    const { name } = usePage<{ name?: string }>().props;
    const appName = name ?? 'Sportify';
    const [search, setSearch] = useState('');
    const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        router.visit(lapanganIndex.url({ query: search.trim() ? { search: search.trim() } : {} }));
    };

    return (
        <PublicLayout>
            <Head title="Booking Lapangan Sportify" />
            <div className="overflow-hidden">
                <section className="relative isolate min-h-[100svh] overflow-hidden bg-brand-surface text-brand-deep dark:bg-brand-deep dark:text-brand-foreground">
                    <div className="absolute inset-0 -z-10 opacity-60 dark:opacity-40 [background-image:linear-gradient(to_right,oklch(0.58_0.17_150_/_0.10)_1px,transparent_1px),linear-gradient(to_bottom,oklch(0.58_0.17_150_/_0.10)_1px,transparent_1px)] [background-size:48px_48px]" />
                    <div className="absolute -right-24 -top-24 -z-10 size-[20rem] rounded-full border-[2rem] border-primary/10 sm:-right-40 sm:-top-40 sm:size-[34rem] sm:border-[3rem] dark:border-primary/15" />
                    <div className="absolute -bottom-40 left-1/2 -z-10 size-[24rem] -translate-x-1/2 rounded-full border border-primary/15 sm:-bottom-64 sm:size-[42rem] dark:border-primary/20" />
                    <div className="absolute left-1/2 top-1/2 -z-10 size-40 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/15 sm:size-56 dark:border-primary/20" />
                    <div className="absolute left-1/2 top-1/2 -z-10 h-px w-[180%] -translate-x-1/2 bg-primary/15 sm:w-[120%] dark:bg-primary/20" />
                    <div className="public-container mx-auto flex min-h-[100svh] max-w-[1280px] flex-col justify-start px-4 pb-12 pt-20 sm:px-6 sm:pb-16 sm:pt-24 lg:px-8 lg:pt-28">
                        <div className="mx-auto mt-4 max-w-3xl text-center sm:mt-6">
                            <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-primary sm:mb-5 sm:gap-2 sm:px-3 sm:py-1.5 sm:text-xs sm:tracking-[0.16em]"><span className="size-1.5 rounded-full bg-primary" />Venue olahraga Sportify</div>
                            <h1 className="text-4xl font-black leading-[0.98] tracking-[-0.055em] sm:text-7xl sm:leading-[0.95] sm:tracking-[-0.06em] lg:text-[5.8rem]">Temukan waktu terbaik<br /><span className="text-primary">untuk mulai bermain.</span></h1>
                            <p className="mx-auto mt-4 max-w-[19rem] text-sm leading-6 text-brand-deep/70 dark:text-brand-foreground/72 sm:mt-6 sm:max-w-xl sm:text-lg sm:leading-7">Pilih lapangan, tentukan waktunya, dan ajak tim Anda bermain di Sportify.</p>
                        </div>

                        <div className="mx-auto mt-8 w-full max-w-3xl sm:mt-12">
                            <div className="mb-3 flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-primary sm:mb-4 sm:gap-2 sm:text-xs sm:tracking-[0.18em]"><span className="h-px w-6 bg-primary/50 sm:w-8" />Cari dan booking di Sportify<span className="h-px w-6 bg-primary/50 sm:w-8" /></div>
                            <form onSubmit={handleSearchSubmit} className="group rounded-2xl border border-primary/30 bg-background/95 p-2 shadow-[0_28px_70px_-28px_oklch(0.24_0.06_160_/_0.48)] backdrop-blur-xl transition-shadow focus-within:border-primary/55 focus-within:shadow-[0_28px_80px_-28px_oklch(0.55_0.15_160_/_0.42)] sm:rounded-[1.75rem] sm:p-3 dark:border-primary/35 dark:bg-card/95 dark:shadow-black/40 dark:focus-within:border-primary/60">
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                                    <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl px-2 py-2 sm:gap-3 sm:rounded-2xl sm:px-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 sm:size-12 sm:rounded-2xl"><Search className="size-4 sm:size-5" /></span><div className="min-w-0 flex-1"><label htmlFor="hero-search" className="text-[10px] font-bold uppercase tracking-[0.12em] text-primary sm:text-[11px] sm:tracking-[0.14em]">Cari jadwal bermain</label><Input id="hero-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Futsal, badminton, basket..." className="mt-0.5 h-8 border-0 bg-transparent px-0 text-sm font-medium text-foreground shadow-none placeholder:text-muted-foreground/75 focus-visible:ring-0 sm:h-9 sm:text-base" /></div></div>
                                    <Button type="submit" className="h-11 w-full rounded-xl px-5 font-bold shadow-lg shadow-primary/25 transition-transform group-focus-within:scale-[1.01] sm:h-12 sm:w-auto sm:rounded-2xl sm:px-6">Lihat jadwal <ArrowRight className="size-4" /></Button>
                                </div>
                                <div className="mt-1.5 flex flex-wrap items-center gap-1.5 border-t border-border/70 px-1.5 pt-2 sm:mt-2 sm:gap-2 sm:px-3 sm:pt-3"><span className="mr-0.5 text-[10px] font-semibold text-muted-foreground sm:mr-1 sm:text-[11px]">Coba cari:</span>{quickSearches.map((item) => <button key={item} type="button" onClick={() => setSearch(item)} className="rounded-full border border-primary/15 bg-primary/5 px-2.5 py-1 text-[11px] font-semibold text-primary transition-colors hover:border-primary/35 hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 sm:px-3 sm:py-1.5 sm:text-xs">{item}</button>)}</div>
                            </form>
                            <div className="mt-3 flex flex-wrap justify-center gap-x-3 gap-y-1.5 text-[11px] font-semibold text-brand-deep/65 sm:mt-4 sm:gap-x-5 sm:gap-y-2 sm:text-xs dark:text-brand-foreground/70">{['Jadwal real-time', 'Harga transparan', 'Konfirmasi aman'].map((item) => <span key={item} className="inline-flex items-center gap-1"><CircleCheck className="size-3 sm:size-3.5 text-primary" />{item}</span>)}</div>
                        </div>

                        <div className="mt-10 grid grid-cols-2 gap-y-5 border-t border-brand-deep/10 pt-5 dark:border-brand-foreground/15 sm:mt-16 sm:grid-cols-4 sm:gap-y-0 sm:pt-7">{[[stats?.total_lapangan ?? 0, 'Lapangan aktif'], [stats?.total_categories ?? 0, 'Jenis olahraga'], [stats?.total_reviews ?? 0, 'Review pemain'], [stats?.average_rating ? stats.average_rating.toFixed(1) : '—', 'Rating pemain']].map(([value, label]) => <div key={label} className="border-brand-deep/10 px-2 first:pl-0 dark:border-brand-foreground/15 sm:border-r sm:last:border-0 sm:px-3 sm:first:pl-0"><p className="text-2xl font-black tracking-tight sm:text-4xl">{value}</p><p className="mt-1 text-[11px] text-brand-deep/60 sm:text-xs dark:text-brand-foreground/60">{label}</p></div>)}</div>
                    </div>
                </section>

                <section className="public-container mx-auto max-w-[1280px] px-4 py-20 sm:px-6 sm:py-28 lg:px-8"><div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end"><div className="max-w-xl"><p className="eyebrow">Lapangan Sportify</p><h2 className="section-title mt-3">Pilih tempat bermain yang terasa pas.</h2><p className="section-copy mt-4">Lihat lapangan unggulan kami, lengkap dengan fasilitas, harga, rating, dan jam operasionalnya.</p></div><Button variant="outline" asChild className="w-fit rounded-full px-5"><Link href={lapanganIndex.url()}>Lihat semua lapangan <ArrowRight className="size-4" /></Link></Button></div>{featuredLapangans.length > 0 ? <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{featuredLapangans.slice(0, 6).map((item) => <LapanganCard key={item.id} item={item} />)}</div> : <div className="mt-10 rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">Belum ada lapangan aktif.</div>}</section>

                <section className="border-y border-border/70 bg-brand-surface/70 dark:bg-brand-surface/50"><div className="public-container mx-auto max-w-[1280px] px-4 py-20 sm:px-6 sm:py-24 lg:px-8"><div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:items-end"><div className="max-w-md"><p className="eyebrow">Pilih olahraga</p><h2 className="section-title mt-3">Satu venue. Banyak cara untuk bermain.</h2><p className="section-copy mt-4">Mulai dari latihan rutin, pertandingan antar tim, sampai sesi santai setelah kerja—semuanya tersedia di Sportify.</p></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{categories.map((category) => <Link key={category.id} href={lapanganIndex.url({ query: { category: category.slug } })} className="group flex min-h-32 flex-col justify-between rounded-2xl border border-primary/15 bg-background/80 p-5 transition duration-300 hover:-translate-y-1 hover:border-primary/60 hover:shadow-lg hover:shadow-primary/10"><span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><CatalogIcon name={category.icon ?? category.slug} className="size-5" /></span><span className="flex items-center justify-between gap-2 text-sm font-bold">{category.name}<ArrowRight className="size-4 -translate-x-1 opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100" /></span></Link>)}</div></div></div></section>

                <section className="public-container mx-auto max-w-[1280px] px-4 py-20 sm:px-6 sm:py-28 lg:px-8"><div className="grid gap-12 lg:grid-cols-[0.7fr_1.3fr]"><div className="max-w-md"><p className="eyebrow">Cara booking</p><h2 className="section-title mt-3">Dari niat main sampai masuk lapangan.</h2><p className="section-copy mt-4">Semua informasi penting ada di depan Anda. Tidak perlu menunggu balasan untuk tahu jadwal yang masih kosong.</p><div className="mt-8 inline-flex items-center gap-3 rounded-2xl border border-primary/15 bg-primary/5 px-4 py-3 text-sm font-semibold text-primary"><ShieldCheck className="size-5" />Booking tercatat dengan aman</div></div><div className="divide-y divide-border border-y border-border">{steps.map(({ icon: Icon, number, title, text }) => <div key={number} className="grid gap-5 py-7 sm:grid-cols-[4rem_1fr] sm:items-start"><div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-sm font-black text-primary-foreground shadow-lg shadow-primary/20">{number}</div><div><h3 className="flex items-center gap-2 text-lg font-bold">{title}<Icon className="size-4 text-primary" /></h3><p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{text}</p></div></div>)}</div></div></section>

                <section className="bg-brand-deep text-brand-foreground"><div className="public-container mx-auto max-w-[1280px] px-4 py-20 sm:px-6 sm:py-24 lg:px-8"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="eyebrow text-brand-soft">Cerita dari lapangan</p><h2 className="mt-3 max-w-xl text-3xl font-black tracking-[-0.035em] sm:text-4xl">Main lebih seru ketika venue-nya siap.</h2></div><div className="flex items-center gap-2 text-sm text-brand-foreground/70"><Star className="size-4 fill-brand-soft text-brand-soft" />Pengalaman pemain Sportify</div></div>{testimonials.length > 0 ? <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{testimonials.slice(0, 6).map((review) => <article key={review.id} className="flex min-h-56 flex-col justify-between rounded-2xl border border-brand-foreground/15 bg-brand-foreground/[0.06] p-6 transition hover:bg-brand-foreground/[0.1]"><div><div className="flex gap-1">{Array.from({ length: 5 }).map((_, index) => <Star key={index} className={`size-4 ${index < review.rating ? 'fill-brand-soft text-brand-soft' : 'text-brand-foreground/30'}`} />)}</div><p className="mt-5 text-base leading-7 text-brand-foreground">“{review.comment}”</p></div><div className="mt-6 flex items-end justify-between gap-3 text-xs"><div><p className="font-bold text-brand-foreground">{review.user?.name ?? 'Pemain Sportify'}</p><p className="mt-1 text-brand-foreground/60">{review.lapangan?.name ?? 'Lapangan pilihan'}</p></div><span className="rounded-full border border-brand-foreground/15 px-2.5 py-1 text-brand-soft">Pemain Sportify</span></div></article>)}</div> : <div className="mt-10 rounded-2xl border border-brand-foreground/15 p-8 text-sm text-brand-foreground/70">Belum ada review pemain. Jadilah yang pertama berbagi pengalaman setelah bermain.</div>}</div></section>

                <section className="public-container mx-auto max-w-[1000px] px-4 py-20 sm:px-6 sm:py-28 lg:px-8"><div className="mb-10 max-w-xl"><p className="eyebrow">Pertanyaan umum</p><h2 className="section-title mt-3">Sebelum mulai booking.</h2><p className="section-copy mt-4">Jawaban singkat untuk membantu Anda bermain dengan lebih tenang di Sportify.</p></div><div className="divide-y divide-border border-y border-border">{faqs.map((faq) => <details key={faq.question} className="group py-5"><summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-base font-bold marker:hidden [&::-webkit-details-marker]:hidden"><span>{faq.question}</span><ChevronDown className="size-5 shrink-0 text-primary transition-transform group-open:rotate-180" /></summary><p className="max-w-2xl pt-3 text-sm leading-6 text-muted-foreground">{faq.answer}</p></details>)}</div></section>

                <section className="public-container mx-auto max-w-[1280px] px-4 pb-20 sm:px-6 sm:pb-28 lg:px-8"><div className="relative overflow-hidden rounded-[2rem] bg-primary p-8 text-primary-foreground shadow-2xl shadow-primary/20 sm:p-12"><div className="absolute -right-16 -top-24 size-64 rounded-full border-[28px] border-primary-foreground/10" /><div className="relative flex flex-col items-start justify-between gap-8 md:flex-row md:items-center"><div className="max-w-2xl"><p className="text-xs font-black uppercase tracking-[0.18em] text-primary-foreground/75">Jadwal berikutnya menunggu</p><h2 className="mt-3 text-3xl font-black tracking-[-0.035em] sm:text-4xl">Ajak tim Anda, pilih waktunya, mulai bermain.</h2><p className="mt-3 max-w-xl text-sm leading-6 text-primary-foreground/75">Cek lapangan Sportify yang tersedia dan amankan sesi bermain berikutnya hari ini.</p></div><Button asChild className="shrink-0 rounded-full bg-brand-deep px-6 text-brand-foreground hover:bg-brand-deep/90"><Link href={lapanganIndex.url()}>Cek jadwal <ArrowRight className="size-4" /></Link></Button></div></div></section>
            </div>
        </PublicLayout>
    );
}
