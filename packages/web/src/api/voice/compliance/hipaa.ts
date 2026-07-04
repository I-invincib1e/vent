/**
 * HIPAA guardrail. Code cannot verify a signed Business Associate Agreement —
 * that's a legal contract between the operator and each vendor touching PHI
 * (Twilio, Deepgram, the active TTS provider, the active LLM provider). What
 * code CAN do is refuse to silently assume compliance: when COMPLIANCE_MODE
 * is set to "hipaa", the server requires an explicit confirmation flag before
 * it will start at all, forcing a deliberate acknowledgment that BAAs are
 * actually in place rather than discovering the gap after a PHI-carrying call
 * has already happened.
 *
 * This is a guardrail, not a compliance certification. Running in HIPAA mode
 * does not make Vent "HIPAA compliant" by itself — it removes one common
 * failure mode (nobody actually checked).
 */
export function isHipaaMode(): boolean {
  return (process.env.COMPLIANCE_MODE ?? "").toLowerCase() === "hipaa";
}

export function assertHipaaPreflight(): void {
  if (!isHipaaMode()) return;

  if (process.env.HIPAA_BAA_CONFIRMED !== "true") {
    throw new Error(
      "COMPLIANCE_MODE=hipaa is set but HIPAA_BAA_CONFIRMED=true is missing. " +
        "Refusing to start: confirm Business Associate Agreements are signed with every vendor in the " +
        "pipeline that may touch PHI (Twilio, Deepgram, your TTS provider, your LLM provider) before " +
        "setting HIPAA_BAA_CONFIRMED=true. This flag is a deliberate human checkpoint, not a technical " +
        "verification — Vent cannot confirm a legal contract exists on your behalf.",
    );
  }
}

/** In HIPAA mode, use a much shorter default retention window unless overridden. */
export function getHipaaRetentionDays(): number {
  const configured = process.env.HIPAA_RETENTION_DAYS;
  return configured ? Number(configured) : 30;
}
