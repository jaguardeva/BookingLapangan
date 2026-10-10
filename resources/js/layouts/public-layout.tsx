import { PropsWithChildren, useEffect, useRef } from "react";
import { Link, usePage } from "@inertiajs/react";
import { toast } from "sonner";
import { Navbar } from "@/components/navbar";
import { useAppearance } from "@/hooks/use-appearance";
import { useCurrentUrl } from "@/hooks/use-current-url";
import { home } from "@/routes";
import { index as lapanganIndex } from "@/routes/lapangan";
import { Trophy, Phone, Mail, MapPin, Heart } from "lucide-react";
import { TawkToWidget } from '@/components/tawk-to-widget';

export function PublicLayout({ children }: PropsWithChildren) {
    const { appearance, resolvedAppearance, updateAppearance } =
        useAppearance();
    const page = usePage<{
        name?: string;
        site?: {
            contact?: {
                address?: string;
                phone?: string;
                email?: string;
            };
        };
        flash?: { success?: string; error?: string; info?: string };
    }>();
    const flash = page.props.flash;
    const appName = page.props.name ?? "SportBooking";
    const contact = page.props.site?.contact;
    const { isCurrentUrl } = useCurrentUrl();
    const isLanding = isCurrentUrl(home.url());

    const lastSuccessRef = useRef<string | null>(null);
    const lastErrorRef = useRef<string | null>(null);
    const lastInfoRef = useRef<string | null>(null);

    useEffect(() => {
        if (appearance === "system") {
            updateAppearance(resolvedAppearance);
        }
    }, [appearance, resolvedAppearance, updateAppearance]);

    useEffect(() => {
        if (flash?.success && lastSuccessRef.current !== flash.success) {
            lastSuccessRef.current = flash.success;
            toast.success(flash.success, {
                id: `flash-success-${flash.success}`,
            });
        } else if (!flash?.success) {
            lastSuccessRef.current = null;
        }

        if (flash?.error && lastErrorRef.current !== flash.error) {
            lastErrorRef.current = flash.error;
            toast.error(flash.error, { id: `flash-error-${flash.error}` });
        } else if (!flash?.error) {
            lastErrorRef.current = null;
        }

        if (flash?.info && lastInfoRef.current !== flash.info) {
            lastInfoRef.current = flash.info;
            toast.info(flash.info, { id: `flash-info-${flash.info}` });
        } else if (!flash?.info) {
            lastInfoRef.current = null;
        }
    }, [flash?.success, flash?.error, flash?.info]);

    return (
        <div className="public-shell bg-background text-foreground selection:bg-primary selection:text-primary-foreground flex min-h-screen flex-col print:min-h-0 print:bg-white print:p-0 print:text-black">
            <div className="print:hidden">
                <Navbar />
            </div>

            <main
                className={`flex-1 ${isLanding ? "" : "pt-14 sm:pt-16"} print:flex-initial print:p-0`}
            >
                {children}
                <TawkToWidget />
            </main>

            {/* Modern Sports Footer */}
            <footer className="border-border/60 bg-muted/30 border-t pt-12 pb-8 print:hidden">
                <div className="public-container max-w-[1240px]">
                    <div className="mb-10 grid grid-cols-1 gap-8 md:grid-cols-4">
                        {/* Col 1 */}
                        <div className="space-y-3 md:col-span-1">
                            <div className="flex items-center gap-2">
                                <div className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg">
                                    <Trophy className="size-4" />
                                </div>
                                <span className="text-base font-bold tracking-tight">
                                    {appName}
                                </span>
                            </div>
                            <p className="text-muted-foreground text-xs leading-relaxed">
                                Pusat booking lapangan Sportify untuk melihat
                                jadwal, memilih slot, dan mengatur pertandingan
                                tanpa proses yang berbelit.
                            </p>
                        </div>

                        {/* Col 2 */}
                        <div className="space-y-2">
                            <p className="text-foreground text-xs font-semibold tracking-wider uppercase">
                                Eksplorasi
                            </p>
                            <ul className="text-muted-foreground space-y-1.5 text-xs">
                                <li>
                                    <Link
                                        href={lapanganIndex.url()}
                                        className="hover:text-primary transition-colors"
                                    >
                                        Lihat semua lapangan
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        href={lapanganIndex.url()}
                                        className="hover:text-primary transition-colors"
                                    >
                                        Cek jadwal hari ini
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        {/* Col 3 */}
                        <div className="space-y-2">
                            <p className="text-foreground text-xs font-semibold tracking-wider uppercase">
                                Metode Pembayaran
                            </p>
                            <p className="text-muted-foreground text-xs leading-relaxed">
                                Pilih metode pembayaran yang tersedia, simpan
                                kode booking, lalu datang sesuai jadwal yang
                                sudah dikonfirmasi.
                            </p>
                        </div>

                        {/* Col 4 */}
                        {(contact?.address ||
                            contact?.phone ||
                            contact?.email) && (
                            <div className="space-y-2">
                                <p className="text-foreground text-xs font-semibold tracking-wider uppercase">
                                    Hubungi Kami
                                </p>
                                <ul className="text-muted-foreground space-y-2 text-xs">
                                    {contact?.address && (
                                        <li className="flex items-center gap-2">
                                            <MapPin className="text-primary size-3.5 shrink-0" />
                                            <span>{contact.address}</span>
                                        </li>
                                    )}
                                    {contact?.phone && (
                                        <li className="flex items-center gap-2">
                                            <Phone className="text-primary size-3.5 shrink-0" />
                                            <span>{contact.phone}</span>
                                        </li>
                                    )}
                                    {contact?.email && (
                                        <li className="flex items-center gap-2">
                                            <Mail className="text-primary size-3.5 shrink-0" />
                                            <span>{contact.email}</span>
                                        </li>
                                    )}
                                </ul>
                            </div>
                        )}
                    </div>

                    <div className="border-border/40 text-muted-foreground flex flex-col items-center justify-between gap-3 border-t pt-6 text-xs sm:flex-row">
                        <p>
                            © {new Date().getFullYear()} {appName}. All rights
                            reserved.
                        </p>
                        <p className="flex items-center gap-1">
                            Dirancang dengan{" "}
                            <Heart className="size-3 fill-rose-500 text-rose-500" />{" "}
                            untuk pecinta olahraga.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
