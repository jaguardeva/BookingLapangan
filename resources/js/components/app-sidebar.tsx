import { Link, usePage } from '@inertiajs/react';
import {
    LayoutGrid,
    CalendarCheck,
    FileText,
    Layers,
    Shapes,
    Users,
    CreditCard,
    History,
    Globe,
    Trophy,
    Home,
    Bell,
    MessageCircle,
} from 'lucide-react';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import type { NavItem } from '@/types';
import type { User } from '@/types/auth';

export function AppSidebar() {
    const { auth, name } = usePage<{
        auth: { user: User | null };
        name?: string;
    }>().props;
    const user = auth?.user;
    const isSuperAdmin = user?.role === 'superadmin';
    const isAdmin = user?.role === 'admin';
    const isStaff = isSuperAdmin || isAdmin;

    // Customer Navigation Items (only for regular users)
    const userNavItems: NavItem[] = [
        {
            title: 'Beranda Utama',
            href: '/',
            icon: Home,
        },
        {
            title: 'Katalog Lapangan',
            href: '/lapangan',
            icon: Layers,
        },
        {
            title: 'Riwayat Booking Saya',
            href: '/my-bookings',
            icon: CalendarCheck,
        },
        {
            title: 'Pemberitahuan',
            href: '/notifications',
            icon: Bell,
            hasNotification: (user?.unread_notifications_count ?? 0) > 0,
            badgeCount: user?.unread_notifications_count ?? 0,
        },
    ];

    // Staff / Admin Workspace Items
    const adminNavItems: NavItem[] = [
        {
            title: 'Dashboard Overview',
            href: '/admin',
            icon: LayoutGrid,
        },
        {
            title: 'Validasi & Booking',
            href: '/admin/bookings',
            icon: CalendarCheck,
        },
        {
            title: 'Laporan & Export',
            href: '/admin/reports',
            icon: FileText,
        },
    ];

    // Master Data
    const masterDataNavItems: NavItem[] = [
        {
            title: 'Kategori & Fasilitas',
            href: '/admin/catalog',
            icon: Shapes,
        },
        {
            title: 'Kelola Lapangan',
            href: '/admin/lapangans',
            icon: Layers,
        },
        {
            title: 'Rekening Bank',
            href: '/admin/banks',
            icon: CreditCard,
        },
        {
            title: 'Kontak WhatsApp',
            href: '/admin/whatsapp-contacts',
            icon: MessageCircle,
        },
    ];

    // Superadmin Special Controls
    const superAdminNavItems: NavItem[] = [
        {
            title: 'Kelola Pengguna',
            href: '/admin/users',
            icon: Users,
        },
        {
            title: 'Log Aktivitas',
            href: '/admin/logs',
            icon: History,
        },
    ];

    const quickNavItems: NavItem[] = [
        {
            title: 'Katalog Lapangan Publik',
            href: '/lapangan',
            icon: Globe,
        },
    ];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={isStaff ? '/admin' : '/'} className="flex items-center gap-2.5">
                                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                                    <Trophy className="size-4" />
                                </div>
                                <div className="flex flex-col group-data-[collapsible=icon]:hidden">
                                    <span className="text-sm font-bold text-foreground">{name ?? 'SportBooking'}</span>
                                    <span className="text-xs text-muted-foreground uppercase font-semibold">
                                        {isSuperAdmin
                                            ? 'Superadmin Workspace'
                                            : isAdmin
                                            ? 'Kasir Workspace'
                                            : 'Member Area'}
                                    </span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className="pt-2">
                {isStaff ? (
                    <>
                        <NavMain items={adminNavItems} label="Menu Utama" />

                        {isSuperAdmin && (
                            <NavMain items={masterDataNavItems} label="Master Data" />
                        )}

                        {isSuperAdmin && (
                            <NavMain items={superAdminNavItems} label="Superadmin Controls" />
                        )}

                        {isSuperAdmin && <NavMain items={quickNavItems} label="Navigasi Cepat" />}
                    </>
                ) : (
                    <NavMain items={userNavItems} label="Menu Akun" />
                )}
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
