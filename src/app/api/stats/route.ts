import { NextResponse } from "next/server";
import { db } from "@/db";
import { calls } from "@/db/schema";
import { sql, desc, gte, and, eq } from "drizzle-orm";

export const runtime = "nodejs";

function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export async function GET() {
  const now = new Date();
  const today = startOfDay(now);
  const week = new Date(today);
  week.setDate(week.getDate() - 6);
  const month = new Date(today);
  month.setDate(month.getDate() - 29);

  const counts = await db
    .select({
      total: sql<number>`count(*)::int`,
      durationSum: sql<number>`coalesce(sum(${calls.durationSec}), 0)::int`,
      answered: sql<number>`count(*) filter (where ${calls.status} = 'answered' or ${calls.answeredAt} is not null)::int`,
      since: sql<string>`min(${calls.startedAt})`,
    })
    .from(calls)
    .where(gte(calls.startedAt, week));

  const todayRow = (
    await db
      .select({
        total: sql<number>`count(*)::int`,
        durationSum: sql<number>`coalesce(sum(${calls.durationSec}), 0)::int`,
        answered: sql<number>`count(*) filter (where ${calls.answeredAt} is not null)::int`,
      })
      .from(calls)
      .where(gte(calls.startedAt, today))
  )[0];

  const weekRow = counts[0];

  const monthRow = (
    await db
      .select({
        total: sql<number>`count(*)::int`,
        durationSum: sql<number>`coalesce(sum(${calls.durationSec}), 0)::int`,
        answered: sql<number>`count(*) filter (where ${calls.answeredAt} is not null)::int`,
      })
      .from(calls)
      .where(gte(calls.startedAt, month))
  )[0];

  const dispositions = await db
    .select({
      disposition: calls.disposition,
      count: sql<number>`count(*)::int`,
    })
    .from(calls)
    .where(and(gte(calls.startedAt, week), sql`${calls.disposition} is not null`))
    .groupBy(calls.disposition)
    .orderBy(desc(sql`count(*)`));

  const byNumber = await db
    .select({
      fromNumber: calls.fromNumber,
      count: sql<number>`count(*)::int`,
      totalDuration: sql<number>`coalesce(sum(${calls.durationSec}), 0)::int`,
    })
    .from(calls)
    .where(and(gte(calls.startedAt, week), eq(calls.direction, "outbound")))
    .groupBy(calls.fromNumber)
    .orderBy(desc(sql`count(*)`))
    .limit(5);

  const dailyTrend = await db
    .select({
      day: sql<string>`to_char(${calls.startedAt}, 'YYYY-MM-DD')`,
      count: sql<number>`count(*)::int`,
      answered: sql<number>`count(*) filter (where ${calls.answeredAt} is not null)::int`,
    })
    .from(calls)
    .where(gte(calls.startedAt, week))
    .groupBy(sql`to_char(${calls.startedAt}, 'YYYY-MM-DD')`)
    .orderBy(sql`to_char(${calls.startedAt}, 'YYYY-MM-DD')`);

  return NextResponse.json({
    today: todayRow,
    week: weekRow,
    month: monthRow,
    dispositions,
    byNumber,
    dailyTrend,
  });
}
