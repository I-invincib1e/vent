import z from "zod";
import { tool } from "ai";

/**
 * CRM integration stub (HubSpot). Upserts a contact and logs a call
 * engagement mid-conversation — for when the agent needs to act on CRM data
 * live during the call, complementing (not replacing) the generic outbound
 * webhook system used for after-the-fact sync via n8n/Zapier.
 *
 * Wire a real HUBSPOT_API_KEY and uncomment the fetch calls to go live.
 * Swapping to Salesforce/Zoho/GoHighLevel follows the same shape — replace
 * the endpoint/auth, keep the same tool interface.
 */
export const crmSync = tool({
  description:
    "Log this call to the CRM and create or update the caller's contact record. Use this once you have " +
    "the caller's name and enough context to be worth recording — not on every turn.",
  inputSchema: z.object({
    callerName: z.string().optional(),
    phoneNumber: z.string(),
    notes: z.string().describe("Brief summary of what this call was about"),
  }),
  async execute({ callerName, phoneNumber, notes }) {
    const apiKey = process.env.HUBSPOT_API_KEY;
    if (!apiKey) {
      return {
        synced: false,
        message: "(stub) HUBSPOT_API_KEY not configured — no real CRM connected yet.",
      };
    }

    try {
      // Upsert contact by phone number.
      const contactRes = await fetch("https://api.hubapi.com/crm/v3/objects/contacts", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          properties: { phone: phoneNumber, firstname: callerName ?? "Unknown caller" },
        }),
      });
      const contact = await contactRes.json().catch(() => null);

      // Log a call engagement note.
      await fetch("https://api.hubapi.com/crm/v3/objects/calls", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          properties: {
            hs_call_body: notes,
            hs_call_direction: "INBOUND",
            hs_timestamp: Date.now(),
          },
        }),
      });

      return { synced: true, contactId: contact?.id ?? null };
    } catch (err) {
      return { synced: false, message: `CRM sync failed: ${(err as Error).message}` };
    }
  },
});
