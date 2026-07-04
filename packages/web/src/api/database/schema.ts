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
