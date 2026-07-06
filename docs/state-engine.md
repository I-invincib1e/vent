# State engine

Most voice-agent stacks treat the transcript itself as memory — which means once something a caller said
scrolls outside whatever the model actually attends to, the agent re-asks for it or contradicts an earlier
answer. This isn't a model-quality problem; it happens even with strong models, because the only "memory"
most stacks have is the raw transcript (or a lossy summary/RAG layer over it), with no deterministic,
structured source of truth the agent is required to read from.

Vent keeps a separate, deterministic state layer instead:

- The agent calls `captureField` the moment a caller states something durable — an email, an order ID, a
  name — recording it as a `{ field, value }` pair, not free text.
- That state (`calls.capturedState`) is persisted immediately (not just at call end) and re-injected into
  the system prompt every turn as an explicit "Known facts — do not ask for these again" block
  (`agent.ts`'s `buildKnownFactsBlock`).
- The result: the model reads ground truth instead of re-deriving it from scrollback, and every fact is
  inspectable afterward — on the [dashboard](./dashboard.md) or via `GET /api/voice/calls/:id`.

See [`DECISIONS.md`](../DECISIONS.md) ADR-012 for the full reasoning, including what's deliberately not
built yet (no per-persona required-slot schema — the model decides what's worth capturing based on the
tool description alone, not a strict checklist).
