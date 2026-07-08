import {
  TwilioLogo,
  DeepgramLogo,
  ElevenLabsLogo,
  CartesiaLogo,
  GroqLogo,
  N8nLogo,
  ZapierLogo,
  GitHubLogo,
} from "./logos";

const stack = [
  { Logo: TwilioLogo, name: "Twilio", wordmark: false },
  { Logo: DeepgramLogo, name: "Deepgram", wordmark: false },
  { Logo: ElevenLabsLogo, name: "ElevenLabs", wordmark: false },
  { Logo: CartesiaLogo, name: "Cartesia", wordmark: true },
  { Logo: GroqLogo, name: "Groq", wordmark: true },
  { Logo: N8nLogo, name: "n8n", wordmark: false },
  { Logo: ZapierLogo, name: "Zapier", wordmark: false },
  { Logo: GitHubLogo, name: "GitHub", wordmark: false },
];

// Doubled for a seamless infinite loop (React Bits "Logo Loop" pattern — two copies scroll as one).
const loop = [...stack, ...stack];

export function Stack() {
  return (
    <section className="border-y border-border bg-paper-2 py-14 overflow-hidden">
      <p className="font-mono text-xs uppercase tracking-widest text-ink-soft text-center mb-8">
        Real providers. Your own keys. Swap any of them behind one env var.
      </p>

      <div className="relative">
        {/* Fade masks at each edge so the loop doesn't hard-cut */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-16 sm:w-32 bg-gradient-to-r from-paper-2 to-transparent z-10" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-16 sm:w-32 bg-gradient-to-l from-paper-2 to-transparent z-10" />

        <div className="flex items-center gap-14 sm:gap-20 w-max animate-logo-marquee hover:[animation-play-state:paused]">
          {loop.map(({ Logo, name, wordmark }, i) => (
            <div
              key={`${name}-${i}`}
              title={name}
              className="shrink-0 text-ink-soft hover:text-ember transition-colors duration-300"
            >
              <Logo className={wordmark ? "h-5 sm:h-6 w-auto" : "size-6 sm:size-7"} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
