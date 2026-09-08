import { NextResponse } from "next/server";
import { requireLocalUser } from "@/auth/clerk-sync";
import type { User } from "@/auth/User";

export async function requireUser(): Promise<{ user: User; clerkUserId: string }> {
  return requireLocalUser();
}

export function jsonError(error: unknown, fallback = "Request failed"): NextResponse {
  const message = error instanceof Error ? error.message : fallback;
  const status =
    message === "Not authenticated"
      ? 401
      : message.toLowerCase().includes("access") || message.toLowerCase().includes("cannot")
        ? 403
        : 400;
  return NextResponse.json({ error: message }, { status });
}

export function publicUser(user: User) {
  return user.record;
}
