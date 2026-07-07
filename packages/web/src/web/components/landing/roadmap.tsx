import { motion } from "motion/react";
import { Check, Circle, CircleDot } from "lucide-react";
import { SectionLabel } from "./section-label";

const done = [
  "Inbound + outbound calls, real-time STT/LLM/TTS, barge-in",
  "Compliance layer: TCPA window, DNC, HIPAA guardrail, GDPR erasure",
  "Compliance audit-trail export (lawyer-ready text or JSON)",
  "CRM + calendar integrations behind a resilient timeout/retry/circuit-breaker wrapper",
  "Per-number config, call workflows, operator dashboard, CI + 74 tests",
];

const next = [
  "Per-call latency breakdown — STT connect, LLM time-to-first-token, TTS first byte, on the dashboard",
  "Cross-call memory — a rolling per-phone-number history, alongside structured captured state",
  "Multi-user dashboard auth — today it's a single shared admin key, fine solo, not fine for a team",
  "Hosted national DNC registry sync — needs a paid FTC SAN, planned as part of a future paid tier",
  "Redis/DB-backed session state — to run more than one instance",
];

export function Roadmap() {
  return (
    <section className="max-w-4xl mx-auto px-6 py-24 sm:py-32">
      <SectionLabel index="07" label="Where This Actually Stands" />
      <h2 className="text-3xl sm:text-4xl font-semibold leading-tight max-w-2xl">
        We're not betting this beats Vapi or Retell today. It doesn't.
      </h2>
      <p className="mt-6 text-ink-soft leading-relaxed max-w-2xl">
        They're funded, further along, and battle-tested at a scale Vent hasn't seen yet. What Vent bets on
        is different: you get to read every line before you trust it, and it gets better in the open, in
        public, with real feedback — not behind a roadmap you don't get a vote on.
      </p>

      <div className="mt-14 grid sm:grid-cols-2 gap-10">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-signal mb-5">Shipped</p>
          <ul className="space-y-3">
            {done.map((item, i) => (
              <motion.li
                key={item}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.6 }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="flex items-start gap-3 text-sm text-ink-soft leading-relaxed"
              >
                <Check className="size-4 text-signal shrink-0 mt-0.5" />
                {item}
              </motion.li>
            ))}
          </ul>
        </div>

        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-ember mb-5">Next up</p>
          <ul className="space-y-3">
            {next.map((item, i) => (
              <motion.li
                key={item}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.6 }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="flex items-start gap-3 text-sm text-ink-soft leading-relaxed"
              >
                {i === 0 ? (
                  <CircleDot className="size-4 text-ember shrink-0 mt-0.5" />
                ) : (
                  <Circle className="size-4 text-ink-soft/50 shrink-0 mt-0.5" />
                )}
                {item}
              </motion.li>
            ))}
          </ul>
        </div>
      </div>

      <p className="mt-14 text-xs text-ink-soft/70 font-mono">
        Full reasoning behind every decision, including reversals — DECISIONS.md, in the repo.
      </p>
    </section>
  );
}
