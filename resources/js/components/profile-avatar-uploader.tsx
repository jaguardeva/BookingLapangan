import { router } from '@inertiajs/react';
import { useRef, useState } from 'react';
import { Camera, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AvatarCropDialog } from '@/components/avatar-crop-dialog';
import { ProfileAvatarPreview } from '@/components/profile-avatar-preview';
import { useInitials } from '@/hooks/use-initials';
import { destroy as destroyAvatar, update as updateAvatar } from '@/routes/profile/avatar';

export function ProfileAvatarUploader({ name, avatar }: { name: string; avatar?: string | null }) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
    const [selectedFileName, setSelectedFileName] = useState('avatar');
    const [previewOpen, setPreviewOpen] = useState(false);
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

    return <>
        <div className="flex items-center gap-4">
            {avatar ? (
                <button
                    type="button"
                    className="cursor-zoom-in rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    onClick={() => setPreviewOpen(true)}
                    aria-label="Lihat foto profil"
                >
                    <Avatar className="size-20">
                        <AvatarImage src={avatar} alt={name} />
                        <AvatarFallback>{initials(name)}</AvatarFallback>
                    </Avatar>
                </button>
            ) : (
                <Avatar className="size-20">
                    <AvatarFallback>{initials(name)}</AvatarFallback>
                </Avatar>
            )}
            <div className="flex flex-wrap gap-2">
                <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) upload(file); }} />
                <Button type="button" variant="outline" disabled={processing} onClick={() => inputRef.current?.click()}><Camera className="size-4" />{processing ? 'Mengunggah...' : 'Ganti foto'}</Button>
                {avatar && <Button type="button" variant="ghost" onClick={() => router.delete(destroyAvatar.url(), { preserveScroll: true })}><Trash2 className="size-4" />Hapus</Button>}
                {error && <p className="basis-full text-xs text-rose-500">{error}</p>}
            </div>
        </div>
        <AvatarCropDialog open={selectedImageUrl !== null} imageUrl={selectedImageUrl} fileName={selectedFileName} onCancel={closeCropDialog} onConfirm={confirmCrop} />
        <ProfileAvatarPreview open={previewOpen} imageUrl={avatar ?? null} name={name} onOpenChange={setPreviewOpen} />
    </>;
}
