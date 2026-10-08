import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { Layers, Plus, Pencil, ToggleLeft, ToggleRight } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { CatalogIcon, catalogIconOptions, getCatalogIconName } from '@/components/catalog-icon';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    store as storeCategory,
    update as updateCategory,
    toggle as toggleCategory,
} from '@/actions/App/Http/Controllers/Admin/CategoryManagementController';
import {
    store as storeFacility,
    update as updateFacility,
} from '@/actions/App/Http/Controllers/Admin/FacilityManagementController';
import type { Category, Facility } from '@/types/booking';

interface Props {
    categories: Category[];
    facilities: Facility[];
}

type CatalogTab = 'categories' | 'facilities';

export default function CatalogIndex({ categories, facilities }: Props) {
    const [activeTab, setActiveTab] = useState<CatalogTab>('categories');
    const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
    const [facilityDialogOpen, setFacilityDialogOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [editingFacility, setEditingFacility] = useState<Facility | null>(null);
    const categoryForm = useForm({ name: '', icon: '', description: '' });
    const facilityForm = useForm({ name: '', icon: '' });

    const openCategoryDialog = (category?: Category) => {
        setEditingCategory(category ?? null);
        categoryForm.clearErrors();
        categoryForm.setData({
            name: category?.name ?? '',
            icon: category?.icon ?? '',
            description: category?.description ?? '',
        });
        setCategoryDialogOpen(true);
    };

    const openFacilityDialog = (facility?: Facility) => {
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
            onSuccess: () => setFacilityDialogOpen(false),
        };

        if (editingFacility) {
            facilityForm.put(updateFacility.url(editingFacility.id), options);
            return;
        }

        facilityForm.post(storeFacility.url(), options);
    };

    const breadcrumbs = [
        { title: 'Superadmin Workspace', href: '/admin' },
        { title: 'Kategori & Fasilitas', href: '/admin/catalog' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Kategori & Fasilitas" />

            <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                    <div>
                        <p className="text-sm font-semibold text-primary">Katalog Lapangan</p>
                        <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
                            Kategori & Fasilitas
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Atur pilihan yang tampil pada data dan katalog lapangan.
                        </p>
                    </div>
                    <Button
                        onClick={() => activeTab === 'categories' ? openCategoryDialog() : openFacilityDialog()}
                        className="rounded-xl"
                    >
                        <Plus className="size-4" />
                        Tambah {activeTab === 'categories' ? 'Kategori' : 'Fasilitas'}
                    </Button>
                </div>

                <div className="inline-flex w-fit rounded-xl border border-border bg-card p-1">
                    <button
                        type="button"
                        onClick={() => setActiveTab('categories')}
                        aria-pressed={activeTab === 'categories'}
                        className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${activeTab === 'categories' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        Kategori <span className="ml-1 opacity-75">{categories.length}</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('facilities')}
                        aria-pressed={activeTab === 'facilities'}
                        className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${activeTab === 'facilities' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        Fasilitas <span className="ml-1 opacity-75">{facilities.length}</span>
                    </button>
                </div>

                {activeTab === 'categories' ? (
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        {categories.map((category) => (
                            <article key={category.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex min-w-0 items-start gap-3">
                                        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                            <CatalogIcon name={category.icon} className="size-5" />
                                        </div>
                                        <div className="min-w-0">
                                            <h2 className="truncate font-semibold text-foreground">{category.name}</h2>
                                            <p className="mt-0.5 text-xs text-muted-foreground">/{category.slug}</p>
                                        </div>
                                    </div>
                                    <Badge variant={category.is_active ? 'default' : 'outline'}>
                                        {category.is_active ? 'Aktif' : 'Nonaktif'}
                                    </Badge>
                                </div>
                                {category.description && (
                                    <p className="mt-4 line-clamp-2 min-h-10 text-sm text-muted-foreground">
                                        {category.description}
                                    </p>
                                )}
                                <div className="mt-4 flex items-center justify-between border-t border-border/70 pt-4">
                                    <span className="text-xs text-muted-foreground">
                                        {category.lapangans_count ?? 0} lapangan terkait
                                    </span>
                                    <div className="flex items-center gap-1">
                                        <Button variant="ghost" size="sm" onClick={() => openCategoryDialog(category)} aria-label={`Edit kategori ${category.name}`}>
                                            <Pencil className="size-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            aria-label={`${category.is_active ? 'Nonaktifkan' : 'Aktifkan'} kategori ${category.name}`}
                                            onClick={() => router.post(toggleCategory.url(category.id), {}, { preserveScroll: true })}
                                        >
                                            {category.is_active ? <ToggleRight className="size-4 text-primary" /> : <ToggleLeft className="size-4" />}
                                        </Button>
                                    </div>
                                </div>
                            </article>
                        ))}
                        {categories.length === 0 && (
                            <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground sm:col-span-2 xl:col-span-3">
                                Belum ada kategori. Tambahkan kategori olahraga pertama.
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        {facilities.map((facility) => (
                            <article key={facility.id} className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-5 shadow-sm">
                                <div className="flex min-w-0 items-center gap-3">
                                    <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                        <CatalogIcon name={facility.icon} className="size-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <h2 className="truncate font-semibold text-foreground">{facility.name}</h2>
                                        <p className="mt-0.5 text-xs text-muted-foreground">
                                            {facility.lapangans_count ?? 0} lapangan terkait
                                        </p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => openFacilityDialog(facility)} aria-label={`Edit fasilitas ${facility.name}`}>
                                    <Pencil className="size-4" />
                                </Button>
                            </article>
                        ))}
                        {facilities.length === 0 && (
                            <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground sm:col-span-2 xl:col-span-3">
                                Belum ada fasilitas. Tambahkan fasilitas pertama.
                            </div>
                        )}
                    </div>
                )}
            </div>

            <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
                <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-lg">
                    <DialogHeader>
                        <div className="flex items-start gap-3">
                            <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                {editingCategory ? <Pencil className="size-5" /> : <Layers className="size-5" />}
                            </div>
                            <div className="flex flex-col gap-1">
                                <DialogTitle>{editingCategory ? 'Edit Kategori' : 'Tambah Kategori'}</DialogTitle>
                                <DialogDescription>Slug dibuat otomatis dari nama kategori dan tidak berubah saat nama diedit.</DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                    <form onSubmit={submitCategory} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="category-name">Nama kategori</Label>
                            <Input id="category-name" value={categoryForm.data.name} onChange={(event) => categoryForm.setData('name', event.target.value)} required maxLength={255} />
                            {categoryForm.errors.name && <p className="text-xs text-destructive">{categoryForm.errors.name}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="category-icon">Ikon kategori</Label>
                            <Select value={getCatalogIconName(categoryForm.data.icon)} onValueChange={(value) => categoryForm.setData('icon', value)}>
                                <SelectTrigger id="category-icon" className="h-10 rounded-xl">
                                    <SelectValue placeholder="Pilih ikon" />
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
                            {categoryForm.errors.icon && <p className="text-xs text-destructive">{categoryForm.errors.icon}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="category-description">Deskripsi</Label>
                            <Textarea id="category-description" value={categoryForm.data.description} onChange={(event) => categoryForm.setData('description', event.target.value)} rows={3} maxLength={2000} />
                            {categoryForm.errors.description && <p className="text-xs text-destructive">{categoryForm.errors.description}</p>}
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={() => setCategoryDialogOpen(false)}>Batal</Button>
                            <Button type="submit" disabled={categoryForm.processing}>{categoryForm.processing ? 'Menyimpan…' : 'Simpan Kategori'}</Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={facilityDialogOpen} onOpenChange={setFacilityDialogOpen}>
                <DialogContent className="rounded-2xl sm:max-w-lg">
                    <DialogHeader>
                        <div className="flex items-start gap-3">
                            <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                {editingFacility ? <Pencil className="size-5" /> : <CatalogIcon name={facilityForm.data.icon} className="size-5" />}
                            </div>
                            <div className="flex flex-col gap-1">
                                <DialogTitle>{editingFacility ? 'Edit Fasilitas' : 'Tambah Fasilitas'}</DialogTitle>
                                <DialogDescription>Fasilitas yang ditambahkan dapat dipilih untuk lapangan mana pun.</DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                    <form onSubmit={submitFacility} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="facility-name">Nama fasilitas</Label>
                            <Input id="facility-name" value={facilityForm.data.name} onChange={(event) => facilityForm.setData('name', event.target.value)} required maxLength={255} />
                            {facilityForm.errors.name && <p className="text-xs text-destructive">{facilityForm.errors.name}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="facility-icon">Ikon fasilitas</Label>
                            <Select value={getCatalogIconName(facilityForm.data.icon)} onValueChange={(value) => facilityForm.setData('icon', value)}>
                                <SelectTrigger id="facility-icon" className="h-10 rounded-xl">
                                    <SelectValue placeholder="Pilih ikon" />
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
                            {facilityForm.errors.icon && <p className="text-xs text-destructive">{facilityForm.errors.icon}</p>}
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={() => setFacilityDialogOpen(false)}>Batal</Button>
                            <Button type="submit" disabled={facilityForm.processing}>{facilityForm.processing ? 'Menyimpan…' : 'Simpan Fasilitas'}</Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
