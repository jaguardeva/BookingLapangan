import { useEffect, useMemo, useRef, useState } from 'react';
import { createColumnHelper, rowPaginationFeature, rowSortingFeature, tableFeatures, useTable, type SortingState } from '@tanstack/react-table';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowDown, ArrowUp, ArrowUpDown, Edit2, Eye, LayoutGrid, Plus, Search, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react';
import AdminLayout from '@/layouts/admin-layout';
import { Pagination } from '@/components/pagination';
import ConfirmDialog from '@/components/confirm-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Category, Facility, Lapangan } from '@/types/booking';
import { show as lapanganShow } from '@/routes/lapangan/index';
import { create, destroy, edit, index as lapanganIndex, toggle as toggleStatus } from '@/routes/admin/lapangans/index';

const features = tableFeatures({ rowSortingFeature, rowPaginationFeature });
const columnHelper = createColumnHelper<typeof features, Lapangan>();

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
    filters: {
        search?: string;
        sort?: string;
        direction?: 'asc' | 'desc';
    };
}

function SortIcon({ direction }: { direction: false | 'asc' | 'desc' }) {
    if (direction === 'asc') return <ArrowUp className="size-3.5" />;
    if (direction === 'desc') return <ArrowDown className="size-3.5" />;

    return <ArrowUpDown className="size-3.5 opacity-50" />;
}

