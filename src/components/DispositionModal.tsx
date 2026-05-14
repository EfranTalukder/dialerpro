"use client";

import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import { useTelnyxStore } from "@/lib/telnyx-store";
import { useTelnyx } from "./TelnyxProvider";
import { fmtPhone } from "@/lib/utils";

const PRESETS = [
  { value: "interested", label: "Interested", hotkey: "1" },
  { value: "not_interested", label: "Not interested", hotkey: "2" },
  { value: "voicemail", label: "Voicemail", hotkey: "3" },
  { value: "callback", label: "Callback", hotkey: "4" },
  { value: "wrong_number", label: "Wrong number", hotkey: "5" },
  { value: "no_answer", label: "No answer", hotkey: "6" },
];

export default function DispositionModal() {
  const pending = useTelnyxStore((s) => s.pendingDisposition);
  const setPending = useTelnyxStore((s) => s.setPendingDisposition);
  const powerDialer = useTelnyxStore((s) => s.powerDialer);
  const advancePower = useTelnyxStore((s) => s.advancePowerDialer);
  const { startCall } = useTelnyx();

  const [disp, setDisp] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDisp("");
    setNotes("");
  }, [pending?.callRowId]);

  useEffect(() => {
    if (!pending) return;
    function onKey(e: KeyboardEvent) {
      if ((e.target as HTMLElement)?.tagName === "TEXTAREA") return;
      const match = PRESETS.find((p) => p.hotkey === e.key);
      if (match) {
        e.preventDefault();
        setDisp(match.value);
      } else if (e.key === "Escape") {
        skip();
      } else if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        save();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending, disp, notes]);

  if (!pending) return null;

  async function save() {
    if (!pending) return;
    setSaving(true);
    try {
      await fetch("/api/calls", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          id: pending.callRowId,
          disposition: disp || null,
          notes: notes || null,
          leadId: pending.leadId,
        }),
      });
    } catch {}
    setSaving(false);
    setPending(null);
    maybeAdvanceQueue();
  }

  function skip() {
    setPending(null);
    maybeAdvanceQueue();
  }

  function maybeAdvanceQueue() {
    if (!powerDialer) return;
    const next = advancePower();
    if (next) {
      setTimeout(() => {
        startCall(next.phone, { leadId: next.id }).catch((e: Error) => {
          console.error("power dialer call failed", e);
        });
      }, 600);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 grid place-items-center p-4" onClick={skip}>
      <div
        className="w-full max-w-md card p-6 shadow-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-1">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted">Call ended</div>
            <h3 className="text-lg font-semibold mt-0.5">{fmtPhone(pending.remote)}</h3>
          </div>
          <button onClick={skip} className="text-muted hover:text-text" title="Skip (Esc)">
            <X size={18} />
          </button>
        </div>

        <p className="text-xs text-muted mt-1">Quick disposition — or hit Esc to skip.</p>

        <div className="mt-4 grid grid-cols-2 gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.value}
              onClick={() => setDisp(p.value)}
              className={`flex items-center justify-between px-3 py-2 rounded-lg border text-sm transition-colors ${
                disp === p.value
                  ? "bg-accent/15 border-accent text-text"
                  : "bg-elevated border-border hover:border-muted"
              }`}
            >
              <span className="flex items-center gap-2">
                {disp === p.value && <Check size={14} className="text-accent" />}
                {p.label}
              </span>
              <span className="text-[10px] text-muted font-mono">{p.hotkey}</span>
            </button>
          ))}
        </div>

        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes (optional)…"
          rows={3}
          className="input mt-3 resize-none"
        />

        <div className="mt-4 flex gap-2 justify-end">
          <button onClick={skip} className="btn btn-ghost text-sm">
            Skip
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="btn btn-primary text-sm disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>

        {powerDialer && (
          <div className="mt-3 text-xs text-muted text-center">
            Power dialer · {powerDialer.currentIndex + 1} of {powerDialer.leads.length}
            {powerDialer.currentIndex + 1 < powerDialer.leads.length && (
              <span className="ml-1">· next auto-dials after save</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
