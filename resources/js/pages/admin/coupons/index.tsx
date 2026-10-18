import { Head, router, useForm } from "@inertiajs/react";
import {
    createColumnHelper,
    rowPaginationFeature,
    rowSortingFeature,
    tableFeatures,
    useTable,
    type SortingState,
} from "@tanstack/react-table";
import { useEffect, useMemo, useRef, useState } from "react";
import {
    ArrowDown,
    ArrowUp,
    ArrowUpDown,
    Check,
    Edit2,
    Percent,
    Plus,
    Search,
    TicketPercent,
    Trash2,
    ToggleLeft,
    ToggleRight,
    Users,
    X,
} from "lucide-react";
import AdminLayout from "@/layouts/admin-layout";
import ConfirmDialog from "@/components/confirm-dialog";
import { Pagination } from "@/components/pagination";
import { ResetFilterButton } from "@/components/reset-filter-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import couponRoutes, {
    destroy,
    store,
    toggle,
    update,
} from "@/actions/App/Http/Controllers/Admin/CouponManagementController";

type Coupon = {
    id: string;
    code: string;
    discount_type: "percentage" | "fixed";
    discount_value: number;
    minimum_order_amount: number;
    maximum_discount_amount?: number | null;
    usage_limit?: number | null;
    per_user_limit?: number | null;
    used_count: number;
    starts_at?: string | null;
    ends_at?: string | null;
    is_active: boolean;
    created_at?: string;
};
type CouponFormData = {
    code: string;
    discount_type: "percentage" | "fixed";
    discount_value: number;
    minimum_order_amount: number;
    maximum_discount_amount: number | string;
    usage_limit: number | string;
    per_user_limit: number | string;
    starts_at: string;
    ends_at: string;
    is_active: boolean;
};
type Props = {
    coupons: {
        data: Coupon[];
        links: { url: string | null; label: string; active: boolean }[];
        from?: number | null;
        to?: number | null;
        total: number;
        last_page?: number;
        per_page?: number;
    };
    filters: {
        search?: string;
        status?: string;
        sort?: string;
        direction?: string;
    };
    stats: {
        total: number;
        active: number;
        inactive: number;
        total_usage: number;
    };
};

const features = tableFeatures({ rowSortingFeature, rowPaginationFeature });
const columnHelper = createColumnHelper<typeof features, Coupon>();

function formatCurrency(value: number | string | null | undefined): string {
    if (value === "" || value === null || value === undefined) return "";
    return Number(value).toLocaleString("id-ID");
}
function parseCurrency(value: string): number {
    const digits = value.replace(/\D/g, "");
    return digits ? Number(digits) : 0;
}
function formatDate(value?: string | null): string {
    if (!value) return "Tidak dibatasi";
    return new Date(value).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}
function dateInputValue(value?: string | null): string {
    return value ? value.slice(0, 10) : "";
}
function SortIcon({ direction }: { direction: false | "asc" | "desc" }) {
    if (direction === "asc") return <ArrowUp className="size-3.5" />;
    if (direction === "desc") return <ArrowDown className="size-3.5" />;
    return <ArrowUpDown className="size-3.5 opacity-50" />;
}
function FieldError({ message }: { message?: string }) {
    return message ? (
        <p className="text-destructive text-xs">{message}</p>
    ) : null;
}
function emptyForm(): CouponFormData {
    return {
        code: "",
        discount_type: "percentage",
        discount_value: 10,
        minimum_order_amount: 0,
        maximum_discount_amount: "",
        usage_limit: "",
        per_user_limit: "",
        starts_at: "",
        ends_at: "",
        is_active: true,
    };
}

