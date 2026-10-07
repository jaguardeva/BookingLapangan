export type User = {
    id: number;
    name: string;
    email: string;
    role: 'superadmin' | 'admin' | 'user';
    phone?: string | null;
    avatar?: string | null;
    unread_notifications_count?: number;
    points_balance?: number;
    available_points?: number;
    email_verified_at: string | null;
    is_verified?: boolean;
    two_factor_enabled?: boolean;
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
};

export type Auth = {
    user: User;
};

export type TwoFactorSetupData = {
    svg: string;
    url: string;
};

export type TwoFactorSecretKey = {
    secretKey: string;
};
