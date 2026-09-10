import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import {
    Plus,
    Edit2,
    Trash2,
    ToggleLeft,
    ToggleRight,
    Layers,
    Check,
    Clock,
    DollarSign,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import type { Category, Facility, Lapangan } from '@/types/booking';

interface Props {
    lapangans: {
        data: Lapangan[];
        links: { url: string | null; label: string; active: boolean }[];
        total: number;
    };
    categories: Category[];
    facilities: Facility[];
}

export default function AdminLapanganIndex({ lapangans, categories = [], facilities = [] }: Props) {
    const breadcrumbs = [
        { title: 'Superadmin Workspace', href: '/admin' },
        { title: 'Kelola Lapangan', href: '/admin/lapangans' },
    ];

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingLapangan, setEditingLapangan] = useState<Lapangan | null>(null);

    const { data, setData, post, put, processing, reset, errors } = useForm({
        name: '',
        category_id: categories[0]?.id || 1,
        description: '',
        price_per_hour: 100000,
        operational_start: '07:00',
        operational_end: '23:00',
        slot_duration_minutes: 60,
        image_url: '',
        facilities: [] as number[],
    });

    const openCreateModal = () => {
        setEditingLapangan(null);
        reset();
        setData({
            name: '',
            category_id: categories[0]?.id || 1,
            description: '',
            price_per_hour: 100000,
            operational_start: '07:00',
            operational_end: '23:00',
            slot_duration_minutes: 60,
            image_url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1000&q=80',
            facilities: [],
        });
        setIsModalOpen(true);
    };

    const openEditModal = (lapangan: Lapangan) => {
        setEditingLapangan(lapangan);
        setData({
            name: lapangan.name,
            category_id: lapangan.category_id,
            description: lapangan.description || '',
            price_per_hour: lapangan.price_per_hour,
            operational_start: lapangan.operational_start,
            operational_end: lapangan.operational_end,
            slot_duration_minutes: lapangan.slot_duration_minutes,
            image_url: lapangan.images?.[0] || '',
            facilities: lapangan.facilities?.map((f) => f.id) || [],
        });
        setIsModalOpen(true);
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingLapangan) {
            put(`/admin/lapangans/${editingLapangan.id}`, {
                onSuccess: () => {
                    setIsModalOpen(false);
                    reset();
                },
            });
        } else {
            post('/admin/lapangans', {
                onSuccess: () => {
                    setIsModalOpen(false);
                    reset();
                },
            });
        }
    };

    const handleToggle = (lapangan: Lapangan) => {
        router.post(`/admin/lapangans/${lapangan.id}/toggle`, {}, { preserveScroll: true });
    };

    const handleDelete = (lapangan: Lapangan) => {
        if (confirm(`Hapus lapangan ${lapangan.name}? Semua riwayat booking di lapangan ini akan ikut terhapus.`)) {
            router.delete(`/admin/lapangans/${lapangan.id}`, { preserveScroll: true });
        }
    };

    const toggleFacility = (facilityId: number) => {
        setData((prev) => {
            const exists = prev.facilities.includes(facilityId);
            return {
                ...prev,
                facilities: exists
                    ? prev.facilities.filter((id) => id !== facilityId)
                    : [...prev.facilities, facilityId],
            };
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Kelola Lapangan - Superadmin" />

            <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">
                            Manajemen Data Lapangan
                        </h1>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Tambah, perbarui tarif, atur jam operasional, dan kelola fasilitas lapangan olahraga.
                        </p>
                    </div>

                    <Button onClick={openCreateModal} className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs h-9">
                        <Plus className="size-4 mr-1.5" /> Tambah Lapangan Baru
                    </Button>
                </div>

                {/* Table of Lapangan */}
                <div className="rounded-2xl border border-border/80 bg-card shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                            <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border/60">
                                <tr>
                                    <th className="py-3 px-4">Lapangan</th>
                                    <th className="py-3 px-4">Kategori</th>
                                    <th className="py-3 px-4">Tarif per Jam</th>
                                    <th className="py-3 px-4">Jam Operasional</th>
                                    <th className="py-3 px-4">Fasilitas</th>
                                    <th className="py-3 px-4">Status</th>
                                    <th className="py-3 px-4 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/40">
                                {lapangans.data.map((item) => (
                                    <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="py-3.5 px-4 flex items-center gap-3">
                                            <img
                                                src={item.images?.[0] || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=200&q=80'}
                                                alt={item.name}
                                                className="size-10 rounded-lg object-cover border border-border shrink-0"
                                            />
                                            <div>
                                                <p className="font-bold text-foreground text-sm">{item.name}</p>
                                                <p className="text-[10px] text-muted-foreground">{item.bookings_count ?? 0} total booking</p>
                                            </div>
                                        </td>

                                        <td className="py-3.5 px-4">
                                            <Badge variant="outline" className="font-semibold text-[10px]">
                                                {item.category?.name}
                                            </Badge>
                                        </td>

                                        <td className="py-3.5 px-4 font-bold text-emerald-600 dark:text-emerald-400">
                                            Rp {Number(item.price_per_hour).toLocaleString('id-ID')}
                                        </td>

                                        <td className="py-3.5 px-4">
                                            {item.operational_start} - {item.operational_end} WIB
                                        </td>

                                        <td className="py-3.5 px-4 max-w-xs">
                                            <div className="flex flex-wrap gap-1">
                                                {item.facilities?.slice(0, 3).map((f) => (
                                                    <span key={f.id} className="inline-block bg-muted rounded px-1.5 py-0.5 text-[9px] text-muted-foreground">
                                                        {f.name}
                                                    </span>
                                                ))}
                                                {(item.facilities?.length ?? 0) > 3 && (
                                                    <span className="text-[9px] text-muted-foreground">
                                                        +{(item.facilities?.length ?? 0) - 3} lainnya
                                                    </span>
                                                )}
                                            </div>
                                        </td>

                                        <td className="py-3.5 px-4">
                                            <button
                                                type="button"
                                                onClick={() => handleToggle(item)}
                                                className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
                                            >
                                                {item.is_active ? (
                                                    <Badge className="bg-emerald-600 text-white text-[10px] cursor-pointer">
                                                        Aktif
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="text-muted-foreground text-[10px] cursor-pointer">
                                                        Non-Aktif
                                                    </Badge>
                                                )}
                                            </button>
                                        </td>

                                        <td className="py-3.5 px-4 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => openEditModal(item)}
                                                    className="size-8 p-0 text-muted-foreground hover:text-foreground"
                                                >
                                                    <Edit2 className="size-3.5" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleDelete(item)}
                                                    className="size-8 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                                                >
                                                    <Trash2 className="size-3.5" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Create & Edit Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-xl rounded-2xl border-border max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold">
                            {editingLapangan ? 'Edit Data Lapangan' : 'Tambah Lapangan Baru'}
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Isi informasi lengkap lapangan, tarif sewa per jam, dan fasilitas pendukung.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleFormSubmit} className="space-y-4 pt-2 text-xs">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1 col-span-2 sm:col-span-1">
                                <Label htmlFor="name">Nama Lapangan</Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="Contoh: Arena Futsal Vinyl Pro Court B"
                                    required
                                    className="h-9 rounded-lg"
                                />
                                {errors.name && <p className="text-rose-500 text-[11px]">{errors.name}</p>}
                            </div>

                            <div className="space-y-1 col-span-2 sm:col-span-1">
                                <Label htmlFor="category_id">Kategori Olahraga</Label>
                                <select
                                    id="category_id"
                                    value={data.category_id}
                                    onChange={(e) => setData('category_id', Number(e.target.value))}
                                    className="w-full h-9 rounded-lg border border-input bg-card px-3 text-xs"
                                >
                                    {categories.map((c) => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <Label htmlFor="description">Deskripsi & Spesifikasi Lapangan</Label>
                            <Textarea
                                id="description"
                                value={data.description}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setData('description', e.target.value)}
                                placeholder="Detail spesifikasi lantai, penerangan, ukuran..."
                                rows={3}
                                className="rounded-lg text-xs"
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-1 col-span-3 sm:col-span-1">
                                <Label htmlFor="price_per_hour">Harga per Jam (Rp)</Label>
                                <Input
                                    id="price_per_hour"
                                    type="number"
                                    value={data.price_per_hour}
                                    onChange={(e) => setData('price_per_hour', Number(e.target.value))}
                                    required
                                    min={10000}
                                    step={5000}
                                    className="h-9 rounded-lg"
                                />
                            </div>

                            <div className="space-y-1 col-span-3 sm:col-span-1">
                                <Label htmlFor="operational_start">Buka (WIB)</Label>
                                <Input
                                    id="operational_start"
                                    type="text"
                                    value={data.operational_start}
                                    onChange={(e) => setData('operational_start', e.target.value)}
                                    placeholder="07:00"
                                    required
                                    className="h-9 rounded-lg"
                                />
                            </div>

                            <div className="space-y-1 col-span-3 sm:col-span-1">
                                <Label htmlFor="operational_end">Tutup (WIB)</Label>
                                <Input
                                    id="operational_end"
                                    type="text"
                                    value={data.operational_end}
                                    onChange={(e) => setData('operational_end', e.target.value)}
                                    placeholder="23:00"
                                    required
                                    className="h-9 rounded-lg"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <Label htmlFor="image_url">URL Foto Lapangan</Label>
                            <Input
                                id="image_url"
                                value={data.image_url}
                                onChange={(e) => setData('image_url', e.target.value)}
                                placeholder="https://images.unsplash.com/..."
                                className="h-9 rounded-lg"
                            />
                        </div>

                        {/* Facilities Selection */}
                        <div className="space-y-2 pt-2">
                            <Label>Fasilitas yang Tersedia</Label>
                            <div className="grid grid-cols-2 gap-2 p-3 rounded-xl border border-border/70 bg-muted/20">
                                {facilities.map((f) => {
                                    const checked = data.facilities.includes(f.id);
                                    return (
                                        <button
                                            key={f.id}
                                            type="button"
                                            onClick={() => toggleFacility(f.id)}
                                            className={`p-2 rounded-lg border text-left flex items-center gap-2 transition-all ${
                                                checked
                                                    ? 'border-emerald-600 bg-emerald-500/10 font-bold text-emerald-700 dark:text-emerald-300'
                                                    : 'border-border bg-card text-muted-foreground'
                                            }`}
                                        >
                                            <div className={`size-4 rounded flex items-center justify-center border ${
                                                checked ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-muted-foreground'
                                            }`}>
                                                {checked && <Check className="size-3" />}
                                            </div>
                                            <span>{f.name}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="flex gap-2 pt-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsModalOpen(false)}
                                className="flex-1 rounded-xl"
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                disabled={processing}
                                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold"
                            >
                                {processing ? 'Menyimpan...' : editingLapangan ? 'Simpan Perubahan' : 'Tambah Lapangan'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
