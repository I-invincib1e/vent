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
  startedAt: integer("started_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  endedAt: integer("ended_at", { mode: "timestamp" }),
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
 * (see voice/compliance/dnc.ts). Numbers land here either manually
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
  status: text("status", { enum: ["pending", "executed", "canceled", "failed"] })
    .notNull()
    .default("pending"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});
