/**
 * Thin wrapper around Deepgram's live streaming STT WebSocket, tuned for
 * 8kHz mu-law audio coming straight off a Twilio Media Stream (no re-encoding
 * needed — Deepgram accepts mulaw natively).
 */
export type DeepgramTranscriptHandler = (params: {
  text: string;
  isFinal: boolean;
  speechFinal: boolean;
}) => void;

export function connectDeepgram(onTranscript: DeepgramTranscriptHandler) {
  const params = new URLSearchParams({
    model: "nova-3",
    encoding: "mulaw",
    sample_rate: "8000",
    channels: "1",
    punctuate: "true",
    smart_format: "true",
    interim_results: "true",
    endpointing: "300",
    vad_events: "true",
  });

  const ws = new WebSocket(`wss://api.deepgram.com/v1/listen?${params.toString()}`, [
    "token",
    process.env.DEEPGRAM_API_KEY ?? "",
  ]);

  ws.addEventListener("message", (event) => {
    try {
      const msg = JSON.parse(event.data as string);
      if (msg.type !== "Results") return;
      const alt = msg.channel?.alternatives?.[0];
      const text: string = alt?.transcript ?? "";
      if (!text) return;
      onTranscript({
        text,
        isFinal: Boolean(msg.is_final),
        speechFinal: Boolean(msg.speech_final),
      });
    } catch (err) {
      console.error("[deepgram] failed to parse message", err);
    }
  });

  ws.addEventListener("error", (err) => console.error("[deepgram] socket error", err));

  return {
    socket: ws,
    sendAudio(chunk: Uint8Array) {
      if (ws.readyState === WebSocket.OPEN) ws.send(chunk);
    },
    close() {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "CloseStream" }));
      }
      ws.close();
    },
  };
}
