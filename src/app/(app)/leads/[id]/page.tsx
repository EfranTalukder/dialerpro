"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  AudioLines,
  Download,
  Phone,
  PhoneIncoming,
  Trash2,
} from "lucide-react";
import { useTelnyx } from "@/components/TelnyxProvider";
import { useTelnyxStore } from "@/lib/telnyx-store";
import { fmtDuration, fmtPhone } from "@/lib/utils";

type Lead = {
  id: string;
  name: string | null;
  phone: string;
  email: string | null;
  company: string | null;
  status: string;
  notes: string | null;
  lastCalledAt: string | null;
  customFields: Record<string, unknown>;
  createdAt: string;
};

type CallRow = {
  call: {
    id: string;
    direction: string;
    fromNumber: string;
    toNumber: string;
    startedAt: string;
    durationSec: number | null;
    disposition: string | null;
    notes: string | null;
    status: string;
  };
  recordingUrl: string | null;
};

type CustomColumn = {
  id: number;
  key: string;
  label: string;
  type: string;
  options: string[] | null;
};

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [lead, setLead] = useState<Lead | null>(null);
  const [calls, setCalls] = useState<CallRow[]>([]);
  const [cols, setCols] = useState<CustomColumn[]>([]);
  const [saving, setSaving] = useState(false);
  const ready = useTelnyxStore((s) => s.ready);
  const activeCall = useTelnyxStore((s) => s.activeCall);
  const { startCall } = useTelnyx();

  const load = useCallback(async () => {
    const r = await fetch(`/api/leads/${id}`);
    if (!r.ok) {
      router.replace("/leads");
      return;
    }
    const j = await r.json();
    setLead(j.lead);
    setCalls(j.calls);
    setCols(j.customColumns);
  }, [id, router]);

  useEffect(() => {
    load();
  }, [load]);

  async function patch(body: Partial<Lead> & { customFields?: Record<string, unknown> }) {
    if (!lead) return;
    setLead({ ...lead, ...body } as Lead);
    setSaving(true);
    await fetch(`/api/leads/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
  }

  async function remove() {
    if (!confirm("Delete this lead and all its call history? This can't be undone.")) return;
    await fetch(`/api/leads/${id}`, { method: "DELETE" });
    router.push("/leads");
  }

  if (!lead) {
    return <div className="p-6 text-muted text-sm">Loading…</div>;
  }

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <Link
          href="/leads"
          className="text-sm text-muted hover:text-text inline-flex items-center gap-1.5"
        >
          <ArrowLeft size={14} /> All leads
        </Link>
        <div className="flex items-center gap-2">
          {saving && <span className="text-xs text-muted">Saving…</span>}
          <button
            disabled={!ready || !!activeCall}
            onClick={() =>
              startCall(lead.phone, { leadId: lead.id }).catch((e: Error) => alert(e.message))
            }
            className="btn btn-primary disabled:opacity-40"
          >
            <Phone size={16} /> Call {fmtPhone(lead.phone)}
          </button>
          <button onClick={remove} className="btn btn-ghost text-danger">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <section className="card p-5">
            <h2 className="text-xs uppercase tracking-wider text-muted mb-3">Contact</h2>
            <Field label="Name" value={lead.name ?? ""} onSave={(v) => patch({ name: v })} />
            <Field label="Phone" value={lead.phone} onSave={(v) => patch({ phone: v })} />
            <Field label="Company" value={lead.company ?? ""} onSave={(v) => patch({ company: v })} />
            <Field label="Email" value={lead.email ?? ""} onSave={(v) => patch({ email: v })} />
            <Field label="Status" value={lead.status} onSave={(v) => patch({ status: v })} />
            <Field
              label="Notes"
              value={lead.notes ?? ""}
              multiline
              onSave={(v) => patch({ notes: v })}
            />
          </section>

          {cols.length > 0 && (
            <section className="card p-5">
              <h2 className="text-xs uppercase tracking-wider text-muted mb-3">Custom fields</h2>
              {cols.map((c) => (
                <Field
                  key={c.key}
                  label={c.label}
                  value={String(lead.customFields?.[c.key] ?? "")}
                  onSave={(v) =>
                    patch({
                      customFields: { ...(lead.customFields ?? {}), [c.key]: v },
                    })
                  }
                />
              ))}
            </section>
          )}
        </div>

        <div className="space-y-4">
          <section className="card p-5">
            <h2 className="text-xs uppercase tracking-wider text-muted mb-3">Summary</h2>
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-muted">Total calls</span>
                <span>{calls.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Last contact</span>
                <span>
                  {lead.lastCalledAt
                    ? new Date(lead.lastCalledAt).toLocaleString()
                    : "Never"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Created</span>
                <span>{new Date(lead.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </section>
        </div>
      </div>

      <section className="mt-6">
        <h2 className="text-sm font-medium mb-3">Call history</h2>
        {calls.length === 0 ? (
          <div className="card p-8 text-center text-sm text-muted">
            No calls yet — hit the call button above to make one.
          </div>
        ) : (
          <div className="space-y-2">
            {calls.map((c) => (
              <div key={c.call.id} className="card p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 grid place-items-center rounded-lg bg-elevated">
                    {c.call.direction === "outbound" ? (
                      <Phone size={14} />
                    ) : (
                      <PhoneIncoming size={14} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm">
                      {new Date(c.call.startedAt).toLocaleString()} ·{" "}
                      {fmtDuration(c.call.durationSec)}
                      {c.call.disposition && (
                        <span className="ml-2 px-1.5 py-0.5 bg-elevated rounded text-[10px] uppercase tracking-wider">
                          {c.call.disposition.replace(/_/g, " ")}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted">
                      via {c.call.direction === "outbound" ? c.call.fromNumber : c.call.toNumber}
                    </div>
                  </div>
                  {c.recordingUrl ? (
                    <div className="flex items-center gap-2">
                      <audio src={c.recordingUrl} controls className="h-9" />
                      <a
                        href={c.recordingUrl}
                        download
                        className="btn btn-ghost"
                        title="Download"
                      >
                        <Download size={14} />
                      </a>
                    </div>
                  ) : (
                    <AudioLines size={14} className="text-muted opacity-50" />
                  )}
                </div>
                {c.call.notes && (
                  <p className="mt-3 ml-11 text-sm text-muted whitespace-pre-wrap">
                    {c.call.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Field({
  label,
  value,
  onSave,
  multiline,
}: {
  label: string;
  value: string;
  onSave: (v: string) => void | Promise<void>;
  multiline?: boolean;
}) {
  const [v, setV] = useState(value ?? "");
  useEffect(() => setV(value ?? ""), [value]);
  const Tag = (multiline ? "textarea" : "input") as "input";
  return (
    <div className="mb-3 last:mb-0">
      <label className="text-[11px] uppercase tracking-wider text-muted">{label}</label>
      <Tag
        value={v}
        onChange={(e) => setV(e.target.value)}
        onBlur={() => {
          if (v !== value) onSave(v);
        }}
        rows={multiline ? 3 : undefined}
        className="input mt-1"
      />
    </div>
  );
}
