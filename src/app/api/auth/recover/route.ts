import { NextResponse } from "next/server";
import { recoveryManager } from "@/auth/RecoveryManager";
import { jsonError } from "@/lib/http";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string; token?: string; password?: string };
    if (body.token && body.password) {
      return NextResponse.json(recoveryManager.reset(body.token, body.password));
    }
    return NextResponse.json(recoveryManager.request(body.email ?? ""));
  } catch (error) {
    return jsonError(error);
  }
}
