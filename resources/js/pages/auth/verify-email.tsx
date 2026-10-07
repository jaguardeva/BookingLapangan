import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { ArrowLeft, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { logout } from '@/routes';
import { send, verify } from '@/routes/verification';

interface Props {
    status?: string;
}

export default function VerifyEmail({ status }: Props) {
    const { auth } = usePage<{ auth: { user: { email?: string; name?: string } | null } }>().props;
    const userEmail = auth?.user?.email;

    const [isResending, setIsResending] = useState(false);
    const [code, setCode] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [cooldown, setCooldown] = useState(0);

    const handleVerify = (e: React.FormEvent) => {
        e.preventDefault();
        if (isVerifying || code.length !== 6) return;

        setIsVerifying(true);
        router.post(verify.url(), { code }, {
            onFinish: () => setIsVerifying(false),
        });
    };

    const handleResend = (e: React.FormEvent) => {
        e.preventDefault();
        if (isResending || cooldown > 0) return;

        setIsResending(true);
        router.post(
            send.url(),
            {},
            {
                onSuccess: () => {
                    setIsResending(false);
                    toast.success('Kode OTP baru berhasil dikirim ke email Anda!');
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
                    toast.error('Gagal mengirim kode OTP. Coba beberapa saat lagi.');
                },
            }
        );
    };

    const handleLogout = () => {
        router.post(logout.url());
    };

    return (
        <>
            <Head title="Verifikasi Email" />

            <div className="space-y-5">
                {status === 'verification-otp-sent' && (
                    <div
                        role="status"
                        className="rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-sm"
                    >
                        Kode OTP baru telah dikirim ke email Anda.
                    </div>
                )}

                <p className="text-sm leading-relaxed text-muted-foreground">
                    Masukkan kode OTP 6 digit yang dikirim ke email Anda. Kode berlaku selama 10 menit.
                </p>

                {userEmail && (
                    <div className="grid gap-1 rounded-md bg-muted px-3 py-2 text-sm">
                        <span className="text-xs text-muted-foreground">Email</span>
                        <span className="break-all font-medium text-foreground">
                            {userEmail}
                        </span>
                    </div>
                )}

                <form onSubmit={handleVerify} className="space-y-3">
                    <label htmlFor="verification-code" className="text-sm font-medium text-foreground">
                        Kode OTP
                    </label>
                    <input
                        id="verification-code"
                        name="code"
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        pattern="[0-9]{6}"
                        maxLength={6}
                        value={code}
                        onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="000000"
                        className="h-12 w-full rounded-lg border border-input bg-background px-4 text-center text-xl font-semibold tracking-[0.45em] text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                        aria-describedby="verification-code-help"
                    />
                    <p id="verification-code-help" className="text-xs text-muted-foreground">
                        Kode hanya dapat digunakan satu kali.
                    </p>
                    <Button
                        type="submit"
                        disabled={isVerifying || code.length !== 6}
                        className="h-11 w-full rounded-lg font-medium"
                    >
                        {isVerifying ? 'Memverifikasi...' : 'Verifikasi email'}
                    </Button>
                </form>

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
                              : 'Kirim ulang kode OTP'}
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
