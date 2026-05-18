import { Container } from "@/components/shared/Container";
import { Shimmer } from "@/components/shared/Shimmer";

/**
 * Default loading skeleton for any public route segment that doesn't define
 * its own loading.tsx. Sits inside (public)/layout.tsx which already shows
 * the Header + Footer, so this only needs to mock the main content band.
 *
 * Routes that need a tailored skeleton (e.g. /rooms shows a card grid)
 * provide their own loading.tsx — Next picks the closest one in the segment
 * tree.
 */
export default function PublicLoading() {
  return (
    <div>
      {/* Hero band */}
      <div className="bg-charcoal pb-16 pt-32">
        <Container>
          <div className="space-y-3">
            <Shimmer className="h-8 w-72 max-w-full opacity-40" rounded="rounded-md" />
            <Shimmer className="h-4 w-96 max-w-full opacity-30" rounded="rounded-md" />
          </div>
        </Container>
      </div>
      {/* Content band */}
      <section className="bg-cream py-16">
        <Container>
          <div className="space-y-3">
            <Shimmer className="h-4 w-64 max-w-full" rounded="rounded-md" />
            <Shimmer className="h-4 w-1/2 max-w-full" rounded="rounded-md" />
            <Shimmer className="h-4 w-2/3 max-w-full" rounded="rounded-md" />
          </div>
        </Container>
      </section>
    </div>
  );
}
