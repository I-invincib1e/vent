import { useRef } from "react";
import { motion, useScroll, useTransform, useSpring } from "motion/react";
import { Phone, Ear, Brain, AudioLines, PhoneCall } from "lucide-react";
import { SectionLabel } from "./section-label";

const stages = [
  { icon: Phone, label: "Twilio", sub: "Caller audio arrives over a live Media Stream" },
  { icon: Ear, label: "Deepgram", sub: "Real-time speech-to-text, streamed as you talk" },
  { icon: Brain, label: "LLM Agent", sub: "Reasons, calls tools, streams a reply" },
  { icon: AudioLines, label: "ElevenLabs", sub: "Streams the reply back as natural speech" },
  { icon: PhoneCall, label: "Caller", sub: "Hears the response — and can interrupt anytime" },
];

export function Pipeline() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.85", "end 0.3"] });
  const progress = useSpring(scrollYProgress, { stiffness: 90, damping: 24, mass: 0.5 });
  const dotLeft = useTransform(progress, [0, 1], ["0%", "100%"]);
  const lineScale = useTransform(progress, [0, 1], [0, 1]);

  return (
    <section id="pipeline" ref={ref} className="bg-ink text-paper py-24 sm:py-32">
      <div className="max-w-5xl mx-auto px-6">
        <SectionLabel index="02" label="How it Works" />
        <h2 className="text-3xl sm:text-4xl font-semibold leading-tight max-w-2xl">
          One voice, four hops, real time.
        </h2>
        <p className="mt-6 text-paper/70 leading-relaxed max-w-2xl">
          Scroll — watch a single voice packet travel the exact path every call takes through OpenVent's
          pipeline, hop by hop, live.
        </p>

        <div className="relative mt-20 hidden md:block">
          {/* Base line */}
          <div className="absolute top-8 left-0 right-0 h-px bg-paper/15" />
          {/* Progress line */}
          <motion.div
            className="absolute top-8 left-0 h-px bg-signal origin-left"
            style={{ scaleX: lineScale, width: "100%" }}
          />
          {/* Traveling voice packet */}
          <motion.div
            className="absolute top-8 -mt-1.5 size-3 rounded-full bg-ember shadow-[0_0_16px_2px_rgba(196,66,26,0.6)]"
            style={{ left: dotLeft, translateX: "-50%" }}
          />

          <div className="grid grid-cols-5 gap-4 pt-20">
            {stages.map((s, i) => (
              <StageCard key={s.label} stage={s} index={i} progress={progress} total={stages.length} />
            ))}
          </div>
        </div>

        {/* Mobile fallback: simple staggered vertical list */}
        <div className="md:hidden mt-14 space-y-6">
          {stages.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="flex items-start gap-4 border-l-2 border-signal/40 pl-4"
            >
              <s.icon className="size-5 text-signal shrink-0 mt-0.5" />
              <div>
                <p className="font-mono text-sm uppercase tracking-wide text-signal">{s.label}</p>
                <p className="text-sm text-paper/70 mt-1">{s.sub}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-16 font-mono text-xs text-paper/50 max-w-lg"
        >
          If the caller talks over the agent mid-reply, OpenVent clears the in-flight response instantly —
          no waiting for a robotic monologue to finish.
        </motion.p>
      </div>
    </section>
  );
}

function StageCard({
  stage,
  index,
  progress,
  total,
}: {
  stage: (typeof stages)[number];
  index: number;
  progress: ReturnType<typeof useSpring>;
  total: number;
}) {
  const threshold = index / (total - 1);
  const opacity = useTransform(progress, [Math.max(threshold - 0.12, 0), threshold], [0.35, 1]);
  const y = useTransform(progress, [Math.max(threshold - 0.12, 0), threshold], [10, 0]);
  const Icon = stage.icon;

  return (
    <motion.div style={{ opacity, y }} className="text-center">
      <div className="mx-auto size-12 rounded-full border border-paper/20 flex items-center justify-center bg-ink">
        <Icon className="size-5 text-signal" />
      </div>
      <p className="font-mono text-xs uppercase tracking-wide text-paper mt-3">{stage.label}</p>
      <p className="text-xs text-paper/50 mt-1.5 leading-relaxed">{stage.sub}</p>
    </motion.div>
  );
}
