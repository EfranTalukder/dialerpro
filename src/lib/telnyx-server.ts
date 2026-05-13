import Telnyx from "telnyx";

let _client: ReturnType<typeof Telnyx> | null = null;

export function telnyx() {
  if (_client) return _client;
  const key = process.env.TELNYX_API_KEY;
  if (!key) throw new Error("TELNYX_API_KEY not set");
  _client = Telnyx(key);
  return _client;
}

export type TelnyxWebhookPayload = {
  data: {
    event_type: string;
    id: string;
    occurred_at: string;
    payload: Record<string, unknown> & {
      call_control_id?: string;
      call_leg_id?: string;
      call_session_id?: string;
      from?: string;
      to?: string;
      direction?: "incoming" | "outgoing";
      recording_id?: string;
      recording_urls?: { mp3?: string; wav?: string };
      duration_sec?: number;
    };
  };
  meta: { attempt: number; delivered_to: string };
};
