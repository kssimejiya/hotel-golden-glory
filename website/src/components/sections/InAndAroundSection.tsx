"use client";

import { motion } from "framer-motion";
import { useHydratedReducedMotion } from "@/lib/hooks/useHydratedReducedMotion";
import { Container } from "@/components/shared/Container";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { nearbyPlaces } from "@/lib/content";
import {
  sectionStaggerVariants,
  sectionItemVariants,
  viewportConfig,
} from "@/lib/animations";

/**
 * In & Around — places to see in Rajkot and further out, numbered in the
 * order the hotel sent them. The brief lists "In & Around" as its own page;
 * the hotel wants it on the homepage instead.
 */
export function InAndAroundSection() {
  const prefersReducedMotion = useHydratedReducedMotion();

  return (
    <section id="in-and-around" className="bg-cream py-20">
      <Container>
        <SectionHeading title="In & Around" />

        {/* Keyed on the motion preference — see useHydratedReducedMotion. */}
        <motion.ol
          key={prefersReducedMotion ? "static" : "animated"}
          variants={prefersReducedMotion ? undefined : sectionStaggerVariants}
          initial={prefersReducedMotion ? undefined : "hidden"}
          whileInView={prefersReducedMotion ? undefined : "visible"}
          viewport={viewportConfig}
          className="mx-auto grid max-w-5xl gap-4 md:grid-cols-2"
        >
          {nearbyPlaces.map((place, index) => (
            <motion.li
              key={place.name}
              variants={prefersReducedMotion ? undefined : sectionItemVariants}
              className="flex items-start gap-4 rounded-2xl border border-border-warm bg-white p-5 shadow-sm"
            >
              {/* The <ol> already tells screen readers the position. */}
              <span
                aria-hidden="true"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold-10 font-display text-sm font-semibold text-gold"
              >
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="font-display text-base font-semibold text-charcoal">
                  {place.name}
                </h3>
                {place.note && (
                  <p className="mt-1 text-sm leading-relaxed text-soft-gray">
                    {place.note}
                  </p>
                )}
              </div>
              {place.distance && (
                <span className="shrink-0 whitespace-nowrap rounded-full bg-gold-10 px-2.5 py-1 text-xs font-semibold text-gold">
                  {place.distance}
                </span>
              )}
            </motion.li>
          ))}
        </motion.ol>
      </Container>
    </section>
  );
}
