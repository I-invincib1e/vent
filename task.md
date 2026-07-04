# Voice Agent Infra — Progress

## Done
- app_init scaffolded at /home/user/voice-agent-infra
- Installed: twilio, ws, dedent, ai, @ai-sdk/react
- DB schema: calls, transcripts, toolCalls (pushed to Turso via db:push)
- packages/web/src/api/voice/
  - gateway.ts — AI SDK gateway + VOICE_AGENT_MODEL (openai/gpt-5.4-mini)
  - tools/lookupInfo.ts, tools/bookAppointment.ts — stub tools proving tool-calling works
  - agent.ts — runVoiceAgentTurn: streamText with tools, streams deltas out
  - deepgram.ts — connectDeepgram: live STT WS, mulaw/8kHz tuned for Twilio
  - elevenlabs.ts — connectElevenLabsTts: stream-input WS, output_format ulaw_8000 (no re-encode needed)
  - session-store.ts — in-memory CallSid -> persona/session map
  - twilio-client.ts — Twilio REST client + getPublicUrl/getWsUrl helpers
  - routes.ts — POST /incoming (TwiML), POST /calls/outbound, /status-callback, /recording-status, GET /calls, GET /calls/:id/transcript
  - stream.ts — core state machine per call: Twilio audio -> Deepgram -> agent -> ElevenLabs -> Twilio audio, with barge-in
  - ws-route.ts — Bun WS upgrade wiring via hono/bun createBunWebSocket
- server.ts updated to pass `{ server: srv }` into app.fetch and register `websocket` handler
- api/index.ts wires /api/voice routes + health check reporting which keys are configured
- `bun run typecheck` passes clean

## Waiting on
- User submitting secrets form: DEEPGRAM_API_KEY, ELEVENLABS_API_KEY, ELEVENLABS_VOICE_ID, TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER, PUBLIC_APP_URL

## Next after secrets arrive
1. `bun run build` in packages/web to verify full build
2. Start dev server, curl /api/health to confirm all keysConfigured: true
3. Tell user how to point their Twilio number's Voice webhook to `${PUBLIC_APP_URL}/api/voice/incoming`
4. Test outbound: curl -X POST $PUBLIC_APP_URL/api/voice/outbound... wait route is /api/voice/calls/outbound
5. Deliver as website artifact (backend/API only, no dashboard UI) on port 4200
