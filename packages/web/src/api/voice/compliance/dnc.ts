import { db } from "../../database";
import { doNotCall } from "../../database/schema";
import { eq } from "drizzle-orm";

/**
 * Internal Do-Not-Call registry, checked automatically before every outbound
 * call — no manual step required. Numbers land here via POST /api/voice/dnc
 * (manual), or automatically from a workflow action (e.g. "not-interested"
 * outcome adds the number here — see voice/workflows/).
 *
 * National DNC Registry integration: the FTC's National DNC Registry requires
 * a paid Subscription Account Number (SAN) via telemarketing.donotcall.gov —
 * there is no free arbitrary-lookup API. `source: "national-registry"` is
 * reserved for numbers synced in from that feed once the operator has a SAN;
 * the check below already covers both sources transparently, so turning on
 * national-registry sync later requires zero changes to the calling code.
 */
export async function isOnDoNotCallList(phoneNumber: string): Promise<boolean> {
  const [row] = await db.select().from(doNotCall).where(eq(doNotCall.phoneNumber, phoneNumber)).limit(1);
  return Boolean(row);
}

export async function addToDoNotCallList(
  phoneNumber: string,
  reason?: string,
  source: "manual" | "agent" | "national-registry" = "manual",
) {
  await db.insert(doNotCall).values({ phoneNumber, reason, source }).onConflictDoNothing();
}

export async function removeFromDoNotCallList(phoneNumber: string) {
  await db.delete(doNotCall).where(eq(doNotCall.phoneNumber, phoneNumber));
}
