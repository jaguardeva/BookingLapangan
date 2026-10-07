import { Head, Link, useForm, usePage } from "@inertiajs/react";
import {
    ArrowLeft,
    Banknote,
    CalendarDays,
    Check,
    CircleAlert,
    CreditCard,
    MapPin,
    ReceiptText,
    ShieldCheck,
    ShoppingBag,
} from "lucide-react";
import { PublicLayout } from "@/layouts/public-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { store as storeBooking } from "@/routes/booking";
import { show as lapanganShow } from "@/routes/lapangan";
import type { User as AuthUser } from "@/types/auth";
import type { Lapangan } from "@/types/booking";

type PaymentMethod = "cash" | "transfer";

interface Props {
    lapangan: Lapangan;
    selectedDate: string;
    startTime: string;
    durationHours: number;
}

export default function Checkout({
    lapangan,
    selectedDate,
    startTime,
    durationHours,
}: Props) {
    const { auth } = usePage<{ auth: { user: AuthUser | null } }>().props;
    const currentUser = auth.user;
    const availablePoints = currentUser?.available_points ?? 0;
    const endHour = Number(startTime.slice(0, 2)) + durationHours;
    const endTime = `${String(endHour).padStart(2, "0")}:${startTime.slice(3, 5)}`;
    const totalPrice = durationHours * lapangan.price_per_hour;

    const { data, setData, post, processing, errors } = useForm({
        lapangan_id: lapangan.id,
        booking_date: selectedDate,
        start_time: startTime,
        duration_hours: durationHours,
        payment_method: "transfer" as PaymentMethod,
        use_points: false,
        customer_name: currentUser?.name ?? "",
        customer_phone: currentUser?.phone ?? "",
        notes: "",
    });

    const pointsDiscount =
        data.payment_method === "transfer" && data.use_points
            ? Math.min(availablePoints, totalPrice)
            : 0;
    const finalPrice = totalPrice - pointsDiscount;

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        post(storeBooking.url());
    };

    return (
        <PublicLayout>
            <Head title={`Booking ${lapangan.name}`} />

            <div className="bg-muted/20 min-h-screen border-b border-border/50">
                <div className="public-container max-w-[1120px] py-6 sm:py-10">
                    <Link
                        href={lapanganShow.url(lapangan.slug)}
                        className="text-muted-foreground hover:text-primary mb-5 inline-flex items-center gap-2 text-xs font-semibold transition-colors"
                    >
                        <ArrowLeft className="size-4" />
                        Kembali ke detail lapangan
                    </Link>

                    <div className="mb-7 max-w-2xl">
                        <p className="text-primary mb-2 text-xs font-bold uppercase tracking-[0.18em]">
                            Langkah terakhir
                        </p>
                        <h1 className="text-foreground text-2xl font-black tracking-tight sm:text-4xl">
                            Selesaikan booking Anda
                        </h1>
                        <p className="text-muted-foreground mt-2 text-sm leading-relaxed sm:text-base">
                            Lengkapi data pemesan, pilih metode pembayaran, lalu invoice akan dibuat otomatis.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
                        <div className="space-y-5">
                            <section className="bg-card border-border/70 rounded-2xl border p-4 shadow-sm sm:p-6">
                                <div className="mb-5 flex items-center gap-3">
                                    <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-xl">
                                        <ShoppingBag className="size-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-foreground text-sm font-bold sm:text-base">Data pemesan</h2>
                                        <p className="text-muted-foreground mt-0.5 text-xs">Pastikan data kontak dapat dihubungi.</p>
                                    </div>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="customer_name">Nama lengkap</Label>
                                        <Input id="customer_name" value={data.customer_name} onChange={(event) => setData("customer_name", event.target.value)} placeholder="Nama pemesan" required className="h-11 rounded-xl" />
                                        {errors.customer_name && <p className="text-xs text-rose-500">{errors.customer_name}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="customer_phone">Nomor WhatsApp / HP</Label>
                                        <Input id="customer_phone" value={data.customer_phone} onChange={(event) => setData("customer_phone", event.target.value)} placeholder="081234567890" required className="h-11 rounded-xl" />
                                        {errors.customer_phone && <p className="text-xs text-rose-500">{errors.customer_phone}</p>}
                                    </div>
                                </div>
                            </section>

                            <section className="bg-card border-border/70 rounded-2xl border p-4 shadow-sm sm:p-6">
                                <div className="mb-5">
                                    <h2 className="text-foreground text-sm font-bold sm:text-base">Metode pembayaran</h2>
                                    <p className="text-muted-foreground mt-1 text-xs">Pilih cara pembayaran yang paling nyaman.</p>
                                </div>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <button type="button" onClick={() => setData("payment_method", "transfer")} className={`rounded-xl border p-4 text-left transition ${data.payment_method === "transfer" ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:border-primary/50"}`}>
                                        <CreditCard className="text-primary mb-5 size-5" />
                                        <p className="text-foreground text-sm font-bold">Transfer bank</p>
                                        <p className="text-muted-foreground mt-1 text-xs">Dapat menggunakan poin Sportify.</p>
                                    </button>
                                    <button type="button" onClick={() => setData((previous) => ({ ...previous, payment_method: "cash", use_points: false }))} className={`rounded-xl border p-4 text-left transition ${data.payment_method === "cash" ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:border-primary/50"}`}>
                                        <Banknote className="text-primary mb-5 size-5" />
                                        <p className="text-foreground text-sm font-bold">Cash di lokasi</p>
                                        <p className="text-muted-foreground mt-1 text-xs">Bayar langsung ke kasir venue.</p>
                                    </button>
                                </div>

                                {data.payment_method === "transfer" && availablePoints > 0 && (
                                    <div className="border-primary/20 bg-primary/[0.04] mt-4 rounded-xl border p-4">
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <p className="text-foreground text-sm font-semibold">Gunakan poin</p>
                                                <p className="text-muted-foreground mt-1 text-xs leading-relaxed">Saldo tersedia: {availablePoints.toLocaleString("id-ID")} poin.</p>
                                            </div>
                                            <div className="flex shrink-0 gap-2">
                                                <Button type="button" size="sm" variant={data.use_points ? "default" : "outline"} onClick={() => setData("use_points", true)}>Ya</Button>
                                                <Button type="button" size="sm" variant={!data.use_points ? "default" : "outline"} onClick={() => setData("use_points", false)}>Tidak</Button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </section>

                            <section className="bg-card border-border/70 rounded-2xl border p-4 shadow-sm sm:p-6">
                                <Label htmlFor="notes">Catatan tambahan <span className="text-muted-foreground font-normal">(opsional)</span></Label>
                                <Input id="notes" value={data.notes} onChange={(event) => setData("notes", event.target.value)} placeholder="Contoh: sewa rompi atau bola tambahan" className="mt-2 h-11 rounded-xl" />
                            </section>

                            {errors.start_time && <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-600"><CircleAlert className="size-4 shrink-0" />{errors.start_time}</div>}
                            {currentUser?.is_verified === false && <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-700 dark:text-amber-300"><CircleAlert className="mt-0.5 size-4 shrink-0" /><div><p className="font-bold">Email belum diverifikasi</p><p className="mt-1 leading-relaxed">Verifikasi email {currentUser.email} sebelum membuat booking.</p></div></div>}
                        </div>

                        <aside className="bg-card border-border/70 rounded-2xl border p-4 shadow-sm lg:sticky lg:top-24 sm:p-5">
                            <div className="mb-5 flex items-center gap-2"><ReceiptText className="text-primary size-5" /><h2 className="text-foreground text-sm font-bold">Ringkasan booking</h2></div>
                            <div className="border-border/60 space-y-3 border-b pb-4">
                                <p className="text-foreground font-bold">{lapangan.name}</p>
                                <div className="text-muted-foreground flex items-start gap-2 text-xs"><MapPin className="text-primary mt-0.5 size-3.5 shrink-0" />{lapangan.category?.name ?? "Lapangan olahraga"}</div>
                                <div className="text-muted-foreground flex items-start gap-2 text-xs"><CalendarDays className="text-primary mt-0.5 size-3.5 shrink-0" />{selectedDate} · {startTime}–{endTime} WIB</div>
                            </div>
                            <div className="space-y-2 py-4 text-xs"><div className="flex justify-between gap-3"><span className="text-muted-foreground">{durationHours} jam × Rp {lapangan.price_per_hour.toLocaleString("id-ID")}</span><span className="text-foreground font-semibold">Rp {totalPrice.toLocaleString("id-ID")}</span></div>{pointsDiscount > 0 && <div className="flex justify-between gap-3"><span className="text-muted-foreground">Diskon poin</span><span className="text-primary font-semibold">- Rp {pointsDiscount.toLocaleString("id-ID")}</span></div>}</div>
                            <div className="border-border/60 flex items-end justify-between gap-3 border-t pt-4"><span className="text-foreground text-sm font-bold">Total pembayaran</span><span className="text-primary text-right text-lg font-black">Rp {finalPrice.toLocaleString("id-ID")}</span></div>
                            <div className="bg-muted/40 text-muted-foreground mt-5 flex gap-2 rounded-xl p-3 text-[11px] leading-relaxed"><ShieldCheck className="text-primary mt-0.5 size-4 shrink-0" />Data booking diproses aman dan invoice dikirim setelah konfirmasi.</div>
                            {currentUser?.is_verified === false ? <Button asChild className="mt-5 h-11 w-full rounded-xl bg-amber-600 font-bold text-white hover:bg-amber-500"><Link href="/email/verify">Verifikasi email dulu</Link></Button> : <Button type="submit" disabled={processing} className="mt-5 h-11 w-full rounded-xl font-bold">{processing ? "Memproses..." : "Konfirmasi & Buat Invoice"}</Button>}
                        </aside>
                    </form>
                </div>
            </div>
        </PublicLayout>
    );
}
