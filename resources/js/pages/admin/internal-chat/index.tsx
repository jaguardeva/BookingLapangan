import { useState, useEffect, useRef } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import {
    MessageSquare,
    Send,
    Search,
    Loader2,
    Plus,
    Users,
    User as UserIcon,
    ShieldCheck,
    Shield,
    Hash,
    X,
    Check,
    Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { echo } from '@/echo';

// ── Types ───────────────────────────────────────────────────────────

interface Message {
    id: string;
    conversation_id: string;
    sender_id: string;
    sender_name?: string;
    sender_role?: string;
    sender?: {
        id: string;
        name: string;
        role: string;
    };
    body: string;
    created_at: string;
}

interface Participant {
    id: string;
    name: string;
    email: string;
    role: string;
    pivot?: { last_read_at: string | null };
}

interface StaffMember {
    id: string;
    name: string;
    role: string;
    email: string;
}

interface Conversation {
    id: string;
    is_group: boolean;
    group_name: string | null;
    created_by: string;
    participants: Participant[];
    latest_message?: Message | null;
    messages?: Message[];
    unread_count?: number;
}

interface PageProps {
    conversations: Conversation[];
    selectedConversation: Conversation | null;
    auth: {
        user: {
            id: string;
            name: string;
            role: string;
        };
    };
}

// ── Helpers ─────────────────────────────────────────────────────────

function getCsrfToken(): string {
    if (typeof document === 'undefined') return '';
    const meta = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement;
    if (meta && meta.content) return meta.content;
    const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : '';
}

function getInitials(name?: string | null): string {
    if (!name || typeof name !== 'string') return '?';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    return parts
        .slice(0, 2)
        .map((w) => w[0])
        .join('')
        .toUpperCase();
}

function getSenderName(msg?: { sender_name?: string; sender?: { name?: string } } | null): string {
    return msg?.sender_name || msg?.sender?.name || 'Staff';
}

function getSenderRole(msg?: { sender_role?: string; sender?: { role?: string } } | null): string {
    return msg?.sender_role || msg?.sender?.role || 'admin';
}

function getConversationDisplayName(conv: Conversation, currentUserId: string): string {
    if (conv.is_group && conv.group_name) {
        return conv.group_name;
    }
    const other = conv.participants?.find((p) => p.id !== currentUserId);
    return other?.name || 'Chat';
}

function formatTime(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);

    if (mins < 1) return 'Baru saja';
    if (mins < 60) return `${mins}m lalu`;

    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}j lalu`;

    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

function getRoleBadge(role: string) {
    if (role === 'superadmin') {
        return (
            <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-400 text-[10px] px-1.5 py-0">
                <ShieldCheck className="size-2.5 mr-0.5" />
                SA
            </Badge>
        );
    }
    return (
        <Badge variant="outline" className="border-sky-500/40 bg-sky-500/10 text-sky-400 text-[10px] px-1.5 py-0">
            <Shield className="size-2.5 mr-0.5" />
            Admin
        </Badge>
    );
}

// ── Component ───────────────────────────────────────────────────────

export default function InternalChatIndex({
    conversations: initialConversations,
    selectedConversation: initialSelected,
    auth,
}: PageProps) {
    const [conversations, setConversations] = useState<Conversation[]>(initialConversations || []);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(initialSelected);
    const [messages, setMessages] = useState<Message[]>(initialSelected?.messages || []);
    const [searchQuery, setSearchQuery] = useState('');
    const [input, setInput] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [showNewDmDialog, setShowNewDmDialog] = useState(false);
    const [showNewGroupDialog, setShowNewGroupDialog] = useState(false);
    const [staffList, setStaffList] = useState<StaffMember[]>([]);
    const [staffLoading, setStaffLoading] = useState(false);
    const [groupName, setGroupName] = useState('');
    const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(true);
    const [conversationToDelete, setConversationToDelete] = useState<Conversation | null>(null);
    const [isDeletingConversation, setIsDeletingConversation] = useState(false);
    const [messageToDelete, setMessageToDelete] = useState<Message | null>(null);
    const [isDeletingMessage, setIsDeletingMessage] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const currentUser = auth.user;

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

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

    // ── Real-time: listen to active conversation ────────────────────

    useEffect(() => {
        if (!selectedConversation?.id) return;

        const channelName = `internal.conversation.${selectedConversation.id}`;
        const channel = echo.private(channelName);

        channel.listen('.InternalMessageSent', (e: { messageData: Message }) => {
            if (e.messageData && e.messageData.conversation_id === selectedConversation.id) {
                setMessages((prev) => {
                    if (prev.some((m) => m.id === e.messageData.id)) return prev;

                    // If an optimistic temp message exists matching this message, replace it
                    const tempIndex = prev.findIndex(
                        (m) =>
                            m.id.startsWith('temp-') &&
                            m.sender_id === e.messageData.sender_id &&
                            m.body === e.messageData.body
                    );
                    if (tempIndex !== -1) {
                        const updated = [...prev];
                        updated[tempIndex] = e.messageData;
                        return updated;
                    }

                    return [...prev, e.messageData];
                });

                // Update the conversation list's latest message
                setConversations((prev) =>
                    prev.map((c) =>
                        c.id === e.messageData.conversation_id
                            ? { ...c, latest_message: e.messageData }
                            : c
                    )
                );
            }
        });

        channel.listen('.InternalMessageDeleted', (e: { conversationId: string; messageId: string }) => {
            if (e.conversationId === selectedConversation.id) {
                setMessages((prev) => prev.filter((m) => m.id !== e.messageId));
                setConversations((prev) =>
                    prev.map((c) =>
                        c.id === e.conversationId && c.latest_message?.id === e.messageId
                            ? { ...c, latest_message: null }
                            : c
                    )
                );
            }
        });

        channel.listen('.InternalConversationDeleted', (e: { conversationId: string }) => {
            toast.info('Percakapan telah dihapus');
            setConversations((prev) => prev.filter((c) => c.id !== e.conversationId));
            if (selectedConversation?.id === e.conversationId) {
                setSelectedConversation(null);
                setMessages([]);
            }
        });

        return () => {
            echo.leave(channelName);
        };
    }, [selectedConversation?.id]);

    // Listen on all conversations for unread updates & deletions
    useEffect(() => {
        const channelCleanups: (() => void)[] = [];

        conversations.forEach((conv) => {
            if (conv.id === selectedConversation?.id) return; // already listening above

            const channelName = `internal.conversation.${conv.id}`;
            const channel = echo.private(channelName);

            channel.listen('.InternalMessageSent', (e: { messageData: Message }) => {
                if (e.messageData) {
                    setConversations((prev) =>
                        prev.map((c) =>
                            c.id === e.messageData.conversation_id
                                ? {
                                      ...c,
                                      latest_message: e.messageData,
                                      unread_count: (c.unread_count || 0) + 1,
                                  }
                                : c
                        )
                    );
                }
            });

            channel.listen('.InternalMessageDeleted', (e: { conversationId: string; messageId: string }) => {
                setConversations((prev) =>
                    prev.map((c) =>
                        c.id === e.conversationId && c.latest_message?.id === e.messageId
                            ? { ...c, latest_message: null }
                            : c
                    )
                );
            });

            channel.listen('.InternalConversationDeleted', (e: { conversationId: string }) => {
                setConversations((prev) => prev.filter((c) => c.id !== e.conversationId));
                if (selectedConversation?.id === e.conversationId) {
                    setSelectedConversation(null);
                    setMessages([]);
                }
            });

            channelCleanups.push(() => echo.leave(channelName));
        });

        return () => {
            channelCleanups.forEach((fn) => fn());
        };
    }, [conversations.map((c) => c.id).join(','), selectedConversation?.id]);

    // ── Fetch staff list ────────────────────────────────────────────

    const fetchStaffList = async () => {
        if (staffList.length > 0) return;
        setStaffLoading(true);
        try {
            const res = await fetch('/admin/internal-chat/staff', {
                headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                credentials: 'same-origin',
            });
            const data = await res.json();
            setStaffList(data.staff || []);
        } catch {
            toast.error('Gagal memuat daftar staff');
        } finally {
            setStaffLoading(false);
        }
    };

    // ── Select conversation ─────────────────────────────────────────

    const selectConversation = (conv: Conversation) => {
        fetch(`/admin/internal-chat?conversation=${conv.id}`, {
            headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            credentials: 'same-origin',
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.selectedConversation) {
                    setSelectedConversation(data.selectedConversation);
                    setMessages(data.selectedConversation.messages || []);
                    setConversations((prev) =>
                        prev.map((c) => (c.id === conv.id ? { ...c, unread_count: 0 } : c))
                    );
                    setMobileSidebarOpen(false);
                }
            })
            .catch(() => toast.error('Gagal memuat conversation'));
    };

    // ── Start DM ────────────────────────────────────────────────────

    const startDirectChat = async (staffId: string) => {
        setIsCreating(true);
        try {
            const token = getCsrfToken();
            const res = await fetch('/admin/internal-chat/start-direct', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': token,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin',
                body: JSON.stringify({ user_id: staffId }),
            });

            if (res.ok) {
                const data = await res.json();
                if (data.conversation) {
                    // Check if conversation already in list
                    setConversations((prev) => {
                        const exists = prev.find((c) => c.id === data.conversation.id);
                        if (exists) return prev;
                        return [data.conversation, ...prev];
                    });
                    setSelectedConversation(data.conversation);
                    setMessages(data.conversation.messages || []);
                    setShowNewDmDialog(false);
                    setMobileSidebarOpen(false);
                    toast.success(data.message);
                }
            } else {
                const err = await res.json();
                toast.error(err.message || 'Gagal membuat chat');
            }
        } catch {
            toast.error('Gagal membuat chat');
        } finally {
            setIsCreating(false);
        }
    };

    // ── Create Group ────────────────────────────────────────────────

    const createGroupChat = async () => {
        if (!groupName.trim() || selectedStaffIds.length === 0) {
            toast.error('Nama grup dan minimal 1 peserta wajib diisi');
            return;
        }

        setIsCreating(true);
        try {
            const token = getCsrfToken();
            const res = await fetch('/admin/internal-chat/create-group', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': token,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin',
                body: JSON.stringify({
                    group_name: groupName.trim(),
                    participant_ids: selectedStaffIds,
                }),
            });

            if (res.ok) {
                const data = await res.json();
                if (data.conversation) {
                    setConversations((prev) => [data.conversation, ...prev]);
                    setSelectedConversation(data.conversation);
                    setMessages([]);
                    setShowNewGroupDialog(false);
                    setGroupName('');
                    setSelectedStaffIds([]);
                    setMobileSidebarOpen(false);
                    toast.success(data.message);
                }
            } else {
                const err = await res.json();
                toast.error(err.message || 'Gagal membuat grup');
            }
        } catch {
            toast.error('Gagal membuat grup');
        } finally {
            setIsCreating(false);
        }
    };

    // ── Send Message ────────────────────────────────────────────────

    const sendMessage = async () => {
        if (!input.trim() || !selectedConversation || isSending) return;
        setIsSending(true);
        const messageBody = input.trim();
        setInput('');

        // Optimistic update
        const optimisticMsg: Message = {
            id: `temp-${Date.now()}`,
            conversation_id: selectedConversation.id,
            sender_id: currentUser.id,
            sender_name: currentUser.name,
            sender_role: currentUser.role,
            body: messageBody,
            created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, optimisticMsg]);

        try {
            const token = getCsrfToken();
            const socketId = typeof echo?.socketId === 'function' ? echo.socketId() : undefined;
            const res = await fetch(`/admin/internal-chat/${selectedConversation.id}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': token,
                    'X-Requested-With': 'XMLHttpRequest',
                    ...(socketId ? { 'X-Socket-ID': socketId } : {}),
                },
                credentials: 'same-origin',
                body: JSON.stringify({ body: messageBody }),
            });

            if (res.ok) {
                const data = await res.json();
                // Replace optimistic message with real one, avoiding duplicates
                setMessages((prev) => {
                    // If the real message was already added by broadcast, remove the temp message
                    if (prev.some((m) => m.id === data.message.id)) {
                        return prev.filter((m) => m.id !== optimisticMsg.id);
                    }
                    return prev.map((m) => (m.id === optimisticMsg.id ? data.message : m));
                });
                // Update conversation list
                setConversations((prev) =>
                    prev.map((c) =>
                        c.id === selectedConversation.id
                            ? { ...c, latest_message: data.message }
                            : c
                    )
                );
            } else {
                // Remove optimistic message on failure
                setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
                toast.error('Gagal mengirim pesan');
            }
        } catch {
            setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
            toast.error('Gagal mengirim pesan');
        } finally {
            setIsSending(false);
        }
    };

    // ── Delete Conversation ─────────────────────────────────────────

    const handleDeleteConversation = async () => {
        if (!conversationToDelete) return;
        setIsDeletingConversation(true);
        try {
            const token = getCsrfToken();
            const res = await fetch(`/admin/internal-chat/${conversationToDelete.id}`, {
                method: 'DELETE',
                headers: {
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': token,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin',
            });

            if (res.ok) {
                const data = await res.json();
                toast.success(data.message || 'Percakapan berhasil dihapus');
                setConversations((prev) => prev.filter((c) => c.id !== conversationToDelete.id));
                if (selectedConversation?.id === conversationToDelete.id) {
                    setSelectedConversation(null);
                    setMessages([]);
                }
                setConversationToDelete(null);
            } else {
                const err = await res.json();
                toast.error(err.message || 'Gagal menghapus percakapan');
            }
        } catch {
            toast.error('Gagal menghapus percakapan');
        } finally {
            setIsDeletingConversation(false);
        }
    };

    // ── Delete Message ──────────────────────────────────────────────

    const handleDeleteMessage = async () => {
        if (!messageToDelete) return;
        setIsDeletingMessage(true);
        try {
            const token = getCsrfToken();
            const res = await fetch(`/admin/internal-chat/messages/${messageToDelete.id}`, {
                method: 'DELETE',
                headers: {
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': token,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin',
            });

            if (res.ok) {
                const data = await res.json();
                toast.success(data.message || 'Pesan berhasil dihapus');
                setMessages((prev) => prev.filter((m) => m.id !== messageToDelete.id));
                setConversations((prev) =>
                    prev.map((c) => {
                        if (c.id === messageToDelete.conversation_id && c.latest_message?.id === messageToDelete.id) {
                            return { ...c, latest_message: null };
                        }
                        return c;
                    })
                );
                setMessageToDelete(null);
            } else {
                const err = await res.json();
                toast.error(err.message || 'Gagal menghapus pesan');
            }
        } catch {
            toast.error('Gagal menghapus pesan');
        } finally {
            setIsDeletingMessage(false);
        }
    };

    // ── Filtered conversations ──────────────────────────────────────

    const filteredConversations = conversations.filter((c) => {
        const displayName = getConversationDisplayName(c, currentUser.id).toLowerCase();
        return displayName.includes(searchQuery.toLowerCase());
    });

    const totalUnread = conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0);

    // ── Render ──────────────────────────────────────────────────────

    return (
        <AppLayout>
            <Head title="Chat Internal" />

            <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-background">
                {/* ─── LEFT SIDEBAR ─── */}
                <div
                    className={`${
                        mobileSidebarOpen ? 'flex' : 'hidden md:flex'
                    } w-full md:w-[380px] flex-col border-r border-border/50 bg-card/50`}
                >
                    {/* Header */}
                    <div className="p-4 border-b border-border/50">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <MessageSquare className="size-5 text-violet-400" />
                                <h2 className="text-lg font-bold text-foreground">Chat Internal</h2>
                                {totalUnread > 0 && (
                                    <Badge className="bg-violet-500 text-white text-xs px-1.5 py-0 min-w-[20px] flex items-center justify-center">
                                        {totalUnread}
                                    </Badge>
                                )}
                            </div>
                            <div className="flex gap-1">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 text-xs border-violet-500/30 hover:bg-violet-500/10"
                                    onClick={() => {
                                        fetchStaffList();
                                        setShowNewDmDialog(true);
                                    }}
                                >
                                    <UserIcon className="size-3.5 mr-1" />
                                    DM
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 text-xs border-violet-500/30 hover:bg-violet-500/10"
                                    onClick={() => {
                                        fetchStaffList();
                                        setShowNewGroupDialog(true);
                                    }}
                                >
                                    <Users className="size-3.5 mr-1" />
                                    Grup
                                </Button>
                            </div>
                        </div>

                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                            <Input
                                placeholder="Cari conversation..."
                                className="pl-9 h-9 bg-background/50"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Conversation List */}
                    <div className="flex-1 overflow-y-auto">
                        {filteredConversations.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                                <MessageSquare className="size-10 mb-3 opacity-30" />
                                <p className="text-sm">Belum ada conversation</p>
                                <p className="text-xs mt-1">Mulai chat baru dengan tombol di atas</p>
                            </div>
                        ) : (
                            filteredConversations.map((conv) => {
                                const displayName = getConversationDisplayName(conv, currentUser.id);
                                const isSelected = selectedConversation?.id === conv.id;
                                const hasUnread = (conv.unread_count || 0) > 0;

                                return (
                                    <div
                                        key={conv.id}
                                        className={`w-full group flex items-start gap-3 px-4 py-3 text-left transition-all hover:bg-accent/50 border-b border-border/30 cursor-pointer ${
                                            isSelected
                                                ? 'bg-violet-500/10 border-l-2 border-l-violet-500'
                                                : ''
                                        }`}
                                        onClick={() => selectConversation(conv)}
                                    >
                                        {/* Avatar */}
                                        <Avatar className="size-10 shrink-0 mt-0.5">
                                            <AvatarFallback
                                                className={`text-xs font-semibold ${
                                                    conv.is_group
                                                        ? 'bg-violet-500/20 text-violet-400'
                                                        : 'bg-sky-500/20 text-sky-400'
                                                }`}
                                            >
                                                {conv.is_group ? (
                                                    <Hash className="size-4" />
                                                ) : (
                                                    getInitials(displayName)
                                                )}
                                            </AvatarFallback>
                                        </Avatar>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                                <span
                                                    className={`text-sm truncate ${
                                                        hasUnread ? 'font-bold text-foreground' : 'font-medium text-foreground/80'
                                                    }`}
                                                >
                                                    {displayName}
                                                </span>
                                                <div className="flex items-center gap-1 shrink-0">
                                                    {conv.latest_message && (
                                                        <span className="text-[10px] text-muted-foreground">
                                                            {formatTime(conv.latest_message.created_at)}
                                                        </span>
                                                    )}
                                                    {(!conv.is_group || conv.created_by === currentUser.id || currentUser.role === 'superadmin') && (
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="size-5 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-opacity p-0"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setConversationToDelete(conv);
                                                            }}
                                                            title="Hapus percakapan"
                                                        >
                                                            <Trash2 className="size-3" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between gap-1 mt-0.5">
                                                <p className="text-xs text-muted-foreground truncate">
                                                    {conv.latest_message ? (
                                                        <>
                                                            <span className="font-medium">
                                                                {conv.latest_message.sender_id === currentUser.id
                                                                    ? 'Anda'
                                                                    : getSenderName(conv.latest_message).split(' ')[0]}
                                                                :{' '}
                                                            </span>
                                                            {conv.latest_message.body}
                                                        </>
                                                    ) : (
                                                        <span className="italic">Belum ada pesan</span>
                                                    )}
                                                </p>
                                                {hasUnread && (
                                                    <Badge className="bg-violet-500 text-white text-[10px] px-1.5 py-0 min-w-[18px] flex items-center justify-center shrink-0">
                                                        {conv.unread_count}
                                                    </Badge>
                                                )}
                                            </div>
                                            {conv.is_group && (
                                                <div className="flex items-center gap-1 mt-1">
                                                    <Users className="size-3 text-muted-foreground" />
                                                    <span className="text-[10px] text-muted-foreground">
                                                        {conv.participants?.length || 0} anggota
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* ─── RIGHT PANEL (Chat Area) ─── */}
                <div
                    className={`${
                        mobileSidebarOpen ? 'hidden md:flex' : 'flex'
                    } flex-1 flex-col bg-background`}
                >
                    {selectedConversation ? (
                        <>
                            {/* Chat Header */}
                            <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-card/30">
                                <div className="flex items-center gap-3">
                                    {/* Mobile back button */}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="md:hidden h-8 w-8 p-0"
                                        onClick={() => setMobileSidebarOpen(true)}
                                    >
                                        ←
                                    </Button>

                                    <Avatar className="size-9">
                                        <AvatarFallback
                                            className={`text-xs font-semibold ${
                                                selectedConversation.is_group
                                                    ? 'bg-violet-500/20 text-violet-400'
                                                    : 'bg-sky-500/20 text-sky-400'
                                            }`}
                                        >
                                            {selectedConversation.is_group ? (
                                                <Hash className="size-4" />
                                            ) : (
                                                getInitials(
                                                    getConversationDisplayName(selectedConversation, currentUser.id)
                                                )
                                            )}
                                        </AvatarFallback>
                                    </Avatar>

                                    <div>
                                        <h3 className="text-sm font-semibold text-foreground">
                                            {getConversationDisplayName(selectedConversation, currentUser.id)}
                                        </h3>
                                        <div className="flex items-center gap-1 flex-wrap">
                                            {selectedConversation.participants?.map((p, idx, arr) => (
                                                <span key={p.id} className="text-[10px] text-muted-foreground">
                                                    {p.id === currentUser.id ? 'Anda' : (p.name || '').split(' ')[0]}
                                                    {idx < arr.length - 1 && ', '}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {selectedConversation.is_group && (
                                        <Badge variant="outline" className="border-violet-500/30 text-violet-400 text-xs">
                                            <Users className="size-3 mr-1" />
                                            {selectedConversation.participants?.length} anggota
                                        </Badge>
                                    )}
                                    {(!selectedConversation.is_group || selectedConversation.created_by === currentUser.id || currentUser.role === 'superadmin') && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setConversationToDelete(selectedConversation)}
                                            className="h-8 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 gap-1.5 transition-colors"
                                            title="Hapus Percakapan"
                                        >
                                            <Trash2 className="size-3.5" />
                                            <span className="hidden sm:inline">Hapus Chat</span>
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                {messages.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                                        <MessageSquare className="size-12 mb-3 opacity-20" />
                                        <p className="text-sm font-medium">Mulai percakapan</p>
                                        <p className="text-xs mt-1">Kirim pesan pertama Anda</p>
                                    </div>
                                ) : (
                                    messages.map((msg) => {
                                        const isMine = msg.sender_id === currentUser.id;
                                        const canDeleteMsg = isMine || currentUser.role === 'superadmin';

                                        return (
                                            <div
                                                key={msg.id}
                                                className={`flex group items-center gap-1.5 ${isMine ? 'justify-end' : 'justify-start'}`}
                                            >
                                                {isMine && canDeleteMsg && (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="size-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-opacity p-0 h-6 w-6 shrink-0"
                                                        onClick={() => setMessageToDelete(msg)}
                                                        title="Hapus pesan"
                                                    >
                                                        <Trash2 className="size-3" />
                                                    </Button>
                                                )}

                                                <div className={`flex gap-2 max-w-[75%] ${isMine ? 'flex-row-reverse' : ''}`}>
                                                    {!isMine && (
                                                        <Avatar className="size-7 shrink-0 mt-1">
                                                            <AvatarFallback className="text-[10px] bg-muted">
                                                                {getInitials(getSenderName(msg))}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                    )}
                                                    <div>
                                                        {!isMine && (
                                                            <div className="flex items-center gap-1.5 mb-0.5 ml-1">
                                                                <span className="text-[11px] font-semibold text-foreground/70">
                                                                    {getSenderName(msg).split(' ')[0]}
                                                                </span>
                                                                {getRoleBadge(getSenderRole(msg))}
                                                            </div>
                                                        )}
                                                        <div
                                                            className={`rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                                                                isMine
                                                                    ? 'bg-violet-600 text-white rounded-br-md'
                                                                    : 'bg-muted/60 text-foreground rounded-bl-md'
                                                            }`}
                                                        >
                                                            {msg.body}
                                                        </div>
                                                        <span
                                                            className={`text-[10px] text-muted-foreground mt-0.5 block ${
                                                                isMine ? 'text-right mr-1' : 'ml-1'
                                                            }`}
                                                        >
                                                            {formatTime(msg.created_at)}
                                                        </span>
                                                    </div>
                                                </div>

                                                {!isMine && canDeleteMsg && (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="size-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-opacity p-0 h-6 w-6 shrink-0"
                                                        onClick={() => setMessageToDelete(msg)}
                                                        title="Hapus pesan"
                                                    >
                                                        <Trash2 className="size-3" />
                                                    </Button>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input */}
                            <div className="p-4 border-t border-border/50 bg-card/30">
                                <div className="flex gap-2 items-end">
                                    <Input
                                        placeholder="Ketik pesan..."
                                        className="flex-1 bg-background/50"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                sendMessage();
                                            }
                                        }}
                                        disabled={isSending}
                                    />
                                    <Button
                                        size="sm"
                                        className="bg-violet-600 hover:bg-violet-700 h-9 px-4"
                                        onClick={sendMessage}
                                        disabled={!input.trim() || isSending}
                                    >
                                        {isSending ? (
                                            <Loader2 className="size-4 animate-spin" />
                                        ) : (
                                            <Send className="size-4" />
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                            <div className="relative mb-6">
                                <div className="absolute -inset-4 rounded-full bg-violet-500/5 animate-pulse" />
                                <MessageSquare className="size-16 text-violet-400/30" />
                            </div>
                            <h3 className="text-lg font-semibold text-foreground/60 mb-1">Chat Internal</h3>
                            <p className="text-sm">Koordinasi antar Admin & Superadmin</p>
                            <p className="text-xs mt-2">Pilih conversation di sidebar atau mulai chat baru</p>
                        </div>
                    )}
                </div>
            </div>

            {/* ─── New DM Dialog ─── */}
            <Dialog open={showNewDmDialog} onOpenChange={setShowNewDmDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <UserIcon className="size-5 text-violet-400" />
                            Chat Baru (Direct Message)
                        </DialogTitle>
                        <DialogDescription>Pilih staff untuk memulai percakapan 1-to-1</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-2 max-h-[300px] overflow-y-auto py-2">
                        {staffLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="size-6 animate-spin text-violet-400" />
                            </div>
                        ) : staffList.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">Tidak ada staff lain</p>
                        ) : (
                            staffList.map((staff) => (
                                <button
                                    key={staff.id}
                                    onClick={() => startDirectChat(staff.id)}
                                    disabled={isCreating}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent/50 transition-colors text-left disabled:opacity-50"
                                >
                                    <Avatar className="size-9">
                                        <AvatarFallback className="text-xs bg-sky-500/10 text-sky-400 font-semibold">
                                            {getInitials(staff.name)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-foreground truncate">{staff.name}</p>
                                        <p className="text-xs text-muted-foreground">{staff.email}</p>
                                    </div>
                                    {getRoleBadge(staff.role)}
                                </button>
                            ))
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* ─── New Group Dialog ─── */}
            <Dialog open={showNewGroupDialog} onOpenChange={setShowNewGroupDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Users className="size-5 text-violet-400" />
                            Buat Grup Baru
                        </DialogTitle>
                        <DialogDescription>Beri nama grup dan pilih anggota</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="group-name" className="text-sm font-medium mb-1.5 block">
                                Nama Grup
                            </Label>
                            <Input
                                id="group-name"
                                placeholder="Contoh: Koordinasi Event Futsal"
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                                className="bg-background/50"
                            />
                        </div>

                        <div>
                            <Label className="text-sm font-medium mb-1.5 block">
                                Anggota ({selectedStaffIds.length} dipilih)
                            </Label>
                            <div className="space-y-1 max-h-[200px] overflow-y-auto border rounded-lg p-2 bg-background/30">
                                {staffLoading ? (
                                    <div className="flex items-center justify-center py-6">
                                        <Loader2 className="size-5 animate-spin text-violet-400" />
                                    </div>
                                ) : (
                                    staffList.map((staff) => (
                                        <label
                                            key={staff.id}
                                            className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-accent/30 cursor-pointer"
                                        >
                                            <Checkbox
                                                checked={selectedStaffIds.includes(staff.id)}
                                                onCheckedChange={(checked) => {
                                                    setSelectedStaffIds((prev) =>
                                                        checked
                                                            ? [...prev, staff.id]
                                                            : prev.filter((id) => id !== staff.id)
                                                    );
                                                }}
                                            />
                                            <Avatar className="size-7">
                                                <AvatarFallback className="text-[10px] bg-sky-500/10 text-sky-400 font-semibold">
                                                    {getInitials(staff.name)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-foreground truncate">{staff.name}</p>
                                            </div>
                                            {getRoleBadge(staff.role)}
                                        </label>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowNewGroupDialog(false)}>
                            Batal
                        </Button>
                        <Button
                            className="bg-violet-600 hover:bg-violet-700"
                            onClick={createGroupChat}
                            disabled={!groupName.trim() || selectedStaffIds.length === 0 || isCreating}
                        >
                            {isCreating ? (
                                <>
                                    <Loader2 className="size-4 animate-spin mr-1.5" />
                                    Membuat...
                                </>
                            ) : (
                                <>
                                    <Check className="size-4 mr-1.5" />
                                    Buat Grup
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ─── DIALOG: Hapus Percakapan ─── */}
            <Dialog
                open={!!conversationToDelete}
                onOpenChange={(open) => !open && !isDeletingConversation && setConversationToDelete(null)}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-destructive flex items-center gap-2">
                            <Trash2 className="size-5" />
                            Hapus Percakapan
                        </DialogTitle>
                        <DialogDescription className="pt-2 text-sm leading-relaxed">
                            Apakah Anda yakin ingin menghapus percakapan{' '}
                            <strong className="text-foreground">
                                "{conversationToDelete ? getConversationDisplayName(conversationToDelete, currentUser.id) : ''}"
                            </strong>?
                            <br />
                            Seluruh riwayat pesan di dalamnya akan dihapus secara permanen dan tidak dapat dikembalikan.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0 mt-4">
                        <Button
                            variant="outline"
                            onClick={() => setConversationToDelete(null)}
                            disabled={isDeletingConversation}
                        >
                            Batal
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteConversation}
                            disabled={isDeletingConversation}
                        >
                            {isDeletingConversation ? (
                                <>
                                    <Loader2 className="size-4 animate-spin mr-1.5" />
                                    Menghapus...
                                </>
                            ) : (
                                <>
                                    <Trash2 className="size-4 mr-1.5" />
                                    Hapus Percakapan
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ─── DIALOG: Hapus Pesan ─── */}
            <Dialog
                open={!!messageToDelete}
                onOpenChange={(open) => !open && !isDeletingMessage && setMessageToDelete(null)}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-destructive flex items-center gap-2">
                            <Trash2 className="size-5" />
                            Hapus Pesan
                        </DialogTitle>
                        <DialogDescription className="pt-2 text-sm leading-relaxed">
                            Apakah Anda yakin ingin menghapus pesan ini? Pesan akan dihapus secara permanen untuk semua peserta percakapan.
                        </DialogDescription>
                    </DialogHeader>
                    {messageToDelete && (
                        <div className="p-3 my-2 bg-muted/40 rounded-lg text-sm text-foreground/80 italic border border-border/40 line-clamp-3">
                            "{messageToDelete.body}"
                        </div>
                    )}
                    <DialogFooter className="gap-2 sm:gap-0 mt-2">
                        <Button
                            variant="outline"
                            onClick={() => setMessageToDelete(null)}
                            disabled={isDeletingMessage}
                        >
                            Batal
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteMessage}
                            disabled={isDeletingMessage}
                        >
                            {isDeletingMessage ? (
                                <>
                                    <Loader2 className="size-4 animate-spin mr-1.5" />
                                    Menghapus...
                                </>
                            ) : (
                                <>
                                    <Trash2 className="size-4 mr-1.5" />
                                    Hapus Pesan
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
