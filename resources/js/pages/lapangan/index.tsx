import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { PublicLayout } from '@/layouts/public-layout';
import { Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LapanganCard } from '@/components/lapangan-card';
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

                </div>
            </div>

            <div className="container mx-auto grid gap-6 px-4 py-8 sm:px-6 sm:py-10 lg:grid-cols-[240px_minmax(0,1fr)] lg:items-start">
                <aside className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm lg:sticky lg:top-24">
                    <div className="mb-5 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-semibold text-foreground">Filter katalog</p>
                            <p className="mt-1 text-xs text-muted-foreground">Temukan lapangan yang sesuai.</p>
                        </div>
                        {(search || selectedCategory !== 'all' || selectedFacility !== 'all' || sort !== 'latest') && (
                            <Button type="button" variant="ghost" size="sm" onClick={resetFilters} className="h-8 rounded-lg px-2 text-xs text-muted-foreground">
                                Reset
                            </Button>
                        )}
                    </div>

                    <div className="flex flex-col gap-4">
                        <form onSubmit={handleSearchSubmit} className="relative">
                            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                type="text"
                                placeholder="Cari lapangan..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="h-10 rounded-xl bg-background pl-9 text-sm"
                            />
                        </form>

                        <div className="flex flex-col gap-2">
                            <label htmlFor="catalog-category" className="text-xs font-medium text-foreground">Kategori</label>
                            <SearchableSelect
                                id="catalog-category"
                                value={selectedCategory}
                                onValueChange={(value) => {
                                    setSelectedCategory(value);
                                    applyFilters({ category: value !== 'all' ? value : '' });
                                }}
                                placeholder="Semua kategori"
                                searchPlaceholder="Cari kategori..."
                                options={[
                                    { value: 'all', label: 'Semua kategori' },
                                    ...categories.map((category) => ({ value: category.slug, label: category.name })),
                                ]}
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label htmlFor="catalog-facility" className="text-xs font-medium text-foreground">Fasilitas</label>
                            <SearchableSelect
                                id="catalog-facility"
                                value={selectedFacility}
                                onValueChange={(value) => {
                                    setSelectedFacility(value);
                                    applyFilters({ facility: value !== 'all' ? value : '' });
                                }}
                                placeholder="Semua fasilitas"
                                searchPlaceholder="Cari fasilitas..."
                                options={[
                                    { value: 'all', label: 'Semua fasilitas' },
                                    ...facilities.map((facility) => ({ value: String(facility.id), label: facility.name })),
                                ]}
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label htmlFor="catalog-sort" className="text-xs font-medium text-foreground">Urutkan</label>
                            <Select value={sort} onValueChange={(value) => {
                                setSort(value);
                                applyFilters({ sort: value });
                            }}>
                                <SelectTrigger id="catalog-sort" className="h-10 w-full rounded-xl text-sm">
                                    <SelectValue placeholder="Urutkan" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="latest">Terbaru</SelectItem>
                                    <SelectItem value="rating">Rating tertinggi</SelectItem>
                                    <SelectItem value="price_asc">Harga terendah</SelectItem>
                                    <SelectItem value="price_desc">Harga tertinggi</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </aside>

                <main className="min-w-0">
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <p className="text-sm text-muted-foreground"><span className="font-semibold text-foreground">{lapangans.total}</span> lapangan ditemukan</p>
                        <div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex"><Filter className="size-3.5" /> Filter aktif diterapkan otomatis</div>
                    </div>

                    {lapangans.data.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center sm:p-16">
                            <Filter className="mx-auto mb-3 size-10 text-muted-foreground/40" />
                            <h3 className="text-base font-bold text-foreground">Tidak Ada Lapangan Ditemukan</h3>
                            <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">Coba ubah kata kunci atau reset filter untuk menemukan lapangan yang Anda cari.</p>
                            <Button onClick={resetFilters} variant="outline" size="sm" className="mt-4 rounded-xl">Reset Filter</Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                            {lapangans.data.map((item) => <LapanganCard key={item.id} item={item} />)}
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
                </main>
            </div>
        </PublicLayout>
    );
}
