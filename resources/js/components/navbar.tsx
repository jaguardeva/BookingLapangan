import { Link, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import {
    Trophy,
    CalendarCheck,
    Shield,
    ShieldCheck,
    LogOut,
    User as UserIcon,
    LayoutDashboard,
    Home,
    Layers,
    Bell,
    LogIn,
    ArrowRight,
    Menu,
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
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetClose,
} from '@/components/ui/sheet';
import { useInitials } from '@/hooks/use-initials';
import { UserInfo } from '@/components/user-info';
import { edit as editSecurity } from '@/routes/security';
import { edit as editProfile } from '@/routes/profile';
import { dashboard as adminDashboard } from '@/routes/admin';
import { logout } from '@/routes';
import { home, login, register } from '@/routes';
import { history as bookingHistory } from '@/routes/booking';
import { index as lapanganIndex } from '@/routes/lapangan';
import { index as notificationsIndex } from '@/routes/notification';
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
    const isLandingOverlay = isLanding && landingNavState === 'top';
    const navLinkClass = isLanding
        ? isLandingOverlay
            ? 'text-brand-deep/75 hover:text-brand-deep dark:text-brand-foreground/75 dark:hover:text-brand-foreground transition-colors'
            : 'text-foreground/75 hover:text-primary transition-colors'
        : 'text-muted-foreground hover:text-primary transition-colors';

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

    const mobileNavItems = user
        ? [
              {
                  label: 'Beranda',
                  href: home(),
                  icon: Home,
                  active: isCurrentUrl(home.url()),
                  unreadCount: 0,
              },
              {
                  label: 'Lapangan',
                  href: lapanganIndex(),
                  icon: Layers,
                  active: isCurrentOrParentUrl(lapanganIndex.url()),
                  unreadCount: 0,
              },
              {
                  label: 'Booking',
                  href: bookingHistory(),
                  icon: CalendarCheck,
                  active: isBookingActive,
                  unreadCount: 0,
              },
              {
                  label: 'Notifikasi',
                  href: notificationsIndex(),
                  icon: Bell,
                  active: isCurrentOrParentUrl(notificationsIndex.url()),
                  unreadCount: unreadNotificationsCount,
              },
          ]
        : [
              {
                  label: 'Beranda',
                  href: home(),
                  icon: Home,
                  active: isCurrentUrl(home.url()),
                  unreadCount: 0,
              },
              {
                  label: 'Lapangan',
                  href: lapanganIndex(),
                  icon: Layers,
                  active: isCurrentOrParentUrl(lapanganIndex.url()),
                  unreadCount: 0,
              },
              {
                  label: 'Masuk',
                  href: login(),
                  icon: LogIn,
                  active: isCurrentOrParentUrl(login.url()),
                  unreadCount: 0,
              },
          ];

    return (
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
                        <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
                            <Link
                                href={home()}
                                className={navLinkClass}
                            >
                                Beranda
                            </Link>
                            <Link
                                href={lapanganIndex()}
                                className={navLinkClass}
                            >
                                Cari Lapangan
                            </Link>
                            {user && (
                                <Link
                                    href={bookingHistory()}
                                    className={`${navLinkClass} flex items-center gap-1.5`}
                                >
                                    <CalendarCheck className="size-4" />
                                    Riwayat Booking
                                </Link>
                            )}
                            {isStaff && (
                                <Link
                                    href="/admin"
                                    className={`${isLandingOverlay ? 'border-brand-deep/20 bg-brand-deep/5 text-brand-deep hover:bg-brand-deep/10 dark:border-brand-soft/30 dark:bg-brand-soft/10 dark:text-brand-soft dark:hover:bg-brand-soft/20' : 'border-primary/20 bg-primary/10 text-primary hover:bg-primary/20'} inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-all`}
                                >
                                    <Shield className="size-3.5" />
                                    Admin Panel
                                </Link>
                            )}
                        </nav>
                    </div>

                    {/* Right Actions */}
                    <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
                        <ThemeToggleButton />
                        <div className="md:hidden">
                            <Sheet>
                                <SheetTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="size-9"
                                        aria-label="Buka menu navigasi"
                                    >
                                        <Menu className="size-5" />
                                    </Button>
                                </SheetTrigger>
                                <SheetContent
                                    side="left"
                                    className="bg-background/95 h-dvh w-screen max-w-none gap-0 overflow-hidden rounded-none border-r-0 p-0 backdrop-blur-xl"
                                >
                                    <SheetHeader className="from-primary/15 via-primary/5 border-border relative border-b bg-gradient-to-br to-transparent px-5 pt-6 pb-5 text-left">
                                        <div className="flex items-center gap-3 pr-8">
                                            <div className="bg-primary text-primary-foreground flex size-10 shrink-0 items-center justify-center rounded-2xl shadow-lg shadow-primary/20">
                                                <Trophy className="size-5" />
                                            </div>
                                            <div className="min-w-0">
                                                <SheetTitle className="truncate text-base">
                                                    {appName}
                                                </SheetTitle>
                                                <p className="text-muted-foreground mt-0.5 text-xs">
                                                    Navigasi utama
                                                </p>
                                            </div>
                                        </div>
                                    </SheetHeader>

                                    <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
                                        {user && (
                                            <div className="border-border/70 bg-muted/35 mb-3 flex items-center gap-3 rounded-2xl border p-3">
                                                <UserInfo user={user} showEmail />
                                                {user.is_verified === false && (
                                                    <span className="size-2 shrink-0 rounded-full bg-amber-500" title="Email belum diverifikasi" />
                                                )}
                                            </div>
                                        )}

                                        <p className="text-muted-foreground px-3 pb-1 text-[10px] font-bold tracking-[0.16em] uppercase">
                                            Menu utama
                                        </p>
                                        {mobileNavItems.map(
                                            ({
                                                label,
                                                href,
                                                icon: Icon,
                                                active,
                                                unreadCount,
                                            }) => (
                                                <SheetClose
                                                    key={label}
                                                    asChild
                                                >
                                                    <Link
                                                        href={href}
                                                        prefetch
                                                        aria-current={
                                                            active
                                                                ? 'page'
                                                                : undefined
                                                        }
                                                        className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                                                            active
                                                                ? 'bg-primary/10 text-primary'
                                                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                                        }`}
                                                    >
                                                        <span className="relative">
                                                            <Icon className="size-4" />
                                                            {label ===
                                                                'Notifikasi' &&
                                                                unreadCount >
                                                                    0 && (
                                                                    <span className="bg-destructive text-destructive-foreground absolute -top-2 -right-2 flex size-4 items-center justify-center rounded-full text-[9px] font-bold">
                                                                        {unreadCount >
                                                                        99
                                                                            ? '99+'
                                                                            : unreadCount}
                                                                    </span>
                                                                )}
                                                        </span>
                                                        <span>{label}</span>
                                                    </Link>
                                                </SheetClose>
                                            ),
                                        )}

                                        {isStaff && (
                                            <>
                                                <div className="border-border/70 my-3 border-t" />
                                                <p className="text-muted-foreground px-3 pb-1 text-[10px] font-bold tracking-[0.16em] uppercase">
                                                    Manajemen
                                                </p>
                                                <SheetClose asChild>
                                                <Link
                                                    href={adminDashboard()}
                                                    className="text-primary hover:bg-primary/10 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors"
                                                >
                                                    <Shield className="size-4" />
                                                    Admin Panel
                                                </Link>
                                                </SheetClose>
                                            </>
                                        )}

                                        {user ? (
                                            <>
                                                <div className="border-border my-3 border-t" />
                                                <p className="text-muted-foreground px-3 pb-1 text-[10px] font-bold tracking-[0.16em] uppercase">
                                                    Akun
                                                </p>
                                                <SheetClose asChild>
                                                    <Link
                                                        href={editProfile()}
                                                        className="text-muted-foreground hover:bg-muted hover:text-foreground flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors"
                                                    >
                                                        <UserIcon className="size-4" />
                                                        Pengaturan Akun
                                                    </Link>
                                                </SheetClose>
                                                <SheetClose asChild>
                                                    <Link
                                                        href={editSecurity()}
                                                        className="text-muted-foreground hover:bg-muted hover:text-foreground flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors"
                                                    >
                                                        <ShieldCheck className="size-4" />
                                                        Keamanan
                                                    </Link>
                                                </SheetClose>
                                                <SheetClose asChild>
                                                    <Link
                                                        href={logout()}
                                                        method="post"
                                                        as="button"
                                                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-rose-600 transition-colors hover:bg-rose-500/10 dark:text-rose-400"
                                                    >
                                                        <LogOut className="size-4" />
                                                        Keluar
                                                    </Link>
                                                </SheetClose>
                                            </>
                                        ) : (
                                            <>
                                                <div className="border-border my-3 border-t" />
                                                <p className="text-muted-foreground px-3 pb-1 text-[10px] font-bold tracking-[0.16em] uppercase">
                                                    Akun
                                                </p>
                                                <SheetClose asChild>
                                                    <Link
                                                        href={register()}
                                                        className="text-primary hover:bg-primary/10 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors"
                                                    >
                                                        <ArrowRight className="size-4" />
                                                        Daftar Sekarang
                                                    </Link>
                                                </SheetClose>
                                            </>
                                        )}
                                    </nav>
                                    <div className="border-border/70 bg-muted/20 border-t px-5 py-3">
                                        <p className="text-muted-foreground text-center text-[11px]">
                                            SportBooking · Venue olahraga Sportify
                                        </p>
                                    </div>
                                </SheetContent>
                            </Sheet>
                        </div>
                        {user ? (
                            <>
                                <div className="hidden md:block">
                                    <NotificationCenter
                                        onUnreadCountChange={
                                            setUnreadNotificationsCount
                                        }
                                    />
                                </div>

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
    );
}
