"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/shared/Container";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { SmartImage } from "@/components/shared/SmartImage";
import { resolveHeroImage } from "@/lib/images/gallery";
import type { Room } from "@/types";
import {
  sectionStaggerVariants,
  sectionItemVariants,
  viewportConfig,
  cardLift,
  cardLiftTransition,
  tapFeedback,
} from "@/lib/animations";

export function RoomCategoriesPreview({ rooms }: { rooms: Room[] }) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section id="rooms" className="bg-cream py-20">
      <Container>
        <SectionHeading
          title="Our Rooms"
          subtitle="Four categories, one standard — exceptional."
        />

        <motion.div
          variants={prefersReducedMotion ? undefined : sectionStaggerVariants}
          initial={prefersReducedMotion ? undefined : "hidden"}
          whileInView={prefersReducedMotion ? undefined : "visible"}
          viewport={viewportConfig}
          className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4"
        >
          {rooms.map((room) => (
            <motion.div
              key={room.slug}
              variants={prefersReducedMotion ? undefined : sectionItemVariants}
              whileHover={prefersReducedMotion ? undefined : cardLift}
              whileTap={prefersReducedMotion ? undefined : tapFeedback}
              transition={cardLiftTransition}
              style={{ willChange: "transform" }}
              className="group overflow-hidden rounded-2xl bg-white shadow-sm transition-shadow"
            >
              <Link href={`/rooms/${room.slug}`} className="block">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <SmartImage
                    image={resolveHeroImage(room)}
                    alt={room.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
                  />
                  {room.hasBalcony && (
                    <span className="absolute right-3 top-3 rounded-full bg-blue px-3 py-1 text-xs font-medium text-white">
                      Balcony
                    </span>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="font-display text-lg font-semibold text-charcoal">
                    {room.name}
                  </h3>
                  <p className="mt-1 text-sm text-soft-gray">{room.tagline}</p>
                  <div className="mt-3 flex items-center justify-end">
                    <p className="font-body text-base font-semibold text-gold">
                      from ₹{room.rates[0].single.toLocaleString("en-IN")}
                    </p>
                  </div>
                  <div className="mt-4 flex items-center gap-1 text-sm font-medium text-blue transition-colors group-hover:text-blue-dark">
                    View Details
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </Container>
    </section>
  );
}
