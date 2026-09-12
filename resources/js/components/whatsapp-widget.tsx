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

function whatsappUrl(contact: WhatsappContact): string {
    let phone = contact.phone.replace(/\D/g, '');
    if (phone.startsWith('0')) phone = `62${phone.slice(1)}`;

    return `https://wa.me/${phone}?text=${encodeURIComponent('Halo, saya ingin bertanya tentang SportBooking.')}`;
}

export function WhatsappWidget() {
    const { whatsapp_contacts: contacts = [] } = usePage<{ whatsapp_contacts?: WhatsappContact[] }>().props;
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="fixed bottom-4 right-4 z-50 sm:bottom-6 sm:right-6">
            {!isOpen && (
                <Button
                    onClick={() => setIsOpen(true)}
                    aria-label="Hubungi SportBooking melalui WhatsApp"
                    className="size-14 rounded-full bg-emerald-600 text-white shadow-xl shadow-emerald-900/20 transition-transform hover:scale-105 hover:bg-emerald-700 sm:size-14"
                >
                    <MessageCircle className="size-6" />
                </Button>
            )}

            {isOpen && (
                <div className="flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-[360px] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl sm:max-h-[min(70vh,520px)]">
                    <div className="flex shrink-0 items-center justify-between bg-emerald-700 p-3 text-white sm:p-4">
                        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
                            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/15 sm:size-10"><MessageCircle className="size-5" /></div>
                            <div className="min-w-0">
                                <h2 className="text-sm font-bold">Hubungi Kami</h2>
                                <p className="truncate text-xs text-emerald-100">Pilih kontak WhatsApp</p>
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
                            <a key={contact.id} href={whatsappUrl(contact)} target="_blank" rel="noreferrer" className="flex min-w-0 items-center gap-2.5 rounded-xl border border-border p-3 transition-colors hover:border-emerald-500/40 hover:bg-emerald-500/5 sm:gap-3">
                                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600"><Phone className="size-4" /></span>
                                <span className="min-w-0 flex-1">
                                    <span className="block truncate text-sm font-semibold">{contact.name}</span>
                                    <span className="block truncate text-xs text-muted-foreground">{contact.description || 'Tersedia di WhatsApp'}</span>
                                </span>
                                <MessageCircle className="size-4 shrink-0 text-emerald-600" />
                            </a>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
