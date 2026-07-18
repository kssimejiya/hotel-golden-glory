"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Shield, Phone, CalendarCheck, BadgeCheck } from "lucide-react";
import { PageHero } from "@/components/shared/PageHero";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { Container } from "@/components/shared/Container";
import { SmartImage } from "@/components/shared/SmartImage";
import { resolveHeroImage } from "@/lib/images/gallery";
import { hotelInfo } from "@/lib/content";
import type { Room } from "@/types";
import {
  fadeUp,
  viewportConfig,
  staggerDelay,
  cardLift,
  tapFeedback,
} from "@/lib/animations";

const trustItems = [
  { icon: Shield, label: "Best Rate Guarantee" },
  { icon: CalendarCheck, label: "Free Cancellation" },
  { icon: Phone, label: "24/7 Support" },
  { icon: BadgeCheck, label: "Easy Booking" },
];

export function RoomsListing({ rooms }: { rooms: Room[] }) {
  return (
    <>
      <PageHero
        title="Our Rooms & Suites"
        subtitle="34 thoughtfully designed rooms across 4 categories"
      />
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Rooms" }]} />

      {/* Room cards */}
      <section className="bg-cream py-12">
        <Container>
          <div className="grid gap-8 md:grid-cols-2">
            {rooms.map((room, i) => (
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
                  <div className="relative aspect-[16/9] overflow-hidden">
                    <SmartImage
                      image={resolveHeroImage(room)}
                      alt={room.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 640px"
                      preload={i < 2}
                    />
                    {room.hasBalcony && (
                      <span className="absolute right-3 top-3 rounded-full bg-blue px-3 py-1 text-xs font-medium text-white">
                        Balcony
                      </span>
                    )}
                  </div>
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="font-display text-xl font-semibold text-charcoal">
                          {room.name}
                        </h2>
                        <p className="mt-1 text-sm text-soft-gray">
                          {room.tagline}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-display text-xl font-bold text-gold">
                          ₹{room.rates[0].single.toLocaleString("en-IN")}
                        </p>
                        <p className="text-xs text-soft-gray">per night</p>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-3 text-xs text-soft-gray">
                      <span>{room.totalRooms} rooms</span>
                      <span>·</span>
                      <span>{room.bedConfiguration}</span>
                    </div>

                    <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-soft-gray">
                      {room.description.split("\n")[0]}
                    </p>

                    <div className="mt-5 flex items-center gap-1 text-sm font-semibold text-blue transition-colors group-hover:text-blue-dark">
                      View Details & Rates
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      {/* Trust strip */}
      <section className="border-y border-border-warm bg-white py-10">
        <Container>
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {trustItems.map((item, i) => (
              <motion.div
                key={item.label}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={viewportConfig}
                transition={staggerDelay(i)}
                className="flex flex-col items-center gap-2 text-center"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gold-10">
                  <item.icon className="h-5 w-5 text-gold" />
                </div>
                <span className="text-sm font-medium text-charcoal">
                  {item.label}
                </span>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      {/* Contact CTA */}
      <section className="bg-cream py-14">
        <Container>
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={viewportConfig}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="mx-auto max-w-2xl text-center"
          >
            <h2 className="font-display text-xl font-semibold text-charcoal">
              Need help choosing?
            </h2>
            <p className="mt-2 text-sm text-soft-gray">
              Contact our reservations team — we&apos;ll help you find the
              perfect room.
            </p>
            <div className="mt-5 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <a
                href={`tel:${hotelInfo.phone}`}
                className="inline-flex items-center gap-2 text-sm font-medium text-blue transition-colors hover:text-blue-dark"
              >
                <Phone className="h-4 w-4" />
                {hotelInfo.phone}
              </a>
              <span className="hidden text-soft-gray/40 sm:inline">|</span>
              <a
                href={`tel:${hotelInfo.phone2}`}
                className="inline-flex items-center gap-2 text-sm font-medium text-blue transition-colors hover:text-blue-dark"
              >
                <Phone className="h-4 w-4" />
                {hotelInfo.phone2}
              </a>
              <span className="hidden text-soft-gray/40 sm:inline">|</span>
              <a
                href={`mailto:${hotelInfo.email}`}
                className="text-sm font-medium text-blue transition-colors hover:text-blue-dark"
              >
                {hotelInfo.email}
              </a>
            </div>
          </motion.div>
        </Container>
      </section>
    </>
  );
}
