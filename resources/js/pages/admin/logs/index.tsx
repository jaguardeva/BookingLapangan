import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Pagination } from '@/components/pagination';
import { History, Shield, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { ActivityLog } from '@/types/booking';

interface Props {
    logs: {
        data: ActivityLog[];
        links: { url: string | null; label: string; active: boolean }[];
        total: number;
        from?: number | null;
        to?: number | null;
        last_page?: number;
        per_page?: number;
    };
}

export default function AdminLogsIndex({ logs }: Props) {
    const breadcrumbs = [
        { title: 'Superadmin Workspace', href: '/admin' },
        { title: 'Log Aktivitas', href: '/admin/logs' },
    ];

    const getActionBadge = (action: string) => {
        if (action.includes('approved')) {
            return (
                <Badge className="bg-primary text-primary-foreground text-xs">
                    {action}
                </Badge>
            );
        }
        if (action.includes('rejected') || action.includes('deleted')) {
            return (
                <Badge className="bg-rose-600 text-xs text-white">
                    {action}
                </Badge>
            );
        }
        if (action.includes('created') || action.includes('submitted')) {
            return (
                <Badge className="bg-sky-600 text-xs text-white">
                    {action}
                </Badge>
            );
        }
        return (
            <Badge variant="outline" className="text-xs">
                {action}
            </Badge>
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Audit Log Aktivitas - Superadmin" />

            <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
                <div>
                    <h1 className="text-foreground flex items-center gap-2 text-2xl font-bold tracking-tight">
                        <History className="text-primary size-6" /> Audit Log &
                        Rekam Aktivitas Sistem
                    </h1>
                    <p className="text-muted-foreground mt-0.5 text-xs">
                        Rekam jejak setiap aksi superadmin, kasir, dan pengguna
                        dalam sistem booking lapangan.
                    </p>
                </div>

                <Pagination
                    links={logs.links}
                    from={logs.from}
                    to={logs.to}
                    total={logs.total}
                    lastPage={logs.last_page}
                    perPage={logs.per_page}
                    variant="summary"
                    className="mb-4"
                />

                <div className="border-border/80 bg-card overflow-hidden rounded-2xl border shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-muted/50 text-muted-foreground border-border/60 border-b text-xs tracking-wider uppercase">
                                <tr>
                                    <th className="px-4 py-3">Waktu</th>
                                    <th className="px-4 py-3">Pengguna</th>
                                    <th className="px-4 py-3">Aksi</th>
                                    <th className="px-4 py-3">
                                        Deskripsi Aktivitas
                                    </th>
                                    <th className="px-4 py-3">IP Address</th>
                                </tr>
                            </thead>
                            <tbody className="divide-border/40 divide-y">
                                {logs.data.map((log) => (
                                    <tr
                                        key={log.id}
                                        className="hover:bg-muted/30 transition-colors"
                                    >
                                        <td className="text-muted-foreground px-4 py-3 whitespace-nowrap">
                                            {new Date(
                                                log.created_at,
                                            ).toLocaleDateString('id-ID', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </td>

                                        <td className="text-foreground px-4 py-3 font-semibold">
                                            {log.user?.name ||
                                                'Sistem Otomatis'}
                                            {log.user?.role && (
                                                <span className="text-muted-foreground block text-xs font-normal uppercase">
                                                    {log.user.role}
                                                </span>
                                            )}
                                        </td>

                                        <td className="px-4 py-3">
                                            {getActionBadge(log.action)}
                                        </td>

                                        <td className="text-foreground max-w-md px-4 py-3">
                                            <p className="font-medium">
                                                {log.description}
                                            </p>
                                            {log.properties && (
                                                <pre className="text-muted-foreground bg-muted/40 mt-1 overflow-x-auto rounded p-1.5 font-mono text-xs">
                                                    {JSON.stringify(
                                                        log.properties,
                                                    )}
                                                </pre>
                                            )}
                                        </td>

                                        <td className="text-muted-foreground px-4 py-3 font-mono text-xs">
                                            {log.ip_address || '127.0.0.1'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <Pagination
                    links={logs.links}
                    from={logs.from}
                    to={logs.to}
                    total={logs.total}
                    lastPage={logs.last_page}
                    perPage={logs.per_page}
                    variant="navigation"
                    className="mt-2"
                />
            </div>
        </AppLayout>
    );
}
