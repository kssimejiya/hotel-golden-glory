"use client";

import { useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import Image from "next/image";
import { Container } from "@/components/shared/Container";
import { Reveal } from "@/components/shared/Reveal";
import {
  sectionStaggerVariants,
  sectionItemVariants,
  viewportConfig,
} from "@/lib/animations";

// 1x1 warm-cream PNG — matches the restaurant photo's dominant tone so the
// blur-up doesn't flash a wrong colour while the real image loads.
const DINING_BLUR_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ipB4AAAAASUVORK5CYII=";

export function DiningPreview() {
  const sectionRef = useRef<HTMLElement>(null);
  const prefersReducedMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  // Subtle parallax — image pans up gently as the section traverses the viewport.
  // Stays within the scale(1.12) overflow margin so edges never reveal.
  const imageY = useTransform(scrollYProgress, [0, 1], ["5%", "-5%"]);

  return (
    <section ref={sectionRef} className="bg-cream py-20">
      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Image with subtle parallax */}
          <Reveal>
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
              {/* Single transform layer: scale(1.12) provides the overflow
                  margin, translateY drives the parallax. Both compose into a
                  single GPU-composited transform — no layout cost. */}
              <motion.div
                className="absolute inset-0"
                style={
                  prefersReducedMotion
                    ? undefined
                    : {
                        y: imageY,
                        scale: 1.12,
                        willChange: "transform",
                      }
                }
              >
                <Image
                  src="/images/dining/restaurant-main.jpg"
                  alt="Multi-cuisine restaurant at Hotel Golden Glory"
                  fill
                  placeholder="blur"
                  blurDataURL={DINING_BLUR_DATA_URL}
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </motion.div>
            </div>
          </Reveal>

          {/* Content — choreographed stagger */}
          <motion.div
            variants={
              prefersReducedMotion ? undefined : sectionStaggerVariants
            }
            initial={prefersReducedMotion ? undefined : "hidden"}
            whileInView={prefersReducedMotion ? undefined : "visible"}
            viewport={viewportConfig}
          >
            <motion.p
              variants={
                prefersReducedMotion ? undefined : sectionItemVariants
              }
              className="font-body text-sm font-semibold uppercase tracking-[0.2em] text-gold"
            >
              Dining
            </motion.p>
            <motion.h2
              variants={
                prefersReducedMotion ? undefined : sectionItemVariants
              }
              className="mt-2 text-section-heading font-display font-semibold text-charcoal"
            >
              Around the Clock, Around the World
            </motion.h2>
            <motion.div
              variants={
                prefersReducedMotion ? undefined : sectionItemVariants
              }
              className="mt-4 h-0.5 w-16 bg-gold"
            />
            <motion.p
              variants={
                prefersReducedMotion ? undefined : sectionItemVariants
              }
              className="mt-6 text-base leading-relaxed text-soft-gray"
            >
              Breakfast, lunch, dinner — and every hour between. Our in-house
              multi-cuisine restaurant serves hearty Gujarati thalis,
              continental classics, and a global menu around the clock. A
              2 AM arrival finds dinner waiting. A 5 AM departure finds
              breakfast already on the way. Whenever you&apos;re hungry,
              we&apos;re cooking.
            </motion.p>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
