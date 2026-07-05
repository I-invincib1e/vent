/**
 * Call workflow config — the call-equivalent of an email-marketing flow
 * builder (trigger -> branch on outcome -> action -> optional delay/retry).
 * Defined as plain JSON so no visual builder or dashboard is required; see
 * index.ts for how configs are loaded and engine.ts for how they execute.
 */
export type WorkflowOutcome =
  | "no-answer"
  | "busy"
  | "failed"
  | "voicemail"
  | "interested"
  | "not-interested"
  | "callback-requested"
  | "booked"
  | "no-decision"
  | "wrong-number";

export type WorkflowAction =
  | { action: "retry"; delayMinutes: number; maxRetries: number }
  | { action: "webhook"; url: string }
  | { action: "addToDnc" }
  | { action: "sendSms"; template: string } // sends via Twilio Messaging using TWILIO_PHONE_NUMBER as sender
  | { action: "none" };

export type WorkflowConfig = {
  name: string;
  /** Which Twilio number(s) this workflow applies to. Omit to apply to all. */
  numbers?: string[];
  onOutcome: Partial<Record<WorkflowOutcome, WorkflowAction>>;
};
