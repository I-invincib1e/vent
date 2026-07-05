# Architecture Decision Records

This log records consequential technical and product decisions made while building Vent — the *why*
behind the code, not just the *what*. Format: one entry per decision, dated, with context, the decision
itself, and its consequences/tradeoffs. New entries are appended as the project evolves; existing entries
are never rewritten (if a decision is later reversed, add a new entry that supersedes it and says so).

Loosely follows the [Architecture Decision Record](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)
pattern popularized by Michael Nygard.

---

## ADR-001 — Self-hosted pipeline over a managed voice-agent platform
**Date:** 2026-07-04

**Context:** Managed platforms (Vapi, Retell, ElevenLabs Agents) offer faster setup for voice agents but
put the operator's prompts, call data, and per-minute cost structure inside someone else's product, with
whatever roadmap and pricing changes that platform decides on.

**Decision:** Build Vent as infrastructure the operator owns end to end — Twilio, Deepgram, the LLM, and
the TTS engine wired directly, with our own database for calls/transcripts, not a third party's dashboard.

**Consequences:** More setup work and more moving pieces to maintain (three-plus vendor integrations
instead of one platform SDK), but full control over cost, data residency, prompt/tool logic, and the
ability to swap any single layer (see ADR-002, ADR-005) without being blocked by a platform's feature
gaps. This tradeoff is explicit in the product's own positioning ("your infrastructure, your rules").

---

## ADR-002 — Cartesia as the default TTS provider, ElevenLabs kept as an option
**Date:** 2026-07-04

**Context:** A real outbound test call went completely silent after connecting. Investigation found
ElevenLabs' free tier returns `402 payment_required` ("Free users cannot use library voices via the API")
for every voice in the account, regardless of which voice ID is configured — this isn't a bug in our code,
it's an ElevenLabs account-tier restriction that can't be worked around without upgrading to a paid plan.

**Decision:** Add Cartesia as a second TTS provider behind a shared `ConnectTts` interface
(`voice/tts/types.ts`), and make it the default (`TTS_PROVIDER=cartesia`) since it works on a free/Starter
plan with no equivalent restriction, and it natively outputs `pcm_mulaw` at 8000Hz — the exact format
Twilio's Media Streams need, with zero re-encoding, matching the same zero-conversion path ElevenLabs
already had.

**Consequences:** ElevenLabs remains fully supported for anyone with a paid plan (`TTS_PROVIDER=elevenlabs`)
— this wasn't a replacement, it was adding optionality the user explicitly asked for ("we will add more
providers"). The provider abstraction this required (rather than a hardcoded ElevenLabs call) is now the
template every future TTS/LLM provider follows.

---

## ADR-003 — Compliance is enforced by default, not left as an integration step
**Date:** 2026-07-04

**Context:** The user explicitly asked for compliance (TCPA, DNC, consent, HIPAA, GDPR) that "runs itself"
— the developer adopting this repo shouldn't have to remember to wire in a DNC check or a recording
disclosure; those are exactly the kind of steps that get skipped under deadline pressure and turn into
real legal exposure once calls are actually placed at volume.

**Decision:** Every outbound call automatically passes through a Do-Not-Call check and a TCPA
calling-window check before dialing (`voice/compliance/`, wired directly into
`POST /calls/outbound`) — a call that fails either check is rejected with a clear reason and never reaches
Twilio. The recording/AI disclosure is spoken at the start of every call by default
(`RECORDING_DISCLOSURE_ENABLED=true` is the default, not opt-in).

**Consequences:** A developer who does nothing beyond setting up API keys still gets baseline TCPA/consent
behavior. The tradeoff is that these checks add a small amount of unavoidable overhead/latency to every
outbound call, and the calling-window timezone inference is best-effort (area-code-based), not perfectly
precise — documented as such rather than presented as legally airtight.

---

## ADR-004 — HIPAA support is a guardrail, not a certification
**Date:** 2026-07-04

**Context:** HIPAA compliance legally requires a signed Business Associate Agreement (BAA) between the
covered entity and every vendor that touches PHI — Twilio, Deepgram, the TTS provider, the LLM provider.
No code running in this repo can verify that a BAA actually exists; that's a contract, not a technical
state.

**Decision:** Rather than silently assume compliance or omit HIPAA support entirely, add a
`COMPLIANCE_MODE=hipaa` flag that makes the server **refuse to boot** unless the operator also sets
`HIPAA_BAA_CONFIRMED=true` — a deliberate human checkpoint. This is documented explicitly, in both the
README and the code comments, as a guardrail against the failure mode of "nobody actually checked," not a
claim that setting the flag makes the deployment HIPAA-compliant.

