import { Head, router, useForm } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { Check, Edit2, Eye, MailCheck, Plus, Search, Trash2, UserPlus, X } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Pagination } from '@/components/pagination';
import { ProfileAvatarPreview } from '@/components/profile-avatar-preview';
import { useInitials } from '@/hooks/use-initials';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Lapangan } from '@/types/booking';
import { index as usersIndex, store as usersStore, update as usersUpdate, verification as usersVerification, destroy as usersDestroy } from '@/routes/admin/users';
import { show as usersShow } from '@/routes/admin/users';

type ManagedUser = {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    profile?: { phone: string | null } | null;
    role: 'user' | 'admin';
    email_verified_at: string | null;
    created_at: string;
    avatar_url: string | null;
    assigned_lapangans?: Lapangan[];
};

type FilterValue = '' | 'user' | 'admin';
type VerificationValue = '' | 'verified' | 'unverified';

interface Props {
    users: {
        data: ManagedUser[];
        links: { url: string | null; label: string; active: boolean }[];
        from?: number | null;
        to?: number | null;
        total: number;
    };
    filters: {
        search?: string;
        role?: string;
        verification?: string;
        sort?: string;
        direction?: string;
    };
    lapangans: Lapangan[];
}

const emptyForm = {
    name: '',
    email: '',
    phone: '',
    role: 'user' as 'user' | 'admin',
    password: '',
    lapangan_ids: [] as string[],
};

