import { NextResponse } from "next/server";
import { AuthService } from "@/auth/auth-service";
import { jsonError } from "@/lib/http";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string; name?: string; password?: string };
    const result = AuthService.register(body.email ?? "", body.name ?? "", body.password ?? "");
    
    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json({
      message: result.message,
      user: result.user,
    });
  } catch (error) {
    return jsonError(error);
  }
}
