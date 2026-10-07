import { Head, router } from "@inertiajs/react";
import { useEffect, useRef, useState } from "react";
import { PublicLayout } from "@/layouts/public-layout";
import { Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { LapanganCard } from "@/components/lapangan-card";
import { Pagination } from "@/components/pagination";
import type { Category, Lapangan } from "@/types/booking";
import { index as catalogIndex } from "@/routes/lapangan/index";

interface Props {
    lapangans?: {
        data: Lapangan[];
        links: { url: string | null; label: string; active: boolean }[];
        total: number;
    };
    categories?: Category[];
    filters?: {
        search?: string;
        category?: string;
        sort?: string;
    };
}

export default function LapanganIndex({
    lapangans = { data: [], links: [], total: 0 },
    categories = [],
    filters = {},
}: Props) {
    const [search, setSearch] = useState(
        typeof filters?.search === "string" ? filters.search : "",
    );
    const [selectedCategory, setSelectedCategory] = useState(
        typeof filters?.category === "string" && filters.category
            ? filters.category
            : "all",
    );
    const [sort, setSort] = useState(
        typeof filters?.sort === "string" && filters.sort
            ? filters.sort
            : "latest",
    );

    const filterKey = JSON.stringify([
        search,
        selectedCategory,
        sort,
    ]);
    const lastAppliedFilterKey = useRef(filterKey);

    useEffect(() => {
        if (lastAppliedFilterKey.current === filterKey) {
            return;
        }

        const timeoutId = window.setTimeout(() => {
            lastAppliedFilterKey.current = filterKey;
            const query: Record<string, string> = {
                search,
                category: selectedCategory !== "all" ? selectedCategory : "",
                sort: sort !== "latest" ? sort : "",
            };
            const activeFilters = Object.fromEntries(
                Object.entries(query).filter(([, value]) => value !== ""),
            );

            router.get(catalogIndex.url(), activeFilters, {
                preserveState: true,
                preserveScroll: true,
            });
        }, 300);

        return () => window.clearTimeout(timeoutId);
    }, [filterKey, search, selectedCategory, sort]);

    const resetFilters = () => {
        setSelectedCategory("all");
        setSort("latest");
    };

    const resetCatalog = () => {
        setSearch("");
        resetFilters();
    };

    return (
        <PublicLayout>
            <Head title="Cari & Sewa Lapangan Olahraga" />

            <div className="bg-muted/30 border-border/50 border-b py-8">
                <div className="public-container max-w-[1240px]">
                    <h1 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl">
                        Katalog Lapangan Olahraga
                    </h1>
                    <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
                        Ditemukan {lapangans.total} lapangan olahraga dengan
                        ketersediaan real-time.
                    </p>
                </div>
            </div>

            <div className="public-container grid max-w-[1240px] gap-6 py-8 sm:py-10 lg:grid-cols-[240px_minmax(0,1fr)] lg:items-start">
                <aside className="border-border/80 bg-card self-start rounded-2xl border p-4 shadow-sm lg:sticky lg:top-24">
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
                                onValueChange={setSelectedCategory}
                                placeholder="Semua kategori"
                                searchPlaceholder="Cari kategori..."
                                options={[
                                    { value: "all", label: "Semua kategori" },
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
                            <Select value={sort} onValueChange={setSort}>
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

                        {(selectedCategory !== "all" || sort !== "latest") && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={resetFilters}
                                className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground h-8 w-full cursor-pointer rounded-lg px-3 text-xs shadow-none"
                            >
                                Reset
                            </Button>
                        )}
                    </div>
                </aside>

                <main className="min-w-0">
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

                    <div className="mb-4 flex items-center justify-between gap-3">
                        <p className="text-muted-foreground text-sm">
                            <span className="text-foreground font-semibold">
                                {lapangans.total}
                            </span>{" "}
                            lapangan ditemukan
                        </p>
                        <div className="text-muted-foreground hidden items-center gap-2 text-xs sm:flex">
                            <Filter className="size-3.5" /> Filter aktif
                            diterapkan otomatis
                        </div>
                    </div>

                    {lapangans.data.length === 0 ? (
                        <div className="border-border bg-card rounded-2xl border border-dashed p-12 text-center sm:p-16">
                            <Filter className="text-muted-foreground/40 mx-auto mb-3 size-10" />
                            <h3 className="text-foreground text-base font-bold">
                                Tidak Ada Lapangan Ditemukan
                            </h3>
                            <p className="text-muted-foreground mx-auto mt-1 max-w-sm text-xs">
                                Coba ubah pencarian atau reset filter untuk
                                menemukan lapangan yang Anda cari.
                            </p>
                            <Button
                                onClick={resetCatalog}
                                variant="outline"
                                size="sm"
                                className="mt-4 rounded-xl"
                            >
                                Hapus Pencarian & Reset Filter
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                            {lapangans.data.map((item) => (
                                <LapanganCard key={item.id} item={item} />
                            ))}
                        </div>
                    )}

                    <Pagination
                        links={lapangans.links}
                        total={lapangans.total}
                        className="mt-10"
                    />
                </main>
            </div>
        </PublicLayout>
    );
}
