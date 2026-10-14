import { Head } from '@inertiajs/react';
import { PublicLayout } from '@/layouts/public-layout';
import { Skeleton } from '@/components/ui/skeleton';

function DetailPanelSkeleton() {
    return (
        <div className="border-border/70 bg-card space-y-5 rounded-2xl border p-5 shadow-lg sm:p-6">
            <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-2">
                    <Skeleton className="h-3 w-20 rounded" />
                    <Skeleton className="h-8 w-36 rounded-md" />
                </div>
                <Skeleton className="size-10 rounded-xl" />
            </div>

            <div className="space-y-2.5">
                <Skeleton className="h-3 w-32 rounded" />
                <div className="grid grid-cols-3 gap-2">
                    {Array.from({ length: 3 }).map((_, index) => (
                        <Skeleton key={index} className="h-16 rounded-xl" />
                    ))}
                </div>
            </div>

            <div className="space-y-3">
                <Skeleton className="h-3 w-32 rounded" />
                <Skeleton className="h-3 w-40 rounded" />
                <div className="grid grid-cols-2 gap-2">
                    {Array.from({ length: 8 }).map((_, index) => (
                        <Skeleton key={index} className="h-11 rounded-lg" />
                    ))}
                </div>
            </div>

            <Skeleton className="h-11 w-full rounded-xl" />
            <Skeleton className="h-11 w-full rounded-xl" />
        </div>
    );
}

export function LapanganDetailSkeleton() {
    return (
        <PublicLayout>
            <Head title="Memuat Detail Lapangan" />

            <div className="border-border/60 bg-muted/20 border-b py-3">
                <div className="public-container flex items-center gap-2">
                    <Skeleton className="h-3 w-16 rounded" />
                    <Skeleton className="size-3 rounded-full" />
                    <Skeleton className="h-3 w-28 rounded" />
                    <Skeleton className="size-3 rounded-full" />
                    <Skeleton className="h-3 w-32 rounded" />
                </div>
            </div>

            <div className="public-container max-w-[1240px] py-8" aria-busy="true" aria-label="Memuat detail lapangan">
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                    <div className="space-y-8 lg:col-span-2">
                        <div className="space-y-3">
                            <Skeleton className="aspect-[16/9] w-full rounded-2xl" />
                            <div className="flex gap-2 overflow-hidden">
                                {Array.from({ length: 5 }).map((_, index) => (
                                    <Skeleton key={index} className="size-16 shrink-0 rounded-lg sm:size-20" />
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex flex-col gap-2">
                                <Skeleton className="h-3 w-24 rounded" />
                                <Skeleton className="h-8 w-2/3 rounded-md" />
                                <Skeleton className="h-4 w-full rounded" />
                                <Skeleton className="h-4 w-4/5 rounded" />
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {Array.from({ length: 4 }).map((_, index) => (
                                    <Skeleton key={index} className="h-7 w-24 rounded-lg" />
                                ))}
                            </div>
                        </div>

                        <div className="border-border/70 rounded-2xl border p-5 sm:p-6">
                            <Skeleton className="h-5 w-32 rounded" />
                            <div className="mt-5 space-y-4">
                                {Array.from({ length: 3 }).map((_, index) => (
                                    <div key={index} className="flex flex-col gap-2">
                                        <Skeleton className="h-4 w-36 rounded" />
                                        <Skeleton className="h-3 w-full rounded" />
                                        <Skeleton className="h-3 w-4/5 rounded" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <DetailPanelSkeleton />
                </div>

                <div className="mt-12 space-y-5">
                    <Skeleton className="h-7 w-52 rounded-md" />
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {Array.from({ length: 3 }).map((_, index) => (
                            <div key={index} className="border-border/70 bg-card overflow-hidden rounded-xl border shadow-sm">
                                <Skeleton className="aspect-[16/9] w-full rounded-none" />
                                <div className="space-y-3 p-4">
                                    <Skeleton className="h-4 w-3/4 rounded" />
                                    <Skeleton className="h-3 w-full rounded" />
                                    <Skeleton className="h-8 w-full rounded-lg" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
}
