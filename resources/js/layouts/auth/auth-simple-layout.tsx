import { Link, usePage } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    const { name } = usePage().props as { name?: string };
    const appName = name ?? 'SportBooking';

    return (
        <div className="flex min-h-svh flex-col bg-background">
            <header className="flex justify-center px-5 py-6 sm:py-8">
                <Link
                    href={home()}
                    className="inline-flex items-center gap-2.5 text-sm font-semibold tracking-tight text-foreground"
                >
                    <span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                        <AppLogoIcon className="size-5 fill-current" />
                    </span>
                    {appName}
                </Link>
            </header>

            <main className="flex flex-1 items-center justify-center px-4 pb-10 sm:px-6">
                <div className="w-full max-w-md">
                    <div className="mb-6 space-y-1.5 text-center">
                        <h1 className="text-2xl font-semibold tracking-tight">
                            {title}
                        </h1>
                        <p className="text-sm leading-relaxed text-muted-foreground">
                            {description}
                        </p>
                    </div>

                    <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
                        {children}
                    </section>
                </div>
            </main>
        </div>
    );
}
