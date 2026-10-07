import { useEffect, useState, type FormEvent } from 'react';
import { Link, router, useForm } from '@inertiajs/react';
import { Check, ImagePlus, Trash2 } from 'lucide-react';
import type { Category, Facility, Lapangan } from '@/types/booking';
import { store as storeLapangan, update as updateLapangan } from '@/actions/App/Http/Controllers/Admin/LapanganManagementController';
import { index as catalogIndex } from '@/actions/App/Http/Controllers/Admin/CatalogManagementController';
import { index as lapanganIndex } from '@/routes/admin/lapangans/index';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface LapanganFormProps {
    mode: 'create' | 'edit';
    categories: Category[];
    facilities: Facility[];
    lapangan?: Lapangan;
}

interface LapanganFormData {
    name: string;
    category_id: string;
    description: string;
    price_per_hour: number;
    operational_start: string;
    operational_end: string;
    slot_duration_minutes: number;
    image_files: File[];
    images_to_keep: string[];
    facilities: string[];
}

function initialData(lapangan: Lapangan | undefined, categories: Category[]): LapanganFormData {
    return {
        name: lapangan?.name ?? '',
        category_id: lapangan?.category_id ?? categories.find((category) => category.is_active)?.id ?? '',
        description: lapangan?.description ?? '',
        price_per_hour: lapangan?.price_per_hour ?? 100000,
        operational_start: lapangan?.operational_start ?? '07:00',
        operational_end: lapangan?.operational_end ?? '23:00',
        slot_duration_minutes: lapangan?.slot_duration_minutes ?? 60,
        image_files: [],
        images_to_keep: lapangan?.images ?? [],
        facilities: lapangan?.facilities?.map((facility) => String(facility.id)) ?? [],
    };
}

