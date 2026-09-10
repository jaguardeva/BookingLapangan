import { Link } from '@inertiajs/react';
import { Star, Clock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Lapangan } from '@/types/booking';

interface LapanganCardProps {
    item: Lapangan;
}

export function LapanganCard({ item }: LapanganCardProps) {
    const rating = Number(item.reviews_avg_rating ?? 5).toFixed(1);
    const reviewCount = item.reviews_count ?? 0;
    const priceFormatted = Number(item.price_per_hour).toLocaleString('id-ID');

    return (
        <div className="group relative flex flex-col rounded-xl border border-border/70 bg-card overflow-hidden shadow-sm hover:shadow-md hover:border-emerald-500/40 transition-all duration-200">
            {/* Compact Image Container */}
            <div className="relative aspect-[16/9] overflow-hidden bg-muted">
                <img
                    src={
                        item.images?.[0] ||
                        'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80'
                    }
                    alt={item.name}
                    className="size-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-2.5 left-2.5">
                    <Badge className="bg-background/90 text-foreground backdrop-blur-md border-border/40 text-xs font-semibold px-2 py-0.5">
                        {item.category?.name}
                    </Badge>
                </div>
                <div className="absolute top-2.5 right-2.5">
                    <div className="flex items-center gap-1 rounded-md bg-background/90 px-1.5 py-0.5 text-xs font-bold backdrop-blur-md border border-border/40 text-foreground">
                        <Star className="size-3 fill-amber-400 text-amber-400" />
                        <span>{rating}</span>
                        <span className="text-xs text-muted-foreground">({reviewCount})</span>
                    </div>
                </div>
            </div>

            {/* Compact Card Content */}
            <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                    <h3 className="font-bold text-sm text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-1">
                        {item.name}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-1 leading-normal">
                        {item.description}
                    </p>

                    {/* Operational Time & Facilities compact line */}
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
                        <Clock className="size-3 text-emerald-500 shrink-0" />
                        <span>{item.operational_start} - {item.operational_end} WIB</span>
                    </div>

                    {item.facilities && item.facilities.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                            {item.facilities.slice(0, 3).map((f) => (
                                <span
                                    key={f.id}
                                    className="inline-block rounded bg-muted/70 px-1.5 py-0.5 text-xs text-muted-foreground"
                                >
                                    {f.name}
                                </span>
                            ))}
                            {item.facilities.length > 3 && (
                                <span className="inline-block rounded bg-muted/70 px-1 py-0.5 text-xs text-muted-foreground">
                                    +{item.facilities.length - 3}
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {/* Compact Price & Action */}
                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                    <div>
                        <span className="text-xs text-muted-foreground block leading-none">Harga</span>
                        <p className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                            Rp {priceFormatted}
                            <span className="text-xs font-normal text-muted-foreground">/jam</span>
                        </p>
                    </div>

                    <Button
                        asChild
                        size="sm"
                        className="h-8 px-3 text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-none"
                    >
                        <Link href={`/lapangan/${item.slug}`}>
                            Cek Jadwal <ArrowRight className="size-3 ml-1" />
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
