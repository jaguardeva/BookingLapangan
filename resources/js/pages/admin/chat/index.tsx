import { useState, useEffect, useRef } from 'react';
import { Head, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import {
    MessageSquare,
    User,
    ShieldCheck,
    Send,
    CheckCircle2,
    Clock,
    UserCheck,
    Search,
    Filter,
    Loader2,
    Inbox,
    Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
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

interface ConversationUser {
    id: string;
    name: string;
    email: string;
}

interface Conversation {
    id: string;
    user_id: string;
    user_name?: string;
    user: ConversationUser;
    claimed_by: string | null;
    claimed_by_name?: string;
    claimed_by_user?: { name: string } | null;
    claimed_by_user_name?: string;
    claimedBy?: { name: string } | null;
    status: 'open' | 'in_progress' | 'resolved';
    last_message_at: string | null;
    latest_message?: Message | null;
    messages?: Message[];
}

interface PageProps {
    conversations: Conversation[];
    selectedConversation: Conversation | null;
    unclaimedCount: number;
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

export default function AdminChatIndex({
    conversations: initialConversations,
    selectedConversation: initialSelected,
    unclaimedCount: initialUnclaimedCount,
    auth,
}: PageProps) {
    const [conversations, setConversations] = useState<Conversation[]>(initialConversations || []);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(initialSelected);
    const [messages, setMessages] = useState<Message[]>(initialSelected?.messages || []);
    const [unclaimedCount, setUnclaimedCount] = useState<number>(initialUnclaimedCount || 0);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [input, setInput] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [isClaiming, setIsClaiming] = useState(false);
    const [isResolving, setIsResolving] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const currentUser = auth.user;

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Keep messages synced when selected conversation changes
    useEffect(() => {
        if (selectedConversation) {
            setMessages(selectedConversation.messages || []);
        } else {
            setMessages([]);
        }
    }, [selectedConversation?.id]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Real-time listener for general admin inbox channel
    useEffect(() => {
        const inboxChannel = echo.private('admin.inbox');

        inboxChannel.listen('.ChatMessageSent', (e: { messageData: Message & { conversation?: Conversation } }) => {
            if (!e.messageData) return;

            const updatedConv = e.messageData.conversation;

            setConversations((prev) => {
                const existingIndex = prev.findIndex((c) => c.id === e.messageData.conversation_id);
                if (existingIndex > -1) {
                    const copy = [...prev];
                    const existing = copy[existingIndex];

                    const updated: Conversation = {
                        ...existing,
                        last_message_at: e.messageData.created_at,
                        latest_message: e.messageData,
                        claimed_by: updatedConv?.claimed_by ?? existing.claimed_by,
                        status: updatedConv?.status ?? existing.status,
                    };

                    copy[existingIndex] = updated;
                    return copy;
                } else if (updatedConv) {
                    return [
                        {
                            id: updatedConv.id,
                            user_id: updatedConv.user_id,
                            user: { id: updatedConv.user_id, name: updatedConv.user_name || 'User', email: '' },
                            claimed_by: updatedConv.claimed_by,
                            status: updatedConv.status,
                            last_message_at: updatedConv.last_message_at,
                            latest_message: e.messageData,
                        },
                        ...prev,
                    ];
                }
                return prev;
            });

            // Update unclaimed count
            if (updatedConv && updatedConv.status === 'open') {
                setUnclaimedCount((prev) => prev + 1);
            }
        });

        return () => {
            echo.leave('admin.inbox');
        };
    }, []);

    // Real-time listener for current active conversation
    useEffect(() => {
        if (!selectedConversation?.id) return;

        const convChannelName = `chat.conversation.${selectedConversation.id}`;
        const convChannel = echo.private(convChannelName);

        convChannel.listen('.ChatMessageSent', (e: { messageData: Message & { conversation?: Conversation } }) => {
            if (e.messageData && e.messageData.conversation_id === selectedConversation.id) {
                setMessages((prev) => {
                    if (prev.some((m) => m.id === e.messageData.id)) return prev;
                    return [...prev, e.messageData];
                });

                if (e.messageData.conversation) {
                    setSelectedConversation((prev) =>
                        prev
                            ? {
                                  ...prev,
                                  status: e.messageData.conversation!.status,
                                  claimed_by: e.messageData.conversation!.claimed_by,
                                  claimedBy: e.messageData.conversation!.claimed_by_name
                                      ? { name: e.messageData.conversation!.claimed_by_name! }
                                      : prev.claimedBy,
                              }
                            : null
                    );
                }
            }
        });

        return () => {
            echo.leave(convChannelName);
        };
    }, [selectedConversation?.id]);

    const selectConversation = (conv: Conversation) => {
        // Fetch full conversation details with messages
        fetch(`/admin/chat?conversation=${conv.id}`, {
            headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            credentials: 'same-origin',
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.selectedConversation) {
                    setSelectedConversation(data.selectedConversation);
                    setMessages(data.selectedConversation.messages || []);
                }
            })
            .catch((err) => console.error(err));
    };

    const handleClaim = async () => {
        if (!selectedConversation || isClaiming) return;
        setIsClaiming(true);

        try {
            const token = getCsrfToken();
            const res = await fetch(`/admin/chat/${selectedConversation.id}/claim`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': token,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin',
            });

            if (res.ok) {
                const data = await res.json();
                toast.success('Chat berhasil diklaim');
                if (data.conversation) {
                    setSelectedConversation(data.conversation);
                    setConversations((prev) =>
                        prev.map((c) => (c.id === data.conversation.id ? { ...c, ...data.conversation } : c))
                    );
                    setUnclaimedCount((prev) => Math.max(0, prev - 1));
                }
            }
        } catch (err) {
            toast.error('Gagal mengklaim chat');
        } finally {
            setIsClaiming(false);
        }
    };

    const handleResolve = async () => {
        if (!selectedConversation || isResolving) return;
        setIsResolving(true);

        try {
            const token = getCsrfToken();
            const res = await fetch(`/admin/chat/${selectedConversation.id}/resolve`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': token,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin',
            });

            if (res.ok) {
                const data = await res.json();
                toast.success('Chat ditandai sebagai selesai');
                if (data.conversation) {
                    setSelectedConversation(data.conversation);
                    setConversations((prev) =>
                        prev.map((c) => (c.id === data.conversation.id ? { ...c, status: 'resolved' } : c))
                    );
                }
            }
        } catch (err) {
            toast.error('Gagal mengubah status chat');
        } finally {
            setIsResolving(false);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || !selectedConversation || isSending) return;

        const text = input;
        setInput('');
        setIsSending(true);

        try {
            const token = getCsrfToken();
            const socketId = typeof echo?.socketId === 'function' ? echo.socketId() : undefined;
            const res = await fetch(`/admin/chat/${selectedConversation.id}/messages`, {
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
                    setSelectedConversation(data.conversation);
                    setConversations((prev) =>
                        prev.map((c) => (c.id === data.conversation.id ? { ...c, ...data.conversation } : c))
                    );
                }
            }
        } catch (err) {
            toast.error('Gagal mengirim pesan');
        } finally {
            setIsSending(false);
        }
    };

    const filteredConversations = conversations.filter((c) => {
        const matchSearch =
            c.user?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.latest_message?.body.toLowerCase().includes(searchQuery.toLowerCase());
        if (filterStatus === 'all') return matchSearch;
        return matchSearch && c.status === filterStatus;
    });

    return (
        <AppLayout breadcrumbs={[{ title: 'Live Chat Support', href: '/admin/chat' }]}>
            <Head title="Live Chat Support - Admin Workspace" />

            <div className="space-y-4">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border rounded-xl p-4 shadow-sm">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                            <MessageSquare className="size-6 text-emerald-600" />
                            Live Chat Support
                        </h1>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Kelola layanan pelanggan real-time dengan model Shared Inbox & Claim.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Badge variant="outline" className="px-3 py-1.5 text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 font-medium">
                            <Clock className="size-3.5 mr-1" />
                            {unclaimedCount} Chat Belum Diklaim
                        </Badge>
                    </div>
                </div>

                {/* Main 2-Column Chat Interface */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[calc(100vh-220px)] min-h-[500px]">
                    {/* Left Panel: Conversation List (4 cols) */}
                    <Card className="lg:col-span-4 flex flex-col overflow-hidden border-border bg-card">
                        {/* Search & Filter Header */}
                        <div className="p-3 border-b border-border space-y-2 bg-muted/20">
                            <div className="relative">
                                <Search className="size-4 absolute left-3 top-2.5 text-muted-foreground" />
                                <Input
                                    placeholder="Cari nama atau isi chat..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9 h-9 text-xs bg-background border-border"
                                />
                            </div>

                            {/* Filter Tabs */}
                            <div className="grid grid-cols-4 gap-1 p-1 bg-muted/60 rounded-lg text-xs">
                                <button
                                    onClick={() => setFilterStatus('all')}
                                    className={`py-1 text-center rounded-md font-medium transition-all ${
                                        filterStatus === 'all'
                                            ? 'bg-background text-foreground shadow-xs'
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    Semua
                                </button>
                                <button
                                    onClick={() => setFilterStatus('open')}
                                    className={`py-1 text-center rounded-md font-medium transition-all flex items-center justify-center gap-1 ${
                                        filterStatus === 'open'
                                            ? 'bg-amber-500 text-white shadow-xs'
                                            : 'text-muted-foreground hover:text-amber-600'
                                    }`}
                                >
                                    Open
                                    {unclaimedCount > 0 && (
                                        <span className="size-4 rounded-full bg-amber-700 text-white text-[10px] flex items-center justify-center font-bold">
                                            {unclaimedCount}
                                        </span>
                                    )}
                                </button>
                                <button
                                    onClick={() => setFilterStatus('in_progress')}
                                    className={`py-1 text-center rounded-md font-medium transition-all ${
                                        filterStatus === 'in_progress'
                                            ? 'bg-blue-600 text-white shadow-xs'
                                            : 'text-muted-foreground hover:text-blue-600'
                                    }`}
                                >
                                    Proses
                                </button>
                                <button
                                    onClick={() => setFilterStatus('resolved')}
                                    className={`py-1 text-center rounded-md font-medium transition-all ${
                                        filterStatus === 'resolved'
                                            ? 'bg-emerald-600 text-white shadow-xs'
                                            : 'text-muted-foreground hover:text-emerald-600'
                                    }`}
                                >
                                    Selesai
                                </button>
                            </div>
                        </div>

                        {/* List items */}
                        <div className="flex-1 overflow-y-auto divide-y divide-border/60">
                            {filteredConversations.length === 0 ? (
                                <div className="p-8 text-center text-muted-foreground space-y-2">
                                    <Inbox className="size-8 mx-auto text-muted-foreground/50" />
                                    <p className="text-xs">Tidak ada percakapan ditemukan.</p>
                                </div>
                            ) : (
                                filteredConversations.map((conv) => {
                                    const isSelected = selectedConversation?.id === conv.id;
                                    const handlerName =
                                        conv.claimed_by_name ||
                                        conv.claimed_by_user?.name ||
                                        conv.claimedBy?.name ||
                                        (conv.claimed_by === currentUser.id ? currentUser.name : null);

                                    return (
                                        <div
                                            key={conv.id}
                                            onClick={() => selectConversation(conv)}
                                            className={`p-3 cursor-pointer transition-all hover:bg-muted/50 ${
                                                isSelected ? 'bg-emerald-500/10 border-l-4 border-emerald-600' : ''
                                            }`}
                                        >
                                            <div className="flex items-center justify-between gap-2 mb-1">
                                                <span className="font-semibold text-xs text-foreground truncate">
                                                    {conv.user?.name || 'Customer'}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground shrink-0">
                                                    {conv.last_message_at
                                                        ? new Date(conv.last_message_at).toLocaleTimeString([], {
                                                              hour: '2-digit',
                                                              minute: '2-digit',
                                                          })
                                                        : ''}
                                                </span>
                                            </div>

                                            <div className="text-xs text-muted-foreground truncate mb-2">
                                                {conv.latest_message?.body || 'Belum ada pesan'}
                                            </div>

                                            <div className="flex items-center justify-between text-[11px] gap-2">
                                                {conv.status === 'open' && (
                                                    <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 text-[10px] px-1.5 py-0">
                                                        Belum Diklaim
                                                    </Badge>
                                                )}
                                                {conv.status === 'in_progress' && (
                                                    <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30 text-[10px] px-1.5 py-0">
                                                        Proses
                                                    </Badge>
                                                )}
                                                {conv.status === 'resolved' && (
                                                    <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[10px] px-1.5 py-0">
                                                        Selesai
                                                    </Badge>
                                                )}

                                                <span className="text-[10px] text-muted-foreground truncate">
                                                    {handlerName ? `Assigned: ${handlerName}` : 'Belum ditangani'}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </Card>

                    {/* Right Panel: Selected Chat Room (8 cols) */}
                    <Card className="lg:col-span-8 flex flex-col overflow-hidden border-border bg-card">
                        {!selectedConversation ? (
                            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground space-y-3">
                                <div className="size-14 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600">
                                    <MessageSquare className="size-7" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-base text-foreground">Pilih Percakapan</h3>
                                    <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                                        Pilih salah satu pesan dari panel kiri untuk melihat riwayat percakapan dan membalas pesan pengguna.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Chat Header */}
                                <div className="p-4 border-b border-border bg-muted/20 flex flex-wrap items-center justify-between gap-3 shadow-xs">
                                    <div className="flex items-center gap-3">
                                        <div className="size-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
                                            {selectedConversation.user?.name?.charAt(0).toUpperCase() || 'U'}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                                                {selectedConversation.user?.name || 'Customer'}
                                            </h3>
                                            <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                                                {selectedConversation.status === 'open' && (
                                                    <span className="inline-flex items-center text-amber-600 dark:text-amber-400 font-medium">
                                                        • Menunggu Admin Klaim
                                                    </span>
                                                )}
                                                {selectedConversation.status === 'in_progress' && (
                                                    <span className="inline-flex items-center text-blue-600 dark:text-blue-400 font-medium">
                                                        • Ditangani oleh{' '}
                                                        {selectedConversation.claimedBy?.name ||
                                                            selectedConversation.claimed_by_name ||
                                                            (selectedConversation.claimed_by === currentUser.id
                                                                ? currentUser.name
                                                                : 'Admin')}
                                                    </span>
                                                )}
                                                {selectedConversation.status === 'resolved' && (
                                                    <span className="inline-flex items-center text-emerald-600 dark:text-emerald-400 font-medium">
                                                        • Chat Selesai
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-2">
                                        {selectedConversation.status === 'open' && (
                                            <Button
                                                onClick={handleClaim}
                                                disabled={isClaiming}
                                                size="sm"
                                                className="bg-amber-600 hover:bg-amber-700 text-white text-xs gap-1.5"
                                            >
                                                {isClaiming ? (
                                                    <Loader2 className="size-3.5 animate-spin" />
                                                ) : (
                                                    <UserCheck className="size-3.5" />
                                                )}
                                                Klaim Chat Ini
                                            </Button>
                                        )}

                                        {selectedConversation.status === 'in_progress' && (
                                            <Button
                                                onClick={handleResolve}
                                                disabled={isResolving}
                                                size="sm"
                                                variant="outline"
                                                className="border-emerald-600 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950 text-xs gap-1.5"
                                            >
                                                {isResolving ? (
                                                    <Loader2 className="size-3.5 animate-spin" />
                                                ) : (
                                                    <CheckCircle2 className="size-3.5" />
                                                )}
                                                Tandai Selesai
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                {/* Message Stream */}
                                <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-muted/10">
                                    {messages.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground text-xs">
                                            Belum ada pesan dalam percakapan ini.
                                        </div>
                                    ) : (
                                        messages.map((msg) => {
                                            const isStaff = msg.sender_role === 'admin' || msg.sender_role === 'superadmin';
                                            const isMe = msg.sender_id === currentUser.id;

                                            return (
                                                <div
                                                    key={msg.id}
                                                    className={`flex flex-col ${isStaff ? 'items-end' : 'items-start'}`}
                                                >
                                                    <div className="flex items-center gap-1.5 mb-1 text-[11px] text-muted-foreground px-1">
                                                        <span className="font-semibold text-foreground">
                                                            {msg.sender_name}
                                                        </span>
                                                        {isStaff && (
                                                            <Badge variant="outline" className="text-[9px] px-1 py-0 bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                                                                Staff
                                                            </Badge>
                                                        )}
                                                        <span>•</span>
                                                        <span>
                                                            {new Date(msg.created_at).toLocaleTimeString([], {
                                                                hour: '2-digit',
                                                                minute: '2-digit',
                                                            })}
                                                        </span>
                                                    </div>

                                                    <div
                                                        className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-xs ${
                                                            isStaff
                                                                ? 'bg-emerald-600 text-white rounded-tr-none'
                                                                : 'bg-card border border-border text-foreground rounded-tl-none'
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
                                {(() => {
                                    const isClaimedByOther =
                                        selectedConversation.claimed_by &&
                                        selectedConversation.claimed_by !== currentUser.id &&
                                        currentUser.role !== 'superadmin';

                                    const handlerName =
                                        selectedConversation.claimedBy?.name ||
                                        selectedConversation.claimed_by_name ||
                                        (selectedConversation.claimed_by === currentUser.id ? 'Anda' : 'Admin Lain');

                                    return (
                                        <form
                                            onSubmit={handleSendMessage}
                                            className="p-3 border-t border-border bg-card flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
                                        >
                                            <Input
                                                value={input}
                                                onChange={(e) => setInput(e.target.value)}
                                                placeholder={
                                                    selectedConversation.status === 'resolved'
                                                        ? 'Chat ini telah ditandai selesai'
                                                        : isClaimedByOther
                                                        ? `Chat ini sedang ditangani oleh ${handlerName}`
                                                        : !selectedConversation.claimed_by
                                                        ? 'Ketik balasan (otomatis mengklaim chat ini untuk Anda)...'
                                                        : 'Ketik balasan untuk pengguna...'
                                                }
                                                disabled={isSending || isClaimedByOther || selectedConversation.status === 'resolved'}
                                                className="text-xs h-10 rounded-xl bg-muted/40 focus-visible:ring-emerald-500 border-border flex-1"
                                            />
                                            <Button
                                                type="submit"
                                                disabled={!input.trim() || isSending || isClaimedByOther || selectedConversation.status === 'resolved'}
                                                className="h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5 shrink-0"
                                            >
                                                {isSending ? (
                                                    <Loader2 className="size-4 animate-spin" />
                                                ) : (
                                                    <>
                                                        <Send className="size-4" />
                                                        Kirim
                                                    </>
                                                )}
                                            </Button>
                                        </form>
                                    );
                                })()}
                            </>
                        )}
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
