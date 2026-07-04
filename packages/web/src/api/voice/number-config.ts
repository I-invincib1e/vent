/**
 * Per-Twilio-number runtime configuration — lets different numbers carry
 * different behavior (voice/LLM provider, compliance mode, max call length)
 * without touching code or redeploying. Configure via the NUMBER_CONFIG env
 * var — a JSON object keyed by E.164 number:
 *   NUMBER_CONFIG={"+15551234567": {"ttsProvider": "cartesia", "maxDurationSeconds": 300}}
 * Falls back to global env defaults when a number has no entry or a field
 * is omitted.
 */
export type NumberConfig = {
  persona?: string;
  ttsProvider?: "elevenlabs" | "cartesia";
  llmProvider?: "gateway" | "groq";
  maxDurationSeconds?: number;
  webhookUrl?: string;
};

function loadNumberConfigMap(): Record<string, NumberConfig> {
  const raw = process.env.NUMBER_CONFIG;
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed ? parsed : {};
  } catch (err) {
    console.error("[number-config] NUMBER_CONFIG is not valid JSON — ignoring", err);
    return {};
  }
}

const numberConfigMap = loadNumberConfigMap();

export function getNumberConfig(number?: string): NumberConfig {
  if (!number) return {};
  return numberConfigMap[number] ?? {};
}
