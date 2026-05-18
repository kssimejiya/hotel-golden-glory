"use client";

import { motion } from "framer-motion";
import { fadeUp, fadeUpTransition, viewportConfig } from "@/lib/animations";
import { Container } from "./Container";

interface PageHeroProps {
  title: string;
  subtitle?: string;
}

export function PageHero({ title, subtitle }: PageHeroProps) {
  return (
    <section className="bg-charcoal pb-16 pt-32">
      <Container>
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
          transition={fadeUpTransition}
        >
          <h1 className="text-section-heading font-display font-bold text-cream">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-3 max-w-xl text-lg text-cream/70">{subtitle}</p>
          )}
          <div className="mt-6 h-0.5 w-16 bg-gold" />
        </motion.div>
      </Container>
    </section>
  );
}
