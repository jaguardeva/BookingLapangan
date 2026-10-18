import { Head, router, useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import {
    createColumnHelper,
    rowPaginationFeature,
    rowSelectionFeature,
    rowSortingFeature,
    tableFeatures,
    useTable,
    type RowSelectionState,
    type SortingState,
} from '@tanstack/react-table';
import {
    AlertTriangle,
    ArrowDown,
    ArrowUp,
    ArrowUpDown,
    CheckCircle2,
    Layers,
    LayoutGrid,
    Pencil,
    Plus,
    Search,
    Sparkles,
    ToggleLeft,
    ToggleRight,
    Trash2,
    X,
} from 'lucide-react';
import AdminLayout from '@/layouts/admin-layout';
import ConfirmDialog from '@/components/confirm-dialog';
import { CatalogIcon, catalogIconOptions, getCatalogIconName } from '@/components/catalog-icon';
import { Pagination, type PaginationLink } from '@/components/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import categoryRoutes, {
    bulkDestroy as bulkDestroyCategory,
    destroy as destroyCategory,
    store as storeCategory,
    toggle as toggleCategory,
    update as updateCategory,
} from '@/actions/App/Http/Controllers/Admin/CategoryManagementController';
import facilityRoutes, {
    bulkDestroy as bulkDestroyFacility,
    destroy as destroyFacility,
    store as storeFacility,
    update as updateFacility,
} from '@/actions/App/Http/Controllers/Admin/FacilityManagementController';
import type { Category, Facility } from '@/types/booking';

type CategoryItem = Category & { lapangans_count?: number };
type FacilityItem = Facility & { lapangans_count?: number };

interface Props {
    categories: CategoryItem[];
    facilities: FacilityItem[];
}

type CatalogTab = 'categories' | 'facilities';

const tableConfig = tableFeatures({
    rowSortingFeature,
    rowPaginationFeature,
    rowSelectionFeature,
});

const categoryColumnHelper = createColumnHelper<typeof tableConfig, CategoryItem>();
const facilityColumnHelper = createColumnHelper<typeof tableConfig, FacilityItem>();

function SortIcon({ direction }: { direction: false | 'asc' | 'desc' }) {
    if (direction === 'asc') return <ArrowUp className="size-3.5" />;
    if (direction === 'desc') return <ArrowDown className="size-3.5" />;
    return <ArrowUpDown className="size-3.5 opacity-50" />;
}

function generatePaginationLinks(pageCount: number, currentPage: number): PaginationLink[] {
    if (pageCount <= 1) return [];
    const links: PaginationLink[] = [];

    links.push({
        url: currentPage > 1 ? `#page-${currentPage - 1}` : null,
        label: '&laquo; Sebelumnya',
        active: false,
    });

    for (let p = 1; p <= pageCount; p++) {
        if (pageCount <= 7 || p === 1 || p === pageCount || Math.abs(p - currentPage) <= 1) {
            links.push({
                url: `#page-${p}`,
                label: String(p),
                active: p === currentPage,
            });
        } else if (
            (p === currentPage - 2 && currentPage > 3) ||
            (p === currentPage + 2 && currentPage < pageCount - 2)
        ) {
            links.push({
                url: null,
                label: '...',
                active: false,
            });
        }
    }

    links.push({
        url: currentPage < pageCount ? `#page-${currentPage + 1}` : null,
        label: 'Selanjutnya &raquo;',
        active: false,
    });

    return links;
}

