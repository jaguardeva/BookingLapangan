import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

declare global {
    interface Window {
        Pusher: typeof Pusher;
        Echo: Echo;
    }
}

function getCsrfToken(): string {
    if (typeof document === 'undefined') return '';
    const meta = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement;
    if (meta && meta.content) {
        return meta.content;
    }
    const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : '';
}

// Dummy channel and echo implementation for SSR execution
const createDummyChannel = () => {
    const channel: any = {
        listen: () => channel,
        listenForWhisper: () => channel,
        notification: () => channel,
        stopListening: () => channel,
        whisper: () => channel,
        subscribed: () => channel,
        error: () => channel,
        here: () => channel,
        joining: () => channel,
        leaving: () => channel,
    };
    return channel;
};

const createDummyEcho = (): Echo => {
    const dummy: any = {
        channel: () => createDummyChannel(),
        private: () => createDummyChannel(),
        join: () => createDummyChannel(),
        leave: () => dummy,
        leaveChannel: () => dummy,
        disconnect: () => dummy,
        socketId: () => '',
        connector: null,
    };
    return dummy as Echo;
};

let echoInstance: Echo;

if (typeof window !== 'undefined') {
    window.Pusher = Pusher;

    echoInstance = new Echo({
        broadcaster: 'reverb',
        key: import.meta.env.VITE_REVERB_APP_KEY,
        wsHost: import.meta.env.VITE_REVERB_HOST,
        wsPort: import.meta.env.VITE_REVERB_PORT ? Number(import.meta.env.VITE_REVERB_PORT) : 8080,
        wssPort: import.meta.env.VITE_REVERB_PORT ? Number(import.meta.env.VITE_REVERB_PORT) : 443,
        forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'https') === 'https',
        enabledTransports: ['ws', 'wss'],
        auth: {
            headers: {
                'X-CSRF-TOKEN': getCsrfToken(),
                'X-Requested-With': 'XMLHttpRequest',
            },
        },
    });

    window.Echo = echoInstance;
} else {
    echoInstance = createDummyEcho();
}

export const echo = echoInstance;
export default echo;

