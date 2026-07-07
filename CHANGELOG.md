# Changelog

All notable changes to OpenVent are documented here. Format loosely follows
[Keep a Changelog](https://keepachangelog.com/) — dated entries, newest first.

## [Unreleased] — 2026-07-06 (compliance audit-trail export)

### Added
- Compliance audit-trail module in `@openvent/compliance` (`audit-trail.ts`) — `buildCallAuditRecord`,
  `buildPhoneNumberAuditTrail`, `renderAuditTrailText`. Assembles, per call, exactly who was called, when,
  under what disposition, current DNC status, whether the recording/AI disclosure was actually spoken (not
  just configured), and the full transcript — the direct answer to real community feedback that this is
  what actually kills the TCPA/DNC compliance fear, not another warning. See ADR-017.
- Two new admin-key-gated endpoints: `GET /api/voice/calls/:id/audit` and
  `GET /api/voice/callers/:phoneNumber/audit`, both supporting `?format=text` for a plain-text export
  suitable for handing to a lawyer as-is (JSON by default).
- Dashboard: "Export compliance audit" button on the call-detail page; new `/dashboard/audit` page for
  looking up every call involving a number and downloading the combined trail.
- 10 new tests (`audit-trail.test.ts`) — 74 tests total across both packages, all passing. Typecheck,
  build, and lint all clean. Regression-tested live against real call data (auth gating, 404 handling,
  empty-result handling, disclosure detection, multi-call ordering).

## [Unreleased] — 2026-07-06 (feedback synthesis, roadmap reprioritization)

### Added
- `docs/strategy-2026-07.md` — synthesis of four rounds of real community feedback (Reddit, LinkedIn) plus
  direct competitive research into Voximplant (a managed voice-AI orchestration platform). Turns
  accumulated signal into concrete decisions instead of reacting comment-by-comment.

### Changed
- `ROADMAP.md` reprioritized based on that synthesis: compliance audit-trail export and per-call latency
  breakdown promoted to top priority (concrete, cheap, most differentiated, most directly requested);
  cross-call memory added as a lower-priority future item; v2 launch positioning explicitly notes lock-in
  messaging should be demoted from headline to supporting proof point, per three independent, convergent
  feedback sources.
- Confirms (does not change) ADR-015 (open-core) and ADR-016 (self-hosted-orchestration positioning) —
  competitive research into Voximplant's fully-managed architecture reinforces that self-hosted
  orchestration is a genuinely distinct market position, not a marketing spin.

## [Unreleased] — 2026-07-05 (positioning fix: self-hosted orchestration, not a binary claim)

### Changed
- Reframed "self-hosted" across README, `docs/architecture.md`, the in-app `/docs` overview, and the
  voice agent's own persona (what it tells a caller if asked) as "self-hosted orchestration, bring-your-own
  AI providers" — a precise three-tier spectrum (fully local ↔ OpenVent ↔ fully managed) instead of an
  unqualified claim. Directly responds to real Reddit feedback pointing out that Twilio/Deepgram/PSTN can't
  actually be self-hosted. See ADR-016. Documentation/copy only — no functional code changes.

## [Unreleased] — 2026-07-05 (integrations, resilience layer, CI)

### Added
- Shared integration resilience layer (`packages/web/src/api/voice/integrations/resilient-fetch.ts`) —
  timeout, retry with backoff, and a per-integration circuit breaker, so a slow or down third-party API
  degrades gracefully instead of stalling or crashing a live call turn. 7 tests.
- Three new pre-built integrations, direct response to real community feedback: GoHighLevel and Salesforce
  (both wired into `crmSync`, priority order GoHighLevel → Salesforce → HubSpot), and Google Calendar
  (replaces the old `bookAppointment` stub with a real booking flow). HubSpot's existing integration was
  extracted and rewrapped in the same resilience layer for consistency.
- `docs/testing.md` — what's tested, how to run tests, how to write new ones, what's deliberately not
  covered yet (the live call pipeline, OAuth flows).
- `.github/workflows/ci.yml` — GitHub Actions CI: typecheck, full test suite, build, and lint on every push/
  PR to `main`. No real secrets needed — build and tests are fully static/mocked.
- 18 new tests total (7 resilience-layer + 11 across the four integrations) — 64 tests passing across both
  packages, up from 46.

### Fixed
- 7 lint errors closed to get `bun run lint` fully green (missing aria-labels on dashboard form inputs, an
  autoFocus a11y warning, an unnecessary spread fallback, one pre-existing unused import) — required for
  CI's lint step to mean anything.

## [Unreleased] — 2026-07-05 (docs restructure, roadmap, open-core decision)

### Added
- `ROADMAP.md` — dated, checklist-based roadmap: what's shipped, in progress, and next, tied to the
  open-core direction (ADR-015).
- `CONTRIBUTING.md` — project structure, dev setup gotchas, testing/docs expectations, code style, for
  anyone sending a PR.
- `docs/` folder — split the single long README into focused files: `getting-started.md`,
  `architecture.md`, `api-reference.md`, `security.md`, `compliance.md`, `configuration.md`,
  `state-engine.md`, `dashboard.md`.
- Live app URL added to the top of README.

### Changed
- README slimmed to an entry point — feature overview + links into `docs/`, `ROADMAP.md`, `CONTRIBUTING.md`
  — instead of one long file covering everything.
- `routes.ts` given a top-of-file header explaining the route groupings, for contributors landing there
  first.

### ADR-015 (logged, no code change)
- OpenVent is an open-core framework: the self-hosted pipeline stays free and fully open forever; a paid layer
  (managed hosting, premium integrations, hosted national DNC sync, enterprise support) can sit on top
  later. Chosen over a pure library (weak monetization/pitch) or a pure hosted platform (abandons the
  lock-in-free positioning the market research validated).

## [Unreleased] — 2026-07-05 (reverted named tunnel, back to quick-tunnel)

### Changed
- Reverted ADR-013's named Cloudflare tunnel — a plain CNAME on Vercel's DNS can't route into
  `cfargotunnel.com` without Cloudflare actually proxying the hostname, and Cloudflare's free-tier
  Partial (CNAME) Setup that would've enabled that is no longer self-serve. Not worth a full nameserver
  migration at this stage (pre-launch, going into a Reddit/community-feedback phase). Back to the free
  quick-tunnel + `tunnel-supervisor.sh`, which already auto-updates `PUBLIC_APP_URL`/the Twilio webhook on
  every URL rotation. See ADR-014.

## [Unreleased] — 2026-07-05 (named Cloudflare tunnel)

### Added
- Real named Cloudflare Tunnel (`vent.irishi.dev` → `localhost:4200`), created via the Cloudflare API and
  run through `scripts/run-cloudflare-tunnel.sh`, managed by PM2 (`cloudflare-tunnel` process) — replaces
  the free `trycloudflare.com` quick-tunnel's rotating URLs. See ADR-013.
- `PUBLIC_APP_URL` and the Twilio number's Voice webhook both updated to the fixed hostname.
- `scripts/tunnel-supervisor.sh` (the old quick-tunnel mitigation) marked superseded in its header comment,
  kept only as a no-domain fallback for local dev.

## [Unreleased] — 2026-07-05 (state engine + operator dashboard)

### Added
- Structured call state (`captureField` tool, `calls.capturedState` JSON column,
  `CallSession.capturedState`) — the agent records durable facts (email, order ID, name, etc.) as
  deterministic key/value pairs instead of relying on the raw transcript as memory. Every turn's system
  prompt is appended with a "Known facts — do not ask for these again" block built from this state
  (`agent.ts`'s `buildKnownFactsBlock`), fixing the "asks for the same info twice" failure mode. See
  ADR-012.
- State is persisted continuously (on every `captureField` call, not just at call end) so it survives a
  mid-call crash and is visible on the dashboard immediately, and seeded from the DB row/session on call
  start so workflow retries and pre-filled context carry forward.
- New operator dashboard (`/dashboard`, gated behind `ADMIN_API_KEY` via a client-side key prompt):
  - `/dashboard` — live/completed calls list, auto-refreshing, with capture-count indicators
  - `/dashboard/calls/:id` — full transcript, tool-call log, and a dedicated captured-state panel
  - `/dashboard/dnc` — add/remove Do-Not-Call entries from the UI instead of curl only
- New backend endpoint `GET /api/voice/calls/:id/tool-calls` (was missing — needed for the dashboard's
  per-call detail view).
- Tests: `agent.test.ts` (4), `tools/captureField.test.ts` (2) — 48 tests total across both packages, all
  passing. Typecheck and build both clean; `db:push` applied the new column with no manual migration.

## [Unreleased] — 2026-07-05 (v1.3 hardening: auth, signature validation, retry-cap fix, rate limiting)

### Added
- Admin-key auth (`requireAdminKey` middleware, `packages/web/src/api/voice/middleware/admin-auth.ts`) on
  all ops endpoints (`/calls`, `/dnc`, `/callers`, `/webhooks/test`) — checks `X-OpenVent-Admin-Key` header
  against `ADMIN_API_KEY`. Warns loudly at startup if unset instead of crashing (unauthenticated mode is
  fine for local dev, not for anything public).
- Twilio signature validation (`requireTwilioSignature` middleware,
  `packages/web/src/api/voice/middleware/twilio-signature.ts`) on `/incoming`, `/status-callback`, and
  `/recording-status` — rejects any webhook request that doesn't carry a valid `X-Twilio-Signature` with a
  `403`, closing off forged-webhook attacks (e.g. a fake "not-interested" outcome auto-adding a number to
  DNC).
- E.164 phone number validation (`packages/web/src/api/voice/validation.ts`, `isValidE164`) on
  `POST /calls/outbound` and `POST /dnc` — malformed numbers now return `400` instead of failing deeper in
  the pipeline (or silently misbehaving with Twilio).
- Outbound call rate limiting (`rateLimitOutboundCalls` middleware,
  `packages/web/src/api/voice/middleware/rate-limit.ts`) — fixed-window guard, `OUTBOUND_CALL_RATE_LIMIT`
  (default 30) per `OUTBOUND_CALL_RATE_WINDOW_MS` (default 60000ms). Additive to, not a replacement for,
  the DNC/calling-window compliance checks.
- National DNC registry adapter shape (`packages/openvent-compliance/src/national-dnc.ts`) —
  `syncNationalDncRegistry`, `NationalRegistryFetcher` type, and `noopNationalRegistryFetcher`. Documented
  stub only; no live registry sync (would require a real SAN, which can't be provisioned in this sandbox).
- Tunnel supervisor script (`scripts/tunnel-supervisor.sh`) — monitors the `cloudflared` quick-tunnel
  process, restarts it on crash, and auto-updates `PUBLIC_APP_URL` plus the Twilio number's Voice webhook
  whenever the tunnel URL changes. Documented as a mitigation for local/dev use, not a substitute for a
  named tunnel or persistent domain (see ADR-008).
- Test coverage: 12 new tests across `validation`, `number-config`, `session-store`,
  `llm/index`, `tts/index`, `workflows/index` (web app, now 25 total), plus 2 new tests in
  `openvent-compliance` for the national DNC adapter (now 15 total). 40 tests passing across both packages.

### Fixed
- **Real SMS delivery.** `sendSms` in `workflows/engine.ts` now calls `twilioClient.messages.create()` —
  previously a stub that only logged and never actually sent anything.
- **Retry cap enforcement.** Workflow actions define `maxRetries`, but nothing ever enforced it —
  `runWorkflowForOutcome` now takes a `previousAttempt` param, computes `nextAttempt`, and refuses to
  schedule another retry once `nextAttempt > maxRetries`. Previously a misconfigured or endlessly-failing
  workflow could re-dial a number forever.
- **Scheduler double-execution.** `scheduler.ts` now does an atomic claim (`pending` → `claimed` via a
  conditional `UPDATE ... RETURNING`) before executing a scheduled call, preventing two scheduler ticks
  from picking up and running the same row. Rows deferred by the calling-window check are correctly reset
  back to `"pending"` (previously they got stuck at `"claimed"` forever — a second bug fixed in the same
  pass).

### Changed
- `scheduledCalls.status` enum (`packages/web/src/api/database/schema.ts`) extended with `"claimed"` — a
  SQLite text column, so no migration was required (`db:push` confirms "No changes detected").

## [Unreleased] — 2026-07-05 (compliance layer extracted into a standalone package)

### Added
- New workspace package `packages/openvent-compliance` (`@openvent/compliance`) — the TCPA calling-window check,
  Do-Not-Call enforcement, consent/AI disclosure injection, HIPAA boot-time guardrail, and GDPR
  retention/erasure modules, extracted with zero dependency on Twilio, Bun/Hono, or any specific database.
  Storage-backed modules now take a small adapter interface (`DncStorageAdapter`, `CallLogStorageAdapter`)
  instead of importing a database directly; in-memory reference adapters ship for quick starts and tests.
  New `checkOutboundCallCompliance()` convenience helper runs the DNC + calling-window gates together in
  one call. 13 unit tests included, all passing standalone (no OpenVent-specific code required).
- `packages/web/src/api/voice/compliance/adapters.ts` — Drizzle/Turso adapters wiring OpenVent's own schema
  into the new package; this is the only app-specific glue code the extraction required.

### Changed
- OpenVent's app-level compliance code (`voice/compliance/{calling-window,dnc,consent,hipaa,gdpr}.ts`) removed
  and replaced by imports from `@openvent/compliance` throughout (`routes.ts`, `agent.ts`, `server.ts`,
  `api/index.ts`, `workflows/engine.ts`, `workflows/scheduler.ts`) — proves the extraction works standalone
  by dogfooding it in the real, already-working app rather than leaving it untested in isolation.

### Verified
- All previously-passing compliance regression checks (DNC add/list/remove/block, calling-window
  enforcement, GDPR erasure endpoint, `/api/health` compliance reporting) re-run and pass identically
  after the swap.

## [Unreleased] — 2026-07-04 (research: CAI market landscape + orchestration framework evaluation)

### Research / Decisions (no code changes)
- Completed a competitive research pass on the Conversational AI / voice-agent market (AI-native platforms,
  hyperscaler CCAI offerings, CRM-embedded voice AI, legacy CCaaS incumbents) — see the delivered market
  report for the full comparison matrix and compliance benchmark. Key finding: every serious AI-native
  competitor (ElevenLabs Agents, Vapi, Retell AI, Bland AI, Synthflow) already ships SOC 2 + HIPAA (several
  with GDPR/PCI-DSS/ISO27001); OpenVent's current HIPAA support is a boot-time guardrail, not a certification.
- Evaluated adopting an open-source orchestration framework (Pipecat, LiveKit Agents, TEN Framework,
  Vocode) instead of maintaining OpenVent's own STT→LLM→TTS pipeline. Investigated LiveKit Agents specifically
  (TypeScript SDK, documented Twilio integration) and ultimately **rejected it** — both its Cloud and
  self-hosted deployment options reintroduce vendor/infrastructure dependencies OpenVent is built to remove,
  and its WebRTC/SIP telephony model is architecturally mismatched with OpenVent's existing Twilio Media
  Streams (WebSocket) integration. See `DECISIONS.md` ADR-009 for the full reasoning. No code was changed
  as part of this evaluation — OpenVent's existing direct pipeline continues unmodified.

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
- Agent's default persona rewritten: knows what OpenVent is (answers "what are you" without a tool call),
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
- OpenVent brand identity and storytelling landing page — paper/ink/ember palette, Fraunces/Inter Tight/
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
