import { NextResponse } from "next/server";
import { Template } from "@/board/templates/Template";
import { jsonError, requireUser } from "@/lib/http";

export async function GET() {
  try {
    await requireUser();
    return NextResponse.json({ templates: Template.list() });
  } catch (error) {
    return jsonError(error);
  }
}
