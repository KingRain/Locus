"use client";

import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/locus-ui";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "primary";
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  isOpen,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-inkwell-navy/40 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <Card className="w-full max-w-md border-warm-stone bg-paper-white shadow-[0_16px_48px_rgba(21,27,49,0.2)] ring-1 ring-foreground/10 rounded-2xl dark:border-border dark:bg-card">
        <CardHeader className="relative flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-2.5 text-inkwell-navy dark:text-foreground">
            {variant === "danger" ? (
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-coral-emphasis/15 text-coral-emphasis">
                <AlertTriangle className="h-5 w-5" />
              </span>
            ) : null}
            <CardTitle className="text-[18px] font-semibold">{title}</CardTitle>
          </div>
          <button
            type="button"
            className="rounded-lg p-1 text-slate transition hover:bg-ash-canvas hover:text-inkwell-navy"
            onClick={onCancel}
          >
            <X className="h-4 w-4" />
          </button>
        </CardHeader>
        <CardContent className="grid gap-5 pt-2">
          <p className="text-[14px] leading-relaxed text-slate">{description}</p>
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={onCancel} className="h-9 px-4 text-[13px]">
              {cancelLabel}
            </Button>
            <Button
              variant={variant === "danger" ? "danger" : "primary"}
              onClick={onConfirm}
              className="h-9 px-4 text-[13px]"
            >
              {confirmLabel}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
