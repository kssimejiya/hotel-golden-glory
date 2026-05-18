"use client";

import { motion } from "framer-motion";
import { iosSnappySpring } from "@/lib/animations";
import { cn } from "@/lib/utils";

interface BookingButtonProps {
  className?: string;
  variant?: "gold" | "blue" | "outline";
  size?: "default" | "lg";
  children: React.ReactNode;
  href?: string;
}

export function BookingButton({
  className,
  variant = "gold",
  size = "default",
  children,
  href = "#",
}: BookingButtonProps) {
  return (
    <motion.a
      href={href}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.96 }}
      transition={iosSnappySpring}
      style={{ willChange: "transform" }}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full font-body font-medium transition-[background-color,border-color,box-shadow] duration-200",
        size === "default" && "px-6 py-3 text-sm",
        size === "lg" && "px-8 py-4 text-base",
        variant === "gold" &&
          "bg-gold text-white hover:bg-gold-90 shadow-md hover:shadow-lg",
        variant === "blue" &&
          "bg-blue text-white hover:bg-blue-dark shadow-md hover:shadow-lg",
        variant === "outline" &&
          "border border-white/40 bg-white/[0.08] text-white backdrop-blur-md hover:border-white/70 hover:bg-white/[0.16] shadow-sm hover:shadow-md",
        className
      )}
    >
      {children}
    </motion.a>
  );
}
