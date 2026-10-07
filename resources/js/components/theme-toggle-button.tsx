import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppearance } from '@/hooks/use-appearance';

export default function ThemeToggleButton() {
    const { resolvedAppearance, updateAppearance } = useAppearance();
    const isDark = resolvedAppearance === 'dark';
    const nextAppearance = isDark ? 'light' : 'dark';
    const Icon = isDark ? Sun : Moon;
    const nextLabel = isDark ? 'terang' : 'gelap';
    const ariaLabel = `Ganti ke tema ${nextLabel}.`;

    return (
        <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => updateAppearance(nextAppearance)}
            aria-label={ariaLabel}
            title={ariaLabel}
        >
            <Icon className="size-4" aria-hidden="true" />
        </Button>
    );
}
