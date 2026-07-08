import { useRef, useState } from "react";
import { motion, useScroll, useTransform, useSpring, type MotionValue } from "motion/react";
import { PhoneCall, LayoutDashboard } from "lucide-react";
import { SectionLabel } from "./section-label";
import { TwilioLogo, DeepgramLogo, ElevenLabsLogo, CartesiaLogo } from "./logos";

export function Architecture() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.8", "end 0.4"] });
  const progress = useSpring(scrollYProgress, { stiffness: 90, damping: 24, mass: 0.5 });

  const [tts, setTts] = useState<"elevenlabs" | "cartesia">("elevenlabs");

  // stage reveal thresholds along the scroll progress (0 -> 1)
  const rowLine = useTransform(progress, [0, 0.55], [0, 1]);
  const downLine = useTransform(progress, [0.5, 0.85], [0, 1]);

  function useStage(from: number, to: number) {
    return {
      opacity: useTransform(progress, [from, to], [0.25, 1]),
      y: useTransform(progress, [from, to], [8, 0]),
    };
  }

  const sCaller1 = useStage(0, 0.12);
  const sTwilio = useStage(0.1, 0.24);
  const sHub = useStage(0.24, 0.4);
  const sProviders = useStage(0.4, 0.58);
  const sCaller2 = useStage(0.55, 0.68);
  const sDashboard = useStage(0.65, 0.85);

  return (
    <section id="architecture" ref={ref} className="bg-ink text-paper py-24 sm:py-32">
      <div className="max-w-5xl mx-auto px-6">
        <SectionLabel index="02" label="How it Works" />
        <h2 className="text-3xl sm:text-4xl font-semibold leading-tight max-w-2xl">
          One call, one hub, every piece swappable.
        </h2>
        <p className="mt-6 text-paper/70 leading-relaxed max-w-2xl">
          Scroll — this is the actual shape of the system, not a marketing diagram. OpenVent is the
          hub in the middle; everything around it is a provider you bring your own keys for.
        </p>

        {/* Desktop diagram */}
        <div className="relative mt-20 hidden md:block">
          <div className="grid grid-cols-5 gap-4 items-center">
            <DiagramNode style={sCaller1} label="Caller" sub="Dials in, or gets called">
              <PhoneCall className="size-5" />
            </DiagramNode>

            <DiagramNode style={sTwilio} label="Twilio" sub="Live Media Stream, both directions">
              <TwilioLogo className="size-6" />
            </DiagramNode>

            <DiagramNode hub style={sHub} label="OpenVent" sub="State engine · compliance · tool calling">
              <span className="font-display font-semibold text-lg">OV</span>
            </DiagramNode>

            <motion.div style={sProviders} className="flex flex-col gap-3">
              <ProviderChip title="Deepgram — speech to text">
                <DeepgramLogo className="size-5" />
              </ProviderChip>
              <ProviderChip title="LLM — reasons, calls tools (AI Gateway / Groq)">
                <span className="font-mono text-[10px] uppercase tracking-wide">LLM</span>
              </ProviderChip>
              <button
                type="button"
                onClick={() => setTts((t) => (t === "elevenlabs" ? "cartesia" : "elevenlabs"))}
                className="w-full"
                title="Click to swap the TTS provider — same env var swap OpenVent actually uses"
              >
                <ProviderChip interactive title={tts === "elevenlabs" ? "ElevenLabs — text to speech" : "Cartesia — text to speech"}>
                  {tts === "elevenlabs" ? (
                    <ElevenLabsLogo className="size-5" />
                  ) : (
                    <CartesiaLogo className="h-4 w-auto" />
                  )}
                </ProviderChip>
              </button>
            </motion.div>

            <DiagramNode style={sCaller2} label="Caller" sub="Hears the reply, can interrupt anytime">
              <PhoneCall className="size-5" />
            </DiagramNode>
          </div>

          {/* horizontal connector line beneath the row */}
          <div className="relative h-px mt-8 bg-paper/15">
            <motion.div
              className="absolute inset-y-0 left-0 bg-signal origin-left"
              style={{ scaleX: rowLine, width: "100%" }}
            />
          </div>

          {/* vertical branch down to dashboard, under the hub column (3rd of 5) */}
          <div className="grid grid-cols-5">
            <div />
            <div />
            <div className="flex flex-col items-center">
              <div className="relative w-px h-14">
                <motion.div
                  className="absolute inset-x-0 top-0 bg-signal origin-top"
                  style={{ scaleY: downLine, height: "100%" }}
                />
              </div>
              <motion.div style={sDashboard}>
                <ProviderChip title="Your database — calls, transcripts, captured state, DNC list">
                  <LayoutDashboard className="size-5" />
                </ProviderChip>
                <p className="mt-2 text-center font-mono text-[10px] uppercase tracking-wide text-paper/50">
                  Your dashboard
                </p>
              </motion.div>
            </div>
            <div />
            <div />
          </div>
        </div>

        {/* Mobile fallback: simple staggered vertical list */}
        <div className="md:hidden mt-14 space-y-6">
          {[
            { label: "Caller", sub: "Dials in, or gets called", icon: <PhoneCall className="size-5" /> },
            { label: "Twilio", sub: "Live Media Stream, both directions", icon: <TwilioLogo className="size-5" /> },
            { label: "OpenVent core", sub: "State engine · compliance · tool calling", icon: null },
            { label: "Deepgram", sub: "Speech to text", icon: <DeepgramLogo className="size-5" /> },
            { label: "LLM", sub: "Reasons, calls tools", icon: null },
            { label: "ElevenLabs / Cartesia", sub: "Text to speech, swappable via env var", icon: <ElevenLabsLogo className="size-5" /> },
            { label: "Your dashboard", sub: "Calls, transcripts, captured state, DNC list", icon: <LayoutDashboard className="size-5" /> },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ duration: 0.5, delay: i * 0.06 }}
              className="flex items-start gap-4 border-l-2 border-signal/40 pl-4"
            >
              <div className="text-signal mt-0.5">{s.icon}</div>
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
          If the caller talks over the agent mid-reply, OpenVent clears the in-flight response
          instantly — no waiting for a robotic monologue to finish. Try the TTS box above — that swap
          is a real env var, not a mockup.
        </motion.p>
      </div>
    </section>
  );
}

function DiagramNode({
  children,
  label,
  sub,
  hub,
  style,
}: {
  children: React.ReactNode;
  label: string;
  sub: string;
  hub?: boolean;
  style: { opacity: MotionValue<number>; y: MotionValue<number> };
}) {
  return (
    <motion.div style={style} className="text-center">
      <div
        className={`mx-auto size-14 rounded-full border flex items-center justify-center ${
          hub ? "border-ember bg-ember/10 text-ember" : "border-paper/20 bg-ink text-signal"
        }`}
      >
        {children}
      </div>
      <p className={`font-mono text-xs uppercase tracking-wide mt-3 ${hub ? "text-ember" : "text-paper"}`}>
        {label}
      </p>
      <p className="text-xs text-paper/50 mt-1.5 leading-relaxed">{sub}</p>
    </motion.div>
  );
}

function ProviderChip({
  children,
  title,
  interactive,
}: {
  children: React.ReactNode;
  title: string;
  interactive?: boolean;
}) {
  return (
    <div
      title={title}
      className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-signal ${
        interactive
          ? "border-ember/40 bg-ember/5 hover:bg-ember/10 cursor-pointer transition-colors"
          : "border-paper/15 bg-paper/[0.03]"
      }`}
    >
      {children}
    </div>
  );
}
