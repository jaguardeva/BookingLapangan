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
                'flex min-w-0 items-center gap-2 rounded-lg border px-2.5 py-2 text-xs font-medium transition-colors',
                isMet
                    ? 'border-emerald-500/20 bg-emerald-500/8 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300'
                    : 'border-border/70 bg-muted/20 text-muted-foreground',
            )}
        >
            <Icon className="size-4 shrink-0" aria-hidden="true" />
            <span className="min-w-0 leading-snug">{label}</span>
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
    const completedRequirements = requirements.filter(
        (requirement) => requirement.isMet,
    ).length;
    const completionPercentage =
        (completedRequirements / requirements.length) * 100;

    return (
        <div
            className={cn(
                'border-border/70 bg-muted/15 rounded-xl border p-3',
                className,
            )}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-foreground text-xs font-bold">
                        Persyaratan kata sandi
                    </p>
                    <p className="text-muted-foreground mt-0.5 text-[11px] leading-relaxed">
                        Gunakan kombinasi karakter agar akun Anda tetap aman.
                    </p>
                </div>
                <span
                    className={cn(
                        'shrink-0 rounded-full px-2 py-1 text-[10px] font-bold tabular-nums',
                        completedRequirements === requirements.length
                            ? 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300'
                            : 'bg-muted text-muted-foreground',
                    )}
                >
                    {completedRequirements}/{requirements.length}
                </span>
            </div>

            <div
                className="bg-muted mt-3 h-1.5 overflow-hidden rounded-full"
                role="progressbar"
                aria-label="Progress persyaratan kata sandi"
                aria-valuemin={0}
                aria-valuemax={requirements.length}
                aria-valuenow={completedRequirements}
            >
                <div
                    className="h-full rounded-full bg-emerald-500 transition-[width] duration-200"
                    style={{ width: `${completionPercentage}%` }}
                />
            </div>

            <ul
                className="mt-3 grid gap-2 sm:grid-cols-2"
                aria-label="Syarat kata sandi"
            >
                {requirements.map((requirement) => (
                    <RequirementItem key={requirement.label} {...requirement} />
                ))}
            </ul>
        </div>
    );
}
