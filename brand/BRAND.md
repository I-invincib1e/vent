# OpenVent Brand Guide

Pulled directly from the live design system (`packages/web/src/web/styles.css`) — nothing here is
invented separately from the product, this documents what's already true in code.

## Logo

- `logo-mark.png` — icon only (vent grille slats + an escaping sound wave). Use for favicon, app
  icon, social avatar, anywhere space is tight.
- `logo-lockup.png` — icon + wordmark side by side. Use for the site header, README, decks, anywhere
  there's horizontal room.

The mark is literally the brand thesis as an image: a closed grille (the vendor lock-in / black-box
platform) with sound escaping through the gaps (your voice, getting out). Matches the hero line —
"OpenVent is the vent it escapes through."

## Wordmark

Set in **Fraunces** (bold, serif) exactly as the hero already does. Don't substitute a different serif —
Fraunces' warmth is doing real work against an otherwise technical/mono-heavy layout.

## Typography

| Role | Font | Where it's used |
|---|---|---|
| Display / headlines | **Fraunces** (serif, weights 300–700, has an italic) | Hero, section H2s |
| Body / UI | **Inter Tight** (sans, 400–700) | Paragraphs, buttons, nav |
| Labels / code / numbers | **JetBrains Mono** (400–600) | Section labels ("01 — The Problem"), stack strip, footer meta |

All three are Google Fonts, already loaded via the `@import` at the top of `styles.css` — no new
font loading needed anywhere else this brand shows up (deck, social, docs).

## Color

| Token | Hex | Role |
|---|---|---|
| `paper` | `#F4EEE4` | Primary background (warm cream, not white) |
| `paper-2` | `#E9E0D3` | Secondary surface / card background |
| `ink` | `#171310` | Primary text (warm near-black, not pure #000) |
| `ink-soft` | `#4E4640` | Secondary text / captions |
| **`ember`** | **`#BF3000`** | **Primary brand color** — burnt orange/terracotta. CTAs, the icon mark, active states |
| `ember-soft` | `#E5BDAF` | Tinted ember backgrounds, hover states |
| `signal` | `#2C6C47` | Success / "shipped" / positive states (muted green, not a bright tech-green) |
| `signal-soft` | `#BDD9C6` | Tinted signal backgrounds |

Dark sections (footer, pipeline diagram) flip to `ink` as the background with `paper` text — same
two colors, just inverted, not a third palette.

**What this palette deliberately avoids:** no purple, no bright SaaS-blue, no neon gradients. The
warm paper/ink/ember family reads editorial and grounded rather than "generic AI startup" — keep it
that way in any future extension (pitch decks, social, swag).

## Usage notes

- Minimum clear space around the mark: roughly the height of the grille shape on all sides.
- On dark backgrounds, the mark and wordmark both flip to `paper` (#F4EEE4), never white (#FFFFFF) —
  keep the warmth even in reverse.
- Don't recolor the mark in `signal` green or any other palette color — ember is the only brand color
  the mark itself should ever appear in.
