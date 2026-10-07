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
    const navLinkClass = isLanding
        ? 'text-brand-foreground/75 hover:text-brand-foreground transition-colors'
        : 'text-muted-foreground hover:text-primary transition-colors';

    useEffect(() => {
        setUnreadNotificationsCount(user?.unread_notifications_count ?? 0);
    }, [user?.unread_notifications_count]);

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
            <header className={`sticky top-0 z-40 w-full border-b backdrop-blur-md transition-all print:hidden ${isLanding ? 'border-brand-soft/20 bg-brand-deep/95 text-brand-foreground' : 'border-border/60 bg-background/80'}`}>
                {user && user.is_verified === false && !isStaff && (
                    <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 border-b border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-center text-xs text-amber-700 sm:px-4 dark:bg-amber-500/15 dark:text-amber-300">
                        <span>
                            Email Anda ({user.email}) belum diverifikasi.
                        </span>
                        <Link
                            href="/email/verify"
                            className="inline-flex items-center gap-1 font-bold underline hover:text-amber-900 dark:hover:text-amber-200"
                        >
                            Verifikasi Sekarang &rarr;
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
                            <div className={`${isLanding ? 'bg-brand-soft text-brand-deep shadow-black/20 group-hover:bg-brand-soft/90' : 'bg-primary text-primary-foreground shadow-primary/20 group-hover:bg-primary/90'} flex size-8 shrink-0 items-center justify-center rounded-xl shadow-md transition-colors sm:size-9`}>
                                <Trophy className="size-4 sm:size-5" />
                            </div>
                            <div className="flex min-w-0 flex-col">
                                <span className={`flex items-center gap-1 text-sm font-bold tracking-tight sm:gap-1.5 sm:text-base ${isLanding ? 'text-brand-foreground' : 'text-foreground'}`}>
                                    <span className={isLanding ? 'text-brand-soft' : 'text-primary'}>{appName}</span>
                                </span>
                                <span className={`-mt-1 hidden text-[10px] font-medium tracking-wider uppercase sm:block sm:text-xs ${isLanding ? 'text-brand-foreground/55' : 'text-muted-foreground'}`}>
                                    Arena Sports Hub
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
                                    className={`${isLanding ? 'border-brand-soft/30 bg-brand-soft/10 text-brand-soft hover:bg-brand-soft/20' : 'border-primary/20 bg-primary/10 text-primary hover:bg-primary/20'} inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-all`}
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
                        {user ? (
                            <>
                                <div className="hidden md:block">
                                    <NotificationCenter
                                        onUnreadCountChange={
                                            setUnreadNotificationsCount
                                        }
                                    />
                                </div>

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            className={`relative size-9 rounded-full p-0 ${isLanding ? 'hover:bg-brand-foreground/10' : ''}`}
                                        >
                                            <Avatar className={`size-9 border ${isLanding ? 'border-brand-foreground/30' : 'border-border'}`}>
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
                                                    href="/admin"
                                                    className="text-primary dark:text-primary flex cursor-pointer items-center gap-2 font-medium"
                                                >
                                                    <LayoutDashboard className="size-4" />
                                                    Dashboard Admin
                                                </Link>
                                            </DropdownMenuItem>
                                        )}
                                        <DropdownMenuItem asChild>
                                            <Link
                                                href="/my-bookings"
                                                className="flex cursor-pointer items-center gap-2"
                                            >
                                                <CalendarCheck className="size-4" />
                                                Riwayat Booking Saya
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild>
                                            <Link
                                                href="/settings/profile"
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
                                                href="/logout"
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
                            </>
                        ) : (
                            <div className="hidden items-center gap-1 sm:gap-2 md:flex">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className={`px-2 sm:px-3 ${isLanding ? 'text-brand-foreground hover:bg-brand-foreground/10 hover:text-brand-foreground' : ''}`}
                                    asChild
                                >
                                    <Link href={login()}>Masuk</Link>
                                </Button>
                                <Button
                                    size="sm"
                                    className={`${isLanding ? 'bg-brand-soft text-brand-deep hover:bg-brand-soft/90' : 'bg-primary text-primary-foreground hover:bg-primary/90'} px-2.5 shadow-sm sm:px-3`}
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
            <nav
                aria-label="Navigasi utama mobile"
                className="border-border/70 bg-background/95 fixed inset-x-0 bottom-0 z-40 border-t pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_-18px_rgba(0,0,0,0.35)] backdrop-blur-lg md:hidden print:hidden"
            >
                <div
                    className={`mx-auto grid h-16 max-w-[560px] px-2 ${user ? 'grid-cols-4' : 'grid-cols-3'}`}
                >
                    {mobileNavItems.map(
                        ({
                            label,
                            href,
                            icon: Icon,
                            active,
                            unreadCount,
                        }) => (
                            <Link
                                key={label}
                                href={href}
                                prefetch
                                aria-current={active ? 'page' : undefined}
                                aria-label={
                                    label === 'Notifikasi' && unreadCount > 0
                                        ? `${label}, ${unreadCount} belum dibaca`
                                        : label
                                }
                                className={`focus-visible:ring-primary flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none ${
                                    active
                                        ? 'text-primary'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                <span
                                    className={`relative flex size-8 items-center justify-center rounded-full transition-colors ${
                                        active ? 'bg-primary/10' : ''
                                    }`}
                                >
                                    <Icon
                                        className="size-[18px]"
                                        strokeWidth={active ? 2.5 : 2}
                                    />
                                    {label === 'Notifikasi' &&
                                        unreadCount > 0 && (
                                            <span
                                                aria-hidden="true"
                                                className="absolute -top-1.5 -right-2.5 z-10 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] leading-none font-bold ring-2 ring-background shadow-xs select-none pointer-events-none"
                                                style={{ color: '#ffffff', backgroundColor: '#dc2626' }}
                                            >
                                                {unreadCount > 99
                                                    ? '99+'
                                                    : unreadCount}
                                            </span>
                                        )}
                                </span>
                                <span className="max-w-full truncate px-1">
                                    {label}
                                </span>
                            </Link>
                        ),
                    )}
                </div>
            </nav>
        </>
    );
}
