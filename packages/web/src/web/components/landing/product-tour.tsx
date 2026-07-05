import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { PhoneCall, Sparkles, ShieldOff } from "lucide-react";
import { SectionLabel } from "./section-label";

const TABS = [
  {
    id: "calls",
    label: "Calls",
    icon: PhoneCall,
    image: "/demo/dashboard-calls.png",
    caption: "Every live and completed call, auto-refreshing, no export button required.",
  },
  {
    id: "state",
    label: "Captured state",
    icon: Sparkles,
    image: "/demo/dashboard-detail.png",
    caption:
      "Full transcript, tool-call log, and the state engine's captured facts — the ground truth the agent reads back every turn instead of re-parsing scrollback.",
  },
  {
    id: "dnc",
    label: "Compliance",
    icon: ShieldOff,
    image: "/demo/dashboard-dnc.png",
    caption: "Do-Not-Call list, managed from the dashboard — enforced automatically before every outbound call.",
  },
] as const;

export function ProductTour() {
  const [active, setActive] = useState<(typeof TABS)[number]["id"]>("calls");
  const activeTab = TABS.find((t) => t.id === active)!;

  return (
    <section className="max-w-5xl mx-auto px-6 py-24 sm:py-32">
      <SectionLabel index="05" label="See It Running" />
      <h2 className="text-3xl sm:text-4xl font-semibold leading-tight max-w-2xl">
        This isn't a mockup. It's the actual dashboard, on real calls.
      </h2>
      <p className="mt-4 text-ink-soft max-w-xl leading-relaxed">
        Screenshots taken straight from a running instance — the calls, transcripts, and captured state
        below came from real phone calls, not staged data.
      </p>

      <div className="mt-10 flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              active === tab.id ? "bg-ember text-paper" : "bg-paper-2 text-ink-soft hover:text-ink"
            }`}
          >
            <tab.icon className="size-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35 }}
          >
            <div className="rounded-xl border border-border overflow-hidden shadow-sm">
              <img src={activeTab.image} alt={`Vent dashboard — ${activeTab.label}`} className="w-full block" />
            </div>
            <p className="mt-4 text-sm text-ink-soft leading-relaxed max-w-xl">{activeTab.caption}</p>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
