"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Phone, Users, AudioLines, Settings2, LogOut } from "lucide-react";
import { useTelnyxStore } from "@/lib/telnyx-store";
import { cn } from "@/lib/utils";

const items = [
  { href: "/dialer", label: "Dialer", icon: Phone },
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/recordings", label: "Recordings", icon: AudioLines },
  { href: "/settings", label: "Settings", icon: Settings2 },
];

export default function Nav() {
  const pathname = usePathname();
  const ready = useTelnyxStore((s) => s.ready);
  const registering = useTelnyxStore((s) => s.registering);
  const err = useTelnyxStore((s) => s.registrationError);

  return (
    <aside className="w-56 shrink-0 border-r border-border bg-surface flex flex-col">
      <div className="px-4 py-5">
        <h2 className="text-base font-semibold tracking-tight">Pro Dialer</h2>
        <div className="mt-2 flex items-center gap-2 text-xs">
          <span
            className={cn(
              "w-2 h-2 rounded-full",
              ready ? "bg-success" : registering ? "bg-warning animate-pulse" : "bg-danger",
            )}
          />
          <span className="text-muted">
            {ready ? "Registered" : registering ? "Connecting…" : err ? "Error" : "Offline"}
          </span>
        </div>
      </div>
      <nav className="flex-1 px-2 space-y-1">
        {items.map((it) => {
          const Icon = it.icon;
          const active = pathname.startsWith(it.href);
          return (
            <Link
              key={it.href}
              href={it.href}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors",
                active ? "bg-elevated text-text" : "text-muted hover:text-text hover:bg-elevated",
              )}
            >
              <Icon size={16} strokeWidth={2} />
              {it.label}
            </Link>
          );
        })}
      </nav>
      <form
        action={async () => {
          await fetch("/api/auth/logout", { method: "POST" });
          window.location.href = "/login";
        }}
        className="p-3"
      >
        <button
          type="button"
          onClick={async () => {
            await fetch("/api/auth/logout", { method: "POST" });
            window.location.href = "/login";
          }}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted hover:text-text hover:bg-elevated transition-colors"
        >
          <LogOut size={16} /> Log out
        </button>
      </form>
    </aside>
  );
}
