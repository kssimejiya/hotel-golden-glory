"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  motion,
  useMotionValueEvent,
  useScroll,
  useTransform,
} from "framer-motion";
import { cn } from "@/lib/utils";
import { navLinks } from "@/lib/content";
import { BookingButton } from "@/components/shared/BookingButton";
import { MobileNav } from "./MobileNav";

export function Header() {
  const pathname = usePathname();
  // Transparent-at-top + white-text is a home-page pattern that depends on the
  // dark hero sitting behind the first 80px. Inner pages (room detail, booking
  // confirmation, etc.) have a light/cream backdrop from pixel one, so the
  // same white text becomes invisible. Treat the home route as a special case;
  // every other route gets a solid glass header with dark text from the start.
  const isHomeRoute = pathname === "/";

  const [scrolledOnHome, setScrolledOnHome] = useState(false);
  const { scrollY } = useScroll();

  // Smooth scroll-linked alpha for the home page hero handoff.
  const scrollDrivenOpacity = useTransform(scrollY, [0, 120], [0, 0.95]);
  const scrollDrivenShadowAlpha = useTransform(scrollY, [0, 120], [0, 0.08]);
  const scrollDrivenBoxShadow = useTransform(
    scrollDrivenShadowAlpha,
    (a) => `0 4px 24px rgba(0,0,0,${a})`
  );

  // On home we flip `scrolled` on scroll; on inner routes it's permanently
  // true so text colors stay dark from the first render.
  const scrolled = !isHomeRoute || scrolledOnHome;

  useMotionValueEvent(scrollY, "change", (v) => {
    if (isHomeRoute) setScrolledOnHome(v > 80);
  });

  return (
    <motion.header
      className="fixed inset-x-0 top-0 z-50"
      style={{ willChange: "transform" }}
    >
      {/* Glass layer: animated on home (transparent → glassy past 80px),
          static-glass on every other route. pointer-events-none keeps it
          purely decorative; never blocks link clicks. */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-white backdrop-blur-md"
        style={
          isHomeRoute
            ? {
                opacity: scrollDrivenOpacity,
                boxShadow: scrollDrivenBoxShadow,
              }
            : {
                opacity: 0.95,
                boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
              }
        }
      />

      <div className="relative mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex flex-col leading-none">
          <span
            className={cn(
              "font-body text-[0.6rem] font-semibold uppercase tracking-[0.2em] transition-colors duration-300",
              scrolled ? "text-gold" : "text-gold-light"
            )}
          >
            THE BLUES
          </span>
          <span
            className={cn(
              "font-display text-xl font-bold tracking-wide transition-colors duration-300",
              scrolled ? "text-blue" : "text-white"
            )}
          >
            HOTEL GOLDEN GLORY
          </span>
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "font-body text-sm font-medium transition-colors duration-200 hover:text-gold outline-none focus-visible:text-gold",
                scrolled ? "text-charcoal" : "text-white"
              )}
            >
              {link.label}
            </Link>
          ))}
          <BookingButton variant="gold" size="default" href="/booking">
            Book Now
          </BookingButton>
        </nav>

        <MobileNav scrolled={scrolled} />
      </div>
    </motion.header>
  );
}
