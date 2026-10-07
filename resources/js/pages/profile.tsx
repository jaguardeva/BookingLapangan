import { Form, Head, Link, usePage } from '@inertiajs/react';
import { Coins } from 'lucide-react';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import DeleteUser from '@/components/delete-user';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PublicLayout } from '@/layouts/public-layout';
import { edit } from '@/routes/profile';
import { send } from '@/routes/verification';
import { ProfileAvatarUploader } from '@/components/profile-avatar-uploader';
import { ProfileCompletionReminder } from '@/components/profile-completion-reminder';
import type { ProfileCompletion, UserProfile } from '@/types';
import type { Auth } from '@/types';

type PageProps = { auth: Auth; profile?: UserProfile | null; profile_completion?: ProfileCompletion | null };
type ProfileProps = { mustVerifyEmail: boolean; status?: string };

export default function Profile({ mustVerifyEmail, status }: ProfileProps) {
    const { auth, profile, profile_completion } = usePage<PageProps>().props;
    const pointsBalance = auth.user.points_balance ?? 0;
    const availablePoints = auth.user.available_points ?? pointsBalance;

    return (
        <PublicLayout>
            <Head title="Profil Saya" />
            <main className="public-container max-w-3xl py-10">
                <div className="mb-8 space-y-2">
                    <p className="text-sm font-semibold text-primary dark:text-primary">
                        Area Anggota
                    </p>
                    <h1 className="text-foreground text-3xl font-black tracking-tight">
                        Profil Saya
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        Kelola akun dan hadiah booking Anda.
                    </p>
                </div>

                <div className="space-y-8">
                    <ProfileCompletionReminder completion={profile_completion} />
                    <section className="border-border/70 bg-card rounded-2xl border p-5 shadow-sm sm:p-6">
                        <h2 className="mb-4 text-lg font-bold">Foto profil</h2>
                        <ProfileAvatarUploader name={auth.user.name} avatar={auth.user.avatar} />
                    </section>
                    <section className="rounded-2xl border border-primary/30 bg-primary/10 p-5 dark:bg-primary/5">
                        <div className="flex items-start gap-4">
                            <div className="rounded-xl bg-primary p-3 text-primary-foreground shadow-sm">
                                <Coins className="size-6" />
                            </div>
                            <div className="min-w-0 flex-1 space-y-4">
                                <div>
                                    <h2 className="text-foreground font-bold">
                                        Poin Booking
                                    </h2>
                                    <p className="text-muted-foreground mt-1 text-sm">
                                        Dapatkan poin dari booking online yang
                                        selesai dan gunakan untuk potongan harga
                                        booking online berikutnya.
                                    </p>
                                </div>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <p className="text-muted-foreground text-xs">
                                            Total Poin Terkumpul
                                        </p>
                                        <p className="mt-1 text-2xl font-black text-primary dark:text-primary">
                                            {pointsBalance.toLocaleString(
                                                'id-ID',
                                            )}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground text-xs">
                                            Poin yang Bisa Digunakan
                                        </p>
                                        <p className="text-foreground mt-1 text-2xl font-black">
                                            {availablePoints.toLocaleString(
                                                'id-ID',
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="border-border/70 bg-card rounded-2xl border p-5 shadow-sm sm:p-6">
                        <div className="mb-6 space-y-1">
                            <h2 className="text-foreground text-lg font-bold">
                                Informasi Akun
                            </h2>
                            <p className="text-muted-foreground text-sm">
                        Nama dapat diperbarui kapan saja. Alamat email dikunci
                        demi keamanan akun; hubungi admin atau dukungan jika
                        perlu mengubahnya.
                            </p>
                        </div>

                        <Form
                            {...ProfileController.update.form()}
                            options={{ preserveScroll: true }}
                            className="space-y-6"
                        >
                            {({ processing, errors }) => (
                                <>
                                    <div className="grid gap-2">
                                        <Label htmlFor="name">Nama</Label>
                                        <Input
                                            id="name"
                                            defaultValue={auth.user.name}
                                            name="name"
                                            required
                                            autoComplete="name"
                                            placeholder="Nama lengkap"
                                        />
                                        <InputError message={errors.name} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="email">
                                            Alamat email
                                        </Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            defaultValue={auth.user.email}
                                            required
                                            autoComplete="username"
                                            placeholder="Alamat email"
                                            disabled
                                            readOnly
                                        />
                                        <p className="text-muted-foreground text-xs">
                                            Alamat email tidak dapat diubah
                                            sendiri.
                                        </p>
                                    </div>
                                    {mustVerifyEmail &&
                                        auth.user.email_verified_at ===
                                            null && (
                                            <div className="rounded-xl bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-300">
                                                Alamat email Anda belum
                                                diverifikasi.{' '}
                                                <Link
                                                    href={send()}
                                                    as="button"
                                                    className="font-semibold underline underline-offset-4"
                                                >
                                                    Kirim ulang email verifikasi
                                                </Link>
                                                {status ===
                                                    'verification-link-sent' && (
                                                    <p className="mt-2 font-medium text-green-600">
                                                        Tautan verifikasi baru
                                                        telah dikirim.
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    <div className="grid gap-2">
                                        <Label htmlFor="phone">Nomor WhatsApp/telepon</Label>
                                        <Input id="phone" name="phone" type="tel" inputMode="numeric" pattern="08[0-9]{8,13}" defaultValue={profile?.phone ?? ''} onInput={(event) => { event.currentTarget.value = event.currentTarget.value.replace(/\D/g, ''); }} placeholder="08xxxxxxxxxx" />
                                        <InputError message={errors.phone} />
                                    </div>
                                    <div className="grid gap-2 sm:grid-cols-2">
                                        <div className="grid gap-2"><Label htmlFor="city">Kota domisili</Label><Input id="city" name="city" defaultValue={profile?.city ?? ''} /></div>
                                        <div className="grid gap-2"><Label htmlFor="date_of_birth">Tanggal lahir</Label><Input id="date_of_birth" name="date_of_birth" type="date" defaultValue={profile?.date_of_birth ?? ''} /></div>
                                    </div>
                                    <Button disabled={processing}>
                                        {processing
                                            ? 'Menyimpan...'
                                            : 'Simpan perubahan'}
                                    </Button>
                                </>
                            )}
                        </Form>
                    </section>

                    <DeleteUser />
                </div>
            </main>
        </PublicLayout>
    );
}

Profile.layout = {
    breadcrumbs: [{ title: 'Profil Saya', href: edit() }],
};
