"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  RoomSlug,
  MealPlan,
  Occupancy,
  BookingDates,
  BookingGuests,
  BookingPricing,
  GuestDetails,
} from "@/types";

export type WizardStep = 1 | 2 | 3 | 4;

interface BookingWizardState {
  currentStep: WizardStep;

  // Step 1
  dates: BookingDates | null;
  guests: BookingGuests;

  // Step 2
  roomSlug: RoomSlug | null;
  mealPlan: MealPlan;
  occupancy: Occupancy;

  // Step 3
  guestDetails: GuestDetails | null;

  // Step 4
  pricing: BookingPricing | null;

  // Tracking
  bookingId: string | null;
  lastActivityAt: number;

  // Actions
  setStep: (step: WizardStep) => void;
  setDates: (dates: BookingDates) => void;
  setGuestsData: (guests: Partial<BookingGuests>) => void;
  setRoom: (slug: RoomSlug) => void;
  setMealPlan: (plan: MealPlan) => void;
  setOccupancy: (occ: Occupancy) => void;
  setGuestDetails: (details: GuestDetails) => void;
  setPricing: (pricing: BookingPricing) => void;
  setBookingId: (id: string) => void;
  reset: () => void;
}

const initialState = {
  currentStep: 1 as WizardStep,
  dates: null,
  guests: { adults: 2, children: 0, rooms: 1 },
  roomSlug: null,
  mealPlan: "EP" as MealPlan,
  occupancy: "double" as Occupancy,
  guestDetails: null,
  pricing: null,
  bookingId: null,
  lastActivityAt: Date.now(),
};

export const useBookingWizardStore = create<BookingWizardState>()(
  persist(
    (set) => ({
      ...initialState,

      setStep: (step) =>
        set({ currentStep: step, lastActivityAt: Date.now() }),

      setDates: (dates) =>
        set({ dates, lastActivityAt: Date.now() }),

      setGuestsData: (guests) =>
        set((state) => ({
          guests: { ...state.guests, ...guests },
          lastActivityAt: Date.now(),
        })),

      setRoom: (slug) =>
        set({ roomSlug: slug, lastActivityAt: Date.now() }),

      setMealPlan: (plan) =>
        set({ mealPlan: plan, lastActivityAt: Date.now() }),

      setOccupancy: (occ) =>
        set({ occupancy: occ, lastActivityAt: Date.now() }),

      setGuestDetails: (details) =>
        set({ guestDetails: details, lastActivityAt: Date.now() }),

      setPricing: (pricing) =>
        set({ pricing, lastActivityAt: Date.now() }),

      setBookingId: (id) =>
        set({ bookingId: id, lastActivityAt: Date.now() }),

      reset: () => set({ ...initialState, lastActivityAt: Date.now() }),
    }),
    {
      name: "bhg-booking-wizard",
      storage: createJSONStorage(() => {
        if (typeof window === "undefined") {
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          };
        }
        return sessionStorage;
      }),
    }
  )
);
