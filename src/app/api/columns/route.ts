import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/db";
import { customColumns } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

export const runtime = "nodejs";

export async function GET() {
  const rows = await db.select().from(customColumns).orderBy(asc(customColumns.position));
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const key = String(body.key ?? "").trim();
  const label = String(body.label ?? "").trim();
  const type = String(body.type ?? "text");
  if (!key || !label) return NextResponse.json({ error: "key+label required" }, { status: 400 });
  const [row] = await db
    .insert(customColumns)
    .values({
      key,
      label,
      type,
      options: Array.isArray(body.options) ? body.options : [],
      position: body.position ?? 0,
    })
    .returning();
  return NextResponse.json(row);
}

export async function DELETE(req: NextRequest) {
  const id = Number(req.nextUrl.searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await db.delete(customColumns).where(eq(customColumns.id, id));
  return NextResponse.json({ ok: true });
}
