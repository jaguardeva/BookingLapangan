import { useEffect, useState } from 'react';
import { Link } from '@inertiajs/react';
import {
    ArrowRight,
    Calendar,
    ChevronLeft,
    ChevronRight,
    ExternalLink,
    Sparkles,
    Tag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { index as lapanganIndex } from '@/routes/lapangan';
import type { Banner } from '@/types/booking';

interface HomePromotionalBannersProps {
    banners: Banner[];
}

function formatValidityDate(dateString?: string | null): string | null {
    if (!dateString) return null;
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return null;
        return new Intl.DateTimeFormat('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        }).format(date);
    } catch {
        return null;
    }
}

export function HomePromotionalBanners({ banners }: HomePromotionalBannersProps) {
    if (!banners || banners.length === 0) {
        return null;
    }

    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [touchStartX, setTouchStartX] = useState<number | null>(null);
    const [touchEndX, setTouchEndX] = useState<number | null>(null);

    const isMultiple = banners.length > 1;
    const minSwipeDistance = 45;

    useEffect(() => {
        if (!isMultiple || isPaused) return;

        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % banners.length);
        }, 5000);

        return () => clearInterval(timer);
    }, [isMultiple, isPaused, banners.length]);

    const handlePrev = () => {
        setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
    };

    const handleNext = () => {
        setCurrentIndex((prev) => (prev + 1) % banners.length);
    };

    const onTouchStart = (e: React.TouchEvent) => {
        setIsPaused(true);
        setTouchEndX(null);
        setTouchStartX(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e: React.TouchEvent) => {
        setTouchEndX(e.targetTouches[0].clientX);
    };

    const onTouchEnd = () => {
        setIsPaused(false);
        if (touchStartX === null || touchEndX === null) return;
        const distance = touchStartX - touchEndX;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe && isMultiple) {
            handleNext();
        } else if (isRightSwipe && isMultiple) {
            handlePrev();
        }

        setTouchStartX(null);
        setTouchEndX(null);
    };

    const currentBanner = banners[currentIndex];
    const formattedEndDate = formatValidityDate(currentBanner.ends_at);
    const isExternalLink =
        currentBanner.link_url?.startsWith('http://') ||
        currentBanner.link_url?.startsWith('https://');

    return (
        <section
            className="public-container mx-auto max-w-[1240px] px-4 pt-8 sm:px-6 sm:pt-14 lg:px-8"
            aria-label="Promosi dan Penawaran Spesial"
        >
            {/* Section Header */}
            <div className="mb-4 sm:mb-5">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <span className="flex size-5.5 items-center justify-center rounded-full bg-primary/10 text-primary sm:size-6">
                            <Sparkles className="size-3 sm:size-3.5" />
                        </span>
                        <p className="eyebrow tracking-wider text-[11px] font-bold uppercase text-primary sm:text-xs">
                            PENAWARAN SPESIAL
                        </p>
                    </div>

                    {isMultiple && (
                        <div className="flex items-center gap-2">
                            <span className="text-[11px] font-semibold tabular-nums text-muted-foreground sm:text-xs">
                                {currentIndex + 1} / {banners.length}
                            </span>
                            <div className="flex items-center gap-1">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    className="size-7 rounded-full border-border/80 bg-background/80 shadow-xs hover:bg-accent sm:size-8"
                                    onClick={handlePrev}
                                    aria-label="Banner sebelumnya"
                                >
                                    <ChevronLeft className="size-3.5 sm:size-4" />
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    className="size-7 rounded-full border-border/80 bg-background/80 shadow-xs hover:bg-accent sm:size-8"
                                    onClick={handleNext}
                                    aria-label="Banner berikutnya"
                                >
                                    <ChevronRight className="size-3.5 sm:size-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                <h2 className="section-title mt-1 text-xl font-bold tracking-tight text-foreground sm:mt-1.5 sm:text-3xl">
                    Promo & Penawaran Menarik
                </h2>
                <p className="section-copy mt-0.5 max-w-xl text-xs text-muted-foreground sm:mt-1 sm:text-base">
                    Dapatkan penawaran terbaik dan promo eksklusif untuk sewa
                    lapangan olahraga favorit Anda.
                </p>
            </div>

            {/* Banner Card Container */}
            <div
                className="group relative overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm transition-shadow duration-300 hover:shadow-md sm:rounded-3xl"
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
            >
                <div className="relative min-h-[300px] w-full sm:min-h-[340px] md:min-h-[380px] lg:min-h-[420px]">
                    {/* Background Images */}
                    {banners.map((banner, index) => {
                        const isActive = index === currentIndex;
                        return (
                            <div
                                key={banner.id}
                                className={`absolute inset-0 size-full transition-opacity duration-700 ease-in-out ${
                                    isActive
                                        ? 'z-10 opacity-100'
                                        : 'pointer-events-none z-0 opacity-0'
                                }`}
                                aria-hidden={!isActive}
                            >
                                <img
                                    src={banner.image_url}
                                    alt={banner.alt_text ?? banner.title}
                                    className="size-full object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
                                />
                            </div>
                        );
                    })}

                    {/* Rich Gradient Protection Overlay */}
                    <div className="absolute inset-0 z-20 bg-gradient-to-t from-black/95 via-black/60 to-black/25 md:bg-gradient-to-r md:from-black/95 md:via-black/70 md:to-transparent" />

                    {/* Content Layer */}
                    <div className="relative z-30 flex min-h-[300px] flex-col justify-end p-4 pb-12 sm:min-h-[340px] sm:p-8 sm:pb-8 md:min-h-[380px] md:justify-center md:p-12 lg:min-h-[420px] lg:p-14">
                        <div className="max-w-2xl space-y-2.5 sm:space-y-4">
                            {/* Badges */}
                            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                                <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-semibold text-primary-foreground shadow-xs sm:gap-1.5 sm:px-3 sm:py-1 sm:text-xs">
                                    <Tag className="size-2.5 sm:size-3" />
                                    Promo Pilihan
                                </span>

                                {formattedEndDate ? (
                                    <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-black/40 px-2.5 py-0.5 text-[11px] font-medium text-white/95 backdrop-blur-md sm:gap-1.5 sm:px-3 sm:py-1 sm:text-xs">
                                        <Calendar className="size-2.5 text-primary-foreground sm:size-3" />
                                        Berlaku s/d {formattedEndDate}
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-black/40 px-2.5 py-0.5 text-[11px] font-medium text-white/95 backdrop-blur-md sm:gap-1.5 sm:px-3 sm:py-1 sm:text-xs">
                                        <Sparkles className="size-2.5 text-amber-400 sm:size-3" />
                                        Penawaran Spesial
                                    </span>
                                )}
                            </div>

                            {/* Title */}
                            <h3 className="text-lg font-black leading-snug tracking-tight text-white sm:text-3xl sm:leading-tight md:text-4xl">
                                {currentBanner.title}
                            </h3>

                            {/* Body */}
                            {currentBanner.body && (
                                <p className="line-clamp-2 text-xs leading-relaxed text-white/85 sm:line-clamp-3 sm:text-sm md:text-base">
                                    {currentBanner.body}
                                </p>
                            )}

                            {/* CTA Action */}
                            <div className="pt-1 sm:pt-3">
                                {currentBanner.link_url ? (
                                    isExternalLink ? (
                                        <a
                                            href={currentBanner.link_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground shadow-md transition-all hover:gap-3 hover:bg-primary/90 hover:shadow-lg sm:w-auto sm:px-6 sm:py-2.5 sm:text-sm"
                                        >
                                            <span>Klaim Penawaran</span>
                                            <ExternalLink className="size-3.5 sm:size-4" />
                                        </a>
                                    ) : (
                                        <Link
                                            href={currentBanner.link_url}
                                            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground shadow-md transition-all hover:gap-3 hover:bg-primary/90 hover:shadow-lg sm:w-auto sm:px-6 sm:py-2.5 sm:text-sm"
                                        >
                                            <span>Lihat Promo</span>
                                            <ArrowRight className="size-3.5 sm:size-4" />
                                        </Link>
                                    )
                                ) : (
                                    <Link
                                        href={lapanganIndex.url()}
                                        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground shadow-md transition-all hover:gap-3 hover:bg-primary/90 hover:shadow-lg sm:w-auto sm:px-6 sm:py-2.5 sm:text-sm"
                                    >
                                        <span>Lihat Lapangan</span>
                                        <ArrowRight className="size-3.5 sm:size-4" />
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Carousel Dots Navigation */}
                    {isMultiple && (
                        <div className="absolute bottom-3.5 left-1/2 z-30 flex -translate-x-1/2 items-center gap-1.5 sm:bottom-6 sm:left-auto sm:right-8 sm:translate-x-0">
                            {banners.map((banner, index) => {
                                const isActive = index === currentIndex;
                                return (
                                    <button
                                        key={banner.id}
                                        type="button"
                                        onClick={() => setCurrentIndex(index)}
                                        className={`h-1.5 rounded-full transition-all duration-300 sm:h-2 ${
                                            isActive
                                                ? 'w-6 bg-primary sm:w-7'
                                                : 'w-1.5 bg-white/50 hover:bg-white/80 sm:w-2'
                                        }`}
                                        aria-label={`Buka slide ${index + 1}`}
                                        aria-current={isActive}
                                    />
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
