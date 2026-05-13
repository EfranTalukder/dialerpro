import {
  pgTable,
  text,
  integer,
  timestamp,
  jsonb,
  serial,
  boolean,
  uuid,
} from "drizzle-orm/pg-core";

export const numbers = pgTable("numbers", {
  id: serial("id").primaryKey(),
  e164: text("e164").notNull().unique(),
  label: text("label"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const leads = pgTable("leads", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name"),
  phone: text("phone").notNull(),
  email: text("email"),
  company: text("company"),
  status: text("status").notNull().default("new"),
  lastCalledAt: timestamp("last_called_at"),
  notes: text("notes"),
  customFields: jsonb("custom_fields").$type<Record<string, unknown>>().default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const customColumns = pgTable("custom_columns", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  label: text("label").notNull(),
  type: text("type").notNull().default("text"),
  options: jsonb("options").$type<string[]>().default([]),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const calls = pgTable("calls", {
  id: uuid("id").primaryKey().defaultRandom(),
  telnyxCallControlId: text("telnyx_call_control_id").unique(),
  telnyxLegId: text("telnyx_leg_id"),
  direction: text("direction").notNull(),
  fromNumber: text("from_number").notNull(),
  toNumber: text("to_number").notNull(),
  leadId: uuid("lead_id").references(() => leads.id, { onDelete: "set null" }),
  status: text("status").notNull().default("initiated"),
  disposition: text("disposition"),
  notes: text("notes"),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  answeredAt: timestamp("answered_at"),
  endedAt: timestamp("ended_at"),
  durationSec: integer("duration_sec"),
});

export const recordings = pgTable("recordings", {
  id: uuid("id").primaryKey().defaultRandom(),
  callId: uuid("call_id").references(() => calls.id, { onDelete: "cascade" }),
  telnyxRecordingId: text("telnyx_recording_id").unique(),
  url: text("url"),
  durationSec: integer("duration_sec"),
  format: text("format").default("mp3"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;
export type Call = typeof calls.$inferSelect;
export type Recording = typeof recordings.$inferSelect;
export type CustomColumn = typeof customColumns.$inferSelect;
export type PhoneNumber = typeof numbers.$inferSelect;
