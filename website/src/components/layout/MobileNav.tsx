"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { navLinks } from "@/lib/content";
import { BookingButton } from "@/components/shared/BookingButton";
import {
  iosSnappySpring,
  iosGentleSpring,
  sectionStaggerVariants,
  sectionItemVariants,
} from "@/lib/animations";

interface MobileNavProps {
  scrolled: boolean;
}

/**
 * Mobile navigation drawer.
 *
 * Why the overlay is portaled to `document.body`:
 *
 * The Header sets `style={{ willChange: "transform" }}` to GPU-promote the
 * scroll-linked opacity animation. Per CSS spec, `will-change: transform`
 * creates a *containing block* for `position: fixed` descendants — same
 * behavior as `transform: translateZ(0)`. Without a portal, the menu's
 * `fixed inset-0` overlay would render relative to the Header's ~80px
 * bounding box instead of the viewport, clipping every menu item that
 * doesn't fit in that 80px strip.
 *
 * `createPortal(overlay, document.body)` lifts the overlay out of the
 * Header's stacking context entirely, restoring true-viewport fixed
 * positioning. This is the same pattern Radix, Headless UI, and shadcn
 * use for modals/sheets for exactly this reason.
 *
 * Safe-area insets: `env(safe-area-inset-{top,bottom})` keeps the menu
 * clear of the iPhone notch / Dynamic Island and the home indicator.
 *
 * Close button: moved *inside* the overlay (was previously an
 * AnimatePresence icon-swap on the hamburger button). With portaled
 * rendering, the X belongs visually + semantically with the overlay it
 * dismisses — and it avoids any z-index race between the Header and the
 * overlay over which one owns the top-right corner.
 */
export function MobileNav({ scrolled }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  // Portal target only exists on the client; render nothing for it during
  // SSR. The hamburger button still renders server-side as expected.
  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll while the drawer is open so background content can't
  // be scrolled behind the overlay.
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const overlay = (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={iosGentleSpring}
          className="fixed inset-0 z-[60] overflow-y-auto bg-charcoal"
          style={{
            paddingTop: "env(safe-area-inset-top)",
            paddingBottom: "env(safe-area-inset-bottom)",
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Site navigation"
        >
          {/* Close button — aligned with where the hamburger was in the
              header so the dismiss target sits exactly where the user's
              thumb just tapped to open. */}
          <motion.button
            type="button"
            onClick={() => setOpen(false)}
            whileTap={prefersReducedMotion ? undefined : { scale: 0.9 }}
            transition={iosSnappySpring}
            className="absolute right-4 z-10 p-2 text-white transition-colors hover:text-gold"
            style={{ top: "calc(env(safe-area-inset-top) + 1rem)" }}
            aria-label="Close menu"
          >
            <X className="h-6 w-6" />
          </motion.button>

          <motion.nav
            variants={
              prefersReducedMotion ? undefined : sectionStaggerVariants
            }
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="flex min-h-full flex-col items-center justify-center gap-8 px-6 py-20"
          >
            {navLinks.map((link) => (
              <motion.div
                key={link.href}
                variants={
                  prefersReducedMotion ? undefined : sectionItemVariants
                }
              >
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="font-display text-2xl font-semibold text-white transition-colors hover:text-gold"
                >
                  {link.label}
                </Link>
              </motion.div>
            ))}
            <motion.div
              variants={
                prefersReducedMotion ? undefined : sectionItemVariants
              }
            >
              <BookingButton variant="gold" size="lg" href="/booking">
                Book Now
              </BookingButton>
            </motion.div>
          </motion.nav>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="lg:hidden">
      <motion.button
        type="button"
        onClick={() => setOpen(true)}
        whileTap={prefersReducedMotion ? undefined : { scale: 0.9 }}
        transition={iosSnappySpring}
        className={cn(
          "relative z-50 p-2 transition-colors duration-300",
          scrolled ? "text-charcoal" : "text-white"
        )}
        aria-label="Open menu"
        aria-expanded={open}
      >
        <Menu className="h-6 w-6" />
      </motion.button>

      {mounted && createPortal(overlay, document.body)}
    </div>
  );
}
