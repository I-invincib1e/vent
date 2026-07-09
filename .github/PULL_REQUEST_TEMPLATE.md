## What this does

<!-- One or two sentences. What changed, and why. -->

## Related issue

<!-- Closes #___, or "N/A" -->

## Checklist

- [ ] One logical change per PR (see `CONTRIBUTING.md`)
- [ ] Tests added/updated for any real logic changed (`bun test src/api/voice/` and/or
      `packages/openvent-compliance`'s suite pass locally)
- [ ] Typecheck and build pass locally: `cd packages/web && bun run typecheck && bun run build`
- [ ] Docs updated in this PR if you touched an env var, API route, or compliance behavior
- [ ] Added a `DECISIONS.md` ADR entry if this is a genuine design decision (not just a bug fix)
- [ ] Not touching `packages/openvent-compliance` without extra care/discussion (correctness there matters
      more than usual — DNC, calling windows, HIPAA/GDPR)

## Anything reviewers should know

<!-- Tradeoffs, things you're unsure about, follow-ups you're deliberately deferring. -->
