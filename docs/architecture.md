# Architecture

How a call actually flows through OpenVent, end to end.

## Where OpenVent sits: self-hosted orchestration, bring-your-own AI providers

Voice-agent architectures sit on a spectrum:

```
Fully local                    OpenVent                       Fully managed
(Ollama + local STT/TTS,       (orchestration self-       (Vapi, Retell, LiveKit
zero cloud, real GPU/          hosted; LLM/STT/TTS/       Cloud — zero infra,
latency/quality tradeoffs)     PSTN are cloud APIs         zero control, no
                                you own the wiring for)     provider choice)
```

OpenVent self-hosts the *orchestration layer* — the code, the database, the call logic, the compliance rules,
the dashboard, all inspectable and yours. The *AI layer* (LLM inference, STT, TTS) and the *telephony
layer* (PSTN, via Twilio) remain cloud APIs by necessity: no one self-hosts a phone network, and
running frontier-quality LLM inference on your own hardware is a different, harder product with real
latency and model-quality tradeoffs (that's the fully-local end of the spectrum above, and it's a
legitimate but different thing to build — see `DECISIONS.md` ADR-016 for the full reasoning).

What you actually own at OpenVent's position: which provider plugs into each slot (swap Deepgram, swap the
LLM, swap the TTS engine — no migration, no platform lock-in), where the call data lands (your own
database, not a platform's dashboard), and every line of the call logic and compliance enforcement. What
you don't own, and OpenVent never claims to: the phone network itself, or the AI model weights the LLM/STT/TTS
calls run against.

## Pipeline

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

## Where things live

```
packages/
├── openvent-compliance/        # @openvent/compliance — standalone, framework-agnostic
│                           # (DNC, calling-window, HIPAA guardrail, GDPR erasure,
│                           # national-DNC adapter shape). Zero dependency on
│                           # Twilio/Bun/Hono/any specific DB — see its own README.
├── web/
│   └── src/
│       ├── api/
│       │   ├── database/           # Drizzle schema + migrations (SQLite/Turso)
│       │   └── voice/
│       │       ├── routes.ts       # main API surface — start here
│       │       ├── stream.ts       # per-call WebSocket state machine (the pipeline above)
│       │       ├── agent.ts        # LLM turn runner + persona + known-facts prompt injection
│       │       ├── deepgram.ts     # STT connection
│       │       ├── tts/            # TTS provider abstraction (ElevenLabs, Cartesia)
│       │       ├── llm/            # LLM provider abstraction (AI Gateway, Groq)
│       │       ├── tools/          # agent tool-calling (captureField, crmSync, etc.)
│       │       ├── workflows/      # outcome-based automation + scheduler
│       │       ├── middleware/     # admin-auth, Twilio signature validation, rate limiting
│       │       └── compliance/     # Drizzle adapter wiring @openvent/compliance into this app
│       └── web/
│           ├── pages/               # landing page + docs page + dashboard pages
│           └── components/
│               ├── landing/         # marketing/landing page sections
│               └── dashboard/       # operator dashboard (calls, call detail, DNC)
├── mobile/                  # Expo app shell (not voice-specific yet)
└── desktop/                 # Electron shell (not voice-specific yet)

scripts/                     # local-only provisioning (gitignored) — tunnel scripts
docs/                        # you are here
```

## Key design decisions

Every consequential architecture decision — and the reasoning behind it, including ones that were later
reversed — is recorded in [`DECISIONS.md`](../DECISIONS.md). Worth reading before making a large change;
it'll usually tell you why something is the way it is, or that a given approach was already tried and
rejected.
