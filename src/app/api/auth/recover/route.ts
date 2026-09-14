import { NextResponse } from "next/server";
import { AuthService } from "@/auth/auth-service";
import { jsonError } from "@/lib/http";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string; token?: string; password?: string };

    // Password Reset Execution with token
    if (body.token && body.password) {
      const result = AuthService.resetPassword(body.token, body.password);
      if (!result.success) {
        return NextResponse.json({ error: result.message }, { status: 400 });
      }
      return NextResponse.json({ message: result.message });
    }

    // Password Recovery Request
    const result = AuthService.requestPasswordRecovery(body.email ?? "");
    return NextResponse.json({
      message: result.message,
      ...(result.recoveryToken ? { recoveryToken: result.recoveryToken } : {}),
    });
  } catch (error) {
    return jsonError(error);
  }
}
