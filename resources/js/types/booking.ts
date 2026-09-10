import { User } from './auth';

export type Category = {
    id: number;
    name: string;
    slug: string;
    icon?: string;
    description?: string;
    is_active: boolean;
    lapangans_count?: number;
};

export type Facility = {
    id: number;
    name: string;
    icon?: string;
};

export type Lapangan = {
    id: number;
    category_id: number;
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

export type BookingStatus = 'pending' | 'pending_validation' | 'approved' | 'rejected' | 'cancelled';

export type Booking = {
    id: number;
    booking_code: string;
    user_id: number;
    lapangan_id: number;
    booking_date: string;
    start_time: string;
    end_time: string;
    duration_hours: number;
    base_price: number;
    validation_code: number;
    total_price: number;
    payment_method: 'cash' | 'transfer';
    payment_status: BookingStatus;
    customer_name: string;
    customer_phone: string;
    notes?: string | null;
    user_submitted_code?: number | null;
    rejection_reason?: string | null;
    validated_by?: number | null;
    validated_at?: string | null;
    payment_deadline: string;
    cancelled_at?: string | null;
    created_at: string;
    updated_at: string;
    lapangan?: Lapangan;
    user?: User;
    validator?: User;
    review?: Review;
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
