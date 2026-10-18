import { Skeleton } from '@/components/ui/skeleton';

export function HomeStatsSkeleton() {
    return (
        <div className="grid grid-cols-2 gap-y-6 sm:grid-cols-4 sm:gap-y-0">
            {Array.from({ length: 4 }).map((_, index) => (
                <div
                    key={index}
                    className="flex flex-col items-center justify-center gap-2 px-3"
                >
                    <Skeleton className="h-10 w-16 rounded-md bg-current/10 sm:h-12" />
                    <Skeleton className="h-3 w-20 rounded-md bg-current/10" />
                </div>
            ))}
        </div>
    );
}

export function HomeBannerSkeleton() {
    return (
        <div className="space-y-4" aria-busy="true">
            <div className="flex items-end justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-4 w-32 rounded-full" />
                    <Skeleton className="h-7 w-64 rounded-lg" />
                </div>
                <div className="hidden gap-2 sm:flex">
                    <Skeleton className="size-9 rounded-full" />
                    <Skeleton className="size-9 rounded-full" />
                </div>
            </div>
            <Skeleton className="min-h-[260px] w-full rounded-3xl sm:min-h-[320px] lg:min-h-[360px]" />
        </div>
    );
}

export function HomeCategorySkeleton() {
    return (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3" aria-busy="true">
            {Array.from({ length: 6 }).map((_, index) => (
                <div
                    key={index}
                    className="flex min-h-32 flex-col justify-between rounded-2xl border border-primary/15 bg-background/80 p-5"
                >
                    <Skeleton className="size-10 rounded-xl" />
                    <div className="flex items-center justify-between gap-2">
                        <Skeleton className="h-4 w-24 rounded-md" />
                        <Skeleton className="size-4 rounded-full" />
                    </div>
                </div>
            ))}
        </div>
    );
}

export function HomeTestimonialsSkeleton() {
    return (
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3" aria-busy="true">
            {Array.from({ length: 6 }).map((_, index) => (
                <div
                    key={index}
                    className="border-brand-foreground/15 bg-brand-foreground/[0.06] flex min-h-56 flex-col justify-between rounded-2xl border p-6"
                >
                    <div className="flex flex-col gap-4">
                        <Skeleton className="h-4 w-24 rounded-md bg-brand-foreground/15" />
                        <Skeleton className="h-4 w-full rounded-md bg-brand-foreground/15" />
                        <Skeleton className="h-4 w-4/5 rounded-md bg-brand-foreground/15" />
                    </div>
                    <div className="flex items-end justify-between gap-3">
                        <div className="flex flex-col gap-2">
                            <Skeleton className="h-3 w-28 rounded-md bg-brand-foreground/15" />
                            <Skeleton className="h-3 w-24 rounded-md bg-brand-foreground/15" />
                        </div>
                        <Skeleton className="h-6 w-28 rounded-full bg-brand-foreground/15" />
                    </div>
                </div>
            ))}
        </div>
    );
}
