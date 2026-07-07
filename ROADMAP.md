# Roadmap

What's shipped, what's in flight, and what's next — kept honest and updated as things actually happen, not
aspirational. See [`DECISIONS.md`](./DECISIONS.md) for the reasoning behind any of these calls, and
[`CHANGELOG.md`](./CHANGELOG.md) for a dated history of what's already shipped.

## Where this is headed

OpenVent is an **open-core framework**, not a pure library or a pure hosted platform (see ADR-015). The
self-hosted orchestration layer — call logic, the state engine, the compliance primitives, the dashboard —
stays free and fully open, forever (AI providers and telephony remain cloud APIs by necessity — see ADR-016
for why "self-hosted" means orchestration, not the whole stack). That's the trust mechanism for anyone who
wants to self-host and verify every claim by reading the code. A paid layer (managed hosting, premium
integrations, hosted national DNC sync, enterprise support) can sit on top of that later, once there's real
signal it's worth building.

Right now: pre-launch, gathering real feedback from developers who'd actually use something like this
before committing to a bigger roadmap. Not optimizing for growth yet — optimizing for "are we solving a
real problem." Four rounds of real feedback in (Reddit + LinkedIn + direct competitive research) have
already reshaped priorities — see [`docs/strategy-2026-07.md`](./docs/strategy-2026-07.md) for the full
synthesis and reasoning behind the reprioritization below.

## v1 — Core pipeline ✅ shipped

- [x] Inbound + outbound calls via Twilio, real-time STT (Deepgram) / LLM (AI Gateway or Groq) / TTS
      (ElevenLabs or Cartesia)
- [x] Barge-in, call recording, turn-by-turn transcripts
- [x] Outgoing webhooks (n8n/Zapier/Make compatible)
- [x] Swappable providers behind an abstraction layer (no code changes to switch)
- [x] Compliance layer extracted to a standalone package (`@openvent/compliance`) — DNC, TCPA calling window,
      recording/AI disclosure, HIPAA boot guardrail, GDPR retention + erasure
- [x] Call workflows — outcome-based automation with a background retry scheduler
- [x] Per-number configuration (persona, provider, call limits per Twilio number)

## v1.3 — Hardening ✅ shipped

- [x] Admin-key auth on all ops endpoints
- [x] Twilio webhook signature validation
- [x] E.164 validation, proper 400s instead of 500s
- [x] Outbound call rate limiting
- [x] Real SMS delivery (was a stub)
- [x] Workflow retry-cap bug fix (maxRetries was never enforced before)
- [x] Scheduler double-execution guard
- [x] National DNC registry adapter shape (documented stub — real sync needs a paid SAN, not built yet)

## State engine + dashboard ✅ shipped

- [x] Structured, persisted call state (`captureField` tool) — agents stop re-asking for info already given
- [x] Operator dashboard (`/dashboard`) — calls list, call detail with transcript/tool-calls/captured-state,
      DNC management
- [x] Live product tour on the landing page using real dashboard screenshots

## Integrations + hardening ✅ shipped

- [x] **Integration reliability wrapper** (`integrations/resilient-fetch.ts`) — shared timeout/retry/
      circuit-breaker layer around every external integration call, so a broken third-party API degrades
      gracefully instead of stalling or crashing a live call turn. Per-integration breaker isolation (a dead
      HubSpot doesn't trip Salesforce's breaker). 7 tests.
