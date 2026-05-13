import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/db";
import { numbers } from "@/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

export async function GET() {
  const all = await db.select().from(numbers).orderBy(numbers.id);
  return NextResponse.json(all);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const e164 = String(body.e164 ?? "").trim();
  const label = body.label ? String(body.label) : null;
  if (!e164.startsWith("+")) {
    return NextResponse.json({ error: "e164 must start with +" }, { status: 400 });
  }
  const [row] = await db
    .insert(numbers)
    .values({ e164, label })
    .onConflictDoUpdate({
      target: numbers.e164,
      set: { label, active: true },
    })
    .returning();
  return NextResponse.json(row);
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await db.delete(numbers).where(eq(numbers.id, id));
  return NextResponse.json({ ok: true });
}
