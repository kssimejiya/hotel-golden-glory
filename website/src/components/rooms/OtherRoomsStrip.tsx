"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SmartImage } from "@/components/shared/SmartImage";
import { resolveHeroImage } from "@/lib/images/gallery";
import type { Room } from "@/types";
import {
  fadeUp,
  viewportConfig,
  staggerDelay,
  cardLift,
  tapFeedback,
} from "@/lib/animations";
import { Container } from "@/components/shared/Container";
import { SectionHeading } from "@/components/shared/SectionHeading";

interface OtherRoomsStripProps {
  others: Room[];
}

export function OtherRoomsStrip({ others }: OtherRoomsStripProps) {

  return (
    <section className="bg-cream py-16">
      <Container>
        <SectionHeading
          title="Explore Other Rooms"
          subtitle="Find the perfect fit for your stay."
        />

        {/* Grid layout matches RoomCategoriesPreview on the home page: full-
            width single column on mobile (one card per row, generous tap
            target), 3 columns on md+ (one column per "other room" since the
            current room is filtered out, leaving exactly three). The previous
            horizontal scrolling strip was visually inconsistent with the rest
            of the room detail page — the home page never partially-clips a
            card off the right edge, and neither should this. */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {others.map((room, i) => (
            <motion.div
              key={room.slug}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={viewportConfig}
              transition={staggerDelay(i)}
              whileHover={cardLift}
              whileTap={tapFeedback}
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
                    <span className="font-body text-base font-semibold text-gold">
                      from ₹{room.rates[0].single.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="mt-4 flex items-center gap-1 text-sm font-medium text-blue transition-colors group-hover:text-blue-dark">
                    View Details
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}
