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

const LOBBY_BLUR_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkOA8AANMAz5sCaTcAAAAASUVORK5CYII=";

export function ReceptionPreview() {
  const sectionRef = useRef<HTMLElement>(null);
  const prefersReducedMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const imageY = useTransform(scrollYProgress, [0, 1], ["5%", "-5%"]);

  return (
    <section ref={sectionRef} className="bg-white py-20">
      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Content — text first on mobile, visually second on desktop */}
          <motion.div
            variants={
              prefersReducedMotion ? undefined : sectionStaggerVariants
            }
            initial={prefersReducedMotion ? undefined : "hidden"}
            whileInView={prefersReducedMotion ? undefined : "visible"}
            viewport={viewportConfig}
            className="order-2 lg:order-1"
          >
            <motion.p
              variants={
                prefersReducedMotion ? undefined : sectionItemVariants
              }
              className="font-body text-sm font-semibold uppercase tracking-[0.2em] text-gold"
            >
              Lobby & Reception
            </motion.p>
            <motion.h2
              variants={
                prefersReducedMotion ? undefined : sectionItemVariants
              }
              className="mt-2 text-section-heading font-display font-semibold text-charcoal"
            >
              A Warm Welcome, Whatever the Hour
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
              Marble underfoot, warm wood at the walls, chandeliers throwing
              soft golden light — the lobby of The Blues Hotel Golden Glory
              was designed for the end of a long journey, not another
              transaction. Reception is staffed around the clock, every day.
              A 2 AM arrival, a pre-dawn departure, an ordinary Tuesday
              afternoon check-in — all met with the same warmth.
            </motion.p>
          </motion.div>

          {/* Image with parallax — right side on desktop */}
          <Reveal className="order-1 lg:order-2">
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
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
                  src="/images/lobby/main-lounge.jpg"
                  alt="Hotel Golden Glory lobby with marble floors, crystal chandeliers, and lounge seating"
                  fill
                  quality={90}
                  placeholder="blur"
                  blurDataURL={LOBBY_BLUR_DATA_URL}
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </motion.div>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
