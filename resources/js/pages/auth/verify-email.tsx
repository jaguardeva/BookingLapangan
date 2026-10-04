import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { ArrowLeft, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Props {
    status?: string;
}

export default function VerifyEmail({ status }: Props) {
    const { auth } = usePage<{ auth: { user: { email?: string; name?: string } | null } }>().props;
    const userEmail = auth?.user?.email;

    const [isResending, setIsResending] = useState(false);
    const [cooldown, setCooldown] = useState(0);

    const handleResend = (e: React.FormEvent) => {
        e.preventDefault();
        if (isResending || cooldown > 0) return;

        setIsResending(true);
        router.post(
            '/email/verification-notification',
            {},
            {
                onSuccess: () => {
                    setIsResending(false);
                    toast.success('Tautan verifikasi baru berhasil dikirim ke email Anda!');
                    setCooldown(60);
                    const timer = setInterval(() => {
                        setCooldown((prev) => {
                            if (prev <= 1) {
                                clearInterval(timer);
                                return 0;
                            }
                            return prev - 1;
                        });
                    }, 1000);
                },
                onError: () => {
                    setIsResending(false);
                    toast.error('Gagal mengirim ulang email verifikasi. Coba beberapa saat lagi.');
                },
            }
        );
    };

    const handleLogout = () => {
        router.post('/logout');
    };

    return (
        <>
            <Head title="Verifikasi Email - SportBooking" />

            <div className="space-y-5">
                {status === 'verification-link-sent' && (
                    <div
                        role="status"
                        className="rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-sm"
                    >
                        Tautan verifikasi baru telah dikirim.
                    </div>
                )}

                <p className="text-sm leading-relaxed text-muted-foreground">
                    Periksa kotak masuk atau folder spam untuk tautan verifikasi.
                </p>

                {userEmail && (
                    <div className="grid gap-1 rounded-md bg-muted px-3 py-2 text-sm">
                        <span className="text-xs text-muted-foreground">Email</span>
                        <span className="break-all font-medium text-foreground">
                            {userEmail}
                        </span>
                    </div>
                )}

                <form onSubmit={handleResend}>
                    <Button
                        type="submit"
                        disabled={isResending || cooldown > 0}
                        className="h-11 w-full rounded-lg font-medium"
                    >
                        {isResending
                            ? 'Mengirim...'
                            : cooldown > 0
                              ? `Kirim ulang (${cooldown}s)`
                              : 'Kirim ulang email verifikasi'}
                    </Button>
                </form>

                <div className="flex items-center justify-between border-t border-border pt-4 text-sm">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
                    >
                        <ArrowLeft className="size-4" /> Ke beranda
                    </Link>

                    <button
                        type="button"
                        onClick={handleLogout}
                        className="inline-flex items-center gap-1.5 font-medium text-rose-500 transition-colors hover:text-rose-600 dark:hover:text-rose-400"
                    >
                        <LogOut className="size-4" /> Keluar
                    </button>
                </div>
            </div>
        </>
    );
}

VerifyEmail.layout = {
    title: 'Verifikasi Email Anda',
    description: 'Satu langkah lagi untuk mulai menyewa lapangan olahraga.',
};
