"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  BedDouble,
  Building2,
  ConciergeBell,
  Croissant,
  PartyPopper,
  Sparkles,
  createLucideIcon,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useHydratedReducedMotion } from "@/lib/hooks/useHydratedReducedMotion";
import { cn } from "@/lib/utils";
import { navLinks, facilityGroups, eventVenue } from "@/lib/content";
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

// Lucide's `Menu` has three lines; this is the same icon with four.
// Integer y-positions keep the 2px strokes pixel-crisp at 24px.
const MenuFourLines = createLucideIcon("menu-four-lines", [
  ["path", { d: "M4 6h16", key: "l1" }],
  ["path", { d: "M4 10h16", key: "l2" }],
  ["path", { d: "M4 14h16", key: "l3" }],
  ["path", { d: "M4 18h16", key: "l4" }],
]);

/** Group icons, as the four-dot (::) menu rendered them. */
const iconMap: Record<string, React.ElementType> = {
  Building2,
  ConciergeBell,
  BedDouble,
  Croissant,
  Sparkles,
  PartyPopper,
};

/**
 * The site menu: one button at every screen size opens the navigation and,
 * below it, every amenity the hotel offers plus its event-venue copy — the
 * two menus the header used to carry side by side (a hamburger and a
 * four-dot amenities sheet).
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
 * Close button: inside the overlay (rather than an AnimatePresence icon-swap
 * on the menu button), and sticky — the amenity and event lists make the
 * overlay scroll, and the dismiss target has to stay reachable. It also
 * avoids any z-index race between the Header and the overlay over which one
 * owns the top-right corner.
 */
export function MobileNav({ scrolled }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const prefersReducedMotion = useHydratedReducedMotion();

  // Portal target only exists on the client; render nothing for it during
  // SSR. The menu button still renders server-side as expected.
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
          aria-label="Site menu"
        >
          <div className="sticky top-0 z-10 flex justify-end bg-charcoal px-4 py-4">
            <motion.button
              type="button"
              onClick={() => setOpen(false)}
              whileTap={prefersReducedMotion ? undefined : { scale: 0.9 }}
              transition={iosSnappySpring}
              className="p-2 text-white transition-colors hover:text-gold"
              aria-label="Close menu"
            >
              <X className="h-6 w-6" />
            </motion.button>
          </div>

          <div className="mx-auto w-full max-w-5xl px-6 pb-16">
            <motion.nav
              variants={
                prefersReducedMotion ? undefined : sectionStaggerVariants
              }
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="flex flex-col items-center gap-6"
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

            <div className="my-10 h-px w-full bg-white/15" />

            {/* Everything the hotel provides — the old four-dot menu's
                content, recoloured for the dark overlay. */}
            <motion.div
              variants={
                prefersReducedMotion ? undefined : sectionStaggerVariants
              }
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              <motion.div
                variants={
                  prefersReducedMotion ? undefined : sectionItemVariants
                }
                className="text-center"
              >
                <p className="font-body text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-gold">
                  Hotel Golden Glory Rajkot
                </p>
                <h2 className="mt-1 font-display text-2xl font-semibold text-white">
                  Amenities
                </h2>
                <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-white/70">
                  What the hotel provides — around the property, in your room
                  and at breakfast.
                </p>
              </motion.div>

              <div className="mt-8 grid gap-8 sm:grid-cols-2">
                {facilityGroups.map((group) => {
                  const Icon = iconMap[group.icon];
                  return (
                    <motion.section
                      key={group.id}
                      variants={
                        prefersReducedMotion ? undefined : sectionItemVariants
                      }
                    >
                      <h3 className="flex items-center gap-2.5 font-display text-base font-semibold text-white">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold/15">
                          {Icon && (
                            <Icon
                              className="h-4 w-4 text-gold"
                              aria-hidden="true"
                            />
                          )}
                        </span>
                        {group.title}
                      </h3>
                      <ul className="mt-3 space-y-2">
                        {group.items.map((label) => (
                          <li
                            key={label}
                            className="flex gap-3 text-sm leading-relaxed text-white/70"
                          >
                            <span
                              aria-hidden="true"
                              className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold"
                            />
                            {label}
                          </li>
                        ))}
                      </ul>
                    </motion.section>
                  );
                })}
              </div>
            </motion.div>

            <div className="my-10 h-px w-full bg-white/15" />

            {/* The hotel's event-venue copy, as it sent it. */}
            <motion.div
              variants={
                prefersReducedMotion ? undefined : sectionStaggerVariants
              }
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              <motion.div
                variants={
                  prefersReducedMotion ? undefined : sectionItemVariants
                }
                className="text-center"
              >
                <h2 className="font-display text-2xl font-semibold text-white">
                  {eventVenue.title}
                </h2>
                <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-white/70">
                  {eventVenue.intro}
                </p>
              </motion.div>

              <div className="mt-8 grid gap-8 sm:grid-cols-2">
                {eventVenue.sections.map((section) => {
                  const Icon = iconMap[section.icon];
                  return (
                    <motion.section
                      key={section.id}
                      variants={
                        prefersReducedMotion ? undefined : sectionItemVariants
                      }
                    >
                      <h3 className="flex items-center gap-2.5 font-display text-base font-semibold text-white">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold/15">
                          {Icon && (
                            <Icon
                              className="h-4 w-4 text-gold"
                              aria-hidden="true"
                            />
                          )}
                        </span>
                        {section.title}
                      </h3>
                      <ul className="mt-3 space-y-2">
                        {section.items.map((entry) => (
                          <li
                            key={entry.label}
                            className="flex gap-3 text-sm leading-relaxed text-white/70"
                          >
                            <span
                              aria-hidden="true"
                              className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold"
                            />
                            <span>
                              <span className="font-semibold text-white">
                                {entry.label}
                              </span>
                              {entry.detail ? `: ${entry.detail}` : null}
                              {entry.subItems && (
                                <ul className="mt-2 space-y-1.5">
                                  {entry.subItems.map((sub) => (
                                    <li key={sub} className="flex gap-2.5">
                                      <span
                                        aria-hidden="true"
                                        className="mt-2 h-1 w-1 shrink-0 rounded-full bg-gold/60"
                                      />
                                      {sub}
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </motion.section>
                  );
                })}
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div>
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
        <MenuFourLines className="h-6 w-6" />
      </motion.button>

      {mounted && createPortal(overlay, document.body)}
    </div>
  );
}
