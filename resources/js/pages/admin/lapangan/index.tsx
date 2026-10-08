import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import {
    Edit2,
    Eye,
    LayoutGrid,
    Plus,
    Trash2,
    ToggleLeft,
    ToggleRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ConfirmDialog from '@/components/confirm-dialog';
import { Pagination } from '@/components/pagination';
import type { Category, Facility, Lapangan } from '@/types/booking';
import {
    create,
    edit,
    toggle as toggleStatus,
    destroy,
} from '@/routes/admin/lapangans/index';

interface Props {
    lapangans: {
        data: Lapangan[];
        links: { url: string | null; label: string; active: boolean }[];
        from?: number | null;
        to?: number | null;
        total: number;
        last_page?: number;
        per_page?: number;
    };
    categories: Category[];
    facilities: Facility[];
}

export default function AdminLapanganIndex({ lapangans }: Props) {
    const [deleting, setDeleting] = useState<Lapangan | null>(null);
    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Superadmin Workspace', href: '/admin' },
                { title: 'Kelola Lapangan', href: '/admin/lapangans' },
            ]}
        >
            <Head title="Kelola Lapangan" />
            <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-primary text-sm font-semibold">
                            Katalog Lapangan
                        </p>
                        <h1 className="mt-1 text-2xl font-bold tracking-tight">
                            Manajemen Data Lapangan
                        </h1>
                        <p className="text-muted-foreground mt-1 text-sm">
                            Tambah, perbarui tarif, atur jam operasional, dan
                            kelola fasilitas.
                        </p>
                    </div>
                    <Button asChild className="rounded-xl">
                        <Link href={create.url()}>
                            <Plus className="size-4" />
                            Tambah Lapangan Baru
                        </Link>
                    </Button>
                </div>
                <Pagination
                    links={lapangans.links}
                    from={lapangans.from}
                    to={lapangans.to}
                    total={lapangans.total}
                    lastPage={lapangans.last_page}
                    perPage={lapangans.per_page}
                    variant="summary"
                    className="mb-4"
                />

                <div className="border-border/80 bg-card overflow-x-auto rounded-2xl border shadow-sm">
                    <table className="w-full text-left text-xs">
                        <thead className="border-border/60 bg-muted/50 text-muted-foreground border-b tracking-wider uppercase">
                            <tr>
                                {[
                                    'Lapangan',
                                    'Kategori',
                                    'Tarif',
                                    'Operasional',
                                    'Status',
                                    'Aksi',
                                ].map((heading) => (
                                    <th key={heading} className="px-4 py-3">
                                        {heading}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-border/40 divide-y">
                            {lapangans.data.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="text-muted-foreground py-12 text-center"
                                    >
                                        Belum ada lapangan.
                                    </td>
                                </tr>
                            ) : (
                                lapangans.data.map((item) => (
                                    <tr
                                        key={item.id}
                                        className="hover:bg-muted/30 transition-colors"
                                    >
                                        <td className="px-4 py-4">
                                            <p className="text-foreground font-semibold">
                                                {item.name}
                                            </p>
                                            <p className="text-muted-foreground mt-1 line-clamp-1">
                                                {item.description ||
                                                    'Tanpa deskripsi'}
                                            </p>
                                        </td>
                                        <td className="px-4 py-4">
                                            <Badge variant="outline">
                                                <LayoutGrid className="size-3" />
                                                {item.category?.name || '-'}
                                            </Badge>
                                        </td>
                                        <td className="text-primary px-4 py-4 font-bold">
                                            Rp{' '}
                                            {Number(
                                                item.price_per_hour,
                                            ).toLocaleString('id-ID')}
                                            <span className="text-muted-foreground font-normal">
                                                /jam
                                            </span>
                                        </td>
                                        <td className="text-muted-foreground px-4 py-4">
                                            {item.operational_start} -{' '}
                                            {item.operational_end}
                                            <span className="block text-[11px]">
                                                {item.slot_duration_minutes}{' '}
                                                menit/slot
                                            </span>
                                        </td>
                                        <td className="px-4 py-4">
                                            {item.is_active ? (
                                                <Badge className="bg-primary text-primary-foreground">
                                                    Aktif
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline">
                                                    Nonaktif
                                                </Badge>
                                            )}
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    asChild
                                                    size="icon-sm"
                                                    variant="ghost"
                                                    aria-label={`Edit ${item.name}`}
                                                >
                                                    <Link
                                                        href={edit.url(item.id)}
                                                    >
                                                        <Edit2 className="size-4" />
                                                    </Link>
                                                </Button>
                                                <Button
                                                    size="icon-sm"
                                                    variant="ghost"
                                                    aria-label={`${item.is_active ? 'Nonaktifkan' : 'Aktifkan'} ${item.name}`}
                                                    onClick={() =>
                                                        router.post(
                                                            toggleStatus.url(
                                                                item.id,
                                                            ),
                                                            {},
                                                            {
                                                                preserveScroll: true,
                                                            },
                                                        )
                                                    }
                                                >
                                                    {item.is_active ? (
                                                        <ToggleRight className="text-primary size-4" />
                                                    ) : (
                                                        <ToggleLeft className="size-4" />
                                                    )}
                                                </Button>
                                                <Button
                                                    size="icon-sm"
                                                    variant="ghost"
                                                    aria-label={`Hapus ${item.name}`}
                                                    onClick={() =>
                                                        setDeleting(item)
                                                    }
                                                >
                                                    <Trash2 className="text-destructive size-4" />
                                                </Button>
                                                <Button
                                                    asChild
                                                    size="icon-sm"
                                                    variant="ghost"
                                                    aria-label={`Lihat ${item.name}`}
                                                >
                                                    <Link
                                                        href={`/lapangan/${item.slug}`}
                                                        target="_blank"
                                                    >
                                                        <Eye className="size-4" />
                                                    </Link>
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                <Pagination
                    links={lapangans.links}
                    from={lapangans.from}
                    to={lapangans.to}
                    total={lapangans.total}
                    lastPage={lapangans.last_page}
                    perPage={lapangans.per_page}
                    variant="navigation"
                />
            </div>
            <ConfirmDialog
                open={deleting !== null}
                onOpenChange={(open) => !open && setDeleting(null)}
                title="Hapus lapangan?"
                description={`Lapangan ${deleting?.name ?? ''} dan seluruh riwayat booking terkait akan dihapus.`}
                confirmLabel="Hapus Lapangan"
                variant="destructive"
                icon={Trash2}
                onConfirm={() => {
                    if (deleting)
                        router.delete(destroy.url(deleting.id), {
                            onFinish: () => setDeleting(null),
                        });
                }}
            />
        </AppLayout>
    );
}