- [x] **Pre-built integrations**, direct response to real community feedback ("lack of good integrations...
      ability to connect/fit in"):
  - [x] GoHighLevel (`crmSync`)
  - [x] Salesforce (`crmSync`)
  - [x] Google Calendar (`bookAppointment` — replaces the old always-stub with a real booking flow)
  - [x] HubSpot (existing integration, rewrapped in the new resilience layer for consistency)
- [x] **Repo/docs restructure** — split the single long README into focused `docs/*.md` files,
      `CONTRIBUTING.md`, this roadmap.
- [x] **CI** — GitHub Actions workflow (`.github/workflows/ci.yml`) running typecheck, full test suite,
      build, and lint on every push/PR to `main`. `docs/testing.md` documents what's covered and how to add
      tests.

## Compliance audit-trail export ✅ shipped

- [x] **Compliance audit-trail export** — `@openvent/compliance`'s `audit-trail.ts`: assembles, per call or per
      phone number, exactly who was called, when, under what disposition, current DNC status, whether the
      recording/AI disclosure was actually spoken (not just configured), and the full transcript. Exportable
      as plain text (hand-to-a-lawyer ready) or JSON. New endpoints (`GET /calls/:id/audit`,
      `GET /callers/:phoneNumber/audit`) and dashboard surfaces (export button on call detail, new
      `/dashboard/audit` page). Directly requested, independently, as "the thing that actually kills the
      compliance fear" — see ADR-017. 10 new tests, 74 total across both packages, regression-tested live.

## In progress

_(nothing actively in flight right now — see below for what's next, reprioritized after real community
feedback — see `docs/strategy-2026-07.md` for the full synthesis)_

## Next up — reprioritized from real feedback (four rounds, r/AI_Agents, r/VoiceAutomationAI, LinkedIn)

- [ ] **Per-call latency breakdown** — instrument STT connect time, first STT result, LLM time-to-first-
      token (already tracked, just not surfaced), TTS first-byte time, and total round-trip; show it on the
      dashboard's call detail page instead of one console.log line. Confirmed real gap against our own code,
      cheap to build. Now the top remaining priority.
- [ ] **Cross-call memory** (lower priority) — a per-phone-number rolling summary/history, complementing
      (not replacing) the structured `capturedState` engine. Distinct from Voximplant's `ApplicationStorage`
      pattern in mechanism (ours should stay closer to structured facts, not raw chat-history replay) but
      solves the same "remembers me from last time" use case, which OpenVent doesn't have at all today.

## Not started — researching first

- [x] ~~Community feedback round~~ — done, four rounds so far, still ongoing (see `docs/strategy-2026-07.md`)
- [ ] **v2 launch positioning** — compliance-first framing confirmed as the right lead by feedback; lock-in
      messaging demoted from headline to supporting proof point per convergent feedback from three
      independent sources (see `docs/strategy-2026-07.md` point 2). Still paused — waiting for the audit-
      trail feature above to ship before writing final launch copy, since it'll likely be the headline demo.
- [ ] **Real national DNC registry sync** — blocked on a paid FTC Subscription Account Number (SAN), a
      recurring cost not currently budgeted. Under the open-core model (ADR-015), this is a candidate for a
      paid, hosted add-on later (OpenVent holds one SAN, amortized across customers) rather than something every
      self-hoster needs to pay for individually.
- [ ] **npm publish `@openvent/compliance`** — still deferred until v1 positioning fully settles. The audit-
      trail feature (now shipped) makes this package a more complete story than it was, but the decision to
      wait was about launch timing/positioning, not feature completeness — no change to when this happens.

## Later — depends on what the feedback round surfaces

These are directional, not committed, and will change based on what actually comes back from the
community-feedback round above:

- [ ] Managed hosting tier ("OpenVent Cloud") — for people who want the pipeline without running their own
      tunnel/PM2/Twilio wiring
- [ ] Multi-tenant auth for the dashboard (currently single shared admin key — fine for one operator, not a
      team/multi-customer setup)
- [ ] Per-persona required-field schemas for the state engine (e.g. "must capture email before ending this
      call") — currently the model decides what's worth capturing, best-effort
- [ ] Redis/DB-backed session storage for horizontal scaling (currently in-memory per call, single-instance)

## How this roadmap gets updated

Whenever a decision changes direction (like ADR-013 → ADR-014's tunnel reversal), this file gets updated in
the same commit as the decision record — not left stale. If something here looks wrong or out of date,
that's a bug — open an issue.
