"use client";

import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { BookingButton } from "@/components/shared/BookingButton";
import { iosSpring } from "@/lib/animations";

/**
 * Sticky bottom booking bar — mobile-only. Always within thumb reach so the
 * primary booking action survives any scroll position. Hidden on the booking
 * flow itself (the user is already there; offering the same CTA would be
 * confusing and would compete with the wizard's own "Continue" buttons).
 *
 * Design notes:
 * - Dark glass + backdrop-blur matches premium hospitality booking bars
 *   (Aman, Six Senses, Oberoi mobile sites all use this pattern).
 * - Slide-up entrance is delayed so the hero's stagger choreography finishes
 *   first — the bar should feel like punctuation, not interruption.
 * - `env(safe-area-inset-bottom)` keeps the bar above the iPhone home
 *   indicator and any browser chrome that overlaps the bottom edge.
 */
export function MobileBookingBar() {
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();

  if (pathname?.startsWith("/booking")) return null;

  return (
    <motion.aside
      role="region"
      aria-label="Quick booking"
      initial={prefersReducedMotion ? undefined : { y: "100%" }}
      animate={prefersReducedMotion ? undefined : { y: 0 }}
      transition={
        prefersReducedMotion ? undefined : { ...iosSpring, delay: 0.8 }
      }
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-charcoal/92 backdrop-blur-xl sm:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="min-w-0">
          <p className="font-body text-[0.6rem] font-medium uppercase tracking-[0.2em] text-white/55">
            From
          </p>
          <p className="font-display text-lg font-bold leading-tight text-white">
            ₹2,799
            <span className="ml-1 font-body text-xs font-medium text-white/55">
              / night
            </span>
          </p>
        </div>
        <BookingButton
          variant="gold"
          size="default"
          href="/booking"
          className="shrink-0"
        >
          Check Availability
        </BookingButton>
      </div>
    </motion.aside>
  );
}
