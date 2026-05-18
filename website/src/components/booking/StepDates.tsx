"use client";

import { useBookingWizardStore } from "@/lib/booking/store";
import { DateRangePicker } from "./DateRangePicker";
import { GuestStepper } from "./GuestStepper";

interface StepDatesProps {
  onNext: () => void;
}

export function StepDates({ onNext }: StepDatesProps) {
  const { dates, guests, setDates, setGuestsData } = useBookingWizardStore();

  const checkIn = dates?.checkIn ?? "";
  const checkOut = dates?.checkOut ?? "";

  function handleCheckInChange(date: string) {
    const ciDate = new Date(date);
    let coDate = checkOut ? new Date(checkOut) : null;
    if (!coDate || coDate <= ciDate) {
      coDate = new Date(ciDate.getTime() + 86400000);
    }
    const coStr = coDate.toISOString().split("T")[0];
    const nights = Math.round(
      (coDate.getTime() - ciDate.getTime()) / 86400000
    );
    setDates({ checkIn: date, checkOut: coStr, nights });
  }

  function handleCheckOutChange(date: string) {
    const ciDate = new Date(checkIn);
    const coDate = new Date(date);
    const nights = Math.round(
      (coDate.getTime() - ciDate.getTime()) / 86400000
    );
    setDates({ checkIn, checkOut: date, nights });
  }

  const isValid = checkIn && checkOut && dates && dates.nights > 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-semibold text-charcoal">
          When are you visiting?
        </h2>
        <p className="mt-1 text-sm text-soft-gray">
          Select your check-in and check-out dates.
        </p>
      </div>

      <DateRangePicker
        checkIn={checkIn}
        checkOut={checkOut}
        onCheckInChange={handleCheckInChange}
        onCheckOutChange={handleCheckOutChange}
      />

      {dates && dates.nights > 0 && (
        <div className="rounded-lg bg-gold/10 px-3 py-2 text-center">
          <p className="text-xs font-medium text-charcoal">
            Your stay:{" "}
            <span className="font-display text-base font-bold text-gold">
              {dates.nights}
            </span>{" "}
            night{dates.nights > 1 ? "s" : ""}
          </p>
        </div>
      )}

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-charcoal">Guests & Rooms</h3>
        <GuestStepper
          label="Adults"
          value={guests.adults}
          min={1}
          max={4}
          onChange={(v) => setGuestsData({ adults: v })}
        />
        <GuestStepper
          label="Children"
          value={guests.children}
          min={0}
          max={3}
          onChange={(v) => setGuestsData({ children: v })}
        />
        <GuestStepper
          label="Rooms"
          value={guests.rooms}
          min={1}
          max={3}
          onChange={(v) => setGuestsData({ rooms: v })}
        />
      </div>

      <button
        onClick={onNext}
        disabled={!isValid}
        className="w-full rounded-xl bg-gold py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-gold-90 hover:shadow active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
      >
        Continue
      </button>
    </div>
  );
}
