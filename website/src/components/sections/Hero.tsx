"use client";

import { useRef } from "react";
import Link from "next/link";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import Image from "next/image";
import { ArrowRight, ChevronDown } from "lucide-react";
import {
  heroStaggerVariants,
  heroItemVariants,
  heroHeadlineVariants,
  iosSpring,
  iosGentleSpring,
} from "@/lib/animations";
import { BookingButton } from "@/components/shared/BookingButton";

// 1x1 charcoal PNG — Next/Image scales + blurs to fill the bounds.
const BLUR_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgwAYAABUAAfYBfO0AAAAASUVORK5CYII=";

// Trust strip — sourced from concrete facts in content.ts, not marketing fluff.
// Hidden on mobile because WelcomeStrip below repeats the same numbers in a
// dedicated stats grid; showing them twice on a small screen feels crowded.
const heroStats = [
  "★ 3-Star Business Hotel",
  "34 Rooms · 4 Categories",
  "24/7 Multi-Cuisine Dining",
  "Bhakti Nagar, Rajkot",
];

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const prefersReducedMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "-12%"]);
  const chevronOpacity = useTransform(scrollYProgress, [0, 0.4], [1, 0]);

  return (
    <section
      ref={sectionRef}
      // Full viewport on every breakpoint. Mobile anchors content to the
      // bottom (just above the MobileBookingBar) so the upper two-thirds of
      // the building image read as an unobstructed visual statement.
      // Desktop keeps centered content because there's no sticky bar to
      // visually anchor against.
      className="relative flex min-h-screen min-h-dvh items-end overflow-hidden bg-charcoal sm:items-center"
    >
      {/* ── Background: parallax + Ken Burns ─────────────────────────── */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={
          prefersReducedMotion
            ? undefined
            : { y: bgY, willChange: "transform" }
        }
      >
        <motion.div
          className="absolute inset-0"
          style={{ willChange: "transform", transform: "translateZ(0)" }}
          animate={prefersReducedMotion ? undefined : { scale: [1, 1.06, 1] }}
          transition={
            prefersReducedMotion
              ? undefined
              : { duration: 24, ease: "linear", repeat: Infinity }
          }
        >
          <Image
            src="/images/exterior/building-night.jpg"
            alt="Hotel Golden Glory — exterior view"
            fill
            priority
            placeholder="blur"
            blurDataURL={BLUR_DATA_URL}
            className="object-cover"
            sizes="100vw"
          />
        </motion.div>
      </motion.div>

      {/* ── Layered scrim for text readability ───────────────────────── */}
      {/* Mobile scrim — light at top so the building stays visible, then
          deepens through the lower half where the headline + body sit. The
          0.95 floor at 100% also blends seamlessly into the dark sticky
          MobileBookingBar at the very bottom. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 sm:hidden"
        style={{
          backgroundImage:
            "linear-gradient(180deg, rgb(31 31 31 / 0.35) 0%, rgb(31 31 31 / 0.08) 25%, rgb(31 31 31 / 0.18) 50%, rgb(31 31 31 / 0.72) 78%, rgb(31 31 31 / 0.95) 100%)",
        }}
      />
      {/* Desktop scrim — diagonal, heaviest on left where copy sits */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 hidden sm:block"
        style={{
          backgroundImage:
            "linear-gradient(115deg, rgb(31 31 31 / 0.92) 0%, rgb(31 31 31 / 0.6) 38%, transparent 72%)",
        }}
      />
      {/* Soft bottom fade to ground the next section */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-charcoal/75 via-charcoal/25 to-transparent"
      />
      {/* Subtle top fade — softens header crossing the hero */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-charcoal/55 to-transparent"
      />

      {/* ── Content ──────────────────────────────────────────────────── */}
      {/* Mobile: pb-28 sits the content ~112px above section bottom — a
          comfortable gap above the ~80px MobileBookingBar without crowding.
          Desktop: symmetric py-32 for centered layout. */}
      <motion.div
        variants={heroStaggerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 mx-auto w-full max-w-7xl px-6 pb-28 pt-24 sm:px-6 sm:py-32 lg:px-8"
      >
        <div className="max-w-2xl">
          {/* Eyebrow with leading gold rule — tighter tracking on mobile so
              the full tagline stays on one line at 360–414px widths. */}
          <motion.div
            variants={heroItemVariants}
            transition={iosGentleSpring}
            className="mb-6 flex items-center gap-3 sm:gap-4"
          >
            <span
              aria-hidden="true"
              className="h-px w-8 bg-gold sm:w-14"
            />
            <span className="font-body text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-white sm:text-xs sm:tracking-[0.25em]">
              Exceptional Value &middot; Exceptional Service
            </span>
          </motion.div>

          {/* Headline — gold italic on "Rajkot" gives the place name a
              hand-set, sense-of-place flourish that reinforces brand. */}
          <motion.h1
            variants={heroHeadlineVariants}
            transition={iosSpring}
            style={{
              willChange: "transform, opacity",
              textShadow: "0 2px 24px rgb(0 0 0 / 0.5)",
              textWrap: "balance",
            }}
            className="text-hero font-display font-bold text-white"
          >
            Refined Stays in the Heart of{" "}
            <span className="italic text-gold-light">Rajkot</span>
          </motion.h1>

          {/* Body copy — brand promise, not a feature list. WelcomeStrip
              directly below already covers the 34/4/24-7 facts in a grid;
              the hero's job is mood, not specifications. */}
          <motion.p
            variants={heroItemVariants}
            transition={iosGentleSpring}
            style={{ textShadow: "0 1px 12px rgb(0 0 0 / 0.4)" }}
            className="mt-5 max-w-md text-[0.95rem] leading-relaxed text-white/85 sm:mt-7 sm:max-w-lg sm:text-lg"
          >
            Thoughtfully designed rooms, refined dining, and an address at the
            heart of the city.
          </motion.p>

          {/* CTAs — desktop only. On mobile the MobileBookingBar at viewport
              bottom carries the primary action; hiding the in-hero CTAs lets
              the building image own the full hero stage. */}
          <motion.div
            variants={heroItemVariants}
            transition={iosSpring}
            className="mt-10 hidden flex-wrap items-center gap-5 sm:flex"
          >
            <BookingButton variant="gold" size="lg" href="/booking">
              Check Availability
            </BookingButton>
            <Link
              href="/rooms"
              className="group inline-flex items-center justify-center gap-2 px-3 py-3 font-body text-base font-medium text-white/85 transition-colors hover:text-gold-light"
            >
              Explore our rooms
              <ArrowRight
                className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>
          </motion.div>

          {/* Trust strip — desktop only. The mobile equivalent (price + free
              cancellation) lives in the MobileBookingBar, so we don't repeat
              it here. */}
          <motion.ul
            variants={heroItemVariants}
            transition={iosGentleSpring}
            style={{ textShadow: "0 1px 8px rgb(0 0 0 / 0.4)" }}
            className="mt-10 hidden flex-wrap items-center gap-x-3 gap-y-2 text-sm text-white/70 sm:flex"
          >
            {heroStats.map((stat, i) => (
              <li key={stat} className="flex items-center gap-3">
                {i > 0 && (
                  <span aria-hidden="true" className="text-white/25">
                    &middot;
                  </span>
                )}
                <span>{stat}</span>
              </li>
            ))}
          </motion.ul>
        </div>
      </motion.div>

      {/* ── Scroll indicator (desktop only) ─────────────────────────────
          On mobile, the 88dvh hero already lets the next section peek above
          the fold — that's a stronger scroll cue than a chevron. Showing
          both creates redundant visual noise. */}
      <motion.div
        aria-hidden="true"
        style={prefersReducedMotion ? undefined : { opacity: chevronOpacity }}
        className="pointer-events-none absolute bottom-8 left-1/2 z-10 hidden -translate-x-1/2 sm:block"
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4, duration: 0.8 }}
          className="flex flex-col items-center gap-1.5"
        >
          <span className="font-body text-[0.6rem] font-semibold uppercase tracking-[0.32em] text-white/50">
            Scroll
          </span>
          <motion.div
            animate={prefersReducedMotion ? undefined : { y: [0, 6, 0] }}
            transition={
              prefersReducedMotion
                ? undefined
                : { duration: 2, repeat: Infinity, ease: "easeInOut" }
            }
          >
            <ChevronDown className="h-5 w-5 text-white/60" />
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
}
