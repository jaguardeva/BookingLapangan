import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowUpDown,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    CircleX,
    Clock,
    Crown,
    Eye,
    Search,
    TrendingUp,
    XCircle,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import AdminLayout from '@/layouts/admin-layout';
import ConfirmDialog from '@/components/confirm-dialog';
import { Pagination } from '@/components/pagination';
import { ResetFilterButton } from '@/components/reset-filter-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import membershipRoutes, {
    approve,
    cancel,
    reject,
} from '@/actions/App/Http/Controllers/Admin/MembershipManagementController';
import { update as updateMembershipSettings } from '@/actions/App/Http/Controllers/Admin/MembershipSettingController';
import type { Membership } from '@/types/booking';

type PaginationLink = { url: string | null; label: string; active: boolean };

type Props = {
    memberships: {
        data: Membership[];
        links: PaginationLink[];
        from?: number | null;
        to?: number | null;
        total: number;
        last_page?: number;
        per_page?: number;
    };
    filters: {
        search?: string;
        status?: string;
        payment_status?: string;
        sort?: string;
        direction?: string;
    };
    membershipDiscountPercentage: number;
    stats: {
        active: number;
        pending_validation: number;
        expiring_soon: number;
        active_value_this_month: number;
    };
};

const weekdays = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

function formatDate(date?: string | null): string {
    if (!date) return '-';

    return new Date(`${date.slice(0, 10)}T00:00:00`).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}

function formatMoney(value: number): string {
    return `Rp ${Number(value).toLocaleString('id-ID')}`;
}

function statusLabel(value?: string | null): string {
    return ({
        pending: 'Menunggu',
        pending_validation: 'Perlu Validasi',
        active: 'Aktif',
        approved: 'Disetujui',
        expired: 'Kedaluwarsa',
        rejected: 'Ditolak',
        cancelled: 'Dibatalkan',
    } as Record<string, string>)[value ?? ''] ?? value ?? '-';
}

function MembershipStatusBadge({ status }: { status?: string | null }) {
    if (status === 'active') {
        return (
            <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">
                Aktif
            </Badge>
        );
    }
    if (status === 'rejected' || status === 'cancelled') {
        return <Badge variant="destructive">{statusLabel(status)}</Badge>;
    }
    if (status === 'expired') {
        return <Badge variant="outline" className="text-muted-foreground">{statusLabel(status)}</Badge>;
    }
    return <Badge variant="secondary">{statusLabel(status)}</Badge>;
}

function PaymentStatusBadge({ status }: { status?: string | null }) {
    if (status === 'pending_validation') {
        return (
            <Badge variant="outline" className="border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400 font-medium">
                Perlu Validasi
            </Badge>
        );
    }
    if (status === 'approved') {
        return (
            <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">
                Disetujui
            </Badge>
        );
    }
    if (status === 'rejected' || status === 'cancelled') {
        return <Badge variant="destructive">{statusLabel(status)}</Badge>;
    }
    return <Badge variant="secondary">{statusLabel(status)}</Badge>;
}

function SortableHeader({
    label,
    column,
    sort,
    direction,
    onSort,
}: {
    label: string;
    column: string;
    sort: string;
    direction: string;
    onSort: (column: string) => void;
}) {
    const active = sort === column;

    return (
        <th className="px-4 py-3">
            <button
                type="button"
                onClick={() => onSort(column)}
                className="hover:text-foreground inline-flex items-center gap-1.5 transition-colors"
            >
                {label}
                {active ? (
                    direction === 'asc' ? (
                        <ChevronUp className="size-3.5" />
                    ) : (
                        <ChevronDown className="size-3.5" />
                    )
                ) : (
                    <ArrowUpDown className="size-3.5 opacity-50" />
                )}
            </button>
        </th>
    );
}

