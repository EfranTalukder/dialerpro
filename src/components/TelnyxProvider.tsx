"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { TelnyxRTC } from "@telnyx/webrtc";
import { pickRotatedNumber, useTelnyxStore } from "@/lib/telnyx-store";
import { toE164 } from "@/lib/utils";

type TelnyxCall = {
  id: string;
  remoteCallerNumber?: string;
  remoteStream?: MediaStream;
  options?: { destinationNumber?: string; callerNumber?: string };
  hangup: () => void;
  answer: () => void;
  hold?: () => void;
  unhold?: () => void;
  muteAudio?: () => void;
  unmuteAudio?: () => void;
  dtmf?: (digit: string) => void;
  state?: string;
};

type Ctx = {
  client: TelnyxRTC | null;
  startCall: (
    destination: string,
    opts?: { fromNumber?: string; leadId?: string | null },
  ) => Promise<void>;
  hangup: () => void;
  toggleMute: () => void;
  toggleHold: () => void;
  sendDTMF: (digit: string) => void;
  answer: () => void;
};

const TelnyxContext = createContext<Ctx | null>(null);

export function useTelnyx() {
  const ctx = useContext(TelnyxContext);
  if (!ctx) throw new Error("TelnyxProvider missing");
  return ctx;
}

export function TelnyxProvider({ children }: { children: React.ReactNode }) {
  const [client, setClient] = useState<TelnyxRTC | null>(null);
  const currentCall = useRef<TelnyxCall | null>(null);
  const currentLeadId = useRef<string | null>(null);
  const localCallRowId = useRef<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const {
    setReady,
    setRegistering,
    setRegistrationError,
    setNumbers,
    setActiveCall,
    updateActiveCall,
    selectedFromNumber,
  } = useTelnyxStore();

  useEffect(() => {
    let canceled = false;
    let rtc: TelnyxRTC | null = null;

    async function bootstrap() {
      setRegistering(true);
      setRegistrationError(null);
      try {
        const [credsRes, numsRes] = await Promise.all([
          fetch("/api/telnyx/credentials"),
          fetch("/api/numbers"),
        ]);
        if (!credsRes.ok) throw new Error("creds_fetch_failed");
        const creds = await credsRes.json();
        const nums = numsRes.ok ? await numsRes.json() : [];
        if (canceled) return;
        setNumbers(nums.map((n: { id: number; e164: string; label: string | null }) => n));

        rtc = new TelnyxRTC({ login: creds.login, password: creds.password });

        rtc.on("telnyx.ready", () => {
          if (canceled) return;
          setReady(true);
          setRegistering(false);
        });

        rtc.on("telnyx.error", (err: unknown) => {
          console.error("telnyx.error", err);
          if (canceled) return;
          setRegistrationError(String((err as Error)?.message ?? err));
          setRegistering(false);
        });

        rtc.on("telnyx.socket.close", () => {
          if (canceled) return;
          setReady(false);
        });

        rtc.on("telnyx.notification", (n: { type: string; call?: TelnyxCall }) => {
          if (n.type !== "callUpdate" || !n.call) return;
          const call = n.call;
          const state = (call.state ?? "").toLowerCase();
          currentCall.current = call;

          if (state === "ringing" || state === "trying" || state === "new") {
            const remote =
              call.remoteCallerNumber ?? call.options?.destinationNumber ?? "unknown";
            const local =
              call.options?.callerNumber ?? selectedFromNumber ?? null;
            const dir: "outbound" | "inbound" = call.options?.destinationNumber
              ? "outbound"
              : "inbound";
            setActiveCall({
              id: call.id,
              direction: dir,
              remote,
              localNumber: local,
              startedAt: Date.now(),
              state: dir === "outbound" ? "connecting" : "ringing",
              muted: false,
            });
          } else if (state === "active") {
            updateActiveCall({ state: "active" });
            if (call.remoteStream && audioRef.current) {
              audioRef.current.srcObject = call.remoteStream;
              audioRef.current.play().catch((e) => console.warn("audio play failed", e));
            }
          } else if (state === "held") {
            updateActiveCall({ state: "held" });
          } else if (state === "hangup" || state === "destroy") {
            updateActiveCall({ state: "ended" });
            if (audioRef.current) {
              audioRef.current.srcObject = null;
            }
            const rowId = localCallRowId.current;
            const remoteForDisp =
              call.remoteCallerNumber ?? call.options?.destinationNumber ?? "";
            const leadForDisp = currentLeadId.current;
            setTimeout(() => setActiveCall(null), 800);
            if (rowId) {
              useTelnyxStore.getState().setPendingDisposition({
                callRowId: rowId,
                remote: remoteForDisp,
                leadId: leadForDisp,
                endedAt: Date.now(),
              });
            }
            currentCall.current = null;
            currentLeadId.current = null;
            localCallRowId.current = null;
          }
        });

        rtc.connect();
        setClient(rtc);
      } catch (e) {
        if (canceled) return;
        setRegistrationError(String((e as Error)?.message ?? e));
        setRegistering(false);
      }
    }

    bootstrap();
    return () => {
      canceled = true;
      try {
        rtc?.disconnect();
      } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startCall: Ctx["startCall"] = async (destination, opts) => {
    if (!client) throw new Error("client_not_ready");
    const to = toE164(destination);
    const state = useTelnyxStore.getState();
    let from = opts?.fromNumber ?? state.selectedFromNumber ?? undefined;
    if (state.autoRotation.enabled && !opts?.fromNumber && state.numbers.length > 0) {
      const rotated = pickRotatedNumber(state.numbers, state.autoRotation.mode);
      if (rotated) {
        from = rotated;
        state.setSelectedFromNumber(rotated);
      }
    }
    if (!from) throw new Error("no_from_number_selected");
    currentLeadId.current = opts?.leadId ?? null;

    try {
      const r = await fetch("/api/calls", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          direction: "outbound",
          fromNumber: from,
          toNumber: to,
          leadId: opts?.leadId ?? null,
        }),
      });
      if (r.ok) {
        const row = await r.json();
        localCallRowId.current = row.id;
      }
    } catch {}

    const call = (client as unknown as {
      newCall: (o: { destinationNumber: string; callerNumber: string }) => TelnyxCall;
    }).newCall({
      destinationNumber: to,
      callerNumber: from,
    });
    currentCall.current = call;
  };

  const ctx: Ctx = {
    client,
    startCall,
    hangup: () => currentCall.current?.hangup(),
    answer: () => currentCall.current?.answer(),
    toggleMute: () => {
      const c = currentCall.current;
      if (!c) return;
      const active = useTelnyxStore.getState().activeCall;
      if (active?.muted) {
        c.unmuteAudio?.();
        updateActiveCall({ muted: false });
      } else {
        c.muteAudio?.();
        updateActiveCall({ muted: true });
      }
    },
    toggleHold: () => {
      const c = currentCall.current;
      if (!c) return;
      const active = useTelnyxStore.getState().activeCall;
      if (active?.state === "held") {
        c.unhold?.();
      } else {
        c.hold?.();
      }
    },
    sendDTMF: (digit) => currentCall.current?.dtmf?.(digit),
  };

  return (
    <TelnyxContext.Provider value={ctx}>
      {/* Hidden audio element for remote call audio */}
      <audio ref={audioRef} autoPlay playsInline style={{ display: "none" }} />
      {children}
    </TelnyxContext.Provider>
  );
}

export function getLocalCallRowId() {
  return null;
}
