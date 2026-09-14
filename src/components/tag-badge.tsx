import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type TagTone = "mint" | "butter" | "coral" | "navy" | "ash" | "outline";

const toneStyles: Record<TagTone, string> = {
  mint: "border-mint-pulse/40 bg-mint-pulse/20 text-inkwell-navy hover:bg-mint-pulse/30",
  butter: "border-butter-yellow/50 bg-butter-yellow/30 text-inkwell-navy hover:bg-butter-yellow/40",
  coral: "border-coral-emphasis/30 bg-coral-emphasis/10 text-coral-emphasis hover:bg-coral-emphasis/15",
  navy: "border-inkwell-navy/20 bg-inkwell-navy text-paper-white hover:bg-inkwell-navy/90",
  ash: "border-warm-stone bg-ash-canvas text-slate hover:bg-warm-stone/60",
  outline: "border-warm-stone bg-paper-white text-inkwell-navy hover:bg-ash-canvas",
};

export function TagBadge({
  children,
  tone = "mint",
  className,
}: {
  children: ReactNode;
  tone?: TagTone;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "h-6 rounded-full px-2.5 text-[11px] font-semibold uppercase tracking-wide shadow-none",
        toneStyles[tone],
        className,
      )}
    >
      {children}
    </Badge>
  );
}

export function RoleBadge({ role }: { role: string }) {
  const normalized = role.toLowerCase();
  const tone: TagTone =
    normalized === "owner" ? "navy" : normalized === "editor" ? "mint" : "ash";
  return (
    <TagBadge tone={tone} className="h-5 px-2 text-[9.5px] font-bold tracking-wide uppercase shrink-0 rounded-md">
      {role}
    </TagBadge>
  );
}

export function TemplateTag({ kind, label }: { kind: string; label?: string }) {
  const toneMap: Record<string, TagTone> = {
    uml: "coral",
    flowchart: "mint",
    er: "butter",
    architecture: "outline",
  };
  return <TagBadge tone={toneMap[kind] ?? "mint"}>{label ?? kind}</TagBadge>;
}
