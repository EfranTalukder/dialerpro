import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/db";
import { calls, recordings } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";

export const runtime = "nodejs";

export async function GET() {
  const rows = await db
    .select({
      call: calls,
      recordingUrl: recordings.url,
      recordingId: recordings.id,
    })
    .from(calls)
    .leftJoin(recordings, eq(recordings.callId, calls.id))
    .orderBy(desc(calls.startedAt))
    .limit(500);
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const [row] = await db
    .insert(calls)
    .values({
      telnyxCallControlId: body.telnyxCallControlId ?? null,
      telnyxLegId: body.telnyxLegId ?? null,
      direction: body.direction ?? "outbound",
      fromNumber: String(body.fromNumber ?? ""),
      toNumber: String(body.toNumber ?? ""),
      leadId: body.leadId ?? null,
      status: body.status ?? "initiated",
    })
    .returning();
  return NextResponse.json(row);
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const patch: Record<string, unknown> = {};
  for (const k of ["disposition", "notes", "leadId", "status"]) {
    if (k in body) patch[k] = body[k];
  }
  const [row] = await db.update(calls).set(patch).where(eq(calls.id, body.id)).returning();
  if (body.leadId) {
    await db.execute(sql`UPDATE leads SET last_called_at = NOW() WHERE id = ${body.leadId}`);
  }
  return NextResponse.json(row);
}
