"use client";

import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { fadeUp, fadeUpTransition, viewportConfig } from "@/lib/animations";
import { roomFAQs } from "@/lib/content";
import { Container } from "@/components/shared/Container";
import { SectionHeading } from "@/components/shared/SectionHeading";

export function RoomFAQ() {
  return (
    <section className="bg-white py-16">
      <Container>
        <div className="mx-auto max-w-3xl">
          {/* SectionHeading is the same centered title + gold-rule component
              every home-page section uses — guarantees consistency without
              re-implementing the styles inline. */}
          <SectionHeading title="Frequently Asked Questions" />

          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={viewportConfig}
            transition={fadeUpTransition}
          >
            <Accordion>
              {roomFAQs.map((faq, i) => (
                <AccordionItem key={i} value={`faq-${i}`}>
                  <AccordionTrigger className="text-left font-body text-sm font-medium text-charcoal hover:text-gold">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm leading-relaxed text-soft-gray">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
