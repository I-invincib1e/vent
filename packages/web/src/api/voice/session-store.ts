/**
 * In-memory registry of active/pending call sessions, keyed by Twilio CallSid.
 * Lets the outbound-call trigger pass a custom persona/context into the
 * WebSocket stream handler once Twilio connects the media stream for that call.
 *
 * Note: this is process-local state. Fine for a single-instance deployment;
 * swap for Redis/DB-backed storage if you scale to multiple instances.
 *
 * A background sweep drops stale sessions (default: older than 1 hour) so a
 * call that never reaches Twilio's `stop` event — crashed leg, dropped
 * network, etc — doesn't leak memory forever.
 */
export type CallSession = {
  callSid: string;
  direction: "inbound" | "outbound";
  persona?: string;
  dbCallId?: number;
  webhookUrl?: string;
  createdAt: number;
  /** Per-call overrides — let a single call use a different provider than the global default. */
  ttsProvider?: "elevenlabs" | "cartesia";
  llmProvider?: "gateway" | "groq";
  maxDurationSeconds?: number;
  /** Set when this call was placed by the workflow scheduler (a retry) — lets the
   * workflow engine enforce maxRetries instead of retrying forever. */
  workflowName?: string;
  workflowAttempt?: number;
  /**
   * Structured, deterministic call state — facts captured via the
   * `captureField` tool during this call (email, order ID, name, etc).
   * This is read back into the system prompt every turn as ground truth
   * (see agent.ts) and persisted to `calls.capturedState` on each update
   * and at call end. Mirrors, and is the in-memory source of truth for,
   * the DB column — see ADR-012.
   */
  capturedState?: Record<string, string>;
};

const SESSION_TTL_MS = 60 * 60 * 1000; // 1 hour
const SWEEP_INTERVAL_MS = 10 * 60 * 1000; // every 10 minutes

const sessions = new Map<string, CallSession>();

export const sessionStore = {
  set(callSid: string, session: Omit<CallSession, "createdAt">) {
    sessions.set(callSid, { ...session, createdAt: Date.now() });
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
  size() {
    return sessions.size;
  },
};

function sweep() {
  const cutoff = Date.now() - SESSION_TTL_MS;
  for (const [callSid, session] of sessions) {
    if (session.createdAt < cutoff) {
      console.warn(`[session-store] dropping stale session for ${callSid} (age > 1h)`);
      sessions.delete(callSid);
    }
  }
}

// Only run the sweep under the real server process, not during typecheck/build/tests.
if (typeof setInterval !== "undefined") {
  setInterval(sweep, SWEEP_INTERVAL_MS).unref?.();
}
