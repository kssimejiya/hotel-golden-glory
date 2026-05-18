import { Container } from "@/components/shared/Container";
import {
  PageHeroSkeleton,
} from "@/components/shared/Skeletons";
import { Shimmer } from "@/components/shared/Shimmer";

/**
 * /booking skeleton — mocks the 4-step wizard's first paint (stepper + step
 * 1 dates form). Real wizard is "use client" so it hydrates after.
 */
export default function BookingLoading() {
  return (
    <>
      <PageHeroSkeleton />
      <section className="bg-cream py-8">
        <Container>
          <div className="mx-auto max-w-2xl space-y-8">
            {/* Stepper */}
            <div className="flex items-center justify-between">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Shimmer className="h-8 w-8" rounded="rounded-full" />
                  <Shimmer className="h-3 w-16" rounded="rounded-md" />
                </div>
              ))}
            </div>
            {/* Step body */}
            <div className="space-y-6">
              <Shimmer className="h-6 w-2/3" rounded="rounded-md" />
              <div className="grid gap-4 sm:grid-cols-2">
                <Shimmer className="h-14 w-full" rounded="rounded-xl" />
                <Shimmer className="h-14 w-full" rounded="rounded-xl" />
              </div>
              <Shimmer className="h-12 w-full" rounded="rounded-xl" />
              <Shimmer className="h-12 w-full" rounded="rounded-xl" />
              <Shimmer className="h-12 w-full" rounded="rounded-xl" />
              <Shimmer className="h-14 w-full" rounded="rounded-xl" />
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
