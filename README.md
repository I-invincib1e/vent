# Vent

**Your voice agent. Your infrastructure. Your rules.**

Vent is a self-hosted voice agent pipeline — the open, unblocked alternative to black-box voice AI
platforms. It wires together Twilio (telephony), Deepgram (real-time speech-to-text), an LLM (reasoning
and tool use), and ElevenLabs (real-time text-to-speech) into one live pipeline you own end to end: your
code, your keys, your data.

## What it does

- **Inbound calls** — someone calls your Twilio number and talks to the agent
- **Outbound calls** — trigger the agent to call someone via a single API call
- **Real-time STT/TTS** — audio streams both ways with sub-second turn-taking
- **Barge-in** — the caller can interrupt the agent mid-sentence; the agent stops instantly
- **Tool calling** — the agent can look things up or take actions mid-call (stubs included, wire your own)
- **Recording + transcripts** — every call and every turn is persisted to your own database
- **Webhooks** — call lifecycle events push to n8n, Zapier, Make, or any URL you configure

## Architecture

```
Inbound:  Caller -> Twilio number -> POST /api/voice/incoming (TwiML) -> wss connect
Outbound: POST /api/voice/calls/outbound -> Twilio places call -> same TwiML/stream flow

Twilio Media Stream (bidirectional WS, base64 mu-law 8kHz audio frames)
        |  caller audio chunks
        v
Deepgram Live STT  (nova-3, mulaw/8kHz, interim + final results)
        |  finalized transcript (speech_final)
        v
LLM Agent (AI Gateway, streamed, tool-calling)
        |  streamed text tokens
        v
ElevenLabs TTS  (stream-input WS, output_format=ulaw_8000 — no re-encoding)
        |  streamed audio chunks
        v
Twilio Media Stream  ->  caller hears the agent

Barge-in: if Deepgram detects new speech while the agent is talking, we send
Twilio a "clear" event and abort the in-flight LLM/TTS immediately.
```

Full documentation — including every environment variable, API endpoint, database schema, and webhook
payload shape — lives at `/docs` inside the running app.

## Stack

Bun · Vite · React · Hono · Drizzle (Turso/SQLite) · Twilio · Deepgram · ElevenLabs · AI SDK (LLM gateway)

## Getting started

```bash
bun install

# copy env vars and fill in your keys (see below)
cp .env.example .env

# push the database schema
cd packages/web && bun run db:push

# dev server (REST endpoints work; live call audio needs the prod server — see note below)
bun run dev

# production server (required for live call audio — the WebSocket bridge only
# runs correctly under the real Bun runtime, not Vite's dev SSR module runner)
bun run start
```

### Required environment variables

```
DEEPGRAM_API_KEY=            # Deepgram live STT
ELEVENLABS_API_KEY=          # ElevenLabs TTS
ELEVENLABS_VOICE_ID=         # Voice to use for the agent
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=         # e.g. +15551234567 — caller ID for outbound calls
PUBLIC_APP_URL=              # Public https URL Twilio can reach (wss derived automatically)
AI_GATEWAY_BASE_URL=
AI_GATEWAY_API_KEY=
WEBHOOK_URL=                 # Optional — default n8n/Zapier/Make webhook target
DATABASE_URL=                # Turso/libSQL connection string
```

### Point Twilio at your app

In the Twilio Console, set your phone number's **"A call comes in"** webhook to:

```
POST  {PUBLIC_APP_URL}/api/voice/incoming
```

### Trigger an outbound call

```bash
curl -X POST {PUBLIC_APP_URL}/api/voice/calls/outbound \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+15559876543",
    "persona": "You are a friendly scheduling assistant.",
    "webhookUrl": "https://your-n8n-instance/webhook/abc123"
  }'
```

## API reference (summary)

| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | Pipeline health + which env keys are configured |
| POST | `/api/voice/incoming` | Twilio webhook — returns TwiML to start the media stream |
| POST | `/api/voice/calls/outbound` | Trigger an outbound call: `{ to, persona?, webhookUrl? }` |
| POST | `/api/voice/webhooks/test` | Send a sample event to a webhook URL for testing |
| GET | `/api/voice/calls` | List all calls |
| GET | `/api/voice/calls/:id/transcript` | Full transcript for one call |
| WS | `/api/voice/stream` | Twilio Media Stream connection (internal) |

Full reference — every endpoint, the webhook event catalog, database schema, and how to wire n8n/Zapier —
is on the in-app `/docs` page.

## Agent tools

Tools live in `packages/web/src/api/voice/tools/`. Two ship as working stubs to prove the tool-calling path
end to end during a live call:

- `lookupInfo` — answers factual questions (hours, pricing, etc). Wire to a real KB/CRM.
- `bookAppointment` — books a caller in once name + time are confirmed. Wire to a real calendar.

## Known limitations

- The live call audio path (WebSocket bridge) only works under the production Bun server
  (`bun run start`), not Vite's dev server.
- Session state (persona, webhook override) is stored in-memory per call — fine for a single instance,
  swap for Redis/DB-backed storage to scale horizontally.
- Agent tools are stubs — replace with real integrations before production use.

## License

MIT — see [LICENSE](./LICENSE).
