import { NextResponse } from "next/server";
import { authenticationManager } from "@/auth/AuthenticationManager";
import { clearSessionCookie, readSession } from "@/lib/http";

export async function POST() {
  const auth = await readSession();
  authenticationManager.logout(auth?.session.record.id);
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}
