import { Hero } from "../components/landing/hero";
import { Problem } from "../components/landing/problem";
import { Architecture } from "../components/landing/architecture";
import { Features } from "../components/landing/features";
import { CodePreview } from "../components/landing/code-preview";
import { Shipped } from "../components/landing/shipped";
import { Roadmap } from "../components/landing/roadmap";
import { Faq } from "../components/landing/faq";
import { Stack } from "../components/landing/stack";
import { CtaFooter } from "../components/landing/cta-footer";

function Index() {
  return (
    <div>
      <Hero />
      <Stack />
      <Problem />
      <Architecture />
      <Features />
      <CodePreview />
      <Shipped />
      <Roadmap />
      <Faq />
      <CtaFooter />
    </div>
  );
}

export default Index;
