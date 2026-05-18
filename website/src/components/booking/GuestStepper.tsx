"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface GuestStepperProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}

export function GuestStepper({
  label,
  value,
  min,
  max,
  onChange,
}: GuestStepperProps) {
  const btn =
    "flex h-9 w-9 items-center justify-center rounded-full border border-border-warm transition-all active:scale-95";
  return (
    <div className="flex items-center justify-between rounded-xl border border-border-warm bg-white px-4 py-3">
      <span className="text-sm font-medium text-charcoal">{label}</span>
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className={cn(
            btn,
            value <= min
              ? "cursor-not-allowed opacity-40"
              : "hover:border-gold hover:text-gold"
          )}
          aria-label={`Decrease ${label}`}
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <span
          className="w-6 text-center font-body text-base font-semibold tabular-nums text-charcoal"
          aria-live="polite"
        >
          {value}
        </span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className={cn(
            btn,
            value >= max
              ? "cursor-not-allowed opacity-40"
              : "hover:border-gold hover:text-gold"
          )}
          aria-label={`Increase ${label}`}
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
