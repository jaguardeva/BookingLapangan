import { Head, Link, router } from '@inertiajs/react';
import { PublicLayout } from '@/layouts/public-layout';
import { Pagination } from '@/components/pagination';
import {
    Bell,
    CheckCheck,
    Info,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { InAppNotification } from '@/types/booking';
import { formatDateTimeIndonesia } from '@/lib/locale';

interface Props {
    notifications: {
        data: InAppNotification[];
        links: { url: string | null; label: string; active: boolean }[];
        total: number;
        from?: number | null;
        to?: number | null;
        last_page?: number;
        per_page?: number;
    };
}

export default function NotificationsIndex({ notifications }: Props) {
    const handleMarkAsRead = (id: string, url?: string) => {
        router.post(
            `/notifications/${id}/read`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    if (url) {
                        router.visit(url);
                    }
                },
            },
        );
    };

    const handleMarkAllRead = () => {
        router.post(
            '/notifications/mark-all-read',
            {},
            {
                preserveScroll: true,
            },
        );
    };

    const getIcon = (type?: string) => {
        switch (type) {
            case 'success':
                return (
                    <CheckCircle2 className="text-primary mt-0.5 size-5 shrink-0" />
                );
            case 'alert':
            case 'warning':
                return (
                    <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-500" />
                );
            case 'error':
                return (
                    <XCircle className="mt-0.5 size-5 shrink-0 text-rose-500" />
                );
            default:
                return <Info className="mt-0.5 size-5 shrink-0 text-sky-500" />;
        }
    };

    return (
        <PublicLayout>
            <Head title="Pusat Notifikasi" />

            <div className="public-container max-w-3xl py-8">
                <div className="border-border/60 flex flex-col justify-between gap-4 border-b pb-6 sm:flex-row sm:items-center">
                    <div>
                        <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            className="mb-2 -ml-2 text-xs"
                        >
                            <Link href="/">
                                <ArrowLeft className="size-3.5" /> Kembali
                            </Link>
                        </Button>
                        <h1 className="text-foreground flex items-center gap-2.5 text-2xl font-bold tracking-tight sm:text-3xl">
                            <Bell className="text-primary size-6" /> Pusat
                            Notifikasi
                        </h1>
                        <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
                            Semua pembaruan status booking, validasi pembayaran,
                            dan reminder jadwal main Anda.
                        </p>
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleMarkAllRead}
                        className="h-9 w-full rounded-xl text-xs sm:w-auto"
                    >
                        <CheckCheck className="size-3.5" /> Tandai Semua
                        Sudah Dibaca
                    </Button>
                </div>

                <Pagination
                    links={notifications.links}
                    from={notifications.from}
                    to={notifications.to}
                    total={notifications.total}
                    lastPage={notifications.last_page}
                    perPage={notifications.per_page}
                    variant="summary"
                    className="pt-6"
                />

                <div className="space-y-3 pt-6">
                    {notifications.data.length === 0 ? (
                        <div className="border-border bg-card rounded-2xl border border-dashed p-16 text-center">
                            <Bell className="text-muted-foreground/30 mx-auto mb-3 size-10" />
                            <h3 className="text-foreground text-base font-bold">
                                Belum Ada Notifikasi
                            </h3>
                            <p className="text-muted-foreground mt-1 text-xs">
                                Setiap update terkait booking lapangan Anda akan
                                muncul di sini.
                            </p>
                        </div>
                    ) : (
                        notifications.data.map((item) => {
                            const isUnread = !item.read_at;
                            return (
                                <div
                                    key={item.id}
                                    onClick={() =>
                                        handleMarkAsRead(item.id, item.data.url)
                                    }
                                    className={`flex cursor-pointer items-start gap-2.5 rounded-xl border p-3 transition-all sm:gap-3.5 sm:p-4 ${
                                        isUnread
                                            ? 'bg-primary/5 border-primary/30 hover:border-primary/50'
                                            : 'bg-card border-border/70 hover:border-border text-muted-foreground'
                                    }`}
                                >
                                    {getIcon(item.data.type)}
                                    <div className="min-w-0 flex-1 space-y-1">
                                        <div className="flex min-w-0 flex-col items-start gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
                                            <p
                                                className={`text-sm font-bold break-words ${isUnread ? 'text-foreground' : 'text-foreground/80'}`}
                                            >
                                                {item.data.title}
                                            </p>
                                            <span className="text-muted-foreground text-[11px] whitespace-nowrap sm:text-xs">
                                                {formatDateTimeIndonesia(
                                                    item.created_at,
                                                    {
                                                        month: 'short',
                                                    },
                                                )}
                                            </span>
                                        </div>
                                        <p className="text-foreground/80 text-xs leading-relaxed break-words">
                                            {item.data.message}
                                        </p>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                <Pagination
                    links={notifications.links}
                    from={notifications.from}
                    to={notifications.to}
                    total={notifications.total}
                    lastPage={notifications.last_page}
                    perPage={notifications.per_page}
                    variant="navigation"
                    className="mt-8"
                />
            </div>
        </PublicLayout>
    );
}
