import { motion } from "motion/react";
import { Link } from "wouter";
import { ArrowRight, BookOpen } from "lucide-react";

export function Hero() {
  return (
    <section className="relative min-h-[92vh] flex flex-col items-center justify-center px-6 overflow-hidden">
      {/* Ambient breathing gradient */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 30%, oklch(0.83 0.05 40 / 0.5) 0%, transparent 70%)",
        }}
        animate={{ opacity: [0.6, 1, 0.6], scale: [1, 1.06, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.img
        src="/logo-mark.png"
        alt="OpenVent"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="size-14 sm:size-16 mb-6"
      />

      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.05 }}
        className="font-mono text-xs tracking-[0.25em] uppercase text-ember mb-6"
      >
        Voice Agent Infrastructure
      </motion.p>

      <motion.h1
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.1 }}
        className="text-6xl sm:text-8xl font-semibold tracking-tight text-center"
      >
        OpenVent
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.2 }}
        className="mt-6 text-lg sm:text-xl text-ink-soft text-center max-w-xl leading-relaxed"
      >
        Every black-box voice AI platform is a rented voice. <br className="hidden sm:block" />
        OpenVent is the vent it escapes through — your pipeline, your keys, your rules.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.35 }}
        className="mt-10 flex flex-wrap items-center justify-center gap-4"
      >
        <Link
          to="/docs"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-ember text-paper font-medium hover:opacity-90 transition-opacity"
        >
          <BookOpen className="size-4" />
          Read the Docs
        </Link>
        <a
          href="#pipeline"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-md border border-border text-ink font-medium hover:bg-paper-2 transition-colors"
        >
          See how it works
          <ArrowRight className="size-4" />
        </a>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.8 }}
        className="absolute bottom-10 font-mono text-xs text-ink-soft/70 tracking-widest uppercase"
      >
        Twilio · Deepgram · LLM · ElevenLabs
      </motion.div>
    </section>
  );
}
