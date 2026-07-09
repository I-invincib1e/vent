# OpenVent

**Your voice agent. Your infrastructure. Your rules.**

[![CI](https://github.com/I-invincib1e/vent/actions/workflows/ci.yml/badge.svg)](https://github.com/I-invincib1e/vent/actions/workflows/ci.yml)

🔗 **Live:** [openvent.dev](https://openvent.dev/) — the landing page and in-app docs (`/docs`).

OpenVent is **self-hosted orchestration, bring-your-own AI providers** — not a black-box voice AI platform,
and not a claim that everything down to the phone network runs on your own hardware (nobody self-hosts a
cell tower). The code, the database, the call logic, the compliance rules, and the dashboard are yours,
fully open, and run on your own infrastructure. Twilio (telephony) and Deepgram/your chosen STT provider
remain cloud APIs by necessity — OpenVent wires them together, along with an LLM and a TTS engine, into one
live pipeline where you own everything above the network layer: your code, your keys, your data.

Think of it as sitting deliberately in the middle of a spectrum: fully local voice AI (your own GPU running
a local LLM/STT/TTS, real but a different product with real latency/quality tradeoffs) on one end, fully
managed platforms (Vapi, Retell — zero infra, zero control) on the other. OpenVent self-hosts the orchestration
layer and lets you bring your own AI/telephony providers, rather than chasing either extreme. See
[`DECISIONS.md`](./DECISIONS.md) ADR-016 for the full reasoning.

Built with enterprise adoption in mind: compliance (TCPA/DNC/consent/HIPAA/GDPR) is enforced automatically,
not left for an integrator to remember; every provider (LLM, TTS) is swappable behind an abstraction layer;
and every consequential decision is recorded in [`DECISIONS.md`](./DECISIONS.md) so anyone adopting this
repo can understand *why* it works the way it does, not just *what* the code does.

**OpenVent is an open-core framework** — the self-hosted orchestration layer below is free and fully open,
forever. See [`DECISIONS.md`](./DECISIONS.md) ADR-015 for what that means and why.

## What it does

- **Inbound & outbound calls** — someone calls your Twilio number, or you trigger the agent to call them
- **Real-time STT/TTS** — audio streams both ways with sub-second turn-taking
- **Barge-in** — the caller can interrupt the agent mid-sentence; the agent stops instantly
- **Structured state, not just a transcript** — the agent captures durable facts (email, order ID, name)
  as ground truth it reads back every turn, instead of re-deriving them from scrollback — see
  [`docs/state-engine.md`](./docs/state-engine.md)
- **Tool calling** — the agent can look things up, book a real Google Calendar appointment, sync to
  GoHighLevel/Salesforce/HubSpot, or record a call disposition mid-conversation. Every integration is
  wrapped in a shared timeout/retry/circuit-breaker layer, so a slow or down third-party API degrades
  gracefully instead of stalling the call — see [`docs/configuration.md`](./docs/configuration.md)
- **Recording + transcripts** — every call and every turn is persisted to your own database
- **Operator dashboard** — calls, transcripts, captured state, and DNC management at `/dashboard` — see
  [`docs/dashboard.md`](./docs/dashboard.md)
- **Webhooks** — call lifecycle events push to n8n, Zapier, Make, or any URL you configure
- **Swappable providers** — LLM (AI Gateway or Groq) and TTS (ElevenLabs or Cartesia) behind a provider
  abstraction — swap with an env var, no code changes
- **Compliance, automatically** — TCPA calling-window + Do-Not-Call enforcement on every outbound call,
  spoken recording/AI disclosure by default, HIPAA boot-time guardrail, GDPR retention purge + erasure —
  see [`docs/compliance.md`](./docs/compliance.md)
- **Call workflows** — JSON-defined outcome-based automation with a background scheduler — see
  [`docs/configuration.md`](./docs/configuration.md)
- **Per-number configuration** — different Twilio numbers can run different personas, providers, and call
  limits without a redeploy

## Docs

| | |
|---|---|
| [`docs/getting-started.md`](./docs/getting-started.md) | Install, env vars, run it, trigger your first call |
| [`docs/architecture.md`](./docs/architecture.md) | How a call flows through the system, repo layout |
| [`docs/api-reference.md`](./docs/api-reference.md) | Every endpoint |
| [`docs/security.md`](./docs/security.md) | Admin auth, webhook signing, rate limiting, tunneling |
| [`docs/compliance.md`](./docs/compliance.md) | TCPA/DNC/HIPAA/GDPR — what's enforced automatically |
| [`docs/configuration.md`](./docs/configuration.md) | Workflows, per-number config, personas, agent tools |
| [`docs/state-engine.md`](./docs/state-engine.md) | Structured call state, why it exists |
| [`docs/dashboard.md`](./docs/dashboard.md) | The operator dashboard |
| [`docs/testing.md`](./docs/testing.md) | What's tested, how to run tests, how to write new ones, CI |
| [`ROADMAP.md`](./ROADMAP.md) | What's shipped, in progress, and next — with a checklist |
| [`DECISIONS.md`](./DECISIONS.md) | Every architecture decision and why, including reversals |
| [`CHANGELOG.md`](./CHANGELOG.md) | Dated history of everything shipped |
| [`CONTRIBUTING.md`](./CONTRIBUTING.md) | How to contribute — start here if you want to send a PR |

The same docs are also browsable in-app at `/docs` on the running server.

## Stack

Bun · Vite · React · Hono · Drizzle (Turso/SQLite) · Twilio · Deepgram · ElevenLabs/Cartesia ·
AI SDK (Gateway/Groq)

## Quick start

```bash
bun install
cp .env.example .env       # fill in your keys — see docs/getting-started.md
cd packages/web && bun run db:push
bun run start               # production server — required for live call audio
```

Full setup, every environment variable, and how to point Twilio at your app:
[`docs/getting-started.md`](./docs/getting-started.md).

## Known limitations

- The live call audio path (WebSocket bridge) only works under the production Bun server
  (`bun run start`), not Vite's dev server.
- Session state (persona, provider overrides, captured facts) is in-memory per call by default —
  fine for a single instance. Set `REDIS_URL` to switch to Redis-backed session storage if you run more
  than one instance; see [`docs/configuration.md`](./docs/configuration.md).
- National DNC Registry sync ships as an adapter shape only — the real US registry requires a paid
  Subscription Account Number (SAN); only your own internal DNC list is enforced automatically today.
- `captureField` has no per-persona required-slot schema — the model decides what's worth capturing based
  on the tool description, not a strict checklist.
- The dashboard supports labeled admin keys (create/list/revoke from `/dashboard/settings`), not full
  username/password accounts — fine for a small operator team, not a multi-tenant product login system.

See [`ROADMAP.md`](./ROADMAP.md) for what's actively being worked on to close these gaps.

## Contributing

OpenVent is open for contribution. See [`CONTRIBUTING.md`](./CONTRIBUTING.md) — project structure, dev
setup gotchas, testing/docs expectations, and code style — and [`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md)
for the ground rules. Check [`ROADMAP.md`](./ROADMAP.md) before starting on something non-trivial, and see
[`SECURITY.md`](./SECURITY.md) for reporting vulnerabilities privately.

## License

**Apache License 2.0** — see [LICENSE](./LICENSE). Fully open source (OSI-approved): use, modify,
self-host, or build on top of it commercially, with a patent grant included. The "OpenVent" name and logo
are trademarks, not covered by the code license — see [`TRADEMARK.md`](./TRADEMARK.md) if you're naming a
fork or hosted service. See `DECISIONS.md` ADR-028 for why this replaced the earlier fair-code license.
