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

    const isMultiple = banners.length > 1;

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

    const currentBanner = banners[currentIndex];
    const formattedEndDate = formatValidityDate(currentBanner.ends_at);
    const isExternalLink =
        currentBanner.link_url?.startsWith('http://') ||
        currentBanner.link_url?.startsWith('https://');

    return (
        <section
            className="public-container mx-auto max-w-[1240px] px-4 pt-10 sm:px-6 sm:pt-14 lg:px-8"
            aria-label="Promosi dan Penawaran Spesial"
        >
            {/* Section Header */}
            <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <Sparkles className="size-3.5" />
                        </span>
                        <p className="eyebrow tracking-wider text-xs font-bold uppercase text-primary">
                            PENAWARAN SPESIAL
                        </p>
                    </div>
                    <h2 className="section-title mt-1.5 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                        Promo & Penawaran Menarik
                    </h2>
                    <p className="section-copy mt-1 max-w-xl text-sm text-muted-foreground sm:text-base">
                        Dapatkan penawaran terbaik dan promo eksklusif untuk sewa
                        lapangan olahraga favorit Anda.
                    </p>
                </div>

                {isMultiple && (
                    <div className="flex items-center gap-2.5 self-end sm:self-auto">
                        <span className="text-xs font-semibold tabular-nums text-muted-foreground">
                            {currentIndex + 1} / {banners.length}
                        </span>
                        <div className="flex items-center gap-1">
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="size-8 rounded-full border-border/80 bg-background/80 shadow-xs hover:bg-accent"
                                onClick={handlePrev}
                                aria-label="Banner sebelumnya"
                            >
                                <ChevronLeft className="size-4" />
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="size-8 rounded-full border-border/80 bg-background/80 shadow-xs hover:bg-accent"
                                onClick={handleNext}
                                aria-label="Banner berikutnya"
                            >
                                <ChevronRight className="size-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Banner Card Container */}
            <div
                className="group relative overflow-hidden rounded-3xl border border-border/80 bg-card shadow-sm transition-shadow duration-300 hover:shadow-md"
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
            >
                <div className="relative min-h-[280px] w-full sm:min-h-[340px] md:min-h-[380px] lg:min-h-[420px]">
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
                    <div className="absolute inset-0 z-20 bg-gradient-to-t from-black/95 via-black/60 to-black/20 md:bg-gradient-to-r md:from-black/95 md:via-black/70 md:to-transparent" />

                    {/* Content Layer */}
                    <div className="relative z-30 flex min-h-[280px] flex-col justify-end p-6 sm:min-h-[340px] sm:p-8 md:min-h-[380px] md:justify-center md:p-12 lg:min-h-[420px] lg:p-14">
                        <div className="max-w-2xl space-y-3.5 sm:space-y-4">
                            {/* Badges */}
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow-xs">
                                    <Tag className="size-3" />
                                    Promo Pilihan
                                </span>

                                {formattedEndDate ? (
                                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/40 px-3 py-1 text-xs font-medium text-white/95 backdrop-blur-md">
                                        <Calendar className="size-3 text-primary-foreground" />
                                        Berlaku s/d {formattedEndDate}
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/40 px-3 py-1 text-xs font-medium text-white/95 backdrop-blur-md">
                                        <Sparkles className="size-3 text-amber-400" />
                                        Penawaran Spesial
                                    </span>
                                )}
                            </div>

                            {/* Title */}
                            <h3 className="text-xl font-black tracking-tight text-white sm:text-3xl md:text-4xl lg:leading-tight">
                                {currentBanner.title}
                            </h3>

                            {/* Body */}
                            {currentBanner.body && (
                                <p className="line-clamp-2 text-sm leading-relaxed text-white/85 sm:line-clamp-3 sm:text-base">
                                    {currentBanner.body}
                                </p>
                            )}

                            {/* CTA Action */}
                            <div className="pt-2 sm:pt-3">
                                {currentBanner.link_url ? (
                                    isExternalLink ? (
                                        <a
                                            href={currentBanner.link_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-md transition-all hover:gap-3 hover:bg-primary/90 hover:shadow-lg"
                                        >
                                            <span>Klaim Penawaran</span>
                                            <ExternalLink className="size-4" />
                                        </a>
                                    ) : (
                                        <Link
                                            href={currentBanner.link_url}
                                            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-md transition-all hover:gap-3 hover:bg-primary/90 hover:shadow-lg"
                                        >
                                            <span>Lihat Promo</span>
                                            <ArrowRight className="size-4" />
                                        </Link>
                                    )
                                ) : (
                                    <Link
                                        href={lapanganIndex.url()}
                                        className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-md transition-all hover:gap-3 hover:bg-primary/90 hover:shadow-lg"
                                    >
                                        <span>Lihat Lapangan</span>
                                        <ArrowRight className="size-4" />
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Carousel Dots Navigation */}
                    {isMultiple && (
                        <div className="absolute bottom-4 right-4 z-30 flex items-center gap-1.5 sm:bottom-6 sm:right-8">
                            {banners.map((banner, index) => {
                                const isActive = index === currentIndex;
                                return (
                                    <button
                                        key={banner.id}
                                        type="button"
                                        onClick={() => setCurrentIndex(index)}
                                        className={`h-2 rounded-full transition-all duration-300 ${
                                            isActive
                                                ? 'w-7 bg-primary'
                                                : 'w-2 bg-white/50 hover:bg-white/80'
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
