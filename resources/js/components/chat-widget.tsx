import { useState, useEffect, useRef } from 'react';
import { usePage, Link } from '@inertiajs/react';
import { MessageSquare, X, Send, User, ShieldCheck, Loader2, Sparkles, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { echo } from '@/echo';

interface Message {
    id: string;
    conversation_id: string;
    sender_id: string;
    sender_name: string;
    sender_role: string;
    body: string;
    created_at: string;
}

interface Conversation {
    id: string;
    user_id: string;
    claimed_by: string | null;
    status: 'open' | 'in_progress' | 'resolved';
    claimed_by_name?: string;
    claimed_by_user?: { name: string } | null;
    messages?: Message[];
}

function getCsrfToken(): string {
    if (typeof document === 'undefined') return '';
    const meta = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement;
    if (meta && meta.content) return meta.content;
    const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : '';
}

export function ChatWidget() {
    const page = usePage<{ auth?: { user?: { id: string; name: string; role: string } | null } }>();
    const user = page.props.auth?.user;

    const [isOpen, setIsOpen] = useState(false);
    const [conversation, setConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Load active conversation on mount if user logged in
    useEffect(() => {
        if (!user || !isOpen) return;

        setIsLoading(true);
        fetch('/chat', {
            headers: {
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            },
            credentials: 'same-origin',
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.conversation) {
                    setConversation(data.conversation);
                    setMessages(data.conversation.messages || []);
                }
            })
            .catch((err) => console.error('Error fetching conversation:', err))
            .finally(() => setIsLoading(false));
    }, [user, isOpen]);

    // Scroll to bottom when messages update
    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    // Real-time broadcast listener using Laravel Reverb Echo
    useEffect(() => {
        if (!conversation?.id) return;

        const channelName = `chat.conversation.${conversation.id}`;
        const channel = echo.private(channelName);

        channel.listen('.ChatMessageSent', (e: { messageData: Message & { conversation?: Conversation } }) => {
            if (e.messageData) {
                setMessages((prev) => {
                    // Prevent duplicate if sent by self
                    if (prev.some((m) => m.id === e.messageData.id)) return prev;
                    return [...prev, e.messageData];
                });

                if (e.messageData.conversation) {
                    setConversation(e.messageData.conversation);
                }
            }
        });

        return () => {
            echo.leave(channelName);
        };
    }, [conversation?.id]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isSending) return;

        const text = input;
        setInput('');
        setIsSending(true);

        try {
            const token = getCsrfToken();
            const res = await fetch('/chat/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': token,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin',
                body: JSON.stringify({ body: text }),
            });

            if (res.ok) {
                const data = await res.json();
                if (data.message) {
                    setMessages((prev) => {
                        if (prev.some((m) => m.id === data.message.id)) return prev;
                        return [...prev, data.message];
                    });
                }
                if (data.conversation) {
                    setConversation(data.conversation);
                }
            } else {
                console.error('Failed response sending message:', res.status);
            }
        } catch (err) {
            console.error('Failed to send message:', err);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50">
            {/* Toggle Button */}
            {!isOpen && (
                <Button
                    onClick={() => setIsOpen(true)}
                    className="size-14 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 group relative"
                >
                    <MessageSquare className="size-6 transition-transform group-hover:scale-110" />
                    <span className="absolute -top-1 -right-1 flex size-3.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full size-3.5 bg-emerald-500 border-2 border-white"></span>
                    </span>
                </Button>
            )}

            {/* Chat Box Overlay */}
            {isOpen && (
                <div className="w-[340px] sm:w-[380px] h-[500px] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
                    {/* Header */}
                    <div className="p-4 bg-emerald-700 text-white flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="size-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm border border-white/20">
                                <Sparkles className="size-5 text-white" />
                            </div>
                            <div>
                                <h4 className="font-bold text-sm tracking-tight leading-none">Live Support Real-Time</h4>
                                <p className="text-xs text-emerald-100 mt-1 flex items-center gap-1">
                                    <span className="size-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                    {conversation?.claimed_by
                                        ? `Ditangani ${conversation.claimed_by_name || conversation.claimed_by_user?.name || 'Admin'}`
                                        : 'Dukungan CS 24/7'}
                                </p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsOpen(false)}
                            className="size-8 text-white hover:bg-white/20 hover:text-white rounded-full"
                        >
                            <X className="size-4" />
                        </Button>
                    </div>

                    {/* Messages Body */}
                    {!user ? (
                        <div className="flex-1 p-6 flex flex-col items-center justify-center text-center gap-4">
                            <div className="size-12 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600">
                                <MessageSquare className="size-6" />
                            </div>
                            <div>
                                <h5 className="font-semibold text-sm">Masuk untuk Memulai Chat</h5>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Silakan login terlebih dahulu untuk dapat berkonsultasi langsung dengan admin dan superadmin kami.
                                </p>
                            </div>
                            <Link
                                href="/login"
                                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold text-center transition-colors"
                            >
                                Login Sekarang
                            </Link>
                        </div>
                    ) : isLoading ? (
                        <div className="flex-1 flex items-center justify-center text-muted-foreground gap-2 text-xs">
                            <Loader2 className="size-4 animate-spin text-emerald-600" />
                            <span>Memuat percakapan...</span>
                        </div>
                    ) : (
                        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-muted/20">
                            {messages.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center p-4 text-muted-foreground gap-2">
                                    <MessageSquare className="size-8 text-emerald-500 opacity-50" />
                                    <p className="text-xs">Halo {user.name}! Ada yang bisa kami bantu mengenai booking lapangan hari ini?</p>
                                </div>
                            ) : (
                                messages.map((msg) => {
                                    const isMe = msg.sender_id === user.id;
                                    return (
                                        <div
                                            key={msg.id}
                                            className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                                        >
                                            <div className="flex items-center gap-1 mb-0.5 text-[10px] text-muted-foreground px-1">
                                                {!isMe && (
                                                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                                        {msg.sender_name}
                                                    </span>
                                                )}
                                                <span>
                                                    {new Date(msg.created_at).toLocaleTimeString([], {
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </span>
                                            </div>
                                            <div
                                                className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${
                                                    isMe
                                                        ? 'bg-emerald-600 text-white rounded-br-none shadow-sm'
                                                        : 'bg-card border border-border text-foreground rounded-bl-none shadow-sm'
                                                }`}
                                            >
                                                {msg.body}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                    )}

                    {/* Footer / Input */}
                    {user && (
                        <form onSubmit={handleSendMessage} className="p-3 border-t border-border bg-card flex items-center gap-2">
                            <Input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ketik pesan..."
                                disabled={isSending}
                                className="text-xs h-9 rounded-full bg-muted/50 focus-visible:ring-emerald-500 border-border"
                            />
                            <Button
                                type="submit"
                                size="icon"
                                disabled={!input.trim() || isSending}
                                className="size-9 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
                            >
                                {isSending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                            </Button>
                        </form>
                    )}
                </div>
            )}
        </div>
    );
}
