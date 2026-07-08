import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus } from "lucide-react";
import { SectionLabel } from "./section-label";

const faqs = [
  {
    q: "Is OpenVent actually self-hosted?",
    a: "The orchestration layer is — the code, database, call logic, compliance rules, and dashboard all run on your own infrastructure. Telephony (Twilio) and the AI models (STT/LLM/TTS) stay cloud APIs by necessity, since no one self-hosts a phone network or frontier model weights. OpenVent wires those providers together while you own everything above the network layer.",
  },
  {
    q: "How is this different from Vapi or Retell?",
    a: "Those are fully managed — you configure a prompt in their dashboard with no access to the underlying code. OpenVent is open-core: you self-host the actual orchestration code, bring your own provider keys, and your call data lands in your own database instead of a vendor's platform.",
  },
  {
    q: "Is it free to use?",
    a: "Yes. The self-hosted core is free forever, fair-code licensed. You only pay for the provider usage you bring yourself (Twilio, Deepgram, ElevenLabs, your LLM). A managed hosted tier may come later — the self-hosted core won't be paywalled.",
  },
  {
    q: "What compliance does it handle automatically?",
    a: "TCPA calling-window checks and Do-Not-Call list enforcement before every outbound call, a spoken AI/recording disclosure by default, a HIPAA boot guardrail, and GDPR-style retention purge + right-to-erasure. A compliance audit-trail export produces a per-call or per-number record on demand.",
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="max-w-3xl mx-auto px-6 py-24 sm:py-32">
      <SectionLabel index="07" label="Questions" />
      <h2 className="text-3xl sm:text-4xl font-semibold leading-tight max-w-2xl">
        Straight answers, not marketing copy.
      </h2>

      <div className="mt-12 divide-y divide-border border-t border-border">
        {faqs.map((f, i) => {
          const isOpen = open === i;
          return (
            <motion.div
              key={f.q}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.45, delay: i * 0.06 }}
            >
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : i)}
                className="w-full py-6 flex items-center justify-between gap-4 text-left"
                aria-expanded={isOpen}
              >
                <h3 className="font-semibold text-lg">{f.q}</h3>
                <Plus
                  className={`size-4 text-ink-soft shrink-0 transition-transform duration-300 ${isOpen ? "rotate-45 text-ember" : ""}`}
                />
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <p className="pb-6 text-sm text-ink-soft leading-relaxed max-w-2xl">{f.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
