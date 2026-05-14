import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/db";
import { leads, calls, recordings, customColumns } from "@/db/schema";
import { eq, desc, asc } from "drizzle-orm";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const [lead] = await db.select().from(leads).where(eq(leads.id, id)).limit(1);
  if (!lead) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const history = await db
    .select({
      call: calls,
      recordingUrl: recordings.url,
      recordingId: recordings.id,
    })
    .from(calls)
    .leftJoin(recordings, eq(recordings.callId, calls.id))
    .where(eq(calls.leadId, id))
    .orderBy(desc(calls.startedAt));

  const cols = await db.select().from(customColumns).orderBy(asc(customColumns.position));

  return NextResponse.json({ lead, calls: history, customColumns: cols });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json();
  const patch: Record<string, unknown> = { updatedAt: new Date() };
  for (const k of ["name", "phone", "email", "company", "status", "notes"]) {
    if (k in body) patch[k] = body[k];
  }
  if ("customFields" in body) patch.customFields = body.customFields;
  const [row] = await db.update(leads).set(patch).where(eq(leads.id, id)).returning();
  return NextResponse.json(row);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await db.delete(leads).where(eq(leads.id, id));
  return NextResponse.json({ ok: true });
}
