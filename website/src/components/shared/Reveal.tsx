"use client";

import { motion } from "framer-motion";
import { useHydratedReducedMotion } from "@/lib/hooks/useHydratedReducedMotion";
import { fadeUp, fadeUpTransition, viewportConfig } from "@/lib/animations";
import type { Transition } from "framer-motion";

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  transition?: Transition;
}

export function Reveal({ children, className, transition }: RevealProps) {
  const prefersReducedMotion = useHydratedReducedMotion();

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={viewportConfig}
      transition={transition ?? fadeUpTransition}
      style={{ willChange: "transform, opacity" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
