import { lte, eq, and } from "drizzle-orm";
import { db } from "../../database";
import { scheduledCalls } from "../../database/schema";
import { twilioClient, getPublicUrl } from "../twilio-client";
import { sessionStore } from "../session-store";
import { isOnDoNotCallList } from "../compliance/dnc";
import { checkCallingWindow } from "../compliance/calling-window";

const SWEEP_INTERVAL_MS = 60 * 1000; // check every minute

/**
 * Executes due scheduled calls (workflow retries) — the automated
 * follow-through for a "no-answer -> retry in 60min" style workflow action.
 * Runs the same compliance gates as a manual outbound call (DNC + calling
 * window) so scheduled retries never bypass the guardrails.
 */
async function executeDueScheduledCalls() {
  const due = await db
    .select()
    .from(scheduledCalls)
    .where(and(eq(scheduledCalls.status, "pending"), lte(scheduledCalls.runAt, new Date())));

  for (const row of due) {
    try {
      if (await isOnDoNotCallList(row.toNumber)) {
        console.warn(`[scheduler] skipping scheduled call to ${row.toNumber} — on DNC list`);
        await db.update(scheduledCalls).set({ status: "canceled" }).where(eq(scheduledCalls.id, row.id));
        continue;
      }
      const windowCheck = checkCallingWindow(row.toNumber);
      if (!windowCheck.allowed) {
        // Push it out another 30 minutes rather than dropping it — the
        // window will open eventually.
        await db
          .update(scheduledCalls)
          .set({ runAt: new Date(Date.now() + 30 * 60 * 1000) })
          .where(eq(scheduledCalls.id, row.id));
        continue;
      }

      const from = process.env.TWILIO_PHONE_NUMBER;
      if (!from) {
        console.error("[scheduler] TWILIO_PHONE_NUMBER not configured — cannot execute scheduled call");
        continue;
      }

      const call = await twilioClient.calls.create({
        to: row.toNumber,
        from,
        url: `${getPublicUrl()}/api/voice/incoming`,
        statusCallback: `${getPublicUrl()}/api/voice/status-callback`,
        statusCallbackEvent: ["initiated", "ringing", "answered", "completed"],
        record: true,
        recordingStatusCallback: `${getPublicUrl()}/api/voice/recording-status`,
      });

      sessionStore.set(call.sid, {
        callSid: call.sid,
        direction: "outbound",
        persona: row.persona ?? undefined,
        webhookUrl: row.webhookUrl ?? undefined,
      });

      console.log(`[scheduler] executed scheduled call to ${row.toNumber} (workflow: ${row.workflowName})`);
      await db.update(scheduledCalls).set({ status: "executed" }).where(eq(scheduledCalls.id, row.id));
    } catch (err) {
      console.error(`[scheduler] failed to execute scheduled call id=${row.id}`, err);
      await db.update(scheduledCalls).set({ status: "failed" }).where(eq(scheduledCalls.id, row.id));
    }
  }
}

export function startScheduledCallSweep() {
  if (typeof setInterval === "undefined") return;
  const run = () => void executeDueScheduledCalls().catch((err) => console.error("[scheduler] sweep failed", err));
  run();
  setInterval(run, SWEEP_INTERVAL_MS).unref?.();
}
