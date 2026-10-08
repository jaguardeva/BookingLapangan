import { Form, Head, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { Coins } from 'lucide-react';
import { toast } from 'sonner';
import { useCooldown } from '@/hooks/use-cooldown';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import DeleteUser from '@/components/delete-user';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { edit } from '@/routes/profile';
import type { Auth } from '@/types';
import { send } from '@/routes/verification';
import { ProfileAvatarUploader } from '@/components/profile-avatar-uploader';
import { ProfileCompletionReminder } from '@/components/profile-completion-reminder';
import type { ProfileCompletion, UserProfile } from '@/types';

type PageProps = {
    auth: Auth;
    profile?: UserProfile | null;
    profile_completion?: ProfileCompletion | null;
};

export default function Profile({
    mustVerifyEmail,
    status,
}: {
    mustVerifyEmail: boolean;
    status?: string;
}) {
    const { auth, profile, profile_completion } = usePage<PageProps>().props;
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
        <>
            <Head title="Pengaturan Profil" />

            <h1 className="sr-only">Pengaturan Profil</h1>

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="Profil"
                    description="Perbarui nama dan alamat email Anda"
                />

                <ProfileCompletionReminder completion={profile_completion} />

                <div className="border-border/70 bg-card rounded-xl border p-4">
                    <h2 className="mb-3 font-semibold">Foto profil</h2>
                    <ProfileAvatarUploader
                        name={auth.user.name}
                        avatar={auth.user.avatar}
                    />
                </div>

                <div className="border-primary/30 bg-primary/10 dark:bg-primary/5 rounded-xl border p-4">
                    <div className="flex items-start gap-3">
                        <div className="bg-primary text-primary-foreground rounded-lg p-2">
                            <Coins className="size-5" />
                        </div>
                        <div className="min-w-0 flex-1 space-y-2">
                            <div>
                                <h2 className="text-foreground font-semibold">
                                    Poin Booking
                                </h2>
                                <p className="text-muted-foreground text-sm">
                                    Poin diperoleh dari booking online yang
                                    selesai dan hanya dapat digunakan sebagai
                                    potongan harga booking.
                                </p>
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2">
                                <div>
                                    <p className="text-muted-foreground text-xs">
                                        Total Poin Terkumpul
                                    </p>
                                    <p className="text-primary dark:text-primary text-xl font-bold">
                                        {pointsBalance.toLocaleString('id-ID')}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-xs">
                                        Poin yang Bisa Digunakan
                                    </p>
                                    <p className="text-foreground text-xl font-bold">
                                        {availablePoints.toLocaleString(
                                            'id-ID',
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <Form
                    {...ProfileController.update.form()}
                    options={{
                        preserveScroll: true,
                    }}
                    className="space-y-6"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="name">Nama</Label>

                                <Input
                                    id="name"
                                    className="mt-1 block w-full"
                                    defaultValue={auth.user.name}
                                    name="name"
                                    required
                                    autoComplete="name"
                                    placeholder="Nama lengkap"
                                />

                                <InputError
                                    className="mt-2"
                                    message={errors.name}
                                />
                            </div>

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
                                    <Label htmlFor="city">Kota domisili</Label>
                                    <Input
                                        id="city"
                                        name="city"
                                        defaultValue={profile?.city ?? ''}
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

                            <div className="grid gap-2">
                                <Label htmlFor="email">Alamat email</Label>

                                <Input
                                    id="email"
                                    type="email"
                                    className="mt-1 block w-full"
                                    defaultValue={auth.user.email}
                                    name="email"
                                    required
                                    autoComplete="username"
                                    placeholder="Alamat email"
                                />

                                <InputError
                                    className="mt-2"
                                    message={errors.email}
                                />
                            </div>

                            {mustVerifyEmail &&
                                auth.user.email_verified_at === null && (
                                    <div>
                                        <p className="text-muted-foreground -mt-4 text-sm">
                                            Alamat email Anda belum
                                            diverifikasi.{' '}
                                            <button
                                                type="button"
                                                onClick={handleResendEmail}
                                                disabled={
                                                    isResending || cooldown > 0
                                                }
                                                className="text-foreground underline decoration-neutral-300 underline-offset-4 transition-all duration-300 ease-out hover:decoration-current! disabled:cursor-not-allowed disabled:opacity-60 dark:decoration-neutral-500"
                                            >
                                                {isResending
                                                    ? 'Mengirim...'
                                                    : cooldown > 0
                                                      ? `Kirim ulang email verifikasi (${cooldown}s)`
                                                      : 'Klik di sini untuk mengirim ulang email verifikasi.'}
                                            </button>
                                        </p>

                                        {(status === 'verification-link-sent' ||
                                            status ===
                                                'verification-otp-sent') && (
                                            <div className="mt-2 text-sm font-medium text-green-600">
                                                Email verifikasi baru telah
                                                dikirim ke alamat email Anda.
                                            </div>
                                        )}
                                    </div>
                                )}

                            <div className="flex items-center gap-4">
                                <Button
                                    disabled={processing}
                                    data-test="update-profile-button"
                                >
                                    Simpan
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </div>

            <DeleteUser />
        </>
    );
}

Profile.layout = {
    breadcrumbs: [
        {
            title: 'Pengaturan Profil',
            href: edit(),
        },
    ],
};
