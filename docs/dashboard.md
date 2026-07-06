# Dashboard

A small operator dashboard ships at `/dashboard`, gated behind your `ADMIN_API_KEY` (entered once per
browser session, never sent anywhere but your own server):

- **Calls** — live/completed calls, auto-refreshing, with a quick indicator of how many facts were
  captured per call
- **Call detail** — full transcript, tool-call log, recording link, and the captured-state panel (see
  [State engine](./state-engine.md))
- **Do Not Call** — add/remove DNC entries without touching curl

This is meant for you, the operator, not end users — there's no multi-tenant login, just the same admin
key that already gates the ops API.
