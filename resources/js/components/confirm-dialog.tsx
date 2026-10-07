import * as React from "react";

import { AlertTriangle, Check, HelpCircle, Trash2, X, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string; // default "Ya, Lanjutkan"
  cancelLabel?: string; // default "Batal"
  variant?: "destructive" | "default"; // controls confirm button style
  icon?: LucideIcon; // custom icon override
  onConfirm: () => void;
};

export default function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Ya, Lanjutkan",
  cancelLabel = "Batal",
  variant = "default",
  icon,
  onConfirm,
}: ConfirmDialogProps) {
  const isDestructive = variant === "destructive";
  const Icon = icon ?? (isDestructive ? AlertTriangle : HelpCircle);
  const ConfirmIcon = isDestructive ? Trash2 : Check;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-h-[min(90dvh,32rem)] overscroll-contain sm:max-w-md">
        <AlertDialogHeader>
          <div className="flex items-start gap-3">
            <div
              className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl ${
                isDestructive
                  ? "bg-destructive/10 text-destructive"
                  : "bg-primary/10 text-primary"
              }`}
            >
              <Icon className="size-5" />
            </div>
            <div className="flex flex-col gap-1">
              <AlertDialogTitle className="text-base">{title}</AlertDialogTitle>
              <AlertDialogDescription className="text-xs">
                {description}
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button variant="outline" className="w-full rounded-xl sm:w-auto">
              <X className="size-4" />
              {cancelLabel}
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              variant={isDestructive ? "destructive" : "default"}
              className="w-full rounded-xl font-bold sm:w-auto"
              onClick={onConfirm}
            >
              <ConfirmIcon className="size-4" />
              {confirmLabel}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
