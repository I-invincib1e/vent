/**
 * Storage adapter contract. This package has zero database dependency —
 * bring your own persistence by implementing this interface against
 * whatever you already use (Drizzle/Postgres, Mongo, a flat file, Redis,
 * an in-memory Map for tests, etc). See adapters/memory.ts for a minimal
 * reference implementation, and the Vent reference app
 * (voice/compliance/adapter.ts) for a production Drizzle/Turso example.
 */

export type DoNotCallEntry = {
  phoneNumber: string;
  reason?: string;
  source: "manual" | "agent" | "national-registry";
  addedAt: Date;
};

export type CallRecord = {
  id: string;
  fromNumber: string;
  toNumber: string;
  startedAt: Date;
};

/**
 * Minimal surface the compliance package needs from your call-log storage
 * to support GDPR retention purge and right-to-erasure. Implement only
 * these three methods against your existing calls table/collection.
 */
export type CallLogStorageAdapter = {
  /** Return calls started before `cutoff` — used by the retention purge sweep. */
  findCallsStartedBefore(cutoff: Date): Promise<CallRecord[]>;
  /** Return every call involving this phone number (as caller or callee) — used by right-to-erasure. */
  findCallsByPhoneNumber(phoneNumber: string): Promise<CallRecord[]>;
  /** Delete a call and any data associated with it (transcripts, tool calls, recordings, etc). */
  deleteCall(callId: string): Promise<void>;
};

/**
 * Minimal surface the compliance package needs to enforce and manage a
 * Do-Not-Call list. Implement against your own storage — see
 * adapters/memory.ts for the simplest possible version.
 */
export type DncStorageAdapter = {
  isListed(phoneNumber: string): Promise<boolean>;
  add(entry: DoNotCallEntry): Promise<void>;
  remove(phoneNumber: string): Promise<void>;
  list(): Promise<DoNotCallEntry[]>;
};
