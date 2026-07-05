import { describe, it, expect } from "bun:test";
import { checkCallingWindow } from "./calling-window";
import { checkOutboundCallCompliance } from "./index";
import { createMemoryDncAdapter, createMemoryCallLogAdapter } from "./adapters/memory";
import { withDisclosure, isDisclosureEnabled } from "./consent";
import { isHipaaMode, assertHipaaPreflight } from "./hipaa";
import { purgeExpiredData, eraseCallerData, getRetentionDays } from "./gdpr";
import { syncNationalDncRegistry, noopNationalRegistryFetcher } from "./national-dnc";

describe("calling-window", () => {
  it("allows a call within the resolved window for a known area code", () => {
    // 212 = America/New_York. Pick a time known to be 2pm ET.
    const noonUtcAsEtAfternoon = new Date("2026-07-04T18:00:00Z"); // 2pm ET (summer, UTC-4)
    const result = checkCallingWindow("+12125550100", noonUtcAsEtAfternoon);
    expect(result.resolvedTimezone).toBe("America/New_York");
    expect(result.allowed).toBe(true);
  });

  it("blocks a call outside the window for a known area code", () => {
    const threeAmEt = new Date("2026-07-04T07:00:00Z"); // 3am ET
    const result = checkCallingWindow("+12125550100", threeAmEt);
    expect(result.allowed).toBe(false);
  });

  it("falls back to the safe window for an unresolved area code", () => {
    const result = checkCallingWindow("+19995550100", new Date());
    expect(result.resolvedTimezone).toBeNull();
  });
});

describe("dnc (memory adapter)", () => {
  it("blocks a listed number and allows an unlisted one", async () => {
    const dnc = createMemoryDncAdapter();
    await dnc.add({ phoneNumber: "+15550001111", source: "manual", addedAt: new Date() });

    const blocked = await checkOutboundCallCompliance("+15550001111", dnc);
    expect(blocked.allowed).toBe(false);

    // 212 = America/New_York, a resolvable area code — override the window
    // wide open to isolate "DNC check passes" from calling-window timing.
    const allowed = await checkOutboundCallCompliance("+12125550100", dnc, { startHour: 0, endHour: 24 });
    expect(allowed.allowed).toBe(true);
  });
});

describe("consent", () => {
  it("is enabled by default and injects the disclosure line", () => {
    expect(isDisclosureEnabled()).toBe(true);
    const persona = withDisclosure("You are a helpful assistant.");
    expect(persona).toContain("may be recorded");
  });

  it("can be disabled via explicit options", () => {
    const persona = withDisclosure("You are a helpful assistant.", { enabled: false });
    expect(persona).toBe("You are a helpful assistant.");
  });
});

describe("hipaa", () => {
  it("does not throw when disabled", () => {
    expect(() => assertHipaaPreflight({ enabled: false })).not.toThrow();
  });

  it("throws when enabled without BAA confirmation", () => {
    expect(() => assertHipaaPreflight({ enabled: true, baaConfirmed: false })).toThrow();
  });

  it("does not throw when enabled with BAA confirmation", () => {
    expect(() => assertHipaaPreflight({ enabled: true, baaConfirmed: true })).not.toThrow();
  });

  it("reports mode correctly", () => {
    expect(isHipaaMode({ enabled: true })).toBe(true);
    expect(isHipaaMode({ enabled: false })).toBe(false);
  });
});

describe("gdpr (memory adapter)", () => {
  it("purges calls older than the retention window", async () => {
    const log = createMemoryCallLogAdapter();
    const old = new Date(Date.now() - 200 * 24 * 60 * 60 * 1000);
    const recent = new Date();
    log.seed([
      { id: "1", fromNumber: "+1", toNumber: "+2", startedAt: old },
      { id: "2", fromNumber: "+1", toNumber: "+2", startedAt: recent },
    ]);

    const result = await purgeExpiredData(log, { retentionDays: 90 });
    expect(result.callsDeleted).toBe(1);

    const remaining = await log.findCallsStartedBefore(new Date(Date.now() + 1000));
    expect(remaining.length).toBe(1);
    expect(remaining[0]?.id).toBe("2");
  });

  it("erases all data for a phone number on request", async () => {
    const log = createMemoryCallLogAdapter();
    log.seed([
      { id: "1", fromNumber: "+15551112222", toNumber: "+2", startedAt: new Date() },
      { id: "2", fromNumber: "+3", toNumber: "+15551112222", startedAt: new Date() },
      { id: "3", fromNumber: "+3", toNumber: "+4", startedAt: new Date() },
    ]);

    const result = await eraseCallerData(log, "+15551112222");
    expect(result.callsDeleted).toBe(2);

    const remaining = await log.findCallsByPhoneNumber("+15551112222");
    expect(remaining.length).toBe(0);
  });

  it("defaults retention to 90 days", () => {
    expect(getRetentionDays()).toBe(90);
  });
});

describe("national-dnc", () => {
  it("noop fetcher syncs zero numbers without erroring", async () => {
    const dnc = createMemoryDncAdapter();
    const result = await syncNationalDncRegistry(dnc, noopNationalRegistryFetcher);
    expect(result.numbersSynced).toBe(0);
  });

  it("syncs a real fetcher's numbers into the DNC list with the correct source", async () => {
    const dnc = createMemoryDncAdapter();
    const fetcher = { fetchRegisteredNumbers: async () => ["+15551110000", "+15551110001"] };
    const result = await syncNationalDncRegistry(dnc, fetcher);
    expect(result.numbersSynced).toBe(2);

    const list = await dnc.list();
    expect(list.length).toBe(2);
    expect(list.every((entry) => entry.source === "national-registry")).toBe(true);
  });
});
