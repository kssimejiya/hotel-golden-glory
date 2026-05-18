"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  sectionStaggerVariants,
  sectionItemVariants,
  viewportConfig,
} from "@/lib/animations";

interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  className?: string;
  align?: "left" | "center";
}

export function SectionHeading({
  title,
  subtitle,
  className,
  align = "center",
}: SectionHeadingProps) {
  const prefersReducedMotion = useReducedMotion();

  const Wrapper = prefersReducedMotion ? "div" : motion.div;
  const wrapperProps = prefersReducedMotion
    ? {}
    : {
        variants: sectionStaggerVariants,
        initial: "hidden" as const,
        whileInView: "visible" as const,
        viewport: viewportConfig,
      };

  const ChildEl = prefersReducedMotion ? "div" : motion.div;
  const childProps = prefersReducedMotion
    ? {}
    : { variants: sectionItemVariants };

  return (
    <Wrapper
      {...wrapperProps}
      className={cn(
        "mb-12",
        align === "center" && "text-center",
        className
      )}
    >
      <ChildEl {...childProps}>
        <h2 className="text-section-heading font-display font-semibold text-charcoal">
          {title}
        </h2>
      </ChildEl>
      {subtitle && (
        <ChildEl {...childProps}>
          <p className="mt-4 max-w-2xl text-soft-gray text-lg leading-relaxed mx-auto">
            {subtitle}
          </p>
        </ChildEl>
      )}
      <ChildEl {...childProps}>
        <div
          className={cn(
            "mt-6 h-0.5 w-16 bg-gold",
            align === "center" && "mx-auto"
          )}
        />
      </ChildEl>
    </Wrapper>
  );
}
