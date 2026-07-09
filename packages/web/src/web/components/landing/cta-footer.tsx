import { motion } from "motion/react";
import { Link } from "wouter";
import { BookOpen } from "lucide-react";

export function CtaFooter() {
  return (
    <footer className="bg-ink text-paper py-24 sm:py-32">
      <div className="max-w-3xl mx-auto px-6 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6 }}
          className="text-3xl sm:text-4xl font-semibold leading-tight"
        >
          Your voice. Your infrastructure. Your rules.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mt-4 text-paper/70 max-w-lg mx-auto"
        >
          Full setup, API reference, and webhook guides — everything you need to point a phone number at
          your own agent.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-8"
        >
          <Link
            to="/docs"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-ember text-paper font-medium hover:opacity-90 transition-opacity"
          >
            <BookOpen className="size-4" />
            Read the Docs
          </Link>
        </motion.div>

        <p className="mt-16 font-mono text-xs text-paper/40">
          Open source, free to self-host forever — Apache License 2.0
        </p>
      </div>
    </footer>
  );
}

