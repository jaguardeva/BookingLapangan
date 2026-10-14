import { Moon, Sun } from 'lucide-react';
import { useAppearance } from '@/hooks/use-appearance';

export default function ThemeToggleButton() {
    const { resolvedAppearance, updateAppearance } = useAppearance();
    const isDark = resolvedAppearance === 'dark';
    const Icon = isDark ? Sun : Moon;
    const nextLabel = isDark ? 'terang' : 'gelap';
    const ariaLabel = `Ganti ke tema ${nextLabel}.`;

    return (
        <label className="inline-flex cursor-pointer items-center">
            <input
                type="checkbox"
                role="switch"
                checked={isDark}
                onChange={(event) =>
                    updateAppearance(event.currentTarget.checked ? 'dark' : 'light')
                }
                aria-label={ariaLabel}
                title={ariaLabel}
                className="peer sr-only"
            />
            <span
                aria-hidden="true"
                className={`bg-muted peer-focus-visible:ring-ring relative inline-flex h-7 w-12 items-center rounded-full p-1 transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2 ${isDark ? 'bg-primary' : ''}`}
            >
                <span
                    className={`bg-background text-muted-foreground flex size-5 items-center justify-center rounded-full shadow-sm transition-transform ${isDark ? 'text-primary translate-x-5' : ''}`}
                >
                    <Icon className="size-3.5" />
                </span>
            </span>
        </label>
    );
}
