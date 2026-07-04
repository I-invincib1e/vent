import { Hero } from "../components/landing/hero";
import { Problem } from "../components/landing/problem";
import { Pipeline } from "../components/landing/pipeline";
import { Features } from "../components/landing/features";
import { CodePreview } from "../components/landing/code-preview";
import { Stack } from "../components/landing/stack";
import { CtaFooter } from "../components/landing/cta-footer";

function Index() {
  return (
    <div>
      <Hero />
      <Stack />
      <Problem />
      <Pipeline />
      <Features />
      <CodePreview />
      <CtaFooter />
    </div>
  );
}

export default Index;
