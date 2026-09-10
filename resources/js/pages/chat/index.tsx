import { useState, useEffect, useRef } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { PublicLayout } from '@/layouts/public-layout';
import { MessageSquare, Send, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
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
    unread_at?: string;
    claimed_by: string | null;
    status: 'open' | 'in_progress' | 'resolved';
    claimed_by_name?: string;
    claimed_by_user?: { name: string } | null;
    claimedBy?: { name: string } | null;
    messages?: Message[];
}

interface PageProps {
    conversation: Conversation | null;
    auth: {
        user: {
            id: string;
            name: string;
            role: string;
        };
    };
}

function getCsrfToken(): string {
    if (typeof document === 'undefined') return '';
    const meta = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement;
    if (meta && meta.content) return meta.content;
    const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : '';
}

export default function UserChatIndex({ conversation: initialConversation, auth }: PageProps) {
    const user = auth.user;
    const [conversation, setConversation] = useState<Conversation | null>(initialConversation);
    const [messages, setMessages] = useState<Message[]>(initialConversation?.messages || []);
    const [input, setInput] = useState('');
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Clear unread flag when conversation is opened and has unread messages
    useEffect(() => {
        if (!conversation?.id || !conversation.unread_at) return;
        const markRead = async () => {
            try {
                const token = getCsrfToken();
                await fetch(`/chat/${conversation.id}/read`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': token,
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    credentials: 'same-origin',
                });
                // Remove unread indicator locally
                setConversation((prev) => prev ? { ...prev, unread_at: undefined } : null);
            } catch (err) {
                console.error('Failed to mark conversation as read:', err);
            }
        };
        markRead();
    }, [conversation?.id, conversation?.unread_at]);


    // Real-time broadcast listener
    useEffect(() => {
        if (!conversation?.id) return;

        const channelName = `chat.conversation.${conversation.id}`;
        const channel = echo.private(channelName);

        channel.listen('.ChatMessageSent', (e: { messageData: Message & { conversation?: Conversation } }) => {
            if (e.messageData) {
                setMessages((prev) => {
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
            const socketId = typeof echo?.socketId === 'function' ? echo.socketId() : undefined;
            const res = await fetch('/chat/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': token,
                    'X-Requested-With': 'XMLHttpRequest',
                    ...(socketId ? { 'X-Socket-ID': socketId } : {}),
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
            }
        } catch (err) {
            console.error('Error sending message:', err);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <PublicLayout>
            <Head title="Live Chat Support - SportBooking" />

            <div className="container mx-auto px-4 py-8 max-w-4xl">
                <Card className="h-[600px] flex flex-col border-border overflow-hidden bg-card shadow-xl">
                    {/* Header */}
                    <div className="p-4 bg-emerald-700 text-white flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="size-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                                <Sparkles className="size-5 text-white" />
                            </div>
                            <div>
                                <h2 className="font-bold text-base tracking-tight leading-none">Dukungan Pelanggan Real-Time</h2>
                                <p className="text-xs text-emerald-100 mt-1 flex items-center gap-1.5">
                                    <span className="size-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                    {conversation?.claimed_by
                                        ? `Ditangani oleh ${conversation.claimed_by_name || conversation.claimed_by_user?.name || conversation.claimedBy?.name || 'Admin'}`
                                        : 'Customer Service Siap Membantu'}
                                    {conversation?.unread_at && (
                                        <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">New</span>
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Messages Body */}
                    <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-muted/20">
                        {messages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground p-6 gap-3">
                                <div className="size-14 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
                                    <MessageSquare className="size-7" />
                                </div>
                                <h4 className="font-semibold text-sm">Ada yang bisa kami bantu?</h4>
                                <p className="text-xs max-w-md">
                                    Ketik pesan pertama Anda di bawah ini untuk memulai percakapan dengan tim admin dan superadmin kami secara langsung.
                                </p>
                            </div>
                        ) : (
                            messages.map((msg) => {
                                const isMe = msg.sender_id === user.id;

                                return (
                                    <div
                                        key={msg.id}
                                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                                    >
                                        <div className="flex items-center gap-1.5 mb-1 text-xs text-muted-foreground px-1">
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
                                            className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-xs ${
                                                isMe
                                                    ? 'bg-emerald-600 text-white rounded-br-none'
                                                    : 'bg-card border border-border text-foreground rounded-bl-none'
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

                    {/* Input Bar */}
                    <form onSubmit={handleSendMessage} className="p-4 border-t border-border bg-card flex items-center gap-3">
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ketik pesan Anda..."
                            disabled={isSending}
                            className="text-xs h-11 rounded-xl bg-muted/40 focus-visible:ring-emerald-500 border-border"
                        />
                        <Button
                            type="submit"
                            disabled={!input.trim() || isSending}
                            className="h-11 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-2 shrink-0 font-semibold"
                        >
                            {isSending ? (
                                <Loader2 className="size-4 animate-spin" />
                            ) : (
                                <>
                                    <Send className="size-4" />
                                    Kirim Pesan
                                </>
                            )}
                        </Button>
                    </form>
                </Card>
            </div>
        </PublicLayout>
    );
}
