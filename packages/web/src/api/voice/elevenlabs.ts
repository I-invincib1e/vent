/**
 * Thin wrapper around ElevenLabs' streaming TTS WebSocket ("stream-input"),
 * configured to output mu-law 8kHz audio so it can be forwarded straight into
 * a Twilio Media Stream `media` event with zero re-encoding.
 */
export function connectElevenLabsTts(onAudioChunk: (base64Audio: string) => void, onDone?: () => void) {
  const voiceId = process.env.ELEVENLABS_VOICE_ID;
  const url =
    `wss://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream-input` +
    `?model_id=eleven_flash_v2_5&output_format=ulaw_8000`;

  const ws = new WebSocket(url);

  ws.addEventListener("open", () => {
    // Initial handshake message — required before sending any text.
    ws.send(
      JSON.stringify({
        text: " ",
        voice_settings: { stability: 0.5, similarity_boost: 0.8 },
        xi_api_key: process.env.ELEVENLABS_API_KEY,
      }),
    );
  });

  ws.addEventListener("message", (event) => {
    try {
      const msg = JSON.parse(event.data as string);
      if (msg.audio) onAudioChunk(msg.audio as string);
      if (msg.isFinal) onDone?.();
    } catch (err) {
      console.error("[elevenlabs] failed to parse message", err);
    }
  });

  ws.addEventListener("error", (err) => console.error("[elevenlabs] socket error", err));

  return {
    socket: ws,
    /** Feed a chunk of agent text as it streams from the LLM. */
    sendText(text: string) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ text: `${text} `, try_trigger_generation: true }));
      }
    },
    /** Signal end of this turn's text so ElevenLabs flushes remaining audio. */
    endTurn() {
      if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ text: "" }));
    },
    /** Hard-abort — used on barge-in to stop audio generation immediately. */
    close() {
      ws.close();
    },
  };
}