export default function AdminUsersIndex({ users, filters, lapangans = [] }: Props) {
    const breadcrumbs = [
        { title: 'Superadmin Workspace', href: '/admin' },
        { title: 'Kelola Pengguna', href: '/admin/users' },
    ];
    const [search, setSearch] = useState(filters.search ?? '');
    const [role, setRole] = useState<FilterValue>((filters.role as FilterValue) || '');
    const [verification, setVerification] = useState<VerificationValue>((filters.verification as VerificationValue) || '');
    const [sort, setSort] = useState(filters.sort || 'created_at');
    const [direction, setDirection] = useState(filters.direction || 'desc');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
    const [previewUser, setPreviewUser] = useState<{ name: string; avatarUrl: string } | null>(null);
    const filterKey = JSON.stringify([search, role, verification, sort, direction]);
    const lastAppliedFilterKey = useRef(filterKey);
    const { data, setData, post, put, processing, reset, errors } = useForm(emptyForm);
    const initials = useInitials();
    const error = (field: keyof typeof emptyForm): string | undefined => errors[field] as string | undefined;

    useEffect(() => {
        if (lastAppliedFilterKey.current === filterKey) {
            return;
        }

        const timeoutId = window.setTimeout(() => {
            lastAppliedFilterKey.current = filterKey;
            const query = Object.fromEntries(
                Object.entries({ search, role, verification, sort, direction }).filter(([, value]) => value !== ''),
            );

            router.get(usersIndex.url(), query, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            });
        }, 300);

        return () => window.clearTimeout(timeoutId);
    }, [direction, filterKey, role, search, sort, verification]);

    const openCreateModal = () => {
        setEditingUser(null);
        reset();
        setData(emptyForm);
        setIsModalOpen(true);
    };

    const openEditModal = (user: ManagedUser) => {
        setEditingUser(user);
        setData({
            name: user.name,
            email: user.email,
            phone: user.profile?.phone || '',
            role: user.role === 'admin' ? 'admin' : 'user',
            password: '',
            lapangan_ids: user.assigned_lapangans?.map((lapangan) => lapangan.id) || [],
        });
        setIsModalOpen(true);
    };

    const submitForm = (event: React.FormEvent) => {
        event.preventDefault();
        const options = {
            onSuccess: () => {
                setIsModalOpen(false);
                reset();
            },
        };

        if (editingUser) {
            put(usersUpdate.url(editingUser.id), options);
        } else {
            post(usersStore.url(), options);
        }
    };

    const toggleSort = (column: string) => {
        if (sort === column) {
            setDirection(direction === 'asc' ? 'desc' : 'asc');
            return;
        }

        setSort(column);
        setDirection('asc');
    };

    const toggleLapangan = (lapanganId: string) => {
        setData((current) => ({
            ...current,
            lapangan_ids: current.lapangan_ids.includes(lapanganId)
                ? current.lapangan_ids.filter((id) => id !== lapanganId)
                : [...current.lapangan_ids, lapanganId],
        }));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Kelola Pengguna - Superadmin" />

            <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">Kelola Pengguna</h1>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                            Kelola akun pelanggan dan admin lapangan dari satu halaman.
                        </p>
                    </div>
                    <Button onClick={openCreateModal} className="h-9 rounded-xl text-xs">
                        <Plus className="mr-1.5 size-4" /> Tambah Pengguna
                    </Button>
                </div>

                <div className="flex flex-col gap-3 rounded-2xl border border-border/80 bg-card p-4 shadow-sm lg:flex-row lg:items-center">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari nama, email, atau telepon..." className="h-9 pl-9 text-xs" />
                    </div>
                    <Select value={role || 'all'} onValueChange={(value) => setRole(value === 'all' ? '' : value as FilterValue)}>
                        <SelectTrigger className="h-9 w-full text-xs lg:w-40"><SelectValue placeholder="Semua role" /></SelectTrigger>
                        <SelectContent><SelectItem value="all">Semua role</SelectItem><SelectItem value="user">User</SelectItem><SelectItem value="admin">Admin</SelectItem></SelectContent>
                    </Select>
                    <Select value={verification || 'all'} onValueChange={(value) => setVerification(value === 'all' ? '' : value as VerificationValue)}>
                        <SelectTrigger className="h-9 w-full text-xs lg:w-48"><SelectValue placeholder="Semua status" /></SelectTrigger>
                        <SelectContent><SelectItem value="all">Semua status</SelectItem><SelectItem value="verified">Terverifikasi</SelectItem><SelectItem value="unverified">Belum terverifikasi</SelectItem></SelectContent>
                    </Select>
                </div>

                <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="border-b border-border/60 bg-muted/50 uppercase tracking-wider text-muted-foreground">
                                <tr>
                                    <SortableHeader label="Nama & Email" column="name" sort={sort} direction={direction} onSort={toggleSort} />
                                    <SortableHeader label="Telepon" column="email" sort={sort} direction={direction} onSort={toggleSort} />
                                    <SortableHeader label="Role" column="role" sort={sort} direction={direction} onSort={toggleSort} />
                                    <SortableHeader label="Verifikasi" column="verification" sort={sort} direction={direction} onSort={toggleSort} />
                                    <SortableHeader label="Dibuat" column="created_at" sort={sort} direction={direction} onSort={toggleSort} />
                                    <th className="px-4 py-3 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/40">
                                {users.data.map((user) => (
                                    <tr key={user.id} className="transition-colors hover:bg-muted/30">
                                        <td className="px-4 py-3.5">
                                            <div className="flex min-w-48 items-center gap-3">
                                                {user.avatar_url ? (
                                                    <button
                                                        type="button"
                                                        className="cursor-zoom-in rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                                        onClick={() => setPreviewUser({ name: user.name, avatarUrl: user.avatar_url ?? '' })}
                                                        aria-label={`Lihat foto profil ${user.name}`}
                                                    >
                                                        <Avatar className="size-10">
                                                            <AvatarImage src={user.avatar_url} alt={user.name} />
                                                            <AvatarFallback>{initials(user.name)}</AvatarFallback>
                                                        </Avatar>
                                                    </button>
                                                ) : (
                                                    <Avatar className="size-10">
                                                        <AvatarFallback>{initials(user.name)}</AvatarFallback>
                                                    </Avatar>
                                                )}
                                                <div className="min-w-0"><p className="truncate font-bold text-foreground">{user.name}</p><p className="truncate text-muted-foreground">{user.email}</p></div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3.5 text-muted-foreground">{user.profile?.phone || '-'}</td>
                                        <td className="px-4 py-3.5"><Badge variant="outline" className="capitalize">{user.role}</Badge></td>
                                        <td className="px-4 py-3.5">
                                            {user.email_verified_at ? <Badge className="gap-1 bg-emerald-600 text-white"><Check className="size-3" /> Terverifikasi</Badge> : <Badge variant="outline" className="gap-1 text-amber-600"><X className="size-3" /> Belum</Badge>}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3.5 text-muted-foreground">{new Date(user.created_at).toLocaleDateString('id-ID')}</td>
                                        <td className="px-4 py-3.5"><div className="flex justify-end gap-1">
                                            <Button size="sm" variant="ghost" title="Detail" onClick={() => router.visit(usersShow.url(user.id))} className="size-8 p-0 text-muted-foreground hover:text-foreground"><Eye className="size-3.5" /></Button>
                                            <Button size="sm" variant="ghost" title="Ubah verifikasi" onClick={() => router.patch(usersVerification.url(user.id), {}, { preserveScroll: true })} className="size-8 p-0 text-muted-foreground hover:text-foreground"><MailCheck className="size-3.5" /></Button>
                                            <Button size="sm" variant="ghost" onClick={() => openEditModal(user)} className="size-8 p-0 text-muted-foreground hover:text-foreground"><Edit2 className="size-3.5" /></Button>
                                            <Button size="sm" variant="ghost" onClick={() => { if (confirm(`Hapus pengguna ${user.name}?`)) router.delete(usersDestroy.url(user.id), { preserveScroll: true }); }} className="size-8 p-0 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/30"><Trash2 className="size-3.5" /></Button>
                                        </div></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {users.data.length === 0 && <div className="p-10 text-center text-sm text-muted-foreground">Tidak ada pengguna yang sesuai dengan filter.</div>}
                </div>

                <Pagination links={users.links} from={users.from} to={users.to} total={users.total} />
            </div>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader><DialogTitle className="flex items-center gap-2"><UserPlus className="size-5 text-primary" /> {editingUser ? 'Edit Pengguna' : 'Tambah Pengguna'}</DialogTitle><DialogDescription>Isi data akun dan hak akses pengguna.</DialogDescription></DialogHeader>
                    <form onSubmit={submitForm} className="space-y-4 text-xs">
                        <div className="space-y-1"><Label htmlFor="user-name">Nama Lengkap</Label><Input id="user-name" value={data.name} onChange={(event) => setData('name', event.target.value)} required />{error('name') && <p className="text-rose-500">{error('name')}</p>}</div>
                        <div className="space-y-1"><Label htmlFor="user-email">Email</Label><Input id="user-email" type="email" value={data.email} onChange={(event) => setData('email', event.target.value)} required />{error('email') && <p className="text-rose-500">{error('email')}</p>}</div>
                        <div className="space-y-1"><Label htmlFor="user-phone">Nomor Telepon</Label><Input id="user-phone" type="tel" inputMode="numeric" pattern="08[0-9]{8,13}" value={data.phone} onChange={(event) => setData('phone', event.target.value.replace(/\D/g, ''))} /></div>
                        <div className="space-y-1"><Label>Role</Label><Select value={data.role} onValueChange={(value) => setData('role', value as 'user' | 'admin')}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="user">User</SelectItem><SelectItem value="admin">Admin</SelectItem></SelectContent></Select>{error('role') && <p className="text-rose-500">{error('role')}</p>}</div>
                        <div className="space-y-1"><Label htmlFor="user-password">Password {editingUser && <span className="font-normal text-muted-foreground">(opsional)</span>}</Label><Input id="user-password" type="password" value={data.password} onChange={(event) => setData('password', event.target.value)} required={!editingUser} />{error('password') && <p className="text-rose-500">{error('password')}</p>}</div>
                        {data.role === 'admin' && <div className="space-y-2"><Label>Lapangan Ditugaskan</Label><div className="max-h-36 space-y-1 overflow-y-auto rounded-xl border border-border bg-muted/20 p-2">{lapangans.map((lapangan) => { const checked = data.lapangan_ids.includes(lapangan.id); return <button key={lapangan.id} type="button" onClick={() => toggleLapangan(lapangan.id)} className={`flex w-full items-center justify-between rounded-lg border p-2 text-left ${checked ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-muted-foreground'}`}><span>{lapangan.name}</span>{checked && <Check className="size-4" />}</button>; })}</div></div>}
                        <div className="flex gap-2 pt-2"><Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1">Batal</Button><Button type="submit" disabled={processing} className="flex-1">{processing ? 'Menyimpan...' : 'Simpan'}</Button></div>
                    </form>
                </DialogContent>
            </Dialog>
            <ProfileAvatarPreview
                open={previewUser !== null}
                imageUrl={previewUser?.avatarUrl ?? null}
                name={previewUser?.name ?? 'Pengguna'}
                onOpenChange={(open) => !open && setPreviewUser(null)}
            />
        </AppLayout>
    );
}

function SortableHeader({ label, column, sort, direction, onSort }: { label: string; column: string; sort: string; direction: string; onSort: (column: string) => void }) {
    const active = sort === column;
    return <th className="px-4 py-3"><button type="button" onClick={() => onSort(column)} className="inline-flex items-center gap-1 hover:text-foreground">{label}<span className="text-[10px]">{active ? direction === 'asc' ? '↑' : '↓' : '↕'}</span></button></th>;
}
