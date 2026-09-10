import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Plus, Edit2, Trash2, Users, Shield, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import type { Lapangan } from '@/types/booking';
import type { User } from '@/types/auth';

interface AdminUser extends User {
    assigned_lapangans?: Lapangan[];
}

interface Props {
    admins: {
        data: AdminUser[];
        links: { url: string | null; label: string; active: boolean }[];
        total: number;
    };
    lapangans: Lapangan[];
}

export default function AdminAdminsIndex({ admins, lapangans = [] }: Props) {
    const breadcrumbs = [
        { title: 'Superadmin Workspace', href: '/admin' },
        { title: 'Kelola Staf Admin', href: '/admin/admins' },
    ];

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);

    const { data, setData, post, put, processing, reset, errors } = useForm({
        name: '',
        email: '',
        phone: '',
        password: '',
        lapangan_ids: [] as number[],
    });

    const openCreateModal = () => {
        setEditingAdmin(null);
        reset();
        setIsModalOpen(true);
    };

    const openEditModal = (admin: AdminUser) => {
        setEditingAdmin(admin);
        setData({
            name: admin.name,
            email: admin.email,
            phone: admin.phone || '',
            password: '',
            lapangan_ids: admin.assigned_lapangans?.map((l) => l.id) || [],
        });
        setIsModalOpen(true);
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingAdmin) {
            put(`/admin/admins/${editingAdmin.id}`, {
                onSuccess: () => {
                    setIsModalOpen(false);
                    reset();
                },
            });
        } else {
            post('/admin/admins', {
                onSuccess: () => {
                    setIsModalOpen(false);
                    reset();
                },
            });
        }
    };

    const handleDelete = (admin: AdminUser) => {
        if (confirm(`Hapus admin kasir ${admin.name}?`)) {
            router.delete(`/admin/admins/${admin.id}`, { preserveScroll: true });
        }
    };

    const toggleLapangan = (lapanganId: number) => {
        setData((prev) => {
            const exists = prev.lapangan_ids.includes(lapanganId);
            return {
                ...prev,
                lapangan_ids: exists
                    ? prev.lapangan_ids.filter((id) => id !== lapanganId)
                    : [...prev.lapangan_ids, lapanganId],
            };
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Kelola Admin Kasir - Superadmin" />

            <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">
                            Manajemen Staf Kasir / Admin Lapangan
                        </h1>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Daftarkan akun kasir baru dan atur penugasan ke lapangan olahraga tertentu.
                        </p>
                    </div>

                    <Button onClick={openCreateModal} className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs h-9">
                        <Plus className="size-4 mr-1.5" /> Tambah Staf Admin Baru
                    </Button>
                </div>

                <div className="rounded-2xl border border-border/80 bg-card shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                            <thead className="bg-muted/50 text-muted-foreground uppercase text-xs tracking-wider border-b border-border/60">
                                <tr>
                                    <th className="py-3 px-4">Nama & Email</th>
                                    <th className="py-3 px-4">No. Telepon</th>
                                    <th className="py-3 px-4">Role</th>
                                    <th className="py-3 px-4">Lapangan Ditugaskan</th>
                                    <th className="py-3 px-4 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/40">
                                {admins.data.map((admin) => (
                                    <tr key={admin.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="py-3.5 px-4">
                                            <p className="font-bold text-foreground">{admin.name}</p>
                                            <p className="text-xs text-muted-foreground">{admin.email}</p>
                                        </td>

                                        <td className="py-3.5 px-4 text-muted-foreground">
                                            {admin.phone || '-'}
                                        </td>

                                        <td className="py-3.5 px-4">
                                            <Badge variant="outline" className="text-xs font-semibold text-emerald-600 border-emerald-500/30">
                                                Kasir / Admin
                                            </Badge>
                                        </td>

                                        <td className="py-3.5 px-4">
                                            <div className="flex flex-wrap gap-1">
                                                {admin.assigned_lapangans && admin.assigned_lapangans.length > 0 ? (
                                                    admin.assigned_lapangans.map((l) => (
                                                        <Badge key={l.id} className="bg-muted text-foreground text-xs">
                                                            {l.name}
                                                        </Badge>
                                                    ))
                                                ) : (
                                                    <span className="text-xs text-muted-foreground italic">
                                                        Belum ada lapangan yang ditugaskan
                                                    </span>
                                                )}
                                            </div>
                                        </td>

                                        <td className="py-3.5 px-4 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => openEditModal(admin)}
                                                    className="size-8 p-0 text-muted-foreground hover:text-foreground"
                                                >
                                                    <Edit2 className="size-3.5" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleDelete(admin)}
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

            {/* Modal Dialog */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-md rounded-2xl border-border">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold">
                            {editingAdmin ? 'Edit Data Admin' : 'Tambah Staf Kasir Baru'}
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Masukkan detail akun login admin dan centang lapangan yang boleh dikelola.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleFormSubmit} className="space-y-4 pt-2 text-xs">
                        <div className="space-y-1">
                            <Label htmlFor="admin_name">Nama Lengkap</Label>
                            <Input
                                id="admin_name"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                placeholder="Contoh: Rian Pratama"
                                required
                                className="h-9 rounded-lg"
                            />
                            {errors.name && <p className="text-rose-500 text-xs">{errors.name}</p>}
                        </div>

                        <div className="space-y-1">
                            <Label htmlFor="admin_email">Alamat Email</Label>
                            <Input
                                id="admin_email"
                                type="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                placeholder="kasir@sportbooking.id"
                                required
                                className="h-9 rounded-lg"
                            />
                            {errors.email && <p className="text-rose-500 text-xs">{errors.email}</p>}
                        </div>

                        <div className="space-y-1">
                            <Label htmlFor="admin_phone">Nomor Telepon / WhatsApp</Label>
                            <Input
                                id="admin_phone"
                                value={data.phone}
                                onChange={(e) => setData('phone', e.target.value)}
                                placeholder="081234567890"
                                className="h-9 rounded-lg"
                            />
                        </div>

                        <div className="space-y-1">
                            <Label htmlFor="admin_password">
                                Kata Sandi {editingAdmin && <span className="text-muted-foreground font-normal">(Kosongkan jika tidak diganti)</span>}
                            </Label>
                            <Input
                                id="admin_password"
                                type="password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                placeholder={editingAdmin ? '••••••••' : 'Minimal 8 karakter'}
                                required={!editingAdmin}
                                className="h-9 rounded-lg"
                            />
                            {errors.password && <p className="text-rose-500 text-xs">{errors.password}</p>}
                        </div>

                        {/* Assign Lapangan Checkboxes */}
                        <div className="space-y-2 pt-2">
                            <Label>Tugaskan ke Lapangan</Label>
                            <div className="space-y-1.5 p-3 rounded-xl border border-border bg-muted/20 max-h-40 overflow-y-auto">
                                {lapangans.map((lapangan) => {
                                    const checked = data.lapangan_ids.includes(lapangan.id);
                                    return (
                                        <button
                                            key={lapangan.id}
                                            type="button"
                                            onClick={() => toggleLapangan(lapangan.id)}
                                            className={`w-full p-2 rounded-lg border text-left flex items-center justify-between transition-all ${
                                                checked
                                                    ? 'border-emerald-600 bg-emerald-500/10 font-bold text-emerald-700 dark:text-emerald-300'
                                                    : 'border-border bg-card text-muted-foreground'
                                            }`}
                                        >
                                            <span>{lapangan.name}</span>
                                            <div className={`size-4 rounded flex items-center justify-center border ${
                                                checked ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-muted-foreground'
                                            }`}>
                                                {checked && <Check className="size-3" />}
                                            </div>
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
                                {processing ? 'Menyimpan...' : editingAdmin ? 'Simpan Perubahan' : 'Tambah Admin'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
