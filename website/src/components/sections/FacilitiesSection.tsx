"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Presentation, UtensilsCrossed } from "lucide-react";
import { useHydratedReducedMotion } from "@/lib/hooks/useHydratedReducedMotion";
import { Container } from "@/components/shared/Container";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { facilityHighlights } from "@/lib/content";
import {
  sectionStaggerVariants,
  sectionItemVariants,
  viewportConfig,
} from "@/lib/animations";

const iconMap: Record<string, React.ElementType> = {
  UtensilsCrossed,
  Presentation,
};

/**
 * Facilities — the two the final website structure names: the multi-cuisine
 * restaurant, open 24x7, and the board room. Everything else guests get is
 * listed in the header's four-dot amenities menu.
 */
export function FacilitiesSection() {
  const prefersReducedMotion = useHydratedReducedMotion();

  return (
    <section id="facilities" className="bg-white py-20">
      <Container>
        <SectionHeading title="Facilities" />

        {/* Keyed on the motion preference — see useHydratedReducedMotion. */}
        <motion.div
          key={prefersReducedMotion ? "static" : "animated"}
          variants={prefersReducedMotion ? undefined : sectionStaggerVariants}
          initial={prefersReducedMotion ? undefined : "hidden"}
          whileInView={prefersReducedMotion ? undefined : "visible"}
          viewport={viewportConfig}
          className="grid gap-6 md:grid-cols-2"
        >
          {facilityHighlights.map((facility) => {
            const Icon = iconMap[facility.icon];
            return (
              <motion.article
                key={facility.id}
                variants={
                  prefersReducedMotion ? undefined : sectionItemVariants
                }
                className="overflow-hidden rounded-2xl border border-border-warm bg-white shadow-sm"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-charcoal">
                  {facility.image ? (
                    <Image
                      src={facility.image}
                      alt={facility.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover"
                      style={{ objectPosition: facility.imagePosition }}
                    />
                  ) : (
                    // No photo yet: a branded panel instead of an empty frame.
                    <div className="flex h-full items-center justify-center">
                      <span className="flex h-20 w-20 items-center justify-center rounded-full bg-gold-15">
                        {Icon && (
                          <Icon
                            className="h-9 w-9 text-gold-light"
                            aria-hidden="true"
                          />
                        )}
                      </span>
                    </div>
                  )}
                  {facility.badge && (
                    <span className="absolute left-4 top-4 rounded-full bg-gold px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white shadow">
                      {facility.badge}
                    </span>
                  )}
                </div>
                <div className="p-6">
                  <h3 className="flex items-center gap-2 font-display text-xl font-semibold text-charcoal">
                    {Icon && (
                      <Icon className="h-5 w-5 text-gold" aria-hidden="true" />
                    )}
                    {facility.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-soft-gray">
                    {facility.description}
                  </p>
                </div>
              </motion.article>
            );
          })}
        </motion.div>
      </Container>
    </section>
  );
}
