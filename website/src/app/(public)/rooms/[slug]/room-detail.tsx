"use client";

import { motion } from "framer-motion";
import { Users, Ruler, BedDouble, Phone, Mail } from "lucide-react";
import { Container } from "@/components/shared/Container";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { BookingButton } from "@/components/shared/BookingButton";
import { RoomGalleryHero } from "@/components/rooms/RoomGalleryHero";
import { RoomRateCard } from "@/components/rooms/RoomRateCard";
import { RoomAmenitiesGrid } from "@/components/rooms/RoomAmenitiesGrid";
import { RoomHighlights } from "@/components/rooms/RoomHighlights";
import { OtherRoomsStrip } from "@/components/rooms/OtherRoomsStrip";
import { RoomFAQ } from "@/components/rooms/RoomFAQ";
import { hotelInfo } from "@/lib/content";
import { fadeUp, fadeUpTransition, viewportConfig } from "@/lib/animations";
import type { Room } from "@/types";

interface RoomDetailProps {
  room: Room;
  otherRooms: Room[];
}

export function RoomDetail({ room, otherRooms }: RoomDetailProps) {
  const descParagraphs = room.description.split("\n").filter(Boolean);

  return (
    <>
      {/* Spacer to clear the fixed header. Transparent — the glass header
          now provides its own white backdrop on inner routes (see Header.tsx),
          so a dark spacer would only leak a dark tint through the 95%-opaque
          glass and create a jarring band between header and breadcrumb. */}
      <div className="h-20" />

      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Rooms", href: "/rooms" },
          { label: room.name },
        ]}
      />

      {/* Gallery */}
      <section className="bg-cream pb-8 pt-2">
        <Container>
          <RoomGalleryHero images={room.gallery} roomName={room.name} />
        </Container>
      </section>

      {/* Main content + rate card sidebar */}
      <section className="bg-cream pb-16">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
            {/* Left column: info */}
            <div>
              {/* Title block — centered on mobile (matches home-page sections
                  via SectionHeading), left-aligned on lg+ where the 380px
                  RoomRateCard sidebar anchors the content column. */}
              <motion.div
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={viewportConfig}
                transition={fadeUpTransition}
                className="text-center lg:text-left"
              >
                <h1 className="text-section-heading font-display font-bold text-charcoal">
                  {room.name}
                </h1>
                <p className="mt-1 text-lg italic text-soft-gray">
                  {room.tagline}
                </p>
                <div className="mx-auto mt-4 h-0.5 w-16 bg-gold lg:mx-0" />

                {/* Key facts — pills centered on mobile so they sit symmetric
                    under the gold rule, left-aligned on lg+ */}
                <div className="mt-5 flex flex-wrap justify-center gap-4 lg:justify-start">
                  <div className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm text-charcoal shadow-sm">
                    <Users className="h-4 w-4 text-gold" />
                    Max {room.maxOccupancy} guests
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm text-charcoal shadow-sm">
                    <BedDouble className="h-4 w-4 text-gold" />
                    {room.bedConfiguration}
                  </div>
                  {room.hasBalcony && (
                    <span className="rounded-lg bg-blue px-3 py-2 text-sm font-medium text-white shadow-sm">
                      Private Balcony
                    </span>
                  )}
                </div>
              </motion.div>

              {/* Description — heading centered on mobile, paragraphs stay
                  left-aligned (long-form copy reads better left-aligned even
                  on mobile, but the heading anchors the section's center). */}
              <motion.div
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={viewportConfig}
                transition={{ ...fadeUpTransition, delay: 0.1 }}
                className="mt-10"
              >
                <h2 className="text-center font-display text-xl font-semibold text-charcoal lg:text-left">
                  About This Room
                </h2>
                <div className="mx-auto mt-2 h-0.5 w-10 bg-gold lg:mx-0" />
                <div className="mt-6 space-y-4">
                  {descParagraphs.map((p, i) => (
                    <p key={i} className="text-sm leading-relaxed text-soft-gray">
                      {p}
                    </p>
                  ))}
                </div>
              </motion.div>

              {/* Amenities */}
              <motion.div
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={viewportConfig}
                transition={{ ...fadeUpTransition, delay: 0.1 }}
                className="mt-12"
              >
                <h2 className="text-center font-display text-xl font-semibold text-charcoal lg:text-left">
                  Room Amenities
                </h2>
                <div className="mx-auto mt-2 h-0.5 w-10 bg-gold lg:mx-0" />
                <div className="mt-6">
                  <RoomAmenitiesGrid amenities={room.amenities} />
                </div>
              </motion.div>

              {/* Highlights */}
              <motion.div
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={viewportConfig}
                transition={{ ...fadeUpTransition, delay: 0.1 }}
                className="mt-12"
              >
                <h2 className="text-center font-display text-xl font-semibold text-charcoal lg:text-left">
                  Why Choose {room.shortName}
                </h2>
                <div className="mx-auto mt-2 h-0.5 w-10 bg-gold lg:mx-0" />
                <div className="mt-6">
                  <RoomHighlights highlights={room.highlights} />
                </div>
              </motion.div>
            </div>

            {/* Right column: rate card (sticky on desktop) */}
            <div className="order-first lg:order-last">
              <RoomRateCard rates={room.rates} slug={room.slug} />
            </div>
          </div>
        </Container>
      </section>

      {/* FAQ */}
      <RoomFAQ />

      {/* Other rooms */}
      <OtherRoomsStrip others={otherRooms} />

      {/* Final CTA */}
      <section className="border-t-4 border-gold bg-charcoal py-14">
        <Container>
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={viewportConfig}
            transition={fadeUpTransition}
            className="mx-auto max-w-2xl text-center"
          >
            <h2 className="font-display text-2xl font-semibold text-cream">
              Ready to book? Have questions?
            </h2>
            <p className="mt-2 text-sm text-cream/70">
              Secure your {room.name} today or speak with our reservations team.
            </p>
            <div className="mt-6">
              <BookingButton
                variant="gold"
                size="lg"
                href={`/booking?room=${room.slug}&plan=EP`}
              >
                Check Availability
              </BookingButton>
            </div>
            <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <a
                href={`tel:${hotelInfo.phone}`}
                className="inline-flex items-center gap-2 text-sm text-cream/70 transition-colors hover:text-gold"
              >
                <Phone className="h-4 w-4" />
                {hotelInfo.phone}
              </a>
              <span className="hidden text-cream/30 sm:inline">|</span>
              <a
                href={`mailto:${hotelInfo.email}`}
                className="inline-flex items-center gap-2 text-sm text-cream/70 transition-colors hover:text-gold"
              >
                <Mail className="h-4 w-4" />
                {hotelInfo.email}
              </a>
            </div>
          </motion.div>
        </Container>
      </section>
    </>
  );
}
