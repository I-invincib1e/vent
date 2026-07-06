# Roadmap

What's shipped, what's in flight, and what's next — kept honest and updated as things actually happen, not
aspirational. See [`DECISIONS.md`](./DECISIONS.md) for the reasoning behind any of these calls, and
[`CHANGELOG.md`](./CHANGELOG.md) for a dated history of what's already shipped.

## Where this is headed

Vent is an **open-core framework**, not a pure library or a pure hosted platform (see ADR-015). The
self-hosted pipeline — telephony, STT/LLM/TTS, the state engine, the compliance primitives, the dashboard —
stays free and fully open, forever. That's the trust mechanism for anyone who wants to self-host and verify
every claim by reading the code. A paid layer (managed hosting, premium integrations, hosted national DNC
sync, enterprise support) can sit on top of that later, once there's real signal it's worth building.

Right now: pre-launch, gathering real feedback from developers who'd actually use something like this
before committing to a bigger roadmap. Not optimizing for growth yet — optimizing for "are we solving a
real problem."

## v1 — Core pipeline ✅ shipped

- [x] Inbound + outbound calls via Twilio, real-time STT (Deepgram) / LLM (AI Gateway or Groq) / TTS
      (ElevenLabs or Cartesia)
- [x] Barge-in, call recording, turn-by-turn transcripts
- [x] Outgoing webhooks (n8n/Zapier/Make compatible)
- [x] Swappable providers behind an abstraction layer (no code changes to switch)
- [x] Compliance layer extracted to a standalone package (`@vent/compliance`) — DNC, TCPA calling window,
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

## In progress

- [ ] **Integration reliability wrapper** — shared timeout/retry/circuit-breaker wrapper around every
      external integration call, so a broken third-party API degrades gracefully instead of stalling or
      crashing a live call turn. Applies to the existing HubSpot stub and every integration below.
- [ ] **Pre-built integrations**, direct response to real community feedback ("lack of good integrations...
      ability to connect/fit in"):
  - [ ] GoHighLevel
  - [ ] Salesforce
  - [ ] Google Calendar (replaces the current `bookAppointment` stub with a real booking flow)
  - [ ] HubSpot (existing stub, wrapped in the new resilience layer for consistency)
- [ ] **Repo/docs restructure** — splitting the single long README into focused `docs/*.md` files,
      `CONTRIBUTING.md`, this roadmap — making the project easier for outside contributors to get into.

## Not started — researching first

- [ ] **Community feedback round** — posting genuine (not launch) questions to r/selfhosted, r/AI_Agents,
      r/LocalLLaMA to find out if the problems we think we're solving (lock-in, compliance, state/memory)
      match what builders in this space actually experience. This round is expected to reshape items below,
      not just validate them.
- [ ] **v2 launch positioning** — compliance-first / self-hosted / no-lock-in framing, informed by the
      community feedback round above. Paused until that feedback comes in.
- [ ] **Real national DNC registry sync** — blocked on a paid FTC Subscription Account Number (SAN), a
      recurring cost not currently budgeted. Under the open-core model (ADR-015), this is a candidate for a
      paid, hosted add-on later (Vent holds one SAN, amortized across customers) rather than something every
      self-hoster needs to pay for individually.
- [ ] **npm publish `@vent/compliance`** — explicitly deferred until the above feedback round and v1
      positioning settle; publishing before that risks locking in an API surface before real usage tests it.

## Later — depends on what the feedback round surfaces

These are directional, not committed, and will change based on what actually comes back from the
community-feedback round above:

- [ ] Managed hosting tier ("Vent Cloud") — for people who want the pipeline without running their own
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
