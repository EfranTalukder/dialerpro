"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useTelnyxStore } from "@/lib/telnyx-store";
import { cn, fmtPhone } from "@/lib/utils";

export default function NumberPicker() {
  const { numbers, selectedFromNumber, setSelectedFromNumber } = useTelnyxStore();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!(e.target as HTMLElement).closest?.("[data-numpicker]")) setOpen(false);
    }
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  if (numbers.length === 0) {
    return (
      <div className="text-xs text-warning">
        No numbers configured. Add them in Settings.
      </div>
    );
  }

  const current = numbers.find((n) => n.e164 === selectedFromNumber);

  return (
    <div className="relative" data-numpicker>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="w-full flex items-center justify-between bg-elevated border border-border hover:border-muted rounded-lg px-3 py-2.5 transition-colors"
      >
        <div className="flex flex-col items-start min-w-0">
          <span className="text-[10px] uppercase tracking-wider text-muted">From</span>
          <span className="text-sm truncate">
            {current ? fmtPhone(current.e164) : "Select number"}
            {current?.label && (
              <span className="ml-2 text-muted text-xs">· {current.label}</span>
            )}
          </span>
        </div>
        <ChevronDown size={16} className="text-muted" />
      </button>
      {open && (
        <div className="absolute z-20 left-0 right-0 mt-2 card overflow-hidden shadow-card">
          <ul className="max-h-64 overflow-auto">
            {numbers.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFromNumber(n.e164);
                    setOpen(false);
                  }}
                  className={cn(
                    "w-full px-3 py-2 text-left text-sm hover:bg-elevated transition-colors flex items-center justify-between",
                    n.e164 === selectedFromNumber && "bg-elevated",
                  )}
                >
                  <span>{fmtPhone(n.e164)}</span>
                  {n.label && <span className="text-xs text-muted">{n.label}</span>}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