**Consequences:** This adds friction (a mode that won't start without an extra flag) by design. It does
not, and cannot, replace actually signing BAAs or a real compliance review — that responsibility stays with
the operator. The same honesty principle applies to GDPR: only the concretely codeable pieces (retention
limits, right-to-erasure) are automated; a legal basis for processing is still the operator's
responsibility.

---

## ADR-005 — Groq added as a swappable LLM provider behind the same pattern as TTS
**Date:** 2026-07-04

**Context:** The user asked specifically about using Groq for lower latency/cost. Research confirmed LLM
inference is typically the single largest latency contributor in a voice pipeline (larger than STT or
TTS), and Groq's LPU-based inference is a commonly cited fix for exactly this bottleneck in real-time voice
agents.

**Decision:** Add Groq via the official `@ai-sdk/groq` package as a second LLM provider
(`voice/llm/`), selected via `LLM_PROVIDER=groq`, mirroring the TTS provider-abstraction pattern from
ADR-002 rather than hardcoding a second code path. Added time-to-first-token telemetry per turn so the
latency claim can be measured on real calls instead of assumed.

**Consequences:** The AI Gateway path remains the default (`LLM_PROVIDER=gateway`) since it's what the
platform provisions out of the box; Groq requires the user to supply their own `GROQ_API_KEY`. No
production call has yet been run with Groq active — this decision is recorded, but the latency claim is
not yet empirically verified in this deployment (tracked as an open item).

---

## ADR-006 — Workflows as code-first JSON config, not a visual builder
**Date:** 2026-07-04

**Context:** The user asked for Shopify-flow-style call automation (trigger → branch on outcome → action).
Competitor platforms (Retell, ElevenLabs Agents) increasingly offer visual graph-based workflow builders,
but Vent has no dashboard/UI by explicit earlier product decision.

**Decision:** Define workflows as a JSON array (`WORKFLOWS` env var) mapping call outcomes to actions
(retry/webhook/addToDnc/sendSms-stub), executed by a small engine (`voice/workflows/engine.ts`) and a
background scheduler for delayed retries (`scheduler.ts`).

**Consequences:** No visual editing — changing a workflow means editing an env var and restarting. This
matches the rest of Vent's "edit code/config, not a dashboard" philosophy, but is a real limitation for a
non-technical operator. A visual workflow builder is flagged as a natural v3 direction if the product ever
needs to serve non-developer users directly.

---

## ADR-007 — National DNC Registry integration deferred; internal list is the enforced mechanism today
**Date:** 2026-07-04

**Context:** Research confirmed there is no free public API for the FTC's National Do-Not-Call Registry —
real-time or bulk lookups require a paid Subscription Account Number (SAN) obtained through
telemarketing.donotcall.gov. This is a purchasing decision for the operator, not something the codebase can
resolve unilaterally.

**Decision:** Build and fully enforce an internal DNC list (`voice/compliance/dnc.ts`,
`doNotCall` table) automatically on every outbound call today. Design the check function and schema
(`source: "manual" | "agent" | "national-registry"`) so that syncing the national registry in later is a
pure data-population problem, not a code change — the enforcement path already treats all three sources
identically.

**Consequences:** Out of the box, Vent only blocks numbers the operator has explicitly added (manually, or
automatically via a workflow's `addToDnc` action). It does **not** currently prevent calling numbers
registered on the national registry unless the operator manually adds them — this is a known gap,
documented in the README's "Known limitations," not silently glossed over.

---

## ADR-008 — Public endpoint via a free Cloudflare quick-tunnel is a temporary stopgap, not a solution
**Date:** 2026-07-04

**Context:** Discovered that this platform's own public preview URL doesn't pass through WebSocket upgrade
requests (`502` on any `Upgrade: websocket` header, confirmed even on plain routes) — a hard requirement
for Twilio Media Streams. A Cloudflare quick-tunnel (`cloudflared tunnel --url ...`, no account needed) was
stood up as a workaround, and it already dropped once mid-test (`"no recent network activity"` in tunnel
logs), independent of anything in the application code.

**Decision:** Use the quick-tunnel to unblock real-call testing in the short term, but explicitly document
it as unfit for anything beyond occasional manual testing — not a production access path.

**Consequences:** Any further live-call testing inherits this instability until resolved. Two real fixes
are on the table (recorded as an open decision, not yet made): (1) an authenticated Cloudflare named
tunnel (still free, requires a Cloudflare account + domain, far more stable), or (2) deploying the server
to a persistent host outside this sandbox with its own stable domain. This ADR exists so the tradeoff isn't
forgotten or mistaken for a solved problem in future work.

---

## ADR-009 — Evaluated and rejected LiveKit Agents as an orchestration layer
**Date:** 2026-07-04

**Context:** After market research showed Vent's STT→LLM→TTS orchestration isn't novel (Pipecat, LiveKit
Agents, TEN Framework, and Vocode all solve this with bigger plugin ecosystems and more production
mileage), the idea of adopting one of these frameworks instead of maintaining Vent's own hand-rolled
pipeline was raised and investigated. LiveKit Agents was the strongest candidate — it ships an official
TypeScript SDK (matching Vent's Bun/TypeScript stack, unlike Pipecat which is Python-only server-side) and
has documented Twilio integration patterns.

Deeper investigation surfaced two disqualifying problems:
1. **Both LiveKit deployment options reintroduce the exact dependency Vent exists to remove.** LiveKit
   Cloud puts a third-party vendor between the operator and their own calls — the black-box-platform
   pattern Vent's positioning argues against, plus another account/API-key set every adopter would need.
   Self-hosted LiveKit requires running a media server (SFU) + Redis for room-state coordination, meets
   LiveKit's own recommended baseline of 4 CPU cores / 8GB RAM per agent server, and needs a domain + SSL
   certificate + Docker/Kubernetes — a large new operational burden for every person who adopts Vent, the
   opposite of the "less hustle for our users" goal.
2. **Architectural mismatch with Twilio.** Vent's current pipeline uses Twilio Media Streams, a
   WebSocket-based audio bridge. LiveKit's telephony model is WebRTC + SIP trunking — a different
   transport entirely. Twilio's own support docs confirm they do not offer a SIP-over-WebSocket endpoint,
   so bridging the two requires an extra translation layer (Twilio → SIP trunk → LiveKit dispatch rules →
   LiveKit room); public GitHub issues describe this specific bridge behaving unreliably in production.

**Decision:** Reject adopting LiveKit Agents (or any hosted/self-hosted orchestration framework) for
Vent's core pipeline. Keep and continue hardening the existing direct Twilio Media Streams + Deepgram +
swappable-LLM + swappable-TTS pipeline, which is already built, already proven on a real call, and
requires no infrastructure beyond the API providers a user already needs.

**Consequences:** Vent will not benefit from Pipecat's/LiveKit's larger plugin ecosystems or their ongoing
engineering investment in raw pipeline features (turn-detection tuning, WebRTC transport optimizations,
etc) — that tradeoff is accepted deliberately. The "leverage" identified in earlier research (that no
competitor, hosted or open-source, ships automatic compliance/workflows/control) remains the correct place
to invest instead, since it doesn't require adopting anyone else's infrastructure to build. This decision
supersedes the direction implied by the (unexecuted) LiveKit migration plan from earlier the same day — no
code was migrated before this reversal, so no rollback was needed.

---

## ADR-010 — Extracted the compliance layer into a standalone, framework-agnostic package
**Date:** 2026-07-05

**Context:** Following ADR-009's decision to keep Vent's direct pipeline instead of adopting an
orchestration framework, the identified leverage — automatic compliance that no competitor (hosted
platform or open-source framework) ships out of the box — needed to become concrete rather than aspirational.
Vent's compliance modules (`calling-window`, `dnc`, `consent`, `hipaa`, `gdpr`) were originally written
directly against Vent's own Drizzle/Turso schema, which meant they could only ever be "a compliance layer
inside one app," not something another developer — on any telephony stack or orchestration framework —
could adopt independently.

**Decision:** Extract all five compliance modules into a new workspace package, `packages/vent-compliance`
(published as `@vent/compliance`), with zero dependency on Twilio, Bun/Hono, or any specific database.
Storage-backed modules (`dnc`, `gdpr`) now accept a small adapter interface (`DncStorageAdapter`,
`CallLogStorageAdapter`) instead of importing Vent's `db` directly; in-memory reference adapters ship in
the package for quick starts and tests. Vent's own app was then refactored to consume the extracted
package via a thin Drizzle adapter (`packages/web/src/api/voice/compliance/adapters.ts`) — proving the
extraction works standalone by dogfooding it in the real, working app rather than leaving it untested.

**Consequences:** The package was verified with 13 unit tests covering every module using only the
in-memory adapters (no Vent-specific code touched), and the app's existing compliance behavior (DNC block,
calling-window enforcement, GDPR erasure, health-check reporting) was regression-tested via the same curl
checks used in prior sessions — all passed identically after the swap. This is the first concrete step of
the "library → framework" roadmap: the compliance layer is now something a Pipecat, LiveKit, or entirely
custom voice pipeline could adopt without adopting Vent itself. Packaging for public npm distribution
(making this installable outside this monorepo) remains a separate, not-yet-executed step.

---

## ADR-011 — v1.3 hardening pass: auth, signature validation, retry-cap fix, rate limiting
**Date:** 2026-07-05

**Context:** Before treating v1 as "done," a hardening pass was needed to close the gap between "works in
a sandbox with a trusted operator" and "safe to expose publicly." Several issues existed: ops endpoints had
no auth at all; Twilio webhooks accepted any request regardless of origin (forgeable); workflow retries had
a `maxRetries` field that was never actually checked, so a bad workflow config could redial a number
forever; the scheduler could double-execute a scheduled call under concurrent ticks; outbound calls had no
rate ceiling; and `sendSms` was a stub that logged instead of sending.

**Decision:** Close all of the above in one pass, each as the smallest correct fix rather than a bigger
redesign:
- Admin-key middleware (`X-Vent-Admin-Key` vs `ADMIN_API_KEY`) in front of every ops endpoint, warn-not-crash
  if unset (keeps local dev frictionless, makes the risk visible).
- Twilio's official request-signing scheme (`twilio.validateRequest`) in front of every inbound webhook.
- Atomic `pending`→`claimed` claim (conditional `UPDATE ... RETURNING`) in the scheduler, with a reset back
  to `pending` for calling-window-deferred rows (fixing a second, related bug where those rows got
  permanently stuck as `claimed`).
- `previousAttempt`/`nextAttempt` tracking so `maxRetries` is actually enforced.
- A basic fixed-window rate limiter on `/calls/outbound`, explicitly additive to (not a replacement for)
  the existing DNC/calling-window compliance gates.
- Wired `sendSms` to `twilioClient.messages.create()` for real.
- A National DNC registry *adapter shape* (`syncNationalDncRegistry`, `NationalRegistryFetcher`), shipped
  as a documented stub (`noopNationalRegistryFetcher`) rather than a real integration — the real US
  National DNC Registry requires a SAN (Subscription Account Number) that can't be provisioned in this
  sandbox. This closes the "we said we'd design for this later" gap from ADR-007 without pretending it's
  live.
- A tunnel supervisor script (`scripts/tunnel-supervisor.sh`) that watches `cloudflared`, restarts it on
  crash, and keeps `PUBLIC_APP_URL` + the Twilio webhook in sync with the tunnel's (rotating) URL. This is
  explicitly a mitigation for the quick-tunnel stopgap from ADR-008, not a fix for the underlying problem —
  the real fix remains a named tunnel or a persistent real domain.

**Consequences:** 12 new web-app tests and 2 new compliance-package tests added (40 total across both
packages, all passing); typecheck and build both clean. Regression-verified via curl: DNC add/list/remove,
E.164 rejection on `/dnc` and `/calls/outbound`, DNC-blocked outbound call returns `403`, malformed JSON
returns `400` not `500`, unsigned Twilio webhook rejected `403`, admin-key gate returns `401`
without/with-wrong key and `200` with the correct key. npm publishing of `@vent/compliance` (ADR-010's
"remains a separate step") is still deferred — this round is about hardening the existing surface, not
distribution.

---

---

## ADR-012 — Structured call state as ground truth, not the transcript
**Date:** 2026-07-05

**Context:** A recurring production failure mode in voice agents (surfaced via a Reddit thread analyzed
alongside this project's own market research) is that agents re-ask for information the caller already
gave, or contradict earlier answers, once that information scrolls outside whatever the model effectively
attends to. This isn't a model-quality problem — it happens even with strong models — because the only
"memory" most voice-agent stacks have is the raw transcript (or a lossy summary/RAG layer over it), with no
deterministic, structured source of truth the agent is required to read from. Vent had this same gap:
`history: ModelMessage[]` was the only state a call carried.

**Decision:** Add a structured `CallState` layer that sits alongside, not instead of, the transcript:
- A new `captureField` tool (`voice/tools/captureField.ts`) lets the agent explicitly record a durable fact
  (email, order ID, name, callback time, etc.) as a `{ field, value }` pair the moment the caller states it,
  rather than leaving extraction implicit in free text.
- `calls.capturedState` (new JSON column) and `CallSession.capturedState` (session-store) hold this as a
  plain `Record<string, string>` — deterministic, inspectable, and persisted continuously (on every
  `captureField` call, not just at call end) so it survives a mid-call crash and shows up on the dashboard
  immediately.
- `agent.ts`'s `buildKnownFactsBlock()` renders the current state as an explicit "Known facts — already
  confirmed, do not ask for these again" block appended to the system prompt every turn. The model is told
  what's known instead of being expected to re-derive it from scrollback.
- This was deliberately scoped as a feature *within* Vent's existing compliance/self-hosted positioning,
  not a repositioning of the project. Compliance, audit logging, and debugging all benefit from the same
  structured state (a captured `disposition` or DNC-triggering fact is exactly this kind of data already);
  this generalizes that pattern instead of introducing a separate identity for it.

**Consequences:** Two new test files (`agent.test.ts`, `tools/captureField.test.ts`, 6 tests) exercise
`buildKnownFactsBlock`'s empty/populated/multi-field/non-mutating behavior and the tool's shape; full suite
(48 tests across both packages) still green, typecheck and build clean, `db:push` applied the new column
with no manual migration needed (SQLite JSON text column). A companion dashboard (`/dashboard`) was built in
the same round specifically to make captured state visible and auditable per call, not just log lines — see
the dashboard section of README.md. Not done in this round: no automatic slot *schema* per persona (i.e. no
way to declare "this persona must capture email + order_id before ending the call") — the model decides
what's worth capturing based on the tool description alone. That's a reasonable next step if this needs to
become stricter (e.g. compliance-required fields) rather than best-effort.

---

## ADR-013 — Named Cloudflare tunnel replaces the quick-tunnel supervisor
**Date:** 2026-07-05

**Context:** ADR-008 documented the free `trycloudflare.com` quick-tunnel's core problem: it assigns a new
random URL on every restart, so `PUBLIC_APP_URL` and the Twilio Voice webhook drift out of sync whenever
the tunnel drops. ADR-011's `tunnel-supervisor.sh` mitigated the pain (auto-restart + auto-update the
webhook on URL change) but explicitly said the real fix was a named tunnel or a persistent real domain.
The user now has a Cloudflare account and a domain (DNS managed on Vercel, not moved to Cloudflare).

**Decision:** Create a real named Cloudflare Tunnel via the Cloudflare API rather than the quick-tunnel:
- `POST /accounts/:id/cfd_tunnel` creates a persistent tunnel with a fixed ID; ingress config routes
  `vent.<domain>` → `http://localhost:4200` via `PUT /accounts/:id/cfd_tunnel/:id/configurations`.
- DNS stays on Vercel — a tunnel only needs a CNAME pointing at `<tunnel-id>.cfargotunnel.com`; moving the
  zone to Cloudflare was never required. This CNAME is added manually in Vercel's panel (not automatable
  without Vercel API credentials, which weren't requested).
- The tunnel token is stored in `.cloudflare-tunnel-token` (repo-root, gitignored, never committed) rather
  than passed inline on the command line, to avoid it ending up in shell history or a tmux pane buffer.
- Run via `scripts/run-cloudflare-tunnel.sh`, managed by PM2 (`cloudflare-tunnel` process) alongside
  `web-app` — consistent with how the main server is already supervised, and gives automatic restart on
  crash without a separate bash-loop supervisor.
- `tunnel-supervisor.sh` (ADR-011) is kept in the repo but marked superseded — still useful as a fallback
  for local dev without a domain, but no longer what's actually running.
- `PUBLIC_APP_URL` and the Twilio number's Voice webhook were both updated to the new fixed hostname; no
  more rotation, so no auto-update logic is needed for this path (unlike the quick-tunnel's URL-on-every-
  restart problem).

**Consequences:** This closes the last open item from ADR-011's hardening round. The tunnel has a fixed
hostname now, so call quality/webhook delivery no longer depends on catching a URL-rotation event in time.
Tradeoff: standing up this tunnel required real Cloudflare account credentials (API token, account ID) —
fine for this project since the user has them, but means the setup isn't zero-account like the quick-tunnel
was; documented in README as an optional-but-recommended step for anyone self-hosting Vent long-term.

---

*Next entry number: ADR-014. Add new entries above this line, keeping numbering sequential and dates
accurate to when the decision was actually made.*
