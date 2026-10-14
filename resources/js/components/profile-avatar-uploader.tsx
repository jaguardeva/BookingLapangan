import { router } from '@inertiajs/react';
import { useRef, useState } from 'react';
import { Camera, ImagePlus, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import ConfirmDialog from '@/components/confirm-dialog';
import { AvatarCropDialog } from '@/components/avatar-crop-dialog';
import { ProfileAvatarPreview } from '@/components/profile-avatar-preview';
import { useInitials } from '@/hooks/use-initials';
import { destroy as destroyAvatar, update as updateAvatar } from '@/routes/profile/avatar';

type ProfileAvatarUploaderProps = {
    name: string;
    avatar?: string | null;
};

export function ProfileAvatarUploader({ name, avatar }: ProfileAvatarUploaderProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [processing, setProcessing] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
    const [selectedFileName, setSelectedFileName] = useState('avatar');
    const [previewOpen, setPreviewOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const initials = useInitials();

    const upload = (file: File) => {
        const imageUrl = URL.createObjectURL(file);
        setSelectedImageUrl(imageUrl);
        setSelectedFileName(file.name);
        setError(null);
    };

    const closeCropDialog = () => {
        if (selectedImageUrl) URL.revokeObjectURL(selectedImageUrl);
        setSelectedImageUrl(null);
        if (inputRef.current) inputRef.current.value = '';
    };

    const confirmCrop = (file: File) => {
        closeCropDialog();
        setProcessing(true);
        router.post(updateAvatar.url(), { avatar: file }, {
            forceFormData: true,
            preserveScroll: true,
            onError: (errors) => setError(errors.avatar ?? 'Foto profil gagal diunggah.'),
            onFinish: () => setProcessing(false),
        });
    };

    const confirmDelete = () => {
        if (deleting) return;

        setDeleting(true);
        router.delete(destroyAvatar.url(), {
            preserveScroll: true,
            onError: () => setError('Foto profil gagal dihapus. Silakan coba lagi.'),
            onFinish: () => {
                setDeleting(false);
                setDeleteDialogOpen(false);
            },
        });
    };

    return (
        <>
            <div className="from-primary/8 via-card to-background overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-br p-4 sm:p-5">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-4 sm:gap-5">
                        <button
                            type="button"
                            className="group relative shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4"
                            onClick={() => avatar && setPreviewOpen(true)}
                            disabled={!avatar}
                            aria-label={avatar ? 'Lihat foto profil' : 'Belum ada foto profil'}
                        >
                            <span className="bg-primary/20 absolute -inset-1 rounded-full opacity-70 blur-sm transition-opacity group-hover:opacity-100" />
                            <Avatar className="border-background relative size-24 border-4 shadow-lg sm:size-28">
                                {avatar && <AvatarImage src={avatar} alt={name} />}
                                <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold sm:text-2xl">
                                    {initials(name)}
                                </AvatarFallback>
                            </Avatar>
                            {avatar && (
                                <span className="bg-background text-muted-foreground absolute right-0 bottom-0 flex size-7 items-center justify-center rounded-full border shadow-sm transition-colors group-hover:text-foreground">
                                    <ImagePlus className="size-3.5" />
                                </span>
                            )}
                        </button>

                        <div className="min-w-0 space-y-1">
                            <p className="text-foreground truncate font-semibold">{name}</p>
                            <p className="text-muted-foreground text-sm">
                                {avatar ? 'Foto profil Anda terlihat oleh pemain lain.' : 'Tambahkan foto agar profil Anda lebih mudah dikenali.'}
                            </p>
                            <p className="text-muted-foreground/80 text-xs">JPG, PNG, atau WEBP · Maksimal 1 MB</p>
                        </div>
                    </div>

                    <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-36">
                        <input
                            ref={inputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="hidden"
                            onChange={(event) => {
                                const file = event.target.files?.[0];
                                if (file) upload(file);
                            }}
                        />
                        <Button
                            type="button"
                            className="w-full rounded-xl font-semibold shadow-sm"
                            disabled={processing || deleting}
                            onClick={() => inputRef.current?.click()}
                        >
                            <Camera className="size-4" />
                            {processing ? 'Mengunggah...' : avatar ? 'Ganti foto' : 'Tambah foto'}
                        </Button>
                        {avatar && (
                            <Button
                                type="button"
                                variant="ghost"
                                className="text-destructive hover:bg-destructive/10 hover:text-destructive w-full rounded-xl"
                                disabled={processing || deleting}
                                onClick={() => setDeleteDialogOpen(true)}
                            >
                                <Trash2 className="size-4" />
                                Hapus foto
                            </Button>
                        )}
                    </div>
                </div>

                {error && <p className="text-destructive mt-4 text-xs font-medium" role="alert">{error}</p>}
            </div>

            <ConfirmDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                title="Hapus foto profil?"
                description="Foto profil akan dihapus dan profil Anda akan kembali menggunakan inisial nama. Tindakan ini tidak dapat dibatalkan."
                confirmLabel={deleting ? 'Menghapus...' : 'Hapus foto'}
                variant="destructive"
                confirmDisabled={deleting}
                onConfirm={confirmDelete}
            />
            <AvatarCropDialog
                open={selectedImageUrl !== null}
                imageUrl={selectedImageUrl}
                fileName={selectedFileName}
                onCancel={closeCropDialog}
                onConfirm={confirmCrop}
            />
            <ProfileAvatarPreview
                open={previewOpen}
                imageUrl={avatar ?? null}
                name={name}
                onOpenChange={setPreviewOpen}
            />
        </>
    );
}
