import { useRef } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";

/**
 * Character-by-character reveal, GSAP-driven (React Bits "Split Text" pattern, ported to this
 * project's stack instead of pulled in as a dependency). Motion (framer-motion) handles every other
 * entrance animation on this page — this is the one spot GSAP earns its place, since staggering
 * dozens of individual character tweens is exactly what it's built for.
 */
export function SplitText({
  text,
  className,
  delay = 0,
  as: Tag = "span",
}: {
  text: string;
  className?: string;
  delay?: number;
  as?: "span" | "h1" | "h2";
}) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (!ref.current) return;
      const chars = ref.current.querySelectorAll("[data-char]");
      gsap.set(chars, { opacity: 0, y: "0.6em", rotateX: -40 });
      gsap.to(chars, {
        opacity: 1,
        y: "0em",
        rotateX: 0,
        duration: 0.7,
        ease: "back.out(1.7)",
        stagger: 0.035,
        delay,
      });
    },
    { scope: ref, dependencies: [text] },
  );

  return (
    <Tag ref={ref as never} className={className} style={{ perspective: 400 }} aria-label={text}>
      {text.split("").map((ch, i) => (
        <span
          key={i}
          data-char
          className="inline-block"
          style={{ transformStyle: "preserve-3d" }}
          aria-hidden="true"
        >
          {ch === " " ? "\u00A0" : ch}
        </span>
      ))}
    </Tag>
  );
}
