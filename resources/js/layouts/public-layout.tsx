import { PropsWithChildren, useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import { toast } from 'sonner';
import { Navbar } from '@/components/navbar';
import { WhatsappWidget } from '@/components/whatsapp-widget';
import { Trophy, Phone, Mail, MapPin, Heart } from 'lucide-react';

export function PublicLayout({ children }: PropsWithChildren) {
    const page = usePage<{ flash?: { success?: string; error?: string; info?: string } }>();
    const flash = page.props.flash;

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
        if (flash?.info) {
            toast.info(flash.info);
        }
    }, [flash]);

    return (
        <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-emerald-500 selection:text-white">

            <Navbar />

            <main className="flex-1">{children}</main>

            <WhatsappWidget />

            {/* Modern Sports Footer */}
            <footer className="border-t border-border/60 bg-muted/30 pt-12 pb-8">
                <div className="container mx-auto px-4 sm:px-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
                        {/* Col 1 */}
                        <div className="space-y-3 md:col-span-1">
                            <div className="flex items-center gap-2">
                                <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-600 text-white">
                                    <Trophy className="size-4" />
                                </div>
                                <span className="text-base font-bold tracking-tight">SportBooking</span>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Platform sewa lapangan olahraga online tercepat, transparan, dan terpercaya dengan sistem validasi otomatis dan bantuan WhatsApp.
                            </p>
                        </div>

                        {/* Col 2 */}
                        <div className="space-y-2">
                            <p className="text-xs font-semibold uppercase tracking-wider text-foreground">Kategori Lapangan</p>
                            <ul className="space-y-1.5 text-xs text-muted-foreground">
                                <li><a href="/lapangan?category=futsal" className="hover:text-emerald-500 transition-colors">Lapangan Futsal Pro</a></li>
                                <li><a href="/lapangan?category=badminton" className="hover:text-emerald-500 transition-colors">Badminton Court BWF</a></li>
                                <li><a href="/lapangan?category=mini-soccer" className="hover:text-emerald-500 transition-colors">Mini Soccer 7 vs 7</a></li>
                                <li><a href="/lapangan?category=basket" className="hover:text-emerald-500 transition-colors">Basketball Arena Hardwood</a></li>
                            </ul>
                        </div>

                        {/* Col 3 */}
                        <div className="space-y-2">
                            <p className="text-xs font-semibold uppercase tracking-wider text-foreground">Metode Pembayaran</p>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Transfer Bank (BCA, Mandiri, BRI) dengan kode validasi 3-digit instan atau pembayaran Cash langsung ke kasir lapangan.
                            </p>
                        </div>

                        {/* Col 4 */}
                        <div className="space-y-2">
                            <p className="text-xs font-semibold uppercase tracking-wider text-foreground">Hubungi Kami</p>
                            <ul className="space-y-2 text-xs text-muted-foreground">
                                <li className="flex items-center gap-2">
                                    <MapPin className="size-3.5 text-emerald-500 shrink-0" />
                                    <span>Jl. Gelora Olahraga No. 45, Jakarta Selatan</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Phone className="size-3.5 text-emerald-500 shrink-0" />
                                    <span>+62 812-3456-7890</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Mail className="size-3.5 text-emerald-500 shrink-0" />
                                    <span>support@sportbooking.local</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="border-t border-border/40 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-3">
                        <p>© 2026 SportBooking Platform. All rights reserved.</p>
                        <p className="flex items-center gap-1">
                            Dirancang dengan <Heart className="size-3 text-rose-500 fill-rose-500" /> untuk pecinta olahraga.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
