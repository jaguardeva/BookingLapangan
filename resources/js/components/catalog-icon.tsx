import {
    Accessibility,
    CircleDot,
    Dribbble,
    Droplets,
    Dumbbell,
    Flame,
    Lightbulb,
    ParkingCircle,
    Shapes,
    ShowerHead,
    Sparkles,
    Trophy,
    Volleyball,
    Waves,
    Wifi,
    type LucideIcon,
} from 'lucide-react';

export const catalogIconOptions = [
    { name: 'Accessibility', label: 'Aksesibilitas', icon: Accessibility },
    { name: 'CircleDot', label: 'Bola', icon: CircleDot },
    { name: 'Dribbble', label: 'Basket', icon: Dribbble },
    { name: 'Droplets', label: 'Air / Kamar mandi', icon: Droplets },
    { name: 'Dumbbell', label: 'Fitness', icon: Dumbbell },
    { name: 'Flame', label: 'Futsal', icon: Flame },
    { name: 'Lightbulb', label: 'Lampu', icon: Lightbulb },
    { name: 'ParkingCircle', label: 'Parkir', icon: ParkingCircle },
    { name: 'Shapes', label: 'Umum', icon: Shapes },
    { name: 'ShowerHead', label: 'Shower', icon: ShowerHead },
    { name: 'Sparkles', label: 'Layanan tambahan', icon: Sparkles },
    { name: 'Trophy', label: 'Mini soccer', icon: Trophy },
    { name: 'Volleyball', label: 'Badminton / voli', icon: Volleyball },
    { name: 'Waves', label: 'Kolam', icon: Waves },
    { name: 'Wifi', label: 'Wi-Fi', icon: Wifi },
] as const;

const catalogIcons = Object.fromEntries(
    catalogIconOptions.map((option) => [option.name.toLowerCase(), option.icon]),
) as Record<string, LucideIcon>;

Object.assign(catalogIcons, {
    badminton: Volleyball,
    basket: Dribbble,
    futsal: Flame,
    'mini-soccer': Trophy,
    swimming: Waves,
});

export function getCatalogIcon(name?: string | null): LucideIcon {
    return catalogIcons[name?.trim().toLowerCase() ?? ''] ?? Shapes;
}

export function getCatalogIconName(name?: string | null): string {
    const option = catalogIconOptions.find(
        (item) => item.name.toLowerCase() === name?.trim().toLowerCase(),
    );

    return option?.name ?? 'Shapes';
}

interface CatalogIconProps {
    name?: string | null;
    fallbackName?: string | null;
    className?: string;
}

export function CatalogIcon({
    name,
    fallbackName,
    className,
}: CatalogIconProps) {
    const Icon = name?.trim()
        ? getCatalogIcon(name)
        : getCatalogIcon(fallbackName);

    return <Icon className={className} aria-hidden="true" />;
}