export default function CouponsIndex({ coupons, filters, stats }: Props) {
    const form = useForm<CouponFormData>(emptyForm());
    const [search, setSearch] = useState(filters.search ?? "");
    const [status, setStatus] = useState(filters.status || "all");
    const [sorting, setSorting] = useState<SortingState>(
        filters.sort && filters.sort !== "created_at"
            ? [{ id: filters.sort, desc: filters.direction !== "asc" }]
            : [],
    );
    const [isFiltering, setIsFiltering] = useState(false);
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<Coupon | null>(null);
    const [deleting, setDeleting] = useState<Coupon | null>(null);
    const filterKey = JSON.stringify([search, status, sorting]);
    const initialFilterKey = useRef(filterKey);

    useEffect(() => {
        if (initialFilterKey.current === filterKey) {
            initialFilterKey.current = "";
            return;
        }
        const timeoutId = window.setTimeout(() => {
            const activeSort = sorting[0];
            setIsFiltering(true);
            router.get(
                couponRoutes.index.url({
                    query: {
                        search: search.trim() || undefined,
                        status: status === "all" ? undefined : status,
                        sort: activeSort?.id ?? "created_at",
                        direction: activeSort
                            ? activeSort.desc
                                ? "desc"
                                : "asc"
                            : "desc",
                        page: 1,
                    },
                }),
                {},
                {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                    onFinish: () => setIsFiltering(false),
                },
            );
        }, 300);
        return () => window.clearTimeout(timeoutId);
    }, [filterKey, search, sorting, status]);

    const resetFilters = () => {
        setSearch("");
        setStatus("all");
        setSorting([]);
    };
    const openCreate = () => {
        setEditing(null);
        form.setData(emptyForm());
        form.clearErrors();
        setFormOpen(true);
    };
    const openEdit = (coupon: Coupon) => {
        setEditing(coupon);
        form.setData({
            code: coupon.code,
            discount_type: coupon.discount_type,
            discount_value: Number(coupon.discount_value),
            minimum_order_amount: coupon.minimum_order_amount,
            maximum_discount_amount: coupon.maximum_discount_amount ?? "",
            usage_limit: coupon.usage_limit ?? "",
            per_user_limit: coupon.per_user_limit ?? "",
            starts_at: dateInputValue(coupon.starts_at),
            ends_at: dateInputValue(coupon.ends_at),
            is_active: coupon.is_active,
        });
        form.clearErrors();
        setFormOpen(true);
    };
    const closeForm = () => {
        if (form.processing) return;
        setFormOpen(false);
        form.clearErrors();
    };
    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        const options = {
            onSuccess: () => {
                setFormOpen(false);
                form.reset();
            },
        };
        if (editing) form.put(update.url(editing.id), options);
        else form.post(store.url(), options);
    };

    const columns = useMemo(
        () =>
            columnHelper.columns([
                columnHelper.accessor("code", {
                    header: ({ column }) => (
                        <button
                            type="button"
                            onClick={() => column.toggleSorting()}
                            className="inline-flex items-center gap-1.5 hover:text-foreground"
                        >
                            Kode <SortIcon direction={column.getIsSorted()} />
                        </button>
                    ),
                    cell: ({ row }) => (
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-mono font-bold tracking-wide">
                                    {row.original.code}
                                </span>
                                {row.original.is_active ? (
                                    <Badge className="border-primary/20 bg-primary/10 text-primary">
                                        Aktif
                                    </Badge>
                                ) : (
                                    <Badge variant="outline">Nonaktif</Badge>
                                )}
                            </div>
                            <span className="text-muted-foreground mt-1 block text-[11px]">
                                {formatDate(row.original.starts_at)} -{" "}
                                {formatDate(row.original.ends_at)}
                            </span>
                        </div>
                    ),
                }),
                columnHelper.accessor("discount_value", {
                    header: ({ column }) => (
                        <button
                            type="button"
                            onClick={() => column.toggleSorting()}
                            className="inline-flex items-center gap-1.5 hover:text-foreground"
                        >
                            Diskon <SortIcon direction={column.getIsSorted()} />
                        </button>
                    ),
                    cell: ({ row }) => (
                        <div className="text-primary flex items-center gap-2 font-bold">
                            {row.original.discount_type === "percentage" ? (
                                <Percent className="size-4" />
                            ) : (
                                <span className="text-sm">Rp</span>
                            )}{" "}
                            {row.original.discount_type === "percentage"
                                ? `${row.original.discount_value}%`
                                : formatCurrency(row.original.discount_value)}
                        </div>
                    ),
                }),
                columnHelper.display({
                    id: "rules",
                    header: "Aturan",
                    enableSorting: false,
                    cell: ({ row }) => (
                        <div className="text-muted-foreground text-xs">
                            <span>
                                Min. Rp{" "}
                                {formatCurrency(
                                    row.original.minimum_order_amount,
                                )}
                            </span>
                            {row.original.maximum_discount_amount ? (
                                <span className="block">
                                    Maks. Rp{" "}
                                    {formatCurrency(
                                        row.original.maximum_discount_amount,
                                    )}
                                </span>
                            ) : null}
                        </div>
                    ),
                }),
                columnHelper.accessor("used_count", {
                    header: ({ column }) => (
                        <button
                            type="button"
                            onClick={() => column.toggleSorting()}
                            className="inline-flex items-center gap-1.5 hover:text-foreground"
                        >
                            Penggunaan{" "}
                            <SortIcon direction={column.getIsSorted()} />
                        </button>
                    ),
                    cell: ({ row }) => (
                        <div>
                            <span className="font-semibold">
                                {row.original.used_count}
                                {row.original.usage_limit
                                    ? ` / ${row.original.usage_limit}`
                                    : ""}
                            </span>
                            <span className="text-muted-foreground block text-[11px]">
                                {row.original.per_user_limit
                                    ? `${row.original.per_user_limit}x per user`
                                    : "Tanpa batas per user"}
                            </span>
                        </div>
                    ),
                }),
                columnHelper.display({
                    id: "actions",
                    header: "Aksi",
                    enableSorting: false,
                    cell: ({ row }) => {
                        const coupon = row.original;
                        return (
                            <div className="flex items-center justify-end gap-1">
                                <Button
                                    size="icon-sm"
                                    variant="ghost"
                                    aria-label={`Edit ${coupon.code}`}
                                    onClick={() => openEdit(coupon)}
                                >
                                    <Edit2 className="size-4" />
                                </Button>
                                <Button
                                    size="icon-sm"
                                    variant="ghost"
                                    aria-label={`${coupon.is_active ? "Nonaktifkan" : "Aktifkan"} ${coupon.code}`}
                                    onClick={() =>
                                        router.post(
                                            toggle.url(coupon.id),
                                            {},
                                            { preserveScroll: true },
                                        )
                                    }
                                >
                                    {coupon.is_active ? (
                                        <ToggleRight className="text-primary size-4" />
                                    ) : (
                                        <ToggleLeft className="size-4" />
                                    )}
                                </Button>
                                <Button
                                    size="icon-sm"
                                    variant="ghost"
                                    aria-label={`Hapus ${coupon.code}`}
                                    onClick={() => setDeleting(coupon)}
                                >
                                    <Trash2 className="text-destructive size-4" />
                                </Button>
                            </div>
                        );
                    },
                }),
            ]),
        [],
    );
    const table = useTable({
        features,
        data: coupons.data,
        columns,
        state: { sorting },
        onSortingChange: setSorting,
        manualSorting: true,
        manualPagination: true,
        rowCount: coupons.total,
    });
    const hasActiveFilters =
        search.trim() !== "" || status !== "all" || sorting.length > 0;

    return (
        <AdminLayout
            breadcrumbs={[{ title: "Kupon", href: couponRoutes.index.url() }]}
        >
            <Head title="Kupon Promosi" />
            <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-primary text-sm font-semibold">
                            Marketing & Promosi
                        </p>
                        <h1 className="mt-1 text-2xl font-bold tracking-tight">
                            Kupon promosi
                        </h1>
                        <p className="text-muted-foreground mt-1 text-sm">
                            Kelola kode promo yang dapat digunakan pelanggan
                            saat checkout booking.
                        </p>
                    </div>
                    <Button onClick={openCreate} className="rounded-xl">
                        <Plus className="size-4" />
                        Tambah kupon
                    </Button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="border-border/80 bg-card rounded-2xl border p-4 shadow-sm transition-all hover:border-primary/30">
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground text-xs font-medium">
                                Total kupon
                            </span>
                            <TicketPercent className="text-primary size-5" />
                        </div>
                        <p className="mt-2 text-2xl font-bold">
                            {stats.total.toLocaleString("id-ID")}
                        </p>
                        <p className="text-muted-foreground mt-1 text-xs">
                            Semua kode promosi
                        </p>
                    </div>
                    <div className="border-border/80 bg-card rounded-2xl border p-4 shadow-sm transition-all hover:border-emerald-500/30">
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground text-xs font-medium">
                                Kupon aktif
                            </span>
                            <Check className="size-5 text-emerald-600" />
                        </div>
                        <p className="mt-2 text-2xl font-bold">
                            {stats.active.toLocaleString("id-ID")}
                        </p>
                        <p className="text-muted-foreground mt-1 text-xs">
                            Siap digunakan pelanggan
                        </p>
                    </div>
                    <div className="border-border/80 bg-card rounded-2xl border p-4 shadow-sm transition-all hover:border-muted-foreground/30">
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground text-xs font-medium">
                                Kupon nonaktif
                            </span>
                            <ToggleLeft className="text-muted-foreground size-5" />
                        </div>
                        <p className="mt-2 text-2xl font-bold">
                            {stats.inactive.toLocaleString("id-ID")}
                        </p>
                        <p className="text-muted-foreground mt-1 text-xs">
                            Tidak tampil di checkout
                        </p>
                    </div>
                    <div className="border-border/80 bg-card rounded-2xl border p-4 shadow-sm transition-all hover:border-blue-500/30">
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground text-xs font-medium">
                                Total penggunaan
                            </span>
                            <Users className="size-5 text-blue-600" />
                        </div>
                        <p className="mt-2 text-2xl font-bold">
                            {stats.total_usage.toLocaleString("id-ID")}
                        </p>
                        <p className="text-muted-foreground mt-1 text-xs">
                            Akumulasi redemption
                        </p>
                    </div>
                </div>
                <div className="border-border/80 bg-card flex flex-col gap-3 rounded-2xl border p-4 shadow-sm lg:flex-row lg:items-center">
                    <div className="relative min-w-0 flex-1">
                        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                        <Input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Cari kode kupon..."
                            className="h-9 pl-9"
                            aria-label="Cari kupon"
                        />
                    </div>
                    <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger className="h-9 w-full text-xs lg:w-44">
                            <SelectValue placeholder="Semua status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua status</SelectItem>
                            <SelectItem value="active">Aktif</SelectItem>
                            <SelectItem value="inactive">Nonaktif</SelectItem>
                        </SelectContent>
                    </Select>
                    {hasActiveFilters && (
                        <ResetFilterButton
                            onClick={resetFilters}
                            className="h-9 rounded-xl text-xs"
                        />
                    )}
                    {isFiltering && (
                        <span className="text-muted-foreground text-xs">
                            Memuat data...
                        </span>
                    )}
                </div>
                <Pagination
                    links={coupons.links}
                    from={coupons.from}
                    to={coupons.to}
                    total={coupons.total}
                    lastPage={coupons.last_page}
                    perPage={coupons.per_page}
                    variant="summary"
                />
                <div
                    className="border-border/80 bg-card overflow-hidden rounded-2xl border shadow-sm"
                    aria-busy={isFiltering}
                >
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[900px] text-left text-xs">
                            <thead className="border-border/60 bg-muted/50 text-muted-foreground border-b tracking-wider uppercase">
                                {table.getHeaderGroups().map((group) => (
                                    <tr key={group.id}>
                                        {group.headers.map((header) => (
                                            <th
                                                key={header.id}
                                                className={`px-4 py-3 ${header.column.id === "actions" ? "text-right" : ""}`}
                                            >
                                                {header.isPlaceholder ? null : (
                                                    <table.FlexRender
                                                        header={header}
                                                    />
                                                )}
                                            </th>
                                        ))}
                                    </tr>
                                ))}
                            </thead>
                            <tbody className="divide-border/40 divide-y">
                                {table.getRowModel().rows.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={columns.length}
                                            className="text-muted-foreground py-14 text-center"
                                        >
                                            <TicketPercent className="mx-auto mb-3 size-8 opacity-40" />
                                            <p className="font-medium">
                                                {hasActiveFilters
                                                    ? "Kupon tidak ditemukan."
                                                    : "Belum ada kupon."}
                                            </p>
                                            <p className="mt-1 text-xs">
                                                {hasActiveFilters
                                                    ? "Coba ubah kata kunci atau filter."
                                                    : "Buat kupon pertama untuk memulai promosi."}
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    table.getRowModel().rows.map((row) => (
                                        <tr
                                            key={row.id}
                                            className="hover:bg-muted/30 transition-colors"
                                        >
                                            {row.getAllCells().map((cell) => (
                                                <td
                                                    key={cell.id}
                                                    className={`px-4 py-4 ${cell.column.id === "actions" ? "text-right" : ""}`}
                                                >
                                                    <table.FlexRender
                                                        cell={cell}
                                                    />
                                                </td>
                                            ))}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                <Pagination
                    links={coupons.links}
                    from={coupons.from}
                    to={coupons.to}
                    total={coupons.total}
                    lastPage={coupons.last_page}
                    perPage={coupons.per_page}
                    variant="navigation"
                />
            </div>
            <Dialog
                open={formOpen}
                onOpenChange={(open) => !open && closeForm()}
            >
                <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            {editing ? "Edit kupon" : "Tambah kupon baru"}
                        </DialogTitle>
                        <DialogDescription>
                            {editing
                                ? "Perbarui aturan dan periode kupon."
                                : "Buat kode promo baru untuk pelanggan."}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={submit} className="space-y-5">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-1.5 sm:col-span-2">
                                <Label htmlFor="coupon-code">Kode kupon</Label>
                                <Input
                                    id="coupon-code"
                                    value={form.data.code}
                                    onChange={(event) =>
                                        form.setData(
                                            "code",
                                            event.target.value.toUpperCase(),
                                        )
                                    }
                                    placeholder="Contoh: HEMAT10"
                                    autoComplete="off"
                                />
                                <FieldError message={form.errors.code} />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="discount-type">
                                    Tipe diskon
                                </Label>
                                <Select
                                    value={form.data.discount_type}
                                    onValueChange={(
                                        value: "percentage" | "fixed",
                                    ) => form.setData("discount_type", value)}
                                >
                                    <SelectTrigger id="discount-type">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="percentage">
                                            Persentase (%)
                                        </SelectItem>
                                        <SelectItem value="fixed">
                                            Nominal (Rupiah)
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                <FieldError
                                    message={form.errors.discount_type}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="discount-value">
                                    Nilai diskon
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="discount-value"
                                        type="number"
                                        min={1}
                                        max={
                                            form.data.discount_type ===
                                            "percentage"
                                                ? 100
                                                : undefined
                                        }
                                        value={form.data.discount_value}
                                        onChange={(event) =>
                                            form.setData(
                                                "discount_value",
                                                Number(event.target.value),
                                            )
                                        }
                                        className={
                                            form.data.discount_type ===
                                            "percentage"
                                                ? "pr-8"
                                                : "pl-10"
                                        }
                                        placeholder={
                                            form.data.discount_type ===
                                            "percentage"
                                                ? "10"
                                                : "20.000"
                                        }
                                    />
                                    {form.data.discount_type ===
                                    "percentage" ? (
                                        <Percent className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2" />
                                    ) : (
                                        <span className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm">
                                            Rp
                                        </span>
                                    )}
                                </div>
                                <FieldError
                                    message={form.errors.discount_value}
                                />
                            </div>
                        </div>
                        <div className="border-border/70 bg-muted/20 rounded-xl border p-4">
                            <p className="mb-3 text-sm font-semibold">
                                Aturan penggunaan
                            </p>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-1.5">
                                    <Label>Minimum transaksi</Label>
                                    <div className="relative">
                                        <span className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm">
                                            Rp
                                        </span>
                                        <Input
                                            className="pl-10"
                                            value={formatCurrency(
                                                form.data.minimum_order_amount,
                                            )}
                                            onChange={(event) =>
                                                form.setData(
                                                    "minimum_order_amount",
                                                    parseCurrency(
                                                        event.target.value,
                                                    ),
                                                )
                                            }
                                            placeholder="0"
                                        />
                                        <FieldError
                                            message={
                                                form.errors.minimum_order_amount
                                            }
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <Label>
                                        Maksimum diskon{" "}
                                        <span className="text-muted-foreground font-normal">
                                            (opsional)
                                        </span>
                                    </Label>
                                    <div className="relative">
                                        <span className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm">
                                            Rp
                                        </span>
                                        <Input
                                            className="pl-10"
                                            value={formatCurrency(
                                                form.data
                                                    .maximum_discount_amount,
                                            )}
                                            onChange={(event) =>
                                                form.setData(
                                                    "maximum_discount_amount",
                                                    event.target.value
                                                        ? parseCurrency(
                                                              event.target
                                                                  .value,
                                                          )
                                                        : "",
                                                )
                                            }
                                            placeholder="Tanpa batas"
                                        />
                                    </div>
                                    <FieldError
                                        message={
                                            form.errors.maximum_discount_amount
                                        }
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label>
                                        Batas penggunaan{" "}
                                        <span className="text-muted-foreground font-normal">
                                            (opsional)
                                        </span>
                                    </Label>
                                    <Input
                                        type="number"
                                        min={1}
                                        value={form.data.usage_limit}
                                        onChange={(event) =>
                                            form.setData(
                                                "usage_limit",
                                                event.target.value
                                                    ? Number(event.target.value)
                                                    : "",
                                            )
                                        }
                                        placeholder="Tanpa batas"
                                    />
                                    <FieldError
                                        message={form.errors.usage_limit}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label>
                                        Batas per user{" "}
                                        <span className="text-muted-foreground font-normal">
                                            (opsional)
                                        </span>
                                    </Label>
                                    <Input
                                        type="number"
                                        min={1}
                                        value={form.data.per_user_limit}
                                        onChange={(event) =>
                                            form.setData(
                                                "per_user_limit",
                                                event.target.value
                                                    ? Number(event.target.value)
                                                    : "",
                                            )
                                        }
                                        placeholder="Tanpa batas"
                                    />
                                    <FieldError
                                        message={form.errors.per_user_limit}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-1.5">
                                <Label>
                                    Mulai berlaku{" "}
                                    <span className="text-muted-foreground font-normal">
                                        (opsional)
                                    </span>
                                </Label>
                                <Input
                                    type="date"
                                    value={form.data.starts_at}
                                    onChange={(event) =>
                                        form.setData(
                                            "starts_at",
                                            event.target.value,
                                        )
                                    }
                                />
                                <FieldError message={form.errors.starts_at} />
                            </div>
                            <div className="space-y-1.5">
                                <Label>
                                    Berakhir{" "}
                                    <span className="text-muted-foreground font-normal">
                                        (opsional)
                                    </span>
                                </Label>
                                <Input
                                    type="date"
                                    value={form.data.ends_at}
                                    onChange={(event) =>
                                        form.setData(
                                            "ends_at",
                                            event.target.value,
                                        )
                                    }
                                />
                                <FieldError message={form.errors.ends_at} />
                            </div>
                        </div>
                        <label className="border-border flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm">
                            <input
                                type="checkbox"
                                checked={form.data.is_active}
                                onChange={(event) =>
                                    form.setData(
                                        "is_active",
                                        event.target.checked,
                                    )
                                }
                                className="accent-primary size-4"
                            />
                            <span>
                                <span className="block font-medium">
                                    Aktifkan kupon sekarang
                                </span>
                                <span className="text-muted-foreground block text-xs">
                                    Kupon langsung dapat digunakan jika periode
                                    berlaku sesuai.
                                </span>
                            </span>
                        </label>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={closeForm}
                                disabled={form.processing}
                            >
                                <X className="size-4" />
                                Batal
                            </Button>
                            <Button type="submit" disabled={form.processing}>
                                {form.processing
                                    ? "Menyimpan..."
                                    : editing
                                      ? "Simpan perubahan"
                                      : "Buat kupon"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
            <ConfirmDialog
                open={deleting !== null}
                onOpenChange={(open) => !open && setDeleting(null)}
                title="Hapus kupon?"
                description={`Kupon ${deleting?.code ?? ""} akan dihapus permanen. Kupon yang sudah digunakan tidak dapat dihapus.`}
                confirmLabel="Hapus kupon"
                variant="destructive"
                icon={Trash2}
                onConfirm={() => {
                    if (deleting)
                        router.delete(destroy.url(deleting.id), {
                            onFinish: () => setDeleting(null),
                        });
                }}
            />
        </AdminLayout>
    );
}
