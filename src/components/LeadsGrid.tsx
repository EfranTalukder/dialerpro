"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Phone, Plus, Upload, X } from "lucide-react";
import { useTelnyx } from "./TelnyxProvider";
import { useTelnyxStore } from "@/lib/telnyx-store";
import { fmtPhone } from "@/lib/utils";

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
};

type CustomColumn = {
  id: number;
  key: string;
  label: string;
  type: string;
  options: string[] | null;
};

const baseCols = [
  { key: "name", label: "Name" },
  { key: "phone", label: "Phone" },
  { key: "company", label: "Company" },
  { key: "email", label: "Email" },
  { key: "status", label: "Status" },
  { key: "notes", label: "Notes" },
];

export default function LeadsGrid() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [cols, setCols] = useState<CustomColumn[]>([]);
  const [q, setQ] = useState("");
  const [adding, setAdding] = useState(false);
  const [addingCol, setAddingCol] = useState(false);
  const ready = useTelnyxStore((s) => s.ready);
  const { startCall } = useTelnyx();

  const load = useCallback(async () => {
    const [l, c] = await Promise.all([
      fetch(`/api/leads${q ? `?q=${encodeURIComponent(q)}` : ""}`).then((r) => r.json()),
      fetch("/api/columns").then((r) => r.json()),
    ]);
    setLeads(l);
    setCols(c);
  }, [q]);

  useEffect(() => {
    load();
  }, [load]);

  async function patch(id: string, body: Partial<Lead> & { customFields?: Record<string, unknown> }) {
    setLeads((cur) => cur.map((l) => (l.id === id ? { ...l, ...body } as Lead : l)));
    await fetch(`/api/leads/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  async function remove(id: string) {
    if (!confirm("Delete this lead?")) return;
    setLeads((cur) => cur.filter((l) => l.id !== id));
    await fetch(`/api/leads/${id}`, { method: "DELETE" });
  }

  async function importCSV(file: File) {
    const text = await file.text();
    const r = await fetch("/api/leads/import", { method: "POST", body: text });
    const j = await r.json();
    alert(`Imported ${j.inserted ?? 0} leads`);
    load();
  }

  const allColumns = useMemo(
    () => [...baseCols, ...cols.map((c) => ({ key: `cf:${c.key}`, label: c.label, custom: c }))],
    [cols],
  );

  return (
    <div className="p-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-2xl font-semibold tracking-tight">Leads</h1>
        <div className="flex items-center gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search…"
            className="input w-56"
          />
          <button onClick={() => setAdding(true)} className="btn btn-outline">
            <Plus size={16} /> Add lead
          </button>
          <button onClick={() => setAddingCol(true)} className="btn btn-outline">
            <Plus size={16} /> Column
          </button>
          <label className="btn btn-outline cursor-pointer">
            <Upload size={16} /> CSV
            <input
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) importCSV(f);
                e.target.value = "";
              }}
            />
          </label>
        </div>
      </div>

      <div className="mt-4 card overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-elevated text-muted text-xs uppercase tracking-wider">
            <tr>
              <th className="text-left px-3 py-2 w-10"></th>
              {allColumns.map((c) => (
                <th key={c.key} className="text-left px-3 py-2 font-normal whitespace-nowrap">
                  {c.label}
                </th>
              ))}
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody>
            {leads.map((l) => (
              <tr key={l.id} className="border-t border-border hover:bg-elevated/50 group">
                <td className="px-2 py-1.5">
                  <button
                    disabled={!ready}
                    onClick={() =>
                      startCall(l.phone, { leadId: l.id }).catch((e: Error) => alert(e.message))
                    }
                    className="w-8 h-8 grid place-items-center rounded-lg bg-accent/10 hover:bg-accent/20 text-accent transition-colors disabled:opacity-40"
                    title="Call"
                  >
                    <Phone size={14} />
                  </button>
                </td>
                {allColumns.map((c) => {
                  const k = c.key;
                  if (k.startsWith("cf:")) {
                    const fk = k.slice(3);
                    const val = (l.customFields?.[fk] as string) ?? "";
                    return (
                      <Cell
                        key={k}
                        value={val}
                        onChange={(v) =>
                          patch(l.id, {
                            customFields: { ...(l.customFields ?? {}), [fk]: v },
                          })
                        }
                      />
                    );
                  }
                  const val = (l as unknown as Record<string, string>)[k] ?? "";
                  return (
                    <Cell
                      key={k}
                      value={val}
                      onChange={(v) => patch(l.id, { [k]: v } as Partial<Lead>)}
                      phone={k === "phone"}
                    />
                  );
                })}
                <td className="px-2 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => remove(l.id)} className="text-muted hover:text-danger">
                    <X size={14} />
                  </button>
                </td>
              </tr>
            ))}
            {leads.length === 0 && (
              <tr>
                <td
                  colSpan={allColumns.length + 2}
                  className="px-3 py-12 text-center text-muted text-sm"
                >
                  No leads yet. Add one or import a CSV.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {adding && <AddLeadModal onClose={() => setAdding(false)} onDone={load} />}
      {addingCol && <AddColumnModal onClose={() => setAddingCol(false)} onDone={load} />}
    </div>
  );
}

function Cell({
  value,
  onChange,
  phone,
}: {
  value: string;
  onChange: (v: string) => void;
  phone?: boolean;
}) {
  const [v, setV] = useState(value ?? "");
  useEffect(() => setV(value ?? ""), [value]);
  return (
    <td className="px-1 py-0.5">
      <input
        value={v}
        onChange={(e) => setV(e.target.value)}
        onBlur={() => {
          if (v !== value) onChange(v);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        }}
        className="w-full bg-transparent rounded-md px-2 py-1.5 focus:bg-elevated focus:outline-none focus:ring-1 focus:ring-accent/40 text-sm"
        placeholder={phone ? "+1…" : ""}
      />
    </td>
  );
}

function AddLeadModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  return (
    <Modal onClose={onClose} title="New lead">
      <input className="input" placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
      <input className="input mt-2" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
      <input className="input mt-2" placeholder="Company" value={company} onChange={(e) => setCompany(e.target.value)} />
      <div className="mt-4 flex justify-end gap-2">
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button
          className="btn btn-primary"
          onClick={async () => {
            if (!phone) return;
            await fetch("/api/leads", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ phone, name, company }),
            });
            onDone();
            onClose();
          }}
        >
          Add
        </button>
      </div>
    </Modal>
  );
}

function AddColumnModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [label, setLabel] = useState("");
  const [type, setType] = useState("text");
  return (
    <Modal onClose={onClose} title="New custom column">
      <input className="input" placeholder="Column name (e.g. Industry)" value={label} onChange={(e) => setLabel(e.target.value)} />
      <select className="input mt-2" value={type} onChange={(e) => setType(e.target.value)}>
        <option value="text">Text</option>
        <option value="number">Number</option>
        <option value="date">Date</option>
      </select>
      <div className="mt-4 flex justify-end gap-2">
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button
          className="btn btn-primary"
          onClick={async () => {
            if (!label) return;
            const key = label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
            await fetch("/api/columns", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ key, label, type }),
            });
            onDone();
            onClose();
          }}
        >
          Add
        </button>
      </div>
    </Modal>
  );
}

function Modal({
  onClose,
  title,
  children,
}: {
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 grid place-items-center p-4" onClick={onClose}>
      <div className="w-full max-w-sm card p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold">{title}</h3>
          <button onClick={onClose} className="text-muted hover:text-text">
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
