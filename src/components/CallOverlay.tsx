"use client";

import { useEffect, useState } from "react";
import { Phone, PhoneOff, Mic, MicOff, Pause, Play } from "lucide-react";
import { useTelnyx } from "./TelnyxProvider";
import { useTelnyxStore } from "@/lib/telnyx-store";
import { cn, fmtDuration, fmtPhone } from "@/lib/utils";

export default function CallOverlay() {
  const call = useTelnyxStore((s) => s.activeCall);
  const { hangup, toggleMute, toggleHold, answer } = useTelnyx();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!call) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [call]);

  if (!call) return null;

  const elapsed =
    call.state === "active" ? Math.floor((now - call.startedAt) / 1000) : 0;

  return (
    <div className="fixed bottom-6 right-6 w-80 card shadow-card p-5 z-50">
      <div className="text-xs uppercase tracking-wider text-muted">
        {call.direction === "outbound" ? "Calling" : "Incoming"}
        {call.localNumber && (
          <span className="ml-2 text-muted/70">via {call.localNumber}</span>
        )}
      </div>
      <div className="mt-1 text-lg font-medium">{fmtPhone(call.remote)}</div>
      <div className="mt-1 text-sm text-muted">
        {call.state === "connecting" && "Connecting…"}
        {call.state === "ringing" &&
          (call.direction === "outbound" ? "Ringing…" : "Incoming call")}
        {call.state === "active" && fmtDuration(elapsed)}
        {call.state === "held" && "On hold"}
        {call.state === "ended" && "Ended"}
      </div>

      <div className="mt-4 flex gap-2 justify-center">
        {call.direction === "inbound" && call.state === "ringing" && (
          <button
            onClick={answer}
            className="w-12 h-12 rounded-full bg-success hover:opacity-90 grid place-items-center text-white"
          >
            <Phone size={18} />
          </button>
        )}
        {(call.state === "active" || call.state === "held") && (
          <>
            <button
              onClick={toggleMute}
              className={cn(
                "w-12 h-12 rounded-full grid place-items-center transition-colors",
                call.muted
                  ? "bg-warning text-bg"
                  : "bg-elevated hover:bg-border text-text",
              )}
            >
              {call.muted ? <MicOff size={18} /> : <Mic size={18} />}
            </button>
            <button
              onClick={toggleHold}
              className={cn(
                "w-12 h-12 rounded-full grid place-items-center transition-colors",
                call.state === "held"
                  ? "bg-warning text-bg"
                  : "bg-elevated hover:bg-border text-text",
              )}
            >
              {call.state === "held" ? <Play size={18} /> : <Pause size={18} />}
            </button>
          </>
        )}
        <button
          onClick={hangup}
          className="w-12 h-12 rounded-full bg-danger hover:opacity-90 grid place-items-center text-white"
        >
          <PhoneOff size={18} />
        </button>
      </div>
    </div>
  );
}
