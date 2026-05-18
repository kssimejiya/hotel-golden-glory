"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Star } from "lucide-react";
import { Container } from "@/components/shared/Container";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { testimonials } from "@/lib/content";
import {
  sectionStaggerVariants,
  sectionItemVariants,
  viewportConfig,
  cardLift,
  cardLiftTransition,
} from "@/lib/animations";

export function TestimonialsSection() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section className="bg-cream py-20">
      <Container>
        <SectionHeading
          title="What Our Guests Say"
          subtitle="Real feedback from business travellers who chose Golden Glory."
        />

        <motion.div
          variants={prefersReducedMotion ? undefined : sectionStaggerVariants}
          initial={prefersReducedMotion ? undefined : "hidden"}
          whileInView={prefersReducedMotion ? undefined : "visible"}
          viewport={viewportConfig}
          className="grid gap-6 md:grid-cols-3"
        >
          {testimonials.map((t) => (
            <motion.div
              key={t.name}
              variants={
                prefersReducedMotion ? undefined : sectionItemVariants
              }
              whileHover={prefersReducedMotion ? undefined : cardLift}
              transition={cardLiftTransition}
              style={{ willChange: "transform" }}
              className="rounded-2xl bg-white p-6 shadow-sm transition-shadow"
            >
              <div className="flex gap-0.5">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star
                    key={j}
                    className="h-4 w-4 fill-gold text-gold"
                  />
                ))}
              </div>
              <p className="mt-4 text-sm leading-relaxed text-soft-gray">
                &ldquo;{t.text}&rdquo;
              </p>
              <div className="mt-6 border-t border-border-warm pt-4">
                <p className="font-body text-sm font-semibold text-charcoal">
                  {t.name}
                </p>
                <p className="text-xs text-soft-gray">
                  {t.role} &middot; {t.location}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </Container>
    </section>
  );
}
