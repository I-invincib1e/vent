import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
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
    <section className="max-w-2xl mx-auto px-6 py-24 sm:py-32">
      <SectionLabel index="03" label="What's Inside" />
      <h2 className="text-3xl sm:text-4xl font-semibold leading-tight max-w-2xl">
        Built like a product. Owned like infrastructure.
      </h2>
      <p className="mt-4 text-ink-soft max-w-xl leading-relaxed">
        Scroll — each card settles into place as the next one arrives.
      </p>

      <div className="mt-10">
        {features.map((f, i) => (
          <StackCard key={f.title} feature={f} index={i} total={features.length} />
        ))}
      </div>
    </section>
  );
}

function StackCard({
  feature,
  index,
  total,
}: {
  feature: (typeof features)[number];
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
        <feature.icon className="size-6 text-ember" />
        <h3 className="font-semibold text-lg mt-4">{feature.title}</h3>
        <p className="text-sm text-ink-soft mt-2 leading-relaxed">{feature.story}</p>
        <p className="mt-4 font-mono text-[10px] uppercase tracking-widest text-ink-soft/50">
          {index + 1} / {total}
        </p>
      </motion.div>
    </div>
  );
}
