import { motion } from "motion/react";
import { SectionLabel } from "./section-label";
import { CodeBlock } from "../code-block";

const curl = `curl -X POST {PUBLIC_APP_URL}/api/voice/calls/outbound \\
  -H "Content-Type: application/json" \\
  -d '{
    "to": "+15559876543",
    "persona": "You are a friendly scheduling assistant.",
    "webhookUrl": "https://your-n8n-instance/webhook/abc123"
  }'`;

const payload = `{
  "event": "call.transcript",
  "timestamp": "2026-07-04T20:15:03.221Z",
  "data": {
    "callSid": "CAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "role": "caller",
    "text": "Hi, I'd like to book Tuesday."
  }
}`;

export function CodePreview() {
  return (
    <section className="max-w-5xl mx-auto px-6 py-24 sm:py-32">
      <SectionLabel index="04" label="This Is All It Takes" />
      <h2 className="text-3xl sm:text-4xl font-semibold leading-tight max-w-2xl">
        Trigger a call. Catch the events. That's the whole API.
      </h2>

      <div className="mt-14 grid md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.55 }}
        >
          <p className="font-mono text-xs uppercase tracking-wide text-signal mb-3">Place an outbound call</p>
          <CodeBlock lang="bash" code={curl} />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.55, delay: 0.1 }}
        >
          <p className="font-mono text-xs uppercase tracking-wide text-signal mb-3">Receive it in n8n / Zapier</p>
          <CodeBlock lang="json" code={payload} />
        </motion.div>
      </div>
    </section>
  );
}
