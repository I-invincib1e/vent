import { db } from "../../database";
import { scheduledCalls } from "../../database/schema";
import { addToDoNotCallList } from "@vent/compliance";
import { dncAdapter } from "../compliance/adapters";
import { dispatchWebhook, resolveWebhookUrl } from "../webhooks";
import { getWorkflowsForNumber } from "./index";
import type { WorkflowOutcome } from "./types";

/**
 * Runs whenever a call ends with a known outcome (disposition, or an inferred
 * Twilio status like no-answer/busy/failed). Looks up any workflow configured
 * for that number and executes the matching action automatically — this is
 * the "no manual step" follow-through: a no-answer schedules its own retry,
 * a not-interested caller gets added to the DNC list without anyone touching
 * a dashboard.
 */
export async function runWorkflowForOutcome(params: {
  toNumber: string;
  outcome: WorkflowOutcome;
  persona?: string;
  webhookUrl?: string | null;
}) {
  const { toNumber, outcome, persona, webhookUrl } = params;
  const matches = getWorkflowsForNumber(toNumber);

  for (const workflow of matches) {
    const action = workflow.onOutcome[outcome];
    if (!action || action.action === "none") continue;

    try {
      switch (action.action) {
        case "retry": {
          await db.insert(scheduledCalls).values({
            toNumber,
            workflowName: workflow.name,
            persona,
            webhookUrl: webhookUrl ?? undefined,
            attempt: 1,
            maxAttempts: action.maxRetries,
            runAt: new Date(Date.now() + action.delayMinutes * 60 * 1000),
            status: "pending",
          });
          console.log(
            `[workflow:${workflow.name}] scheduled retry for ${toNumber} in ${action.delayMinutes}min`,
          );
          break;
        }
        case "webhook": {
          void dispatchWebhook(resolveWebhookUrl(action.url), "call.completed", {
            toNumber,
            outcome,
            workflow: workflow.name,
          });
          break;
        }
        case "addToDnc": {
          await addToDoNotCallList(dncAdapter, toNumber, `workflow:${workflow.name} outcome:${outcome}`, "agent");
          console.log(`[workflow:${workflow.name}] added ${toNumber} to DNC list`);
          break;
        }
        case "sendSms": {
          // Stub — no SMS provider wired yet. Logs the intent so the action
          // is visible and easy to wire to Twilio Messaging later.
          console.log(`[workflow:${workflow.name}] (stub) would send SMS to ${toNumber}: "${action.template}"`);
          break;
        }
      }
    } catch (err) {
      console.error(`[workflow:${workflow.name}] failed to execute action for outcome ${outcome}`, err);
    }
  }
}
