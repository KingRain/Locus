"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Banner, Logo } from "@/components/brand";
import { Button, Field, TextInput } from "@/components/locus-ui";

const TOKEN_KEY = "locus_collab_token";

export function persistCollabToken(token: string | null) {
  if (token) sessionStorage.setItem(TOKEN_KEY, token);
  else sessionStorage.removeItem(TOKEN_KEY);
}

export function readCollabToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function AuthShell({
  title,
  accent,
  children,
  footer,
}: {
  title: string;
  accent: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <Banner />
      <header className="mx-auto flex max-w-[1200px] items-center justify-between px-6 py-5">
        <Logo />
        <Button href="/login" variant="ghost" className="py-2">Log in</Button>
      </header>
      <main className="mx-auto grid max-w-[480px] gap-6 px-6 pb-20 pt-8">
        <h1 className="font-display text-[32px] leading-[1.2] tracking-tight text-inkwell-navy sm:text-[40px]">
          {title.split(accent)[0]}
          <span className="text-coral-emphasis">{accent}</span>
          {title.split(accent)[1]}
        </h1>
        <div className="rounded-2xl border border-warm-stone/80 bg-card p-5 shadow-[var(--shadow-stone)] ring-1 ring-foreground/6">{children}</div>
        <p className="text-center text-[14px] text-slate">{footer}</p>
      </main>
    </div>
  );
}

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);
    const form = new FormData(event.currentTarget);
    try {
      const result = await api<{ collabToken: string }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: String(form.get("email") ?? ""),
          password: String(form.get("password") ?? ""),
        }),
      });
      persistCollabToken(result.collabToken);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in. Check your details and try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="grid gap-4" onSubmit={onSubmit} noValidate>
      <Field id="email" label="Email" error="Enter a valid email.">
        <TextInput id="email" name="email" type="email" autoComplete="username" required enterKeyHint="next" />
      </Field>
      <Field id="current-password" label="Password">
        <TextInput
          id="current-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          minLength={8}
          enterKeyHint="done"
        />
      </Field>
      {error ? (
        <p className="rounded-lg bg-ash-canvas px-3 py-2 text-[14px] text-inkwell-navy" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
      <Link href="/recover" className="text-center text-[14px] font-medium text-coral-emphasis">
        Forgot password?
      </Link>
    </form>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);
    const form = new FormData(event.currentTarget);
    try {
      const result = await api<{ collabToken: string }>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name: String(form.get("name") ?? ""),
          email: String(form.get("email") ?? ""),
          password: String(form.get("new-password") ?? ""),
        }),
      });
      persistCollabToken(result.collabToken);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create this account. Try a different email or sign in.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="grid gap-4" onSubmit={onSubmit} noValidate>
      <Field id="name" label="Name">
        <TextInput id="name" name="name" autoComplete="name" required enterKeyHint="next" />
      </Field>
      <Field id="email" label="Email" error="Enter a valid email.">
        <TextInput id="email" name="email" type="email" autoComplete="username" required enterKeyHint="next" />
      </Field>
      <Field id="new-password" label="Password" hint="At least 8 characters. A password manager can suggest one.">
        <div className="relative">
          <TextInput
            id="new-password"
            name="new-password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            required
            minLength={8}
            enterKeyHint="done"
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] font-medium text-slate"
            onClick={() => setShowPassword((value) => !value)}
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
      </Field>
      {error ? (
        <p className="rounded-lg bg-ash-canvas px-3 py-2 text-[14px] text-inkwell-navy" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}

export function RecoverForm() {
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [mode, setMode] = useState<"request" | "reset">("request");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const form = new FormData(event.currentTarget);
    try {
      const result = await api<{ message?: string; ok?: boolean }>("/api/auth/recover", {
        method: "POST",
        body: JSON.stringify(
          mode === "reset"
            ? {
                token: String(form.get("token") ?? ""),
                password: String(form.get("new-password") ?? ""),
              }
            : { email: String(form.get("email") ?? "") },
        ),
      });
      setMessage(result.ok ? "Password updated. You can sign in now." : (result.message ?? ""));
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unable to continue.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="grid gap-4" onSubmit={onSubmit}>
      {mode === "request" ? (
        <Field id="email" label="Email">
          <TextInput id="email" name="email" type="email" autoComplete="username" required />
        </Field>
      ) : (
        <>
          <Field id="token" label="Recovery token">
            <TextInput id="token" name="token" required />
          </Field>
          <Field id="new-password" label="New password">
            <TextInput id="new-password" name="new-password" type="password" autoComplete="new-password" required minLength={8} />
          </Field>
        </>
      )}
      {message ? (
        <p className="rounded-lg bg-mint-pulse/40 px-3 py-2 text-[14px]" role="status">
          {message}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {mode === "request" ? "Send recovery link" : "Set new password"}
      </Button>
      <button
        type="button"
        className="text-[14px] font-medium text-coral-emphasis"
        onClick={() => setMode((value) => (value === "request" ? "reset" : "request"))}
      >
        {mode === "request" ? "I already have a recovery token" : "Request a new link instead"}
      </button>
    </form>
  );
}
