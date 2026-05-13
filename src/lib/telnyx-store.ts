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

type Store = {
  ready: boolean;
  registering: boolean;
  registrationError: string | null;
  selectedFromNumber: string | null;
  numbers: { id: number; e164: string; label: string | null }[];
  activeCall: ActiveCall | null;
  setReady: (b: boolean) => void;
  setRegistering: (b: boolean) => void;
  setRegistrationError: (e: string | null) => void;
  setNumbers: (n: { id: number; e164: string; label: string | null }[]) => void;
  setSelectedFromNumber: (n: string | null) => void;
  setActiveCall: (c: ActiveCall | null) => void;
  updateActiveCall: (patch: Partial<ActiveCall>) => void;
};

export const useTelnyxStore = create<Store>((set, get) => ({
  ready: false,
  registering: false,
  registrationError: null,
  selectedFromNumber: null,
  numbers: [],
  activeCall: null,
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
}));
