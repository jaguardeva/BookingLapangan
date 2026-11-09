import { Link, router } from '@inertiajs/react';
import { Coins, LogOut, UserCircle } from 'lucide-react';
import { usePage } from '@inertiajs/react';
import {
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { UserInfo } from '@/components/user-info';
import { useMobileNavigation } from '@/hooks/use-mobile-navigation';
import { logout } from '@/routes';
import { edit } from '@/routes/profile';
import type { User } from '@/types';
import { ProfileCompletionReminder } from '@/components/profile-completion-reminder';
import type { ProfileCompletion } from '@/types';

type Props = {
    user: User;
};

export function UserMenuContent({ user }: Props) {
    const { profile_completion } = usePage<{ profile_completion?: ProfileCompletion | null }>().props;
    const cleanup = useMobileNavigation();

    const handleLogout = () => {
        cleanup();
        router.flushAll();
    };

    return (
        <>
            <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <UserInfo user={user} showEmail={true} />
                </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="px-2 py-1"><ProfileCompletionReminder completion={profile_completion} /></div>
            
            {/* Available Points Quick Card */}
            <div className="px-2 py-1">
                <Link
                    href="/points/history"
                    onClick={cleanup}
                    className="flex items-center justify-between gap-2 rounded-xl border border-primary/20 bg-primary/5 p-2 transition-colors hover:bg-primary/10"
                >
                    <div className="flex min-w-0 items-center gap-2">
                        <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                            <Coins className="size-3.5" />
                        </div>
                        <div className="min-w-0 text-left">
                            <p className="text-[10px] font-medium leading-none text-muted-foreground">
                                Poin Dapat Digunakan
                            </p>
                            <p className="mt-0.5 truncate text-xs font-bold leading-tight text-primary">
                                {(user.available_points ?? user.points_balance ?? 0).toLocaleString('id-ID')} Poin
                            </p>
                        </div>
                    </div>
                    <span className="shrink-0 text-[10px] font-semibold text-primary">
                        Riwayat &rarr;
                    </span>
                </Link>
            </div>

            <DropdownMenuSeparator />
            <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                    <Link
                        className="block w-full cursor-pointer"
                        href={edit()}
                        prefetch
                        onClick={cleanup}
                    >
                        <UserCircle className="size-4 shrink-0" />
                        Profil Saya
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link
                        className="flex w-full cursor-pointer items-center justify-between"
                        href="/points/history"
                        prefetch
                        onClick={cleanup}
                    >
                        <span className="flex items-center gap-2">
                            <Coins className="size-4 shrink-0 text-primary" />
                            Riwayat Poin
                        </span>
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                            {(user.available_points ?? user.points_balance ?? 0).toLocaleString('id-ID')}
                        </span>
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
                <Link
                    className="block w-full cursor-pointer"
                    href={logout()}
                    as="button"
                    onClick={handleLogout}
                    data-test="logout-button"
                >
                    <LogOut className="size-4 shrink-0" />
                    Keluar
                </Link>
            </DropdownMenuItem>
        </>
    );
}
