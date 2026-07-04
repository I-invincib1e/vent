/**
 * In-memory registry of active/pending call sessions, keyed by Twilio CallSid.
 * Lets the outbound-call trigger pass a custom persona/context into the
 * WebSocket stream handler once Twilio connects the media stream for that call.
 *
 * Note: this is process-local state. Fine for a single-instance deployment;
 * swap for Redis/DB-backed storage if you scale to multiple instances.
 */
export type CallSession = {
  callSid: string;
  direction: "inbound" | "outbound";
  persona?: string;
  dbCallId?: number;
  webhookUrl?: string;
};

const sessions = new Map<string, CallSession>();

export const sessionStore = {
  set(callSid: string, session: CallSession) {
    sessions.set(callSid, session);
  },
  get(callSid: string) {
    return sessions.get(callSid);
  },
  update(callSid: string, patch: Partial<CallSession>) {
    const existing = sessions.get(callSid);
    if (existing) sessions.set(callSid, { ...existing, ...patch });
  },
  delete(callSid: string) {
    sessions.delete(callSid);
  },
};
