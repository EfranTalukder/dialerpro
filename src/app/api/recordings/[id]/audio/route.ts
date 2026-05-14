import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/db";
import { recordings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { telnyx } from "@/lib/telnyx-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RecordingRetrieveData = {
  data?: {
    download_urls?: { mp3?: string; wav?: string };
  };
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const [row] = await db
    .select()
    .from(recordings)
    .where(eq(recordings.id, id))
    .limit(1);

  if (!row) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const cachedUrl = row.url ?? null;

  if (row.telnyxRecordingId) {
    try {
      const res = (await telnyx().callRecordings.retrieve(
        row.telnyxRecordingId,
      )) as unknown as RecordingRetrieveData;
      const data = res?.data;
      const fresh =
        data?.download_urls?.mp3 ??
        data?.download_urls?.wav ??
        null;
      if (fresh) {
        return NextResponse.redirect(fresh, { status: 302 });
      }
    } catch (err) {
      console.error("recordings retrieve failed", id, err);
    }
  }

  if (cachedUrl) {
    return NextResponse.redirect(cachedUrl, { status: 302 });
  }
  return NextResponse.json({ error: "no_url" }, { status: 404 });
}
