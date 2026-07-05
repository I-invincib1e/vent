# Changelog

All notable changes to Vent are documented here. Format loosely follows
[Keep a Changelog](https://keepachangelog.com/) — dated entries, newest first.

## [Unreleased] — 2026-07-04 (research: CAI market landscape + orchestration framework evaluation)

### Research / Decisions (no code changes)
- Completed a competitive research pass on the Conversational AI / voice-agent market (AI-native platforms,
  hyperscaler CCAI offerings, CRM-embedded voice AI, legacy CCaaS incumbents) — see the delivered market
  report for the full comparison matrix and compliance benchmark. Key finding: every serious AI-native
  competitor (ElevenLabs Agents, Vapi, Retell AI, Bland AI, Synthflow) already ships SOC 2 + HIPAA (several
  with GDPR/PCI-DSS/ISO27001); Vent's current HIPAA support is a boot-time guardrail, not a certification.
- Evaluated adopting an open-source orchestration framework (Pipecat, LiveKit Agents, TEN Framework,
  Vocode) instead of maintaining Vent's own STT→LLM→TTS pipeline. Investigated LiveKit Agents specifically
  (TypeScript SDK, documented Twilio integration) and ultimately **rejected it** — both its Cloud and
  self-hosted deployment options reintroduce vendor/infrastructure dependencies Vent is built to remove,
  and its WebRTC/SIP telephony model is architecturally mismatched with Vent's existing Twilio Media
  Streams (WebSocket) integration. See `DECISIONS.md` ADR-009 for the full reasoning. No code was changed
  as part of this evaluation — Vent's existing direct pipeline continues unmodified.

## [Unreleased] — 2026-07-04 (v2: compliance, providers, control, workflows)

### Added
- **Compliance layer** (`voice/compliance/`), enforced automatically on every outbound call:
  - TCPA calling-window check (`calling-window.ts`) — blocks calls outside 8am–9pm in the called party's
    local time, with a safe fallback window when the timezone can't be resolved
  - Internal Do-Not-Call list (`dnc.ts`) — `GET/POST /api/voice/dnc`, `DELETE /api/voice/dnc/:phoneNumber`
  - Automatic spoken recording/AI disclosure at the start of every call (`consent.ts`), default on
  - HIPAA boot-time guardrail (`hipaa.ts`) — server refuses to start in `COMPLIANCE_MODE=hipaa` without
    `HIPAA_BAA_CONFIRMED=true`
  - GDPR data retention purge (daily sweep) and right-to-erasure endpoint
    (`DELETE /api/voice/callers/:phoneNumber`) (`gdpr.ts`)
- **Groq as a second LLM provider** (`voice/llm/`) via `@ai-sdk/groq`, selected with `LLM_PROVIDER=groq`;
  kept alongside the existing AI Gateway path as a swappable option, not a replacement
- **Time-to-first-token latency telemetry** per agent turn, logged with the active model name — lets
  provider choices be compared on real numbers instead of guesswork
- **Per-number runtime configuration** (`number-config.ts`, `NUMBER_CONFIG` env var) — different Twilio
  numbers can run different personas, TTS/LLM providers, and max call durations without a redeploy
- **Live call-control endpoints**: `GET /api/voice/calls/:id/status`, `POST /api/voice/calls/:id/end`
  (force-hang-up)
- **Boot-time config validation** (`config-check.ts`) — logs loudly at startup if the active providers are
  missing required env vars, instead of only failing mid-call
- **Call workflows** (`voice/workflows/`, `WORKFLOWS` env var) — JSON-defined outcome-based automation:
  retry-on-no-answer, add-to-DNC-on-not-interested, webhook-on-interested, SMS-stub action; a background
  scheduler (`scheduler.ts`) executes due retries automatically, re-running the same compliance gates as a
  manual call
- **`setDisposition` tool** — lets the agent record how a call ended, feeding the workflow engine
- **`crmSync` tool** — HubSpot stub for mid-call contact upsert + call-engagement logging
- `calls.disposition` and `calls.sttReconnectCount` columns; new `doNotCall` and `scheduledCalls` tables

### Fixed
- Deepgram reconnects no longer silently drop caller audio — incoming audio is now buffered (bounded,
  ~2s) during a reconnect gap and flushed the moment the new connection opens; reconnect count and total
  gap time are now tracked per call and written to the call record
- Critical DB writes (call finalization on hangup) now retry once via a small `withRetry` helper before
  giving up, instead of silently losing the call's terminal status on a transient network blip
- Full Twilio call-status handling (`failed`/`busy`/`no-answer`/`canceled`, not just `completed`) so calls
  that never connect don't stay stuck as `in-progress` forever
- Agent turns now guarantee non-empty spoken output and a bounded duration (12s timeout) — a turn that
  produces nothing or hangs now ends with a spoken fallback line instead of dead air, which was the root
  cause of a mid-call disconnect observed during live testing

### Changed
- Default TTS provider switched from ElevenLabs to Cartesia — ElevenLabs' free tier returns
  `402 payment_required` for all library voices via the API regardless of which voice is selected;
  Cartesia's Starter plan works out of the box with native `pcm_mulaw`/8000Hz output (no re-encoding
  needed, same zero-conversion path ElevenLabs had). Both remain available via `TTS_PROVIDER`.
