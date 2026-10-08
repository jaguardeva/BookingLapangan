import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import {
    Plus,
    Edit2,
    Trash2,
    Users,
    Shield,
    Check,
    UserPlus,
    Pencil,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ConfirmDialog from '@/components/confirm-dialog';
import { Pagination } from '@/components/pagination';
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
        from?: number | null;
        to?: number | null;
        total: number;
        last_page?: number;
        per_page?: number;
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
    const [deletingAdmin, setDeletingAdmin] = useState<AdminUser | null>(null);

    const { data, setData, post, put, processing, reset, errors } = useForm({
        name: '',
        email: '',
        phone: '',
        password: '',
        lapangan_ids: [] as string[],
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
        setDeletingAdmin(admin);
    };

    const confirmDelete = () => {
        if (!deletingAdmin) {
            return;
        }

        router.delete(`/admin/admins/${deletingAdmin.id}`, {
            preserveScroll: true,
            onSuccess: () => setDeletingAdmin(null),
        });
    };

    const toggleLapangan = (lapanganId: string) => {
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
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="text-foreground text-2xl font-bold tracking-tight">
                            Manajemen Staf Kasir / Admin Lapangan
                        </h1>
                        <p className="text-muted-foreground mt-0.5 text-xs">
                            Daftarkan akun kasir baru dan atur penugasan ke
                            lapangan olahraga tertentu.
                        </p>
                    </div>

                    <Button
                        onClick={openCreateModal}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground h-9 rounded-xl text-xs"
                    >
                        <Plus className="size-4" /> Tambah Staf Admin
                        Baru
                    </Button>
                </div>

                <Pagination
                    links={admins.links}
                    from={admins.from}
                    to={admins.to}
                    total={admins.total}
                    lastPage={admins.last_page}
                    perPage={admins.per_page}
                    variant="summary"
                    className="mb-4"
                />

                <div className="border-border/80 bg-card overflow-hidden rounded-2xl border shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-muted/50 text-muted-foreground border-border/60 border-b text-xs tracking-wider uppercase">
                                <tr>
                                    <th className="px-4 py-3">Nama & Email</th>
                                    <th className="px-4 py-3">No. Telepon</th>
                                    <th className="px-4 py-3">Role</th>
                                    <th className="px-4 py-3">
                                        Lapangan Ditugaskan
                                    </th>
                                    <th className="px-4 py-3 text-right">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-border/40 divide-y">
                                {admins.data.map((admin) => (
                                    <tr
                                        key={admin.id}
                                        className="hover:bg-muted/30 transition-colors"
                                    >
                                        <td className="px-4 py-3.5">
                                            <p className="text-foreground font-bold">
                                                {admin.name}
                                            </p>
                                            <p className="text-muted-foreground text-xs">
                                                {admin.email}
                                            </p>
                                        </td>

                                        <td className="text-muted-foreground px-4 py-3.5">
                                            {admin.phone || '-'}
                                        </td>

                                        <td className="px-4 py-3.5">
                                            <Badge
                                                variant="outline"
                                                className="text-primary border-primary/30 text-xs font-semibold"
                                            >
                                                Kasir / Admin
                                            </Badge>
                                        </td>

                                        <td className="px-4 py-3.5">
                                            <div className="flex flex-wrap gap-1">
                                                {admin.assigned_lapangans &&
                                                admin.assigned_lapangans
                                                    .length > 0 ? (
                                                    admin.assigned_lapangans.map(
                                                        (l) => (
                                                            <Badge
                                                                key={l.id}
                                                                className="bg-muted text-foreground text-xs"
                                                            >
                                                                {l.name}
                                                            </Badge>
                                                        ),
                                                    )
                                                ) : (
                                                    <span className="text-muted-foreground text-xs italic">
                                                        Belum ada lapangan yang
                                                        ditugaskan
                                                    </span>
                                                )}
                                            </div>
                                        </td>

                                        <td className="px-4 py-3.5 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() =>
                                                        openEditModal(admin)
                                                    }
                                                    className="text-muted-foreground hover:text-foreground size-8 p-0"
                                                >
                                                    <Edit2 className="size-3.5" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() =>
                                                        handleDelete(admin)
                                                    }
                                                    className="size-8 p-0 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/30"
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
                <Pagination
                    links={admins.links}
                    from={admins.from}
                    to={admins.to}
                    total={admins.total}
                    lastPage={admins.last_page}
                    perPage={admins.per_page}
                    variant="navigation"
                />
            </div>

            {/* Modal Dialog */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <div className="flex items-start gap-3">
                            <div className="bg-primary/10 text-primary mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl">
                                {editingAdmin ? (
                                    <Pencil className="size-5" />
                                ) : (
                                    <UserPlus className="size-5" />
                                )}
                            </div>
                            <div className="flex flex-col gap-1">
                                <DialogTitle className="text-base">
                                    {editingAdmin
                                        ? 'Edit Data Admin'
                                        : 'Tambah Staf Kasir Baru'}
                                </DialogTitle>
                                <DialogDescription className="text-xs">
                                    Masukkan detail akun login admin dan centang
                                    lapangan yang boleh dikelola.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <form
                        onSubmit={handleFormSubmit}
                        className="space-y-4 pt-2 text-xs"
                    >
                        <div className="space-y-1">
                            <Label htmlFor="admin_name">Nama Lengkap</Label>
                            <Input
                                id="admin_name"
                                value={data.name}
                                onChange={(e) =>
                                    setData('name', e.target.value)
                                }
                                placeholder="Contoh: Rian Pratama"
                                required
                                className="h-9 rounded-lg"
                            />
                            {errors.name && (
                                <p className="text-xs text-rose-500">
                                    {errors.name}
                                </p>
                            )}
                        </div>

                        <div className="space-y-1">
                            <Label htmlFor="admin_email">Alamat Email</Label>
                            <Input
                                id="admin_email"
                                type="email"
                                value={data.email}
                                onChange={(e) =>
                                    setData('email', e.target.value)
                                }
                                placeholder="kasir@sportbooking.id"
                                required
                                className="h-9 rounded-lg"
                            />
                            {errors.email && (
                                <p className="text-xs text-rose-500">
                                    {errors.email}
                                </p>
                            )}
                        </div>

                        <div className="space-y-1">
                            <Label htmlFor="admin_phone">
                                Nomor Telepon / WhatsApp
                            </Label>
                            <Input
                                id="admin_phone"
                                type="tel"
                                inputMode="numeric"
                                pattern="08[0-9]{8,13}"
                                value={data.phone}
                                onChange={(e) =>
                                    setData(
                                        'phone',
                                        e.target.value.replace(/\D/g, ''),
                                    )
                                }
                                placeholder="081234567890"
                                className="h-9 rounded-lg"
                            />
                        </div>

                        <div className="space-y-1">
                            <Label htmlFor="admin_password">
                                Kata Sandi{' '}
                                {editingAdmin && (
                                    <span className="text-muted-foreground font-normal">
                                        (Kosongkan jika tidak diganti)
                                    </span>
                                )}
                            </Label>
                            <Input
                                id="admin_password"
                                type="password"
                                value={data.password}
                                onChange={(e) =>
                                    setData('password', e.target.value)
                                }
                                placeholder={
                                    editingAdmin
                                        ? '••••••••'
                                        : 'Minimal 8 karakter'
                                }
                                required={!editingAdmin}
                                className="h-9 rounded-lg"
                            />
                            {errors.password && (
                                <p className="text-xs text-rose-500">
                                    {errors.password}
                                </p>
                            )}
                        </div>

                        {/* Assign Lapangan Checkboxes */}
                        <div className="space-y-2 pt-2">
                            <Label>Tugaskan ke Lapangan</Label>
                            <div className="border-border bg-muted/20 max-h-40 space-y-1.5 overflow-y-auto rounded-xl border p-3">
                                {lapangans.map((lapangan) => {
                                    const checked = data.lapangan_ids.includes(
                                        lapangan.id,
                                    );
                                    return (
                                        <button
                                            key={lapangan.id}
                                            type="button"
                                            onClick={() =>
                                                toggleLapangan(lapangan.id)
                                            }
                                            className={`flex w-full items-center justify-between rounded-lg border p-2 text-left transition-all ${
                                                checked
                                                    ? 'border-primary bg-primary/10 text-primary dark:text-primary font-bold'
                                                    : 'border-border bg-card text-muted-foreground'
                                            }`}
                                        >
                                            <span>{lapangan.name}</span>
                                            <div
                                                className={`flex size-4 items-center justify-center rounded border ${
                                                    checked
                                                        ? 'bg-primary border-primary text-primary-foreground'
                                                        : 'border-muted-foreground'
                                                }`}
                                            >
                                                {checked && (
                                                    <Check className="size-3" />
                                                )}
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
                                className="bg-primary hover:bg-primary/90 text-primary-foreground flex-1 rounded-xl font-bold"
                            >
                                {processing
                                    ? 'Menyimpan...'
                                    : editingAdmin
                                      ? 'Simpan Perubahan'
                                      : 'Tambah Admin'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
            <ConfirmDialog
                open={deletingAdmin !== null}
                onOpenChange={(open) => !open && setDeletingAdmin(null)}
                title="Hapus admin kasir?"
                description={`Akun ${deletingAdmin?.name ?? ''} dan penugasannya akan dihapus dari sistem.`}
                confirmLabel="Hapus Admin"
                variant="destructive"
                icon={Trash2}
                onConfirm={confirmDelete}
            />
        </AppLayout>
    );
}
