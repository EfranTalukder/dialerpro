"use client";

import Link from "next/link";
import { LogOut, Settings } from "lucide-react";
import { useTelnyxStore } from "@/lib/telnyx-store";
import { cn } from "@/lib/utils";

export default function MobileHeader() {
  const ready = useTelnyxStore((s) => s.ready);
  const registering = useTelnyxStore((s) => s.registering);

  return (
    <header className="md:hidden sticky top-0 z-20 bg-bg/85 backdrop-blur-md border-b border-border px-4 py-3 flex items-center justify-between pt-[max(0.75rem,env(safe-area-inset-top))]">
      <div className="flex items-center gap-2">
        <h1 className="text-sm font-semibold tracking-tight">Dialer Pro</h1>
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
      <div className="flex items-center gap-1">
        <Link
          href="/settings"
          className="text-muted hover:text-text p-2 -m-1 rounded-md"
          aria-label="Settings"
        >
          <Settings size={18} />
        </Link>
        <button
          type="button"
          onClick={async () => {
            await fetch("/api/auth/logout", { method: "POST" });
            window.location.href = "/login";
          }}
          className="text-muted hover:text-text p-2 -m-1 rounded-md"
          aria-label="Log out"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
