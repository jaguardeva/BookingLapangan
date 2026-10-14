import { Head, router, useForm } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import bannerRoutes, { store, toggle } from '@/actions/App/Http/Controllers/Admin/BannerManagementController';

type Banner = { id: string; title: string; image_url: string; is_active: boolean };
type Props = { banners: { data: Banner[] } };

export default function BannersIndex({ banners }: Props) {
    const form = useForm({ title: '', body: '', image: null as File | null, alt_text: '', link_url: '', placement: 'home', sort_order: 0, is_active: true, starts_at: '', ends_at: '' });
    const submit = (event: React.FormEvent) => { event.preventDefault(); form.post(store.url(), { forceFormData: true }); };
    return <AdminLayout breadcrumbs={[{ title: 'Banner', href: bannerRoutes.index.url() }]}><Head title="Banner" /><div className="space-y-6 p-4 sm:p-6"><div><h1 className="text-2xl font-black">Banner promosi</h1><p className="text-muted-foreground text-sm">Kelola konten promosi yang tampil di halaman publik.</p></div><form onSubmit={submit} className="bg-card border-border grid gap-4 rounded-2xl border p-5 sm:grid-cols-2"><div className="space-y-2"><Label>Judul</Label><Input value={form.data.title} onChange={(e) => form.setData('title', e.target.value)} /></div><div className="space-y-2"><Label>Gambar</Label><Input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => form.setData('image', e.target.files?.[0] ?? null)} /></div><div className="space-y-2 sm:col-span-2"><Label>Link (opsional)</Label><Input value={form.data.link_url} onChange={(e) => form.setData('link_url', e.target.value)} placeholder="https://..." /></div><Button className="w-fit">Tambah banner</Button></form><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{banners.data.map((banner) => <div key={banner.id} className="bg-card border-border overflow-hidden rounded-2xl border shadow-sm"><img src={banner.image_url} alt={banner.title} className="h-36 w-full object-cover" /><div className="flex items-center justify-between gap-2 p-4"><p className="text-sm font-bold">{banner.title}</p><Button size="sm" variant="outline" onClick={() => router.post(toggle.url(banner.id))}>{banner.is_active ? 'Nonaktifkan' : 'Aktifkan'}</Button></div></div>)}</div></div></AdminLayout>;
}
