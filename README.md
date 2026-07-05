# Vent

**Your voice agent. Your infrastructure. Your rules.**

Vent is a self-hosted voice agent pipeline — the open, unblocked alternative to black-box voice AI
platforms. It wires together Twilio (telephony), Deepgram (real-time speech-to-text), an LLM (reasoning
and tool use), and a text-to-speech engine into one live pipeline you own end to end: your code, your keys,
your data.

Built with enterprise adoption in mind: compliance (TCPA/DNC/consent/HIPAA/GDPR) is enforced automatically,
not left for an integrator to remember; every provider (LLM, TTS) is swappable behind an abstraction layer;
and every consequential decision is recorded in [`DECISIONS.md`](./DECISIONS.md) so anyone adopting this
repo can understand *why* it works the way it does, not just *what* the code does.

## What it does

- **Inbound & outbound calls** — someone calls your Twilio number, or you trigger the agent to call them
- **Real-time STT/TTS** — audio streams both ways with sub-second turn-taking
- **Barge-in** — the caller can interrupt the agent mid-sentence; the agent stops instantly
- **Tool calling** — the agent can look things up, book appointments, log to a CRM, or record a call
  disposition mid-conversation (stubs included, wire your own)
- **Recording + transcripts** — every call and every turn is persisted to your own database
- **Webhooks** — call lifecycle events push to n8n, Zapier, Make, or any URL you configure
- **Swappable providers** — LLM (AI Gateway or Groq) and TTS (ElevenLabs or Cartesia) behind a provider
  abstraction — swap with an env var, no code changes
- **Compliance, automatically** — TCPA calling-window + Do-Not-Call enforcement on every outbound call,
  spoken recording/AI disclosure by default, HIPAA boot-time guardrail, GDPR retention purge + erasure
- **Call workflows** — JSON-defined outcome-based automation (retry on no-answer, add to DNC on
  not-interested, webhook on interested) with a background scheduler that executes retries automatically
- **Per-number configuration** — different Twilio numbers can run different personas, providers, and call
  limits without a redeploy

## Architecture

```
Inbound:  Caller -> Twilio number -> POST /api/voice/incoming (TwiML) -> wss connect
Outbound: POST /api/voice/calls/outbound -> compliance gates -> Twilio places call -> same TwiML/stream flow

Twilio Media Stream (bidirectional WS, base64 mu-law 8kHz audio frames)
        |  caller audio chunks
        v
Deepgram Live STT  (nova-3, mulaw/8kHz, interim + final results, buffered through reconnects)
        |  finalized transcript (speech_final)
        v
LLM Agent (AI Gateway or Groq — see llm/, streamed, tool-calling, latency telemetry)
        |  streamed text tokens
        v
TTS  (ElevenLabs or Cartesia — see tts/, output_format=mulaw/8000 — no re-encoding)
        |  streamed audio chunks
        v
Twilio Media Stream  ->  caller hears the agent

Barge-in: if Deepgram detects new speech while the agent is talking, we send
Twilio a "clear" event and abort the in-flight LLM/TTS immediately.

On call end: disposition (if captured) + Twilio status feed the workflow engine
(workflows/), which can automatically schedule a retry, add the number to the
DNC list, or fire a webhook — no manual step required.
```

Full documentation — including every environment variable, API endpoint, database schema, and webhook
payload shape — lives at `/docs` inside the running app.

## Stack

Bun · Vite · React · Hono · Drizzle (Turso/SQLite) · Twilio · Deepgram · ElevenLabs/Cartesia ·
AI SDK (Gateway/Groq)

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

### Environment variables

**Core (required):**
```
DEEPGRAM_API_KEY=            # Deepgram live STT
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=         # e.g. +15551234567 — caller ID for outbound calls
PUBLIC_APP_URL=              # Public https URL Twilio can reach (wss derived automatically)
AI_GATEWAY_BASE_URL=
AI_GATEWAY_API_KEY=
DATABASE_URL=                # Turso/libSQL connection string
```

**TTS provider (pick one, default is Cartesia):**
```
TTS_PROVIDER=cartesia        # or "elevenlabs"
CARTESIA_API_KEY=
CARTESIA_VOICE_ID=
ELEVENLABS_API_KEY=
ELEVENLABS_VOICE_ID=
```
Note: ElevenLabs' free tier blocks all library voices via API (`402 payment_required`) — Cartesia's free/
Starter tier works out of the box. See [`DECISIONS.md`](./DECISIONS.md) for why Cartesia is the default.

**LLM provider (pick one, default is the AI Gateway):**
```
LLM_PROVIDER=gateway         # or "groq"
GROQ_API_KEY=
GROQ_MODEL=llama-3.3-70b-versatile
```

