import z from "zod";
import { tool } from "ai";

/**
 * Stub tool — demonstrates a "write" action tool (booking/scheduling) during a call.
 * Replace with a real calendar/CRM integration for production use.
 */
export const bookAppointment = tool({
  description:
    "Book an appointment for the caller. Use this once you've confirmed a date/time and the caller's name.",
  inputSchema: z.object({
    callerName: z.string(),
    dateTimeIso: z.string().describe("ISO 8601 date-time for the appointment"),
    notes: z.string().optional(),
  }),
  async execute({ callerName, dateTimeIso, notes }) {
    // Stub: pretends to book. Wire this to a real calendar/CRM.
    return {
      confirmed: true,
      callerName,
      dateTimeIso,
      notes: notes ?? null,
      message: `(stub) Booked ${callerName} for ${dateTimeIso}. No real calendar connected yet.`,
    };
  },
});
