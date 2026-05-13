import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/db";
import { leads } from "@/db/schema";
import { desc, ilike, or } from "drizzle-orm";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  const rows = q
    ? await db
        .select()
        .from(leads)
        .where(
          or(
            ilike(leads.name, `%${q}%`),
            ilike(leads.phone, `%${q}%`),
            ilike(leads.company, `%${q}%`),
            ilike(leads.email, `%${q}%`),
          ),
        )
        .orderBy(desc(leads.createdAt))
        .limit(500)
    : await db.select().from(leads).orderBy(desc(leads.createdAt)).limit(500);
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const phone = String(body.phone ?? "").trim();
  if (!phone) return NextResponse.json({ error: "phone required" }, { status: 400 });
  const [row] = await db
    .insert(leads)
    .values({
      phone,
      name: body.name ?? null,
      email: body.email ?? null,
      company: body.company ?? null,
      status: body.status ?? "new",
      notes: body.notes ?? null,
      customFields: body.customFields ?? {},
    })
    .returning();
  return NextResponse.json(row);
}
