import Link from "next/link";
import { PenTool } from "lucide-react";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="inline-flex items-center gap-2 text-inkwell-navy">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-inkwell-navy text-paper-white">
        <PenTool className="h-4 w-4" aria-hidden />
      </span>
      {compact ? null : <span className="text-[18px] font-semibold tracking-[-0.01em]">Locus</span>}
    </Link>
  );
}

export function Banner() {
  return (
    <div className="relative bg-butter-yellow px-4 py-3 text-center text-[14px] font-medium text-inkwell-navy">
      Shared boards for studios, classrooms, and late-night group work.{" "}
      <span className="text-coral-emphasis">Draw it once — everyone sees it.</span>
    </div>
  );
}

export function Bunny({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 88 96" className={className} aria-hidden="true">
      <path d="M22 38c0-18 6-30 12-30s8 10 8 22c0-14 6-26 13-26s12 14 12 30c8 6 13 16 13 28 0 18-14 34-37 34S8 80 8 62c0-12 5-20 14-24Z" fill="#fff" stroke="#151b31" strokeWidth="3" />
      <circle cx="34" cy="58" r="3" fill="#151b31" />
      <circle cx="52" cy="58" r="3" fill="#151b31" />
      <path d="M38 68c4 4 10 4 14 0" fill="none" stroke="#ff5858" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function Blob({ className, color }: { className: string; color: string }) {
  return <div className={`doodle-blob ${className}`} style={{ background: color }} />;
}
