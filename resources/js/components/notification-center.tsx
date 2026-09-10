import { Bell, CheckCheck, Info, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { InAppNotification } from '@/types/booking';

export function NotificationCenter() {
    const page = usePage<{ auth: { user?: { unread_notifications_count?: number } } }>();
    const unreadCount = page.props.auth?.user?.unread_notifications_count ?? 0;

    const [notifications, setNotifications] = useState<InAppNotification[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchNotifications = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/notifications/recent');
            if (res.ok) {
                const data = await res.json();
                setNotifications(data.notifications || []);
            }
        } catch (e) {
            console.error('Failed to load notifications', e);
        } finally {
            setIsLoading(false);
        }
    };

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
            onSuccess: () => {
                setNotifications((prev) =>
                    prev.map((n) => ({ ...n, read_at: new Date().toISOString() }))
                );
            },
        });
    };

    const getIcon = (type?: string) => {
        switch (type) {
            case 'success':
                return <CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" />;
            case 'alert':
            case 'warning':
                return <AlertTriangle className="size-4 text-amber-500 shrink-0 mt-0.5" />;
            case 'error':
                return <XCircle className="size-4 text-rose-500 shrink-0 mt-0.5" />;
            default:
                return <Info className="size-4 text-sky-500 shrink-0 mt-0.5" />;
        }
    };

    return (
        <DropdownMenu onOpenChange={(open) => open && fetchNotifications()}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full">
                    <Bell className="size-4 text-foreground/80" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-600 px-1 text-[10px] font-bold text-white ring-2 ring-background animate-pulse">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                    <span className="sr-only">Notifikasi</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 sm:w-96 p-0 rounded-xl shadow-xl border-border">
                <div className="flex items-center justify-between p-3.5 border-b border-border/60 bg-muted/40">
                    <div className="flex items-center gap-2">
                        <Bell className="size-4 text-emerald-600 dark:text-emerald-400" />
                        <span className="font-semibold text-sm">Pusat Notifikasi</span>
                        {unreadCount > 0 && (
                            <span className="rounded-full bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                                {unreadCount} baru
                            </span>
                        )}
                    </div>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleMarkAllRead}
                            className="h-7 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                        >
                            <CheckCheck className="size-3.5" />
                            Tandai semua
                        </Button>
                    )}
                </div>

                <div className="max-h-[350px] overflow-y-auto divide-y divide-border/40">
                    {isLoading ? (
                        <div className="p-6 text-center text-xs text-muted-foreground">
                            Memuat notifikasi...
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="p-8 text-center text-xs text-muted-foreground">
                            <Bell className="size-8 text-muted-foreground/30 mx-auto mb-2" />
                            Belum ada notifikasi
                        </div>
                    ) : (
                        notifications.map((item) => {
                            const isUnread = !item.read_at;
                            return (
                                <div
                                    key={item.id}
                                    onClick={() => handleMarkAsRead(item.id, item.data.url)}
                                    className={`p-3.5 text-xs transition-colors cursor-pointer hover:bg-muted/50 flex gap-3 ${
                                        isUnread ? 'bg-emerald-500/5 font-medium' : 'text-muted-foreground'
                                    }`}
                                >
                                    {getIcon(item.data.type)}
                                    <div className="flex-1 min-w-0 space-y-1">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className={`text-xs font-semibold truncate ${isUnread ? 'text-foreground' : 'text-foreground/70'}`}>
                                                {item.data.title}
                                            </p>
                                            {isUnread && (
                                                <span className="size-2 rounded-full bg-emerald-500 shrink-0" />
                                            )}
                                        </div>
                                        <p className="text-[11px] leading-relaxed line-clamp-2 text-foreground/80">
                                            {item.data.message}
                                        </p>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                <div className="p-2 border-t border-border/60 bg-muted/20 text-center">
                    <Link
                        href="/notifications"
                        className="text-xs font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors"
                    >
                        Lihat Semua Notifikasi →
                    </Link>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
