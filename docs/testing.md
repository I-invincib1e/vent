# Testing

OpenVent uses `bun:test` — no separate test runner, no mocking framework. Tests live next to the code they
test (`foo.ts` → `foo.test.ts`), following Bun's convention.

## Running tests

```bash
# Everything in the web app's API layer (voice pipeline, integrations, resilience layer, etc.)
cd packages/web && bun run test

# The standalone compliance package
cd packages/openvent-compliance && bun run test
```

Both are plain `bun test` under the hood (see each package's `package.json`) — you can also run
`bun test <path>` directly to run a single file while iterating.

## What's covered today

| Area | File | What it tests |
|---|---|---|
| State engine | `src/api/voice/agent.test.ts` | `buildKnownFactsBlock` — empty/populated/multi-field prompt injection, doesn't mutate input |
| `captureField` tool | `src/api/voice/tools/captureField.test.ts` | Tool shape, echoes captured field/value |
| Session store | `src/api/voice/session-store.test.ts` | Set/get/update/delete, workflow retry metadata |
| Per-number config | `src/api/voice/number-config.test.ts` | Parses `NUMBER_CONFIG` JSON, handles malformed/non-object input gracefully |
| Workflows | `src/api/voice/workflows/index.test.ts` | Parses `WORKFLOWS` JSON, matches wildcard vs. number-scoped configs |
| Provider resolution | `src/api/voice/llm/index.test.ts`, `src/api/voice/tts/index.test.ts` | Env-var/override resolution, safe fallback for unknown provider values |
| E.164 validation | `src/api/voice/validation.test.ts` | Valid/invalid phone number formats |
| **Integration resilience** | `src/api/voice/integrations/resilient-fetch.test.ts` | Timeout detection, retry-then-succeed, retry-then-fail, circuit breaker opening/cooldown, per-integration isolation, failure-count reset on success |
| GoHighLevel / Salesforce / HubSpot / Google Calendar | `src/api/voice/integrations/*.test.ts` | Not-configured fallback (missing env vars), successful sync/booking, graceful degradation when the third-party API errors or is unreachable |
| Compliance package | `packages/openvent-compliance/src/*.test.ts` | Calling-window resolution, DNC add/check, consent disclosure toggle, HIPAA boot guardrail, GDPR retention purge + erasure, national-DNC adapter shape |

64 tests total across both packages as of this writing (see `CHANGELOG.md` for the running count as it
grows).

## What's deliberately not covered by automated tests

- **The live call pipeline itself** (`stream.ts`'s WebSocket state machine, actual Twilio Media Stream
  handling, Deepgram/TTS connections) — this needs a real phone call to exercise meaningfully; it's
  verified via manual curl-based regression checks (see `DECISIONS.md`'s hardening-round ADRs for the
  specific checks run each time) rather than unit tests. A proper integration-test harness for this is
  open territory — see `ROADMAP.md`.
- **OAuth flows** for Salesforce/Google Calendar — these integrations assume you already have a valid
  access token in the environment; the token-acquisition flow itself isn't OpenVent's responsibility and isn't
  tested here.

## Writing new tests

Follow the existing pattern:
- Test the actual function directly, not through HTTP — extract pure logic into its own exported function
  if it's currently buried in a route handler (see `parseWorkflows`/`parseNumberConfigMap`/
  `buildKnownFactsBlock` for the established pattern).
- For anything that calls `fetch` (integrations), stub `global.fetch` directly in the test and restore it
  in `afterEach` — see `src/api/voice/integrations/hubspot.test.ts` for the pattern. No mocking library
  needed; `bun:test` doesn't require one for this.
- Reset any module-level state your test depends on (e.g. `__resetBreakersForTests()` for the resilience
  layer) in a `beforeEach`/`afterEach` so tests don't leak state into each other.

## Continuous Integration

Every push and pull request against `main` runs typecheck, the full test suite, the production build, and
lint via GitHub Actions — see [`.github/workflows/ci.yml`](../.github/workflows/ci.yml). None of these steps
need real API keys or a live database; the build and tests are fully static/mocked. A red CI check means
something is actually broken, not a missing secret — treat it as blocking.
