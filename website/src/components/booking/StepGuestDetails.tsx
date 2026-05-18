"use client";

import { useState, useRef, useEffect } from "react";
import { Select as SelectPrimitive } from "@base-ui/react/select";
import { Check, ChevronDown } from "lucide-react";
import { useBookingWizardStore } from "@/lib/booking/store";
import { guestDetailsSchema } from "@/lib/booking/validators";
import type { GuestDetails } from "@/types";

interface StepGuestDetailsProps {
  onNext: () => void;
  onBack: () => void;
}

const arrivalSlots = Array.from({ length: 33 }, (_, i) => {
  const hour = Math.floor(i / 2) + 8;
  const min = i % 2 === 0 ? "00" : "30";
  const h = hour.toString().padStart(2, "0");
  return `${h}:${min}`;
}).filter((_, i) => i < 33);

export function StepGuestDetails({ onNext, onBack }: StepGuestDetailsProps) {
  const { guestDetails, setGuestDetails } = useBookingWizardStore();

  const [form, setForm] = useState<GuestDetails>({
    fullName: guestDetails?.fullName ?? "",
    email: guestDetails?.email ?? "",
    phone: guestDetails?.phone ?? "+91",
    specialRequests: guestDetails?.specialRequests ?? "",
    gstin: guestDetails?.gstin ?? "",
    arrivalTime: guestDetails?.arrivalTime ?? "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [shake, setShake] = useState(false);
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // `preventScroll: true` is critical on mobile: without it, calling
    // .focus() on a form input automatically scrolls the element into
    // view, which fights the wizard's own scroll-to-top in BookingWizard.
    // The user would see the page scroll up then immediately jump back
    // down to the focused input.
    firstInputRef.current?.focus({ preventScroll: true });
  }, []);

  function updateField(field: keyof GuestDetails, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  function handlePhoneChange(value: string) {
    if (!value.startsWith("+91")) {
      value = "+91" + value.replace(/^\+91/, "");
    }
    if (value.length > 13) return;
    updateField("phone", value);
  }

  function handleSubmit() {
    const result = guestDetailsSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as string;
        if (!fieldErrors[field]) fieldErrors[field] = issue.message;
      }
      setErrors(fieldErrors);
      setShake(true);
      setTimeout(() => setShake(false), 300);
      return;
    }
    setGuestDetails(form);
    onNext();
  }

  return (
    <div
      className={`space-y-5 ${shake ? "animate-[shake_0.3s_ease-in-out]" : ""}`}
    >
      <div>
        <h2 className="font-display text-xl font-semibold text-charcoal">
          Guest Details
        </h2>
        <p className="mt-1 text-sm text-soft-gray">
          Tell us who&apos;s checking in.
        </p>
      </div>

      {/* Full Name */}
      <div>
        <label htmlFor="fullName" className="mb-1.5 block text-sm font-medium text-charcoal">
          Full Name <span className="text-red-500">*</span>
        </label>
        <input
          ref={firstInputRef}
          id="fullName"
          type="text"
          value={form.fullName}
          onChange={(e) => updateField("fullName", e.target.value)}
          className="w-full rounded-xl border border-border-warm bg-white px-4 py-3 text-base text-charcoal placeholder:text-soft-gray/60 focus:border-gold focus:outline-none focus:ring-2 focus:ring-inset focus:ring-gold/30 sm:text-sm"
          placeholder="As per ID proof"
          aria-describedby={errors.fullName ? "fullName-error" : undefined}
        />
        {errors.fullName && (
          <p id="fullName-error" className="mt-1 text-xs text-red-500">{errors.fullName}</p>
        )}
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-charcoal">
          Email <span className="text-red-500">*</span>
        </label>
        <input
          id="email"
          type="email"
          value={form.email}
          onChange={(e) => updateField("email", e.target.value)}
          className="w-full rounded-xl border border-border-warm bg-white px-4 py-3 text-base text-charcoal placeholder:text-soft-gray/60 focus:border-gold focus:outline-none focus:ring-2 focus:ring-inset focus:ring-gold/30 sm:text-sm"
          placeholder="your@email.com"
          aria-describedby={errors.email ? "email-error" : undefined}
        />
        {errors.email && (
          <p id="email-error" className="mt-1 text-xs text-red-500">{errors.email}</p>
        )}
      </div>

      {/* Phone */}
      <div>
        <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-charcoal">
          Phone <span className="text-red-500">*</span>
        </label>
        <input
          id="phone"
          type="tel"
          value={form.phone}
          onChange={(e) => handlePhoneChange(e.target.value)}
          className="w-full rounded-xl border border-border-warm bg-white px-4 py-3 text-base text-charcoal placeholder:text-soft-gray/60 focus:border-gold focus:outline-none focus:ring-2 focus:ring-inset focus:ring-gold/30 sm:text-sm"
          placeholder="+91XXXXXXXXXX"
          aria-describedby={errors.phone ? "phone-error" : undefined}
        />
        {errors.phone && (
          <p id="phone-error" className="mt-1 text-xs text-red-500">{errors.phone}</p>
        )}
      </div>

      {/* GSTIN */}
      <div>
        <label htmlFor="gstin" className="mb-1.5 block text-sm font-medium text-charcoal">
          GSTIN <span className="text-xs text-soft-gray">(optional, for business billing)</span>
        </label>
        <input
          id="gstin"
          type="text"
          value={form.gstin}
          onChange={(e) => updateField("gstin", e.target.value.toUpperCase())}
          className="w-full rounded-xl border border-border-warm bg-white px-4 py-3 text-base text-charcoal uppercase placeholder:text-soft-gray/60 placeholder:normal-case focus:border-gold focus:outline-none focus:ring-2 focus:ring-inset focus:ring-gold/30 sm:text-sm"
          placeholder="22AAAAA0000A1Z5"
          maxLength={15}
          aria-describedby={errors.gstin ? "gstin-error" : undefined}
        />
        {errors.gstin && (
          <p id="gstin-error" className="mt-1 text-xs text-red-500">{errors.gstin}</p>
        )}
      </div>

      {/* Arrival Time — Base UI Select instead of native <select> so we
          control: (a) chevron position with proper padding from right edge,
          (b) dropdown portal rendering anchored under the trigger (not
          iOS's top-left default), (c) max-height with internal scrolling
          (50vh on mobile so it doesn't overflow the viewport, fixed 18rem
          on tablet+ for a tidier menu). */}
      <div>
        <label htmlFor="arrivalTime" className="mb-1.5 block text-sm font-medium text-charcoal">
          Expected Arrival Time <span className="text-xs text-soft-gray">(optional)</span>
        </label>
        <SelectPrimitive.Root
          value={form.arrivalTime || null}
          onValueChange={(val) =>
            updateField("arrivalTime", (val as string | null) ?? "")
          }
        >
          <SelectPrimitive.Trigger
            id="arrivalTime"
            className="group flex w-full items-center justify-between rounded-xl border border-border-warm bg-white px-4 py-3 text-base text-charcoal transition-colors hover:border-gold/50 focus:border-gold focus:outline-none focus:ring-2 focus:ring-inset focus:ring-gold/30 data-[popup-open]:border-gold data-[popup-open]:ring-2 data-[popup-open]:ring-inset data-[popup-open]:ring-gold/30 sm:text-sm"
          >
            <SelectPrimitive.Value placeholder="Select time">
              {(value) => (
                <span className={value ? "text-charcoal" : "text-soft-gray/60"}>
                  {(value as string) || "Select time"}
                </span>
              )}
            </SelectPrimitive.Value>
            {/* Chevron rotates on open via the trigger's `group` + Base UI's
                `data-popup-open` attribute, giving a clear "this is a
                dropdown that's currently open" affordance. */}
            <SelectPrimitive.Icon className="ml-2">
              <ChevronDown className="h-4 w-4 text-soft-gray transition-transform duration-150 group-data-[popup-open]:rotate-180 group-data-[popup-open]:text-gold" />
            </SelectPrimitive.Icon>
          </SelectPrimitive.Trigger>
          <SelectPrimitive.Portal>
            <SelectPrimitive.Positioner
              side="bottom"
              sideOffset={6}
              alignItemWithTrigger={false}
              className="isolate z-50"
            >
              <SelectPrimitive.Popup
                className="w-[var(--anchor-width)] max-h-[50vh] origin-[var(--transform-origin)] overflow-y-auto rounded-xl border border-border-warm bg-white py-1 shadow-lg ring-1 ring-black/5 data-[open]:animate-in data-[open]:fade-in-0 data-[open]:zoom-in-95 data-[closed]:animate-out data-[closed]:fade-out-0 data-[closed]:zoom-out-95 sm:max-h-72"
              >
                <SelectPrimitive.List>
                  {arrivalSlots.map((slot) => (
                    <SelectPrimitive.Item
                      key={slot}
                      value={slot}
                      className="relative flex cursor-pointer select-none items-center justify-between px-4 py-2.5 text-sm text-charcoal outline-none transition-colors data-[highlighted]:bg-cream data-[selected]:bg-gold/10 data-[selected]:font-medium data-[selected]:text-gold"
                    >
                      <SelectPrimitive.ItemText>{slot}</SelectPrimitive.ItemText>
                      <SelectPrimitive.ItemIndicator>
                        <Check className="h-4 w-4 text-gold" />
                      </SelectPrimitive.ItemIndicator>
                    </SelectPrimitive.Item>
                  ))}
                </SelectPrimitive.List>
              </SelectPrimitive.Popup>
            </SelectPrimitive.Positioner>
          </SelectPrimitive.Portal>
        </SelectPrimitive.Root>
      </div>

      {/* Special Requests */}
      <div>
        <label htmlFor="specialRequests" className="mb-1.5 block text-sm font-medium text-charcoal">
          Special Requests <span className="text-xs text-soft-gray">(optional)</span>
        </label>
        <textarea
          id="specialRequests"
          value={form.specialRequests}
          onChange={(e) => updateField("specialRequests", e.target.value)}
          rows={3}
          className="w-full rounded-xl border border-border-warm bg-white px-4 py-3 text-base text-charcoal placeholder:text-soft-gray/60 focus:border-gold focus:outline-none focus:ring-2 focus:ring-inset focus:ring-gold/30 resize-none sm:text-sm"
          placeholder="Early check-in, extra pillows, etc."
          maxLength={500}
          aria-describedby={errors.specialRequests ? "specialRequests-error" : undefined}
        />
        {errors.specialRequests && (
          <p id="specialRequests-error" className="mt-1 text-xs text-red-500">
            {errors.specialRequests}
          </p>
        )}
      </div>

      {/* Navigation */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 rounded-xl border border-border-warm py-3.5 text-sm font-semibold text-charcoal transition-colors hover:bg-cream"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          className="flex-1 rounded-xl bg-gold py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-gold-90 hover:shadow active:scale-[0.99]"
        >
          Continue to Payment
        </button>
      </div>
    </div>
  );
}
