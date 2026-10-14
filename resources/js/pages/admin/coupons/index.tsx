import { Head, router, useForm } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import couponRoutes, { store, toggle } from '@/actions/App/Http/Controllers/Admin/CouponManagementController';

type Coupon = { id: string; code: string; discount_type: string; discount_value: number; is_active: boolean; used_count: number };
type Props = { coupons: { data: Coupon[] } };

export default function CouponsIndex({ coupons }: Props) {
    const form = useForm({ code: '', discount_type: 'percentage', discount_value: 10, minimum_order_amount: 0, maximum_discount_amount: '', usage_limit: '', per_user_limit: '', starts_at: '', ends_at: '', is_active: true });
    const submit = (event: React.FormEvent) => { event.preventDefault(); form.post(store.url()); };
    return <AdminLayout breadcrumbs={[{ title: 'Kupon', href: couponRoutes.index.url() }]}><Head title="Kupon" /><div className="space-y-6 p-4 sm:p-6"><div><h1 className="text-2xl font-black">Kupon promosi</h1><p className="text-muted-foreground text-sm">Buat promo yang dapat digunakan di checkout booking.</p></div><form onSubmit={submit} className="bg-card border-border grid gap-4 rounded-2xl border p-5 sm:grid-cols-3"><div className="space-y-2"><Label>Kode</Label><Input value={form.data.code} onChange={(e) => form.setData('code', e.target.value.toUpperCase())} /></div><div className="space-y-2"><Label>Tipe</Label><select className="border-border bg-background h-10 rounded-md border px-3 text-sm" value={form.data.discount_type} onChange={(e) => form.setData('discount_type', e.target.value)}><option value="percentage">Persentase</option><option value="fixed">Nominal</option></select></div><div className="space-y-2"><Label>Nilai diskon</Label><Input type="number" value={form.data.discount_value} onChange={(e) => form.setData('discount_value', Number(e.target.value))} /></div><Button className="w-fit">Tambah kupon</Button></form><div className="bg-card border-border overflow-hidden rounded-2xl border shadow-sm"><div className="divide-border divide-y">{coupons.data.map((coupon) => <div key={coupon.id} className="flex items-center justify-between gap-3 p-5 text-sm"><div><p className="font-bold">{coupon.code}</p><p className="text-muted-foreground">{coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : `Rp ${coupon.discount_value.toLocaleString('id-ID')}`} · digunakan {coupon.used_count}x</p></div><Button size="sm" variant="outline" onClick={() => router.post(toggle.url(coupon.id))}>{coupon.is_active ? 'Nonaktifkan' : 'Aktifkan'}</Button></div>)}</div></div></div></AdminLayout>;
}