export default function AdminLapanganIndex({ lapangans, filters }: Props) {
    const [deleting, setDeleting] = useState<Lapangan | null>(null);
    const [search, setSearch] = useState(filters.search ?? '');
    const [sorting, setSorting] = useState<SortingState>(
        filters.sort && filters.sort !== 'created_at'
            ? [{ id: filters.sort, desc: filters.direction !== 'asc' }]
            : [],
    );
    const [isFiltering, setIsFiltering] = useState(false);
    const filterKey = JSON.stringify([search, sorting]);
    const initialFilterKey = useRef(filterKey);

    useEffect(() => {
        if (initialFilterKey.current === filterKey) {
            initialFilterKey.current = '';
            return;
        }

        const timeoutId = window.setTimeout(() => {
            const activeSort = sorting[0];
            const query = {
                search: search.trim() || undefined,
                sort: activeSort?.id ?? 'created_at',
                direction: activeSort ? (activeSort.desc ? 'desc' : 'asc') : 'desc',
                page: 1,
            };

            setIsFiltering(true);
            router.get(lapanganIndex.url({ query }), {}, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                onFinish: () => setIsFiltering(false),
            });
        }, 300);

        return () => window.clearTimeout(timeoutId);
    }, [filterKey, search, sorting]);

    const columns = useMemo(() => columnHelper.columns([
        columnHelper.accessor('name', {
            header: ({ column }) => (
                <button type="button" onClick={() => column.toggleSorting()} className="inline-flex items-center gap-1.5 hover:text-foreground">
                    Lapangan <SortIcon direction={column.getIsSorted()} />
                </button>
            ),
            cell: ({ row }) => (
                <div>
                    <p className="text-foreground font-semibold">{row.original.name}</p>
                    <p className="text-muted-foreground mt-1 line-clamp-1">{row.original.description || 'Tanpa deskripsi'}</p>
                </div>
            ),
        }),
        columnHelper.accessor((row) => row.category?.name ?? '-', {
            id: 'category',
            header: ({ column }) => (
                <button type="button" onClick={() => column.toggleSorting()} className="inline-flex items-center gap-1.5 hover:text-foreground">
                    Kategori <SortIcon direction={column.getIsSorted()} />
                </button>
            ),
            cell: ({ row }) => <Badge variant="outline"><LayoutGrid className="size-3" />{row.original.category?.name || '-'}</Badge>,
        }),
        columnHelper.accessor('price_per_hour', {
            header: ({ column }) => (
                <button type="button" onClick={() => column.toggleSorting()} className="inline-flex items-center gap-1.5 hover:text-foreground">
                    Tarif <SortIcon direction={column.getIsSorted()} />
                </button>
            ),
            cell: ({ row }) => <span className="text-primary font-bold">Rp {Number(row.original.price_per_hour).toLocaleString('id-ID')}<span className="text-muted-foreground font-normal">/jam</span></span>,
        }),
        columnHelper.display({
            id: 'operational',
            header: 'Operasional',
            enableSorting: false,
            cell: ({ row }) => <span className="text-muted-foreground">{row.original.operational_start} - {row.original.operational_end}<span className="block text-[11px]">{row.original.slot_duration_minutes} menit/slot</span></span>,
        }),
        columnHelper.accessor('is_active', {
            id: 'status',
            header: ({ column }) => (
                <button type="button" onClick={() => column.toggleSorting()} className="inline-flex items-center gap-1.5 hover:text-foreground">
                    Status <SortIcon direction={column.getIsSorted()} />
                </button>
            ),
            cell: ({ row }) => row.original.is_active ? <Badge className="bg-primary text-primary-foreground">Aktif</Badge> : <Badge variant="outline">Nonaktif</Badge>,
        }),
        columnHelper.display({
            id: 'actions',
            header: 'Aksi',
            enableSorting: false,
            cell: ({ row }) => {
                const item = row.original;

                return (
                    <div className="flex items-center gap-1">
                        <Button asChild size="icon-sm" variant="ghost" aria-label={`Edit ${item.name}`}>
                            <Link href={edit.url(item.id)}><Edit2 className="size-4" /></Link>
                        </Button>
                        <Button size="icon-sm" variant="ghost" aria-label={`${item.is_active ? 'Nonaktifkan' : 'Aktifkan'} ${item.name}`} onClick={() => router.post(toggleStatus.url(item.id), {}, { preserveScroll: true })}>
                            {item.is_active ? <ToggleRight className="text-primary size-4" /> : <ToggleLeft className="size-4" />}
                        </Button>
                        <Button size="icon-sm" variant="ghost" aria-label={`Hapus ${item.name}`} onClick={() => setDeleting(item)}>
                            <Trash2 className="text-destructive size-4" />
                        </Button>
                        <Button asChild size="icon-sm" variant="ghost" aria-label={`Lihat ${item.name}`}>
                            <Link href={lapanganShow.url(item.slug)} target="_blank"><Eye className="size-4" /></Link>
                        </Button>
                    </div>
                );
            },
        }),
    ]), []);

    const table = useTable({
        features,
        data: lapangans.data,
        columns,
        state: { sorting },
        onSortingChange: setSorting,
        manualSorting: true,
        manualPagination: true,
        rowCount: lapangans.total,
    });

    return (
        <AdminLayout breadcrumbs={[{ title: 'Superadmin Workspace', href: '/admin' }, { title: 'Kelola Lapangan', href: '/admin/lapangans' }]}>
            <Head title="Kelola Lapangan" />
            <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-primary text-sm font-semibold">Katalog Lapangan</p>
                        <h1 className="mt-1 text-2xl font-bold tracking-tight">Manajemen Data Lapangan</h1>
                        <p className="text-muted-foreground mt-1 text-sm">Tambah, perbarui tarif, atur jam operasional, dan kelola fasilitas.</p>
                    </div>
                    <Button asChild className="rounded-xl"><Link href={create.url()}><Plus className="size-4" />Tambah Lapangan Baru</Link></Button>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="relative w-full sm:max-w-sm">
                        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                        <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari nama, deskripsi, atau kategori..." className="pl-9" aria-label="Cari lapangan" />
                    </div>
                    {isFiltering && <span className="text-muted-foreground text-xs">Memuat data...</span>}
                </div>

                <Pagination links={lapangans.links} from={lapangans.from} to={lapangans.to} total={lapangans.total} lastPage={lapangans.last_page} perPage={lapangans.per_page} variant="summary" className="mb-4" />

                <div className="border-border/80 bg-card overflow-hidden rounded-2xl border shadow-sm" aria-busy={isFiltering}>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="border-border/60 bg-muted/50 text-muted-foreground border-b tracking-wider uppercase">
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <tr key={headerGroup.id}>{headerGroup.headers.map((header) => <th key={header.id} className="px-4 py-3">{header.isPlaceholder ? null : <table.FlexRender header={header} />}</th>)}</tr>
                                ))}
                            </thead>
                            <tbody className="divide-border/40 divide-y">
                                {table.getRowModel().rows.length === 0 ? (
                                    <tr><td colSpan={columns.length} className="text-muted-foreground py-12 text-center">{search ? 'Lapangan tidak ditemukan.' : 'Belum ada lapangan.'}</td></tr>
                                ) : table.getRowModel().rows.map((row) => (
                                    <tr key={row.id} className="hover:bg-muted/30 transition-colors">{row.getAllCells().map((cell) => <td key={cell.id} className="px-4 py-4"><table.FlexRender cell={cell} /></td>)}</tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                <Pagination links={lapangans.links} from={lapangans.from} to={lapangans.to} total={lapangans.total} lastPage={lapangans.last_page} perPage={lapangans.per_page} variant="navigation" />
            </div>
            <ConfirmDialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)} title="Hapus lapangan?" description={`Lapangan ${deleting?.name ?? ''} dan seluruh riwayat booking terkait akan dihapus.`} confirmLabel="Hapus Lapangan" variant="destructive" icon={Trash2} onConfirm={() => { if (deleting) router.delete(destroy.url(deleting.id), { onFinish: () => setDeleting(null) }); }} />
        </AdminLayout>
    );
}
