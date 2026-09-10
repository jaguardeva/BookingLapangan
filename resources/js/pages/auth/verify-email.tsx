import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { Mail, CheckCircle2, RefreshCw, LogOut, ArrowLeft, ShieldAlert } from 'lucide-react';
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

            <div className="flex flex-col gap-6">
                {/* Header Icon */}
                <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-500/20 shadow-sm">
                    <Mail className="size-8" />
                </div>

                {/* Status banner */}
                {status === 'verification-link-sent' && (
                    <div className="flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/40 p-4 text-xs text-emerald-800 dark:text-emerald-300">
                        <CheckCircle2 className="size-4 shrink-0 text-emerald-600 mt-0.5" />
                        <div>
                            <p className="font-semibold">Tautan Verifikasi Baru Terkirim!</p>
                            <p className="mt-0.5 text-emerald-700 dark:text-emerald-400">
                                Kami telah mengirimkan tautan verifikasi baru ke kotak masuk Anda.
                            </p>
                        </div>
                    </div>
                )}

                {/* Info Card */}
                <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm space-y-4 text-xs">
                    <div className="space-y-1 text-center">
                        <p className="text-muted-foreground leading-relaxed">
                            Terima kasih telah bergabung! Untuk keamanan akun Anda dan mengakses fitur sewa lapangan, silakan verifikasi email Anda terlebih dahulu.
                        </p>
                        {userEmail && (
                            <div className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-muted px-3 py-1 text-xs font-semibold text-foreground">
                                <Mail className="size-3.5 text-emerald-500" />
                                <span>{userEmail}</span>
                            </div>
                        )}
                    </div>

                    <div className="rounded-xl bg-muted/40 p-3 border border-border/50 text-xs text-muted-foreground space-y-1.5">
                        <p className="font-medium text-foreground flex items-center gap-1.5">
                            <ShieldAlert className="size-3.5 text-amber-500" /> Panduan:
                        </p>
                        <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
                            <li>Buka aplikasi email Anda dan cari pesan dari SportBooking.</li>
                            <li>Klik tombol <strong>Verify Email Address</strong> pada email tersebut.</li>
                            <li>Jika tidak menemukan email di Inbox, mohon periksa folder <strong>Spam</strong> atau <strong>Junk</strong>.</li>
                        </ul>
                    </div>

                    {/* Resend Action */}
                    <form onSubmit={handleResend} className="pt-2">
                        <Button
                            type="submit"
                            disabled={isResending || cooldown > 0}
                            className="w-full h-10 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-sm transition-all"
                        >
                            <RefreshCw className={`size-3.5 mr-2 ${isResending ? 'animate-spin' : ''}`} />
                            {isResending
                                ? 'Mengirim...'
                                : cooldown > 0
                                ? `Kirim Ulang (${cooldown}s)`
                                : 'Kirim Ulang Email Verifikasi'}
                        </Button>
                    </form>
                </div>

                {/* Footer Controls */}
                <div className="flex items-center justify-between text-xs px-1">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ArrowLeft className="size-3.5" /> Ke Beranda
                    </Link>

                    <button
                        type="button"
                        onClick={handleLogout}
                        className="inline-flex items-center gap-1.5 text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 font-medium transition-colors"
                    >
                        <LogOut className="size-3.5" /> Keluar (Log out)
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
