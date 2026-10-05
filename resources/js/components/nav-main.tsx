import { Link } from "@inertiajs/react";
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuBadge,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useCurrentUrl } from "@/hooks/use-current-url";
import type { NavItem } from "@/types";

export function NavMain({
    items,
    label,
}: {
    items: NavItem[];
    label?: string;
}) {
    const { isCurrentUrl } = useCurrentUrl();

    return (
        <SidebarGroup className="px-2 py-0">
            {label && <SidebarGroupLabel>{label}</SidebarGroupLabel>}
            <SidebarMenu>
                {items.map((item) => (
                    <SidebarMenuItem key={item.title} className="relative">
                        <SidebarMenuButton
                            asChild
                            isActive={isCurrentUrl(item.href)}
                            tooltip={{ children: item.title }}
                        >
                            <Link
                                href={item.href}
                                prefetch
                                onClick={item.onNavigate}
                            >
                                {item.icon && (
                                    <item.icon className="size-4 shrink-0" />
                                )}
                                <span>{item.title}</span>
                            </Link>
                        </SidebarMenuButton>
                        {item.hasNotification && (
                            <SidebarMenuBadge
                                className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 dark:bg-red-500 px-1 text-[10px] font-bold text-white shadow-xs"
                                aria-label={`Ada pesan baru di ${item.title}`}
                            >
                                {item.badgeCount && item.badgeCount > 0 ? (
                                    <span>
                                        {item.badgeCount > 99
                                            ? '99+'
                                            : item.badgeCount}
                                    </span>
                                ) : (
                                    <span className="size-2 rounded-full bg-white" />
                                )}
                            </SidebarMenuBadge>
                        )}
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </SidebarGroup>
    );
}
