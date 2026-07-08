import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { ShieldCheck, Plug, GitBranch, FileClock } from "lucide-react";
import { SectionLabel } from "./section-label";

const shipped = [
  {
    icon: ShieldCheck,
    title: "Compliance, enforced not promised",
    story:
      "TCPA calling-window + Do-Not-Call checks on every outbound call, spoken AI/recording disclosure by default, a HIPAA boot guardrail, and GDPR retention purge + right-to-erasure — all in code, in @openvent/compliance, usable outside OpenVent too.",
  },
  {
    icon: FileClock,
    title: "Audit trail, on demand",
    story:
      "Pull who was called, when, under what disposition, DNC status, and whether the AI disclosure was actually spoken (not just configured) — as plain text ready to hand to a lawyer, or JSON for tooling. Per call or per phone number.",
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
    <section className="max-w-2xl mx-auto px-6 py-24 sm:py-32">
      <SectionLabel index="05" label="Shipped Since Launch" />
      <h2 className="text-3xl sm:text-4xl font-semibold leading-tight max-w-2xl">
        Not a static demo. Here's what's actually landed.
      </h2>
      <p className="mt-4 text-ink-soft max-w-xl leading-relaxed">
        Everything below exists in the repo today, tested and wired into the running app — not on a
        someday list.
      </p>

      <div className="mt-10">
        {shipped.map((f, i) => (
          <ShippedCard key={f.title} item={f} index={i} total={shipped.length} />
        ))}
      </div>
    </section>
  );
}

function ShippedCard({
  item,
  index,
  total,
}: {
  item: (typeof shipped)[number];
  index: number;
  total: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.85", "start 0.35"] });
  const scale = useTransform(scrollYProgress, [0, 1], [0.94, 1]);
  const opacity = useTransform(scrollYProgress, [0, 1], [0.5, 1]);
  const y = useTransform(scrollYProgress, [0, 1], [24, 0]);

  return (
    <div ref={ref} className="sticky" style={{ top: `${5 + index * 3.25}rem`, zIndex: index + 1 }}>
      <motion.div
        style={{ scale, opacity, y }}
        className="border border-border rounded-xl p-6 bg-card shadow-[0_8px_30px_-12px_rgba(23,19,16,0.15)] mb-6"
      >
        <item.icon className="size-6 text-signal" />
        <h3 className="font-semibold text-lg mt-4">{item.title}</h3>
        <p className="text-sm text-ink-soft mt-2 leading-relaxed">{item.story}</p>
        <p className="mt-4 font-mono text-[10px] uppercase tracking-widest text-ink-soft/50">
          {index + 1} / {total}
        </p>
      </motion.div>
    </div>
  );
}
