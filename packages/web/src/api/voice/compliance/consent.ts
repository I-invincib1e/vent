/**
 * Recording/AI disclosure — spoken automatically at the start of every call
 * whenever recording is on (default), satisfying the baseline pattern most
 * jurisdictions require: two-party-consent US states, GDPR Art. 6 lawful
 * basis for processing, and the EU AI Act Art. 50 requirement to disclose
 * that the caller is interacting with an AI system.
 *
 * Enforced by default (opt-out via RECORDING_DISCLOSURE_ENABLED=false) so
 * compliance is the out-of-the-box behavior, not something a developer has
 * to remember to wire in per deployment.
 */
export function isDisclosureEnabled(): boolean {
  return process.env.RECORDING_DISCLOSURE_ENABLED !== "false";
}

export function getDisclosureLine(): string {
  return (
    process.env.RECORDING_DISCLOSURE_TEXT ??
    "Quick heads up before we start — this call may be recorded, and you're speaking with an AI assistant."
  );
}

/** Prepends the disclosure line to a persona's greeting instructions. */
export function withDisclosure(personaInstructions: string): string {
  if (!isDisclosureEnabled()) return personaInstructions;
  return `${personaInstructions}\n\nAt the very start of the call, before anything else, say this near-verbatim: "${getDisclosureLine()}"`;
}