export default function CatalogIndex({ categories, facilities }: Props) {
    const [activeTab, setActiveTab] = useState<CatalogTab>('categories');

    // Dialog state for Category
    const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
    const [deletingCategory, setDeletingCategory] = useState<CategoryItem | null>(null);
    const [bulkDeletingCategory, setBulkDeletingCategory] = useState(false);
    const categoryForm = useForm({ name: '', icon: '', description: '' });

    // Dialog state for Facility
    const [facilityDialogOpen, setFacilityDialogOpen] = useState(false);
    const [editingFacility, setEditingFacility] = useState<FacilityItem | null>(null);
    const [deletingFacility, setDeletingFacility] = useState<FacilityItem | null>(null);
    const [bulkDeletingFacility, setBulkDeletingFacility] = useState(false);
    const facilityForm = useForm({ name: '', icon: '' });

    // Search state
    const [categorySearch, setCategorySearch] = useState('');
    const [facilitySearch, setFacilitySearch] = useState('');

    // TanStack Table states for Categories
    const [categorySorting, setCategorySorting] = useState<SortingState>([]);
    const [categoryRowSelection, setCategoryRowSelection] = useState<RowSelectionState>({});
    const [categoryPagination, setCategoryPagination] = useState({ pageIndex: 0, pageSize: 10 });

    // TanStack Table states for Facilities
    const [facilitySorting, setFacilitySorting] = useState<SortingState>([]);
    const [facilityRowSelection, setFacilityRowSelection] = useState<RowSelectionState>({});
    const [facilityPagination, setFacilityPagination] = useState({ pageIndex: 0, pageSize: 10 });

    // Filtered data
    const filteredCategories = useMemo(() => {
        if (!categorySearch.trim()) return categories;
        const q = categorySearch.toLowerCase().trim();
        return categories.filter(
            (c) =>
                c.name.toLowerCase().includes(q) ||
                (c.slug && c.slug.toLowerCase().includes(q)) ||
                (c.description && c.description.toLowerCase().includes(q)),
        );
    }, [categories, categorySearch]);

    const filteredFacilities = useMemo(() => {
        if (!facilitySearch.trim()) return facilities;
        const q = facilitySearch.toLowerCase().trim();
        return facilities.filter((f) => f.name.toLowerCase().includes(q));
    }, [facilities, facilitySearch]);

    // Selected row IDs
    const selectedCategoryIds = useMemo(() => {
        return Object.keys(categoryRowSelection).filter((id) => categoryRowSelection[id]);
    }, [categoryRowSelection]);

    const selectedFacilityIds = useMemo(() => {
        return Object.keys(facilityRowSelection).filter((id) => facilityRowSelection[id]);
    }, [facilityRowSelection]);

    // Category Table Columns
    const categoryColumns = useMemo(
        () =>
            categoryColumnHelper.columns([
                categoryColumnHelper.display({
                    id: 'select',
                    header: ({ table }) => (
                        <div className="flex items-center justify-center">
                            <Checkbox
                                checked={
                                    table.getIsAllPageRowsSelected()
                                        ? true
                                        : table.getIsSomePageRowsSelected()
                                          ? 'indeterminate'
                                          : false
                                }
                                onCheckedChange={(value) =>
                                    table.toggleAllPageRowsSelected(Boolean(value))
                                }
                                aria-label="Pilih semua kategori pada halaman ini"
                            />
                        </div>
                    ),
                    cell: ({ row }) => (
                        <div className="flex items-center justify-center">
                            <Checkbox
                                checked={row.getIsSelected()}
                                onCheckedChange={(value) => row.toggleSelected(Boolean(value))}
                                aria-label={`Pilih kategori ${row.original.name}`}
                            />
                        </div>
                    ),
                    enableSorting: false,
                }),
                categoryColumnHelper.accessor('name', {
                    header: ({ column }) => (
                        <button
                            type="button"
                            onClick={() => column.toggleSorting()}
                            className="inline-flex items-center gap-1.5 font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground"
                        >
                            Kategori <SortIcon direction={column.getIsSorted()} />
                        </button>
                    ),
                    cell: ({ row }) => {
                        const cat = row.original;
                        return (
                            <div className="flex items-center gap-3 py-1">
                                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                    <CatalogIcon name={cat.icon} className="size-5" />
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-foreground">{cat.name}</span>
                                        <span className="text-[11px] font-mono text-muted-foreground">
                                            /{cat.slug}
                                        </span>
                                    </div>
                                    {cat.description && (
                                        <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                                            {cat.description}
                                        </p>
                                    )}
                                </div>
                            </div>
                        );
                    },
                }),
                categoryColumnHelper.accessor('is_active', {
                    header: ({ column }) => (
                        <button
                            type="button"
                            onClick={() => column.toggleSorting()}
                            className="inline-flex items-center gap-1.5 font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground"
                        >
                            Status <SortIcon direction={column.getIsSorted()} />
                        </button>
                    ),
                    cell: ({ row }) => {
                        const active = row.original.is_active;
                        return active ? (
                            <Badge
                                variant="outline"
                                className="gap-1 border-emerald-500/20 bg-emerald-500/10 font-semibold text-emerald-600 dark:text-emerald-400"
                            >
                                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Aktif
                            </Badge>
                        ) : (
                            <Badge
                                variant="outline"
                                className="border-zinc-500/20 bg-zinc-500/10 font-semibold text-zinc-500"
                            >
                                Nonaktif
                            </Badge>
                        );
                    },
                }),
                categoryColumnHelper.accessor((row) => row.lapangans_count ?? 0, {
                    id: 'lapangans_count',
                    header: ({ column }) => (
                        <button
                            type="button"
                            onClick={() => column.toggleSorting()}
                            className="inline-flex items-center gap-1.5 font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground"
                        >
                            Lapangan Terkait <SortIcon direction={column.getIsSorted()} />
                        </button>
                    ),
                    cell: ({ row }) => (
                        <Badge variant="outline" className="gap-1.5 text-xs">
                            <LayoutGrid className="size-3 text-muted-foreground" />
                            <span className="font-semibold">{row.original.lapangans_count ?? 0}</span> Lapangan
                        </Badge>
                    ),
                }),
                categoryColumnHelper.display({
                    id: 'actions',
                    header: () => (
                        <span className="font-bold uppercase tracking-wider text-muted-foreground">Aksi</span>
                    ),
                    enableSorting: false,
                    cell: ({ row }) => {
                        const cat = row.original;
                        return (
                            <div className="flex items-center gap-1">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => openCategoryDialog(cat)}
                                    className="size-8 rounded-xl text-muted-foreground hover:text-foreground"
                                    aria-label={`Edit ${cat.name}`}
                                >
                                    <Pencil className="size-4" />
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                        router.post(
                                            toggleCategory.url(cat.id),
                                            {},
                                            { preserveScroll: true },
                                        )
                                    }
                                    className="size-8 rounded-xl text-muted-foreground hover:text-foreground"
                                    aria-label={`${cat.is_active ? 'Nonaktifkan' : 'Aktifkan'} ${cat.name}`}
                                >
                                    {cat.is_active ? (
                                        <ToggleRight className="size-5 text-primary" />
                                    ) : (
                                        <ToggleLeft className="size-5" />
                                    )}
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setDeletingCategory(cat)}
                                    className="size-8 rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive"
                                    aria-label={`Hapus ${cat.name}`}
                                >
                                    <Trash2 className="size-4" />
                                </Button>
                            </div>
                        );
                    },
                }),
            ]),
        [],
    );

    // Facility Table Columns
    const facilityColumns = useMemo(
        () =>
            facilityColumnHelper.columns([
                facilityColumnHelper.display({
                    id: 'select',
                    header: ({ table }) => (
                        <div className="flex items-center justify-center">
                            <Checkbox
                                checked={
                                    table.getIsAllPageRowsSelected()
                                        ? true
                                        : table.getIsSomePageRowsSelected()
                                          ? 'indeterminate'
                                          : false
                                }
                                onCheckedChange={(value) =>
                                    table.toggleAllPageRowsSelected(Boolean(value))
                                }
                                aria-label="Pilih semua fasilitas pada halaman ini"
                            />
                        </div>
                    ),
                    cell: ({ row }) => (
                        <div className="flex items-center justify-center">
                            <Checkbox
                                checked={row.getIsSelected()}
                                onCheckedChange={(value) => row.toggleSelected(Boolean(value))}
                                aria-label={`Pilih fasilitas ${row.original.name}`}
                            />
                        </div>
                    ),
                    enableSorting: false,
                }),
                facilityColumnHelper.accessor('name', {
                    header: ({ column }) => (
                        <button
                            type="button"
                            onClick={() => column.toggleSorting()}
                            className="inline-flex items-center gap-1.5 font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground"
                        >
                            Fasilitas <SortIcon direction={column.getIsSorted()} />
                        </button>
                    ),
                    cell: ({ row }) => {
                        const fac = row.original;
                        return (
                            <div className="flex items-center gap-3 py-1">
                                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                    <CatalogIcon name={fac.icon} className="size-5" />
                                </div>
                                <span className="font-semibold text-foreground">{fac.name}</span>
                            </div>
                        );
                    },
                }),
                facilityColumnHelper.accessor((row) => row.lapangans_count ?? 0, {
                    id: 'lapangans_count',
                    header: ({ column }) => (
                        <button
                            type="button"
                            onClick={() => column.toggleSorting()}
                            className="inline-flex items-center gap-1.5 font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground"
                        >
                            Lapangan Terkait <SortIcon direction={column.getIsSorted()} />
                        </button>
                    ),
                    cell: ({ row }) => (
                        <Badge variant="outline" className="gap-1.5 text-xs">
                            <LayoutGrid className="size-3 text-muted-foreground" />
                            <span className="font-semibold">{row.original.lapangans_count ?? 0}</span> Lapangan
                        </Badge>
                    ),
                }),
                facilityColumnHelper.display({
                    id: 'actions',
                    header: () => (
                        <span className="font-bold uppercase tracking-wider text-muted-foreground">Aksi</span>
                    ),
                    enableSorting: false,
                    cell: ({ row }) => {
                        const fac = row.original;
                        return (
                            <div className="flex items-center gap-1">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => openFacilityDialog(fac)}
                                    className="size-8 rounded-xl text-muted-foreground hover:text-foreground"
                                    aria-label={`Edit ${fac.name}`}
                                >
                                    <Pencil className="size-4" />
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setDeletingFacility(fac)}
                                    className="size-8 rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive"
                                    aria-label={`Hapus ${fac.name}`}
                                >
                                    <Trash2 className="size-4" />
                                </Button>
                            </div>
                        );
                    },
                }),
            ]),
        [],
    );

    // Initialize TanStack Table instances
    const categoryTable = useTable({
        features: tableConfig,
        data: filteredCategories,
        columns: categoryColumns,
        state: {
            sorting: categorySorting,
            rowSelection: categoryRowSelection,
            pagination: categoryPagination,
        },
        onSortingChange: setCategorySorting,
        onRowSelectionChange: setCategoryRowSelection,
        onPaginationChange: setCategoryPagination,
        getRowId: (row) => row.id,
        enableRowSelection: true,
    });

    const facilityTable = useTable({
        features: tableConfig,
        data: filteredFacilities,
        columns: facilityColumns,
        state: {
            sorting: facilitySorting,
            rowSelection: facilityRowSelection,
            pagination: facilityPagination,
        },
        onSortingChange: setFacilitySorting,
        onRowSelectionChange: setFacilityRowSelection,
        onPaginationChange: setFacilityPagination,
        getRowId: (row) => row.id,
        enableRowSelection: true,
    });

    // Dialog handlers
    const openCategoryDialog = (category?: CategoryItem) => {
        setEditingCategory(category ?? null);
        categoryForm.clearErrors();
        categoryForm.setData({
            name: category?.name ?? '',
            icon: category?.icon ?? '',
            description: category?.description ?? '',
        });
        setCategoryDialogOpen(true);
    };

    const openFacilityDialog = (facility?: FacilityItem) => {
        setEditingFacility(facility ?? null);
        facilityForm.clearErrors();
        facilityForm.setData({
            name: facility?.name ?? '',
            icon: facility?.icon ?? '',
        });
        setFacilityDialogOpen(true);
    };

    const submitCategory = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const options = {
            preserveScroll: true,
            onSuccess: () => setCategoryDialogOpen(false),
        };

        if (editingCategory) {
            categoryForm.put(updateCategory.url(editingCategory.id), options);
            return;
        }

        categoryForm.post(storeCategory.url(), options);
    };

    const submitFacility = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const options = {
            preserveScroll: true,
            onSuccess: () => setFacilityDialogOpen(false),
        };

        if (editingFacility) {
            facilityForm.put(updateFacility.url(editingFacility.id), options);
            return;
        }

        facilityForm.post(storeFacility.url(), options);
    };

    // Single item delete handlers
    const handleDeleteSingleCategory = () => {
        if (!deletingCategory) return;
        router.delete(destroyCategory.url(deletingCategory.id), {
            preserveScroll: true,
            onSuccess: () => setDeletingCategory(null),
        });
    };

    const handleDeleteSingleFacility = () => {
        if (!deletingFacility) return;
        router.delete(destroyFacility.url(deletingFacility.id), {
            preserveScroll: true,
            onSuccess: () => setDeletingFacility(null),
        });
    };

    // Bulk delete handlers
    const handleBulkDeleteCategories = () => {
        if (selectedCategoryIds.length === 0) return;
        router.delete(bulkDestroyCategory.url(), {
            data: { ids: selectedCategoryIds },
            preserveScroll: true,
            onSuccess: () => {
                setCategoryRowSelection({});
                setBulkDeletingCategory(false);
            },
        });
    };

    const handleBulkDeleteFacilities = () => {
        if (selectedFacilityIds.length === 0) return;
        router.delete(bulkDestroyFacility.url(), {
            data: { ids: selectedFacilityIds },
            preserveScroll: true,
            onSuccess: () => {
                setFacilityRowSelection({});
                setBulkDeletingFacility(false);
            },
        });
    };

    // Summary calculations
    const activeCategoriesCount = useMemo(
        () => categories.filter((c) => c.is_active).length,
        [categories],
    );
    const totalLinkedLapangans = useMemo(
        () => categories.reduce((sum, c) => sum + (c.lapangans_count ?? 0), 0),
        [categories],
    );

    const breadcrumbs = [
        { title: 'Superadmin Workspace', href: '/admin' },
        { title: 'Kategori & Fasilitas', href: '/admin/catalog' },
    ];

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Kategori & Fasilitas Lapangan" />

            <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
                {/* Header Section */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
                            Kategori & Fasilitas
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Kelola kategori olahraga dan fasilitas lapangan dalam format tabel data yang interaktif.
                        </p>
                    </div>
                    <Button
                        onClick={() =>
                            activeTab === 'categories' ? openCategoryDialog() : openFacilityDialog()
                        }
                        className="gap-2 rounded-xl"
                    >
                        <Plus className="size-4" />
                        Tambah {activeTab === 'categories' ? 'Kategori' : 'Fasilitas'}
                    </Button>
                </div>

                {/* Stats Overview Cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                <Layers className="size-5" />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-muted-foreground">Total Kategori</p>
                                <div className="flex items-baseline gap-2">
                                    <p className="text-2xl font-black text-foreground">{categories.length}</p>
                                    <span className="text-xs text-muted-foreground">
                                        ({activeCategoriesCount} aktif)
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                <Sparkles className="size-5" />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-muted-foreground">Total Fasilitas</p>
                                <p className="text-2xl font-black text-foreground">{facilities.length}</p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                <LayoutGrid className="size-5" />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-muted-foreground">Lapangan Terdaftar</p>
                                <p className="text-2xl font-black text-foreground">{totalLinkedLapangans}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tab Switcher & Toolbar */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="inline-flex w-fit rounded-xl border border-border/80 bg-card p-1 shadow-sm">
                        <button
                            type="button"
                            onClick={() => {
                                setActiveTab('categories');
                                setCategoryRowSelection({});
                            }}
                            aria-pressed={activeTab === 'categories'}
                            className={cn(
                                'flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-colors',
                                activeTab === 'categories'
                                    ? 'bg-primary text-primary-foreground shadow-xs'
                                    : 'text-muted-foreground hover:text-foreground',
                            )}
                        >
                            <Layers className="size-3.5" />
                            Kategori Olahraga
                            <span
                                className={cn(
                                    'rounded-md px-1.5 py-0.5 text-[10px] font-semibold',
                                    activeTab === 'categories'
                                        ? 'bg-primary-foreground/20 text-primary-foreground'
                                        : 'bg-muted text-muted-foreground',
                                )}
                            >
                                {categories.length}
                            </span>
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setActiveTab('facilities');
                                setFacilityRowSelection({});
                            }}
                            aria-pressed={activeTab === 'facilities'}
                            className={cn(
                                'flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-colors',
                                activeTab === 'facilities'
                                    ? 'bg-primary text-primary-foreground shadow-xs'
                                    : 'text-muted-foreground hover:text-foreground',
                            )}
                        >
                            <Sparkles className="size-3.5" />
                            Fasilitas
                            <span
                                className={cn(
                                    'rounded-md px-1.5 py-0.5 text-[10px] font-semibold',
                                    activeTab === 'facilities'
                                        ? 'bg-primary-foreground/20 text-primary-foreground'
                                        : 'bg-muted text-muted-foreground',
                                )}
                            >
                                {facilities.length}
                            </span>
                        </button>
                    </div>

                    {/* Search box for active tab */}
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        <Input
                            type="text"
                            value={activeTab === 'categories' ? categorySearch : facilitySearch}
                            onChange={(e) => {
                                if (activeTab === 'categories') {
                                    setCategorySearch(e.target.value);
                                    categoryTable.setPageIndex(0);
                                } else {
                                    setFacilitySearch(e.target.value);
                                    facilityTable.setPageIndex(0);
                                }
                            }}
                            placeholder={
                                activeTab === 'categories'
                                    ? 'Cari nama atau slug kategori...'
                                    : 'Cari nama fasilitas...'
                            }
                            className="h-9 rounded-xl pl-9 pr-8 text-xs"
                        />
                        {(activeTab === 'categories' ? categorySearch : facilitySearch) && (
                            <button
                                type="button"
                                onClick={() => {
                                    if (activeTab === 'categories') {
                                        setCategorySearch('');
                                        categoryTable.setPageIndex(0);
                                    } else {
                                        setFacilitySearch('');
                                        facilityTable.setPageIndex(0);
                                    }
                                }}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                                <X className="size-3.5" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Multiselect Floating Bar: Kategori */}
                {activeTab === 'categories' && selectedCategoryIds.length > 0 && (
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-3.5 sm:px-4">
                        <div className="flex items-center gap-2">
                            <span className="flex size-6 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
                                {selectedCategoryIds.length}
                            </span>
                            <span className="text-xs font-semibold text-foreground">
                                kategori dipilih
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setCategoryRowSelection({})}
                                className="h-8 rounded-xl text-xs"
                            >
                                Batal Pilihan
                            </Button>
                            <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => setBulkDeletingCategory(true)}
                                className="h-8 gap-1.5 rounded-xl text-xs font-semibold"
                            >
                                <Trash2 className="size-3.5" />
                                Hapus Terpilih ({selectedCategoryIds.length})
                            </Button>
                        </div>
                    </div>
                )}

                {/* Multiselect Floating Bar: Fasilitas */}
                {activeTab === 'facilities' && selectedFacilityIds.length > 0 && (
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-3.5 sm:px-4">
                        <div className="flex items-center gap-2">
                            <span className="flex size-6 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
                                {selectedFacilityIds.length}
                            </span>
                            <span className="text-xs font-semibold text-foreground">
                                fasilitas dipilih
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setFacilityRowSelection({})}
                                className="h-8 rounded-xl text-xs"
                            >
                                Batal Pilihan
                            </Button>
                            <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => setBulkDeletingFacility(true)}
                                className="h-8 gap-1.5 rounded-xl text-xs font-semibold"
                            >
                                <Trash2 className="size-3.5" />
                                Hapus Terpilih ({selectedFacilityIds.length})
                            </Button>
                        </div>
                    </div>
                )}

                {/* Table Section: Kategori */}
                {activeTab === 'categories' && (
                    <div className="space-y-4">
                        <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="border-b border-border/60 bg-muted/50 text-muted-foreground uppercase tracking-wider">
                                        {categoryTable.getHeaderGroups().map((headerGroup) => (
                                            <tr key={headerGroup.id}>
                                                {headerGroup.headers.map((header) => (
                                                    <th key={header.id} className="px-4 py-3 font-semibold">
                                                        {header.isPlaceholder ? null : (
                                                            <categoryTable.FlexRender header={header} />
                                                        )}
                                                    </th>
                                                ))}
                                            </tr>
                                        ))}
                                    </thead>
                                    <tbody className="divide-y divide-border/40">
                                        {categoryTable.getRowModel().rows.length === 0 ? (
                                            <tr>
                                                <td
                                                    colSpan={categoryColumns.length}
                                                    className="py-12 text-center text-muted-foreground"
                                                >
                                                    {categorySearch
                                                        ? 'Tidak ada kategori yang cocok dengan pencarian.'
                                                        : 'Belum ada data kategori olahraga.'}
                                                </td>
                                            </tr>
                                        ) : (
                                            categoryTable.getRowModel().rows.map((row) => (
                                                <tr
                                                    key={row.id}
                                                    className={cn(
                                                        'transition-colors hover:bg-muted/30',
                                                        row.getIsSelected() && 'bg-primary/5',
                                                    )}
                                                >
                                                    {row.getAllCells().map((cell) => (
                                                        <td key={cell.id} className="px-4 py-3.5">
                                                            <categoryTable.FlexRender cell={cell} />
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Pagination for Categories */}
                        {filteredCategories.length > 0 && (
                            <Pagination
                                from={
                                    categoryPagination.pageIndex * categoryPagination.pageSize + 1
                                }
                                to={Math.min(
                                    (categoryPagination.pageIndex + 1) * categoryPagination.pageSize,
                                    filteredCategories.length,
                                )}
                                total={filteredCategories.length}
                                lastPage={categoryTable.getPageCount()}
                                perPage={categoryPagination.pageSize}
                                links={generatePaginationLinks(
                                    categoryTable.getPageCount(),
                                    categoryPagination.pageIndex + 1,
                                )}
                                onPageChange={(page) => categoryTable.setPageIndex(page - 1)}
                                onPerPageChange={(size) => {
                                    categoryTable.setPageSize(size);
                                    categoryTable.setPageIndex(0);
                                }}
                            />
                        )}
                    </div>
                )}

                {/* Table Section: Fasilitas */}
                {activeTab === 'facilities' && (
                    <div className="space-y-4">
                        <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="border-b border-border/60 bg-muted/50 text-muted-foreground uppercase tracking-wider">
                                        {facilityTable.getHeaderGroups().map((headerGroup) => (
                                            <tr key={headerGroup.id}>
                                                {headerGroup.headers.map((header) => (
                                                    <th key={header.id} className="px-4 py-3 font-semibold">
                                                        {header.isPlaceholder ? null : (
                                                            <facilityTable.FlexRender header={header} />
                                                        )}
                                                    </th>
                                                ))}
                                            </tr>
                                        ))}
                                    </thead>
                                    <tbody className="divide-y divide-border/40">
                                        {facilityTable.getRowModel().rows.length === 0 ? (
                                            <tr>
                                                <td
                                                    colSpan={facilityColumns.length}
                                                    className="py-12 text-center text-muted-foreground"
                                                >
                                                    {facilitySearch
                                                        ? 'Tidak ada fasilitas yang cocok dengan pencarian.'
                                                        : 'Belum ada data fasilitas.'}
                                                </td>
                                            </tr>
                                        ) : (
                                            facilityTable.getRowModel().rows.map((row) => (
                                                <tr
                                                    key={row.id}
                                                    className={cn(
                                                        'transition-colors hover:bg-muted/30',
                                                        row.getIsSelected() && 'bg-primary/5',
                                                    )}
                                                >
                                                    {row.getAllCells().map((cell) => (
                                                        <td key={cell.id} className="px-4 py-3.5">
                                                            <facilityTable.FlexRender cell={cell} />
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Pagination for Facilities */}
                        {filteredFacilities.length > 0 && (
                            <Pagination
                                from={
                                    facilityPagination.pageIndex * facilityPagination.pageSize + 1
                                }
                                to={Math.min(
                                    (facilityPagination.pageIndex + 1) * facilityPagination.pageSize,
                                    filteredFacilities.length,
                                )}
                                total={filteredFacilities.length}
                                lastPage={facilityTable.getPageCount()}
                                perPage={facilityPagination.pageSize}
                                links={generatePaginationLinks(
                                    facilityTable.getPageCount(),
                                    facilityPagination.pageIndex + 1,
                                )}
                                onPageChange={(page) => facilityTable.setPageIndex(page - 1)}
                                onPerPageChange={(size) => {
                                    facilityTable.setPageSize(size);
                                    facilityTable.setPageIndex(0);
                                }}
                            />
                        )}
                    </div>
                )}
            </div>

            {/* Modal Dialog: Category */}
            <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
                <DialogContent className="max-h-[min(90dvh,40rem)] overflow-y-auto rounded-2xl sm:max-w-lg">
                    <DialogHeader>
                        <div className="flex items-start gap-3">
                            <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                {editingCategory ? <Pencil className="size-5" /> : <Layers className="size-5" />}
                            </div>
                            <div className="flex flex-col gap-1">
                                <DialogTitle>
                                    {editingCategory ? 'Edit Kategori Olahraga' : 'Tambah Kategori Baru'}
                                </DialogTitle>
                                <DialogDescription className="text-xs">
                                    Slug kategori dibuat otomatis dari nama kategori dan tidak berubah saat diedit.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                    <form onSubmit={submitCategory} className="space-y-4 pt-2">
                        <div className="space-y-1.5">
                            <Label htmlFor="category-name" className="text-xs font-semibold">
                                Nama Kategori <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="category-name"
                                value={categoryForm.data.name}
                                onChange={(event) => categoryForm.setData('name', event.target.value)}
                                placeholder="Contoh: Futsal, Badminton, Tennis"
                                className="rounded-xl"
                                required
                                maxLength={255}
                            />
                            {categoryForm.errors.name && (
                                <p className="text-xs text-destructive">{categoryForm.errors.name}</p>
                            )}
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="category-icon" className="text-xs font-semibold">
                                Ikon Kategori
                            </Label>
                            <Select
                                value={getCatalogIconName(categoryForm.data.icon)}
                                onValueChange={(value) => categoryForm.setData('icon', value)}
                            >
                                <SelectTrigger id="category-icon" className="h-10 rounded-xl">
                                    <SelectValue placeholder="Pilih ikon kategori" />
                                </SelectTrigger>
                                <SelectContent>
                                    {catalogIconOptions.map(({ name, label, icon: Icon }) => (
                                        <SelectItem key={name} value={name}>
                                            <span className="flex items-center gap-2">
                                                <Icon className="size-4" aria-hidden="true" />
                                                {label}
                                            </span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {categoryForm.errors.icon && (
                                <p className="text-xs text-destructive">{categoryForm.errors.icon}</p>
                            )}
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="category-description" className="text-xs font-semibold">
                                Deskripsi (Opsional)
                            </Label>
                            <Textarea
                                id="category-description"
                                value={categoryForm.data.description}
                                onChange={(event) =>
                                    categoryForm.setData('description', event.target.value)
                                }
                                placeholder="Keterangan singkat mengenai kategori olahraga ini..."
                                rows={3}
                                className="resize-none rounded-xl text-xs"
                                maxLength={2000}
                            />
                            {categoryForm.errors.description && (
                                <p className="text-xs text-destructive">{categoryForm.errors.description}</p>
                            )}
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setCategoryDialogOpen(false)}
                                className="rounded-xl"
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                disabled={categoryForm.processing}
                                className="rounded-xl font-bold"
                            >
                                {categoryForm.processing
                                    ? 'Menyimpan…'
                                    : editingCategory
                                      ? 'Simpan Perubahan'
                                      : 'Tambah Kategori'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal Dialog: Facility */}
            <Dialog open={facilityDialogOpen} onOpenChange={setFacilityDialogOpen}>
                <DialogContent className="rounded-2xl sm:max-w-lg">
                    <DialogHeader>
                        <div className="flex items-start gap-3">
                            <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                {editingFacility ? (
                                    <Pencil className="size-5" />
                                ) : (
                                    <CatalogIcon name={facilityForm.data.icon} className="size-5" />
                                )}
                            </div>
                            <div className="flex flex-col gap-1">
                                <DialogTitle>
                                    {editingFacility ? 'Edit Fasilitas' : 'Tambah Fasilitas Baru'}
                                </DialogTitle>
                                <DialogDescription className="text-xs">
                                    Fasilitas yang dibuat dapat dipilih untuk setiap lapangan.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                    <form onSubmit={submitFacility} className="space-y-4 pt-2">
                        <div className="space-y-1.5">
                            <Label htmlFor="facility-name" className="text-xs font-semibold">
                                Nama Fasilitas <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="facility-name"
                                value={facilityForm.data.name}
                                onChange={(event) => facilityForm.setData('name', event.target.value)}
                                placeholder="Contoh: WiFi Cepat, Kamar Mandi, Loker"
                                className="rounded-xl"
                                required
                                maxLength={255}
                            />
                            {facilityForm.errors.name && (
                                <p className="text-xs text-destructive">{facilityForm.errors.name}</p>
                            )}
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="facility-icon" className="text-xs font-semibold">
                                Ikon Fasilitas
                            </Label>
                            <Select
                                value={getCatalogIconName(facilityForm.data.icon)}
                                onValueChange={(value) => facilityForm.setData('icon', value)}
                            >
                                <SelectTrigger id="facility-icon" className="h-10 rounded-xl">
                                    <SelectValue placeholder="Pilih ikon fasilitas" />
                                </SelectTrigger>
                                <SelectContent>
                                    {catalogIconOptions.map(({ name, label, icon: Icon }) => (
                                        <SelectItem key={name} value={name}>
                                            <span className="flex items-center gap-2">
                                                <Icon className="size-4" aria-hidden="true" />
                                                {label}
                                            </span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {facilityForm.errors.icon && (
                                <p className="text-xs text-destructive">{facilityForm.errors.icon}</p>
                            )}
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setFacilityDialogOpen(false)}
                                className="rounded-xl"
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                disabled={facilityForm.processing}
                                className="rounded-xl font-bold"
                            >
                                {facilityForm.processing
                                    ? 'Menyimpan…'
                                    : editingFacility
                                      ? 'Simpan Perubahan'
                                      : 'Tambah Fasilitas'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Confirm Dialog: Single Category Delete */}
            <ConfirmDialog
                open={Boolean(deletingCategory)}
                onOpenChange={(open) => !open && setDeletingCategory(null)}
                title="Hapus Kategori Olahraga?"
                description={
                    deletingCategory?.lapangans_count && deletingCategory.lapangans_count > 0
                        ? `PERINGATAN: Kategori "${deletingCategory.name}" masih terhubung dengan ${deletingCategory.lapangans_count} lapangan. Sistem tidak akan menghapus kategori yang masih memiliki lapangan aktif.`
                        : `Apakah Anda yakin ingin menghapus kategori "${deletingCategory?.name}"? Tindakan ini tidak dapat dibatalkan.`
                }
                confirmLabel="Ya, Hapus Kategori"
                confirmDisabled={Boolean(
                    deletingCategory?.lapangans_count && deletingCategory.lapangans_count > 0,
                )}
                cancelLabel="Batal"
                variant="destructive"
                icon={Trash2}
                onConfirm={handleDeleteSingleCategory}
            />

            {/* Confirm Dialog: Bulk Category Delete */}
            <ConfirmDialog
                open={bulkDeletingCategory}
                onOpenChange={setBulkDeletingCategory}
                title="Hapus Kategori Terpilih?"
                description={`Apakah Anda yakin ingin menghapus ${selectedCategoryIds.length} kategori yang dipilih? Kategori yang masih terhubung dengan data lapangan akan dilewati secara otomatis untuk menjaga integritas data.`}
                confirmLabel={`Ya, Hapus (${selectedCategoryIds.length}) Kategori`}
                cancelLabel="Batal"
                variant="destructive"
                icon={Trash2}
                onConfirm={handleBulkDeleteCategories}
            />

            {/* Confirm Dialog: Single Facility Delete */}
            <ConfirmDialog
                open={Boolean(deletingFacility)}
                onOpenChange={(open) => !open && setDeletingFacility(null)}
                title="Hapus Fasilitas?"
                description={`Apakah Anda yakin ingin menghapus fasilitas "${deletingFacility?.name}"? Fasilitas ini akan dilepaskan dari lapangan yang terhubung.`}
                confirmLabel="Ya, Hapus Fasilitas"
                cancelLabel="Batal"
                variant="destructive"
                icon={Trash2}
                onConfirm={handleDeleteSingleFacility}
            />

            {/* Confirm Dialog: Bulk Facility Delete */}
            <ConfirmDialog
                open={bulkDeletingFacility}
                onOpenChange={setBulkDeletingFacility}
                title="Hapus Fasilitas Terpilih?"
                description={`Apakah Anda yakin ingin menghapus ${selectedFacilityIds.length} fasilitas yang dipilih? Seluruh fasilitas terpilih akan dilepaskan dari lapangan terkait.`}
                confirmLabel={`Ya, Hapus (${selectedFacilityIds.length}) Fasilitas`}
                cancelLabel="Batal"
                variant="destructive"
                icon={Trash2}
                onConfirm={handleBulkDeleteFacilities}
            />
        </AdminLayout>
    );
}
