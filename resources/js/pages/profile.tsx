import { Form, Head, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useCooldown } from '@/hooks/use-cooldown';
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
import { PointsCard } from '@/components/points-card';
import type { ProfileCompletion, UserProfile } from '@/types';
import type { Auth } from '@/types';

type PointTransaction = {
    id: string;
    type: 'earned' | 'redeemed';
    points: number;
    balance_after: number;
    created_at: string;
};

type PointStats = {
    total_earned: number;
    total_redeemed: number;
    recent_transactions: PointTransaction[];
};

type PageProps = {
    auth: Auth;
    profile?: UserProfile | null;
    profile_completion?: ProfileCompletion | null;
    point_stats?: PointStats | null;
};
type ProfileProps = { mustVerifyEmail: boolean; status?: string };

export default function Profile({ mustVerifyEmail, status }: ProfileProps) {
    const { auth, profile, profile_completion, point_stats } = usePage<PageProps>().props;
    const pointsBalance = auth.user.points_balance ?? 0;
    const availablePoints = auth.user.available_points ?? pointsBalance;

    const [isResending, setIsResending] = useState(false);
    const userKey = auth?.user?.id
        ? `cooldown_verify_email_${auth.user.id}`
        : 'cooldown_verify_email';
    const { cooldown, startCooldown } = useCooldown(userKey, 0, 60);

    const handleResendEmail = () => {
        if (isResending || cooldown > 0) return;
        setIsResending(true);
        router.post(
            send.url(),
            {},
            {
                onSuccess: () => {
                    setIsResending(false);
                    toast.success('Email verifikasi baru berhasil dikirim!');
                    startCooldown(60);
                },
                onError: (errors) => {
                    setIsResending(false);
                    const errorMessage =
                        errors && typeof errors === 'object' && 'code' in errors
                            ? (errors.code as string)
                            : 'Gagal mengirim email verifikasi. Coba beberapa saat lagi.';
                    toast.error(errorMessage);
                },
            },
        );
    };

    return (
        <PublicLayout>
            <Head title="Profil Saya" />
            <main className="public-container max-w-3xl py-10">
                <div className="mb-8 space-y-2">
                    <p className="text-primary dark:text-primary text-sm font-semibold">
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
                    <ProfileCompletionReminder
                        completion={profile_completion}
                    />
                    <section className="border-border/70 bg-card rounded-2xl border p-5 shadow-sm sm:p-6">
                        <h2 className="mb-4 text-lg font-bold">Foto profil</h2>
                        <ProfileAvatarUploader
                            name={auth.user.name}
                            avatar={auth.user.avatar}
                        />
                    </section>
                    <PointsCard
                        pointsBalance={pointsBalance}
                        availablePoints={availablePoints}
                        stats={point_stats}
                    />

                    <section className="border-border/70 bg-card rounded-2xl border p-5 shadow-sm sm:p-6">
                        <div className="mb-6 space-y-1">
                            <h2 className="text-foreground text-lg font-bold">
                                Informasi Akun
                            </h2>
                            <p className="text-muted-foreground text-sm">
                                Nama dapat diperbarui kapan saja. Alamat email
                                dikunci demi keamanan akun; hubungi admin atau
                                dukungan jika perlu mengubahnya.
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
                                                <button
                                                    type="button"
                                                    onClick={handleResendEmail}
                                                    disabled={
                                                        isResending ||
                                                        cooldown > 0
                                                    }
                                                    className="font-semibold underline underline-offset-4 transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
                                                >
                                                    {isResending
                                                        ? 'Mengirim...'
                                                        : cooldown > 0
                                                          ? `Kirim ulang email verifikasi (${cooldown}s)`
                                                          : 'Kirim ulang email verifikasi'}
                                                </button>
                                                {(status ===
                                                    'verification-link-sent' ||
                                                    status ===
                                                        'verification-otp-sent') && (
                                                    <p className="mt-2 font-medium text-green-600">
                                                        Email verifikasi baru
                                                        telah dikirim.
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    <div className="grid gap-2">
                                        <Label htmlFor="phone">
                                            Nomor WhatsApp/telepon
                                        </Label>
                                        <Input
                                            id="phone"
                                            name="phone"
                                            type="tel"
                                            inputMode="numeric"
                                            pattern="08[0-9]{8,13}"
                                            defaultValue={profile?.phone ?? ''}
                                            onInput={(event) => {
                                                event.currentTarget.value =
                                                    event.currentTarget.value.replace(
                                                        /\D/g,
                                                        '',
                                                    );
                                            }}
                                            placeholder="08xxxxxxxxxx"
                                        />
                                        <InputError message={errors.phone} />
                                    </div>
                                    <div className="grid gap-2 sm:grid-cols-2">
                                        <div className="grid gap-2">
                                            <Label htmlFor="city">
                                                Kota domisili
                                            </Label>
                                            <Input
                                                id="city"
                                                name="city"
                                                defaultValue={
                                                    profile?.city ?? ''
                                                }
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="date_of_birth">
                                                Tanggal lahir
                                            </Label>
                                            <Input
                                                id="date_of_birth"
                                                name="date_of_birth"
                                                type="date"
                                                defaultValue={
                                                    profile?.date_of_birth ?? ''
                                                }
                                            />
                                        </div>
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
