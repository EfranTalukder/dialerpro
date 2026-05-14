"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Phone, Users, Clock, AudioLines } from "lucide-react";
import { useCallbackBadge } from "./Nav";
import { useTelnyxStore } from "@/lib/telnyx-store";
import { cn } from "@/lib/utils";

const MOBILE_ITEMS = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/dialer", label: "Dial", icon: Phone },
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/callbacks", label: "Callbacks", icon: Clock, badgeKey: "callbacks" as const },
  { href: "/recordings", label: "Rec", icon: AudioLines },
] as const;

export default function MobileNav() {
  const pathname = usePathname();
  const cb = useCallbackBadge();
  const activeCall = useTelnyxStore((s) => s.activeCall);

  return (
    <nav
      className={cn(
        "md:hidden fixed left-0 right-0 z-30 bg-surface border-t border-border",
        "pb-[env(safe-area-inset-bottom)]",
        activeCall ? "bottom-[136px]" : "bottom-0",
      )}
    >
      <div className="grid grid-cols-5">
        {MOBILE_ITEMS.map((it) => {
          const Icon = it.icon;
          const active = pathname.startsWith(it.href);
          const showBadge =
            "badgeKey" in it && it.badgeKey === "callbacks" && cb.total > 0;
          return (
            <Link
              key={it.href}
              href={it.href}
              className={cn(
                "flex flex-col items-center justify-center py-2.5 gap-0.5 relative transition-colors",
                active ? "text-accent" : "text-muted",
              )}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 2} />
              <span className="text-[10px] tracking-tight">{it.label}</span>
              {showBadge && (
                <span
                  className={cn(
                    "absolute top-1.5 right-[calc(50%-18px)] text-[9px] min-w-[16px] h-4 px-1 rounded-full font-medium tabular-nums grid place-items-center",
                    cb.overdue > 0
                      ? "bg-danger text-white"
                      : "bg-elevated text-text",
                  )}
                >
                  {cb.total}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
