"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import type { WizardStep } from "@/lib/booking/store";

const steps = [
  { step: 1 as WizardStep, label: "Dates" },
  { step: 2 as WizardStep, label: "Room" },
  { step: 3 as WizardStep, label: "Guest" },
  { step: 4 as WizardStep, label: "Pay" },
];

interface WizardStepperProps {
  currentStep: WizardStep;
}

export function WizardStepper({ currentStep }: WizardStepperProps) {
  return (
    <>
      {/* Mobile */}
      <div className="text-center text-sm font-medium text-soft-gray sm:hidden">
        Step {currentStep} of {steps.length} —{" "}
        <span className="text-charcoal">
          {steps.find((s) => s.step === currentStep)?.label}
        </span>
      </div>

      {/* Desktop */}
      <div className="hidden sm:flex sm:items-center sm:justify-center sm:gap-2">
        {steps.map((s, i) => {
          const isDone = currentStep > s.step;
          const isActive = currentStep === s.step;
          return (
            <div key={s.step} className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                    isDone && "bg-gold text-white",
                    isActive && "bg-blue text-white",
                    !isDone && !isActive && "bg-cream text-soft-gray"
                  )}
                >
                  {isDone ? <Check className="h-4 w-4" /> : s.step}
                </div>
                <span
                  className={cn(
                    "text-sm font-medium transition-colors",
                    isActive ? "text-charcoal" : "text-soft-gray"
                  )}
                >
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={cn(
                    "mx-2 h-px w-8 transition-colors",
                    currentStep > s.step ? "bg-gold" : "bg-border-warm"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
