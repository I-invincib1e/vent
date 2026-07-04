import { lt, eq } from "drizzle-orm";
import { db } from "../../database";
import { calls, transcripts, toolCalls } from "../../database/schema";
import { isHipaaMode, getHipaaRetentionDays } from "./hipaa";

/**
 * GDPR-oriented data lifecycle controls — the two concretely codeable pieces
 * of GDPR: bounded retention (Art. 5(1)(e) storage limitation) and the
 * right to erasure (Art. 17). Both run automatically; erasure is also
 * available on demand via DELETE /api/voice/callers/:phoneNumber.
 */
export function getRetentionDays(): number {
  if (isHipaaMode()) return getHipaaRetentionDays();
  const configured = process.env.DATA_RETENTION_DAYS;
  return configured ? Number(configured) : 90;
}

/** Deletes transcripts/tool-calls/call records older than the retention window. Safe to run repeatedly. */
export async function purgeExpiredData(): Promise<{ callsDeleted: number }> {
  const retentionDays = getRetentionDays();
  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

  const expiredCalls = await db.select({ id: calls.id }).from(calls).where(lt(calls.startedAt, cutoff));
  for (const { id } of expiredCalls) {
    await db.delete(transcripts).where(eq(transcripts.callId, id));
    await db.delete(toolCalls).where(eq(toolCalls.callId, id));
  }
  if (expiredCalls.length > 0) {
    await db.delete(calls).where(lt(calls.startedAt, cutoff));
  }

  return { callsDeleted: expiredCalls.length };
}

/** Right-to-erasure: deletes all call data associated with a phone number, on request. */
export async function eraseCallerData(phoneNumber: string): Promise<{ callsDeleted: number }> {
  const matchingCalls = await db
    .select({ id: calls.id })
    .from(calls)
    .where(eq(calls.fromNumber, phoneNumber));
  const matchingCallsTo = await db
    .select({ id: calls.id })
    .from(calls)
    .where(eq(calls.toNumber, phoneNumber));
  const allIds = [...new Set([...matchingCalls.map((c) => c.id), ...matchingCallsTo.map((c) => c.id)])];

  for (const id of allIds) {
    await db.delete(transcripts).where(eq(transcripts.callId, id));
    await db.delete(toolCalls).where(eq(toolCalls.callId, id));
  }
  if (allIds.length > 0) {
    for (const id of allIds) {
      await db.delete(calls).where(eq(calls.id, id));
    }
  }

  return { callsDeleted: allIds.length };
}

const PURGE_INTERVAL_MS = 24 * 60 * 60 * 1000; // once a day

/** Starts the background retention-purge sweep. Call once at server boot. */
export function startRetentionSweep() {
  if (typeof setInterval === "undefined") return;
  const run = () => {
    purgeExpiredData()
      .then(({ callsDeleted }) => {
        if (callsDeleted > 0) console.log(`[gdpr] retention sweep purged ${callsDeleted} expired call(s)`);
      })
      .catch((err) => console.error("[gdpr] retention sweep failed", err));
  };
  run();
  setInterval(run, PURGE_INTERVAL_MS).unref?.();
}
