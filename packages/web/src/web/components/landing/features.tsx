import { motion } from "motion/react";
import { Zap, Wrench, Disc3, Webhook } from "lucide-react";
import { SectionLabel } from "./section-label";

const features = [
  {
    icon: Zap,
    title: "Barge-in, handled",
    story:
      "Mid-sentence, the caller jumps in. OpenVent hears it instantly, clears the agent's in-flight reply, and listens — the way a real conversation actually works.",
  },
  {
    icon: Wrench,
    title: "Tools the agent can use",
    story:
      "Look something up. Book a slot. Every tool call runs mid-conversation, gets logged, and can call out to your own systems — not a sandboxed black box.",
  },
  {
    icon: Disc3,
    title: "Every call, remembered",
    story:
      "Full recordings and turn-by-turn transcripts land in your own database the moment the call ends — nothing trapped behind someone else's export button.",
  },
  {
    icon: Webhook,
    title: "Wired into your workflows",
    story:
      "Call started, transcript line, tool call, recording ready — every beat fires straight to n8n, Zapier, or wherever your automations already live.",
  },
];

export function Features() {
  return (
    <section className="max-w-5xl mx-auto px-6 py-24 sm:py-32">
      <SectionLabel index="03" label="What's Inside" />
      <h2 className="text-3xl sm:text-4xl font-semibold leading-tight max-w-2xl">
        Built like a product. Owned like infrastructure.
      </h2>

      <div className="mt-14 grid sm:grid-cols-2 gap-6">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.55, delay: i * 0.08 }}
            className="border border-border rounded-xl p-6 bg-card hover:border-ember/40 transition-colors"
          >
            <f.icon className="size-6 text-ember" />
            <h3 className="font-semibold text-lg mt-4">{f.title}</h3>
            <p className="text-sm text-ink-soft mt-2 leading-relaxed">{f.story}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
