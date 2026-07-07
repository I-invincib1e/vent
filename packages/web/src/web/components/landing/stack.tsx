import { motion } from "motion/react";

const stack = ["Twilio", "Deepgram", "ElevenLabs / Cartesia", "AI Gateway / Groq", "Turso", "n8n / Zapier"];

export function Stack() {
  return (
    <section className="border-y border-border bg-paper-2 py-14">
      <div className="max-w-5xl mx-auto px-6">
        <p className="font-mono text-xs uppercase tracking-widest text-ink-soft text-center mb-8">
          Runs on infrastructure you already trust
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {stack.map((s, i) => (
            <motion.span
              key={s}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              whileHover={{ scale: 1.06 }}
              className="font-mono text-sm sm:text-base font-medium text-ink-soft hover:text-ember transition-colors cursor-default"
            >
              {s}
            </motion.span>
          ))}
        </div>
      </div>
    </section>
  );
}
