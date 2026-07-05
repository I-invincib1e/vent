import { checkCallingWindow, type CallingWindowOptions, type CallingWindowResult } from "./calling-window";
import { isOnDoNotCallList } from "./dnc";
import type { DncStorageAdapter } from "./storage";

export * from "./calling-window";
export * from "./dnc";
export * from "./consent";
export * from "./hipaa";
export * from "./gdpr";
export * from "./storage";
export * from "./adapters/memory";

export type OutboundComplianceResult =
  | { allowed: true }
  | { allowed: false; reason: string; failedCheck: "dnc" | "calling-window" };

/**
 * The single call most integrations need: run every automatic pre-call
 * compliance gate (Do-Not-Call list, TCPA calling window) before dialing.
 * Wire this into your outbound-call route/function and reject/skip the call
 * when `allowed` is false — see README "Wiring it into your call flow".
 */
export async function checkOutboundCallCompliance(
  toNumber: string,
  dncAdapter: DncStorageAdapter,
  callingWindowOptions?: CallingWindowOptions,
): Promise<OutboundComplianceResult> {
  if (await isOnDoNotCallList(dncAdapter, toNumber)) {
    return { allowed: false, reason: "This number is on the Do Not Call list.", failedCheck: "dnc" };
  }

  const windowCheck: CallingWindowResult = checkCallingWindow(toNumber, new Date(), callingWindowOptions);
  if (!windowCheck.allowed) {
    return {
      allowed: false,
      reason: `Blocked by calling-window compliance check: ${windowCheck.reason}`,
      failedCheck: "calling-window",
    };
  }

  return { allowed: true };
}
