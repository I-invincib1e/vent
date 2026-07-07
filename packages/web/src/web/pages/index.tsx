import { Hero } from "../components/landing/hero";
import { Problem } from "../components/landing/problem";
import { Pipeline } from "../components/landing/pipeline";
import { Features } from "../components/landing/features";
import { CodePreview } from "../components/landing/code-preview";
import { ProductTour } from "../components/landing/product-tour";
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
      <Pipeline />
      <Features />
      <CodePreview />
      <ProductTour />
      <Shipped />
      <Roadmap />
      <Faq />
      <CtaFooter />
    </div>
  );
}

export default Index;
