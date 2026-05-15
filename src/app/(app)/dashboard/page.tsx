"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
      ArrowRight,
      Clock,
      Phone,
      PhoneCall,
      Timer,
      TrendingUp,
      Users,
      ShieldCheck,
      ShieldAlert,
      ShieldX,
      BarChart2,
} from "lucide-react";
import { fmtDuration, fmtPhone } from "@/lib/utils";

type NumberHealth = {
      fromNumber: string;
      total: number;
      answered: number;
      avgDuration: number;
      lastUsed: string;
      recentTotal: number;
      recentAnswered: number;
};

type Stats = {
      today: { total: number; durationSum: number; answered: number };
      week: { total: number; durationSum: number; answered: number };
      month: { total: number; durationSum: number; answered: number };
      dispositions: { disposition: string | null; count: number }[];
      byNumber: { fromNumber: string; count: number; totalDuration: number }[];
      dailyTrend: { day: string; count: number; answered: number }[];
      numberHealth: NumberHealth[];
};

const DISP_COLORS: Record<string, string> = {
      interested: "bg-success",
      callback: "bg-warning",
      voicemail: "bg-muted",
      no_answer: "bg-border",
      wrong_number: "bg-danger",
      not_interested: "bg-danger/60",
};

const DISP_LABELS: Record<string, string> = {
      interested: "Interested",
      not_interested: "Not interested",
      voicemail: "Voicemail",
      callback: "Callback",
      wrong_number: "Wrong number",
      no_answer: "No answer",
};

function getHealthStatus(h: NumberHealth): {
      label: string;
      color: string;
      icon: "green" | "yellow" | "red";
      reason: string;
} {
      if (h.total < 5) {
              return { label: "New", color: "text-muted", icon: "green", reason: "Not enough call history yet" };
      }
      const baseTotal = h.recentTotal >= 5 ? h.recentTotal : h.total;
      const baseAnswered = h.recentTotal >= 5 ? h.recentAnswered : h.answered;
      const answerRate = baseTotal > 0 ? (baseAnswered / baseTotal) * 100 : 0;
      if (answerRate >= 35) {
              return { label: "Healthy", color: "text-success", icon: "green", reason: `${Math.round(answerRate)}% answer rate â not flagged` };
      } else if (answerRate >= 15) {
              return { label: "Watch", color: "text-warning", icon: "yellow", reason: `${Math.round(answerRate)}% answer rate â may be flagged` };
      } else {
              return { label: "Likely Spam", color: "text-danger", icon: "red", reason: `${Math.round(answerRate)}% answer rate â likely marked spam` };
      }
}

