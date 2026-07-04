import { streamText, stepCountIs, type ModelMessage } from "ai";
import dedent from "dedent";
import { gateway, VOICE_AGENT_MODEL } from "./gateway";
import { lookupInfo } from "./tools/lookupInfo";
import { bookAppointment } from "./tools/bookAppointment";

const DEFAULT_PERSONA = dedent`
  You are a helpful, concise voice assistant on a live phone call.
  Keep responses short and conversational — you are being spoken aloud via
  text-to-speech, not read as text. Avoid lists, markdown, or long paragraphs.
  Ask one question at a time. If you don't know something, use a tool or say so.
`;

export const voiceTools = { lookupInfo, bookAppointment };

/**
 * Runs one agent turn for a live call, streaming text deltas as they arrive so
 * the caller can hear the response as fast as possible (fed sentence-by-sentence
 * into TTS by the caller of this function).
 */
export function runVoiceAgentTurn({
  history,
  persona,
  onTextDelta,
  onToolCall,
  signal,
}: {
  history: ModelMessage[];
  persona?: string;
  onTextDelta: (delta: string) => void;
  onToolCall?: (name: string, input: unknown, output: unknown) => void;
  signal?: AbortSignal;
}) {
  const result = streamText({
    model: gateway(VOICE_AGENT_MODEL),
    system: persona ?? DEFAULT_PERSONA,
    messages: history,
    tools: voiceTools,
    stopWhen: stepCountIs(6),
    abortSignal: signal,
    onStepFinish: (step) => {
      for (const call of step.toolCalls ?? []) {
        const result = step.toolResults?.find((r) => r.toolCallId === call.toolCallId);
        onToolCall?.(call.toolName, call.input, result?.output);
      }
    },
  });

  return (async () => {
    let full = "";
    for await (const delta of result.textStream) {
      full += delta;
      onTextDelta(delta);
    }
    return full;
  })();
}
