/**
 * Client-side storage for the admin key used to call ops endpoints
 * (requireAdminKey-gated routes — see api/voice/middleware/admin-auth.ts).
 * Stored in sessionStorage only (cleared when the tab closes) — this
 * dashboard is meant for the operator on their own machine, not a
 * multi-tenant login system. Swap for real auth before exposing this
 * publicly.
 */
const STORAGE_KEY = "vent_admin_key";

export function getAdminKey(): string {
  return sessionStorage.getItem(STORAGE_KEY) ?? "";
}

export function setAdminKey(key: string) {
  sessionStorage.setItem(STORAGE_KEY, key);
}

export function clearAdminKey() {
  sessionStorage.removeItem(STORAGE_KEY);
}

export function adminHeaders(): Record<string, string> {
  const key = getAdminKey();
  return key ? { "X-Vent-Admin-Key": key } : {};
}
