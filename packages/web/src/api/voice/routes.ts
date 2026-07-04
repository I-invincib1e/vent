import { Hono } from "hono";
import twilioPkg from "twilio";
const { VoiceResponse } = twilioPkg.twiml;
import { twilioClient, getPublicUrl, getWsUrl } from "./twilio-client";
import { sessionStore } from "./session-store";
import { dispatchWebhook, resolveWebhookUrl } from "./webhooks";
import { db } from "../database";
import { calls } from "../database/schema";
import { eq } from "drizzle-orm";

export const voice = new Hono()
  // Twilio webhook — set this as the phone number's "A call comes in" Voice URL.
  // Also reused as the TwiML endpoint for outbound calls we place ourselves.
  .post("/incoming", async (c) => {
    const body = await c.req.parseBody();
    const callSid = String(body.CallSid ?? "");
    const from = String(body.From ?? "");
    const to = String(body.To ?? "");

    if (callSid && !sessionStore.get(callSid)) {
      sessionStore.set(callSid, { callSid, direction: "inbound" });
    }
    const session = callSid ? sessionStore.get(callSid) : undefined;
    const webhookUrl = resolveWebhookUrl(session?.webhookUrl);

    if (callSid) {
      await db
        .insert(calls)
        .values({
          twilioCallSid: callSid,
          direction: session?.direction ?? "inbound",
          fromNumber: from,
          toNumber: to,
          status: "in-progress",
          agentPersona: session?.persona ?? null,
          webhookUrl: session?.webhookUrl ?? null,
        })
        .onConflictDoNothing()
        .catch(() => undefined as unknown);

      void dispatchWebhook(webhookUrl, "call.started", {
        callSid,
        direction: session?.direction ?? "inbound",
        from,
        to,
      });
    }

    const twiml = new VoiceResponse();
    const connect = twiml.connect();
    connect.stream({ url: `${getWsUrl()}/api/voice/stream` });

    return c.text(twiml.toString(), 200, { "Content-Type": "text/xml" });
  })

  // Trigger an outbound call. Body: { to, persona?, webhookUrl? }
  // `webhookUrl` overrides the WEBHOOK_URL env default for this call only —
  // handy for routing different call flows to different n8n/Zapier hooks.
  .post("/calls/outbound", async (c) => {
    const { to, persona, webhookUrl } = await c.req.json<{
      to: string;
      persona?: string;
      webhookUrl?: string;
    }>();
    if (!to) return c.json({ error: "`to` is required" }, 400);

    const from = process.env.TWILIO_PHONE_NUMBER;
    if (!from) return c.json({ error: "TWILIO_PHONE_NUMBER is not configured" }, 500);

    const call = await twilioClient.calls.create({
      to,
      from,
      url: `${getPublicUrl()}/api/voice/incoming`,
      statusCallback: `${getPublicUrl()}/api/voice/status-callback`,
      statusCallbackEvent: ["initiated", "ringing", "answered", "completed"],
      record: true,
      recordingStatusCallback: `${getPublicUrl()}/api/voice/recording-status`,
    });

    sessionStore.set(call.sid, { callSid: call.sid, direction: "outbound", persona, webhookUrl });

    return c.json({ callSid: call.sid, status: call.status }, 201);
  })

  // Twilio call status webhook — updates our call record's lifecycle status.
  .post("/status-callback", async (c) => {
    const body = await c.req.parseBody();
    const callSid = String(body.CallSid ?? "");
    const status = String(body.CallStatus ?? "");
    if (callSid) {
      await db
        .update(calls)
        .set({
          status,
          endedAt: status === "completed" ? new Date() : undefined,
        })
        .where(eq(calls.twilioCallSid, callSid))
        .catch(() => undefined as unknown);

      if (status === "completed") {
        const session = sessionStore.get(callSid);
        void dispatchWebhook(resolveWebhookUrl(session?.webhookUrl), "call.completed", {
          callSid,
          status,
        });
      }
    }
    return c.text("", 200);
  })

  // Twilio recording webhook — stores the recording URL once available.
  .post("/recording-status", async (c) => {
    const body = await c.req.parseBody();
    const callSid = String(body.CallSid ?? "");
    const recordingUrl = String(body.RecordingUrl ?? "");
    if (callSid && recordingUrl) {
      const fullUrl = `${recordingUrl}.mp3`;
      await db
        .update(calls)
        .set({ recordingUrl: fullUrl })
        .where(eq(calls.twilioCallSid, callSid))
        .catch(() => undefined as unknown);

      const session = sessionStore.get(callSid);
      void dispatchWebhook(resolveWebhookUrl(session?.webhookUrl), "call.recording_ready", {
        callSid,
        recordingUrl: fullUrl,
      });
    }
    return c.text("", 200);
  })

  // Ops endpoints — no dashboard, just JSON for curl/Postman.
  .get("/calls", async (c) => {
    const rows = await db.select().from(calls).orderBy(calls.startedAt);
    return c.json({ calls: rows }, 200);
  })

  .get("/calls/:id/transcript", async (c) => {
    const id = Number(c.req.param("id"));
    const { transcripts } = await import("../database/schema");
    const rows = await db.select().from(transcripts).where(eq(transcripts.callId, id));
    return c.json({ transcript: rows }, 200);
  })

  // Fire a sample event at a webhook URL — use this to test your n8n/Zapier
  // trigger before making a real call. Body: { url?: string } — falls back
  // to WEBHOOK_URL env var if omitted.
  .post("/webhooks/test", async (c) => {
    const body = await c.req.json<{ url?: string }>().catch(() => ({}) as { url?: string });
    const target = resolveWebhookUrl(body.url);
    if (!target) return c.json({ error: "No webhook URL provided and WEBHOOK_URL is not set" }, 400);

    await dispatchWebhook(target, "call.started", {
      callSid: "TEST_CALL_SID",
      direction: "outbound",
      from: "+15550000000",
      to: "+15550000001",
      note: "This is a test event from /api/voice/webhooks/test",
    });

    return c.json({ sent: true, target }, 200);
  });
