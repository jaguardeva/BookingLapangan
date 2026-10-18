import { Head, router, useForm } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import {
    AlertCircle,
    Calendar,
    CheckCircle2,
    Clock,
    Edit2,
    ExternalLink,
    Eye,
    EyeOff,
    Image as ImageIcon,
    Layers,
    Link as LinkIcon,
    Plus,
    Search,
    Trash2,
    Upload,
    X,
} from 'lucide-react';
import AdminLayout from '@/layouts/admin-layout';
import ConfirmDialog from '@/components/confirm-dialog';
import { Pagination } from '@/components/pagination';
import { ResetFilterButton } from '@/components/reset-filter-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
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
import bannerRoutes, {
    destroy,
    store,
    toggle,
    update,
} from '@/actions/App/Http/Controllers/Admin/BannerManagementController';

type Banner = {
    id: string;
    title: string;
    body: string | null;
    image_path: string;
    image_url: string;
    alt_text: string | null;
    link_url: string | null;
    placement: string;
    sort_order: number;
    is_active: boolean;
    starts_at: string | null;
    ends_at: string | null;
    created_at: string;
    updated_at: string;
};

type PaginatedBanners = {
    data: Banner[];
    links: Array<{
        url: string | null;
        label: string;
        active: boolean;
    }>;
    from: number | null;
    to: number | null;
    total: number;
    last_page: number;
    per_page: number;
    current_page: number;
};

type Stats = {
    total: number;
    active: number;
    inactive: number;
};

type Filters = {
    search: string;
    status: string;
};

type Props = {
    banners: PaginatedBanners;
    filters: Filters;
    stats: Stats;
};

type BannerFormData = {
    title: string;
    body: string;
    image: File | null;
    image_url: string;
    alt_text: string;
    link_url: string;
    placement: string;
    sort_order: number;
    is_active: boolean;
    starts_at: string;
    ends_at: string;
};

function emptyForm(): BannerFormData {
    return {
        title: '',
        body: '',
        image: null,
        image_url: '',
        alt_text: '',
        link_url: '',
        placement: 'home',
        sort_order: 0,
        is_active: true,
        starts_at: '',
        ends_at: '',
    };
}