export default function DashboardPage() {
      const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
          let alive = true;
          async function load() {
                    const r = await fetch("/api/stats");
                    if (!r.ok) return;
                    const j = await r.json();
                    if (alive) setStats(j);
          }
          load();
          const t = setInterval(load, 30_000);
          return () => { alive = false; clearInterval(t); };
  }, []);

  if (!stats) return <div className="p-6 text-sm text-muted">Loadingâ¦</div>;
    
      const connectRate = stats.week.total > 0 ? Math.round((stats.week.answered / stats.week.total) * 100) : 0;
      const dispTotal = stats.dispositions.reduce((s, d) => s + d.count, 0);
    
      return (
              <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto pb-24 md:pb-8">
                    <header className="flex items-end justify-between gap-4 flex-wrap">
                            <div>
                                      <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Dashboard</h1>
                                      <p className="text-sm text-muted mt-1">
                                          {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
                                      </p>
                            </div>
                            <Link href="/dialer" className="btn btn-primary"><Phone size={16} /> Start dialing</Link>
                    </header>
              
                    <section className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3">
                            <StatCard icon={<PhoneCall size={16} />} label="Calls today" value={stats.today.total.toString()} sub={`${stats.today.answered} answered`} />
                            <StatCard icon={<Timer size={16} />} label="Talk time today" value={fmtDuration(stats.today.durationSum)} sub={stats.today.total > 0 ? `avg ${fmtDuration(Math.round(stats.today.durationSum / stats.today.total))}/call` : "â"} />
                            <StatCard icon={<TrendingUp size={16} />} label="Connect rate (7d)" value={`${connectRate}%`} sub={`${stats.week.answered}/${stats.week.total} calls`} />
                            <StatCard icon={<Users size={16} />} label="Calls this week" value={stats.week.total.toString()} sub={`${fmtDuration(stats.week.durationSum)} total talk`} />
                    </section>
              
                    <section className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
                            <div className="lg:col-span-2 card p-5">
                                      <div className="flex items-center justify-between">
                                                  <h2 className="text-sm font-medium">Last 7 days</h2>
                                                  <span className="text-xs text-muted">calls / answered</span>
                                      </div>
                                      <DailyTrend rows={stats.dailyTrend} />
                            </div>
                            <div className="card p-5">
                                      <h2 className="text-sm font-medium mb-3">Dispositions (7d)</h2>
                                {dispTotal === 0 ? (
                              <p className="text-xs text-muted">No dispositions yet. Tag your calls after hangup.</p>
                            ) : (
                              <div className="space-y-2">
                                  {stats.dispositions.map((d) => {
                                                  const key = d.disposition ?? "untagged";
                                                  const pct = dispTotal > 0 ? (d.count / dispTotal) * 100 : 0;
                                                  return (
                                                                        <div key={key}>
                                                                                            <div className="flex justify-between text-xs">
                                                                                                                  <span>{DISP_LABELS[key] ?? key.replace(/_/g, " ")}</span>
                                                                                                                  <span className="text-muted tabular-nums">{d.count}</span>
                                                                                                </div>
                                                                                            <div className="mt-1 h-1.5 bg-elevated rounded-full overflow-hidden">
                                                                                                                  <div className={`h-full ${DISP_COLORS[key] ?? "bg-accent"}`} style={{ width: `${pct}%` }} />
                                                                                                </div>
                                                                        </div>
                                                                      );
                              })}
                              </div>
                                      )}
                            </div>
                    </section>
              
                  {/* Number Health */}
                    <section className="mt-6 card p-5">
                            <div className="flex items-center gap-2 mb-1">
                                      <BarChart2 size={15} className="text-accent" />
                                      <h2 className="text-sm font-medium">Number Health</h2>
                                      <span className="text-xs text-muted ml-1">â based on your answer rates</span>
                            </div>
                            <p className="text-xs text-muted mb-4">
                                      Low answer rate = likely flagged as spam. Green â¥35% Â· Yellow 15â34% Â· Red &lt;15%
                            </p>
                        {(stats.numberHealth ?? []).length === 0 ? (
                            <p className="text-xs text-muted">No outbound calls yet.</p>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {(stats.numberHealth ?? []).map((h) => {
                                              const health = getHealthStatus(h);
                                              const baseTotal = h.recentTotal >= 5 ? h.recentTotal : h.total;
                                              const baseAnswered = h.recentTotal >= 5 ? h.recentAnswered : h.answered;
                                              const answerRate = baseTotal > 0 ? Math.round((baseAnswered / baseTotal) * 100) : 0;
                                              const barColor = health.icon === "green" ? "bg-success" : health.icon === "yellow" ? "bg-warning" : "bg-danger";
                                              return (
                                                                  <div key={h.fromNumber} className="rounded-lg border border-border bg-elevated p-4 space-y-3">
                                                                                    <div className="flex items-start justify-between gap-2">
                                                                                                        <span className="font-mono text-sm font-medium truncate">{fmtPhone(h.fromNumber)}</span>
                                                                                                        <div className={`flex items-center gap-1 text-xs font-medium shrink-0 ${health.color}`}>
                                                                                                            {health.icon === "green" ? <ShieldCheck size={13} /> : health.icon === "yellow" ? <ShieldAlert size={13} /> : <ShieldX size={13} />}
                                                                                                            {health.label}
                                                                                                            </div>
                                                                                        </div>
                                                                                    <div>
                                                                                                        <div className="flex justify-between text-xs text-muted mb-1">
                                                                                                                              <span>Answer rate</span>
                                                                                                                              <span className="tabular-nums font-medium">{answerRate}%</span>
                                                                                                            </div>
                                                                                                        <div className="h-1.5 bg-border rounded-full overflow-hidden">
                                                                                                                              <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${answerRate}%` }} />
                                                                                                            </div>
                                                                                                        <p className="text-[11px] text-muted mt-1">{health.reason}</p>
                                                                                        </div>
                                                                                    <div className="flex items-center gap-3 text-xs text-muted border-t border-border pt-2">
                                                                                                        <span className="flex items-center gap-1"><PhoneCall size={11} /><span className="tabular-nums">{h.total} calls</span></span>
                                                                                                        <span className="flex items-center gap-1"><Clock size={11} /><span className="tabular-nums">{fmtDuration(h.avgDuration)} avg</span></span>
                                                                                                        <span className="tabular-nums ml-auto">7d: {h.recentAnswered}/{h.recentTotal}</span>
                                                                                        </div>
                                                                  </div>
                                                                );
                            })}
                            </div>
                            )}
                    </section>
              
                    <section className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-2">
                            <QuickLink href="/dialer" label="Dialer" />
                            <QuickLink href="/leads" label="Leads" />
                            <QuickLink href="/callbacks" label="Callbacks" />
                            <QuickLink href="/recordings" label="Recordings" />
                    </section>
              </div>
            );
}

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub: string }) {
      return (
              <div className="card p-4">
                    <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted">{icon}{label}</div>
                    <div className="mt-2 text-2xl font-semibold tabular-nums">{value}</div>
                    <div className="text-xs text-muted mt-0.5">{sub}</div>
              </div>
            );
}

function QuickLink({ href, label }: { href: string; label: string }) {
      return (
              <Link href={href} className="card p-4 flex items-center justify-between hover:border-muted transition-colors">
                    <span className="text-sm font-medium">{label}</span>
                    <ArrowRight size={14} className="text-muted" />
              </Link>
            );
}

function DailyTrend({ rows }: { rows: { day: string; count: number; answered: number }[] }) {
      if (rows.length === 0) return <p className="text-xs text-muted mt-2">No calls in the last 7 days.</p>;
      const max = Math.max(...rows.map((r) => r.count), 1);
      const days = [...Array(7)].map((_, i) => {
              const d = new Date();
              d.setHours(0, 0, 0, 0);
              d.setDate(d.getDate() - (6 - i));
              const key = d.toISOString().slice(0, 10);
              const row = rows.find((r) => r.day === key);
              return { label: d.toLocaleDateString(undefined, { weekday: "short" }), count: row?.count ?? 0, answered: row?.answered ?? 0 };
      });
      return (
              <div className="mt-4 flex items-end gap-2 h-32">
                  {days.map((d, i) => {
                          const h = (d.count / max) * 100;
                          const ansH = d.count > 0 ? (d.answered / d.count) * h : 0;
                          return (
                                        <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                                                    <div className="w-full flex-1 flex items-end">
                                                                  <div className="w-full bg-elevated rounded-t relative overflow-hidden" style={{ height: `${h}%`, minHeight: d.count > 0 ? 4 : 0 }} title={`${d.count} calls, ${d.answered} answered`}>
                                                                                  <div className="absolute bottom-0 left-0 right-0 bg-accent" style={{ height: `${(ansH / Math.max(h, 1)) * 100}%` }} />
                                                                  </div>
                                                    </div>
                                                    <span className="text-[10px] text-muted">{d.label}</span>
                                        </div>
                                      );
              })}
              </div>
            );
}
