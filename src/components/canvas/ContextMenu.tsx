"use client";

import { useEffect, useRef } from "react";
import {
  MessageSquarePlus,
  Layers,
  ArrowUp,
  ArrowDown,
  Copy,
  Trash2,
} from "lucide-react";

export interface ContextMenuProps {
  x: number;
  y: number;
  targetId: string | null;
  selectedCount: number;
  onAddComment: (elementId: string) => void;
  onGroupToggle?: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onClose: () => void;
}

export function ContextMenu({
  x,
  y,
  targetId,
  selectedCount,
  onAddComment,
  onGroupToggle,
  onBringToFront,
  onSendToBack,
  onDuplicate,
  onDelete,
  onClose,
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className="fixed z-50 min-w-[190px] rounded-xl border border-warm-stone bg-paper-white/95 p-1.5 shadow-[0_8px_24px_rgba(21,27,49,0.18)] backdrop-blur-md dark:border-border dark:bg-card animate-in fade-in zoom-in-95 duration-100"
      style={{ left: x, top: y }}
      role="menu"
    >
      <button
        type="button"
        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-inkwell-navy transition hover:bg-ash-canvas dark:text-foreground"
        onClick={() => {
          onAddComment(targetId ?? "");
          onClose();
        }}
      >
        <MessageSquarePlus className="h-4 w-4 text-coral-emphasis" />
        Add comment
      </button>

      {selectedCount > 1 && onGroupToggle ? (
        <button
          type="button"
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-inkwell-navy transition hover:bg-ash-canvas dark:text-foreground"
          onClick={() => {
            onGroupToggle();
            onClose();
          }}
        >
          <Layers className="h-4 w-4 text-mint-pulse" />
          Group selection
        </button>
      ) : null}

      <div className="my-1 h-px bg-warm-stone/60 dark:bg-border/60" />

      <button
        type="button"
        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-inkwell-navy transition hover:bg-ash-canvas dark:text-foreground"
        onClick={() => {
          onBringToFront();
          onClose();
        }}
      >
        <ArrowUp className="h-4 w-4 text-slate" />
        Bring to front
      </button>

      <button
        type="button"
        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-inkwell-navy transition hover:bg-ash-canvas dark:text-foreground"
        onClick={() => {
          onSendToBack();
          onClose();
        }}
      >
        <ArrowDown className="h-4 w-4 text-slate" />
        Send to back
      </button>

      <button
        type="button"
        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-inkwell-navy transition hover:bg-ash-canvas dark:text-foreground"
        onClick={() => {
          onDuplicate();
          onClose();
        }}
      >
        <Copy className="h-4 w-4 text-slate" />
        Duplicate
      </button>

      <div className="my-1 h-px bg-warm-stone/60 dark:bg-border/60" />

      <button
        type="button"
        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-coral-emphasis transition hover:bg-coral-emphasis/10"
        onClick={() => {
          onDelete();
          onClose();
        }}
      >
        <Trash2 className="h-4 w-4" />
        Delete
      </button>
    </div>
  );
}
