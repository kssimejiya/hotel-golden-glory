"use client";

import { motion } from "framer-motion";
import { useHydratedReducedMotion } from "@/lib/hooks/useHydratedReducedMotion";
import { Container } from "@/components/shared/Container";
import { PromoVideoPlayer } from "@/components/shared/PromoVideoPlayer";
import {
  sectionStaggerVariants,
  sectionItemVariants,
  viewportConfig,
} from "@/lib/animations";

export function WelcomeStrip() {
  const prefersReducedMotion = useHydratedReducedMotion();

  if (prefersReducedMotion) {
    return (
      <section className="bg-white py-20">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            {/* No eyebrow above this heading — it opens with "Welcome to"
                itself, so the usual gold kicker would just say it twice. */}
            <h2 className="text-section-heading font-display font-semibold text-charcoal">
              Welcome to Hotel Golden Glory Rajkot
            </h2>
            <div className="mx-auto mt-6 h-0.5 w-16 bg-gold" />
            {/* Sits between the heading and its description on purpose: the
                heading above already names what the video shows, so the
                player carries no title or copy of its own. */}
            <PromoVideoPlayer className="mt-10" />
            <div className="mt-10 space-y-5 text-lg leading-relaxed text-soft-gray">
              <p>
                Hotel Golden Glory, Rajkot is a contemporary luxury hotel that
                captures the vibrant spirit of Rangilu Rajkot — the commercial
                capital and cultural heart of Saurashtra. With its modern
                facade, elegant interiors, and warm lighting, the hotel stands
                as a landmark on Canal Road. Clean lines, premium furnishings,
                and thoughtful details create an atmosphere of understated
                luxury.
              </p>
              <p>
                Step into our spacious balconies with city views, unwind in
                well-appointed rooms, and experience hospitality that is truly
                Gujarati at heart — warm, welcoming, and attentive. Designed to
                be more than just a place to stay, it offers a seamless blend of
                business and leisure, giving you the best 4-star comfort, modern
                amenities, and personalized service in the heart of Rajkot.
              </p>
            </div>
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
          {/* No eyebrow above this heading — it opens with "Welcome to"
              itself, so the usual gold kicker would just say it twice. */}
          <motion.h2
            variants={sectionItemVariants}
            className="text-section-heading font-display font-semibold text-charcoal"
          >
            Welcome to Hotel Golden Glory Rajkot
          </motion.h2>
          <motion.div
            variants={sectionItemVariants}
            className="mx-auto mt-6 h-0.5 w-16 bg-gold"
          />
          {/* Sits between the heading and its description on purpose: the
              heading above already names what the video shows, so the player
              carries no title or copy of its own. */}
          <motion.div variants={sectionItemVariants} className="mt-10">
            <PromoVideoPlayer />
          </motion.div>
          <motion.div
            variants={sectionItemVariants}
            className="mt-10 space-y-5 text-lg leading-relaxed text-soft-gray"
          >
            <p>
              Hotel Golden Glory, Rajkot is a contemporary luxury hotel that
              captures the vibrant spirit of Rangilu Rajkot — the commercial
              capital and cultural heart of Saurashtra. With its modern facade,
              elegant interiors, and warm lighting, the hotel stands as a
              landmark on Canal Road. Clean lines, premium furnishings, and
              thoughtful details create an atmosphere of understated luxury.
            </p>
            <p>
              Step into our spacious balconies with city views, unwind in
              well-appointed rooms, and experience hospitality that is truly
              Gujarati at heart — warm, welcoming, and attentive. Designed to be
              more than just a place to stay, it offers a seamless blend of
              business and leisure, giving you the best 4-star comfort, modern
              amenities, and personalized service in the heart of Rajkot.
            </p>
          </motion.div>
        </motion.div>
      </Container>
    </section>
  );
}
