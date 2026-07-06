# Configuration

## Workflows

Call outcomes can trigger automated follow-up actions — the call equivalent of an email-marketing flow
builder, defined as JSON (no dashboard needed):

```json
[{
  "name": "lead-followup",
  "onOutcome": {
    "no-answer": { "action": "retry", "delayMinutes": 60, "maxRetries": 3 },
    "not-interested": { "action": "addToDnc" },
    "interested": { "action": "webhook", "url": "https://your-n8n-instance/webhook/abc" }
  }
}]
```
Set this as the `WORKFLOWS` env var (a JSON array). The agent records the outcome via its `setDisposition`
tool; Twilio-level outcomes (no-answer/busy/failed) trigger workflows automatically even if the call never
connected. A background sweep executes due retries on its own.

## Per-number configuration

Different Twilio numbers can run different behavior without touching code, via `NUMBER_CONFIG`:
```json
{ "+15551234567": { "ttsProvider": "cartesia", "llmProvider": "groq", "maxDurationSeconds": 300 } }
```

## Agent tools

Tools live in `packages/web/src/api/voice/tools/`:

- `lookupInfo` — answers factual questions (stub — wire to a real KB/CRM)
- `bookAppointment` — books a real Google Calendar event once `GOOGLE_CALENDAR_ACCESS_TOKEN` is set (falls
  back to a clear "not configured" result otherwise — never pretends to book)
- `setDisposition` — records how a call ended; drives the workflow engine
- `crmSync` — syncs to whichever CRM is configured, in priority order: GoHighLevel → Salesforce → HubSpot
  (set `GOHIGHLEVEL_API_KEY`+`GOHIGHLEVEL_LOCATION_ID`, `SALESFORCE_ACCESS_TOKEN`+`SALESFORCE_INSTANCE_URL`,
  or `HUBSPOT_API_KEY` respectively)
- `captureField` — records a durable fact (email, order ID, name, etc.) as structured state — see
  [State engine](./state-engine.md)

## Integrations

Every integration (`packages/web/src/api/voice/integrations/`) is wrapped in a shared resilience layer
(`resilient-fetch.ts`) — timeout, retry with backoff, and a per-integration circuit breaker — so a slow or
down third-party API can never stall or crash a live call turn. A tripped breaker skips the network call
entirely for a cooldown window and returns a clear "temporarily skipped" result instead.

| Integration | Env vars | Used by |
|---|---|---|
| GoHighLevel | `GOHIGHLEVEL_API_KEY`, `GOHIGHLEVEL_LOCATION_ID` | `crmSync` |
| Salesforce | `SALESFORCE_ACCESS_TOKEN`, `SALESFORCE_INSTANCE_URL` | `crmSync` |
| HubSpot | `HUBSPOT_API_KEY` | `crmSync` |
| Google Calendar | `GOOGLE_CALENDAR_ACCESS_TOKEN`, `GOOGLE_CALENDAR_ID` (optional, defaults to `primary`) | `bookAppointment` |

Salesforce and Google Calendar expect an already-valid access token — OAuth/token-refresh is your own
app's responsibility, not something Vent handles for you (see [`docs/testing.md`](./docs/testing.md) for
what is and isn't covered by tests here).

## Personas

Different Twilio numbers can run different agent personalities without a redeploy, via `AGENT_PERSONAS`:
```json
{ "+15551234567": "You are a scheduling assistant for a dental clinic. Keep it warm and brief." }
```
