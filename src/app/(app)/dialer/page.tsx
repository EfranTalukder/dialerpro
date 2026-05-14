"use client";

import { useState } from "react";
import { Phone } from "lucide-react";
import { useTelnyx } from "@/components/TelnyxProvider";
import Dialpad from "@/components/Dialpad";
import NumberPicker from "@/components/NumberPicker";
import TodayStats from "@/components/TodayStats";
import { useTelnyxStore } from "@/lib/telnyx-store";
import { fmtPhone, toE164 } from "@/lib/utils";

export default function DialerPage() {
  const [dest, setDest] = useState("");
  const { startCall } = useTelnyx();
  const ready = useTelnyxStore((s) => s.ready);
  const active = useTelnyxStore((s) => s.activeCall);
  const err = useTelnyxStore((s) => s.registrationError);

  async function call() {
    if (!dest) return;
    try {
      await startCall(dest);
    } catch (e) {
      alert((e as Error).message);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Dialer</h1>
      <p className="text-sm text-muted mt-1">
        Pick a number to call from, then dial.
      </p>

      {err && (
        <div className="mt-4 card p-3 text-sm text-danger">
          Telnyx registration failed: {err}
        </div>
      )}

      <TodayStats />

      <div className="mt-6 max-w-md mx-auto space-y-3">
        <NumberPicker />

        <input
          type="tel"
          inputMode="tel"
          value={dest}
          onChange={(e) => setDest(e.target.value)}
          placeholder="Number to call"
          className="input text-center text-xl tracking-wide"
        />
        <div className="text-center text-xs text-muted h-4">
          {dest && toE164(dest) !== dest ? fmtPhone(toE164(dest)) : ""}
        </div>

        <Dialpad
          onPress={(d) => setDest((v) => v + d)}
          onBackspace={() => setDest((v) => v.slice(0, -1))}
        />

        <button
          type="button"
          onClick={call}
          disabled={!ready || !dest || !!active}
          className="w-full btn btn-primary py-3 text-base disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Phone size={18} /> Call
        </button>
      </div>
    </div>
  );
}
