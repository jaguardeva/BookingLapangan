import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Plus, Edit2, Trash2, CreditCard } from 'lucide-react';
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
import type { BankAccount } from '@/types/booking';

interface Props {
    banks: BankAccount[];
}

export default function AdminBanksIndex({ banks = [] }: Props) {
    const breadcrumbs = [
        { title: 'Superadmin Workspace', href: '/admin' },
        { title: 'Rekening Bank', href: '/admin/banks' },
    ];

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBank, setEditingBank] = useState<BankAccount | null>(null);

    const { data, setData, post, put, processing, reset, errors } = useForm({
        bank_name: '',
        account_number: '',
        account_name: '',
    });

    const openCreateModal = () => {
        setEditingBank(null);
        reset();
        setIsModalOpen(true);
    };

    const openEditModal = (bank: BankAccount) => {
        setEditingBank(bank);
        setData({
            bank_name: bank.bank_name,
            account_number: bank.account_number,
            account_name: bank.account_name,
        });
        setIsModalOpen(true);
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingBank) {
            put(`/admin/banks/${editingBank.id}`, {
                onSuccess: () => {
                    setIsModalOpen(false);
                    reset();
                },
            });
        } else {
            post('/admin/banks', {
                onSuccess: () => {
                    setIsModalOpen(false);
                    reset();
                },
            });
        }
    };

    const handleToggle = (bank: BankAccount) => {
        router.post(`/admin/banks/${bank.id}/toggle`, {}, { preserveScroll: true });
    };

    const handleDelete = (bank: BankAccount) => {
        if (confirm(`Hapus rekening ${bank.bank_name} - ${bank.account_number}?`)) {
            router.delete(`/admin/banks/${bank.id}`, { preserveScroll: true });
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Rekening Bank Transfer - Superadmin" />

            <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">
                            Manajemen Rekening Bank Transfer
                        </h1>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Rekening yang berstatus aktif akan ditampilkan pada invoice dan form checkout pelanggan.
                        </p>
                    </div>

                    <Button onClick={openCreateModal} className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs h-9">
                        <Plus className="size-4 mr-1.5" /> Tambah Rekening Baru
                    </Button>
                </div>

                <div className="rounded-2xl border border-border/80 bg-card shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                            <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border/60">
                                <tr>
                                    <th className="py-3 px-4">Nama Bank</th>
                                    <th className="py-3 px-4">Nomor Rekening</th>
                                    <th className="py-3 px-4">Atas Nama</th>
                                    <th className="py-3 px-4">Status</th>
                                    <th className="py-3 px-4 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/40">
                                {banks.map((bank) => (
                                    <tr key={bank.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="py-3.5 px-4 font-bold text-foreground flex items-center gap-2">
                                            <div className="size-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                                                <CreditCard className="size-4" />
                                            </div>
                                            <span>{bank.bank_name}</span>
                                        </td>

                                        <td className="py-3.5 px-4 font-mono font-bold text-foreground">
                                            {bank.account_number}
                                        </td>

                                        <td className="py-3.5 px-4 uppercase text-foreground">
                                            {bank.account_name}
                                        </td>

                                        <td className="py-3.5 px-4">
                                            <button
                                                type="button"
                                                onClick={() => handleToggle(bank)}
                                                className="hover:opacity-80"
                                            >
                                                {bank.is_active ? (
                                                    <Badge className="bg-emerald-600 text-white text-[10px] cursor-pointer">
                                                        Aktif (Ditampilkan)
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
                                                    onClick={() => openEditModal(bank)}
                                                    className="size-8 p-0 text-muted-foreground hover:text-foreground"
                                                >
                                                    <Edit2 className="size-3.5" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleDelete(bank)}
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
                            {editingBank ? 'Edit Rekening Bank' : 'Tambah Rekening Bank Baru'}
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Masukkan data rekening bank resmi untuk menerima transfer pembayaran booking.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleFormSubmit} className="space-y-4 pt-2 text-xs">
                        <div className="space-y-1">
                            <Label htmlFor="bank_name">Nama Bank</Label>
                            <Input
                                id="bank_name"
                                value={data.bank_name}
                                onChange={(e) => setData('bank_name', e.target.value)}
                                placeholder="Contoh: BCA / Mandiri / BRI / BNI"
                                required
                                className="h-9 rounded-lg"
                            />
                            {errors.bank_name && <p className="text-rose-500 text-[11px]">{errors.bank_name}</p>}
                        </div>

                        <div className="space-y-1">
                            <Label htmlFor="account_number">Nomor Rekening</Label>
                            <Input
                                id="account_number"
                                value={data.account_number}
                                onChange={(e) => setData('account_number', e.target.value)}
                                placeholder="Contoh: 8830192841"
                                required
                                className="h-9 rounded-lg font-mono"
                            />
                            {errors.account_number && <p className="text-rose-500 text-[11px]">{errors.account_number}</p>}
                        </div>

                        <div className="space-y-1">
                            <Label htmlFor="account_name">Atas Nama Pemilik Rekening</Label>
                            <Input
                                id="account_name"
                                value={data.account_name}
                                onChange={(e) => setData('account_name', e.target.value)}
                                placeholder="Contoh: PT ARENA OLAHRAGA INDONESIA"
                                required
                                className="h-9 rounded-lg uppercase"
                            />
                            {errors.account_name && <p className="text-rose-500 text-[11px]">{errors.account_name}</p>}
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
                                {processing ? 'Menyimpan...' : editingBank ? 'Simpan Perubahan' : 'Tambah Rekening'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
