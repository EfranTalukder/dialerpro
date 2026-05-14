"use client";

import { LogOut } from "lucide-react";
import { useTelnyxStore } from "@/lib/telnyx-store";
import { cn } from "@/lib/utils";

export default function MobileHeader() {
  const ready = useTelnyxStore((s) => s.ready);
  const registering = useTelnyxStore((s) => s.registering);

  return (
    <header className="md:hidden sticky top-0 z-20 bg-bg/80 backdrop-blur border-b border-border px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <h1 className="text-sm font-semibold tracking-tight">Pro Dialer</h1>
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full",
            ready
              ? "bg-success"
              : registering
                ? "bg-warning animate-pulse"
                : "bg-danger",
          )}
          title={ready ? "Registered" : "Offline"}
        />
      </div>
      <button
        type="button"
        onClick={async () => {
          await fetch("/api/auth/logout", { method: "POST" });
          window.location.href = "/login";
        }}
        className="text-muted hover:text-text p-1"
        aria-label="Log out"
      >
        <LogOut size={16} />
      </button>
    </header>
  );
}
