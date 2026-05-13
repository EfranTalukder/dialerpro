import { NextResponse, type NextRequest } from "next/server";
import Papa from "papaparse";
import { db } from "@/db";
import { leads } from "@/db/schema";

export const runtime = "nodejs";

type Row = Record<string, string>;

export async function POST(req: NextRequest) {
  const text = await req.text();
  const parsed = Papa.parse<Row>(text, { header: true, skipEmptyLines: true });
  if (parsed.errors.length) {
    return NextResponse.json({ error: "csv_parse_error", details: parsed.errors }, { status: 400 });
  }

  const known = new Set(["name", "phone", "email", "company", "status", "notes"]);
  const values = parsed.data
    .map((r) => {
      const phone = (r.phone ?? r.Phone ?? r.PHONE ?? "").toString().trim();
      if (!phone) return null;
      const customFields: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(r)) {
        const lk = k.toLowerCase();
        if (!known.has(lk)) customFields[k] = v;
      }
      return {
        phone,
        name: r.name ?? r.Name ?? null,
        email: r.email ?? r.Email ?? null,
        company: r.company ?? r.Company ?? null,
        status: r.status ?? r.Status ?? "new",
        notes: r.notes ?? r.Notes ?? null,
        customFields,
      };
    })
    .filter((x): x is NonNullable<typeof x> => !!x);

  if (values.length === 0) {
    return NextResponse.json({ inserted: 0 });
  }
  const inserted = await db.insert(leads).values(values).returning({ id: leads.id });
  return NextResponse.json({ inserted: inserted.length });
}
