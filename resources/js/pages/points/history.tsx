import { Head, Link, router } from '@inertiajs/react';
import {
    Coins,
    TrendingUp,
    TrendingDown,
    ArrowDownLeft,
    ArrowUpRight,
    ExternalLink,
    ChevronLeft,
    Sparkles,
    ShieldCheck,
} from 'lucide-react';
import { PublicLayout } from '@/layouts/public-layout';
import { Button } from '@/components/ui/button';
import { Pagination, type PaginationLink } from '@/components/pagination';

export type PointTransaction = {
    id: string;
    type: 'earned' | 'redeemed';
    points: number;
    balance_after: number;
    title?: string;
    description?: string;
    reference_url?: string | null;
    created_at: string;
};

interface PaginatedTransactions {
    data: PointTransaction[];
    links: PaginationLink[];
    total: number;
    from: number | null;
    to: number | null;
    current_page: number;
    last_page: number;
    per_page: number;
}

interface PointHistoryProps {
    transactions: PaginatedTransactions;
    currentFilter: 'all' | 'earned' | 'redeemed';
    stats: {
        points_balance: number;
        available_points: number;
        total_earned: number;
        total_redeemed: number;
    };
}

function formatFullDateTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }) + ' WIB';
}

export default function PointHistory({
    transactions,
    currentFilter,
    stats,
}: PointHistoryProps) {
    const reservedPoints = Math.max(
        0,
        stats.points_balance - stats.available_points,
    );

    const handleFilterChange = (filter: 'all' | 'earned' | 'redeemed') => {
        const url = new URL(window.location.href);
        if (filter === 'all') {
            url.searchParams.delete('type');
        } else {
            url.searchParams.set('type', filter);
        }
        url.searchParams.delete('page');

        router.get(
            `${url.pathname}${url.search}`,
            {},
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    return (
        <PublicLayout>
            <Head title="Riwayat Poin" />

            <div className="public-container max-w-5xl py-8 sm:py-10">
                {/* Top Navigation & Breadcrumbs */}
                <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Link
                            href="/"
                            className="transition-colors hover:text-foreground"
                        >
                            Beranda
                        </Link>
                        <span>/</span>
                        <Link
                            href="/settings/profile"
                            className="transition-colors hover:text-foreground"
                        >
                            Profil Saya
                        </Link>
                        <span>/</span>
                        <span className="font-semibold text-foreground">
                            Riwayat Poin
                        </span>
                    </div>

                    <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                    >
                        <Link href="/settings/profile">
                            <ChevronLeft className="size-4" />
                            Kembali ke Profil
                        </Link>
                    </Button>
                </div>

                {/* Page Header */}
                <div className="mb-8">
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                        <Coins className="size-3.5" />
                        Mutasi Saldo Poin
                    </div>
                    <h1 className="mt-2 text-2xl font-black tracking-tight text-foreground sm:text-3xl">
                        Riwayat & Tracking Poin
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground sm:text-base">
                        Pantau seluruh riwayat penambahan (cashback kode unik)
                        dan pengurangan poin yang digunakan pada setiap
                        transaksi.
                    </p>
                </div>

                {/* Active Balance Banner Card */}
                <div className="mb-8 overflow-hidden rounded-2xl border border-primary/20 bg-primary/[0.04] p-5 shadow-sm sm:p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3.5 sm:gap-4">
                            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-xs shadow-primary/20">
                                <Coins className="size-6" />
                            </div>
                            <div>
                                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Saldo Poin Saat Ini
                                </span>
                                <div className="flex items-baseline gap-1.5">
                                    <span className="text-3xl font-black tracking-tight text-primary sm:text-4xl">
                                        {stats.points_balance.toLocaleString('id-ID')}
                                    </span>
                                    <span className="text-xs font-bold uppercase text-muted-foreground">
                                        Poin
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-xl border border-primary/15 bg-card/80 px-4 py-2.5 shadow-2xs backdrop-blur-sm sm:text-right">
                            <p className="text-xs font-semibold text-foreground">
                                Poin Dapat Digunakan:{' '}
                                <span className="font-bold text-primary">
                                    {stats.available_points.toLocaleString('id-ID')} Poin
                                </span>
                            </p>
                            {reservedPoints > 0 ? (
                                <p className="mt-0.5 text-[11px] text-muted-foreground">
                                    {reservedPoints.toLocaleString('id-ID')} poin sedang direservasi untuk checkout
                                </p>
                            ) : (
                                <p className="mt-0.5 text-[11px] text-muted-foreground">
                                    Siap digunakan langsung untuk diskon booking & member
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-border/50 pb-4">
                    <div className="flex items-center gap-1.5 rounded-xl bg-muted/60 p-1">
                        <button
                            type="button"
                            onClick={() => handleFilterChange('all')}
                            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                                currentFilter === 'all'
                                    ? 'bg-card text-foreground shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            Semua Transaksi
                        </button>
                        <button
                            type="button"
                            onClick={() => handleFilterChange('earned')}
                            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                                currentFilter === 'earned'
                                    ? 'bg-card text-emerald-600 shadow-sm dark:text-emerald-400'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            <TrendingUp className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                            Poin Ditambah (+)
                        </button>
                        <button
                            type="button"
                            onClick={() => handleFilterChange('redeemed')}
                            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                                currentFilter === 'redeemed'
                                    ? 'bg-card text-rose-600 shadow-sm dark:text-rose-400'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            <TrendingDown className="size-3.5 text-rose-600 dark:text-rose-400" />
                            Poin Berkurang (-)
                        </button>
                    </div>

                    <span className="text-xs text-muted-foreground">
                        Total {transactions.total.toLocaleString('id-ID')}{' '}
                        transaksi
                    </span>
                </div>

                {/* Transactions Compact List */}
                {transactions.data.length > 0 ? (
                    <div>
                        <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-2xs">
                            <div className="divide-y divide-border/40">
                                {transactions.data.map((tx) => {
                                    const isEarned = tx.type === 'earned';
                                    return (
                                        <div
                                            key={tx.id}
                                            className="group flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-muted/40 sm:px-5 sm:py-3.5"
                                        >
                                            {/* Left: Compact Icon & Title/Context */}
                                            <div className="flex min-w-0 items-center gap-3">
                                                <div
                                                    className={`flex size-8 shrink-0 items-center justify-center rounded-lg sm:size-9 ${
                                                        isEarned
                                                            ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                                                            : 'bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
                                                    }`}
                                                >
                                                    {isEarned ? (
                                                        <ArrowDownLeft className="size-4" />
                                                    ) : (
                                                        <ArrowUpRight className="size-4" />
                                                    )}
                                                </div>

                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-1.5">
                                                        <p className="truncate text-xs font-semibold text-foreground sm:text-sm">
                                                            {tx.title ??
                                                                (isEarned
                                                                    ? 'Poin Masuk'
                                                                    : 'Poin Digunakan')}
                                                        </p>
                                                        {tx.reference_url && (
                                                            <Link
                                                                href={tx.reference_url}
                                                                className="text-muted-foreground transition-colors hover:text-primary"
                                                                title="Lihat pesanan terkait"
                                                            >
                                                                <ExternalLink className="size-3" />
                                                            </Link>
                                                        )}
                                                    </div>
                                                    <p className="truncate text-[11px] text-muted-foreground sm:text-xs">
                                                        {formatFullDateTime(tx.created_at)}
                                                        {tx.description ? ` • ${tx.description}` : ''}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Right: Point Amount & Saldo Akhir */}
                                            <div className="shrink-0 text-right">
                                                <p
                                                    className={`text-xs font-bold sm:text-sm ${
                                                        isEarned
                                                            ? 'text-emerald-600 dark:text-emerald-400'
                                                            : 'text-rose-600 dark:text-rose-400'
                                                    }`}
                                                >
                                                    {isEarned ? '+' : ''}
                                                    {tx.points.toLocaleString('id-ID')}
                                                </p>
                                                <p className="text-[10px] text-muted-foreground sm:text-[11px]">
                                                    Saldo: {tx.balance_after.toLocaleString('id-ID')}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Pagination Component */}
                        <div className="mt-6">
                            <Pagination
                                links={transactions.links}
                                from={transactions.from}
                                to={transactions.to}
                                total={transactions.total}
                                lastPage={transactions.last_page}
                                perPage={transactions.per_page}
                            />
                        </div>
                    </div>
                ) : (
                    /* Empty State */
                    <div className="rounded-2xl border border-dashed border-border/80 bg-card p-12 text-center shadow-sm">
                        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                            <Sparkles className="size-7" />
                        </div>
                        <h2 className="mt-4 text-base font-bold text-foreground sm:text-lg">
                            {currentFilter === 'earned'
                                ? 'Belum Ada Poin Ditambah'
                                : currentFilter === 'redeemed'
                                  ? 'Belum Ada Poin Digunakan'
                                  : 'Belum Ada Riwayat Transaksi Poin'}
                        </h2>
                        <p className="mx-auto mt-1 max-w-md text-xs text-muted-foreground sm:text-sm">
                            {currentFilter === 'earned'
                                ? 'Poin akan bertambah secara otomatis dari 3 digit kode unik saat Anda menyelesaikan pembayaran booking atau membership.'
                                : currentFilter === 'redeemed'
                                  ? 'Anda belum pernah menukarkan poin untuk potongan harga checkout booking atau membership.'
                                  : 'Setiap pembayaran dengan 3 digit kode unik dan penggunaan poin saat checkout akan dicatat secara transparan di sini.'}
                        </p>
                        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                            <Button asChild>
                                <Link href="/lapangan">
                                    Mulai Booking Lapangan
                                </Link>
                            </Button>
                            <Button asChild variant="outline">
                                <Link href="/membership">Lihat Membership</Link>
                            </Button>
                        </div>
                    </div>
                )}

                {/* Helpful Points Info Card */}
                <div className="mt-10 rounded-2xl border border-primary/20 bg-primary/[0.02] p-5 sm:p-6">
                    <div className="flex items-start gap-3">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <ShieldCheck className="size-5" />
                        </div>
                        <div className="space-y-1.5 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                            <h3 className="font-bold text-foreground">
                                Informasi Transparansi Sistem Poin
                            </h3>
                            <p>
                                1. <strong>Cashback Kode Unik:</strong> Saat
                                melakukan pembayaran transfer, 3 digit kode unik
                                yang Anda transferkan tidak akan hangus melainkan
                                langsung dikreditkan 100% menjadi saldo poin
                                setelah pembayaran diverifikasi oleh admin.
                            </p>
                            <p>
                                2. <strong>Potongan Checkout:</strong> Saldo
                                poin Anda bernilai Rp 1 per 1 poin dan dapat
                                langsung dimasukkan sebagai potongan harga pada
                                halaman checkout booking reguler maupun paket
                                membership.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
}
