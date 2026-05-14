import { NextResponse } from "next/server";
import { db } from "@/db";
import { leads } from "@/db/schema";
import { and, asc, isNotNull, isNull } from "drizzle-orm";

export const runtime = "nodejs";

export async function GET() {
  const rows = await db
    .select()
    .from(leads)
    .where(and(isNotNull(leads.callbackAt), isNull(leads.callbackDoneAt)))
    .orderBy(asc(leads.callbackAt));
  return NextResponse.json(rows);
}
