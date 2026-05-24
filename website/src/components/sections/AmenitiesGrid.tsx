"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  UtensilsCrossed,
  Wifi,
  Presentation,
  Zap,
  Clock,
  Car,
  Map,
  Snowflake,
  Plane,
  BedSingle,
} from "lucide-react";
import { Container } from "@/components/shared/Container";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { amenities } from "@/lib/content";
import {
  sectionStaggerVariants,
  sectionItemVariants,
  viewportConfig,
} from "@/lib/animations";

const iconMap: Record<string, React.ElementType> = {
  UtensilsCrossed,
  Wifi,
  Presentation,
  Zap,
  Clock,
  Car,
  Map,
  Snowflake,
  Plane,
  BedSingle,
};

export function AmenitiesGrid() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section className="bg-white py-20">
      <Container>
        <SectionHeading
          title="Hotel Amenities"
          subtitle="Everything you need for a comfortable and productive stay."
        />

        <motion.div
          variants={prefersReducedMotion ? undefined : sectionStaggerVariants}
          initial={prefersReducedMotion ? undefined : "hidden"}
          whileInView={prefersReducedMotion ? undefined : "visible"}
          viewport={viewportConfig}
          className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-5"
        >
          {amenities.map((amenity) => {
            const Icon = iconMap[amenity.icon];
            return (
              <motion.div
                key={amenity.title}
                variants={
                  prefersReducedMotion ? undefined : sectionItemVariants
                }
                className="flex flex-col items-center rounded-xl p-6 text-center transition-colors hover:bg-gold-5"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gold-10">
                  {Icon && <Icon className="h-6 w-6 text-gold" />}
                </div>
                <h3 className="mt-4 font-body text-sm font-semibold text-charcoal">
                  {amenity.title}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-soft-gray">
                  {amenity.description}
                </p>
              </motion.div>
            );
          })}
        </motion.div>
      </Container>
    </section>
  );
}
