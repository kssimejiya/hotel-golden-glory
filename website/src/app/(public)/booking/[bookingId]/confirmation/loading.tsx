import { Container } from "@/components/shared/Container";
import { Shimmer } from "@/components/shared/Shimmer";

/**
 * Confirmation page hits Firestore twice (getById + getBySlug). On Slow 4G
 * that's 200-500ms of perceived freeze without a placeholder. The skeleton
 * mocks the success-tile layout so the transition is clean.
 */
export default function ConfirmationLoading() {
  return (
    <>
      <div className="h-20" />
      <section className="bg-cream py-12">
        <Container>
          <div className="mx-auto max-w-2xl space-y-6">
            {/* Success icon placeholder */}
            <div className="flex justify-center">
              <Shimmer className="h-16 w-16" rounded="rounded-full" />
            </div>
            {/* Headline + booking id */}
            <div className="space-y-2 text-center">
              <Shimmer
                className="mx-auto h-7 w-56"
                rounded="rounded-md"
              />
              <Shimmer
                className="mx-auto h-5 w-40"
                rounded="rounded-md"
              />
              <Shimmer
                className="mx-auto h-3 w-72 max-w-full"
                rounded="rounded-md"
              />
            </div>
            {/* Summary card */}
            <div className="rounded-2xl border border-border-warm bg-white p-5 shadow-sm">
              <div className="space-y-3">
                <Shimmer className="h-5 w-1/3" rounded="rounded-md" />
                <div className="space-y-2 pt-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex justify-between">
                      <Shimmer className="h-3 w-24" rounded="rounded-md" />
                      <Shimmer className="h-3 w-32" rounded="rounded-md" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* Actions */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Shimmer
                  key={i}
                  className="h-20 w-full"
                  rounded="rounded-xl"
                />
              ))}
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