- ElevenLabs and Cartesia integrations refactored behind a shared `ConnectTts` interface
  (`voice/tts/types.ts`) so adding future TTS providers requires no changes to the call pipeline
- Agent's default persona rewritten: knows what Vent is (answers "what are you" without a tool call),
  instructed to always say something rather than go silent, and now greets the caller immediately on
  connect instead of waiting for them to speak first
- Session state (`session-store.ts`) extended with per-call TTS/LLM provider overrides and a max-duration
  field, plus a background TTL sweep for abandoned sessions

### Security
- Documented (not yet fixed) that ops endpoints (`/calls`, `/dnc`, `/calls/:id/end`, transcripts) have no
  authentication — flagged as a known limitation to close before production exposure

## [0.1.0] — 2026-07-04 (initial build)

### Added
- Initial voice agent pipeline: Twilio inbound (`/api/voice/incoming`) and outbound
  (`/api/voice/calls/outbound`) calls, Deepgram real-time STT, LLM agent via AI Gateway with tool-calling
  (`lookupInfo`, `bookAppointment` stubs), ElevenLabs streaming TTS, barge-in handling via Twilio's `clear`
  event
- Call recording, turn-by-turn transcript storage, tool-call logging (`calls`/`transcripts`/`toolCalls`
  tables)
- Outgoing webhooks for n8n/Zapier/Make (`call.started`, `call.transcript`, `call.tool_call`,
  `call.completed`, `call.recording_ready`), plus a `POST /api/voice/webhooks/test` endpoint
- In-app `/docs` documentation page covering architecture, env vars, API reference, and webhook payloads
- Vent brand identity and storytelling landing page — paper/ink/ember palette, Fraunces/Inter Tight/
  JetBrains Mono type system, scroll-driven pipeline animation (Twilio → Deepgram → LLM → TTS → caller)
- Production deployment switched from Vite dev server to the real Bun server (`bun run start` via PM2) —
  required because the WebSocket media-stream bridge cannot run under Vite's dev SSR module runner
- GitHub repository created (`rishipawar8999-tech/vent`, private, MIT licensed)

### Known issues at this stage (resolved in v2, see above)
- Real test call revealed the agent went silent mid-conversation and the call dropped — root-caused to
  ElevenLabs' free-tier API restriction plus a lack of fallback handling for empty/stuck agent turns
- Platform's public preview URL does not support WebSocket upgrades (`502` on any `Upgrade: websocket`
  request) — worked around with a Cloudflare quick-tunnel, which is not stable enough for sustained use
  (documented as an open item)
