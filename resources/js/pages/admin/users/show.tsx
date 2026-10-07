import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import { ArrowLeft, CalendarDays, CheckCircle2, Clock3, Mail, MapPin, Phone, Wallet, XCircle } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ProfileAvatarPreview } from '@/components/profile-avatar-preview';
import { useInitials } from '@/hooks/use-initials';
import { index as usersIndex } from '@/routes/admin/users';

type UserDetail = {
    id: string; name: string; email: string; role: 'user' | 'admin'; email_verified_at: string | null;
    created_at: string; updated_at: string; profile?: { phone: string | null; avatar_path: string | null; city: string | null; date_of_birth: string | null; gender: string | null; favorite_sports: string[]; preferred_playing_time: string | null } | null;
    assigned_lapangans?: { id: string; name: string }[];
};
type Summary = { total: number; approved: number; pending: number; cancelled_or_rejected: number; approved_spending: number; latest: { booking_code: string; payment_status: string; total_price: number; booking_date: string; lapangan?: { name: string } } | null };

export default function UserShow({ user, summary, latestReview, avatarUrl }: { user: UserDetail; summary: Summary; latestReview?: { rating: number; comment: string | null } | null; avatarUrl?: string | null }) {
    const initials = useInitials();
    const avatar = avatarUrl ?? undefined;
    const [previewOpen, setPreviewOpen] = useState(false);
    return <AppLayout breadcrumbs={[{ title: 'Kelola Pengguna', href: usersIndex() }, { title: user.name, href: '#' }]}> 
        <Head title={`Detail ${user.name}`} />
        <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3"><div><Link href={usersIndex()} className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Kembali</Link><h1 className="text-2xl font-bold">Detail Pengguna</h1></div><Button asChild variant="outline"><Link href={usersIndex()}>Kelola akun</Link></Button></div>
            <section className="flex flex-wrap items-center gap-4 rounded-2xl border border-border/80 bg-card p-5">{avatar ? <button type="button" className="cursor-zoom-in rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" onClick={() => setPreviewOpen(true)} aria-label={`Lihat foto profil ${user.name}`}><Avatar className="size-20"><AvatarImage src={avatar} alt={user.name} /><AvatarFallback>{initials(user.name)}</AvatarFallback></Avatar></button> : <Avatar className="size-20"><AvatarFallback>{initials(user.name)}</AvatarFallback></Avatar>}<div><h2 className="text-xl font-bold">{user.name}</h2><p className="text-sm text-muted-foreground">{user.email}</p><Badge variant="outline" className="mt-2 capitalize">{user.role}</Badge></div></section>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">{[['Total booking', summary.total], ['Approved', summary.approved], ['Pending', summary.pending], ['Batal/ditolak', summary.cancelled_or_rejected], ['Pengeluaran approved', `Rp ${summary.approved_spending.toLocaleString('id-ID')}`]].map(([label, value]) => <div key={String(label)} className="rounded-2xl border border-border/80 bg-card p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-2 text-xl font-bold">{value}</p></div>)}</div>
            <div className="grid gap-6 lg:grid-cols-2">
                <section className="rounded-2xl border border-border/80 bg-card p-5"><h2 className="mb-4 text-lg font-bold">Informasi profil</h2><div className="grid gap-3 text-sm"><Info icon={<Mail />} label="Email" value={`${user.email}${user.email_verified_at ? ' (terverifikasi)' : ' (belum terverifikasi)'}`} /><Info icon={<Phone />} label="Telepon" value={user.profile?.phone} /><Info icon={<MapPin />} label="Kota" value={user.profile?.city} /><Info icon={<CalendarDays />} label="Tanggal lahir" value={user.profile?.date_of_birth} /><Info icon={<Wallet />} label="Olahraga favorit" value={user.profile?.favorite_sports?.join(', ')} /><Info icon={<Clock3 />} label="Waktu bermain" value={user.profile?.preferred_playing_time} /></div></section>
                <section className="rounded-2xl border border-border/80 bg-card p-5"><h2 className="mb-4 text-lg font-bold">Booking terakhir</h2>{summary.latest ? <div className="space-y-2 text-sm"><p className="font-semibold">#{summary.latest.booking_code}</p><p className="text-muted-foreground">{summary.latest.lapangan?.name ?? '-'} · {summary.latest.booking_date}</p><p>Rp {summary.latest.total_price.toLocaleString('id-ID')} · <Badge>{summary.latest.payment_status}</Badge></p></div> : <div className="flex items-center gap-2 text-sm text-muted-foreground"><XCircle className="size-4" /> Belum ada booking.</div>}{latestReview && <div className="mt-6 border-t pt-4 text-sm"><p className="font-semibold">Review terakhir · {latestReview.rating}/5</p><p className="mt-1 text-muted-foreground">{latestReview.comment || 'Tidak ada komentar.'}</p></div>}</section>
            </div>
            {user.role === 'admin' && <section className="rounded-2xl border border-border/80 bg-card p-5"><h2 className="mb-3 text-lg font-bold">Lapangan ditugaskan</h2><p className="text-sm text-muted-foreground">{user.assigned_lapangans?.map((lapangan) => lapangan.name).join(', ') || 'Belum ada lapangan ditugaskan.'}</p></section>}
        </div>
        <ProfileAvatarPreview open={previewOpen} imageUrl={avatarUrl ?? null} name={user.name} onOpenChange={setPreviewOpen} />
    </AppLayout>;
}

function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string | null }) { return <div className="flex items-center gap-3"><span className="text-muted-foreground">{icon}</span><span className="w-32 text-muted-foreground">{label}</span><span>{value || '-'}</span></div>; }
