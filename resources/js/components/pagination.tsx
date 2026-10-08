import { Link, router, usePage } from '@inertiajs/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

export interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

export interface PaginationProps {
    links?: PaginationLink[];
    from?: number | null;
    to?: number | null;
    total?: number;
    lastPage?: number;
    perPage?: number;
    variant?: 'all' | 'summary' | 'navigation';
    className?: string;
    preserveScroll?: boolean;
}

export function Pagination({
    links = [],
    from,
    to,
    total,
    lastPage,
    perPage,
    variant = 'all',
    className,
    preserveScroll = true,
}: PaginationProps) {
    const page = usePage();
    const pageSizeOptions = [10, 25, 50, 100];
    const selectedPerPage = pageSizeOptions.includes(perPage ?? 10)
        ? (perPage ?? 10)
        : 10;
    const hasMultiplePages = (lastPage ?? 1) > 1;
    const canSelectPageSize = total !== undefined && total > 0;
    const showSummary = variant !== 'navigation';
    const showNavigation = variant !== 'summary' && hasMultiplePages;

    if (!showSummary && !showNavigation) {
        return null;
    }

    const summaryFrom = from ?? 0;
    const summaryTo = to ?? 0;

    return (
        <div
            className={cn(
                'flex flex-col items-center gap-3 sm:flex-row sm:justify-between',
                className,
            )}
        >
            {showSummary && (
                <div className="flex w-full flex-row flex-wrap items-center justify-between gap-3">
                    <p className="text-muted-foreground text-left text-xs">
                        Menampilkan{' '}
                        <span className="text-foreground font-semibold">
                            {summaryFrom}
                        </span>{' '}
                        -{' '}
                        <span className="text-foreground font-semibold">
                            {summaryTo}
                        </span>{' '}
                        dari{' '}
                        <span className="text-foreground font-semibold">
                            {total}
                        </span>{' '}
                        data
                    </p>

                    {canSelectPageSize && (
                        <div className="text-muted-foreground flex shrink-0 items-center gap-2 text-xs">
                        <label htmlFor="pagination-per-page">Tampilkan</label>
                        <Select
                            value={String(selectedPerPage)}
                            onValueChange={(value) => {
                                const url = new URL(
                                    page.url,
                                    'http://localhost',
                                );
                                url.searchParams.set('per_page', value);
                                url.searchParams.delete('page');

                                router.get(
                                    `${url.pathname}${url.search}`,
                                    {},
                                    { preserveScroll, preserveState: true },
                                );
                            }}
                        >
                            <SelectTrigger
                                id="pagination-per-page"
                                className="h-8 w-20 text-xs"
                            >
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {pageSizeOptions.map((option) => (
                                    <SelectItem
                                        key={option}
                                        value={String(option)}
                                    >
                                        {option}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <span>data</span>
                        </div>
                    )}
                </div>
            )}

            {showNavigation && (
                <nav
                    aria-label="Navigasi halaman"
                    className={cn(
                        'flex flex-wrap items-center justify-center gap-1.5',
                        !showSummary && 'mx-auto',
                    )}
                >
                    {links.map((link, idx) => {
                        const isPrev =
                            link.label.includes('&laquo;') ||
                            link.label.toLowerCase().includes('previous') ||
                            link.label.toLowerCase().includes('sebelumnya');
                        const isNext =
                            link.label.includes('&raquo;') ||
                            link.label.toLowerCase().includes('next') ||
                            link.label.toLowerCase().includes('selanjutnya');
                        const isEllipsis =
                            link.label === '...' ||
                            link.label.includes('...') ||
                            link.label.includes('&hellip;');

                        // Ellipsis separator
                        if (isEllipsis) {
                            return (
                                <span
                                    key={`ellipsis-${idx}`}
                                    aria-hidden="true"
                                    className="text-muted-foreground flex size-9 items-center justify-center text-xs font-bold select-none"
                                >
                                    ...
                                </span>
                            );
                        }

                        // Previous Button
                        if (isPrev) {
                            if (!link.url) {
                                return (
                                    <span
                                        key={`prev-${idx}`}
                                        aria-disabled="true"
                                        className="border-border/40 bg-muted/20 text-muted-foreground/35 flex size-9 cursor-not-allowed items-center justify-center rounded-xl border select-none"
                                    >
                                        <ChevronLeft className="size-4" />
                                        <span className="sr-only">
                                            Halaman sebelumnya
                                        </span>
                                    </span>
                                );
                            }

                            return (
                                <Link
                                    key={`prev-${idx}`}
                                    href={link.url}
                                    preserveScroll={preserveScroll}
                                    aria-label="Halaman sebelumnya"
                                    className="border-border/70 bg-card text-foreground hover:border-border hover:bg-muted flex size-9 items-center justify-center rounded-xl border transition-colors"
                                >
                                    <ChevronLeft className="size-4" />
                                </Link>
                            );
                        }

                        // Next Button
                        if (isNext) {
                            if (!link.url) {
                                return (
                                    <span
                                        key={`next-${idx}`}
                                        aria-disabled="true"
                                        className="border-border/40 bg-muted/20 text-muted-foreground/35 flex size-9 cursor-not-allowed items-center justify-center rounded-xl border select-none"
                                    >
                                        <ChevronRight className="size-4" />
                                        <span className="sr-only">
                                            Halaman selanjutnya
                                        </span>
                                    </span>
                                );
                            }

                            return (
                                <Link
                                    key={`next-${idx}`}
                                    href={link.url}
                                    preserveScroll={preserveScroll}
                                    aria-label="Halaman selanjutnya"
                                    className="border-border/70 bg-card text-foreground hover:border-border hover:bg-muted flex size-9 items-center justify-center rounded-xl border transition-colors"
                                >
                                    <ChevronRight className="size-4" />
                                </Link>
                            );
                        }

                        // Page Number Button
                        const pageNumber = link.label
                            .replace(/<[^>]*>?/gm, '')
                            .trim();

                        if (link.active) {
                            return (
                                <span
                                    key={`page-${idx}`}
                                    aria-current="page"
                                    className="border-primary bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-xl border text-xs font-bold shadow-xs select-none"
                                >
                                    {pageNumber}
                                </span>
                            );
                        }

                        if (!link.url) {
                            return (
                                <span
                                    key={`page-${idx}`}
                                    className="border-border/40 text-muted-foreground/40 flex size-9 items-center justify-center rounded-xl border text-xs font-medium select-none"
                                >
                                    {pageNumber}
                                </span>
                            );
                        }

                        return (
                            <Link
                                key={`page-${idx}`}
                                href={link.url}
                                preserveScroll={preserveScroll}
                                aria-label={`Ke halaman ${pageNumber}`}
                                className="border-border/70 bg-card text-foreground hover:border-border hover:bg-muted flex size-9 items-center justify-center rounded-xl border text-xs font-semibold transition-colors"
                            >
                                {pageNumber}
                            </Link>
                        );
                    })}
                </nav>
            )}
        </div>
    );
}
