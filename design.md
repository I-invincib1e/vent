# Vent — Design System

## Identity
**Vent** — a voice needs a vent to escape through: a clean, unblocked opening, yours to control.
This is the open, self-hosted alternative to sealed-off black-box voice-agent platforms.

## Palette (warm, editorial — paper/ink/ember family, own identity)
- `--paper`      #f3ede2   — background
- `--paper-2`    #ebe3d4   — secondary surface / cards
- `--ink`        #171310   — primary text, dark surfaces
- `--ink-soft`   #4a453e   — muted text
- `--ember`      #c4421a   — primary accent (CTAs, active states, hero)
- `--ember-soft` #e2c4b3   — ember tint (borders, subtle backgrounds)
- `--signal`     #3a7d5c   — secondary accent, "live"/pipeline/data-flow states
- `--signal-soft`#cfe3d8   — signal tint

Dark surfaces (pipeline section, code blocks) sit on `--ink` with `--paper` text and ember/signal accents at full saturation — creates contrast beats while scrolling instead of one flat page.

## Typography
- **Display / headlines**: Fraunces (serif) — editorial, storytelling voice
- **Body / UI**: Inter Tight (sans) — clean, readable
- **Technical / labels / code**: JetBrains Mono — pipeline stage labels, API snippets, metadata

Load via Google Fonts `@import` in `styles.css`.

## Motion Principles
- One scroll-driven centerpiece: the pipeline section — a voice packet visibly travels through Twilio → Deepgram → LLM → ElevenLabs → back out, driven by `motion`'s `useScroll`/`useTransform`.
- Staggered reveals on section entry (fade + slight y-offset), not scattered micro-interactions.
- Ember pulse for "action/CTA" states, signal-green pulse for "live/data" states — keep the two accents semantically distinct throughout.
- Respect `prefers-reduced-motion`.

## Layout
- Long-form single-scroll narrative on `/`, generous vertical rhythm (min 6rem section padding).
- Editorial max-width for text blocks (~65ch), full-bleed for the pipeline visual.
- Mono-spaced small-caps labels above section headlines (e.g. "01 — THE PROBLEM") for a documentation-meets-magazine feel.

## Components
`packages/web/src/web/components/landing/`
- `hero.tsx` — wordmark, tagline, dual CTA, ambient breathing gradient
- `problem.tsx` — black-box vs. self-hosted narrative
- `pipeline.tsx` — scroll-linked animated pipeline (centerpiece)
- `features.tsx` — barge-in, tools, recording, webhooks — animated staggered cards
- `code-preview.tsx` — curl + webhook payload, reusing `CodeBlock`
- `stack.tsx` — Twilio / Deepgram / ElevenLabs / LLM gateway mono-styled marks
- `cta-footer.tsx` — final CTA + live health badge
