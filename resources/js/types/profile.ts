export type UserProfile = {
    phone: string | null;
    avatar_path?: string | null;
    avatar?: string | null;
    city: string | null;
    date_of_birth: string | null;
    gender: string | null;
    favorite_sports: string[];
    preferred_playing_time: string | null;
};

export type ProfileCompletion = {
    percentage: number;
    is_complete: boolean;
    missing: string[];
};
