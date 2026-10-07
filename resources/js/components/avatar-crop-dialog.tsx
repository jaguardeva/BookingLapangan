import { useEffect, useRef, useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const OUTPUT_SIZE = 512;
const MIN_ZOOM = 1;
const MAX_ZOOM = 3;

type Point = { x: number; y: number };

type Props = {
    open: boolean;
    imageUrl: string | null;
    fileName: string;
    onCancel: () => void;
    onConfirm: (file: File) => void;
};

export function AvatarCropDialog({ open, imageUrl, fileName, onCancel, onConfirm }: Props) {
    const stageRef = useRef<HTMLDivElement>(null);
    const viewportRef = useRef<HTMLDivElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);
    const dragRef = useRef<{ pointerId: number; point: Point } | null>(null);
    const [naturalSize, setNaturalSize] = useState<Point | null>(null);
    const [stageSize, setStageSize] = useState(300);
    const [viewportSize, setViewportSize] = useState(246);
    const [zoom, setZoom] = useState(MIN_ZOOM);
    const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        if (!open || !imageUrl) {
            dragRef.current = null;
            return;
        }

        dragRef.current = null;
        setNaturalSize(null);
        setZoom(MIN_ZOOM);
        setPan({ x: 0, y: 0 });
        setProcessing(false);
    }, [imageUrl, open]);

    useEffect(() => {
        if (!open || !stageRef.current || !viewportRef.current) return;

        const stageObserver = new ResizeObserver(([entry]) => {
            setStageSize(entry.contentRect.width);
        });
        const viewportObserver = new ResizeObserver(([entry]) => {
            setViewportSize(entry.contentRect.width);
        });

        stageObserver.observe(stageRef.current);
        viewportObserver.observe(viewportRef.current);

        return () => {
            stageObserver.disconnect();
            viewportObserver.disconnect();
        };
    }, [open]);

    const cropFrameSize = Math.max(0, Math.min(stageSize * 0.82, stageSize - 4));
    const baseScale = naturalSize
        ? viewportSize / Math.min(naturalSize.x, naturalSize.y)
        : 1;
    const renderedWidth = (naturalSize?.x ?? viewportSize) * baseScale * zoom;
    const renderedHeight = (naturalSize?.y ?? viewportSize) * baseScale * zoom;

    const getPanBounds = (imageWidth: number, imageHeight: number): Point => ({
        x: Math.max(0, (imageWidth - viewportSize) / 2),
        y: Math.max(0, (imageHeight - viewportSize) / 2),
    });

    const clampPan = (nextPan: Point, imageWidth = renderedWidth, imageHeight = renderedHeight): Point => {
        const panBounds = getPanBounds(imageWidth, imageHeight);

        return {
            x: Math.min(panBounds.x, Math.max(-panBounds.x, nextPan.x)),
            y: Math.min(panBounds.y, Math.max(-panBounds.y, nextPan.y)),
        };
    };

    useEffect(() => {
        if (!naturalSize || !viewportSize) return;

        setPan((currentPan) => clampPan(currentPan));
    }, [naturalSize, stageSize, viewportSize, zoom]);

    const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
        if (processing || !naturalSize) return;

        event.preventDefault();
        try {
            event.currentTarget.setPointerCapture(event.pointerId);
        } catch {
            dragRef.current = null;
            return;
        }

        dragRef.current = {
            pointerId: event.pointerId,
            point: { x: event.clientX, y: event.clientY },
        };
    };

    const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
        if (processing || dragRef.current?.pointerId !== event.pointerId) return;

        event.preventDefault();
        const previousPoint = dragRef.current.point;
        dragRef.current.point = { x: event.clientX, y: event.clientY };
        setPan((currentPan) => clampPan({
            x: currentPan.x + event.clientX - previousPoint.x,
            y: currentPan.y + event.clientY - previousPoint.y,
        }));
    };

    const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
        if (dragRef.current?.pointerId === event.pointerId) {
            dragRef.current = null;
        }

        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            try {
                event.currentTarget.releasePointerCapture(event.pointerId);
            } catch {
                // Pointer capture may already be released by the browser.
            }
        }
    };

    const handleLostPointerCapture = (event: React.PointerEvent<HTMLDivElement>) => {
        if (dragRef.current?.pointerId === event.pointerId) {
            dragRef.current = null;
        }
    };

    const handleZoomChange = (value: number) => {
        const nextRenderedWidth = (naturalSize?.x ?? viewportSize) * baseScale * value;
        const nextRenderedHeight = (naturalSize?.y ?? viewportSize) * baseScale * value;

        setZoom(value);
        setPan((currentPan) => clampPan(currentPan, nextRenderedWidth, nextRenderedHeight));
    };

    const handleConfirm = () => {
        const image = imageRef.current;
        if (!image || !naturalSize || !viewportSize) return;

        setProcessing(true);
        const sourceSize = Math.min(
            viewportSize / (baseScale * zoom),
            naturalSize.x,
            naturalSize.y,
        );
        const unclampedSourceX = naturalSize.x / 2 - pan.x / (baseScale * zoom) - sourceSize / 2;
        const unclampedSourceY = naturalSize.y / 2 - pan.y / (baseScale * zoom) - sourceSize / 2;
        const sourceX = Math.min(naturalSize.x - sourceSize, Math.max(0, unclampedSourceX));
        const sourceY = Math.min(naturalSize.y - sourceSize, Math.max(0, unclampedSourceY));
        const canvas = document.createElement('canvas');
        canvas.width = OUTPUT_SIZE;
        canvas.height = OUTPUT_SIZE;
        const context = canvas.getContext('2d');
        if (!context) {
            setProcessing(false);
            return;
        }

        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
        context.drawImage(
            image,
            sourceX,
            sourceY,
            sourceSize,
            sourceSize,
            0,
            0,
            OUTPUT_SIZE,
            OUTPUT_SIZE,
        );

        const finish = (blob: Blob | null) => {
            if (!blob) {
                setProcessing(false);
                return;
            }

            const extension = blob.type === 'image/webp' ? 'webp' : 'jpg';
            onConfirm(new File([blob], `${fileName.replace(/\.[^.]+$/, '')}.${extension}`, { type: blob.type }));
            setProcessing(false);
        };

        canvas.toBlob((blob) => {
            if (blob?.type === 'image/webp') {
                finish(blob);
                return;
            }

            canvas.toBlob(finish, 'image/jpeg', 0.84);
        }, 'image/webp', 0.82);
    };

    return (
        <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && !processing && onCancel()}>
            <DialogContent className="w-[calc(100%-1rem)] max-h-[92dvh] overflow-y-auto rounded-2xl p-4 sm:max-w-md sm:p-6">
                <DialogHeader>
                    <DialogTitle className="pr-8 text-base sm:text-lg">Atur foto profil</DialogTitle>
                    <DialogDescription className="text-xs sm:text-sm">
                        Geser foto untuk mengatur posisi, lalu gunakan zoom jika diperlukan.
                    </DialogDescription>
                </DialogHeader>

                <div className="min-w-0 space-y-4 sm:space-y-5">
                    <div
                        ref={stageRef}
                        className="relative mx-auto aspect-square w-[min(82vw,340px,45dvh)] max-w-full cursor-grab touch-none select-none overflow-hidden rounded-2xl border border-border/70 bg-white shadow-inner active:cursor-grabbing sm:w-[min(86vw,340px)] sm:rounded-3xl"
                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        onPointerCancel={handlePointerUp}
                        onLostPointerCapture={handleLostPointerCapture}
                    >
                        {imageUrl && (
                            <img
                                ref={imageRef}
                                src={imageUrl}
                                alt="Pratinjau crop foto profil"
                                draggable={false}
                                onLoad={(event) => setNaturalSize({ x: event.currentTarget.naturalWidth, y: event.currentTarget.naturalHeight })}
                                className="pointer-events-none absolute left-1/2 top-1/2 max-w-none select-none"
                                style={{
                                    width: renderedWidth,
                                    height: renderedHeight,
                                    transform: `translate(calc(-50% + ${pan.x}px), calc(-50% + ${pan.y}px))`,
                                }}
                            />
                        )}

                        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-[9%] bg-black/55" />
                        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[9%] bg-black/55" />
                        <div className="pointer-events-none absolute inset-y-[9%] left-0 z-10 w-[9%] bg-black/55" />
                        <div className="pointer-events-none absolute inset-y-[9%] right-0 z-10 w-[9%] bg-black/55" />

                        <div
                            ref={viewportRef}
                            className="pointer-events-none absolute left-1/2 top-1/2 z-20 border-2 border-white/90 shadow-[0_0_0_1px_rgba(255,255,255,0.25),0_0_32px_rgba(0,0,0,0.18)]"
                            style={{
                                width: cropFrameSize,
                                height: cropFrameSize,
                                transform: 'translate(-50%, -50%)',
                            }}
                        >
                            <span className="absolute inset-y-0 left-1/3 border-l border-white/60" />
                            <span className="absolute inset-y-0 left-2/3 border-l border-white/60" />
                            <span className="absolute inset-x-0 top-1/3 border-t border-white/60" />
                            <span className="absolute inset-x-0 top-2/3 border-t border-white/60" />
                        </div>
                    </div>

                    <label className="block min-w-0 space-y-2 text-xs sm:text-sm">
                        <span className="flex items-center justify-between gap-3 font-medium">
                            <span>Zoom</span>
                            <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground sm:text-xs">{zoom.toFixed(1)}x</span>
                        </span>
                        <div className="flex min-w-0 items-center gap-2 rounded-xl border border-border/70 bg-muted/30 px-2 py-2 sm:gap-3 sm:px-3">
                            <button type="button" className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50 sm:size-8" disabled={zoom <= MIN_ZOOM} onClick={() => handleZoomChange(Math.max(MIN_ZOOM, Number((zoom - 0.1).toFixed(1))))} aria-label="Perkecil foto"><Minus className="size-3.5" /></button>
                            <input
                                type="range"
                                min={MIN_ZOOM}
                                max={MAX_ZOOM}
                                step="0.1"
                                value={zoom}
                                aria-label="Zoom foto profil"
                                onChange={(event) => handleZoomChange(Number(event.target.value))}
                                className="w-full accent-primary"
                            />
                            <button type="button" className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50 sm:size-8" disabled={zoom >= MAX_ZOOM} onClick={() => handleZoomChange(Math.min(MAX_ZOOM, Number((zoom + 0.1).toFixed(1))))} aria-label="Perbesar foto"><Plus className="size-3.5" /></button>
                        </div>
                    </label>
                </div>

                <DialogFooter className="sm:gap-2">
                    <Button className="w-full sm:w-auto" type="button" variant="outline" disabled={processing} onClick={onCancel}>Batal</Button>
                    <Button className="w-full sm:w-auto" type="button" disabled={processing || !naturalSize} onClick={handleConfirm}>
                        {processing ? 'Menyiapkan...' : 'Gunakan foto'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
