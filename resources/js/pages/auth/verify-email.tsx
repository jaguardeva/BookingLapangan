import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { ArrowLeft, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useCooldown } from '@/hooks/use-cooldown';
import { logout } from '@/routes';
import { send, verify } from '@/routes/verification';

interface Props {
    status?: string;
    resendCooldown?: number;
}

export default function VerifyEmail({ status, resendCooldown = 0 }: Props) {
    const { auth } = usePage<{
        auth: { user: { id?: number; email?: string; name?: string } | null };
    }>().props;
    const userEmail = auth?.user?.email;
    const userKey = auth?.user?.id
        ? `cooldown_verify_email_${auth.user.id}`
        : 'cooldown_verify_email';

    const [isResending, setIsResending] = useState(false);
    const [code, setCode] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const { cooldown, startCooldown } = useCooldown(
        userKey,
        resendCooldown,
        60,
    );

    const handleVerify = (e: React.FormEvent) => {
        e.preventDefault();
        if (isVerifying || code.length !== 6) return;

        setIsVerifying(true);
        router.post(
            verify.url(),
            { code },
            {
                onFinish: () => setIsVerifying(false),
            },
        );
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
                    toast.success(
                        'Kode OTP baru berhasil dikirim ke email Anda!',
                    );
                    startCooldown(60);
                },
                onError: (errors) => {
                    setIsResending(false);
                    const errorMessage =
                        errors && typeof errors === 'object' && 'code' in errors
                            ? (errors.code as string)
                            : 'Gagal mengirim kode OTP. Coba beberapa saat lagi.';
                    toast.error(errorMessage);
                },
            },
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
                        className="border-primary/20 bg-primary/5 rounded-md border px-3 py-2 text-sm"
                    >
                        Kode OTP baru telah dikirim ke email Anda.
                    </div>
                )}

                <p className="text-muted-foreground text-sm leading-relaxed">
                    Masukkan kode OTP 6 digit yang dikirim ke email Anda. Kode
                    berlaku selama 10 menit.
                </p>

                {userEmail && (
                    <div className="bg-muted grid gap-1 rounded-md px-3 py-2 text-sm">
                        <span className="text-muted-foreground text-xs">
                            Email
                        </span>
                        <span className="text-foreground font-medium break-all">
                            {userEmail}
                        </span>
                    </div>
                )}

                <form onSubmit={handleVerify} className="space-y-3">
                    <label
                        htmlFor="verification-code"
                        className="text-foreground text-sm font-medium"
                    >
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
                        onChange={(event) =>
                            setCode(
                                event.target.value
                                    .replace(/\D/g, '')
                                    .slice(0, 6),
                            )
                        }
                        placeholder="000000"
                        className="border-input bg-background text-foreground focus:border-primary focus:ring-primary/20 h-12 w-full rounded-lg border px-4 text-center text-xl font-semibold tracking-[0.45em] transition outline-none focus:ring-2"
                        aria-describedby="verification-code-help"
                    />
                    <p
                        id="verification-code-help"
                        className="text-muted-foreground text-xs"
                    >
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

                <div className="border-border flex items-center justify-between border-t pt-4 text-sm">
                    <Link
                        href="/"
                        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 transition-colors"
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
