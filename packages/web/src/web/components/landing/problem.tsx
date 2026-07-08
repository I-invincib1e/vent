import { useRef } from "react";
import { motion, useScroll, useTransform, useSpring } from "motion/react";
import { SectionLabel } from "./section-label";

const rows: [string, string, string][] = [
  ["Where your voice lives", "Locked in their cloud, their format", "Your own server, your own database"],
  ["What it costs", "Per-minute markup on every call", "Whatever Deepgram/ElevenLabs/your LLM actually cost"],
  ["What you can change", "Whatever their dashboard allows", "Every line of the pipeline"],
  ["Where the transcripts go", "Their analytics, maybe exportable", "Your database, from turn one"],
];

function ProblemRow({
  row,
  index,
  total,
  progress,
}: {
  row: [string, string, string];
  index: number;
  total: number;
  progress: ReturnType<typeof useSpring>;
}) {
  const start = index / total;
  const end = start + 1 / total;
  const opacity = useTransform(progress, [start, end], [0.15, 1]);
  const x = useTransform(progress, [start, end], [-16, 0]);
  const [label, black, vent] = row;

  return (
    <motion.div style={{ opacity, x }} className="grid grid-cols-3 text-sm">
      <div className="p-4 font-medium">{label}</div>
      <div className="p-4 text-ink-soft">{black}</div>
      <div className="p-4 text-ink font-medium">{vent}</div>
    </motion.div>
  );
}

export function Problem() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.75", "end 0.5"] });
  const progress = useSpring(scrollYProgress, { stiffness: 100, damping: 26, mass: 0.5 });

  return (
    <section ref={ref} className="max-w-3xl mx-auto px-6 py-24 sm:py-32">
      <SectionLabel index="01" label="The Problem" />
      <motion.h2
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.6 }}
        className="text-3xl sm:text-4xl font-semibold leading-tight"
      >
        Most "AI voice agents" are just a rented phone line to someone else's servers.
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="mt-6 text-ink-soft leading-relaxed max-w-2xl"
      >
        You configure a prompt in someone's dashboard, pay per minute, and hope their roadmap matches
        yours. The moment you need a custom tool, a different STT model, or your own data pipeline —
        you're stuck waiting on their platform team.
      </motion.p>

      <div className="mt-14 border border-border rounded-xl overflow-hidden divide-y divide-border">
        <div className="grid grid-cols-3 bg-paper-2 font-mono text-xs uppercase tracking-wider text-ink-soft">
          <div className="p-4" />
          <div className="p-4">Black-box platform</div>
          <div className="p-4 text-signal">OpenVent</div>
        </div>
        {rows.map((row, i) => (
          <ProblemRow key={row[0]} row={row} index={i} total={rows.length} progress={progress} />
        ))}
      </div>
    </section>
  );
}
