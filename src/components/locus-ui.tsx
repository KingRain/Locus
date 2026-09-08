import type { ComponentProps, InputHTMLAttributes, ReactNode } from "react";
import Link from "next/link";
import { Button as ShadButton } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type LocusButtonVariant = "primary" | "ghost" | "inverse" | "danger";

const variantMap: Record<LocusButtonVariant, "default" | "outline" | "secondary" | "destructive"> = {
  primary: "default",
  ghost: "outline",
  inverse: "secondary",
  danger: "destructive",
};

export function Button({
  children,
  variant = "primary",
  className,
  href,
  size = "lg",
  ...props
}: Omit<ComponentProps<typeof ShadButton>, "variant"> & {
  variant?: LocusButtonVariant;
  href?: string;
}) {
  const mapped = variantMap[variant];
  if (href) {
    return (
      <ShadButton asChild variant={mapped} size={size} className={cn("rounded-lg", className)}>
        <Link href={href}>{children}</Link>
      </ShadButton>
    );
  }
  return (
    <ShadButton variant={mapped} size={size} className={cn("rounded-lg", className)} {...props}>
      {children}
    </ShadButton>
  );
}

export function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint ? <p className="text-[12px] text-muted-foreground">{hint}</p> : null}
      <p className="field-error" id={`${id}-error`}>
        <span aria-hidden="true">×</span> {error ?? "This field is required."}
      </p>
    </div>
  );
}

export function TextInput({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <Input className={cn("h-10 rounded-lg bg-paper-white", className)} {...props} />;
}
