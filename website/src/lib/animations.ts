import type { Variants, Transition } from "framer-motion";

export const viewportConfig = { once: true, margin: "-80px" as const };

// ─────────────────────────────────────────────────────────────
// iOS-style springs
// ─────────────────────────────────────────────────────────────

// iOS 17+ default UIView spring — snappy, used for headlines, CTAs, and chrome.
export const iosSpring: Transition = {
  type: "spring",
  stiffness: 170,
  damping: 26,
  mass: 1,
};

// Softer companion spring — for body copy and supporting eyebrows.
export const iosGentleSpring: Transition = {
  type: "spring",
  stiffness: 120,
  damping: 22,
  mass: 1,
};

// Quick interactive spring — tap feedback, hover lifts, micro-toggles.
export const iosSnappySpring: Transition = {
  type: "spring",
  stiffness: 380,
  damping: 30,
  mass: 0.8,
};

// ─────────────────────────────────────────────────────────────
// Hero choreography
// ─────────────────────────────────────────────────────────────

// Apple choreography: uniform 80ms steps after a 100ms lead-in.
export const heroStaggerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

export const heroItemVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

export const heroHeadlineVariants: Variants = {
  hidden: { opacity: 0, y: 40, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1 },
};

// ─────────────────────────────────────────────────────────────
// Generic reveal variants (shared across sections)
// ─────────────────────────────────────────────────────────────

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0 },
};

// Spring-based — replaces the duration/easeOut feel everywhere automatically.
export const fadeUpTransition: Transition = iosGentleSpring;

export const fadeUpScale: Variants = {
  hidden: { opacity: 0, y: 60, scale: 0.96 },
  visible: { opacity: 1, y: 0, scale: 1 },
};

export const fadeUpScaleTransition: Transition = iosSpring;

// ─────────────────────────────────────────────────────────────
// Section choreography helpers (parent stagger pattern)
// ─────────────────────────────────────────────────────────────

// Parent variant: cascade children at uniform iOS rhythm.
export const sectionStaggerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.05,
    },
  },
};

// Child variant: pairs with `sectionStaggerVariants`, uses iOS gentle spring.
export const sectionItemVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: iosGentleSpring },
};

// ─────────────────────────────────────────────────────────────
// Interactions
// ─────────────────────────────────────────────────────────────

export const cardLift = {
  y: -6,
  boxShadow: "0 20px 40px rgba(216,147,57,0.18)",
};

// Spring instead of duration — settles like a real card.
export const cardLiftTransition: Transition = iosSnappySpring;

export const tapFeedback = {
  scale: 0.96,
};

// Spring for index-based stagger (kept signature-compatible with old API).
export function staggerDelay(index: number): Transition {
  return {
    ...iosGentleSpring,
    delay: index * 0.08,
  };
}
