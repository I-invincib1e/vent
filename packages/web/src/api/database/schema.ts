import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const calls = sqliteTable("calls", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  twilioCallSid: text("twilio_call_sid").notNull().unique(),
  direction: text("direction", { enum: ["inbound", "outbound"] }).notNull(),
  fromNumber: text("from_number").notNull(),
  toNumber: text("to_number").notNull(),
  status: text("status").notNull().default("in-progress"),
  agentPersona: text("agent_persona"),
  recordingUrl: text("recording_url"),
  webhookUrl: text("webhook_url"),
  disposition: text("disposition"),
  sttReconnectCount: integer("stt_reconnect_count").default(0),
  /**
   * Structured call state — deterministic key/value facts the agent has
   * confirmed during this call (email, order ID, name, etc), captured via
   * the `captureField` tool (see voice/tools/captureField.ts). This is the
   * single source of truth the agent reads back each turn, separate from
   * the raw transcript — fixes the "asks for the same info twice" failure
   * mode that plain transcript/summary-based memory has. See ADR-012.
   */
  capturedState: text("captured_state", { mode: "json" }).$type<Record<string, string>>().default({}),
  startedAt: integer("started_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  endedAt: integer("ended_at", { mode: "timestamp" }),
});

/**
 * Per-call latency breakdown — one row per call, filled in as each metric
 * becomes available during the call and finalized at call end (see
 * stream.ts's finalizeCall). All three columns are nullable: a call that
 * ended before a given stage was reached (or shipped before this table
 * existed) simply has no value for it, not a zero or an error. See ADR-022.
 */
export const callLatency = sqliteTable("call_latency", {
  callId: integer("call_id")
    .primaryKey()
    .references(() => calls.id, { onDelete: "cascade" }),
  /** Time from opening the Deepgram STT socket to it reporting ready (first connect only, not reconnects). */
  sttConnectMs: integer("stt_connect_ms"),
  /** Time-to-first-token from the LLM, captured on the first turn that produces one (usually the greeting). */
  llmTtftMs: integer("llm_ttft_ms"),
  /** Time from sending text to the TTS provider to receiving the first audio chunk back, first turn only. */
  ttsFirstByteMs: integer("tts_first_byte_ms"),
  capturedAt: integer("captured_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/**
 * Rolling per-phone-number memory, alongside (not replacing) the per-call
 * `capturedState` engine — see ADR-023. One row per phone number: a flat
 * key/value overlay of facts learned across every call from/to that number,
 * merged (not replaced) on each call, so a returning caller doesn't start
 * from zero. Deliberately not a full call-history log — keeps prompt-
 * injection cost bounded no matter how many times someone's called.
 */
export const callerMemory = sqliteTable("caller_memory", {
  phoneNumber: text("phone_number").primaryKey(),
  facts: text("facts", { mode: "json" }).$type<Record<string, string>>().notNull().default({}),
  lastCallId: integer("last_call_id").references(() => calls.id, { onDelete: "set null" }),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/**
 * Multi-user dashboard auth (ADR-025) — labeled API keys, not real accounts.
 * The legacy single `ADMIN_API_KEY` env var keeps working unchanged and
 * forever (it's the bootstrap key); this table is an additive way to hand
 * out additional, individually revocable keys (e.g. "Jane's laptop", "n8n
 * webhook") without rotating the one shared secret for everyone. Only the
 * hash is ever stored — the plaintext key is shown exactly once, at
 * creation, and is not retrievable again.
 */
export const adminKeys = sqliteTable("admin_keys", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  label: text("label").notNull(),
  keyHash: text("key_hash").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  lastUsedAt: integer("last_used_at", { mode: "timestamp" }),
  revokedAt: integer("revoked_at", { mode: "timestamp" }),
});

export const transcripts = sqliteTable("transcripts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  callId: integer("call_id")
    .notNull()
    .references(() => calls.id, { onDelete: "cascade" }),
  role: text("role", { enum: ["caller", "agent"] }).notNull(),
  text: text("text").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const toolCalls = sqliteTable("tool_calls", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  callId: integer("call_id")
    .notNull()
    .references(() => calls.id, { onDelete: "cascade" }),
  toolName: text("tool_name").notNull(),
  input: text("input", { mode: "json" }),
  output: text("output", { mode: "json" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/**
 * Internal Do-Not-Call list, checked automatically before every outbound call
 * (enforced via the @openvent/compliance package, see voice/compliance/adapters.ts). Numbers land here either manually
 * (POST /api/voice/dnc) or automatically via a workflow action (e.g. the
 * agent marks a call "not-interested" and a workflow adds the number here).
 */
export const doNotCall = sqliteTable("do_not_call", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  phoneNumber: text("phone_number").notNull().unique(),
  reason: text("reason"),
  source: text("source", { enum: ["manual", "agent", "national-registry"] }).default("manual"),
  addedAt: integer("added_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/**
 * Scheduled follow-up calls/actions driven by workflow configs (see
 * voice/workflows/) — e.g. a "no-answer" outcome scheduling a retry call
 * later. Polled periodically by a background sweep.
 */
export const scheduledCalls = sqliteTable("scheduled_calls", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  toNumber: text("to_number").notNull(),
  workflowName: text("workflow_name").notNull(),
  persona: text("persona"),
  webhookUrl: text("webhook_url"),
  attempt: integer("attempt").notNull().default(1),
  maxAttempts: integer("max_attempts").notNull().default(1),
  runAt: integer("run_at", { mode: "timestamp" }).notNull(),
  status: text("status", { enum: ["pending", "claimed", "executed", "canceled", "failed"] })
    .notNull()
    .default("pending"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});
