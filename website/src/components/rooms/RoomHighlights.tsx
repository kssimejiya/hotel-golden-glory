"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { fadeUp, viewportConfig, staggerDelay } from "@/lib/animations";

interface RoomHighlightsProps {
  highlights: string[];
}

export function RoomHighlights({ highlights }: RoomHighlightsProps) {
  return (
    <ul className="space-y-3">
      {highlights.map((text, i) => (
        <motion.li
          key={text}
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
          transition={staggerDelay(i)}
          className="flex items-start gap-3"
        >
          <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold-15">
            <Check className="h-3 w-3 text-gold" />
          </div>
          <span className="text-sm leading-relaxed text-soft-gray">{text}</span>
        </motion.li>
      ))}
    </ul>
  );
}
