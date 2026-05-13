import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const runtime = "nodejs";

export async function GET() {
  const url = process.env.DATABASE_URL;
  if (!url) return NextResponse.json({ error: "no DATABASE_URL" }, { status: 500 });
  const sql = neon(url);
  try {
    await sql`CREATE TABLE IF NOT EXISTS numbers (id SERIAL PRIMARY KEY, e164 TEXT NOT NULL UNIQUE, label TEXT, active BOOLEAN NOT NULL DEFAULT true, created_at TIMESTAMP NOT NULL DEFAULT NOW())`;
    await sql`CREATE TABLE IF NOT EXISTS leads (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT, phone TEXT NOT NULL, email TEXT, company TEXT, status TEXT NOT NULL DEFAULT 'new', last_called_at TIMESTAMP, notes TEXT, custom_fields JSONB DEFAULT '{}', created_at TIMESTAMP NOT NULL DEFAULT NOW(), updated_at TIMESTAMP NOT NULL DEFAULT NOW())`;
    await sql`CREATE TABLE IF NOT EXISTS custom_columns (id SERIAL PRIMARY KEY, key TEXT NOT NULL UNIQUE, label TEXT NOT NULL, type TEXT NOT NULL DEFAULT 'text', options JSONB DEFAULT '[]', position INTEGER NOT NULL DEFAULT 0, created_at TIMESTAMP NOT NULL DEFAULT NOW())`;
    await sql`CREATE TABLE IF NOT EXISTS calls (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), telnyx_call_control_id TEXT UNIQUE, telnyx_leg_id TEXT, direction TEXT NOT NULL, from_number TEXT NOT NULL, to_number TEXT NOT NULL, lead_id UUID REFERENCES leads(id) ON DELETE SET NULL, status TEXT NOT NULL DEFAULT 'initiated', disposition TEXT, notes TEXT, started_at TIMESTAMP NOT NULL DEFAULT NOW(), answered_at TIMESTAMP, ended_at TIMESTAMP, duration_sec INTEGER)`;
    await sql`CREATE TABLE IF NOT EXISTS recordings (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), call_id UUID REFERENCES calls(id) ON DELETE CASCADE, telnyx_recording_id TEXT UNIQUE, url TEXT, duration_sec INTEGER, format TEXT DEFAULT 'mp3', created_at TIMESTAMP NOT NULL DEFAULT NOW())`;
    return NextResponse.json({ ok: true, message: "Tables created" });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
