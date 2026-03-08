"use client";

import { useEffect } from "react";

export interface ToastProps {
  open: boolean;
  message: string;
  type?: "success" | "error";
  duration?: number;
  onClose: () => void;
}

export function Toast({
  open,
  message,
  type = "success",
  duration = 2000,
  onClose,
}: ToastProps) {
  useEffect(() => {
    if (!open || !message) return;
    const t = setTimeout(onClose, duration);
    return () => clearTimeout(t);
  }, [open, message, duration, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed left-1/2 top-[20%] z-[100] -translate-x-1/2 rounded-lg px-4 py-3 text-[15px] font-medium shadow-lg max-w-[calc(100vw-32px)]"
      style={{
        backgroundColor: type === "success" ? "var(--toast-success-bg, #22c55e)" : "var(--toast-error-bg, #ef4444)",
        color: type === "success" ? "var(--toast-success-fg, #fff)" : "var(--toast-error-fg, #fff)",
      }}
      role="alert"
    >
      {message}
    </div>
  );
}
