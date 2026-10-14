import { Skeleton } from '@/components/ui/skeleton';

export function LapanganCardSkeleton() {
    return (
        <div className="flex flex-col rounded-xl border border-border/70 bg-card overflow-hidden shadow-xs">
            {/* Aspect 16/9 Image Skeleton */}
            <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted/60">
                <Skeleton className="size-full rounded-none" />
                {/* Category Badge Placeholder */}
                <div className="absolute left-3 top-3">
                    <Skeleton className="h-6 w-28 rounded-full bg-slate-900/40 backdrop-blur-xs" />
                </div>
                {/* Rating Badge Placeholder */}
                <div className="absolute top-2.5 right-2.5">
                    <Skeleton className="h-5 w-14 rounded-md bg-background/80" />
                </div>
            </div>

            {/* Content Skeleton */}
            <div className="flex min-w-0 flex-1 flex-col justify-between space-y-3 p-3.5">
                <div className="space-y-2">
                    {/* Title */}
                    <Skeleton className="h-4 w-3/4 rounded-md" />
                    {/* Description line */}
                    <Skeleton className="h-3 w-full rounded-md" />
                    <Skeleton className="h-3 w-4/5 rounded-md" />

                    {/* Operational Time */}
                    <div className="flex items-center gap-1.5 pt-1">
                        <Skeleton className="size-3 rounded-full shrink-0" />
                        <Skeleton className="h-3 w-32 rounded-md" />
                    </div>

                    {/* Facilities Tags */}
                    <div className="flex flex-wrap gap-1 pt-1">
                        <Skeleton className="h-4 w-12 rounded" />
                        <Skeleton className="h-4 w-16 rounded" />
                        <Skeleton className="h-4 w-14 rounded" />
                    </div>
                </div>

                {/* Price & Action Button Skeleton */}
                <div className="flex flex-col items-stretch gap-2.5 border-t border-border/50 pt-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                    <div className="space-y-1">
                        <Skeleton className="h-2.5 w-8 rounded" />
                        <Skeleton className="h-4 w-24 rounded" />
                    </div>
                    <Skeleton className="h-8 w-full sm:w-24 rounded-lg" />
                </div>
            </div>
        </div>
    );
}
