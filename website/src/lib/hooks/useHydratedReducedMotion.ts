"use client";

import { useReducedMotion } from "framer-motion";
import { useHydrated } from "./useHydrated";

/**
 * `prefers-reduced-motion`, read only once hydration is done.
 *
 * framer-motion's useReducedMotion reads matchMedia, which has no answer on
 * the server: it returns null there, and `true` on the client for a guest who
 * has the OS setting switched on. Components across this site branch on that
 * value, so for exactly those guests the server HTML and the first client
 * render disagreed, React discarded the server tree and rebuilt the page, and
 * the SSR pass bought them nothing.
 *
 * Deferring the read by one render makes both sides agree on `false`; the
 * real preference arrives on the render straight after hydration.
 *
 * That second render has one trap. A component that swaps element type or
 * tree on the value (Reveal, SectionHeading, WelcomeStrip) remounts and is
 * fine. A component that keeps the same motion element and only clears
 * `initial` / `whileInView` / `animate` is not: framer-motion has already
 * applied the server's `initial` state — opacity 0, or a bar parked
 * offscreen — and removing the props never animates it back. Key those
 * elements on the value so they remount clean:
 *
 *   <motion.div key={prefersReducedMotion ? "static" : "animated"} ... />
 *
 * Guests without the preference never see the key change, so they never pay
 * for the remount.
 */
export function useHydratedReducedMotion(): boolean {
  const hydrated = useHydrated();
  const prefersReducedMotion = useReducedMotion();
  return hydrated && prefersReducedMotion === true;
}
