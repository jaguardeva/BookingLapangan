import { Link } from '@inertiajs/react';
import {
    Coins,
    TrendingUp,
    TrendingDown,
    ArrowRight,
    Sparkles,
    CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

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

export type PointStats = {
    total_earned: number;
    total_redeemed: number;
    recent_transactions: PointTransaction[];
};

type PointsCardProps = {
    pointsBalance: number;
    availablePoints: number;
    stats?: PointStats | null;
};

function formatRelativeDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    const diffWeeks = Math.floor(diffDays / 7);

    if (diffMins < 1) return 'baru saja';
    if (diffMins < 60) return `${diffMins} menit lalu`;
    if (diffHours < 24) return `${diffHours} jam lalu`;
    if (diffDays < 7) return `${diffDays} hari lalu`;
    if (diffWeeks < 4) return `${diffWeeks} minggu lalu`;
    return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

export function PointsCard({
    pointsBalance,
    availablePoints,
    stats,
}: PointsCardProps) {
    const recentTransactions = stats?.recent_transactions ?? [];
    const reservedPoints = Math.max(0, pointsBalance - availablePoints);

    return (
        <section className="relative overflow-hidden rounded-2xl border border-border/60 bg-card p-5 shadow-sm transition-all duration-300 hover:shadow-md sm:p-6">
            {/* Header: Title & Direct History Link */}
            <div className="flex items-center justify-between border-b border-border/40 pb-4">
                <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-105">
                        <Coins className="size-5" />
                    </div>
                    <div>
                        <h2 className="text-foreground text-lg font-bold tracking-tight">
                            Poin Saya
                        </h2>
                        <p className="text-muted-foreground text-xs">
                            Poin aktif dari kode unik pembayaran & transaksi
                        </p>
                    </div>
                </div>

                <Link
                    href="/points/history"
                    className="hidden items-center gap-1 text-xs font-semibold text-primary transition-colors hover:text-primary/80 sm:inline-flex"
                >
                    Lihat Riwayat
                    <ArrowRight className="size-3.5" />
                </Link>
            </div>

            {/* Current Balance Card */}
            <div className="my-5 rounded-xl border border-primary/20 bg-gradient-to-r from-primary/[0.07] via-primary/[0.03] to-transparent p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <span className="text-muted-foreground text-xs font-medium">
                            Saldo Poin Saat Ini
                        </span>
                        <div className="mt-1 flex items-baseline gap-2">
                            <span className="text-3xl font-extrabold tracking-tight text-primary sm:text-4xl">
                                {pointsBalance.toLocaleString('id-ID')}
                            </span>
                            <span className="text-muted-foreground text-xs font-semibold uppercase">
                                Poin
                            </span>
                        </div>
                    </div>

                    <div className="border-t border-border/40 pt-2 sm:border-t-0 sm:pt-0 sm:text-right">
                        {reservedPoints > 0 ? (
                            <p className="text-muted-foreground text-xs">
                                <span className="font-semibold text-foreground">
                                    {availablePoints.toLocaleString('id-ID')}
                                </span>{' '}
                                poin dapat digunakan{' '}
                                <span className="text-muted-foreground/80">
                                    ({reservedPoints.toLocaleString('id-ID')} reservasi)
                                </span>
                            </p>
                        ) : (
                            <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                                <Sparkles className="size-3.5" />
                                <span>Semua poin siap digunakan</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Recent Transactions List */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h3 className="text-foreground text-xs font-bold uppercase tracking-wider">
                        Riwayat Transaksi Terbaru
                    </h3>
                    <span className="text-muted-foreground text-[11px]">
                        5 mutasi terakhir
                    </span>
                </div>

                {recentTransactions.length > 0 ? (
                    <div className="divide-y divide-border/40 rounded-xl border border-border/50 bg-card">
                        {recentTransactions.map((tx) => {
                            const isEarned = tx.type === 'earned';
                            return (
                                <div
                                    key={tx.id}
                                    className="flex items-center justify-between gap-3 p-3 transition-colors hover:bg-muted/30 sm:px-4"
                                >
                                    <div className="flex min-w-0 items-center gap-3">
                                        <div
                                            className={`flex size-8 shrink-0 items-center justify-center rounded-full ${
                                                isEarned
                                                    ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                                                    : 'bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
                                            }`}
                                        >
                                            {isEarned ? (
                                                <TrendingUp className="size-4" />
                                            ) : (
                                                <TrendingDown className="size-4" />
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-foreground truncate text-xs font-semibold sm:text-sm">
                                                {tx.title ??
                                                    (isEarned
                                                        ? 'Poin Diperoleh'
                                                        : 'Penukaran Poin')}
                                            </p>
                                            <p className="text-muted-foreground truncate text-[11px]">
                                                {tx.description ??
                                                    (isEarned
                                                        ? 'Penambahan poin'
                                                        : 'Pemakaian poin')}
                                            </p>
                                        </div>
                                    </div>

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
                                        <p className="text-muted-foreground text-[10px]">
                                            {formatRelativeDate(tx.created_at)}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="rounded-xl border border-dashed border-border/60 p-6 text-center">
                        <Sparkles className="mx-auto size-7 text-muted-foreground/50" />
                        <p className="text-foreground mt-2 text-sm font-medium">
                            Belum Ada Riwayat Poin
                        </p>
                        <p className="text-muted-foreground mt-0.5 text-xs">
                            Poin akan otomatis tercatat saat Anda menyelesaikan
                            pembayaran dengan kode unik.
                        </p>
                    </div>
                )}
            </div>

            {/* Action Button & Informative Footer */}
            <div className="mt-5 space-y-3 pt-2">
                <Button
                    asChild
                    variant="outline"
                    className="w-full border-primary/30 text-primary hover:bg-primary/5 hover:text-primary"
                >
                    <Link href="/points/history">
                        Lihat Semua Riwayat Poin
                        <ArrowRight className="ml-1.5 size-4" />
                    </Link>
                </Button>

                <div className="flex items-start gap-2 rounded-lg bg-muted/40 p-3 text-[11px] text-muted-foreground">
                    <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-primary" />
                    <p className="leading-relaxed">
                        Poin diperoleh dari 3 digit kode unik transfer booking &
                        membership. Gunakan poin sebagai potongan harga langsung
                        pada saat checkout berikutnya.
                    </p>
                </div>
            </div>
        </section>
    );
}
