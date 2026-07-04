import type { ModelMessage } from "ai";
import { connectDeepgram } from "./deepgram";
import { connectElevenLabsTts } from "./elevenlabs";
import { runVoiceAgentTurn } from "./agent";
import { sessionStore } from "./session-store";
import { dispatchWebhook, resolveWebhookUrl } from "./webhooks";
import { db } from "../database";
import { calls, transcripts, toolCalls } from "../database/schema";
import { eq } from "drizzle-orm";

type TwilioEvent =
  | { event: "start"; start: { streamSid: string; callSid: string } }
  | { event: "media"; media: { payload: string } }
  | { event: "mark"; mark: { name: string } }
  | { event: "stop" };

/**
 * Bun WebSocket handler for a single Twilio Media Stream connection.
 * One instance of this state machine per live call.
 *
 * Flow: Twilio audio -> Deepgram STT -> LLM agent (streamed) -> ElevenLabs TTS
 * -> Twilio audio, with barge-in interrupting the agent/TTS the moment the
 * caller starts talking again.
 */
export function createVoiceStreamHandlers() {
  let streamSid: string | null = null;
  let callSid: string | null = null;
  let dbCallId: number | null = null;
  let webhookUrl: string | null = null;
  let history: ModelMessage[] = [];

  let deepgram: ReturnType<typeof connectDeepgram> | null = null;
  let tts: ReturnType<typeof connectElevenLabsTts> | null = null;
  let turnAbortController: AbortController | null = null;
  let agentIsSpeaking = false;

  return {
    onOpen(ws: { send: (data: string) => void }) {
      deepgram = connectDeepgram(async ({ text, isFinal, speechFinal }) => {
        // Barge-in: if the agent is mid-response and the caller starts
        // talking again, cut the agent off immediately.
        if (agentIsSpeaking && text.trim().length > 0) {
          if (streamSid) ws.send(JSON.stringify({ event: "clear", streamSid }));
          turnAbortController?.abort();
          tts?.close();
          tts = null;
          agentIsSpeaking = false;
        }

        if (!speechFinal || !isFinal || !text.trim()) return;

        history.push({ role: "user", content: text });
        await logTranscript("caller", text);
        await runTurn(ws);
      });
    },

    async onMessage(raw: string) {
      let msg: TwilioEvent;
      try {
        msg = JSON.parse(raw);
      } catch {
        return;
      }

      if (msg.event === "start") {
        streamSid = msg.start.streamSid;
        callSid = msg.start.callSid;
        const session = callSid ? sessionStore.get(callSid) : undefined;

        if (callSid) {
          const [row] = await db
            .select()
            .from(calls)
            .where(eq(calls.twilioCallSid, callSid))
            .limit(1);
          dbCallId = row?.id ?? null;
          webhookUrl = resolveWebhookUrl(session?.webhookUrl ?? row?.webhookUrl ?? undefined);
        }

        // Kick off the conversation with a short greeting from the agent.
        history = [];
        return;
      }

      if (msg.event === "media") {
        const audio = Buffer.from(msg.media.payload, "base64");
        deepgram?.sendAudio(audio);
        return;
      }

      if (msg.event === "stop") {
        deepgram?.close();
        tts?.close();
        turnAbortController?.abort();
        if (callSid) {
          await db
            .update(calls)
            .set({ status: "completed", endedAt: new Date() })
            .where(eq(calls.twilioCallSid, callSid))
            .catch(() => undefined as unknown);
          sessionStore.delete(callSid);
        }
      }
    },

    onClose() {
      deepgram?.close();
      tts?.close();
      turnAbortController?.abort();
    },
  };

  async function logTranscript(role: "caller" | "agent", text: string) {
    if (!dbCallId) return;
    await db.insert(transcripts).values({ callId: dbCallId, role, text }).catch(() => undefined as unknown);
    void dispatchWebhook(webhookUrl, "call.transcript", { callSid, callId: dbCallId, role, text });
  }

  async function logToolCall(name: string, input: unknown, output: unknown) {
    if (!dbCallId) return;
    await db
      .insert(toolCalls)
      .values({ callId: dbCallId, toolName: name, input, output })
      .catch(() => undefined as unknown);
    void dispatchWebhook(webhookUrl, "call.tool_call", {
      callSid,
      callId: dbCallId,
      toolName: name,
      input,
      output,
    });
  }

  async function runTurn(ws: { send: (data: string) => void }) {
    turnAbortController = new AbortController();
    agentIsSpeaking = true;

    tts = connectElevenLabsTts(
      (base64Audio) => {
        if (!streamSid) return;
        ws.send(
          JSON.stringify({
            event: "media",
            streamSid,
            media: { payload: base64Audio },
          }),
        );
      },
      () => {
        agentIsSpeaking = false;
      },
    );

    let fullText = "";
    try {
      fullText = await runVoiceAgentTurn({
        history,
        signal: turnAbortController.signal,
        onTextDelta: (delta) => tts?.sendText(delta),
        onToolCall: (name, input, output) => void logToolCall(name, input, output),
      });
    } catch (err) {
      if ((err as Error).name !== "AbortError") console.error("[voice] agent turn failed", err);
    } finally {
      tts?.endTurn();
    }

    if (fullText) {
      history.push({ role: "assistant", content: fullText });
      await logTranscript("agent", fullText);
    }
  }
}
