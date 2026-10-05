import { useState } from 'react';
import { usePage } from '@inertiajs/react';
import { MessageCircle, Phone, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

type WhatsappContact = {
    id: number;
    name: string;
    phone: string;
    description: string | null;
};

function whatsappUrl(contact: WhatsappContact, appName: string): string {
    let phone = contact.phone.replace(/\D/g, '');
    if (phone.startsWith('0')) phone = `62${phone.slice(1)}`;

    return `https://wa.me/${phone}?text=${encodeURIComponent(`Halo, saya ingin bertanya tentang ${appName}.`)}`;
}

export function WhatsappWidget() {
    const { whatsapp_contacts: contacts = [], name } = usePage<{
        whatsapp_contacts?: WhatsappContact[];
        name?: string;
    }>().props;
    const appName = name ?? 'SportBooking';
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="whatsapp-widget fixed right-4 bottom-[calc(4rem+env(safe-area-inset-bottom)+1rem)] z-50 md:right-6 md:bottom-6 print:hidden">
            {!isOpen && (
                <Button
                    onClick={() => setIsOpen(true)}
                    aria-label={`Hubungi ${appName} melalui WhatsApp`}
                    className="size-14 rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/20 transition-transform hover:scale-105 hover:bg-primary/90 sm:size-14"
                >
                    <MessageCircle className="size-6" />
                </Button>
            )}

            {isOpen && (
                <div className="flex max-h-[calc(100dvh-6rem-env(safe-area-inset-bottom))] w-[calc(100vw-2rem)] max-w-[360px] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl sm:max-h-[min(70vh,520px)] md:max-h-[calc(100dvh-3rem)]">
                    <div className="flex shrink-0 items-center justify-between bg-primary p-3 text-primary-foreground sm:p-4">
                        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
                            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/15 sm:size-10"><MessageCircle className="size-5" /></div>
                            <div className="min-w-0">
                                <h2 className="text-sm font-bold">Hubungi Kami</h2>
                            <p className="truncate text-xs text-primary-foreground/80">Pilih kontak WhatsApp untuk {appName}</p>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="size-8 rounded-full text-white hover:bg-white/15 hover:text-white" aria-label="Tutup">
                            <X className="size-4" />
                        </Button>
                    </div>
                    <div className="min-h-0 space-y-2 overflow-y-auto p-2.5 sm:p-3">
                        {contacts.length === 0 ? (
                            <p className="px-3 py-6 text-center text-xs text-muted-foreground">Belum ada kontak yang tersedia.</p>
                        ) : contacts.map((contact) => (
                            <a key={contact.id} href={whatsappUrl(contact, appName)} target="_blank" rel="noreferrer" className="flex min-w-0 items-center gap-2.5 rounded-xl border border-border p-3 transition-colors hover:border-primary/40 hover:bg-primary/5 sm:gap-3">
                                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"><Phone className="size-4" /></span>
                                <span className="min-w-0 flex-1">
                                    <span className="block truncate text-sm font-semibold">{contact.name}</span>
                                    <span className="block truncate text-xs text-muted-foreground">{contact.description || 'Tersedia di WhatsApp'}</span>
                                </span>
                                <MessageCircle className="size-4 shrink-0 text-primary" />
                            </a>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
