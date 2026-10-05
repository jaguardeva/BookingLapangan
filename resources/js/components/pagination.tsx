import { Link } from '@inertiajs/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

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
    className?: string;
    preserveScroll?: boolean;
}

export function Pagination({
    links = [],
    from,
    to,
    total,
    className,
    preserveScroll = true,
}: PaginationProps) {
    if (!links || links.length <= 1) {
        return null;
    }

    const showSummary =
        total !== undefined &&
        total > 0 &&
        from !== undefined &&
        from !== null &&
        to !== undefined &&
        to !== null;

    return (
        <div
            className={cn(
                'flex flex-col items-center gap-3 sm:flex-row sm:justify-between',
                className,
            )}
        >
            {showSummary && (
                <p className="text-xs text-muted-foreground text-center sm:text-left">
                    Menampilkan{' '}
                    <span className="font-semibold text-foreground">{from}</span> -{' '}
                    <span className="font-semibold text-foreground">{to}</span> dari{' '}
                    <span className="font-semibold text-foreground">{total}</span> data
                </p>
            )}

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
                                className="flex size-9 items-center justify-center text-xs font-bold text-muted-foreground select-none"
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
                                    className="flex size-9 items-center justify-center rounded-xl border border-border/40 bg-muted/20 text-muted-foreground/35 cursor-not-allowed select-none"
                                >
                                    <ChevronLeft className="size-4" />
                                    <span className="sr-only">Halaman sebelumnya</span>
                                </span>
                            );
                        }

                        return (
                            <Link
                                key={`prev-${idx}`}
                                href={link.url}
                                preserveScroll={preserveScroll}
                                aria-label="Halaman sebelumnya"
                                className="flex size-9 items-center justify-center rounded-xl border border-border/70 bg-card text-foreground transition-colors hover:border-border hover:bg-muted"
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
                                    className="flex size-9 items-center justify-center rounded-xl border border-border/40 bg-muted/20 text-muted-foreground/35 cursor-not-allowed select-none"
                                >
                                    <ChevronRight className="size-4" />
                                    <span className="sr-only">Halaman selanjutnya</span>
                                </span>
                            );
                        }

                        return (
                            <Link
                                key={`next-${idx}`}
                                href={link.url}
                                preserveScroll={preserveScroll}
                                aria-label="Halaman selanjutnya"
                                className="flex size-9 items-center justify-center rounded-xl border border-border/70 bg-card text-foreground transition-colors hover:border-border hover:bg-muted"
                            >
                                <ChevronRight className="size-4" />
                            </Link>
                        );
                    }

                    // Page Number Button
                    const pageNumber = link.label.replace(/<[^>]*>?/gm, '').trim();

                    if (link.active) {
                        return (
                            <span
                                key={`page-${idx}`}
                                aria-current="page"
                                className="flex size-9 items-center justify-center rounded-xl border border-primary bg-primary text-xs font-bold text-primary-foreground shadow-xs select-none"
                            >
                                {pageNumber}
                            </span>
                        );
                    }

                    if (!link.url) {
                        return (
                            <span
                                key={`page-${idx}`}
                                className="flex size-9 items-center justify-center rounded-xl border border-border/40 text-xs font-medium text-muted-foreground/40 select-none"
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
                            className="flex size-9 items-center justify-center rounded-xl border border-border/70 bg-card text-xs font-semibold text-foreground transition-colors hover:border-border hover:bg-muted"
                        >
                            {pageNumber}
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
