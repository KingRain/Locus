"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";
import { History, MessageSquare, Share2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export type BoardPanel = "none" | "comments" | "share" | "history";

const PANEL_META: Record<Exclude<BoardPanel, "none">, { title: string; description: string; icon: typeof Share2 }> = {
  comments: {
    title: "Comments",
    description: "Thread notes on the board without leaving the canvas.",
    icon: MessageSquare,
  },
  share: {
    title: "Share",
    description: "Invite collaborators and manage access levels.",
    icon: Share2,
  },
  history: {
    title: "History",
    description: "Named snapshots you can restore anytime.",
    icon: History,
  },
};

export function BoardSidePanel({
  panel,
  onClose,
  children,
}: {
  panel: BoardPanel;
  onClose: () => void;
  children: ReactNode;
}) {
  const open = panel !== "none";
  const meta = panel !== "none" ? PANEL_META[panel] : null;
  const Icon = meta?.icon;

  return (
    <AnimatePresence>
      {open && meta && Icon ? (
        <motion.aside
          key={panel}
          initial={{ x: 380, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 380, opacity: 0 }}
          transition={{ type: "spring", damping: 30, stiffness: 320 }}
          className={cn(
            "absolute right-3 top-[68px] bottom-3 z-30 flex w-[min(100%,380px)] flex-col overflow-hidden",
            "rounded-2xl border border-warm-stone/80 bg-paper-white/95 shadow-[0_8px_40px_rgba(21,27,49,0.12)] backdrop-blur-md",
            "dark:border-border/50 dark:bg-card/95 dark:shadow-[0_8px_40px_rgba(0,0,0,0.5)]",
          )}
        >
          <div className="flex items-start justify-between gap-3 border-b border-warm-stone/70 px-4 py-4">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ash-canvas text-inkwell-navy">
                <Icon className="h-4 w-4" strokeWidth={1.75} />
              </span>
              <div>
                <p className="text-[16px] font-semibold text-inkwell-navy">{meta.title}</p>
                <p className="mt-0.5 text-[12px] leading-relaxed text-slate">{meta.description}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close panel">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <ScrollArea className="min-h-0 flex-1">
            <div className="px-4 py-4">{children}</div>
          </ScrollArea>
        </motion.aside>
      ) : null}
    </AnimatePresence>
  );
}

export function PanelSection({
  title,
  children,
  className,
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("grid gap-3", className)}>
      {title ? (
        <>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate">{title}</p>
          <Separator className="bg-warm-stone/70" />
        </>
      ) : null}
      {children}
    </section>
  );
}
