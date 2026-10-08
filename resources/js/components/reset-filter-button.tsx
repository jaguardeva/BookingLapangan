import type { ComponentProps } from 'react';
import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

type ResetFilterButtonProps = Omit<ComponentProps<typeof Button>, 'type'>;

export function ResetFilterButton({
    children = 'Reset Filter',
    className,
    ...props
}: ResetFilterButtonProps) {
    return (
        <Button
            type="button"
            variant="outline"
            className={className}
            {...props}
        >
            <RotateCcw className="size-4" aria-hidden="true" />
            {children}
        </Button>
    );
}
