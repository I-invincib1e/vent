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

*Next entry number: ADR-009. Add new entries above this line, keeping numbering sequential and dates
accurate to when the decision was actually made.*
