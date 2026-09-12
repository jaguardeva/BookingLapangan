import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { Edit2, MessageCircle, Plus, Trash2 } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type WhatsappContact = {
    id: number;
    name: string;
    phone: string;
    description: string | null;
    is_active: boolean;
    sort_order: number;
};

type Props = { contacts: WhatsappContact[] };

const emptyForm = {
    name: '',
    phone: '',
    description: '',
    sort_order: 0,
    is_active: true,
};

export default function WhatsappContactsIndex({ contacts }: Props) {
    const [editingContact, setEditingContact] = useState<WhatsappContact | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const { data, setData, post, put, processing, reset, errors } = useForm(emptyForm);

    const openCreate = () => {
        setEditingContact(null);
        reset();
        setIsFormOpen(true);
    };

    const openEdit = (contact: WhatsappContact) => {
        setEditingContact(contact);
        setData({
            name: contact.name,
            phone: contact.phone,
            description: contact.description ?? '',
            sort_order: contact.sort_order,
            is_active: contact.is_active,
        });
        setIsFormOpen(true);
    };

    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        const options = {
            onSuccess: () => {
                setIsFormOpen(false);
                setEditingContact(null);
                reset();
            },
        };

        if (editingContact) {
            put(`/admin/whatsapp-contacts/${editingContact.id}`, options);
        } else {
            post('/admin/whatsapp-contacts', options);
        }
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Kontak WhatsApp', href: '/admin/whatsapp-contacts' }]}>
            <Head title="Kontak WhatsApp" />

            <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Kontak WhatsApp</h1>
                        <p className="mt-1 text-xs text-muted-foreground">Kelola nomor yang bisa dihubungi user melalui widget bantuan.</p>
                    </div>
                    <Button onClick={openCreate} className="rounded-xl bg-emerald-600 text-white hover:bg-emerald-700">
                        <Plus className="mr-1.5 size-4" /> Tambah Kontak
                    </Button>
                </div>

                {isFormOpen && (
                    <form onSubmit={submit} className="grid gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm sm:grid-cols-2">
                        <div className="sm:col-span-2 flex items-center justify-between">
                            <div>
                                <h2 className="font-semibold">{editingContact ? 'Edit kontak' : 'Kontak baru'}</h2>
                                <p className="text-xs text-muted-foreground">Gunakan format nomor internasional untuk hasil terbaik.</p>
                            </div>
                            <Button type="button" variant="ghost" onClick={() => setIsFormOpen(false)}>Tutup</Button>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="contact-name">Nama kontak</Label>
                            <Input id="contact-name" value={data.name} onChange={(event) => setData('name', event.target.value)} placeholder="Customer Service" />
                            {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="contact-phone">Nomor WhatsApp</Label>
                            <Input id="contact-phone" value={data.phone} onChange={(event) => setData('phone', event.target.value)} placeholder="628123456789" />
                            {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="contact-description">Keterangan</Label>
                            <Input id="contact-description" value={data.description} onChange={(event) => setData('description', event.target.value)} placeholder="Bantuan booking lapangan" />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="contact-order">Urutan tampil</Label>
                            <Input id="contact-order" type="number" min={0} value={data.sort_order} onChange={(event) => setData('sort_order', Number(event.target.value))} />
                        </div>
                        <div className="sm:col-span-2 flex justify-end gap-2">
                            <Button type="submit" disabled={processing} className="rounded-xl bg-emerald-600 text-white hover:bg-emerald-700">{processing ? 'Menyimpan...' : 'Simpan Kontak'}</Button>
                        </div>
                    </form>
                )}

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {contacts.map((contact) => (
                        <div key={contact.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600"><MessageCircle className="size-5" /></div>
                                    <div>
                                        <h3 className="font-semibold">{contact.name}</h3>
                                        <p className="text-xs text-muted-foreground">+{contact.phone.replace(/^\+/, '')}</p>
                                    </div>
                                </div>
                                <Badge variant="outline" className={contact.is_active ? 'border-emerald-500/30 text-emerald-600' : 'text-muted-foreground'}>{contact.is_active ? 'Aktif' : 'Nonaktif'}</Badge>
                            </div>
                            <p className="mt-4 min-h-10 text-xs text-muted-foreground">{contact.description || 'Tanpa keterangan'}</p>
                            <div className="mt-4 flex justify-end gap-1 border-t border-border/60 pt-3">
                                <Button size="sm" variant="ghost" onClick={() => openEdit(contact)}><Edit2 className="mr-1.5 size-3.5" /> Edit</Button>
                                <Button size="sm" variant="ghost" onClick={() => router.post(`/admin/whatsapp-contacts/${contact.id}/toggle`)}>{contact.is_active ? 'Nonaktifkan' : 'Aktifkan'}</Button>
                                <Button size="sm" variant="ghost" className="text-red-600" onClick={() => window.confirm('Hapus kontak ini?') && router.delete(`/admin/whatsapp-contacts/${contact.id}`)}><Trash2 className="size-3.5" /></Button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </AppLayout>
    );
}
