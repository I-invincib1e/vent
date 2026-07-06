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
- `bookAppointment` — books a caller in (stub — wire to a real calendar)
- `setDisposition` — records how a call ended; drives the workflow engine
- `crmSync` — upserts a contact + logs a call engagement to HubSpot (stub — set `HUBSPOT_API_KEY`)
- `captureField` — records a durable fact (email, order ID, name, etc.) as structured state — see
  [State engine](./state-engine.md)

## Personas

Different Twilio numbers can run different agent personalities without a redeploy, via `AGENT_PERSONAS`:
```json
{ "+15551234567": "You are a scheduling assistant for a dental clinic. Keep it warm and brief." }
```
