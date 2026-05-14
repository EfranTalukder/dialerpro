import { NextResponse } from "next/server";
import { db } from "@/db";
import { calls } from "@/db/schema";
import { and, gte, sql } from "drizzle-orm";

export const runtime = "nodejs";

export async function GET() {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const rows = await db
    .select({
      total: sql<number>`count(*)::int`,
      connected: sql<number>`sum(case when ${calls.answeredAt} is not null then 1 else 0 end)::int`,
      totalDurationSec: sql<number>`coalesce(sum(${calls.durationSec}), 0)::int`,
      interested: sql<number>`sum(case when ${calls.disposition} = 'interested' then 1 else 0 end)::int`,
      notInterested: sql<number>`sum(case when ${calls.disposition} = 'not_interested' then 1 else 0 end)::int`,
      voicemail: sql<number>`sum(case when ${calls.disposition} = 'voicemail' then 1 else 0 end)::int`,
      callback: sql<number>`sum(case when ${calls.disposition} = 'callback' then 1 else 0 end)::int`,
      noAnswer: sql<number>`sum(case when ${calls.disposition} = 'no_answer' then 1 else 0 end)::int`,
      wrongNumber: sql<number>`sum(case when ${calls.disposition} = 'wrong_number' then 1 else 0 end)::int`,
    })
    .from(calls)
    .where(and(gte(calls.startedAt, startOfDay)));

  return NextResponse.json(rows[0] ?? null);
}
