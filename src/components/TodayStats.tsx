"use client";

import { useEffect, useState } from "react";
import { useTelnyxStore } from "@/lib/telnyx-store";
import { fmtDuration } from "@/lib/utils";

type Stats = {
  total: number;
  connected: number;
  totalDurationSec: number;
  interested: number;
  notInterested: number;
  voicemail: number;
  callback: number;
  noAnswer: number;
  wrongNumber: number;
};

export default function TodayStats() {
  const [s, setS] = useState<Stats | null>(null);
  const pending = useTelnyxStore((s) => s.pendingDisposition);
  const active = useTelnyxStore((s) => s.activeCall);

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const r = await fetch("/api/stats/today");
        if (!r.ok) return;
        const j = (await r.json()) as Stats | null;
        if (alive) setS(j);
      } catch {}
    }
    load();
    // refresh when a call ends or a disposition saves
  }, [active?.state, pending]);

  if (!s) return null;

  const connectRate = s.total > 0 ? Math.round((s.connected / s.total) * 100) : 0;

  return (
    <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-2">
      <Stat label="Calls today" value={s.total} />
      <Stat label="Connected" value={s.connected} sub={`${connectRate}%`} />
      <Stat label="Talk time" value={fmtDuration(s.totalDurationSec)} />
      <Stat
        label="Outcomes"
        value={
          <span className="text-sm">
            <span className="text-success">{s.interested}</span>
            <span className="text-muted mx-1">·</span>
            <span className="text-warning">{s.callback}</span>
            <span className="text-muted mx-1">·</span>
            <span className="text-muted">{s.voicemail + s.noAnswer}</span>
          </span>
        }
        sub="int · cb · vm/na"
      />
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
}) {
  return (
    <div className="card p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted">{label}</div>
      <div className="mt-1 text-lg font-semibold tabular-nums">{value}</div>
      {sub && <div className="text-[10px] text-muted mt-0.5">{sub}</div>}
    </div>
  );
}
