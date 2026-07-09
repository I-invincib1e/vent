---
name: Bug report
about: Something in OpenVent isn't working as expected
title: "[Bug] "
labels: bug
assignees: ''
---

**What happened**
A clear description of the bug.

**What you expected**
What should have happened instead.

**Steps to reproduce**
1.
2.
3.

**Environment**
- OpenVent version/commit:
- Deployment: self-hosted / openvent.dev demo
- Voice providers in use (Twilio / Deepgram / TTS / LLM):
- `bun run start` or `bun run dev`?

**Logs / screenshots**
Paste relevant logs (redact API keys, phone numbers, and call transcripts with real customer data).

**Anything else**
Is this related to compliance logic (`packages/openvent-compliance`)? If so, please flag it clearly —
those get prioritized differently since correctness there matters more than usual.
