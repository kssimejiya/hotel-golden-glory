"use client";

import { motion } from "framer-motion";
import { useHydratedReducedMotion } from "@/lib/hooks/useHydratedReducedMotion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/shared/Container";
import { SmartImage } from "@/components/shared/SmartImage";
import { resolveHeroImage } from "@/lib/images/gallery";
import { hotelInfo } from "@/lib/content";
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
  const prefersReducedMotion = useHydratedReducedMotion();

  return (
    <section id="rooms" className="bg-cream py-20">
      <Container>
        {/* The final structure wants "Total 34 Rooms" in big letters. The
            figure is the building's total from hotelInfo, not a sum of
            per-category inventory, which the admin panel can change. */}
        <div className="mb-12 text-center">
          <p className="font-body text-sm font-semibold uppercase tracking-[0.2em] text-gold">
            Accommodation
          </p>
          <h2 className="mt-3 font-display text-4xl font-bold leading-tight text-charcoal sm:text-6xl lg:text-7xl">
            Total <span className="text-gold">{hotelInfo.totalRooms}</span> Rooms
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-soft-gray">
            Three categories, one standard — exceptional.
          </p>
          <div className="mx-auto mt-6 h-0.5 w-16 bg-gold" />
        </div>

        {/* Keyed on the motion preference — see useHydratedReducedMotion. */}
        <motion.div
          key={prefersReducedMotion ? "static" : "animated"}
          variants={prefersReducedMotion ? undefined : sectionStaggerVariants}
          initial={prefersReducedMotion ? undefined : "hidden"}
          whileInView={prefersReducedMotion ? undefined : "visible"}
          viewport={viewportConfig}
          className="grid gap-6 md:grid-cols-3"
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
                    sizes="(max-width: 768px) 100vw, 33vw"
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
                      <span className="ml-1 text-xs font-medium text-soft-gray">
                        / night
                      </span>
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
