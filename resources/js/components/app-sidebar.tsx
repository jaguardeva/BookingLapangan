import { Link, usePage } from '@inertiajs/react';
import {
    LayoutGrid,
    CalendarCheck,
    FileText,
    Layers,
    Users,
    CreditCard,
    History,
    Globe,
    Trophy,
    Home,
    Bell,
    MessageSquare,
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
    const { auth } = usePage<{ auth: { user: User | null } }>().props;
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
        },
        {
            title: 'Live Chat Support',
            href: '/chat',
            icon: MessageSquare,
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
            title: 'Live Chat Support',
            href: '/admin/chat',
            icon: MessageSquare,
        },
        {
            title: 'Chat Internal',
            href: '/admin/internal-chat',
            icon: Users,
        },
        {
            title: 'Laporan & Export',
            href: '/admin/reports',
            icon: FileText,
        },
    ];

    // Superadmin Special Controls
    const superAdminNavItems: NavItem[] = [
        {
            title: 'Kelola Lapangan',
            href: '/admin/lapangans',
            icon: Layers,
        },
        {
            title: 'Kelola Staf Admin',
            href: '/admin/admins',
            icon: Users,
        },
        {
            title: 'Rekening Bank',
            href: '/admin/banks',
            icon: CreditCard,
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
                                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white">
                                    <Trophy className="size-4" />
                                </div>
                                <div className="flex flex-col group-data-[collapsible=icon]:hidden">
                                    <span className="text-sm font-bold text-foreground">SportBooking</span>
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
                            <NavMain items={superAdminNavItems} label="Superadmin Controls" />
                        )}

                        <NavMain items={quickNavItems} label="Navigasi Cepat" />
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
