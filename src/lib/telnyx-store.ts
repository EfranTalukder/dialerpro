"use client";

import { create } from "zustand";

export type CallState =
  | "idle"
  | "connecting"
  | "ringing"
  | "active"
  | "held"
  | "ended"
  | "error";

export type ActiveCall = {
  id: string;
  direction: "outbound" | "inbound";
  remote: string;
  localNumber: string | null;
  startedAt: number;
  state: CallState;
  muted: boolean;
};

export type PendingDisposition = {
  callRowId: string;
  remote: string;
  leadId: string | null;
  endedAt: number;
};

export type RotationMode = "round-robin" | "random";

export type AutoRotation = {
  enabled: boolean;
  mode: RotationMode;
};

export type PowerDialerQueue = {
  leads: { id: string; phone: string; name: string | null }[];
  currentIndex: number;
};

type Store = {
  ready: boolean;
  registering: boolean;
  registrationError: string | null;
  selectedFromNumber: string | null;
  numbers: { id: number; e164: string; label: string | null }[];
  activeCall: ActiveCall | null;
  pendingDisposition: PendingDisposition | null;
  autoRotation: AutoRotation;
  powerDialer: PowerDialerQueue | null;

  setReady: (b: boolean) => void;
  setRegistering: (b: boolean) => void;
  setRegistrationError: (e: string | null) => void;
  setNumbers: (n: { id: number; e164: string; label: string | null }[]) => void;
  setSelectedFromNumber: (n: string | null) => void;
  setActiveCall: (c: ActiveCall | null) => void;
  updateActiveCall: (patch: Partial<ActiveCall>) => void;
  setPendingDisposition: (d: PendingDisposition | null) => void;
  setAutoRotation: (a: AutoRotation) => void;
  startPowerDialer: (
    leads: { id: string; phone: string; name: string | null }[],
  ) => void;
  advancePowerDialer: () => { id: string; phone: string; name: string | null } | null;
  cancelPowerDialer: () => void;
};

const AUTO_ROTATION_KEY = "pd_auto_rotation";
const RR_INDEX_KEY = "pd_rr_index";

function loadAutoRotation(): AutoRotation {
  if (typeof window === "undefined") return { enabled: false, mode: "round-robin" };
  try {
    const raw = localStorage.getItem(AUTO_ROTATION_KEY);
    if (!raw) return { enabled: false, mode: "round-robin" };
    return JSON.parse(raw) as AutoRotation;
  } catch {
    return { enabled: false, mode: "round-robin" };
  }
}

function saveAutoRotation(a: AutoRotation) {
  if (typeof window === "undefined") return;
  localStorage.setItem(AUTO_ROTATION_KEY, JSON.stringify(a));
}

export function pickRotatedNumber(
  numbers: { e164: string }[],
  mode: RotationMode,
): string | null {
  if (numbers.length === 0) return null;
  if (numbers.length === 1) return numbers[0].e164;

  if (mode === "random") {
    return numbers[Math.floor(Math.random() * numbers.length)].e164;
  }

  let idx = 0;
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem(RR_INDEX_KEY) : null;
    if (raw) idx = (parseInt(raw, 10) + 1) % numbers.length;
  } catch {}
  if (typeof window !== "undefined") localStorage.setItem(RR_INDEX_KEY, String(idx));
  return numbers[idx].e164;
}

export const useTelnyxStore = create<Store>((set, get) => ({
  ready: false,
  registering: false,
  registrationError: null,
  selectedFromNumber: null,
  numbers: [],
  activeCall: null,
  pendingDisposition: null,
  autoRotation: loadAutoRotation(),
  powerDialer: null,

  setReady: (b) => set({ ready: b }),
  setRegistering: (b) => set({ registering: b }),
  setRegistrationError: (e) => set({ registrationError: e }),
  setNumbers: (n) => {
    const cur = get().selectedFromNumber;
    set({
      numbers: n,
      selectedFromNumber: cur && n.some((x) => x.e164 === cur) ? cur : n[0]?.e164 ?? null,
    });
  },
  setSelectedFromNumber: (n) => set({ selectedFromNumber: n }),
  setActiveCall: (c) => set({ activeCall: c }),
  updateActiveCall: (patch) => {
    const cur = get().activeCall;
    if (!cur) return;
    set({ activeCall: { ...cur, ...patch } });
  },
  setPendingDisposition: (d) => set({ pendingDisposition: d }),
  setAutoRotation: (a) => {
    saveAutoRotation(a);
    set({ autoRotation: a });
  },
  startPowerDialer: (leads) =>
    set({ powerDialer: { leads, currentIndex: 0 } }),
  advancePowerDialer: () => {
    const cur = get().powerDialer;
    if (!cur) return null;
    const next = cur.currentIndex + 1;
    if (next >= cur.leads.length) {
      set({ powerDialer: null });
      return null;
    }
    set({ powerDialer: { ...cur, currentIndex: next } });
    return cur.leads[next];
  },
  cancelPowerDialer: () => set({ powerDialer: null }),
}));
