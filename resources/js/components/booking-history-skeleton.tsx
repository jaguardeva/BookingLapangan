import { Skeleton } from '@/components/ui/skeleton';

function BookingCardSkeleton() {
    return (
        <div className="border-border/70 bg-card flex min-w-0 flex-col overflow-hidden rounded-2xl border shadow-xs">
            <div className="border-border/50 bg-muted/20 flex items-center justify-between gap-2 border-b px-3.5 py-3 sm:px-5">
                <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-28 rounded-lg" />
                    <Skeleton className="hidden h-5 w-24 rounded-md sm:block" />
                </div>
                <Skeleton className="h-5 w-28 rounded-full" />
            </div>

            <div className="flex min-w-0 flex-col gap-3.5 p-3.5 sm:p-5">
                <div className="flex items-start gap-3 sm:gap-4">
                    <Skeleton className="size-16 shrink-0 rounded-xl sm:size-20" />
                    <div className="flex min-w-0 flex-1 flex-col gap-2 pt-1">
                        <Skeleton className="h-4 w-2/3 rounded-md" />
                        <Skeleton className="h-3 w-1/2 rounded-md" />
                    </div>
                </div>

                <div className="bg-muted/40 grid grid-cols-1 gap-3 rounded-xl p-3 sm:grid-cols-3">
                    {Array.from({ length: 3 }).map((_, index) => (
                        <div key={index} className="flex items-center gap-2">
                            <Skeleton className="size-7 shrink-0 rounded-lg" />
                            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                                <Skeleton className="h-2.5 w-16 rounded" />
                                <Skeleton className="h-3 w-24 rounded" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="border-border/60 bg-muted/15 flex flex-col gap-3 border-t p-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <div className="flex flex-col gap-1.5">
                    <Skeleton className="h-2.5 w-28 rounded" />
                    <Skeleton className="h-5 w-32 rounded" />
                </div>
                <div className="flex w-full gap-2 sm:w-auto">
                    <Skeleton className="h-9 flex-1 rounded-xl sm:w-28 sm:flex-none" />
                    <Skeleton className="h-9 flex-1 rounded-xl sm:w-28 sm:flex-none" />
                </div>
            </div>
        </div>
    );
}

export function BookingHistorySkeleton() {
    return (
        <div className="space-y-4" aria-busy="true" aria-label="Memuat riwayat booking">
            {Array.from({ length: 3 }).map((_, index) => (
                <BookingCardSkeleton key={index} />
            ))}
        </div>
    );
}
