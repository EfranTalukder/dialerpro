"use client";

import { X } from "lucide-react";
import { useTelnyxStore } from "@/lib/telnyx-store";

export default function PowerDialerBanner() {
  const pd = useTelnyxStore((s) => s.powerDialer);
  const cancel = useTelnyxStore((s) => s.cancelPowerDialer);

  if (!pd) return null;
  const current = pd.leads[pd.currentIndex];
  const remaining = pd.leads.length - pd.currentIndex - 1;

  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-40 card px-4 py-2.5 shadow-card flex items-center gap-4">
      <div className="flex items-center gap-2 text-sm">
        <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
        <span className="font-medium">Power dialer</span>
        <span className="text-muted">
          · {pd.currentIndex + 1}/{pd.leads.length}
          {current?.name && <span className="ml-1">· {current.name}</span>}
          {remaining > 0 && <span className="ml-1">· {remaining} left</span>}
        </span>
      </div>
      <button
        onClick={() => {
          if (confirm(`Cancel power dialer? ${remaining} leads remaining.`)) cancel();
        }}
        className="text-muted hover:text-danger"
        title="Cancel"
      >
        <X size={16} />
      </button>
    </div>
  );
}