export default function MembershipsIndex({
    memberships,
    filters,
    membershipDiscountPercentage,
    stats,
}: Props) {
    const { auth } = usePage<{ auth: { user?: { role?: string } } }>().props;
    const isSuperadmin = auth.user?.role === 'superadmin';
    const [search, setSearch] = useState(filters.search ?? '');
    const [status, setStatus] = useState(filters.status ?? '');
    const [paymentStatus, setPaymentStatus] = useState(filters.payment_status ?? '');
    const [sort, setSort] = useState(filters.sort ?? 'created_at');
    const [direction, setDirection] = useState(filters.direction ?? 'desc');
    const [discountPercentage, setDiscountPercentage] = useState(membershipDiscountPercentage);

    // Dialog state for inline actions
    const [approveMembership, setApproveMembership] = useState<Membership | null>(null);
    const [rejectMembership, setRejectMembership] = useState<Membership | null>(null);
    const [cancelMembership, setCancelMembership] = useState<Membership | null>(null);
    const [reason, setReason] = useState('');

    const filterKey = JSON.stringify([search, status, paymentStatus, sort, direction]);
    const initialFilterKey = useRef(filterKey);

    useEffect(() => {
        if (initialFilterKey.current === filterKey) {
            initialFilterKey.current = '';
            return;
        }

        const timeoutId = window.setTimeout(() => {
            const query = Object.fromEntries(
                Object.entries({ search, status, payment_status: paymentStatus, sort, direction })
                    .filter(([, value]) => value !== ''),
            );

            router.get(membershipRoutes.index.url(), query, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            });
        }, 300);

        return () => window.clearTimeout(timeoutId);
    }, [direction, filterKey, paymentStatus, search, sort, status]);

    const hasActiveFilters =
        search.trim() !== '' ||
        status !== '' ||
        paymentStatus !== '' ||
        sort !== 'created_at' ||
        direction !== 'desc';

    const resetFilters = () => {
        setSearch('');
        setStatus('');
        setPaymentStatus('');
        setSort('created_at');
        setDirection('desc');
    };

    const toggleSort = (column: string) => {
        if (sort === column) {
            setDirection(direction === 'asc' ? 'desc' : 'asc');
            return;
        }

        setSort(column);
        setDirection('asc');
    };

    const saveDiscountPercentage = () => {
        router.patch(updateMembershipSettings.url(), {
            membership_discount_percentage: discountPercentage,
        });
    };

    return (
        <AdminLayout breadcrumbs={[{ title: 'Membership', href: membershipRoutes.index.url() }]}>
            <Head title="Kelola Membership" />
            <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
                <div>
                    <h1 className="text-foreground text-2xl font-bold tracking-tight">Kelola Membership</h1>
                    <p className="text-muted-foreground mt-1 text-sm">Kelola pengajuan, verifikasi pembayaran, dan jadwal reservasi member.</p>
                </div>

                {/* Enhanced Stats Cards with interactive quick-filters */}
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {/* Membership Aktif */}
                    <div
                        role="button"
                        tabIndex={0}
                        onClick={() => setStatus(status === 'active' ? '' : 'active')}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                setStatus(status === 'active' ? '' : 'active');
                            }
                        }}
                        className={`group border-border/80 bg-card hover:border-emerald-500/50 relative flex cursor-pointer flex-col justify-between overflow-hidden rounded-2xl border border-l-4 border-l-emerald-500 p-4 shadow-sm transition-all hover:shadow-md ${
                            status === 'active' ? 'ring-2 ring-emerald-500/30' : ''
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground text-xs font-medium">Membership aktif</span>
                            <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                                <Crown className="size-4" />
                            </div>
                        </div>
                        <div className="mt-2 flex items-baseline justify-between">
                            <span className="text-foreground text-2xl font-bold">{stats.active.toLocaleString('id-ID')}</span>
                            <span className="text-muted-foreground text-[11px] transition-colors group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                                {status === 'active' ? 'Filter aktif ✓' : 'Klik untuk filter'}
                            </span>
                        </div>
                    </div>

                    {/* Perlu Validasi */}
                    <div
                        role="button"
                        tabIndex={0}
                        onClick={() => setPaymentStatus(paymentStatus === 'pending_validation' ? '' : 'pending_validation')}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                setPaymentStatus(paymentStatus === 'pending_validation' ? '' : 'pending_validation');
                            }
                        }}
                        className={`group border-border/80 bg-card hover:border-amber-500/50 relative flex cursor-pointer flex-col justify-between overflow-hidden rounded-2xl border border-l-4 border-l-amber-500 p-4 shadow-sm transition-all hover:shadow-md ${
                            paymentStatus === 'pending_validation' ? 'ring-2 ring-amber-500/30' : ''
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground text-xs font-medium">Perlu validasi</span>
                            <div className="rounded-xl bg-amber-500/10 p-2 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
                                <Clock className="size-4" />
                            </div>
                        </div>
                        <div className="mt-2 flex items-baseline justify-between">
                            <span className="text-foreground text-2xl font-bold">{stats.pending_validation.toLocaleString('id-ID')}</span>
                            <span className="text-muted-foreground text-[11px] transition-colors group-hover:text-amber-600 dark:group-hover:text-amber-400">
                                {paymentStatus === 'pending_validation' ? 'Filter aktif ✓' : 'Klik untuk filter'}
                            </span>
                        </div>
                    </div>

                    {/* Berakhir 7 Hari */}
                    <div
                        role="button"
                        tabIndex={0}
                        onClick={() => setStatus(status === 'active' ? '' : 'active')}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                setStatus(status === 'active' ? '' : 'active');
                            }
                        }}
                        className="group border-border/80 bg-card hover:border-violet-500/50 relative flex cursor-pointer flex-col justify-between overflow-hidden rounded-2xl border border-l-4 border-l-violet-500 p-4 shadow-sm transition-all hover:shadow-md"
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground text-xs font-medium">Berakhir 7 hari</span>
                            <div className="rounded-xl bg-violet-500/10 p-2 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400">
                                <AlertTriangle className="size-4" />
                            </div>
                        </div>
                        <div className="mt-2 flex items-baseline justify-between">
                            <span className="text-foreground text-2xl font-bold">{stats.expiring_soon.toLocaleString('id-ID')}</span>
                            <span className="text-muted-foreground text-[11px] transition-colors group-hover:text-violet-600 dark:group-hover:text-violet-400">
                                Segera perpanjang
                            </span>
                        </div>
                    </div>

                    {/* Nilai Aktif Bulan Ini */}
                    <div className="border-border/80 bg-card relative flex flex-col justify-between overflow-hidden rounded-2xl border border-l-4 border-l-blue-500 p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground text-xs font-medium">Nilai aktif bulan ini</span>
                            <div className="rounded-xl bg-blue-500/10 p-2 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
                                <TrendingUp className="size-4" />
                            </div>
                        </div>
                        <div className="mt-2 flex items-baseline justify-between">
                            <span className="text-foreground text-xl font-bold">{formatMoney(stats.active_value_this_month)}</span>
                            <span className="text-muted-foreground text-[11px]">Bulan ini</span>
                        </div>
                    </div>
                </div>

                {/* Diskon Membership Global */}
                <div className="border-border/80 bg-card flex flex-col gap-4 rounded-2xl border p-4 shadow-sm sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h2 className="font-semibold">Diskon membership global</h2>
                        <p className="text-muted-foreground mt-1 text-sm">Berlaku untuk pengajuan membership yang disetujui setelah nilai ini disimpan.</p>
                    </div>
                    <div className="flex items-end gap-2">
                        <div className="relative">
                            <Input
                                type="number"
                                min={0}
                                max={100}
                                value={discountPercentage}
                                disabled={!isSuperadmin}
                                onChange={(event) => setDiscountPercentage(Number(event.target.value))}
                                className="h-9 w-24 pr-7 text-right"
                            />
                            <span className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm">%</span>
                        </div>
                        {isSuperadmin ? (
                            <Button type="button" size="sm" onClick={saveDiscountPercentage}>
                                Simpan
                            </Button>
                        ) : (
                            <span className="text-muted-foreground text-xs">Hanya superadmin</span>
                        )}
                    </div>
                </div>

                {/* Filters */}
                <div className="border-border/80 bg-card flex flex-col gap-3 rounded-2xl border p-4 shadow-sm xl:flex-row xl:items-center">
                    <div className="relative min-w-0 flex-1">
                        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                        <Input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Cari nama, email, atau ID membership..."
                            className="h-9 pl-9 text-xs"
                        />
                    </div>
                    <Select value={status || 'all'} onValueChange={(value) => setStatus(value === 'all' ? '' : value)}>
                        <SelectTrigger className="h-9 w-full text-xs xl:w-44">
                            <SelectValue placeholder="Semua status membership" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua status membership</SelectItem>
                            <SelectItem value="pending">Menunggu</SelectItem>
                            <SelectItem value="active">Aktif</SelectItem>
                            <SelectItem value="expired">Kedaluwarsa</SelectItem>
                            <SelectItem value="rejected">Ditolak</SelectItem>
                            <SelectItem value="cancelled">Dibatalkan</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={paymentStatus || 'all'} onValueChange={(value) => setPaymentStatus(value === 'all' ? '' : value)}>
                        <SelectTrigger className="h-9 w-full text-xs xl:w-44">
                            <SelectValue placeholder="Semua pembayaran" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua pembayaran</SelectItem>
                            <SelectItem value="pending">Menunggu Bayar</SelectItem>
                            <SelectItem value="pending_validation">Perlu Validasi</SelectItem>
                            <SelectItem value="approved">Disetujui</SelectItem>
                            <SelectItem value="rejected">Ditolak</SelectItem>
                            <SelectItem value="cancelled">Dibatalkan</SelectItem>
                        </SelectContent>
                    </Select>
                    {hasActiveFilters && <ResetFilterButton onClick={resetFilters} className="h-9 rounded-xl text-xs" />}
                </div>

                <Pagination
                    links={memberships.links}
                    from={memberships.from}
                    to={memberships.to}
                    total={memberships.total}
                    lastPage={memberships.last_page}
                    perPage={memberships.per_page}
                    variant="summary"
                />

                {/* Table with inline actions and highlight for pending validation */}
                <div className="border-border/80 bg-card overflow-hidden rounded-2xl border shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1020px] text-left text-xs">
                            <thead className="border-border/60 bg-muted/50 text-muted-foreground border-b tracking-wider uppercase">
                                <tr>
                                    <SortableHeader label="Member" column="created_at" sort={sort} direction={direction} onSort={toggleSort} />
                                    <SortableHeader label="Mulai" column="reservation_start_date" sort={sort} direction={direction} onSort={toggleSort} />
                                    <SortableHeader label="Nominal" column="amount" sort={sort} direction={direction} onSort={toggleSort} />
                                    <SortableHeader label="Status" column="status" sort={sort} direction={direction} onSort={toggleSort} />
                                    <SortableHeader label="Pembayaran" column="payment_status" sort={sort} direction={direction} onSort={toggleSort} />
                                    <th className="px-4 py-3">Jadwal</th>
                                    <th className="px-4 py-3 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-border/40 divide-y">
                                {memberships.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="text-muted-foreground py-12 text-center">
                                            Tidak ada data membership sesuai filter.
                                        </td>
                                    </tr>
                                ) : (
                                    memberships.data.map((membership) => {
                                        const isPendingValidation = membership.payment_status === 'pending_validation';
                                        const canApprove = membership.status === 'pending' && membership.payment_status === 'pending_validation';
                                        const canReject = membership.status === 'pending' && ['pending', 'pending_validation'].includes(membership.payment_status);
                                        const canCancel = membership.status === 'active' && (!membership.ends_at || new Date(membership.ends_at) > new Date());

                                        return (
                                            <tr
                                                key={membership.id}
                                                className={`transition-colors hover:bg-muted/30 ${
                                                    isPendingValidation ? 'bg-amber-500/[0.04] dark:bg-amber-500/[0.07]' : ''
                                                }`}
                                            >
                                                <td className="px-4 py-3.5">
                                                    <div className="flex items-start gap-2">
                                                        <div className="mt-0.5 rounded-lg bg-primary/10 p-1 text-primary">
                                                            <Crown className="size-3.5" />
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-foreground">
                                                                {membership.user?.name ?? '-'}
                                                            </p>
                                                            <p className="text-muted-foreground mt-0.5">{membership.user?.email ?? '-'}</p>
                                                            <p className="text-muted-foreground mt-0.5 font-mono text-[10px]">{membership.id}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3.5 font-medium whitespace-nowrap">
                                                    {formatDate(membership.reservation_start_date ?? membership.starts_at)}
                                                </td>
                                                <td className="text-primary px-4 py-3.5 font-bold whitespace-nowrap">
                                                    {formatMoney(membership.amount)}
                                                </td>
                                                <td className="px-4 py-3.5 whitespace-nowrap">
                                                    <MembershipStatusBadge status={membership.status} />
                                                </td>
                                                <td className="px-4 py-3.5 whitespace-nowrap">
                                                    <PaymentStatusBadge status={membership.payment_status} />
                                                </td>
                                                <td className="max-w-72 px-4 py-3.5">
                                                    {membership.reservations?.length ? (
                                                        <div className="flex flex-col gap-1.5">
                                                            {membership.reservations.map((reservation) => (
                                                                <div
                                                                    key={reservation.id}
                                                                    className="bg-muted/60 inline-flex flex-wrap items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-medium leading-none text-foreground"
                                                                >
                                                                    <span className="font-semibold text-primary">
                                                                        {reservation.lapangan?.name ?? '-'}
                                                                    </span>
                                                                    <span className="text-muted-foreground">·</span>
                                                                    <span>{weekdays[reservation.weekday]}</span>
                                                                    <span className="text-muted-foreground">·</span>
                                                                    <span className="font-mono text-muted-foreground">
                                                                        {reservation.start_time.slice(0, 5)}–{reservation.end_time.slice(0, 5)}
                                                                    </span>
                                                                    <span className="text-muted-foreground">·</span>
                                                                    <Badge variant="outline" className="h-4 px-1 text-[10px] font-semibold">
                                                                        {reservation.occurrence_count ?? 0}x
                                                                    </Badge>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground">-</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3.5 text-right whitespace-nowrap">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-8 px-2.5 text-xs"
                                                            asChild
                                                        >
                                                            <Link href={membershipRoutes.show.url(membership.id)}>
                                                                <Eye className="size-3.5" />
                                                                <span className="hidden xl:inline">Detail</span>
                                                            </Link>
                                                        </Button>

                                                        {canApprove && (
                                                            <Button
                                                                size="sm"
                                                                className="h-8 bg-emerald-600 px-2.5 text-xs text-white hover:bg-emerald-700"
                                                                onClick={() => setApproveMembership(membership)}
                                                            >
                                                                <CheckCircle2 className="size-3.5" />
                                                                <span>Setujui</span>
                                                            </Button>
                                                        )}

                                                        {canReject && (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="h-8 px-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                                onClick={() => {
                                                                    setRejectMembership(membership);
                                                                    setReason('Nominal transfer tidak sesuai dengan kode unik yang tertera.');
                                                                }}
                                                                title="Tolak Pengajuan"
                                                            >
                                                                <XCircle className="size-3.5" />
                                                                <span className="hidden xl:inline">Tolak</span>
                                                            </Button>
                                                        )}

                                                        {canCancel && (
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="h-8 px-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                                onClick={() => {
                                                                    setCancelMembership(membership);
                                                                    setReason('Pembatalan atas permintaan member.');
                                                                }}
                                                                title="Batalkan Membership"
                                                            >
                                                                <CircleX className="size-3.5" />
                                                                <span className="hidden xl:inline">Batal</span>
                                                            </Button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <Pagination
                    links={memberships.links}
                    from={memberships.from}
                    to={memberships.to}
                    total={memberships.total}
                    lastPage={memberships.last_page}
                    perPage={memberships.per_page}
                    variant="navigation"
                />
            </div>

            {/* Confirm Dialog for Approval */}
            <ConfirmDialog
                open={approveMembership !== null}
                onOpenChange={(open) => !open && setApproveMembership(null)}
                title="Setujui Membership?"
                description={`Pembayaran membership #${approveMembership?.id} milik ${approveMembership?.user?.name ?? ''} akan disetujui dan seluruh jadwal occurrence akan dikunci.`}
                confirmLabel="Setujui"
                icon={CheckCircle2}
                onConfirm={() => {
                    if (approveMembership) {
                        router.post(
                            approve.url(approveMembership.id),
                            {},
                            { onFinish: () => setApproveMembership(null) },
                        );
                    }
                }}
            />

            {/* Dialog for Rejection */}
            <Dialog
                open={rejectMembership !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setRejectMembership(null);
                        setReason('');
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Tolak Pengajuan Membership</DialogTitle>
                    </DialogHeader>
                    <form
                        onSubmit={(event) => {
                            event.preventDefault();
                            if (rejectMembership) {
                                router.post(
                                    reject.url(rejectMembership.id),
                                    { rejection_reason: reason },
                                    {
                                        onFinish: () => {
                                            setRejectMembership(null);
                                            setReason('');
                                        },
                                    },
                                );
                            }
                        }}
                        className="space-y-4"
                    >
                        <p className="text-muted-foreground text-xs">
                            Penolakan membership <strong>#{rejectMembership?.id}</strong> milik{' '}
                            <strong>{rejectMembership?.user?.name}</strong> akan membatalkan slot sementara yang ditahan.
                        </p>
                        <div className="space-y-1.5">
                            <Label htmlFor="reject-reason">Alasan Penolakan</Label>
                            <Textarea
                                id="reject-reason"
                                value={reason}
                                onChange={(event) => setReason(event.target.value)}
                                placeholder="Masukkan alasan penolakan..."
                                required
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setRejectMembership(null);
                                    setReason('');
                                }}
                            >
                                Batal
                            </Button>
                            <Button type="submit" variant="destructive">
                                Tolak Pengajuan
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Dialog for Cancellation */}
            <Dialog
                open={cancelMembership !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setCancelMembership(null);
                        setReason('');
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Batalkan Membership Aktif</DialogTitle>
                    </DialogHeader>
                    <form
                        onSubmit={(event) => {
                            event.preventDefault();
                            if (cancelMembership) {
                                router.post(
                                    cancel.url(cancelMembership.id),
                                    { rejection_reason: reason },
                                    {
                                        onFinish: () => {
                                            setCancelMembership(null);
                                            setReason('');
                                        },
                                    },
                                );
                            }
                        }}
                        className="space-y-4"
                    >
                        <p className="text-muted-foreground text-xs">
                            Membatalkan membership <strong>#{cancelMembership?.id}</strong> milik{' '}
                            <strong>{cancelMembership?.user?.name}</strong> akan membatalkan seluruh jadwal booking mendatang yang terkait.
                        </p>
                        <div className="space-y-1.5">
                            <Label htmlFor="cancel-reason">Alasan Pembatalan</Label>
                            <Textarea
                                id="cancel-reason"
                                value={reason}
                                onChange={(event) => setReason(event.target.value)}
                                placeholder="Masukkan alasan pembatalan..."
                                required
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setCancelMembership(null);
                                    setReason('');
                                }}
                            >
                                Tutup
                            </Button>
                            <Button type="submit" variant="destructive">
                                Batalkan Membership
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}
