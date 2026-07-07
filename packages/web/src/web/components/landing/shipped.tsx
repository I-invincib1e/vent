import { motion } from "motion/react";
import { ShieldCheck, Plug, GitBranch, FileClock } from "lucide-react";
import { SectionLabel } from "./section-label";

const shipped = [
  {
    icon: ShieldCheck,
    title: "Compliance, enforced not promised",
    story:
      "TCPA calling-window + Do-Not-Call checks on every outbound call, spoken AI/recording disclosure by default, a HIPAA boot guardrail, and GDPR retention purge + right-to-erasure — all in code, in @vent/compliance, usable outside Vent too.",
  },
  {
    icon: FileClock,
    title: "Audit trail, on demand",
    story:
      "Newest addition. Pull who was called, when, under what disposition, DNC status, and whether the AI disclosure was actually spoken (not just configured) — as plain text ready to hand to a lawyer, or JSON for tooling. Per call or per phone number.",
  },
  {
    icon: Plug,
    title: "Pre-built integrations",
    story:
      "GoHighLevel, Salesforce, and HubSpot for crmSync, real Google Calendar booking for bookAppointment — every one wrapped in a shared timeout/retry/circuit-breaker layer, so a dead CRM never stalls a live call.",
  },
  {
    icon: GitBranch,
    title: "Workflows + per-number config",
    story:
      "JSON-defined outcome-based automation with a background retry scheduler, plus per-Twilio-number persona/provider/call-limit overrides — no redeploy to change how one number behaves.",
  },
];

export function Shipped() {
  return (
    <section className="max-w-5xl mx-auto px-6 py-24 sm:py-32">
      <SectionLabel index="06" label="Shipped Since Launch" />
      <h2 className="text-3xl sm:text-4xl font-semibold leading-tight max-w-2xl">
        Not a static demo. Here's what's actually landed.
      </h2>
      <p className="mt-4 text-ink-soft max-w-xl leading-relaxed">
        Everything below exists in the repo today, tested and wired into the running app — not on a
        someday list.
      </p>

      <div className="mt-14 grid sm:grid-cols-2 gap-6">
        {shipped.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.55, delay: i * 0.08 }}
            className="border border-border rounded-xl p-6 bg-card hover:border-signal/40 transition-colors"
          >
            <f.icon className="size-6 text-signal" />
            <h3 className="font-semibold text-lg mt-4">{f.title}</h3>
            <p className="text-sm text-ink-soft mt-2 leading-relaxed">{f.story}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
