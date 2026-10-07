import { PropsWithChildren, useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import { toast } from 'sonner';
import { Navbar } from '@/components/navbar';
import { WhatsappWidget } from '@/components/whatsapp-widget';
import { useAppearance } from '@/hooks/use-appearance';
import { Trophy, Phone, Mail, MapPin, Heart } from 'lucide-react';

export function PublicLayout({ children }: PropsWithChildren) {
    const { appearance, resolvedAppearance, updateAppearance } = useAppearance();
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
    const appName = page.props.name ?? 'SportBooking';
    const contact = page.props.site?.contact;

    useEffect(() => {
        if (appearance === 'system') {
            updateAppearance(resolvedAppearance);
        }
    }, [appearance, resolvedAppearance, updateAppearance]);

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
        <div className="min-h-screen flex flex-col bg-background pb-[calc(4rem+env(safe-area-inset-bottom))] text-foreground selection:bg-primary selection:text-primary-foreground md:pb-0 print:min-h-0 print:bg-white print:p-0 print:text-black">

            <div className="print:hidden">
                <Navbar />
            </div>

            <main className="flex-1 print:flex-initial print:p-0">{children}</main>

            <div className="print:hidden">
                <WhatsappWidget />
            </div>

            {/* Modern Sports Footer */}
            <footer className="border-t border-border/60 bg-muted/30 pt-12 pb-8 print:hidden">
                <div className="public-container max-w-[1240px]">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
                        {/* Col 1 */}
                        <div className="space-y-3 md:col-span-1">
                            <div className="flex items-center gap-2">
                                <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                                    <Trophy className="size-4" />
                                </div>
                                <span className="text-base font-bold tracking-tight">{appName}</span>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Platform sewa lapangan olahraga online tercepat, transparan, dan terpercaya dengan sistem validasi otomatis dan bantuan WhatsApp.
                            </p>
                        </div>

                        {/* Col 2 */}
                        <div className="space-y-2">
                            <p className="text-xs font-semibold uppercase tracking-wider text-foreground">Kategori Lapangan</p>
                            <ul className="space-y-1.5 text-xs text-muted-foreground">
                                <li><a href="/lapangan?category=futsal" className="hover:text-primary transition-colors">Lapangan Futsal Pro</a></li>
                                <li><a href="/lapangan?category=badminton" className="hover:text-primary transition-colors">Badminton Court BWF</a></li>
                                <li><a href="/lapangan?category=mini-soccer" className="hover:text-primary transition-colors">Mini Soccer 7 vs 7</a></li>
                                <li><a href="/lapangan?category=basket" className="hover:text-primary transition-colors">Basketball Arena Hardwood</a></li>
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
                        {(contact?.address || contact?.phone || contact?.email) && (
                        <div className="space-y-2">
                            <p className="text-xs font-semibold uppercase tracking-wider text-foreground">Hubungi Kami</p>
                            <ul className="space-y-2 text-xs text-muted-foreground">
                                {contact?.address && (
                                    <li className="flex items-center gap-2">
                                        <MapPin className="size-3.5 text-primary shrink-0" />
                                        <span>{contact.address}</span>
                                    </li>
                                )}
                                {contact?.phone && (
                                    <li className="flex items-center gap-2">
                                        <Phone className="size-3.5 text-primary shrink-0" />
                                        <span>{contact.phone}</span>
                                    </li>
                                )}
                                {contact?.email && (
                                    <li className="flex items-center gap-2">
                                        <Mail className="size-3.5 text-primary shrink-0" />
                                        <span>{contact.email}</span>
                                    </li>
                                )}
                            </ul>
                        </div>
                        )}
                    </div>

                    <div className="border-t border-border/40 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-3">
                        <p>© {new Date().getFullYear()} {appName}. All rights reserved.</p>
                        <p className="flex items-center gap-1">
                            Dirancang dengan <Heart className="size-3 text-rose-500 fill-rose-500" /> untuk pecinta olahraga.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
