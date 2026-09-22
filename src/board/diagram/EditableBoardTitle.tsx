"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Pencil, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function EditableBoardTitle({
  title,
  canEdit,
  onSave,
}: {
  title: string;
  canEdit: boolean;
  onSave: (nextTitle: string) => Promise<void>;
}) {
  const [value, setValue] = useState(title);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync state only if not editing and the external title changed
  if (!editing && value !== title) {
    setValue(title);
  }

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  async function commit() {
    const next = value.trim();
    if (!next) {
      setValue(title);
      setEditing(false);
      return;
    }
    if (next === title) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await onSave(next);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  if (!canEdit) {
    return <p className="max-w-[min(50vw,420px)] truncate text-[18px] font-semibold text-inkwell-navy dark:text-foreground">{title}</p>;
  }

  if (!editing) {
    return (
      <button
        type="button"
        className="group inline-flex max-w-[min(50vw,420px)] items-center gap-2 rounded-lg border border-transparent px-2 py-1 text-left transition hover:border-warm-stone hover:bg-ash-canvas/60 dark:hover:border-border dark:hover:bg-muted/50"
        onClick={() => setEditing(true)}
        aria-label="Edit board name"
      >
        <span className="truncate text-[18px] font-semibold text-inkwell-navy dark:text-foreground">{title}</span>
        <Pencil className="h-3.5 w-3.5 shrink-0 text-slate opacity-0 transition group-hover:opacity-100 dark:text-muted-foreground" aria-hidden />
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <Input
        ref={inputRef}
        value={value}
        disabled={saving}
        aria-label="Board name"
        className={cn(
          "h-9 w-[min(50vw,320px)] rounded-lg border-warm-stone bg-paper-white text-[16px] font-semibold select-text dark:border-border dark:bg-card dark:text-foreground",
          "focus-visible:border-inkwell-navy focus-visible:ring-inkwell-navy/20 dark:focus-visible:border-ring",
        )}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") void commit();
          if (event.key === "Escape") {
            setValue(title);
            setEditing(false);
          }
        }}
      />
      <button
        type="button"
        className="grid h-8 w-8 place-items-center rounded-lg text-inkwell-navy transition hover:bg-mint-pulse/30 dark:text-foreground dark:hover:bg-accent/40"
        disabled={saving}
        aria-label="Save board name"
        onClick={() => void commit()}
      >
        <Check className="h-4 w-4" />
      </button>
      <button
        type="button"
        className="grid h-8 w-8 place-items-center rounded-lg text-slate transition hover:bg-ash-canvas dark:text-muted-foreground dark:hover:bg-muted"
        disabled={saving}
        aria-label="Cancel rename"
        onClick={() => {
          setValue(title);
          setEditing(false);
        }}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