**Optional:**
```
WEBHOOK_URL=                          # default n8n/Zapier/Make webhook target
NUMBER_CONFIG=                        # JSON per-number config, see "Per-number config" below
WORKFLOWS=                            # JSON workflow configs, see "Workflows" below
AGENT_PERSONAS=                       # JSON per-number persona overrides
HUBSPOT_API_KEY=                      # for the crmSync tool
RECORDING_DISCLOSURE_ENABLED=true     # spoken consent/AI disclosure at call start (default ON)
RECORDING_DISCLOSURE_TEXT=            # override the default disclosure wording
DATA_RETENTION_DAYS=90                # GDPR: auto-purge call data older than this
COMPLIANCE_MODE=                      # set to "hipaa" to enable the HIPAA boot guardrail
HIPAA_BAA_CONFIRMED=                  # must be "true" if COMPLIANCE_MODE=hipaa — see Compliance below
HIPAA_RETENTION_DAYS=30               # shorter retention window used automatically in HIPAA mode
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
Every outbound call automatically passes a Do-Not-Call check and a TCPA calling-window check before
dialing — a blocked call returns a `403` with the reason, and never reaches Twilio.

## Compliance

Enforced automatically — not something an integrator has to remember to wire in. As of this release, the
compliance layer lives in its own standalone, framework-agnostic package —
[`packages/vent-compliance`](./packages/vent-compliance) (`@vent/compliance`) — with zero dependency on
Twilio, Bun/Hono, or any specific database. It's designed to be adoptable independently of Vent's own
pipeline (in a Pipecat, LiveKit, or fully custom voice stack); Vent's own app uses it via a thin Drizzle
adapter (`voice/compliance/adapters.ts`) as its own reference integration. See the package's README for
usage outside this repo.

- **TCPA calling window**: outbound calls are blocked outside 8am–9pm in the called party's local time
  (best-effort area-code-based timezone inference, safe fallback when unresolved).
- **Do-Not-Call list**: every outbound call is checked against an internal DNC list first
  (`GET/POST /api/voice/dnc`, `DELETE /api/voice/dnc/:phoneNumber`). The National DNC Registry has no free
  API — it requires a paid Subscription Account Number (SAN) via telemarketing.donotcall.gov. The internal
  list is fully automatic today; a national-registry sync adapter is a documented drop-in point once you
  have a SAN.
- **Recording/AI disclosure**: the agent's opening line automatically states the call may be recorded and
  that the caller is speaking with an AI — default **on** (`RECORDING_DISCLOSURE_ENABLED=false` to disable,
  not recommended).
- **HIPAA guardrail**: setting `COMPLIANCE_MODE=hipaa` makes the server refuse to boot unless
  `HIPAA_BAA_CONFIRMED=true` is also set — a deliberate human checkpoint. **This is a guardrail, not a
  certification** — code cannot verify a signed Business Associate Agreement exists; you must actually
  sign BAAs with Twilio, Deepgram, your TTS provider, and your LLM provider before handling PHI.
- **GDPR retention + erasure**: call data older than `DATA_RETENTION_DAYS` (default 90, or
  `HIPAA_RETENTION_DAYS` in HIPAA mode) is purged automatically on a daily sweep.
  `DELETE /api/voice/callers/:phoneNumber` erases all data for a number on request (right to erasure).

None of this constitutes legal advice or a compliance certification — consult counsel before handling
regulated data or telemarketing at scale.

## Workflows

Call outcomes can trigger automated follow-up actions — the call equivalent of an email-marketing flow
builder, defined as JSON (no dashboard needed):

```json
[{
  "name": "lead-followup",
  "onOutcome": {
    "no-answer": { "action": "retry", "delayMinutes": 60, "maxRetries": 3 },
    "not-interested": { "action": "addToDnc" },
    "interested": { "action": "webhook", "url": "https://your-n8n-instance/webhook/abc" }
  }
}]
```
Set this as the `WORKFLOWS` env var (a JSON array). The agent records the outcome via its `setDisposition`
tool; Twilio-level outcomes (no-answer/busy/failed) trigger workflows automatically even if the call never
connected. A background sweep executes due retries on its own.

## API reference (summary)

| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | Pipeline health, active providers, compliance config |
| POST | `/api/voice/incoming` | Twilio webhook — returns TwiML to start the media stream |
| POST | `/api/voice/calls/outbound` | Trigger an outbound call: `{ to, persona?, webhookUrl? }` (compliance-gated) |
| GET | `/api/voice/calls/:id/status` | Current status/metadata for one call |
| POST | `/api/voice/calls/:id/end` | Force-end a live call |
| GET | `/api/voice/calls` | List all calls |
| GET | `/api/voice/calls/:id/transcript` | Full transcript for one call |
| GET/POST | `/api/voice/dnc` | List / add to the Do-Not-Call list |
| DELETE | `/api/voice/dnc/:phoneNumber` | Remove a number from the DNC list |
| DELETE | `/api/voice/callers/:phoneNumber` | GDPR right-to-erasure — deletes all data for a number |
| POST | `/api/voice/webhooks/test` | Send a sample event to a webhook URL for testing |
| WS | `/api/voice/stream` | Twilio Media Stream connection (internal) |

Full reference is on the in-app `/docs` page.

## Agent tools

Tools live in `packages/web/src/api/voice/tools/`:

- `lookupInfo` — answers factual questions (stub — wire to a real KB/CRM)
- `bookAppointment` — books a caller in (stub — wire to a real calendar)
- `setDisposition` — records how a call ended; drives the workflow engine
- `crmSync` — upserts a contact + logs a call engagement to HubSpot (stub — set `HUBSPOT_API_KEY`)

## Per-number configuration

Different Twilio numbers can run different behavior without touching code, via `NUMBER_CONFIG`:
```json
{ "+15551234567": { "ttsProvider": "cartesia", "llmProvider": "groq", "maxDurationSeconds": 300 } }
```

## Known limitations

- The live call audio path (WebSocket bridge) only works under the production Bun server
  (`bun run start`), not Vite's dev server.
- Session state (persona, provider overrides) is stored in-memory per call — fine for a single instance,
  swap for Redis/DB-backed storage to scale horizontally.
- Ops endpoints (`/calls`, `/dnc`, `/calls/:id/end`, etc.) currently have **no authentication** — add an
  API-key check before exposing this beyond local testing.
- National DNC Registry sync is not built (no free API exists) — only the internal list is enforced today.
- The `sendSms` workflow action is a stub (logs only) — no SMS provider wired yet.

See [`CHANGELOG.md`](./CHANGELOG.md) for the full history and [`DECISIONS.md`](./DECISIONS.md) for the
reasoning behind these choices.

## License

MIT — see [LICENSE](./LICENSE).
