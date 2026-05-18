"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Container } from "@/components/shared/Container";
import {
  sectionStaggerVariants,
  sectionItemVariants,
  viewportConfig,
} from "@/lib/animations";

const stats = [
  { value: "34", label: "Thoughtfully Designed Rooms" },
  { value: "4", label: "Room Categories" },
  { value: "1100", label: "Sqft Conference Hall" },
  { value: "24/7", label: "Multi-Cuisine Dining" },
];

export function WelcomeStrip() {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return (
      <section className="bg-white py-20">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-section-heading font-display font-semibold text-charcoal">
              Welcome to Golden Glory
            </h2>
            <div className="mx-auto mt-6 h-0.5 w-16 bg-gold" />
            <p className="mt-6 text-lg leading-relaxed text-soft-gray">
              Nestled in Rajkot&apos;s thriving Bhakti Nagar district, The Blues
              Hotel Golden Glory brings together modern comfort, dependable
              service, and genuine value. Whether you&apos;re here for business
              or exploring Saurashtra, consider this your home in the city.
            </p>
          </div>
          <div className="mt-14 grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="font-display text-3xl font-bold text-gold sm:text-4xl">
                  {stat.value}
                </p>
                <p className="mt-2 text-sm font-medium text-soft-gray">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>
    );
  }

  return (
    <section className="bg-white py-20">
      <Container>
        <motion.div
          variants={sectionStaggerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
          className="mx-auto max-w-3xl text-center"
        >
          <motion.h2
            variants={sectionItemVariants}
            className="text-section-heading font-display font-semibold text-charcoal"
          >
            Welcome to Golden Glory
          </motion.h2>
          <motion.div
            variants={sectionItemVariants}
            className="mx-auto mt-6 h-0.5 w-16 bg-gold"
          />
          <motion.p
            variants={sectionItemVariants}
            className="mt-6 text-lg leading-relaxed text-soft-gray"
          >
            Nestled in Rajkot&apos;s thriving Bhakti Nagar district, The Blues
            Hotel Golden Glory brings together modern comfort, dependable
            service, and genuine value. Whether you&apos;re here for business
            or exploring Saurashtra, consider this your home in the city.
          </motion.p>
        </motion.div>

        <motion.div
          variants={sectionStaggerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
          className="mt-14 grid grid-cols-2 gap-8 md:grid-cols-4"
        >
          {stats.map((stat) => (
            <motion.div
              key={stat.label}
              variants={sectionItemVariants}
              className="text-center"
            >
              <p className="font-display text-3xl font-bold text-gold sm:text-4xl">
                {stat.value}
              </p>
              <p className="mt-2 text-sm font-medium text-soft-gray">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </Container>
    </section>
  );
}
