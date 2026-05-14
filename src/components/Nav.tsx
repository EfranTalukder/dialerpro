"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  AudioLines,
  Clock,
  LayoutDashboard,
  LogOut,
  Phone,
  Settings2,
  Users,
} from "lucide-react";
import { useTelnyxStore } from "@/lib/telnyx-store";
import { cn } from "@/lib/utils";

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dialer", label: "Dialer", icon: Phone },
  { href: "/leads", label: "Leads", icon: Users },
  {
    href: "/callbacks",
    label: "Callbacks",
    icon: Clock,
    badgeKey: "callbacks" as const,
  },
  { href: "/recordings", label: "Recordings", icon: AudioLines },
  { href: "/settings", label: "Settings", icon: Settings2 },
] as const;

export function useCallbackBadge() {
  const [badge, setBadge] = useState<{ total: number; overdue: number }>({
    total: 0,
    overdue: 0,
  });
  const pathname = usePathname();

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const r = await fetch("/api/callbacks");
        if (!r.ok) return;
        const rows: { callbackAt: string | null }[] = await r.json();
        const now = Date.now();
        const overdue = rows.filter(
          (x) => x.callbackAt && new Date(x.callbackAt).getTime() < now,
        ).length;
        if (alive) setBadge({ total: rows.length, overdue });
      } catch {}
    }
    load();
    const t = setInterval(load, 60_000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [pathname]);

  return badge;
}

export default function Nav() {
  const pathname = usePathname();
  const ready = useTelnyxStore((s) => s.ready);
  const registering = useTelnyxStore((s) => s.registering);
  const err = useTelnyxStore((s) => s.registrationError);
  const callbackBadge = useCallbackBadge();

  return (
    <aside className="hidden md:flex w-56 shrink-0 border-r border-border bg-surface flex-col">
      <div className="px-4 py-5">
        <h2 className="text-base font-semibold tracking-tight">Pro Dialer</h2>
        <div className="mt-2 flex items-center gap-2 text-xs">
          <span
            className={cn(
              "w-2 h-2 rounded-full",
              ready
                ? "bg-success"
                : registering
                  ? "bg-warning animate-pulse"
                  : "bg-danger",
            )}
          />
          <span className="text-muted">
            {ready
              ? "Registered"
              : registering
                ? "Connecting…"
                : err
                  ? "Error"
                  : "Offline"}
          </span>
        </div>
      </div>

      <nav className="flex-1 px-2 space-y-1">
        {NAV_ITEMS.map((it) => {
          const Icon = it.icon;
          const active = pathname.startsWith(it.href);
          const showBadge =
            "badgeKey" in it && it.badgeKey === "callbacks" && callbackBadge.total > 0;
          return (
            <Link
              key={it.href}
              href={it.href}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors",
                active
                  ? "bg-elevated text-text"
                  : "text-muted hover:text-text hover:bg-elevated",
              )}
            >
              <Icon size={16} strokeWidth={2} />
              <span className="flex-1">{it.label}</span>
              {showBadge && (
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded-full font-medium tabular-nums",
                    callbackBadge.overdue > 0
                      ? "bg-danger/20 text-danger"
                      : "bg-elevated text-muted",
                  )}
                >
                  {callbackBadge.total}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-3">
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
      </div>
    </aside>
  );
}