export function LapanganForm({ mode, categories, facilities, lapangan }: LapanganFormProps) {
    const [imagePreviews, setImagePreviews] = useState<{ file: File; url: string }[]>([]);
    const form = useForm<LapanganFormData>(initialData(lapangan, categories));
    const activeCategories = categories.filter((category) => category.is_active || category.id === form.data.category_id);

    useEffect(() => {
        const previews = form.data.image_files.map((file) => ({ file, url: URL.createObjectURL(file) }));
        setImagePreviews(previews);
        return () => previews.forEach(({ url }) => URL.revokeObjectURL(url));
    }, [form.data.image_files]);

    const toggleFacility = (facilityId: string) => {
        form.setData('facilities', form.data.facilities.includes(facilityId)
            ? form.data.facilities.filter((id) => id !== facilityId)
            : [...form.data.facilities, facilityId]);
    };

    const addImage = (file: File | undefined) => {
        if (!file || form.data.images_to_keep.length + form.data.image_files.length >= 4) {
            return;
        }

        form.setData('image_files', [...form.data.image_files, file]);
    };

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const options = {
            forceFormData: true,
            onSuccess: () => router.visit(lapanganIndex.url()),
        };

        if (mode === 'edit' && lapangan) {
            router.post(updateLapangan.url(lapangan.id), {
                _method: 'put',
                ...form.data,
                images_to_keep_count: form.data.images_to_keep.length,
            }, options);
            return;
        }

        form.post(storeLapangan.url(), options);
    };

    return (
        <form onSubmit={submit} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="name">Nama lapangan</Label>
                    <Input id="name" value={form.data.name} onChange={(event) => form.setData('name', event.target.value)} required />
                    {form.errors.name && <p className="text-xs text-destructive">{form.errors.name}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="category_id">Kategori olahraga</Label>
                    <Select value={form.data.category_id} onValueChange={(value) => form.setData('category_id', value)}>
                        <SelectTrigger id="category_id"><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
                        <SelectContent>{activeCategories.map((category) => <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>)}</SelectContent>
                    </Select>
                    {form.errors.category_id && <p className="text-xs text-destructive">{form.errors.category_id}</p>}
                </div>
                <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="description">Deskripsi</Label>
                    <Textarea id="description" value={form.data.description} onChange={(event) => form.setData('description', event.target.value)} rows={4} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="price_per_hour">Harga per jam</Label>
                    <Input id="price_per_hour" type="number" min={10000} step={5000} value={form.data.price_per_hour} onChange={(event) => form.setData('price_per_hour', Number(event.target.value))} required />
                    {form.errors.price_per_hour && <p className="text-xs text-destructive">{form.errors.price_per_hour}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="slot_duration_minutes">Durasi slot</Label>
                    <Select value={String(form.data.slot_duration_minutes)} onValueChange={(value) => form.setData('slot_duration_minutes', Number(value))}>
                        <SelectTrigger id="slot_duration_minutes"><SelectValue /></SelectTrigger>
                        <SelectContent>{[30, 60, 90, 120].map((value) => <SelectItem key={value} value={String(value)}>{value} menit</SelectItem>)}</SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="operational_start">Jam buka</Label>
                    <Input id="operational_start" type="time" value={form.data.operational_start} onChange={(event) => form.setData('operational_start', event.target.value)} required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="operational_end">Jam tutup</Label>
                    <Input id="operational_end" type="time" value={form.data.operational_end} onChange={(event) => form.setData('operational_end', event.target.value)} required />
                </div>
            </div>

            <div className="space-y-3 rounded-2xl border border-border/70 p-4">
                <div className="flex items-center justify-between gap-3">
                    <div><Label>Foto lapangan</Label><p className="mt-1 text-xs text-muted-foreground">Tambahkan maksimal 4 foto.</p></div>
                    <span className="text-xs text-muted-foreground">{form.data.images_to_keep.length + form.data.image_files.length} / 4</span>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {form.data.images_to_keep.map((image, index) => (
                        <div key={image} className="relative aspect-[4/3] overflow-hidden rounded-xl border bg-muted">
                            <img src={image} alt={`Foto lapangan ${index + 1}`} className="size-full object-cover" />
                            <Button type="button" size="icon-sm" variant="destructive" className="absolute right-2 top-2" onClick={() => form.setData('images_to_keep', form.data.images_to_keep.filter((_, imageIndex) => imageIndex !== index))} aria-label={`Hapus foto ${index + 1}`}>
                                <Trash2 className="size-3.5" />
                            </Button>
                        </div>
                    ))}
                    {imagePreviews.map(({ file, url }, index) => (
                        <div key={`${file.name}-${file.lastModified}`} className="relative aspect-[4/3] overflow-hidden rounded-xl border bg-muted">
                            <img src={url} alt={`Preview foto baru ${index + 1}`} className="size-full object-cover" />
                            <Button type="button" size="icon-sm" variant="destructive" className="absolute right-2 top-2" onClick={() => form.setData('image_files', form.data.image_files.filter((_, fileIndex) => fileIndex !== index))} aria-label={`Hapus foto baru ${index + 1}`}>
                                <Trash2 className="size-3.5" />
                            </Button>
                        </div>
                    ))}
                    {form.data.images_to_keep.length + form.data.image_files.length < 4 && (
                        <label className="relative flex aspect-[4/3] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border text-muted-foreground transition-colors hover:border-primary hover:bg-primary/5 hover:text-primary">
                            <Input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="sr-only" onChange={(event) => { addImage(event.target.files?.[0]); event.currentTarget.value = ''; }} />
                            <ImagePlus className="size-7" />
                            <span className="text-xs font-medium">Tambah foto</span>
                        </label>
                    )}
                </div>
                {form.errors.image_files && <p className="text-xs text-destructive">{form.errors.image_files}</p>}
            </div>

            <div className="space-y-3 rounded-2xl border border-border/70 p-4">
                <div className="flex items-center justify-between"><Label>Fasilitas tersedia</Label><Link href={catalogIndex.url()} className="text-xs font-medium text-primary hover:underline">Kelola fasilitas</Link></div>
                <div className="grid gap-2 sm:grid-cols-2">{facilities.map((facility) => { const checked = form.data.facilities.includes(String(facility.id)); return <button key={facility.id} type="button" onClick={() => toggleFacility(String(facility.id))} className={`flex items-center gap-2 rounded-xl border p-3 text-left text-sm transition ${checked ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-muted-foreground hover:border-primary/40'}`}><span className={`flex size-5 items-center justify-center rounded border ${checked ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground'}`}>{checked && <Check className="size-3.5" />}</span>{facility.name}</button>; })}</div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-border/70 pt-5 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" asChild><Link href="/admin/lapangans">Batal</Link></Button>
                <Button type="submit" disabled={form.processing}><ImagePlus className="mr-2 size-4" />{form.processing ? 'Menyimpan...' : mode === 'edit' ? 'Simpan Perubahan' : 'Tambah Lapangan'}</Button>
            </div>
        </form>
    );
}
