"use client";

import { useEffect, useState } from "react";
import { Download, Phone, PhoneIncoming } from "lucide-react";
import { fmtDuration, fmtPhone } from "@/lib/utils";

type Row = {
  call: {
    id: string;
    direction: string;
    fromNumber: string;
    toNumber: string;
    startedAt: string;
    durationSec: number | null;
    disposition: string | null;
    status: string;
  };
  recordingUrl: string | null;
  recordingId: string | null;
};

export default function RecordingsPage() {
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    fetch("/api/calls")
      .then((r) => r.json())
      .then(setRows);
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold tracking-tight">Calls & Recordings</h1>
      <p className="text-sm text-muted mt-1">Every call you make is logged here. Recordings appear within ~30 seconds after hangup.</p>

      <div className="mt-6 space-y-2">
        {rows.map((r) => (
          <div key={r.call.id} className="card p-4 flex items-center gap-4">
            <div className="w-8 h-8 grid place-items-center rounded-lg bg-elevated">
              {r.call.direction === "outbound" ? <Phone size={14} /> : <PhoneIncoming size={14} />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">
                {r.call.direction === "outbound"
                  ? fmtPhone(r.call.toNumber)
                  : fmtPhone(r.call.fromNumber)}
              </div>
              <div className="text-xs text-muted">
                {new Date(r.call.startedAt).toLocaleString()} ·{" "}
                {fmtDuration(r.call.durationSec)} ·{" "}
                via {r.call.direction === "outbound" ? r.call.fromNumber : r.call.toNumber}
                {r.call.disposition && (
                  <span className="ml-2 px-1.5 py-0.5 bg-elevated rounded text-[10px]">{r.call.disposition}</span>
                )}
              </div>
            </div>

            {r.recordingId ? (
              <>
                <audio
                  src={`/api/recordings/${r.recordingId}/audio`}
                  controls
                  preload="none"
                  className="h-9"
                />
                <a
                  href={`/api/recordings/${r.recordingId}/audio`}
                  download
                  className="btn btn-ghost"
                  title="Download"
                >
                  <Download size={16} />
                </a>
              </>
            ) : (
              <span className="text-xs text-muted">
                {r.call.status === "ended" ? "Processing…" : "—"}
              </span>
            )}
          </div>
        ))}
        {rows.length === 0 && (
          <div className="text-center text-muted text-sm py-12">No calls yet.</div>
        )}
      </div>
    </div>
  );
}
