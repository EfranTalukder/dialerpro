"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { fmtPhone } from "@/lib/utils";
import { useTelnyxStore, type RotationMode } from "@/lib/telnyx-store";

type Num = { id: number; e164: string; label: string | null };

export default function SettingsPage() {
  const [nums, setNums] = useState<Num[]>([]);
  const [e164, setE164] = useState("");
  const [label, setLabel] = useState("");
  const autoRotation = useTelnyxStore((s) => s.autoRotation);
  const setAutoRotation = useTelnyxStore((s) => s.setAutoRotation);
  const pickFromPerCall = useTelnyxStore((s) => s.pickFromPerCall);
  const setPickFromPerCall = useTelnyxStore((s) => s.setPickFromPerCall);

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
        <h2 className="text-sm uppercase tracking-wider text-muted">Auto-rotation</h2>
        <p className="text-xs text-muted mt-1">
          When enabled, every outbound call uses a different "From" number automatically. When off, you pick manually from the dialer dropdown.
        </p>

        <div className="mt-4 card p-4 flex items-center justify-between">
          <div>
            <div className="text-sm font-medium">Rotate caller ID per call</div>
            <div className="text-xs text-muted mt-0.5">
              {autoRotation.enabled
                ? `Active — mode: ${autoRotation.mode}`
                : "Off — manual selection only"}
            </div>
          </div>
          <button
            onClick={() =>
              setAutoRotation({ ...autoRotation, enabled: !autoRotation.enabled })
            }
            className={`relative w-11 h-6 rounded-full transition-colors ${
              autoRotation.enabled ? "bg-accent" : "bg-border"
            }`}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                autoRotation.enabled ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>

        {autoRotation.enabled && (
          <div className="mt-3 card p-4">
            <label className="text-xs uppercase tracking-wider text-muted">Mode</label>
            <select
              className="input mt-2"
              value={autoRotation.mode}
              onChange={(e) =>
                setAutoRotation({
                  ...autoRotation,
                  mode: e.target.value as RotationMode,
                })
              }
            >
              <option value="round-robin">Round-robin (next in list)</option>
              <option value="random">Random</option>
            </select>
            <p className="text-xs text-muted mt-2">
              Add more numbers above to see rotation in action with more variety.
            </p>
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-sm uppercase tracking-wider text-muted">Power dialer</h2>
        <p className="text-xs text-muted mt-1">
          Controls behavior between calls when running a power dialer queue from Leads.
        </p>

        <div className="mt-4 card p-4 flex items-center justify-between">
          <div>
            <div className="text-sm font-medium">Pick "From" number before each call</div>
            <div className="text-xs text-muted mt-0.5">
              {pickFromPerCall
                ? "Active — a picker appears before every call in the queue"
                : "Off — uses your selected number (or auto-rotation) without prompting"}
            </div>
          </div>
          <button
            onClick={() => setPickFromPerCall(!pickFromPerCall)}
            className={`relative w-11 h-6 rounded-full transition-colors ${
              pickFromPerCall ? "bg-accent" : "bg-border"
            }`}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                pickFromPerCall ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
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
