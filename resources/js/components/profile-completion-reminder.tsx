import { Link } from '@inertiajs/react';
import { AlertCircle } from 'lucide-react';
import { edit } from '@/routes/profile';
import type { ProfileCompletion } from '@/types';

export function ProfileCompletionReminder({ completion }: { completion?: ProfileCompletion | null }) {
    if (!completion || completion.is_complete) return null;

    return (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-200">
            <div className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <div>
                    <p className="font-semibold">Lengkapi profil Anda ({completion.percentage}%)</p>
                    <p className="mt-1 text-xs">Masih diperlukan: {completion.missing.join(', ')}.</p>
                    <Link href={edit()} className="mt-2 inline-block font-semibold underline underline-offset-4">Lengkapi sekarang</Link>
                </div>
            </div>
        </div>
    );
}
