"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Menu,
  History,
  Sun,
  Moon,
  Download,
  LayoutDashboard,
  Trash2,
  X,
} from "lucide-react";
import { useTheme } from "@/components/theme-provider";

export interface HamburgerMenuProps {
  onOpenHistory?: () => void;
  onOpenExport: () => void;
  onDeleteBoard: () => void;
}

export function HamburgerMenu({
  onOpenHistory,
  onOpenExport,
  onDeleteBoard,
}: HamburgerMenuProps) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      window.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      window.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        title="Main Menu"
        aria-label="Main Menu"
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-10 w-10 items-center justify-center rounded-md text-inkwell-navy transition hover:bg-ash-canvas dark:text-foreground outline-none focus:outline-none focus-visible:outline-none focus:ring-0 border-0 shadow-none"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {open ? (
        <div className="absolute right-0 top-12 z-50 min-w-[210px] rounded-2xl border border-warm-stone bg-paper-white/95 p-2 shadow-[0_16px_48px_rgba(21,27,49,0.2)] backdrop-blur-md dark:border-border dark:bg-card animate-in fade-in zoom-in-95 duration-100">
          {onOpenHistory && (
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13.5px] font-medium text-inkwell-navy transition hover:bg-ash-canvas dark:text-foreground outline-none focus:outline-none"
              onClick={() => {
                setOpen(false);
                onOpenHistory();
              }}
            >
              <History className="h-4 w-4 text-slate" />
              Version History
            </button>
          )}

          <button
            type="button"
            className="flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-[13.5px] font-medium text-inkwell-navy transition hover:bg-ash-canvas dark:text-foreground"
            onClick={() => {
              setTheme(theme === "dark" ? "light" : "dark");
            }}
          >
            <span className="flex items-center gap-3">
              {theme === "dark" ? <Sun className="h-4 w-4 text-butter-yellow" /> : <Moon className="h-4 w-4 text-inkwell-navy" />}
              Theme
            </span>
            <span className="text-[11px] font-semibold text-slate uppercase">
              {theme === "dark" ? "Dark" : "Light"}
            </span>
          </button>

          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13.5px] font-medium text-inkwell-navy transition hover:bg-ash-canvas dark:text-foreground"
            onClick={() => {
              setOpen(false);
              onOpenExport();
            }}
          >
            <Download className="h-4 w-4 text-slate" />
            Export Board
          </button>

          <div className="my-1.5 h-px bg-warm-stone/60 dark:bg-border/60" />

          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13.5px] font-medium text-inkwell-navy transition hover:bg-ash-canvas dark:text-foreground"
            onClick={() => {
              setOpen(false);
              router.push("/dashboard");
            }}
          >
            <LayoutDashboard className="h-4 w-4 text-mint-pulse" />
            Back to Dashboard
          </button>

          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13.5px] font-medium text-coral-emphasis transition hover:bg-coral-emphasis/10"
            onClick={() => {
              setOpen(false);
              onDeleteBoard();
            }}
          >
            <Trash2 className="h-4 w-4" />
            Delete Board
          </button>
        </div>
      ) : null}
    </div>
  );
}
