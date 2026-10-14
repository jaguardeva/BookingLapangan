import { Link, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import {
    Trophy,
    CalendarCheck,
    ShieldCheck,
    LogOut,
    User as UserIcon,
    LayoutDashboard,
    ArrowRight,
    House,
    Search,
    Crown,
    Bell,
    Menu,
    X,
    UserPlus,
    Palette,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NotificationCenter } from '@/components/notification-center';
import ThemeToggleButton from '@/components/theme-toggle-button';
import { useCurrentUrl } from '@/hooks/use-current-url';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';
import { edit as editSecurity } from '@/routes/security';
import { edit as editProfile } from '@/routes/profile';
import { dashboard as adminDashboard } from '@/routes/admin';
import { logout } from '@/routes';
import { home, login, register } from '@/routes';
import { history as bookingHistory } from '@/routes/booking';
import { index as lapanganIndex } from '@/routes/lapangan';
import { index as notificationsIndex } from '@/routes/notification';
import { index as membershipIndex } from '@/routes/membership';
import type { User } from '@/types/auth';

export function Navbar() {
    const { auth, name } = usePage<{
        auth: { user: User | null };
        name?: string;
    }>().props;
    const user = auth.user;
    const appName = name ?? 'SportBooking';
    const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(
        user?.unread_notifications_count ?? 0,
    );
    const getInitials = useInitials();
    const { currentUrl, isCurrentUrl, isCurrentOrParentUrl } = useCurrentUrl();
    const isLanding = isCurrentUrl(home.url());
    const [landingNavState, setLandingNavState] = useState<'top' | 'revealed'>('top');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const isLandingOverlay = isLanding && landingNavState === 'top';

    const getNavLinkClass = (isActive: boolean) => {
        if (isLanding && isLandingOverlay) {
            return isActive
                ? 'font-semibold text-brand-deep dark:text-brand-foreground transition-colors'
                : 'text-brand-deep/75 hover:text-brand-deep dark:text-brand-foreground/75 dark:hover:text-brand-foreground transition-colors';
        }

        return isActive
            ? 'font-semibold text-foreground dark:text-foreground transition-colors'
            : 'text-muted-foreground hover:text-foreground transition-colors';
    };

    useEffect(() => {
        setUnreadNotificationsCount(user?.unread_notifications_count ?? 0);
    }, [user?.unread_notifications_count]);

    useEffect(() => {
        if (!isLanding) {
            setLandingNavState('top');

            return;
        }

        const handleScroll = () => {
            if (window.scrollY <= 0) {
                setLandingNavState('top');
            } else if (window.scrollY > 240) {
                setLandingNavState('revealed');
            } else {
                setLandingNavState('top');
            }
        };

        handleScroll();
        window.addEventListener('scroll', handleScroll, { passive: true });

        return () => window.removeEventListener('scroll', handleScroll);
    }, [isLanding]);

    const isStaff = user?.role === 'admin' || user?.role === 'superadmin';
    const isBookingActive =
        isCurrentOrParentUrl(bookingHistory.url()) ||
        currentUrl.startsWith('/booking/');

    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [currentUrl]);

    useEffect(() => {
        if (!isMobileMenuOpen) {
            return;
        }

        const previousOverflow = document.body.style.overflow;
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsMobileMenuOpen(false);
            }
        };

        document.body.style.overflow = 'hidden';
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isMobileMenuOpen]);

    const mobileNavItems = user
        ? [
              {
                  label: 'Beranda',
                  href: home(),
                  active: isCurrentUrl(home.url()),
                  icon: House,
              },
              {
                  label: 'Cari Lapangan',
                  href: lapanganIndex(),
                  active: isCurrentOrParentUrl(lapanganIndex.url()),
                  icon: Search,
              },
              {
                  label: 'Riwayat Booking',
                  href: bookingHistory(),
                  active: isBookingActive,
                  icon: CalendarCheck,
              },
              {
                  label: 'Paket Membership',
                  href: membershipIndex(),
                  active: isCurrentOrParentUrl(membershipIndex.url()),
                  icon: Crown,
              },
          ]
        : [
              {
                  label: 'Beranda',
                  href: home(),
                  active: isCurrentUrl(home.url()),
                  icon: House,
              },
              {
                  label: 'Cari Lapangan',
                  href: lapanganIndex(),
                  active: isCurrentOrParentUrl(lapanganIndex.url()),
                  icon: Search,
              },
          ];

    return (
        <>
            <>
                <header className={`fixed inset-x-0 top-0 z-40 w-full border-b backdrop-blur-md transition-all duration-300 print:hidden ${isLandingOverlay ? 'border-transparent bg-transparent text-brand-deep backdrop-blur-sm dark:text-brand-foreground' : isLanding ? 'border-border/70 bg-white/95 text-foreground shadow-sm dark:bg-card/95' : 'border-border/60 bg-background/95 text-foreground shadow-sm dark:bg-card/95'}`}>
                {user && user.is_verified === false && !isStaff && (
                    <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 border-b border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-center text-xs text-amber-700 sm:px-4 dark:bg-amber-500/15 dark:text-amber-300">
                        <span>
                            Email Anda ({user.email}) belum diverifikasi.
                        </span>
                        <Link
                            href="/email/verify"
                            className="inline-flex items-center gap-1 font-bold underline hover:text-amber-900 dark:hover:text-amber-200"
                        >
                            Verifikasi Sekarang
                            <ArrowRight className="size-3.5" aria-hidden="true" />
                        </Link>
                    </div>
                )}
                <div className="public-container flex h-14 max-w-[1240px] items-center justify-between gap-2 sm:h-16">
                    {/* Brand Logo */}
                    <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-8">
                            <Link
                                href={home()}
                                className="group flex min-w-0 items-center gap-2 sm:gap-2.5"
                        >
                            <div className={`${isLandingOverlay ? 'bg-brand-deep text-brand-soft shadow-black/20 group-hover:bg-brand-deep/90 dark:bg-brand-soft dark:text-brand-deep dark:group-hover:bg-brand-soft/90' : 'bg-primary text-primary-foreground shadow-primary/20 group-hover:bg-primary/90'} flex size-8 shrink-0 items-center justify-center rounded-xl shadow-md transition-colors sm:size-9`}>
                                <Trophy className="size-4 sm:size-5" />
                            </div>
                            <div className="flex min-w-0 flex-col">
                                <span className={`flex items-center gap-1 text-sm font-bold tracking-tight sm:gap-1.5 sm:text-base ${isLandingOverlay ? 'text-brand-deep dark:text-brand-foreground' : 'text-foreground'}`}>
                                    <span className={isLandingOverlay ? 'text-brand-deep dark:text-brand-soft' : 'text-primary'}>{appName}</span>
                                </span>
                                <span className={`-mt-1 hidden text-[10px] font-medium tracking-wider uppercase sm:block sm:text-xs ${isLandingOverlay ? 'text-brand-deep/55 dark:text-brand-foreground/55' : 'text-muted-foreground'}`}>
                                    Venue olahraga Sportify
                                </span>
                            </div>
                        </Link>

                        {/* Desktop Navigation Links */}
                        <nav className="hidden items-center gap-7 text-sm font-medium tracking-tight md:flex">
                            <Link
                                href={home()}
                                className={getNavLinkClass(isCurrentUrl(home.url()))}
                            >
                                Beranda
                            </Link>
                            <Link
                                href={lapanganIndex()}
                                className={getNavLinkClass(isCurrentOrParentUrl(lapanganIndex.url()))}
                            >
                                Cari Lapangan
                            </Link>
                            {user && (
                                <Link
                                    href={bookingHistory()}
                                    className={getNavLinkClass(isBookingActive)}
                                >
                                    Riwayat Booking
                                </Link>
                            )}
                            {user && (
                                <Link
                                    href={membershipIndex()}
                                    className={getNavLinkClass(isCurrentOrParentUrl(membershipIndex.url()))}
                                >
                                    Membership
                                </Link>
                            )}
                            {isStaff && (
                                <Link
                                    href="/admin"
                                    className={`${isLandingOverlay ? 'border-brand-deep/20 bg-brand-deep/5 text-brand-deep hover:bg-brand-deep/10 dark:border-brand-soft/30 dark:bg-brand-soft/10 dark:text-brand-soft dark:hover:bg-brand-soft/20' : 'border-primary/20 bg-primary/10 text-primary hover:bg-primary/20'} rounded-full border px-3 py-1 text-xs font-semibold transition-all`}
                                >
                                    Admin Panel
                                </Link>
                            )}
                        </nav>
                    </div>

                    {/* Right Actions */}
                    <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
                        {user && (
                            <NotificationCenter
                                onUnreadCountChange={setUnreadNotificationsCount}
                            />
                        )}
                        <div className="hidden md:block">
                            <ThemeToggleButton />
                        </div>
                        <div className="md:hidden">
                            <Button
                                variant="ghost"
                                size="icon"
                                className={`size-9 rounded-xl ${
                                    isLandingOverlay
                                        ? 'text-brand-deep hover:bg-brand-deep/10 dark:text-brand-foreground dark:hover:bg-brand-foreground/10'
                                        : 'text-foreground hover:bg-muted'
                                }`}
                                aria-label={isMobileMenuOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
                                aria-expanded={isMobileMenuOpen}
                                aria-controls="mobile-navigation-drawer"
                                onClick={() => setIsMobileMenuOpen((isOpen) => !isOpen)}
                            >
                                {isMobileMenuOpen ? (
                                    <X className="size-5" aria-hidden="true" />
                                ) : (
                                    <Menu className="size-5" aria-hidden="true" />
                                )}
                            </Button>
                            {isMobileMenuOpen && (
                                <div className="fixed inset-0 z-50 md:hidden" role="presentation">
                                    <button
                                        type="button"
                                        className="absolute inset-0 bg-slate-950/45"
                                        aria-label="Tutup menu navigasi"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    />
                                    <aside
                                        id="mobile-navigation-drawer"
                                        role="dialog"
                                        aria-modal="true"
                                        aria-labelledby="mobile-navigation-title"
                                        className="bg-background relative flex h-dvh w-full flex-col gap-0 p-0"
                                    >
                                    {/* Header Drawer */}
                                    <div className="border-b border-border/70 px-4 py-3.5 text-left sm:px-5">
                                        <div className="flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-2.5">
                                            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs shadow-primary/25">
                                                <Trophy className="size-4" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-bold tracking-tight text-foreground">
                                                    {appName}
                                                </p>
                                                <p className="truncate text-[10px] font-medium tracking-wide uppercase text-muted-foreground">
                                                    Venue Olahraga Sportify
                                                </p>
                                            </div>
                                        </div>
                                            <button
                                                type="button"
                                                className="text-muted-foreground hover:bg-muted hover:text-foreground flex size-9 shrink-0 items-center justify-center rounded-xl"
                                                aria-label="Tutup menu navigasi"
                                                onClick={() => setIsMobileMenuOpen(false)}
                                            >
                                                <X className="size-5" aria-hidden="true" />
                                            </button>
                                        </div>
                                        <h2 id="mobile-navigation-title" className="sr-only">Menu Navigasi Mobile</h2>
                                    </div>

                                    {/* Unverified Email Warning Banner */}
                                    {user && user.is_verified === false && !isStaff && (
                                        <div className="flex items-center justify-between gap-2 border-b border-amber-500/20 bg-amber-500/10 px-4 py-2 text-xs text-amber-700 dark:text-amber-300">
                                            <span className="truncate">Email belum diverifikasi</span>
                                            <Link
                                                href="/email/verify"
                                                onClick={() => setIsMobileMenuOpen(false)}
                                                className="inline-flex shrink-0 items-center gap-1 font-bold underline hover:text-amber-900 dark:hover:text-amber-200"
                                            >
                                                Verifikasi
                                                <ArrowRight className="size-3" aria-hidden="true" />
                                            </Link>
                                        </div>
                                    )}

                                    {/* Scrollable Navigation Body */}
                                    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-4">
                                        {/* User Profile or Guest Card */}
                                        {user ? (
                                            <div className="space-y-2.5 rounded-2xl border border-border/80 bg-card p-3.5 shadow-xs">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="size-11 shrink-0 rounded-xl border border-border">
                                                        <AvatarImage src={user.avatar ?? undefined} alt={user.name} />
                                                        <AvatarFallback className="rounded-xl bg-primary/10 text-xs font-bold text-primary">
                                                            {getInitials(user.name)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center gap-1.5">
                                                            <p className="truncate text-sm font-bold text-foreground">
                                                                {user.name}
                                                            </p>
                                                            {isStaff ? (
                                                                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-bold tracking-wide uppercase text-primary">
                                                                    Admin
                                                                </span>
                                                            ) : (
                                                                <span className="rounded-full bg-muted px-2 py-0.5 text-[9px] font-medium tracking-wide uppercase text-muted-foreground">
                                                                    Member
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="truncate text-xs text-muted-foreground">
                                                            {user.email}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2 border-t border-border/50 pt-2">
                                                    <Link
                                                        href={editProfile()}
                                                        onClick={() => setIsMobileMenuOpen(false)}
                                                        className="flex items-center justify-center gap-1.5 rounded-xl border border-border/60 bg-muted/40 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                                                    >
                                                        <UserIcon className="size-3.5 text-muted-foreground" />
                                                        Profil
                                                    </Link>
                                                    <Link
                                                        href={editSecurity()}
                                                        onClick={() => setIsMobileMenuOpen(false)}
                                                        className="flex items-center justify-center gap-1.5 rounded-xl border border-border/60 bg-muted/40 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                                                    >
                                                        <ShieldCheck className="size-3.5 text-muted-foreground" />
                                                        Keamanan
                                                    </Link>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-xs">
                                                <p className="text-sm font-bold text-foreground">
                                                    Selamat Datang di {appName}
                                                </p>
                                                <p className="mt-0.5 mb-3 text-xs leading-relaxed text-muted-foreground">
                                                    Masuk untuk reservasi lapangan olahraga dan nikmati harga khusus member.
                                                </p>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <Link
                                                        href={login()}
                                                        onClick={() => setIsMobileMenuOpen(false)}
                                                        className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-background py-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
                                                    >
                                                        <UserIcon className="size-3.5" />
                                                        Masuk
                                                    </Link>
                                                    <Link
                                                        href={register()}
                                                        onClick={() => setIsMobileMenuOpen(false)}
                                                        className="flex items-center justify-center gap-1.5 rounded-xl bg-primary py-2 text-xs font-semibold text-primary-foreground shadow-xs transition-colors hover:bg-primary/90"
                                                    >
                                                        <UserPlus className="size-3.5" />
                                                        Daftar
                                                    </Link>
                                                </div>
                                            </div>
                                        )}

                                        {/* Main Navigation Links */}
                                        <nav className="space-y-1">
                                            <p className="px-1 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                                                Menu Utama
                                            </p>
                                            {mobileNavItems.map(({ label, href, active, icon: Icon }) => (
                                                <Link
                                                    key={label}
                                                    href={href}
                                                    prefetch
                                                    onClick={() => setIsMobileMenuOpen(false)}
                                                    aria-current={active ? 'page' : undefined}
                                                    className={`group flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                                                        active
                                                            ? 'bg-primary/10 font-semibold text-primary'
                                                            : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                                                    }`}
                                                >
                                                    <span className="flex items-center gap-3">
                                                        <span
                                                            className={`flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
                                                                active
                                                                    ? 'bg-primary text-primary-foreground shadow-xs shadow-primary/20'
                                                                    : 'bg-muted text-muted-foreground group-hover:bg-background group-hover:text-foreground'
                                                            }`}
                                                        >
                                                            <Icon className="size-4" aria-hidden="true" />
                                                        </span>
                                                        <span>{label}</span>
                                                    </span>
                                                    {active && (
                                                        <span className="size-1.5 rounded-full bg-primary" />
                                                    )}
                                                </Link>
                                            ))}

                                            {user && (
                                                <Link
                                                    href={notificationsIndex()}
                                                    prefetch
                                                    onClick={() => setIsMobileMenuOpen(false)}
                                                    aria-current={isCurrentOrParentUrl(notificationsIndex.url()) ? 'page' : undefined}
                                                    className={`group flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                                                        isCurrentOrParentUrl(notificationsIndex.url())
                                                            ? 'bg-primary/10 font-semibold text-primary'
                                                            : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                                                    }`}
                                                >
                                                    <span className="flex items-center gap-3">
                                                        <span
                                                            className={`flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
                                                                isCurrentOrParentUrl(notificationsIndex.url())
                                                                    ? 'bg-primary text-primary-foreground shadow-xs shadow-primary/20'
                                                                    : 'bg-muted text-muted-foreground group-hover:bg-background group-hover:text-foreground'
                                                            }`}
                                                        >
                                                            <Bell className="size-4" aria-hidden="true" />
                                                        </span>
                                                        <span>Notifikasi</span>
                                                    </span>
                                                    {unreadNotificationsCount > 0 ? (
                                                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground">
                                                            {unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}
                                                        </span>
                                                    ) : (
                                                        isCurrentOrParentUrl(notificationsIndex.url()) && (
                                                            <span className="size-1.5 rounded-full bg-primary" />
                                                        )
                                                    )}
                                                </Link>
                                            )}
                                        </nav>

                                        {/* Staff / Management Section */}
                                        {isStaff && (
                                            <div className="space-y-1 border-t border-border/60 pt-2">
                                                <p className="px-1 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                                                    Manajemen
                                                </p>
                                                <Link
                                                    href={adminDashboard()}
                                                    onClick={() => setIsMobileMenuOpen(false)}
                                                    className="group flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 px-3 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
                                                >
                                                    <span className="flex items-center gap-3">
                                                        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                                                            <LayoutDashboard className="size-4" />
                                                        </span>
                                                        <span>Admin Panel</span>
                                                    </span>
                                                    <span className="rounded-md bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                                                        Staff
                                                    </span>
                                                </Link>
                                            </div>
                                        )}
                                    </div>

                                    {/* Bottom Utility & Footer */}
                                    <div className="mt-auto space-y-3 border-t border-border/70 bg-muted/20 p-4">
                                        <div className="flex items-center justify-between rounded-xl border border-border/60 bg-card px-3.5 py-2.5 shadow-xs">
                                            <span className="flex items-center gap-2.5 text-xs font-medium text-foreground">
                                                <Palette className="size-4 text-muted-foreground" />
                                                Mode Tampilan
                                            </span>
                                            <ThemeToggleButton />
                                        </div>

                                        {user && (
                                            <Link
                                                href={logout()}
                                                method="post"
                                                as="button"
                                                onClick={() => setIsMobileMenuOpen(false)}
                                                className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/5 px-3.5 py-2 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-500/10 active:bg-rose-500/15 dark:text-rose-400"
                                            >
                                                <LogOut className="size-3.5" />
                                                Keluar dari Akun
                                            </Link>
                                        )}

                                        <p className="text-center text-[10px] text-muted-foreground/75">
                                            {appName} · Venue Olahraga Sportify
                                        </p>
                                    </div>
                                    </aside>
                                </div>
                            )}
                        </div>
                        {user ? (
                            <>
                                <div className="hidden md:block">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                className={`relative size-9 rounded-full p-0 ${isLandingOverlay ? 'hover:bg-brand-deep/10 dark:hover:bg-brand-foreground/10' : ''}`}
                                            >
                                                <Avatar className={`size-9 border ${isLandingOverlay ? 'border-brand-deep/25 dark:border-brand-foreground/30' : 'border-border'}`}>
                                                    <AvatarImage
                                                        src={user.avatar ?? undefined}
                                                        alt={user.name}
                                                    />
                                                    <AvatarFallback className="bg-primary/10 text-primary dark:text-primary text-xs font-semibold">
                                                        {getInitials(user.name)}
                                                    </AvatarFallback>
                                                </Avatar>
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent
                                            align="end"
                                            className="border-border w-56 rounded-xl shadow-lg"
                                        >
                                            <DropdownMenuLabel className="p-3 pb-2 font-normal">
                                                <div className="flex flex-col space-y-1">
                                                    <p className="text-sm leading-none font-semibold">
                                                        {user.name}
                                                    </p>
                                                    <p className="text-muted-foreground text-xs leading-none">
                                                        {user.email}
                                                    </p>
                                                </div>
                                            </DropdownMenuLabel>
                                            <DropdownMenuSeparator />
                                            {isStaff && (
                                                <DropdownMenuItem asChild>
                                                    <Link
                                                        href={adminDashboard()}
                                                        className="text-primary dark:text-primary flex cursor-pointer items-center gap-2 font-medium"
                                                    >
                                                        <LayoutDashboard className="size-4" />
                                                        Dashboard Admin
                                                    </Link>
                                                </DropdownMenuItem>
                                            )}
                                            <DropdownMenuItem asChild>
                                                <Link
                                                    href={bookingHistory()}
                                                    className="flex cursor-pointer items-center gap-2"
                                                >
                                                    <CalendarCheck className="size-4" />
                                                    Riwayat Booking Saya
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem asChild>
                                                <Link
                                                    href={editProfile()}
                                                    className="flex cursor-pointer items-center gap-2"
                                                >
                                                    <UserIcon className="size-4" />
                                                    Pengaturan Akun
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem asChild>
                                                <Link
                                                    href={editSecurity()}
                                                    className="flex cursor-pointer items-center gap-2"
                                                >
                                                    <ShieldCheck className="size-4" />
                                                    Keamanan
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem asChild>
                                                <Link
                                                    href={logout()}
                                                    method="post"
                                                    as="button"
                                                    className="flex w-full cursor-pointer items-center gap-2 text-rose-600 dark:text-rose-400"
                                                >
                                                    <LogOut className="size-4" />
                                                    Keluar
                                                </Link>
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </>
                        ) : (
                            <div className="hidden items-center gap-1 sm:gap-2 md:flex">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className={`px-2 sm:px-3 ${isLandingOverlay ? 'text-brand-deep hover:bg-brand-deep/10 hover:text-brand-deep dark:text-brand-foreground dark:hover:bg-brand-foreground/10 dark:hover:text-brand-foreground' : ''}`}
                                    asChild
                                >
                                    <Link href={login()}>Masuk</Link>
                                </Button>
                                <Button
                                    size="sm"
                                    className={`${isLandingOverlay ? 'bg-brand-deep text-brand-foreground hover:bg-brand-deep/90 dark:bg-brand-soft dark:text-brand-deep dark:hover:bg-brand-soft/90' : 'bg-primary text-primary-foreground hover:bg-primary/90'} px-2.5 shadow-sm sm:px-3`}
                                    asChild
                                >
                                    <Link href={register()}>
                                        <span className="sm:hidden">
                                            Daftar
                                        </span>
                                        <span className="hidden sm:inline">
                                            Daftar Sekarang
                                        </span>
                                    </Link>
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
                </header>

            </>
        </>
    );
}
