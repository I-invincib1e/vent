import { createMiddleware } from "hono/factory";

/**
 * Simple API-key gate for operational endpoints (call listing, transcripts,
 * DNC management, force-end, erasure, webhook testing). These previously had
 * zero authentication — anyone who could reach the public URL could read
 * call transcripts, manage the DNC list, or force-end a live call.
 *
 * Checks the `X-Vent-Admin-Key` header against `ADMIN_API_KEY`. If
 * ADMIN_API_KEY is not set, the gate is a no-op (logs a warning once) so
 * local development isn't blocked — but this must be set before exposing
 * the app beyond local testing.
 */
let warnedMissingKey = false;

export const requireAdminKey = createMiddleware(async (c, next) => {
  const configuredKey = process.env.ADMIN_API_KEY;

  if (!configuredKey) {
    if (!warnedMissingKey) {
      console.warn(
        "[admin-auth] ADMIN_API_KEY is not set — ops endpoints (/calls, /dnc, /callers, /webhooks/test) " +
          "are currently UNAUTHENTICATED. Set ADMIN_API_KEY before exposing this beyond local testing.",
      );
      warnedMissingKey = true;
    }
    return next();
  }

  const providedKey = c.req.header("X-Vent-Admin-Key");
  if (providedKey !== configuredKey) {
    return c.json({ error: "Unauthorized — missing or invalid X-Vent-Admin-Key header" }, 401);
  }

  return next();
});
