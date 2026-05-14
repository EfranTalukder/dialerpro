"use client";

import { useEffect, useRef, useState } from "react";
import { Phone, X } from "lucide-react";
import { useTelnyx } from "./TelnyxProvider";
import { useTelnyxStore } from "@/lib/telnyx-store";
import Dialpad from "./Dialpad";
import NumberPicker from "./NumberPicker";
import { fmtPhone, toE164 } from "@/lib/utils";

export default function QuickCallFAB() {
  const [open, setOpen] = useState(false);
  const [dest, setDest] = useState("");
  const ready = useTelnyxStore((s) => s.ready);
  const activeCall = useTelnyxStore((s) => s.activeCall);
  const pending = useTelnyxStore((s) => s.pendingDisposition);
  const { startCall } = useTelnyx();
  const popoverRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (activeCall || pending) setOpen(false);
  }, [activeCall, pending]);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (!popoverRef.current) return;
      if (!popoverRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  if (activeCall || pending) return null;

  async function call() {
    if (!dest) return;
    try {
      await startCall(dest);
      setOpen(false);
      setDest("");
    } catch (e) {
      alert((e as Error).message);
    }
  }

  return (
    <>
      {open && (
        <div
          ref={popoverRef}
          className="fixed bottom-24 right-6 z-40 w-80 card p-5 shadow-card"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">Quick call</h3>
            <button
              onClick={() => setOpen(false)}
              className="text-muted hover:text-text"
            >
              <X size={16} />
            </button>
          </div>
          <div className="space-y-2">
            <NumberPicker />
            <input
              type="tel"
              inputMode="tel"
              value={dest}
              onChange={(e) => setDest(e.target.value)}
              placeholder="Number"
              className="input text-center text-lg tracking-wide"
              autoFocus
            />
            <div className="text-center text-[11px] text-muted h-3">
              {dest && toE164(dest) !== dest ? fmtPhone(toE164(dest)) : ""}
            </div>
            <Dialpad
              onPress={(d) => setDest((v) => v + d)}
              onBackspace={() => setDest((v) => v.slice(0, -1))}
            />
            <button
              type="button"
              onClick={call}
              disabled={!ready || !dest}
              className="w-full btn btn-primary py-2.5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Phone size={16} /> Call
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-accent hover:bg-accentMuted text-white grid place-items-center shadow-card transition-colors"
        title="Quick call"
      >
        <Phone size={20} />
      </button>
    </>
  );
}
