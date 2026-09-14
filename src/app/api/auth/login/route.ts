import { NextResponse } from "next/server";
import { AuthService } from "@/auth/auth-service";
import { jsonError } from "@/lib/http";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string; password?: string };
    const result = AuthService.login(body.email ?? "", body.password ?? "");

    if (!result.success || !result.session) {
      return NextResponse.json({ error: result.message }, { status: 401 });
    }

    const response = NextResponse.json({
      message: result.message,
      user: result.user,
    });

    response.cookies.set("locus_session", result.session.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error) {
    return jsonError(error);
  }
}
