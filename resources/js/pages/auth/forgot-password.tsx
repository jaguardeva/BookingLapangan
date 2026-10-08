// Components
import { Form, Head } from '@inertiajs/react';
import { useEffect } from 'react';
import { LoaderCircle } from 'lucide-react';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCooldown } from '@/hooks/use-cooldown';
import { login } from '@/routes';
import { email } from '@/routes/password';

export default function ForgotPassword({ status }: { status?: string }) {
    const { cooldown, startCooldown } = useCooldown(
        'cooldown_forgot_password',
        0,
        60,
    );

    useEffect(() => {
        if (status) {
            startCooldown(60);
        }
    }, [status, startCooldown]);

    return (
        <>
            <Head title="Lupa Kata Sandi" />

            {status && (
                <div
                    role="status"
                    className="mb-5 rounded-md border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300"
                >
                    {status}
                </div>
            )}

            <div className="space-y-5">
                <Form
                    {...email.form()}
                    onSuccess={() => startCooldown(60)}
                    className="space-y-5"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="email">Alamat email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    autoComplete="email"
                                    autoFocus
                                    placeholder="nama@email.com"
                                    className="bg-background h-11 rounded-lg"
                                />

                                <InputError message={errors.email} />
                            </div>

                            <Button
                                className="h-11 w-full rounded-lg font-medium"
                                disabled={processing || cooldown > 0}
                                data-test="email-password-reset-link-button"
                            >
                                {processing ? (
                                    <LoaderCircle className="h-4 w-4 animate-spin" />
                                ) : cooldown > 0 ? (
                                    `Kirim tautan reset (${cooldown}s)`
                                ) : (
                                    'Kirim tautan reset kata sandi'
                                )}
                            </Button>
                        </>
                    )}
                </Form>

                <div className="text-muted-foreground space-x-1 text-center text-sm">
                    <span>Atau, kembali ke</span>
                    <TextLink href={login()}>halaman masuk</TextLink>
                </div>
            </div>
        </>
    );
}

ForgotPassword.layout = {
    title: 'Lupa Kata Sandi',
    description: 'Masukkan email untuk menerima tautan reset kata sandi',
};
