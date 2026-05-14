"use client";

import { useEffect, useState } from "react";
import { Phone, X } from "lucide-react";
import { useTelnyxStore } from "@/lib/telnyx-store";
import { useTelnyx } from "./TelnyxProvider";
import { cn, fmtPhone } from "@/lib/utils";

export default function PowerDialerFromPicker() {
  const pending = useTelnyxStore((s) => s.pendingNextCall);
  const setPending = useTelnyxStore((s) => s.setPendingNextCall);
  const cancelPower = useTelnyxStore((s) => s.cancelPowerDialer);
  const numbers = useTelnyxStore((s) => s.numbers);
  const selectedFromNumber = useTelnyxStore((s) => s.selectedFromNumber);
  const setSelectedFromNumber = useTelnyxStore((s) => s.setSelectedFromNumber);
  const powerDialer = useTelnyxStore((s) => s.powerDialer);
  const { startCall } = useTelnyx();

  const [choice, setChoice] = useState<string | null>(null);
  const [calling, setCalling] = useState(false);

  useEffect(() => {
    if (!pending) {
      setChoice(null);
      return;
    }
    setChoice(selectedFromNumber ?? numbers[0]?.e164 ?? null);
  }, [pending, selectedFromNumber, numbers]);

  if (!pending) return null;

  const remaining = powerDialer
    ? powerDialer.leads.length - powerDialer.currentIndex
    : 0;

  async function callNow() {
    if (!pending || !choice) return;
    setCalling(true);
    setSelectedFromNumber(choice);
    const target = pending;
    setPending(null);
    try {
      await startCall(target.phone, { leadId: target.id, fromNumber: choice });
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setCalling(false);
    }
  }

  function stopQueue() {
    setPending(null);
    cancelPower();
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 grid place-items-center p-4">
      <div className="w-full max-w-md card p-6 shadow-card">
        <div className="flex items-start justify-between mb-1">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted">Next call</div>
            <h3 className="text-lg font-semibold mt-0.5">
              {pending.name ?? fmtPhone(pending.phone)}
            </h3>
            {pending.name && (
              <div className="text-xs text-muted mt-0.5">{fmtPhone(pending.phone)}</div>
            )}
          </div>
          <button
            onClick={stopQueue}
            className="text-muted hover:text-danger"
            title="End power dialer"
          >
            <X size={18} />
          </button>
        </div>

        <p className="text-xs text-muted mt-3">Pick the "From" number to call with.</p>

        {numbers.length === 0 ? (
          <div className="mt-3 text-sm text-warning">
            No numbers configured. Add one in Settings.
          </div>
        ) : (
          <ul className="mt-3 space-y-1.5 max-h-64 overflow-auto">
            {numbers.map((n) => {
              const active = choice === n.e164;
              return (
                <li key={n.id}>
                  <button
                    onClick={() => setChoice(n.e164)}
                    className={cn(
                      "w-full px-3 py-2.5 rounded-lg border text-left text-sm transition-colors flex items-center justify-between",
                      active
                        ? "bg-accent/15 border-accent text-text"
                        : "bg-elevated border-border hover:border-muted",
                    )}
                  >
                    <span className="flex flex-col">
                      <span>{fmtPhone(n.e164)}</span>
                      {n.label && (
                        <span className="text-xs text-muted mt-0.5">{n.label}</span>
                      )}
                    </span>
                    {active && (
                      <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <div className="mt-5 flex items-center justify-between gap-2">
          <button onClick={stopQueue} className="btn btn-ghost text-sm">
            End queue
          </button>
          <button
            onClick={callNow}
            disabled={!choice || calling}
            className="btn btn-primary text-sm disabled:opacity-60"
          >
            <Phone size={14} /> {calling ? "Calling…" : "Call now"}
          </button>
        </div>

        {powerDialer && (
          <div className="mt-3 text-xs text-muted text-center">
            Power dialer · {powerDialer.currentIndex + 1} of {powerDialer.leads.length}
            {remaining > 1 && (
              <span className="ml-1">· {remaining - 1} more after this</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
