import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { authenticationManager } from "@/auth/AuthenticationManager";
import type { User } from "@/auth/User";
import type { Session } from "@/auth/Session";

const COOKIE = "locus_session";

export async function readSession(): Promise<{ user: User; session: Session } | null> {
  const store = await cookies();
  return authenticationManager.sessionFromToken(store.get(COOKIE)?.value);
}

export async function requireUser(): Promise<{ user: User; session: Session }> {
  const auth = await readSession();
  if (!auth) throw new Error("Not authenticated");
  return auth;
}

export async function setSessionCookie(sessionId: string): Promise<void> {
  const store = await cookies();
  store.set(COOKIE, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE);
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
