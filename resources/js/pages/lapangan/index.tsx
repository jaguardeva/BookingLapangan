import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { PublicLayout } from '@/layouts/public-layout';
import { Search, Filter, Star, Clock, ArrowRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { Category, Facility, Lapangan } from '@/types/booking';

interface Props {
    lapangans?: {
        data: Lapangan[];
        links: { url: string | null; label: string; active: boolean }[];
        total: number;
    };
    categories?: Category[];
    facilities?: Facility[];
    filters?: {
        search?: string;
        category?: string;
        facility?: string;
        sort?: string;
    };
}

export default function LapanganIndex({
    lapangans = { data: [], links: [], total: 0 },
    categories = [],
    facilities = [],
    filters = {},
}: Props) {
    const [search, setSearch] = useState(typeof filters?.search === 'string' ? filters.search : '');
    const [selectedCategory, setSelectedCategory] = useState(typeof filters?.category === 'string' && filters.category ? filters.category : 'all');
    const [selectedFacility, setSelectedFacility] = useState(typeof filters?.facility === 'string' && filters.facility ? filters.facility : 'all');
    const [sort, setSort] = useState(typeof filters?.sort === 'string' && filters.sort ? filters.sort : 'latest');

    const applyFilters = (newFilters: Record<string, string>) => {
        const query: Record<string, string> = {
            search,
            category: selectedCategory !== 'all' ? selectedCategory : '',
            facility: selectedFacility !== 'all' ? selectedFacility : '',
            sort,
            ...newFilters,
        };

        // Remove empty values
        Object.keys(query).forEach((key) => {
            if (!query[key]) delete query[key];
        });

        router.get('/lapangan', query, { preserveState: true, preserveScroll: true });
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters({ search });
    };

    const resetFilters = () => {
        setSearch('');
        setSelectedCategory('all');
        setSelectedFacility('all');
        setSort('latest');
        router.get('/lapangan');
    };

    return (
        <PublicLayout>
            <Head title="Cari & Sewa Lapangan Olahraga - SportBooking" />

            <div className="bg-muted/30 border-b border-border/50 py-8">
                <div className="container mx-auto px-4 sm:px-6">
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                        Katalog Lapangan Olahraga
                    </h1>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                        Ditemukan {lapangans.total} lapangan olahraga dengan ketersediaan real-time.
                    </p>

                    {/* Filter & Search Toolbar */}
                    <div className="mt-6 flex flex-col md:flex-row gap-3">
                        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
                            <Search className="size-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <Input
                                type="text"
                                placeholder="Cari nama lapangan..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10 h-10 rounded-xl bg-card text-xs sm:text-sm"
                            />
                        </form>

                        <div className="flex flex-wrap items-center gap-2">
                            {/* Category Filter */}
                            <select
                                value={selectedCategory}
                                onChange={(e) => {
                                    setSelectedCategory(e.target.value);
                                    applyFilters({ category: e.target.value !== 'all' ? e.target.value : '' });
                                }}
                                className="h-10 rounded-xl border border-input bg-card px-3 text-xs text-foreground focus:ring-2 focus:ring-emerald-500/40"
                            >
                                <option value="all">Semua Kategori</option>
                                {categories.map((c) => (
                                    <option key={c.id} value={c.slug}>{c.name}</option>
                                ))}
                            </select>

                            {/* Facility Filter */}
                            <select
                                value={selectedFacility}
                                onChange={(e) => {
                                    setSelectedFacility(e.target.value);
                                    applyFilters({ facility: e.target.value !== 'all' ? e.target.value : '' });
                                }}
                                className="h-10 rounded-xl border border-input bg-card px-3 text-xs text-foreground focus:ring-2 focus:ring-emerald-500/40"
                            >
                                <option value="all">Semua Fasilitas</option>
                                {facilities.map((f) => (
                                    <option key={f.id} value={String(f.id)}>{f.name}</option>
                                ))}
                            </select>

                            {/* Sort Filter */}
                            <select
                                value={sort}
                                onChange={(e) => {
                                    setSort(e.target.value);
                                    applyFilters({ sort: e.target.value });
                                }}
                                className="h-10 rounded-xl border border-input bg-card px-3 text-xs text-foreground focus:ring-2 focus:ring-emerald-500/40"
                            >
                                <option value="latest">Terbaru</option>
                                <option value="rating">Rating Tertinggi</option>
                                <option value="price_asc">Harga Terendah</option>
                                <option value="price_desc">Harga Tertinggi</option>
                            </select>

                            {(search || selectedCategory !== 'all' || selectedFacility !== 'all' || sort !== 'latest') && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={resetFilters}
                                    className="h-10 text-xs text-muted-foreground hover:text-foreground"
                                >
                                    <X className="size-3.5 mr-1" /> Reset
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 sm:px-6 py-10">
                {lapangans.data.length === 0 ? (
                    <div className="p-16 text-center rounded-2xl border border-dashed border-border bg-card">
                        <Filter className="size-10 text-muted-foreground/40 mx-auto mb-3" />
                        <h3 className="font-bold text-base text-foreground">Tidak Ada Lapangan Ditemukan</h3>
                        <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                            Coba ubah kata kunci pencarian atau reset filter untuk menemukan lapangan yang Anda cari.
                        </p>
                        <Button onClick={resetFilters} variant="outline" size="sm" className="mt-4 rounded-xl">
                            Reset Filter
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {lapangans.data.map((item) => (
                            <div
                                key={item.id}
                                className="group relative flex flex-col rounded-2xl border border-border/70 bg-card overflow-hidden shadow-sm hover:shadow-xl hover:border-emerald-500/40 transition-all duration-300"
                            >
                                <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                                    <img
                                        src={item.images?.[0] || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80'}
                                        alt={item.name}
                                        className="size-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                    <div className="absolute top-3 left-3">
                                        <Badge className="bg-background/90 text-foreground backdrop-blur-md border-border/50 text-[11px] font-semibold">
                                            {item.category?.name}
                                        </Badge>
                                    </div>
                                    <div className="absolute bottom-3 right-3">
                                        <div className="flex items-center gap-1 rounded-lg bg-background/90 px-2 py-1 text-xs font-bold backdrop-blur-md border border-border/40 text-foreground">
                                            <Star className="size-3.5 fill-amber-400 text-amber-400" />
                                            <span>{Number(item.reviews_avg_rating ?? 5).toFixed(1)}</span>
                                            <span className="text-[10px] text-muted-foreground">({item.reviews_count ?? 0})</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                                    <div>
                                        <h3 className="font-bold text-base sm:text-lg text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-1">
                                            {item.name}
                                        </h3>
                                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                                            {item.description}
                                        </p>

                                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-3 pt-3 border-t border-border/60">
                                            <Clock className="size-3.5 text-emerald-500 shrink-0" />
                                            <span>Jam: {item.operational_start} - {item.operational_end} WIB</span>
                                        </div>

                                        {item.facilities && item.facilities.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5 mt-2.5">
                                                {item.facilities.slice(0, 3).map((f) => (
                                                    <span
                                                        key={f.id}
                                                        className="inline-block rounded-md bg-muted px-2 py-0.5 text-[10px] text-muted-foreground"
                                                    >
                                                        {f.name}
                                                    </span>
                                                ))}
                                                {item.facilities.length > 3 && (
                                                    <span className="inline-block rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                                                        +{item.facilities.length - 3}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between pt-3 border-t border-border/60">
                                        <div>
                                            <span className="text-[11px] text-muted-foreground">Mulai dari</span>
                                            <p className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                                                Rp {Number(item.price_per_hour).toLocaleString('id-ID')}
                                                <span className="text-xs font-normal text-muted-foreground">/jam</span>
                                            </p>
                                        </div>
                                        <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-sm">
                                            <Link href={`/lapangan/${item.slug}`}>Cek Jadwal</Link>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {lapangans.links && lapangans.links.length > 3 && (
                    <div className="flex justify-center items-center gap-1.5 mt-10">
                        {lapangans.links.map((link, idx) => (
                            <Link
                                key={idx}
                                href={link.url || '#'}
                                preserveScroll
                                className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                                    link.active
                                        ? 'bg-emerald-600 text-white border-emerald-600'
                                        : link.url
                                        ? 'bg-card text-foreground hover:bg-muted border-border'
                                        : 'text-muted-foreground/50 border-transparent cursor-not-allowed pointer-events-none'
                                }`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </PublicLayout>
    );
}
