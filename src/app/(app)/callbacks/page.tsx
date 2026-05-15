"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Check, Clock, Phone } from "lucide-react";
import { useTelnyx } from "@/components/TelnyxProvider";
import { useTelnyxStore } from "@/lib/telnyx-store";
import { cn, fmtPhone } from "@/lib/utils";

type Lead = {
  id: string;
  name: string | null;
  phone: string;
  company: string | null;
  callbackAt: string | null;
  callbackNotes: string | null;
};

function relTime(iso: string) {
  const t = new Date(iso).getTime();
  const diff = t - Date.now();
  const abs = Math.abs(diff);
  const m = Math.round(abs / 60000);
  const h = Math.round(abs / 3600000);
  const d = Math.round(abs / 86400000);
  const future = diff > 0;
  const part =
    m < 60 ? `${m}m` : h < 24 ? `${h}h` : `${d}d`;
  return future ? `in ${part}` : `${part} overdue`;
}

export default function CallbacksPage() {
  const [rows, setRows] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const ready = useTelnyxStore((s) => s.ready);
  const activeCall = useTelnyxStore((s) => s.activeCall);
  const { startCall } = useTelnyx();

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch("/api/callbacks");
    setRows(await r.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function markDone(id: string) {
    setRows((cur) => cur.filter((r) => r.id !== id));
    await fetch(`/api/leads/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ callbackDoneAt: new Date().toISOString() }),
    });
  }

  const now = Date.now();
  const overdue = rows.filter((r) => r.callbackAt && new Date(r.callbackAt).getTime() < now);
  const upcoming = rows.filter(
    (r) => r.callbackAt && new Date(r.callbackAt).getTime() >= now,
  );

  return (
    <div className="p-4 sm:p-6 max-w-3xl">
      <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Callbacks</h1>
      <p className="text-sm text-muted mt-1">
        Scheduled follow-ups, sorted by due time. Mark done when complete.
      </p>

      {loading ? (
        <div className="mt-6 text-sm text-muted">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="mt-8 card p-12 text-center text-sm text-muted">
          No callbacks scheduled. When you tag a call as "Callback", set a time and it'll appear here.
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {overdue.length > 0 && (
            <Section title="Overdue" tone="danger" rows={overdue} now={now}
              onCall={(l) => startCall(l.phone, { leadId: l.id }).catch((e: Error) => alert(e.message))}
              onDone={markDone}
              canCall={ready && !activeCall}
            />
          )}
          {upcoming.length > 0 && (
            <Section title="Upcoming" tone="default" rows={upcoming} now={now}
              onCall={(l) => startCall(l.phone, { leadId: l.id }).catch((e: Error) => alert(e.message))}
              onDone={markDone}
              canCall={ready && !activeCall}
            />
          )}
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  tone,
  rows,
  now,
  onCall,
  onDone,
  canCall,
}: {
  title: string;
  tone: "danger" | "default";
  rows: Lead[];
  now: number;
  onCall: (l: Lead) => void;
  onDone: (id: string) => void;
  canCall: boolean;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <h2
          className={cn(
            "text-xs uppercase tracking-wider",
            tone === "danger" ? "text-danger" : "text-muted",
          )}
        >
          {title}
        </h2>
        <span className="text-xs text-muted">· {rows.length}</span>
      </div>
      <div className="space-y-2">
        {rows.map((l) => {
          const isOverdue = l.callbackAt && new Date(l.callbackAt).getTime() < now;
          return (
            <div
              key={l.id}
              className="card p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4"
            >
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div
                  className={cn(
                    "w-10 h-10 grid place-items-center rounded-lg shrink-0",
                    isOverdue ? "bg-danger/15 text-danger" : "bg-elevated text-muted",
                  )}
                >
                  <Clock size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/leads/${l.id}`}
                    className="text-sm font-medium hover:underline break-words"
                  >
                    {l.name || fmtPhone(l.phone)}
                  </Link>
                  {l.company && (
                    <span className="ml-2 text-xs text-muted">{l.company}</span>
                  )}
                  <div className="text-xs text-muted mt-0.5">
                    {l.callbackAt && new Date(l.callbackAt).toLocaleString()} ·{" "}
                    <span className={cn(isOverdue && "text-danger")}>
                      {l.callbackAt && relTime(l.callbackAt)}
                    </span>
                  </div>
                  {l.callbackNotes && (
                    <p className="text-xs text-muted mt-1 italic whitespace-pre-wrap">
                      {l.callbackNotes}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 sm:shrink-0">
                <button
                  disabled={!canCall}
                  onClick={() => onCall(l)}
                  className="btn btn-primary text-xs disabled:opacity-40 flex-1 sm:flex-none"
                  title="Call now"
                >
                  <Phone size={14} /> Call
                </button>
                <button
                  onClick={() => onDone(l.id)}
                  className="btn btn-outline text-xs flex-1 sm:flex-none"
                  title="Mark done"
                >
                  <Check size={14} /> Done
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
