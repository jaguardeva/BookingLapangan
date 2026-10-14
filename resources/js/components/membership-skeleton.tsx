import { Skeleton } from '@/components/ui/skeleton';

export function MembershipSkeleton() {
    return (
        <div className="space-y-6" aria-busy="true" aria-label="Memuat membership">
            <div className="space-y-3">
                <Skeleton className="h-4 w-48 rounded-md" />
                {Array.from({ length: 2 }).map((_, index) => (
                    <div key={index} className="rounded-2xl border border-border/70 bg-card p-5">
                        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                            <div className="space-y-3">
                                <div className="flex flex-wrap gap-2">
                                    <Skeleton className="h-5 w-40 rounded-md" />
                                    <Skeleton className="h-5 w-16 rounded-full" />
                                    <Skeleton className="h-5 w-20 rounded-full" />
                                </div>
                                <Skeleton className="h-3 w-72 max-w-full rounded-md" />
                                <Skeleton className="h-3 w-56 max-w-full rounded-md" />
                            </div>
                            <div className="flex gap-2">
                                <Skeleton className="h-9 w-24 rounded-md" />
                                <Skeleton className="h-9 w-28 rounded-md" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="rounded-2xl border border-border/70 bg-card p-5 sm:p-6">
                <Skeleton className="h-4 w-40 rounded-md" />
                <div className="mt-4 space-y-4">
                    {Array.from({ length: 3 }).map((_, index) => (
                        <div key={index} className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 pb-3.5 last:border-0 last:pb-0">
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-48 rounded-md" />
                                <Skeleton className="h-3 w-32 rounded-md" />
                            </div>
                            <Skeleton className="h-8 w-24 rounded-full" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
