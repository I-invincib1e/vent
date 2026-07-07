/**
 * Recording/AI disclosure — meant to be spoken at the start of every call
 * whenever recording is on (default), satisfying the baseline pattern most
 * jurisdictions require: two-party-consent US states, GDPR Art. 6 lawful
 * basis for processing, and the EU AI Act Art. 50 requirement to disclose
 * that the caller is interacting with an AI system.
 *
 * Enforced by default (opt-out via config, not opt-in) so compliance is the
 * out-of-the-box behavior, not something a developer has to remember to wire
 * in per deployment. Environment-variable driven for zero-config use, but
 * every value can be passed explicitly instead if you don't want this
 * package reading process.env directly (e.g. in a non-Node runtime).
 */
export type ConsentOptions = {
  enabled?: boolean;
  disclosureText?: string;
};

const DEFAULT_DISCLOSURE_TEXT =
  "Quick heads up before we start — this call may be recorded, and you're speaking with an AI assistant.";

export function isDisclosureEnabled(options: ConsentOptions = {}): boolean {
  if (options.enabled !== undefined) return options.enabled;
  if (typeof process !== "undefined" && process.env?.RECORDING_DISCLOSURE_ENABLED === "false") return false;
  return true;
}

export function getDisclosureLine(options: ConsentOptions = {}): string {
  if (options.disclosureText) return options.disclosureText;
  if (typeof process !== "undefined" && process.env?.RECORDING_DISCLOSURE_TEXT) {
    return process.env.RECORDING_DISCLOSURE_TEXT;
  }
  return DEFAULT_DISCLOSURE_TEXT;
}

/** Prepends the disclosure instruction to a persona/system prompt string. */
export function withDisclosure(personaInstructions: string, options: ConsentOptions = {}): string {
  if (!isDisclosureEnabled(options)) return personaInstructions;
  return `${personaInstructions}\n\nAt the very start of the call, before anything else, say this near-verbatim: "${getDisclosureLine(options)}"`;
}
