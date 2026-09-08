import { NextResponse } from "next/server";
import { authenticationManager } from "@/auth/AuthenticationManager";
import { jsonError, publicUser, setSessionCookie } from "@/lib/http";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string; password?: string };
    const { user, session } = authenticationManager.authenticate(
      body.email ?? "",
      body.password ?? "",
    );
    await setSessionCookie(session.record.id);
    return NextResponse.json({ user: publicUser(user), collabToken: session.record.id });
  } catch (error) {
    return jsonError(error);
  }
}
