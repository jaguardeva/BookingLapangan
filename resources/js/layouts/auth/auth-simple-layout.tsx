import { Link, usePage } from '@inertiajs/react';
import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';
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
        <div className="bg-muted/30 min-h-svh lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(420px,0.95fr)]">
            <section className="relative hidden overflow-hidden bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-500 p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
                <div className="pointer-events-none absolute -top-32 -right-32 size-96 rounded-full bg-white/10 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-40 -left-24 size-96 rounded-full bg-teal-300/20 blur-3xl" />

                <Link href={home()} className="relative z-10 flex items-center gap-3 text-lg font-semibold tracking-tight">
                    <span className="flex size-11 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25 backdrop-blur-sm">
                        <AppLogoIcon className="size-7 fill-current" />
                    </span>
                    {appName}
                </Link>

                <div className="relative z-10 max-w-xl space-y-8">
                    <div className="space-y-5">
                        <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-semibold tracking-wide text-emerald-50 backdrop-blur-sm">
                            <Sparkles className="size-3.5" />
                            Your game, your time
                        </span>
                        <h2 className="text-4xl leading-tight font-bold tracking-tight xl:text-5xl">
                            Every match starts with a better booking experience.
                        </h2>
                        <p className="max-w-md text-base leading-relaxed text-emerald-50/85">
                            Discover courts, invite your team, and keep every reservation in one simple place.
                        </p>
                    </div>

                    <div className="grid max-w-lg grid-cols-2 gap-3">
                        <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                            <CheckCircle2 className="mb-3 size-5 text-emerald-100" />
                            <p className="text-sm font-semibold">Easy reservations</p>
                            <p className="mt-1 text-xs text-emerald-50/70">Book in just a few clicks.</p>
                        </div>
                        <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                            <ShieldCheck className="mb-3 size-5 text-emerald-100" />
                            <p className="text-sm font-semibold">Secure account</p>
                            <p className="mt-1 text-xs text-emerald-50/70">Your data stays protected.</p>
                        </div>
                    </div>
                </div>

                <p className="relative z-10 text-xs text-emerald-50/65">© {appName}. Play more, plan less.</p>
            </section>

            <main className="flex min-h-svh items-center justify-center px-5 py-10 sm:px-8 lg:px-12">
                <div className="w-full max-w-md">
                    <div className="mb-8 flex items-center justify-between lg:hidden">
                        <Link href={home()} className="flex items-center gap-2.5 font-semibold tracking-tight">
                            <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm shadow-emerald-600/25">
                                <AppLogoIcon className="size-6 fill-current" />
                            </span>
                            {appName}
                        </Link>
                        <ArrowRight className="size-4 text-emerald-600" />
                    </div>

                    <div className="mb-8 space-y-2">
                        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
                        <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
                    </div>

                    <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-xl shadow-emerald-950/5 sm:p-8">
                        {children}
                    </div>

                    <p className="text-muted-foreground mt-6 text-center text-xs">
                        By continuing, you agree to our terms and privacy policy.
                    </p>
                </div>
            </main>
        </div>
    );
}
