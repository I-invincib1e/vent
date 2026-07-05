import type { CallLogStorageAdapter, CallRecord, DncStorageAdapter, DoNotCallEntry } from "../storage";

/**
 * In-memory reference adapters — useful for tests, quick prototypes, or a
 * single-process deployment where persistence across restarts doesn't
 * matter. Not suitable for production (state is lost on restart, doesn't
 * share across instances). Swap for a real database-backed adapter before
 * shipping — see the package README for the Drizzle/Turso example used by
 * the Vent reference app.
 */
export function createMemoryDncAdapter(): DncStorageAdapter {
  const entries = new Map<string, DoNotCallEntry>();
  return {
    async isListed(phoneNumber) {
      return entries.has(phoneNumber);
    },
    async add(entry) {
      entries.set(entry.phoneNumber, entry);
    },
    async remove(phoneNumber) {
      entries.delete(phoneNumber);
    },
    async list() {
      return [...entries.values()];
    },
  };
}

export function createMemoryCallLogAdapter(): CallLogStorageAdapter & {
  seed: (calls: CallRecord[]) => void;
} {
  let calls: CallRecord[] = [];
  return {
    seed(records) {
      calls = records;
    },
    async findCallsStartedBefore(cutoff) {
      return calls.filter((c) => c.startedAt < cutoff);
    },
    async findCallsByPhoneNumber(phoneNumber) {
      return calls.filter((c) => c.fromNumber === phoneNumber || c.toNumber === phoneNumber);
    },
    async deleteCall(callId) {
      calls = calls.filter((c) => c.id !== callId);
    },
  };
}
