import { Form, Head } from '@inertiajs/react';
import { useRef } from 'react';
import SecurityController from '@/actions/App/Http/Controllers/Settings/SecurityController';
import ManagePasskeys, {
    type Props as ManagePasskeysProps,
} from '@/components/manage-passkeys';
import ManageTwoFactor, {
    type Props as ManageTwoFactorProps,
} from '@/components/manage-two-factor';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { PublicLayout } from '@/layouts/public-layout';
import { edit } from '@/routes/security';

type Props = {
    passwordRules: string;
} & ManagePasskeysProps &
    ManageTwoFactorProps;

export default function Security(props: Props) {
    const passwordInput = useRef<HTMLInputElement>(null);
    const currentPasswordInput = useRef<HTMLInputElement>(null);

    return (
        <PublicLayout>
            <Head title="Keamanan Akun" />
            <main className="public-container max-w-3xl py-10">
                <div className="mb-8 space-y-2">
                    <p className="text-sm font-semibold text-primary dark:text-primary">
                        Area Anggota
                    </p>
                    <h1 className="text-foreground text-3xl font-black tracking-tight">
                        Keamanan Akun
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        Kelola kata sandi dan metode keamanan akun Anda.
                    </p>
                </div>

                <div className="space-y-10">
                    <section className="border-border/70 bg-card rounded-2xl border p-5 shadow-sm sm:p-6">
                        <div className="mb-6 space-y-1">
                            <h2 className="text-foreground text-lg font-bold">
                                Perbarui Kata Sandi
                            </h2>
                            <p className="text-muted-foreground text-sm">
                                Gunakan kata sandi panjang dan acak untuk menjaga keamanan akun.
                            </p>
                        </div>

                        <Form
                            {...SecurityController.update.form()}
                            options={{ preserveScroll: true }}
                            resetOnError={[
                                'password',
                                'password_confirmation',
                                'current_password',
                            ]}
                            resetOnSuccess
                            onError={(errors) => {
                                if (errors.password) {
                                    passwordInput.current?.focus();
                                }

                                if (errors.current_password) {
                                    currentPasswordInput.current?.focus();
                                }
                            }}
                            className="space-y-6"
                        >
                            {({ errors, processing }) => (
                                <>
                                    <div className="grid gap-2">
                                        <Label htmlFor="current_password">
                                            Kata sandi saat ini
                                        </Label>
                                        <PasswordInput
                                            id="current_password"
                                            ref={currentPasswordInput}
                                            name="current_password"
                                            autoComplete="current-password"
                                            placeholder="Kata sandi saat ini"
                                        />
                                        <InputError message={errors.current_password} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="password">
                                            Kata sandi baru
                                        </Label>
                                        <PasswordInput
                                            id="password"
                                            ref={passwordInput}
                                            name="password"
                                            autoComplete="new-password"
                                            placeholder="Kata sandi baru"
                                            passwordrules={props.passwordRules}
                                        />
                                        <InputError message={errors.password} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="password_confirmation">
                                            Konfirmasi kata sandi
                                        </Label>
                                        <PasswordInput
                                            id="password_confirmation"
                                            name="password_confirmation"
                                            autoComplete="new-password"
                                            placeholder="Konfirmasi kata sandi"
                                            passwordrules={props.passwordRules}
                                        />
                                        <InputError message={errors.password_confirmation} />
                                    </div>
                                    <Button disabled={processing}>
                                        {processing ? 'Menyimpan...' : 'Simpan kata sandi'}
                                    </Button>
                                </>
                            )}
                        </Form>
                    </section>

                    <ManageTwoFactor
                        canManageTwoFactor={props.canManageTwoFactor}
                        requiresConfirmation={props.requiresConfirmation}
                        twoFactorEnabled={props.twoFactorEnabled}
                    />
                    <ManagePasskeys
                        canManagePasskeys={props.canManagePasskeys}
                        passkeys={props.passkeys}
                    />
                </div>
            </main>
        </PublicLayout>
    );
}

Security.layout = {
    breadcrumbs: [{ title: 'Keamanan Akun', href: edit() }],
};
