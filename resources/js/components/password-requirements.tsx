import { CheckCircle2, Circle } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Requirement = {
    label: string;
    isMet: boolean;
};

type Props = {
    password: string;
    className?: string;
};

function RequirementItem({ label, isMet }: Requirement): ReactNode {
    const Icon = isMet ? CheckCircle2 : Circle;

    return (
        <li
            className={cn(
                'flex items-center gap-2 text-sm',
                isMet
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-muted-foreground',
            )}
        >
            <Icon className="size-4 shrink-0" aria-hidden="true" />
            <span>{label}</span>
        </li>
    );
}

export default function PasswordRequirements({ password, className }: Props) {
    const requirements: Requirement[] = [
        { label: 'Minimal 8 karakter', isMet: password.length >= 8 },
        {
            label: 'Tidak boleh mengandung spasi',
            isMet: password.length > 0 && !/\s/.test(password),
        },
        { label: 'Mengandung huruf besar (A-Z)', isMet: /[A-Z]/.test(password) },
        { label: 'Mengandung huruf kecil (a-z)', isMet: /[a-z]/.test(password) },
        { label: 'Mengandung angka (0-9)', isMet: /\d/.test(password) },
        { label: 'Mengandung simbol', isMet: /[^A-Za-z0-9\s]/.test(password) },
    ];

    return (
        <ul
            className={cn('grid gap-1.5', className)}
            aria-label="Syarat kata sandi"
        >
            {requirements.map((requirement) => (
                <RequirementItem key={requirement.label} {...requirement} />
            ))}
        </ul>
    );
}
