import { Head } from '@inertiajs/react';
import { useEffect, useRef, useState, useCallback } from 'react';
import { PublicLayout } from '@/layouts/public-layout';
import { Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ResetFilterButton } from '@/components/reset-filter-button';
import { Input } from '@/components/ui/input';
import { SearchableSelect } from '@/components/ui/searchable-select';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { LapanganCard } from '@/components/lapangan-card';
import { LapanganCardSkeleton } from '@/components/lapangan-card-skeleton';
import { Skeleton } from '@/components/ui/skeleton';
import { Pagination } from '@/components/pagination';
import { toast } from 'sonner';
import type { Category, Lapangan } from '@/types/booking';
import LapanganController from '@/actions/App/Http/Controllers/LapanganController';

interface PaginatedLapangans {
    data: Lapangan[];
    links: { url: string | null; label: string; active: boolean }[];
    total: number;
    from?: number | null;
    to?: number | null;
    last_page?: number;
    per_page?: number;
}

export default function LapanganIndex() {
    const initialParams = new URLSearchParams(
        typeof window !== 'undefined' ? window.location.search : '',
    );
    const initialSearch = initialParams.get('search') ?? '';
    const initialCategory = initialParams.get('category') ?? 'all';
    const initialSort = initialParams.get('sort') ?? 'latest';
    const initialPage = Number(initialParams.get('page') ?? 1);
    const initialPerPage = Number(initialParams.get('per_page') ?? 10);

    const [lapangansData, setLapangansData] = useState<PaginatedLapangans>({
        data: [],
        links: [],
        total: 0,
    });
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState(initialSearch);
    const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
    const [selectedCategory, setSelectedCategory] = useState(initialCategory);
    const [sort, setSort] = useState(initialSort);
    const [page, setPage] = useState(Number.isInteger(initialPage) && initialPage > 0 ? initialPage : 1);
    const [perPage, setPerPage] = useState(initialPerPage);

    // Track the last filter key that was fetched
    const lastFetchedKeyRef = useRef<string | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const mainContentRef = useRef<HTMLElement | null>(null);

    const hasActiveFilters =
        search.trim() !== '' ||
        selectedCategory !== 'all' ||
        sort !== 'latest';

    // 1. Debounce search input changes
    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1);
        }, 300);

        return () => window.clearTimeout(timeoutId);
    }, [search]);

    // 2. Client-side asynchronous fetch function
    const fetchCatalogData = useCallback(
        async (
            searchVal: string,
            catVal: string,
            sortVal: string,
            pageVal: number,
            perPageVal: number,
        ) => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            const controller = new AbortController();
            abortControllerRef.current = controller;

            setLoading(true);

            const params = new URLSearchParams();
            if (searchVal.trim()) params.set('search', searchVal.trim());
            if (catVal && catVal !== 'all') params.set('category', catVal);
            if (sortVal && sortVal !== 'latest') params.set('sort', sortVal);
            if (pageVal > 1) params.set('page', String(pageVal));
            if (perPageVal && perPageVal !== 10) params.set('per_page', String(perPageVal));

            const queryString = params.toString();
            const requestUrl = LapanganController.data.url({
                query: Object.fromEntries(params.entries()),
            });
            const pageUrl = `/lapangan${queryString ? `?${queryString}` : ''}`;

            // Update browser URL silently without page reload so it remains shareable
            if (typeof window !== 'undefined') {
                window.history.replaceState({}, '', pageUrl);
            }

            try {
                const response = await fetch(requestUrl, {
                    signal: controller.signal,
                    headers: {
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                });

                if (!response.ok) {
                    throw new Error('Gagal mengambil data katalog lapangan');
                }

                const json: {
                    lapangans: PaginatedLapangans;
                    categories: Category[];
                } = await response.json();
                setLapangansData(json.lapangans);
                setCategories(json.categories);
            } catch (error) {
                if (error instanceof DOMException && error.name === 'AbortError') {
                    return;
                }

                if (!controller.signal.aborted) {
                    toast.error('Gagal memperbarui katalog lapangan.');
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        },
        [],
    );

    // 3. Single reactive effect that listens to filter and pagination changes
    useEffect(() => {
        const currentKey = JSON.stringify([debouncedSearch, selectedCategory, sort, page, perPage]);

        // Prevent redundant fetching if key has not changed (including initial mount)
        if (currentKey === lastFetchedKeyRef.current) {
            return;
        }

        lastFetchedKeyRef.current = currentKey;
        void fetchCatalogData(debouncedSearch, selectedCategory, sort, page, perPage);
    }, [debouncedSearch, selectedCategory, sort, page, perPage, fetchCatalogData]);

    useEffect(() => {
        return () => abortControllerRef.current?.abort();
    }, []);

    // Handle immediate Category filter change
    const handleCategoryChange = (val: string) => {
        setSelectedCategory(val);
        setPage(1);
    };

    // Handle immediate Sort change
    const handleSortChange = (val: string) => {
        setSort(val);
        setPage(1);
    };

    // Handle client-side page change
    const handlePageChange = (newPage: number) => {
        setPage(newPage);
        if (mainContentRef.current) {
            mainContentRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    // Handle per page change
    const handlePerPageChange = (newPerPage: number) => {
        setPerPage(newPerPage);
        setPage(1);
    };

    // Reset filters
    const resetFilters = () => {
        setSearch('');
        setDebouncedSearch('');
        setSelectedCategory('all');
        setSort('latest');
        setPage(1);
    };

    return (
        <PublicLayout>
            <Head title="Cari & Sewa Lapangan Olahraga" />

            <div className="bg-muted/30 border-border/50 border-b py-8">
                <div className="public-container max-w-[1240px]">
                    <h1 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl">
                        Katalog Lapangan Olahraga
                    </h1>
                    {loading ? (
                        <div className="mt-1 flex items-center gap-2">
                            <Skeleton className="h-4 w-56 rounded-md" />
                        </div>
                    ) : (
                        <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
                            Ditemukan {lapangansData.total} lapangan olahraga dengan ketersediaan real-time.
                        </p>
                    )}
                </div>
            </div>

            <div className="public-container grid max-w-[1240px] gap-6 py-8 sm:py-10 lg:grid-cols-[240px_minmax(0,1fr)] lg:items-start">
                <aside className="border-border/80 bg-card self-start rounded-2xl border p-4 shadow-xs lg:sticky lg:top-24">
                    <div className="mb-5 flex items-center justify-between">
                        <div>
                            <p className="text-foreground text-sm font-semibold">
                                Filter katalog
                            </p>
                            <p className="text-muted-foreground mt-1 text-xs">
                                Temukan lapangan yang sesuai.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                            <label
                                htmlFor="catalog-category"
                                className="text-foreground text-xs font-medium"
                            >
                                Kategori
                            </label>
                            <SearchableSelect
                                id="catalog-category"
                                value={selectedCategory}
                                onValueChange={handleCategoryChange}
                                placeholder="Semua kategori"
                                searchPlaceholder="Cari kategori..."
                                options={[
                                    { value: 'all', label: 'Semua kategori' },
                                    ...categories.map((category) => ({
                                        value: category.slug,
                                        label: category.name,
                                    })),
                                ]}
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label
                                htmlFor="catalog-sort"
                                className="text-foreground text-xs font-medium"
                            >
                                Urutkan
                            </label>
                            <Select value={sort} onValueChange={handleSortChange}>
                                <SelectTrigger
                                    id="catalog-sort"
                                    className="h-10 w-full rounded-xl text-sm"
                                >
                                    <SelectValue placeholder="Urutkan" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="latest">
                                        Terbaru
                                    </SelectItem>
                                    <SelectItem value="rating">
                                        Rating tertinggi
                                    </SelectItem>
                                    <SelectItem value="price_asc">
                                        Harga terendah
                                    </SelectItem>
                                    <SelectItem value="price_desc">
                                        Harga tertinggi
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {hasActiveFilters && (
                            <ResetFilterButton
                                onClick={resetFilters}
                                className="h-9 w-full rounded-lg text-xs"
                            />
                        )}
                    </div>
                </aside>

                <main ref={mainContentRef} className="min-w-0">
                    <div className="relative mb-4">
                        <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                        <Input
                            type="search"
                            aria-label="Cari lapangan"
                            placeholder="Cari lapangan..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="bg-background h-11 rounded-xl pl-9 text-sm"
                        />
                    </div>

                    <div className="mb-4 flex justify-end">
                        <div className="text-muted-foreground hidden items-center gap-2 text-xs sm:flex">
                            <Filter className="size-3.5" /> Filter aktif diterapkan otomatis
                        </div>
                    </div>

                    {/* Pagination summary */}
                    {loading ? (
                        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                            <Skeleton className="h-4 w-48 rounded-md" />
                            <Skeleton className="h-8 w-24 rounded-lg" />
                        </div>
                    ) : (
                        <Pagination
                            links={lapangansData.links}
                            from={lapangansData.from}
                            to={lapangansData.to}
                            total={lapangansData.total}
                            lastPage={lapangansData.last_page}
                            perPage={lapangansData.per_page}
                            variant="summary"
                            className="mb-6"
                            onPageChange={handlePageChange}
                            onPerPageChange={handlePerPageChange}
                        />
                    )}

                    {/* Cards Grid / Skeletons / Empty State */}
                    {loading ? (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                            {Array.from({ length: Math.min(perPage, 6) }).map((_, i) => (
                                <LapanganCardSkeleton key={i} />
                            ))}
                        </div>
                    ) : lapangansData.data.length === 0 ? (
                        <div className="border-border bg-card rounded-2xl border border-dashed p-12 text-center sm:p-16">
                            <Filter className="text-muted-foreground/40 mx-auto mb-3 size-10" />
                            <h3 className="text-foreground text-base font-bold">
                                Tidak Ada Lapangan Ditemukan
                            </h3>
                            <p className="text-muted-foreground mx-auto mt-1 max-w-sm text-xs">
                                Coba ubah pencarian atau reset filter untuk menemukan lapangan yang Anda cari.
                            </p>
                            {hasActiveFilters && (
                                <Button
                                    onClick={resetFilters}
                                    variant="outline"
                                    size="sm"
                                    className="mt-4 rounded-xl"
                                >
                                    Hapus Pencarian & Reset Filter
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                            {lapangansData.data.map((item) => (
                                <LapanganCard key={item.id} item={item} />
                            ))}
                        </div>
                    )}

                    {/* Bottom Pagination */}
                    {loading ? (
                        <div className="mt-10 flex justify-center">
                            <Skeleton className="h-9 w-64 rounded-xl" />
                        </div>
                    ) : (
                        <Pagination
                            links={lapangansData.links}
                            from={lapangansData.from}
                            to={lapangansData.to}
                            total={lapangansData.total}
                            lastPage={lapangansData.last_page}
                            perPage={lapangansData.per_page}
                            variant="navigation"
                            className="mt-10"
                            onPageChange={handlePageChange}
                            onPerPageChange={handlePerPageChange}
                        />
                    )}
                </main>
            </div>
        </PublicLayout>
    );
}
