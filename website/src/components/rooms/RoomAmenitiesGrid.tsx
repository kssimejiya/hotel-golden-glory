"use client";

import { motion } from "framer-motion";
import {
  Wifi, Snowflake, Tv, BedDouble, Bath, Coffee, Phone, Lock,
  Sun, Mountain, Briefcase, Sparkles, Circle,
} from "lucide-react";
import { fadeUp, viewportConfig, staggerDelay } from "@/lib/animations";
import type { RoomAmenity } from "@/types";

const iconMap: Record<string, React.ElementType> = {
  Wifi, Snowflake, Tv, BedDouble, Bath, Coffee, Phone, Lock,
  Sun, Mountain, Briefcase, Sparkles,
};

interface RoomAmenitiesGridProps {
  amenities: RoomAmenity[];
}

export function RoomAmenitiesGrid({ amenities }: RoomAmenitiesGridProps) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {amenities.map((amenity, i) => {
        const Icon = iconMap[amenity.icon] ?? Circle;
        return (
          <motion.div
            key={amenity.label}
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={viewportConfig}
            transition={staggerDelay(i)}
            className="flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-gold-5"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold-10">
              <Icon className="h-5 w-5 text-gold" />
            </div>
            <span className="text-sm font-medium text-charcoal">
              {amenity.label}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}
