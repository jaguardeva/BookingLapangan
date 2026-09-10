import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { History, Shield, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { ActivityLog } from '@/types/booking';

interface Props {
    logs: {
        data: ActivityLog[];
        links: { url: string | null; label: string; active: boolean }[];
        total: number;
    };
}

export default function AdminLogsIndex({ logs }: Props) {
    const breadcrumbs = [
        { title: 'Superadmin Workspace', href: '/admin' },
        { title: 'Log Aktivitas', href: '/admin/logs' },
    ];

    const getActionBadge = (action: string) => {
        if (action.includes('approved')) {
            return <Badge className="bg-emerald-600 text-white text-xs">{action}</Badge>;
        }
        if (action.includes('rejected') || action.includes('deleted')) {
            return <Badge className="bg-rose-600 text-white text-xs">{action}</Badge>;
        }
        if (action.includes('created') || action.includes('submitted')) {
            return <Badge className="bg-sky-600 text-white text-xs">{action}</Badge>;
        }
        return <Badge variant="outline" className="text-xs">{action}</Badge>;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Audit Log Aktivitas - Superadmin" />

            <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <History className="size-6 text-emerald-600" /> Audit Log & Rekam Aktivitas Sistem
                    </h1>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Rekam jejak setiap aksi superadmin, kasir, dan pengguna dalam sistem booking lapangan.
                    </p>
                </div>

                <div className="rounded-2xl border border-border/80 bg-card shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                            <thead className="bg-muted/50 text-muted-foreground uppercase text-xs tracking-wider border-b border-border/60">
                                <tr>
                                    <th className="py-3 px-4">Waktu</th>
                                    <th className="py-3 px-4">Pengguna</th>
                                    <th className="py-3 px-4">Aksi</th>
                                    <th className="py-3 px-4">Deskripsi Aktivitas</th>
                                    <th className="py-3 px-4">IP Address</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/40">
                                {logs.data.map((log) => (
                                    <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                                            {new Date(log.created_at).toLocaleDateString('id-ID', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </td>

                                        <td className="py-3 px-4 font-semibold text-foreground">
                                            {log.user?.name || 'Sistem Otomatis'}
                                            {log.user?.role && (
                                                <span className="block text-xs text-muted-foreground uppercase font-normal">
                                                    {log.user.role}
                                                </span>
                                            )}
                                        </td>

                                        <td className="py-3 px-4">
                                            {getActionBadge(log.action)}
                                        </td>

                                        <td className="py-3 px-4 max-w-md text-foreground">
                                            <p className="font-medium">{log.description}</p>
                                            {log.properties && (
                                                <pre className="text-xs text-muted-foreground mt-1 bg-muted/40 p-1.5 rounded font-mono overflow-x-auto">
                                                    {JSON.stringify(log.properties)}
                                                </pre>
                                            )}
                                        </td>

                                        <td className="py-3 px-4 font-mono text-muted-foreground text-xs">
                                            {log.ip_address || '127.0.0.1'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pagination */}
                {logs.links && logs.links.length > 3 && (
                    <div className="flex justify-center items-center gap-1.5 mt-2">
                        {logs.links.map((link, idx) => (
                            <Link
                                key={idx}
                                href={link.url || '#'}
                                preserveScroll
                                className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                                    link.active
                                        ? 'bg-emerald-600 text-white border-emerald-600'
                                        : link.url
                                        ? 'bg-card text-foreground hover:bg-muted border-border'
                                        : 'text-muted-foreground/50 border-transparent cursor-not-allowed pointer-events-none'
                                }`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
