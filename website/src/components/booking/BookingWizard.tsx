"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Container } from "@/components/shared/Container";
import { PageHero } from "@/components/shared/PageHero";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { useHydrated } from "@/lib/hooks/useHydrated";
import { useBookingWizardStore, type WizardStep } from "@/lib/booking/store";
import { WizardStepper } from "./WizardStepper";
import { StepDates } from "./StepDates";
import type { RoomSlug, MealPlan, Room } from "@/types";

// Code-split steps 2-4. The user always lands on step 1 (Dates), so loading
// the other steps eagerly bloats the /booking JS bundle for no first-paint
// benefit. next/dynamic streams each step's chunk on demand; the AnimatePresence
// transition (250ms easeInOut) is long enough to hide the chunk fetch on
// any reasonable connection.
const StepRoomAndPlan = dynamic(
  () => import("./StepRoomAndPlan").then((m) => m.StepRoomAndPlan),
  { ssr: false }
);
const StepGuestDetails = dynamic(
  () => import("./StepGuestDetails").then((m) => m.StepGuestDetails),
  { ssr: false }
);
const StepReviewAndPay = dynamic(
  () => import("./StepReviewAndPay").then((m) => m.StepReviewAndPay),
  { ssr: false }
);

const ROOM_SLUGS = new Set(["deluxe", "superior", "premium", "blues-suite"]);
const MEAL_PLANS = new Set(["EP", "CP", "MAP"]);

function InitFromParams() {
  const searchParams = useSearchParams();

  useEffect(() => {
    // Read latest store state imperatively so the effect's deps stay the URL
    // params alone — we only want to seed the store on initial mount or when
    // the URL changes, not on every store mutation.
    const { roomSlug: currentSlug, setRoom, setMealPlan } =
      useBookingWizardStore.getState();
    const roomParam = searchParams.get("room");
    const planParam = searchParams.get("plan");
    if (roomParam && ROOM_SLUGS.has(roomParam) && !currentSlug) {
      setRoom(roomParam as RoomSlug);
    }
    if (planParam && MEAL_PLANS.has(planParam)) {
      setMealPlan(planParam as MealPlan);
    }
  }, [searchParams]);

  return null;
}

function SessionGuard() {
  useEffect(() => {
    // Imperative read so this is genuinely a once-on-mount check, not a
    // subscription that re-fires on every store update.
    const { lastActivityAt, reset } = useBookingWizardStore.getState();
    if (Date.now() - lastActivityAt > 30 * 60 * 1000) {
      reset();
    }
  }, []);

  return null;
}

export function BookingWizard({ rooms }: { rooms: Room[] }) {
  const store = useBookingWizardStore();
  const [direction, setDirection] = useState(1);
  const hydrated = useHydrated();

  function goToStep(step: WizardStep) {
    setDirection(step > store.currentStep ? 1 : -1);
    store.setStep(step);
    // Wizard step transitions update internal state — they don't trigger a
    // Next.js route change, so Next's built-in scroll restoration never
    // fires. Without this, the user lands on step N+1 at whatever scroll
    // position they were at on step N, often with the new step's heading
    // off-screen above. Instant (not smooth) so the snappy step transition
    // doesn't feel held up by a slow scroll animation.
    if (typeof window !== "undefined") {
      window.scrollTo(0, 0);
    }
  }

  if (!hydrated) {
    return (
      <>
        <PageHero title="Book Your Stay" subtitle="Secure your room at The Blues Hotel Golden Glory" />
        <section className="bg-cream py-12">
          <Container>
            <div className="mx-auto max-w-2xl">
              <div className="flex items-center justify-center py-20">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-gold border-t-transparent" />
              </div>
            </div>
          </Container>
        </section>
      </>
    );
  }

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
  };

  return (
    <>
      <SessionGuard />
      <InitFromParams />
      <PageHero
        title="Book Your Stay"
        subtitle="Secure your room at The Blues Hotel Golden Glory"
      />
      <Breadcrumb
        items={[{ label: "Home", href: "/" }, { label: "Book Your Stay" }]}
      />

      <section className="bg-cream py-8">
        <Container>
          <div className="mx-auto max-w-2xl">
            <WizardStepper currentStep={store.currentStep} />

            <div className="mt-8 overflow-hidden">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={store.currentStep}
                  custom={direction}
                  variants={variants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                >
                  {store.currentStep === 1 && (
                    <StepDates onNext={() => goToStep(2)} />
                  )}
                  {store.currentStep === 2 && (
                    <StepRoomAndPlan
                      rooms={rooms}
                      onNext={() => goToStep(3)}
                      onBack={() => goToStep(1)}
                    />
                  )}
                  {store.currentStep === 3 && (
                    <StepGuestDetails
                      onNext={() => goToStep(4)}
                      onBack={() => goToStep(2)}
                    />
                  )}
                  {store.currentStep === 4 && (
                    <StepReviewAndPay
                      rooms={rooms}
                      onBack={() => goToStep(3)}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