function toDatetimeLocal(val: string | null | undefined): string {
    if (!val) return '';
    try {
        const d = new Date(val);
        if (isNaN(d.getTime())) return '';
        const pad = (n: number) => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch {
        return '';
    }
}

function formatBannerSchedule(startsAt: string | null, endsAt: string | null): string {
    if (!startsAt && !endsAt) return 'Selalu Tayang';
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
    if (startsAt && endsAt) {
        return `${new Date(startsAt).toLocaleDateString('id-ID', options)} - ${new Date(endsAt).toLocaleDateString('id-ID', options)}`;
    }
    if (startsAt) {
        return `Mulai ${new Date(startsAt).toLocaleDateString('id-ID', options)}`;
    }
    return `Sampai ${new Date(endsAt!).toLocaleDateString('id-ID', options)}`;
}

function FieldError({ message }: { message?: string }) {
    return message ? (
        <p className="flex items-center gap-1 text-xs text-destructive">
            <AlertCircle className="size-3 shrink-0" />
            {message}
        </p>
    ) : null;
}

export default function BannersIndex({ banners, filters, stats }: Props) {
    const form = useForm<BannerFormData>(emptyForm());
    const [search, setSearch] = useState(filters.search ?? '');
    const [status, setStatus] = useState(filters.status ?? 'all');
    const [isFiltering, setIsFiltering] = useState(false);
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<Banner | null>(null);
    const [deleting, setDeleting] = useState<Banner | null>(null);

    // Image source mode: 'upload' or 'url'
    const [imageSource, setImageSource] = useState<'upload' | 'url'>('upload');
    const [filePreview, setFilePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    // Search filter debounce
    const filterKey = JSON.stringify([search, status]);
    const initialFilterKey = useRef(filterKey);

    useEffect(() => {
        if (initialFilterKey.current === filterKey) {
            initialFilterKey.current = '';
            return;
        }

        const timeoutId = window.setTimeout(() => {
            setIsFiltering(true);
            router.get(
                bannerRoutes.index.url({
                    query: {
                        search: search.trim() || undefined,
                        status: status === 'all' ? undefined : status,
                        page: 1,
                    },
                }),
                {},
                {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                    onFinish: () => setIsFiltering(false),
                },
            );
        }, 300);

        return () => window.clearTimeout(timeoutId);
    }, [filterKey, search, status]);

    const resetFilters = () => {
        setSearch('');
        setStatus('all');
    };

    const hasActiveFilters = Boolean(search.trim() || status !== 'all');

    const openCreate = () => {
        setEditing(null);
        setFilePreview(null);
        setImageSource('upload');
        form.setData(emptyForm());
        form.clearErrors();
        setFormOpen(true);
    };

    const openEdit = (banner: Banner) => {
        setEditing(banner);
        setFilePreview(null);
        const isExternal = str_is_url(banner.image_path);
        setImageSource(isExternal ? 'url' : 'upload');

        form.setData({
            title: banner.title,
            body: banner.body ?? '',
            image: null,
            image_url: isExternal ? banner.image_path : '',
            alt_text: banner.alt_text ?? '',
            link_url: banner.link_url ?? '',
            placement: banner.placement || 'home',
            sort_order: banner.sort_order ?? 0,
            is_active: banner.is_active,
            starts_at: toDatetimeLocal(banner.starts_at),
            ends_at: toDatetimeLocal(banner.ends_at),
        });
        form.clearErrors();
        setFormOpen(true);
    };

    function str_is_url(path: string): boolean {
        return path.startsWith('http://') || path.startsWith('https://');
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        form.setData('image', file);
        if (file) {
            const url = URL.createObjectURL(file);
            setFilePreview(url);
        } else {
            setFilePreview(null);
        }
    };

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();

        const options = {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                setFormOpen(false);
                setFilePreview(null);
                form.reset();
            },
        };

        if (editing) {
            form.transform((data) => ({
                ...data,
                _method: 'put',
                // Clear the opposite field depending on selected mode if new input given
                image: imageSource === 'upload' ? data.image : null,
                image_url: imageSource === 'url' ? data.image_url : '',
            }));
            form.post(update.url(editing.id), options);
            return;
        }

        form.transform((data) => ({
            ...data,
            image: imageSource === 'upload' ? data.image : null,
            image_url: imageSource === 'url' ? data.image_url : '',
        }));
        form.post(store.url(), options);
    };

    const handleToggle = (banner: Banner) => {
        router.post(
            toggle.url(banner.id),
            {},
            {
                preserveScroll: true,
            },
        );
    };

    const handleDelete = () => {
        if (!deleting) return;
        router.delete(destroy.url(deleting.id), {
            preserveScroll: true,
            onSuccess: () => setDeleting(null),
        });
    };

    return (
        <AdminLayout breadcrumbs={[{ title: 'Banner Promosi', href: bannerRoutes.index.url() }]}>
            <Head title="Banner Promosi" />

            <div className="space-y-6 p-4 sm:p-6">
                {/* Header Section */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
                            Banner Promosi
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Kelola banner promosi dan sponsor yang tampil di halaman publik aplikasi.
                        </p>
                    </div>
                    <Button onClick={openCreate} className="w-full gap-2 rounded-xl sm:w-auto">
                        <Plus className="size-4" />
                        Tambah Banner
                    </Button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                <Layers className="size-5" />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-muted-foreground">Total Banner</p>
                                <p className="text-2xl font-black text-foreground">{stats.total}</p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="size-5" />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-muted-foreground">Banner Aktif</p>
                                <p className="text-2xl font-black text-foreground">{stats.active}</p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-zinc-500/10 text-zinc-600 dark:text-zinc-400">
                                <EyeOff className="size-5" />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-muted-foreground">Banner Nonaktif</p>
                                <p className="text-2xl font-black text-foreground">{stats.inactive}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Search & Filter Toolbar */}
                <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari berdasarkan judul, pesan promo, atau link..."
                                className="h-10 rounded-xl pl-9 pr-8"
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={() => setSearch('')}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    <X className="size-4" />
                                </button>
                            )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger className="h-10 w-full rounded-xl sm:w-40">
                                    <SelectValue placeholder="Status Banner" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Status</SelectItem>
                                    <SelectItem value="active">Aktif Saja</SelectItem>
                                    <SelectItem value="inactive">Nonaktif Saja</SelectItem>
                                </SelectContent>
                            </Select>

                            {hasActiveFilters && (
                                <ResetFilterButton
                                    onClick={resetFilters}
                                    disabled={isFiltering}
                                    className="h-10 rounded-xl text-xs"
                                />
                            )}
                            {isFiltering && (
                                <span className="text-xs text-muted-foreground animate-pulse">
                                    Memuat...
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Banner Grid */}
                {banners.data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-card/50 p-12 text-center">
                        <div className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                            <ImageIcon className="size-7" />
                        </div>
                        <h3 className="mt-4 text-base font-bold text-foreground">
                            {hasActiveFilters ? 'Tidak ada banner yang cocok' : 'Belum ada banner promosi'}
                        </h3>
                        <p className="mt-1.5 max-w-sm text-xs text-muted-foreground">
                            {hasActiveFilters
                                ? 'Coba ubah kata kunci pencarian atau bersihkan filter status untuk melihat banner lainnya.'
                                : 'Buat banner promosi pertama untuk menampilkan sponsor, informasi diskon, atau event olahraga di halaman publik.'}
                        </p>
                        {hasActiveFilters ? (
                            <Button variant="outline" size="sm" onClick={resetFilters} className="mt-4 rounded-xl">
                                Reset Filter
                            </Button>
                        ) : (
                            <Button onClick={openCreate} size="sm" className="mt-4 gap-2 rounded-xl">
                                <Plus className="size-4" />
                                Tambah Banner
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                        {banners.data.map((banner) => (
                            <div
                                key={banner.id}
                                className="group flex flex-col overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm transition hover:shadow-md"
                            >
                                {/* Banner Image Box */}
                                <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
                                    <img
                                        src={banner.image_url}
                                        alt={banner.alt_text || banner.title}
                                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                        onError={(e) => {
                                            // Fallback placeholder on broken image
                                            (e.target as HTMLImageElement).src =
                                                'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 400 225" fill="%23eee"><rect width="400" height="225" fill="%2327272a"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%2371717a" font-size="14" font-family="sans-serif">Gambar Tidak Tersedia</text></svg>';
                                        }}
                                    />

                                    {/* Overlay status badge */}
                                    <div className="absolute left-3 top-3">
                                        {banner.is_active ? (
                                            <Badge
                                                variant="outline"
                                                className="gap-1 border-emerald-500/20 bg-emerald-500/90 text-white backdrop-blur-md"
                                            >
                                                <span className="size-1.5 rounded-full bg-white animate-pulse" />
                                                Aktif
                                            </Badge>
                                        ) : (
                                            <Badge
                                                variant="outline"
                                                className="border-zinc-500/20 bg-zinc-900/80 text-zinc-300 backdrop-blur-md"
                                            >
                                                Nonaktif
                                            </Badge>
                                        )}
                                    </div>

                                    {/* Overlay sort order */}
                                    <div className="absolute right-3 top-3">
                                        <span className="rounded-lg bg-black/70 px-2 py-0.5 text-xs font-semibold text-white backdrop-blur-md">
                                            Urutan #{banner.sort_order}
                                        </span>
                                    </div>
                                </div>

                                {/* Banner Body */}
                                <div className="flex flex-1 flex-col justify-between p-4 sm:p-5">
                                    <div className="space-y-2.5">
                                        <div>
                                            <h3 className="line-clamp-1 text-base font-bold text-foreground">
                                                {banner.title}
                                            </h3>
                                            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                                                {banner.body || (
                                                    <span className="italic text-muted-foreground/60">
                                                        Tidak ada deskripsi tambahan
                                                    </span>
                                                )}
                                            </p>
                                        </div>

                                        {/* Metadata details */}
                                        <div className="space-y-1.5 pt-1 text-xs">
                                            {/* Schedule */}
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Calendar className="size-3.5 shrink-0 text-primary" />
                                                <span className="truncate">
                                                    {formatBannerSchedule(banner.starts_at, banner.ends_at)}
                                                </span>
                                            </div>

                                            {/* Target URL */}
                                            {banner.link_url ? (
                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                    <ExternalLink className="size-3.5 shrink-0 text-primary" />
                                                    <a
                                                        href={banner.link_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="truncate text-primary hover:underline"
                                                    >
                                                        {banner.link_url}
                                                    </a>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 text-muted-foreground/60">
                                                    <ExternalLink className="size-3.5 shrink-0" />
                                                    <span className="italic">Tanpa tautan sponsor</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Card Footer Actions */}
                                    <div className="mt-4 flex items-center justify-between border-t border-border/70 pt-3">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleToggle(banner)}
                                            className={cn(
                                                'h-8 gap-1.5 rounded-xl text-xs',
                                                banner.is_active
                                                    ? 'text-zinc-600 hover:text-foreground dark:text-zinc-400'
                                                    : 'text-emerald-600 hover:text-emerald-700 dark:text-emerald-400',
                                            )}
                                        >
                                            {banner.is_active ? (
                                                <>
                                                    <EyeOff className="size-3.5" />
                                                    Nonaktifkan
                                                </>
                                            ) : (
                                                <>
                                                    <Eye className="size-3.5" />
                                                    Aktifkan
                                                </>
                                            )}
                                        </Button>

                                        <div className="flex items-center gap-1">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => openEdit(banner)}
                                                className="h-8 gap-1.5 rounded-xl text-xs"
                                            >
                                                <Edit2 className="size-3.5" />
                                                Edit
                                            </Button>

                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setDeleting(banner)}
                                                className="size-8 rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive"
                                            >
                                                <Trash2 className="size-4" />
                                                <span className="sr-only">Hapus banner</span>
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {banners.total > banners.per_page && (
                    <div className="pt-2">
                        <Pagination
                            links={banners.links}
                            from={banners.from}
                            to={banners.to}
                            total={banners.total}
                            lastPage={banners.last_page}
                            perPage={banners.per_page}
                        />
                    </div>
                )}
            </div>

            {/* Modal Dialog: Tambah / Edit Banner */}
            <Dialog open={formOpen} onOpenChange={setFormOpen}>
                <DialogContent className="max-h-[min(90dvh,45rem)] max-w-xl overflow-y-auto rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold">
                            {editing ? 'Edit Banner Promosi' : 'Tambah Banner Promosi'}
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Isi informasi banner, tentukan sumber gambar lewat upload file atau URL eksternal, dan jadwalkan penayangan.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                        {/* Title */}
                        <div className="space-y-1.5">
                            <Label htmlFor="banner-title" className="text-xs font-semibold">
                                Judul Banner <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="banner-title"
                                value={form.data.title}
                                onChange={(e) => form.setData('title', e.target.value)}
                                placeholder="Contoh: Diskon 20% Ramadhan Cup"
                                className="rounded-xl"
                                required
                            />
                            <FieldError message={form.errors.title} />
                        </div>

                        {/* Image Source Selection */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs font-semibold">
                                    Sumber Gambar <span className="text-destructive">*</span>
                                </Label>
                                <span className="text-[11px] text-muted-foreground">
                                    Rekomendasi rasio 16:9
                                </span>
                            </div>

                            {/* Source Type Toggle */}
                            <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
                                <button
                                    type="button"
                                    onClick={() => setImageSource('upload')}
                                    className={cn(
                                        'flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition-all',
                                        imageSource === 'upload'
                                            ? 'bg-card text-foreground shadow-xs'
                                            : 'text-muted-foreground hover:text-foreground',
                                    )}
                                >
                                    <Upload className="size-3.5" />
                                    Upload File
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setImageSource('url')}
                                    className={cn(
                                        'flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition-all',
                                        imageSource === 'url'
                                            ? 'bg-card text-foreground shadow-xs'
                                            : 'text-muted-foreground hover:text-foreground',
                                    )}
                                >
                                    <LinkIcon className="size-3.5" />
                                    Gunakan URL Gambar
                                </button>
                            </div>

                            {/* Upload Area */}
                            {imageSource === 'upload' ? (
                                <div className="space-y-2">
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className={cn(
                                            'relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-4 text-center transition hover:bg-muted/40',
                                            filePreview || (editing && !str_is_url(editing.image_path))
                                                ? 'border-border'
                                                : 'border-border/80',
                                        )}
                                    >
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp"
                                            onChange={handleFileChange}
                                            className="hidden"
                                        />

                                        {filePreview ? (
                                            <div className="relative aspect-[16/9] w-full max-w-sm overflow-hidden rounded-xl">
                                                <img
                                                    src={filePreview}
                                                    alt="Preview"
                                                    className="h-full w-full object-cover"
                                                />
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition hover:opacity-100">
                                                    <span className="text-xs font-semibold text-white">
                                                        Klik untuk mengganti gambar
                                                    </span>
                                                </div>
                                            </div>
                                        ) : editing && editing.image_url && !str_is_url(editing.image_path) ? (
                                            <div className="relative aspect-[16/9] w-full max-w-sm overflow-hidden rounded-xl">
                                                <img
                                                    src={editing.image_url}
                                                    alt="Current"
                                                    className="h-full w-full object-cover"
                                                />
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition hover:opacity-100">
                                                    <span className="text-xs font-semibold text-white">
                                                        Klik untuk mengganti gambar
                                                    </span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center py-4">
                                                <div className="flex size-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                                                    <Upload className="size-5" />
                                                </div>
                                                <p className="mt-2 text-xs font-semibold text-foreground">
                                                    Pilih file gambar banner
                                                </p>
                                                <p className="text-[11px] text-muted-foreground">
                                                    Format JPG, PNG, atau WebP (Maksimal 5MB)
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                    <FieldError message={form.errors.image} />
                                </div>
                            ) : (
                                /* URL Area */
                                <div className="space-y-2">
                                    <div className="relative">
                                        <LinkIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            type="url"
                                            value={form.data.image_url}
                                            onChange={(e) => form.setData('image_url', e.target.value)}
                                            placeholder="https://example.com/banner-promo.jpg"
                                            className="rounded-xl pl-9"
                                        />
                                    </div>
                                    <p className="text-[11px] text-muted-foreground">
                                        Masukkan link langsung ke gambar (misal: Unsplash, CDN, atau media server).
                                    </p>

                                    {/* URL Preview */}
                                    {form.data.image_url && (
                                        <div className="relative aspect-[16/9] w-full max-w-sm overflow-hidden rounded-xl border border-border bg-muted">
                                            <img
                                                src={form.data.image_url}
                                                alt="Preview URL"
                                                className="h-full w-full object-cover"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src =
                                                        'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 400 225" fill="%23eee"><rect width="400" height="225" fill="%2327272a"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23ef4444" font-size="13" font-family="sans-serif">URL Gambar Tidak Valid / Tidak Dapat Dimuat</text></svg>';
                                                }}
                                            />
                                        </div>
                                    )}
                                    <FieldError message={form.errors.image_url} />
                                </div>
                            )}
                        </div>

                        {/* Description / Body */}
                        <div className="space-y-1.5">
                            <Label htmlFor="banner-body" className="text-xs font-semibold">
                                Deskripsi / Pesan Promo (Opsional)
                            </Label>
                            <Textarea
                                id="banner-body"
                                value={form.data.body}
                                onChange={(e) => form.setData('body', e.target.value)}
                                placeholder="Tuliskan keterangan singkat, syarat & ketentuan diskon, atau info sponsor..."
                                rows={3}
                                className="resize-none rounded-xl text-xs"
                            />
                            <FieldError message={form.errors.body} />
                        </div>

                        {/* Link URL */}
                        <div className="space-y-1.5">
                            <Label htmlFor="banner-link" className="text-xs font-semibold">
                                Link Tujuan / Sponsor (Opsional)
                            </Label>
                            <div className="relative">
                                <ExternalLink className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    id="banner-link"
                                    type="url"
                                    value={form.data.link_url}
                                    onChange={(e) => form.setData('link_url', e.target.value)}
                                    placeholder="https://... atau https://wa.me/..."
                                    className="rounded-xl pl-9"
                                />
                            </div>
                            <FieldError message={form.errors.link_url} />
                        </div>

                        {/* Alt Text & Placement */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="space-y-1.5">
                                <Label htmlFor="banner-alt" className="text-xs font-semibold">
                                    Alt Text (Aksesibilitas / SEO)
                                </Label>
                                <Input
                                    id="banner-alt"
                                    value={form.data.alt_text}
                                    onChange={(e) => form.setData('alt_text', e.target.value)}
                                    placeholder="Deskripsi singkat gambar"
                                    className="rounded-xl"
                                />
                                <FieldError message={form.errors.alt_text} />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="banner-sort" className="text-xs font-semibold">
                                    Urutan Tampil (Sort Order)
                                </Label>
                                <Input
                                    id="banner-sort"
                                    type="number"
                                    min={0}
                                    value={form.data.sort_order}
                                    onChange={(e) => form.setData('sort_order', Number(e.target.value))}
                                    className="rounded-xl"
                                />
                                <FieldError message={form.errors.sort_order} />
                            </div>
                        </div>

                        {/* Schedule (Starts at & Ends at) */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="space-y-1.5">
                                <Label htmlFor="banner-starts" className="text-xs font-semibold">
                                    Jadwal Mulai Tayang (Opsional)
                                </Label>
                                <Input
                                    id="banner-starts"
                                    type="datetime-local"
                                    value={form.data.starts_at}
                                    onChange={(e) => form.setData('starts_at', e.target.value)}
                                    className="rounded-xl text-xs"
                                />
                                <FieldError message={form.errors.starts_at} />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="banner-ends" className="text-xs font-semibold">
                                    Jadwal Berakhir (Opsional)
                                </Label>
                                <Input
                                    id="banner-ends"
                                    type="datetime-local"
                                    value={form.data.ends_at}
                                    onChange={(e) => form.setData('ends_at', e.target.value)}
                                    className="rounded-xl text-xs"
                                />
                                <FieldError message={form.errors.ends_at} />
                            </div>
                        </div>

                        {/* Active Checkbox */}
                        <div className="flex items-center space-x-2 rounded-xl border border-border/80 bg-muted/40 p-3">
                            <Checkbox
                                id="banner-active"
                                checked={form.data.is_active}
                                onCheckedChange={(checked) => form.setData('is_active', Boolean(checked))}
                            />
                            <Label
                                htmlFor="banner-active"
                                className="cursor-pointer text-xs font-medium leading-none text-foreground"
                            >
                                Aktifkan banner sekarang (tampil di halaman publik sesuai jadwal)
                            </Label>
                        </div>

                        {/* Dialog Actions */}
                        <DialogFooter className="gap-2 pt-2 sm:gap-0">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setFormOpen(false)}
                                className="w-full rounded-xl sm:w-auto"
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                disabled={form.processing}
                                className="w-full rounded-xl sm:w-auto"
                            >
                                {form.processing ? 'Menyimpan...' : editing ? 'Simpan Perubahan' : 'Tambah Banner'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Confirm Delete Dialog */}
            <ConfirmDialog
                open={Boolean(deleting)}
                onOpenChange={(open) => !open && setDeleting(null)}
                title="Hapus Banner Promosi?"
                description={`Apakah Anda yakin ingin menghapus banner "${deleting?.title}"? Tindakan ini tidak dapat dibatalkan.`}
                confirmLabel="Ya, Hapus"
                cancelLabel="Batal"
                variant="destructive"
                onConfirm={handleDelete}
            />
        </AdminLayout>
    );
}
