import { Link, usePage } from '@inertiajs/react';
import { Trophy, CalendarCheck, Shield, LogOut, User as UserIcon, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NotificationCenter } from '@/components/notification-center';
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
import type { User } from '@/types/auth';

export function Navbar() {
    const { auth } = usePage<{ auth: { user: User | null } }>().props;
    const user = auth.user;
    const getInitials = useInitials();

    const isStaff = user?.role === 'admin' || user?.role === 'superadmin';

    return (
        <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-md transition-all">
            {user && user.is_verified === false && !isStaff && (
                <div className="bg-amber-500/10 dark:bg-amber-500/15 border-b border-amber-500/20 px-4 py-1.5 text-center text-xs text-amber-700 dark:text-amber-300 flex items-center justify-center gap-2">
                    <span>Email Anda ({user.email}) belum diverifikasi.</span>
                    <Link href="/email/verify" className="font-bold underline hover:text-amber-900 dark:hover:text-amber-200 inline-flex items-center gap-1">
                        Verifikasi Sekarang &rarr;
                    </Link>
                </div>
            )}
            <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
                {/* Brand Logo */}
                <div className="flex items-center gap-8">
                    <Link href="/" className="flex items-center gap-2.5 group">
                        <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-500/20 group-hover:bg-emerald-500 transition-colors">
                            <Trophy className="size-5" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-base font-bold tracking-tight text-foreground flex items-center gap-1.5">
                                Sport<span className="text-emerald-600 dark:text-emerald-400">Booking</span>
                            </span>
                            <span className="text-[10px] font-medium tracking-wider text-muted-foreground uppercase -mt-1">
                                Arena Sports Hub
                            </span>
                        </div>
                    </Link>

                    {/* Desktop Navigation Links */}
                    <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
                        <Link
                            href="/"
                            className="hover:text-foreground transition-colors hover:text-emerald-600 dark:hover:text-emerald-400"
                        >
                            Beranda
                        </Link>
                        <Link
                            href="/lapangan"
                            className="hover:text-foreground transition-colors hover:text-emerald-600 dark:hover:text-emerald-400"
                        >
                            Cari Lapangan
                        </Link>
                        {user && (
                            <Link
                                href="/my-bookings"
                                className="hover:text-foreground transition-colors hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1.5"
                            >
                                <CalendarCheck className="size-4" />
                                Riwayat Booking
                            </Link>
                        )}
                        {isStaff && (
                            <Link
                                href="/admin"
                                className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all"
                            >
                                <Shield className="size-3.5" />
                                Admin Panel
                            </Link>
                        )}
                    </nav>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-3">
                    {user ? (
                        <>
                            <NotificationCenter />

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="relative size-9 rounded-full p-0">
                                        <Avatar className="size-9 border border-border">
                                            <AvatarImage src={user.avatar} alt={user.name} />
                                            <AvatarFallback className="bg-emerald-600/10 text-emerald-700 dark:text-emerald-300 font-semibold text-xs">
                                                {getInitials(user.name)}
                                            </AvatarFallback>
                                        </Avatar>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-lg border-border">
                                    <DropdownMenuLabel className="font-normal p-3 pb-2">
                                        <div className="flex flex-col space-y-1">
                                            <p className="text-sm font-semibold leading-none">{user.name}</p>
                                            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                                            <div className="pt-1.5">
                                                <span className="inline-block rounded-md bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                                    Role: {user.role}
                                                </span>
                                            </div>
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    {isStaff && (
                                        <DropdownMenuItem asChild>
                                            <Link href="/admin" className="flex items-center gap-2 cursor-pointer font-medium text-emerald-600 dark:text-emerald-400">
                                                <LayoutDashboard className="size-4" />
                                                Dashboard Admin
                                            </Link>
                                        </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem asChild>
                                        <Link href="/my-bookings" className="flex items-center gap-2 cursor-pointer">
                                            <CalendarCheck className="size-4" />
                                            Riwayat Booking Saya
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link href="/settings/profile" className="flex items-center gap-2 cursor-pointer">
                                            <UserIcon className="size-4" />
                                            Pengaturan Akun
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem asChild>
                                        <Link
                                            href="/logout"
                                            method="post"
                                            as="button"
                                            className="w-full flex items-center gap-2 text-rose-600 dark:text-rose-400 cursor-pointer"
                                        >
                                            <LogOut className="size-4" />
                                            Keluar
                                        </Link>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" asChild>
                                <Link href="/login">Masuk</Link>
                            </Button>
                            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm" asChild>
                                <Link href="/register">Daftar Sekarang</Link>
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
