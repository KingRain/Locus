import { NextResponse } from "next/server";
import { jsonError, publicUser, readSession } from "@/lib/http";

export async function GET() {
  try {
    const auth = await readSession();
    if (!auth) return NextResponse.json({ user: null, collabToken: null });
    return NextResponse.json({
      user: publicUser(auth.user),
      collabToken: auth.session.record.id,
    });
  } catch (error) {
    return jsonError(error);
  }
}
