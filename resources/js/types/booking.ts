import { User } from './auth';

export type Category = {
    id: string;
    name: string;
    slug: string;
    icon?: string;
    description?: string;
    is_active: boolean;
    lapangans_count?: number;
};

export type Facility = {
    id: string;
    name: string;
    icon?: string;
    lapangans_count?: number;
};

export type Lapangan = {
    id: string;
    category_id: string;
    name: string;
    slug: string;
    description?: string;
    price_per_hour: number;
    operational_start: string;
    operational_end: string;
    slot_duration_minutes: number;
    images?: string[];
    is_active: boolean;
    category?: Category;
    facilities?: Facility[];
    reviews_avg_rating?: number | null;
    reviews_count?: number;
    bookings_count?: number;
    reviews?: Review[];
};

export type BankAccount = {
    id: number;
    bank_name: string;
    account_number: string;
    account_name: string;
    is_active: boolean;
};

export type Banner = {
    id: string;
    title: string;
    body?: string | null;
    image_url: string;
    alt_text?: string | null;
    link_url?: string | null;
};

export type Membership = {
    id: string;
    amount: number;
    subtotal?: number;
    reservation_month?: string | null;
    reservation_start_date?: string | null;
    discount_value?: number;
    discount_amount?: number;
    status: 'pending' | 'active' | 'expired' | 'rejected' | 'cancelled';
    payment_status: 'pending' | 'pending_validation' | 'approved' | 'rejected' | 'cancelled';
    validation_code: number;
    payment_deadline?: string | null;
    payment_method?: 'transfer' | string;
    user_submitted_code?: number | null;
    starts_at?: string | null;
    ends_at?: string | null;
    renewal_notified_at?: string | null;
    rejection_reason?: string | null;
    created_at?: string;
    updated_at?: string;
    user?: User;
    validator?: User;
    reservations?: Array<{ id: string; weekday: number; start_time: string; end_time: string; duration_hours: number; price_per_occurrence: number; occurrence_count?: number; lapangan?: Lapangan }>;
    bookings_count?: number;
    bookings?: Booking[];
};

export type BookingStatus =
    | 'pending'
    | 'pending_validation'
    | 'approved'
    | 'rejected'
    | 'cancelled';

export type Booking = {
    id: number;
    booking_code: string;
    user_id: string | null;
    lapangan_id: number;
    booking_date: string;
    start_time: string;
    end_time: string;
    duration_hours: number;
    base_price: number;
    discount_amount: number;
    validation_code: number;
    total_price: number;
    points_redeemed: number;
    payment_method: 'cash' | 'transfer';
    payment_status: BookingStatus;
    customer_name: string;
    customer_phone: string;
    customer_email?: string | null;
    notes?: string | null;
    user_submitted_code?: number | null;
    rejection_reason?: string | null;
    validated_by?: number | null;
    validated_at?: string | null;
    payment_deadline: string;
    booking_source?: 'daily' | 'membership' | string | null;
    membership_id?: string | null;
    is_membership?: boolean;
    cancelled_at?: string | null;
    created_at: string;
    updated_at: string;
    lapangan?: Lapangan;
    user?: User;
    validator?: User;
    review?: Review;
    membership?: Membership;
};

export type Review = {
    id: number;
    booking_id: number;
    lapangan_id: number;
    user_id: number;
    rating: number;
    comment?: string | null;
    created_at: string;
    user?: User;
    lapangan?: Lapangan;
};

export type ActivityLog = {
    id: number;
    user_id?: number | null;
    action: string;
    description: string;
    properties?: Record<string, unknown> | null;
    ip_address?: string | null;
    created_at: string;
    user?: User;
};

export type InAppNotification = {
    id: string;
    type: string;
    data: {
        title: string;
        message: string;
        type: 'info' | 'alert' | 'success' | 'warning' | 'error';
        booking_id?: number;
        booking_code?: string;
        url?: string;
    };
    read_at?: string | null;
    created_at: string;
};
