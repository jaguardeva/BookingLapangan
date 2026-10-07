import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

type ProfileAvatarPreviewProps = {
    open: boolean;
    imageUrl: string | null;
    name: string;
    onOpenChange: (open: boolean) => void;
};

export function ProfileAvatarPreview({
    open,
    imageUrl,
    name,
    onOpenChange,
}: ProfileAvatarPreviewProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[calc(100%-1rem)] max-w-2xl p-4 sm:p-6">
                <DialogHeader>
                    <DialogTitle className="text-base sm:text-lg">Foto profil</DialogTitle>
                    <DialogDescription className="text-xs sm:text-sm">
                        Foto profil {name}
                    </DialogDescription>
                </DialogHeader>
                {imageUrl && (
                    <div className="flex max-h-[72dvh] min-h-0 items-center justify-center overflow-hidden rounded-xl bg-muted/30 p-2 sm:p-4">
                        <img
                            src={imageUrl}
                            alt={`Foto profil ${name}`}
                            className="max-h-[68dvh] max-w-full object-contain"
                        />
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
