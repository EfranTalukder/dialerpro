import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET() {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const login = process.env.TELNYX_SIP_USERNAME;
  const password = process.env.TELNYX_SIP_PASSWORD;
  if (!login || !password) {
    return NextResponse.json({ error: "telnyx_creds_not_configured" }, { status: 500 });
  }
  return NextResponse.json({ login, password });
}
