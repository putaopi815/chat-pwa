"use client";

import { Button } from "@/components/ui/button";

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = "取消",
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/40"
        aria-hidden
        onClick={onCancel}
      />
      <div className="fixed left-1/2 top-1/2 z-50 w-[318px] -translate-x-1/2 -translate-y-1/2 rounded-[var(--radius-lg)] bg-surface p-[18px] shadow-lg">
        <h3 className="text-[18px] font-semibold text-foreground">{title}</h3>
        <p className="mt-2.5 w-full text-[14px] font-normal text-muted-foreground">
          {description}
        </p>
        <div className="mt-2.5 flex h-11 gap-2.5">
          <Button
            type="button"
            variant="secondary"
            className="flex-1"
            onClick={onCancel}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={danger ? "destructive" : "default"}
            className="flex-1"
            onClick={() => {
              onConfirm();
              onCancel();
            }}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </>
  );
}
