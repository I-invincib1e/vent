# API reference

| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | Pipeline health, active providers, compliance config |
| POST | `/api/voice/incoming` | Twilio webhook — returns TwiML to start the media stream (signature-verified) |
| POST | `/api/voice/calls/outbound` | Trigger an outbound call: `{ to, persona?, webhookUrl? }` (compliance-gated, rate-limited, admin-key gated) |
| GET | `/api/voice/calls/:id/status` | Current status/metadata for one call (admin-key gated) |
| POST | `/api/voice/calls/:id/end` | Force-end a live call (admin-key gated) |
| GET | `/api/voice/calls` | List all calls (admin-key gated) |
| GET | `/api/voice/calls/:id/transcript` | Full transcript for one call (admin-key gated) |
| GET | `/api/voice/calls/:id/tool-calls` | Full tool-call log for one call, including captured-state writes (admin-key gated) |
| GET/POST | `/api/voice/dnc` | List / add to the Do-Not-Call list (admin-key gated) |
| DELETE | `/api/voice/dnc/:phoneNumber` | Remove a number from the DNC list (admin-key gated) |
| DELETE | `/api/voice/callers/:phoneNumber` | GDPR right-to-erasure — deletes all data for a number (admin-key gated) |
| POST | `/api/voice/webhooks/test` | Send a sample event to a webhook URL for testing (admin-key gated) |
| WS | `/api/voice/stream` | Twilio Media Stream connection (internal, used by Twilio only) |

Full request/response shapes and the in-app version of this table are on the running app's `/docs` page.
