import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/db";
import { calls, recordings } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { TelnyxWebhookPayload } from "@/lib/telnyx-server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as TelnyxWebhookPayload;
  const evt = body?.data;
  if (!evt) return NextResponse.json({ ok: true });

  const p = evt.payload ?? {};
  const callControlId = p.call_control_id;
  const legId = p.call_leg_id;

  try {
    switch (evt.event_type) {
      case "call.initiated": {
        if (!callControlId) break;
        const existing = await db
          .select()
          .from(calls)
          .where(eq(calls.telnyxCallControlId, callControlId))
          .limit(1);
        if (existing.length === 0) {
          await db.insert(calls).values({
            telnyxCallControlId: callControlId,
            telnyxLegId: legId ?? null,
            direction: p.direction === "incoming" ? "inbound" : "outbound",
            fromNumber: String(p.from ?? ""),
            toNumber: String(p.to ?? ""),
            status: "initiated",
          });
        }
        break;
      }

      case "call.answered": {
        if (!callControlId) break;
        await db
          .update(calls)
          .set({ status: "answered", answeredAt: new Date() })
          .where(eq(calls.telnyxCallControlId, callControlId));
        break;
      }

      case "call.hangup": {
        if (!callControlId) break;
        const ended = new Date();
        const row = (
          await db
            .select()
            .from(calls)
            .where(eq(calls.telnyxCallControlId, callControlId))
            .limit(1)
        )[0];
        const duration = row?.answeredAt
          ? Math.max(0, Math.round((ended.getTime() - row.answeredAt.getTime()) / 1000))
          : 0;
        await db
          .update(calls)
          .set({ status: "ended", endedAt: ended, durationSec: duration })
          .where(eq(calls.telnyxCallControlId, callControlId));
        break;
      }

      case "call.recording.saved": {
        if (!callControlId) break;
        const call = (
          await db
            .select()
            .from(calls)
            .where(eq(calls.telnyxCallControlId, callControlId))
            .limit(1)
        )[0];
        if (!call) break;
        await db.insert(recordings).values({
          callId: call.id,
          telnyxRecordingId: p.recording_id ?? null,
          url: p.recording_urls?.mp3 ?? p.recording_urls?.wav ?? null,
          durationSec: p.duration_sec ?? null,
          format: p.recording_urls?.mp3 ? "mp3" : "wav",
        });
        break;
      }
    }
  } catch (err) {
    console.error("telnyx webhook error", evt.event_type, err);
  }

  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json({ ok: true, info: "Telnyx webhook endpoint" });
}
