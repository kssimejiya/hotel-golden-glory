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
  { value: "1", label: "Conference Hall" },
  { value: "24/7", label: "Multi-Cuisine Dining" },
];

export function WelcomeStrip() {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return (
      <section className="bg-white py-20">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <p className="font-body text-sm font-semibold uppercase tracking-[0.2em] text-gold">
              Welcome
            </p>
            <h2 className="mt-2 text-section-heading font-display font-semibold text-charcoal">
              Rajkot&apos;s Address for the Modern Business Stay
            </h2>
            <div className="mx-auto mt-6 h-0.5 w-16 bg-gold" />
            <p className="mt-6 text-lg leading-relaxed text-soft-gray">
              The Blues Hotel Golden Glory is an independent business hotel in
              Bhakti Nagar — minutes from Rajkot Junction and the city&apos;s
              commercial centre, with the Saurashtra coast an easy drive away.
              Thoughtfully designed rooms. Multi-cuisine dining around the
              clock. Conference and meeting facilities for the days that matter.
              A team that learns your name by the first morning. A stay built
              for the way modern travellers move through Gujarat.
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
          <motion.p
            variants={sectionItemVariants}
            className="font-body text-sm font-semibold uppercase tracking-[0.2em] text-gold"
          >
            Welcome
          </motion.p>
          <motion.h2
            variants={sectionItemVariants}
            className="mt-2 text-section-heading font-display font-semibold text-charcoal"
          >
            Rajkot&apos;s Address for the Modern Business Stay
          </motion.h2>
          <motion.div
            variants={sectionItemVariants}
            className="mx-auto mt-6 h-0.5 w-16 bg-gold"
          />
          <motion.p
            variants={sectionItemVariants}
            className="mt-6 text-lg leading-relaxed text-soft-gray"
          >
            The Blues Hotel Golden Glory is an independent business hotel in
            Bhakti Nagar — minutes from Rajkot Junction and the city&apos;s
            commercial centre, with the Saurashtra coast an easy drive away.
            Thoughtfully designed rooms. Multi-cuisine dining around the
            clock. Conference and meeting facilities for the days that matter.
            A team that learns your name by the first morning. A stay built
            for the way modern travellers move through Gujarat.
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
