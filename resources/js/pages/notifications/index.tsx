import { Head, Link, router } from '@inertiajs/react';
import { PublicLayout } from '@/layouts/public-layout';
import { Pagination } from '@/components/pagination';
import { Bell, CheckCheck, Info, AlertTriangle, CheckCircle2, XCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { InAppNotification } from '@/types/booking';
import { formatDateTimeIndonesia } from '@/lib/locale';

interface Props {
    notifications: {
        data: InAppNotification[];
        links: { url: string | null; label: string; active: boolean }[];
        total: number;
    };
}

export default function NotificationsIndex({ notifications }: Props) {
    const handleMarkAsRead = (id: string, url?: string) => {
        router.post(`/notifications/${id}/read`, {}, {
            preserveScroll: true,
            onSuccess: () => {
                if (url) {
                    router.visit(url);
                }
            },
        });
    };

    const handleMarkAllRead = () => {
        router.post('/notifications/mark-all-read', {}, {
            preserveScroll: true,
        });
    };

    const getIcon = (type?: string) => {
        switch (type) {
            case 'success':
                return <CheckCircle2 className="size-5 text-primary shrink-0 mt-0.5" />;
            case 'alert':
            case 'warning':
                return <AlertTriangle className="size-5 text-amber-500 shrink-0 mt-0.5" />;
            case 'error':
                return <XCircle className="size-5 text-rose-500 shrink-0 mt-0.5" />;
            default:
                return <Info className="size-5 text-sky-500 shrink-0 mt-0.5" />;
        }
    };

    return (
        <PublicLayout>
            <Head title="Pusat Notifikasi" />

            <div className="public-container max-w-3xl py-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-border/60 gap-4">
                    <div>
                        <Button variant="ghost" size="sm" asChild className="text-xs mb-2 -ml-2">
                            <Link href="/">
                                <ArrowLeft className="size-3.5 mr-1" /> Kembali
                            </Link>
                        </Button>
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
                            <Bell className="size-6 text-primary" /> Pusat Notifikasi
                        </h1>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                            Semua pembaruan status booking, validasi pembayaran, dan reminder jadwal main Anda.
                        </p>
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleMarkAllRead}
                        className="h-9 w-full rounded-xl text-xs sm:w-auto"
                    >
                        <CheckCheck className="size-3.5 mr-1.5" /> Tandai Semua Sudah Dibaca
                    </Button>
                </div>

                <div className="space-y-3 pt-6">
                    {notifications.data.length === 0 ? (
                        <div className="p-16 text-center rounded-2xl border border-dashed border-border bg-card">
                            <Bell className="size-10 text-muted-foreground/30 mx-auto mb-3" />
                            <h3 className="font-bold text-base text-foreground">Belum Ada Notifikasi</h3>
                            <p className="text-xs text-muted-foreground mt-1">
                                Setiap update terkait booking lapangan Anda akan muncul di sini.
                            </p>
                        </div>
                    ) : (
                        notifications.data.map((item) => {
                            const isUnread = !item.read_at;
                            return (
                                <div
                                    key={item.id}
                                    onClick={() => handleMarkAsRead(item.id, item.data.url)}
                                    className={`flex cursor-pointer items-start gap-2.5 rounded-xl border p-3 transition-all sm:gap-3.5 sm:p-4 ${
                                        isUnread
                                            ? 'bg-primary/5 border-primary/30 hover:border-primary/50'
                                            : 'bg-card border-border/70 hover:border-border text-muted-foreground'
                                    }`}
                                >
                                    {getIcon(item.data.type)}
                                    <div className="flex-1 min-w-0 space-y-1">
                                        <div className="flex min-w-0 flex-col items-start gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
                                            <p className={`break-words text-sm font-bold ${isUnread ? 'text-foreground' : 'text-foreground/80'}`}>
                                                {item.data.title}
                                            </p>
                                            <span className="whitespace-nowrap text-[11px] text-muted-foreground sm:text-xs">
                                                {formatDateTimeIndonesia(item.created_at, {
                                                    month: 'short',
                                                })}
                                            </span>
                                        </div>
                                        <p className="break-words text-xs leading-relaxed text-foreground/80">
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
                    total={notifications.total}
                    className="mt-8"
                />
            </div>
        </PublicLayout>
    );
}
