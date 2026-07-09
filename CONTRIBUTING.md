# Contributing to OpenVent

Thanks for looking at this. OpenVent is early — the codebase is small enough to read end to end in an
afternoon, and that's intentional. This doc is about making that afternoon easier.

OpenVent is Apache 2.0 licensed and genuinely open for contribution — no CLA, no fair-code fine print.
Everyone participating is expected to follow [`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md). Found a security
issue instead of a bug? See [`SECURITY.md`](./SECURITY.md) — report it privately, not as a public issue.

## Good places to start

- Look for issues labeled `good first issue` — small, scoped, don't require deep familiarity with the voice
  pipeline internals.
- `ROADMAP.md`'s "open for contribution" section lists things that are wanted but not actively being built
  by the maintainer — good targets that won't collide with in-progress work.
- Docs and `docs/*.md` fixes are always welcome and low-risk — genuinely one of the highest-leverage
  contributions on a project this size.

## Before you start

1. Read [`docs/architecture.md`](./docs/architecture.md) — how a call flows through the system, and where
   things live in the repo.
2. Skim [`DECISIONS.md`](./DECISIONS.md) — every consequential decision (and reversal) is logged there with
   its reasoning. If something looks like an odd choice, check there first; it's probably deliberate and
   explained, or it's a known rough edge already tracked.
3. Check [`ROADMAP.md`](./ROADMAP.md) for what's actively being worked on vs. open for contribution — helps
   avoid duplicate effort.

## Project structure

Monorepo, Bun workspaces + Turborepo. The voice pipeline itself lives in
`packages/web/src/api/voice/` — see `docs/architecture.md` for the full layout. Compliance logic is a
separate, standalone package (`packages/openvent-compliance`) with no dependency on the rest of the app —
if you're changing DNC/calling-window/HIPAA/GDPR logic, it belongs there, not in `packages/web`.

## Development setup

```bash
bun install
cp .env.example .env      # fill in your own API keys — see docs/getting-started.md
cd packages/web && bun run db:push
bun run start              # production server — required for live call audio (see below)
```

Two things that trip people up:
- **The dev server (`bun run dev`) doesn't support live call audio.** The Twilio Media Stream WebSocket
  bridge only works under the real Bun runtime, not Vite's dev SSR module runner. REST endpoints work fine
  under `bun run dev`; anything involving an actual phone call needs `bun run start`.
- **You need real Twilio/Deepgram/TTS/LLM credentials to place or receive a call.** There's no local mock
  mode yet — testing the full pipeline requires a Twilio number and a public URL (see
  `docs/security.md`'s tunneling section) Twilio can reach.

## Making a change

- **Small, focused PRs.** One logical change per PR — easier to review, easier to revert if something's
  wrong.
- **Tests for anything with real logic.** Pure functions (parsers, validators, prompt builders) get unit
  tests — see `packages/web/src/api/voice/agent.test.ts` or `packages/openvent-compliance/src/*.test.ts` for the
  existing style (`bun:test`, no mocking framework, test the actual function directly). Run the full suite
  before opening a PR:
  ```bash
  cd packages/web && bun test src/api/voice/
  cd packages/openvent-compliance && bun test
  ```
- **Typecheck and build before you push:**
  ```bash
  cd packages/web && bun run typecheck && bun run build
  ```
- **Update the docs that changed.** If you touch env vars, an API route, or a compliance behavior, update
  the matching file in `docs/` in the same PR — not as a follow-up. Docs drifting from code is the #1 thing
  that makes an open-source project hard to contribute to, and we'd rather catch it at review time.
- **Log architecture-level decisions.** If your change is a genuine design decision (not just a bug fix or
  small feature), add an entry to `DECISIONS.md` following the existing ADR format — context, decision,
  consequences. Doesn't need to be long. Existing entries never get rewritten, even if later reversed — a
  reversal is its own new entry that says so (see ADR-013/ADR-014 for an example of exactly that).

## Code style

- Comments explain *why*, not *what* — the code already says what it does. Look at any existing file in
  `packages/web/src/api/voice/` for the tone/density we're going for.
- Prefer small, pure, testable functions over inline logic buried in a route handler — see
  `parseWorkflows`/`parseNumberConfigMap`/`buildKnownFactsBlock` for the pattern (parsing/formatting logic
  extracted out of the thing that uses it, specifically so it can be unit tested without spinning up a
  server).
- No linter/formatter fights — `oxlint` runs in CI, keep it green, don't hand-roll a different style.

## Reporting bugs / proposing features

Open an issue. For anything that isn't a trivial fix, a short discussion before a PR saves everyone time —
especially for anything touching compliance logic (`packages/openvent-compliance`), where correctness matters
more than usual.

## Questions

If something in the codebase doesn't make sense and `DECISIONS.md` doesn't explain it, that's a docs gap —
open an issue about the confusing part rather than guessing. Every gap like that gets fixed for the next
person too.
