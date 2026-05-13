"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { fmtPhone } from "@/lib/utils";

type Num = { id: number; e164: string; label: string | null };

export default function SettingsPage() {
  const [nums, setNums] = useState<Num[]>([]);
  const [e164, setE164] = useState("");
  const [label, setLabel] = useState("");

  async function load() {
    const r = await fetch("/api/numbers");
    setNums(await r.json());
  }
  useEffect(() => {
    load();
  }, []);

  async function add() {
    if (!e164.startsWith("+")) {
      alert("Number must be in E.164 format (e.g. +14155551234)");
      return;
    }
    await fetch("/api/numbers", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ e164, label }),
    });
    setE164("");
    setLabel("");
    load();
  }

  async function remove(id: number) {
    if (!confirm("Remove this number?")) return;
    await fetch(`/api/numbers?id=${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>

      <section className="mt-6">
        <h2 className="text-sm uppercase tracking-wider text-muted">Your Telnyx Numbers</h2>
        <p className="text-xs text-muted mt-1">
          Add every DID you've assigned to your Credential Connection in Telnyx. These show up in the dialer's "From" picker.
        </p>

        <div className="mt-4 card divide-y divide-border">
          {nums.map((n) => (
            <div key={n.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <div className="text-sm">{fmtPhone(n.e164)}</div>
                <div className="text-xs text-muted">{n.label ?? "—"}</div>
              </div>
              <button className="text-muted hover:text-danger" onClick={() => remove(n.id)}>
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          {nums.length === 0 && (
            <div className="px-4 py-6 text-center text-muted text-sm">No numbers yet.</div>
          )}
        </div>

        <div className="mt-3 flex gap-2">
          <input
            className="input"
            placeholder="+14155551234"
            value={e164}
            onChange={(e) => setE164(e.target.value)}
          />
          <input
            className="input w-48"
            placeholder="Label (optional)"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
          <button className="btn btn-primary" onClick={add}>Add</button>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-sm uppercase tracking-wider text-muted">Webhook URL</h2>
        <p className="text-xs text-muted mt-1">
          Paste this into the Telnyx Mission Control Portal &rarr; Call Control Application &rarr; Webhook URL.
        </p>
        <code className="mt-2 block bg-elevated border border-border rounded-lg px-3 py-2 text-sm font-mono">
          {typeof window !== "undefined" ? `${window.location.origin}/api/telnyx/webhook` : "/api/telnyx/webhook"}
        </code>
      </section>
    </div>
  );
}
