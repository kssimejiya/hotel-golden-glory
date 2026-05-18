import { Container } from "@/components/shared/Container";
import {
  PageHeroSkeleton,
  SkelImage,
} from "@/components/shared/Skeletons";
import { Shimmer } from "@/components/shared/Shimmer";

/**
 * Room detail page skeleton — matches the RoomGalleryHero layout (main image
 * + 2x2 thumb grid on lg) plus the two-column content/rate-card section.
 */
export default function RoomDetailLoading() {
  return (
    <>
      <PageHeroSkeleton />
      <section className="bg-cream pb-8 pt-2">
        <Container>
          {/* Gallery: main + thumbs */}
          <div className="grid items-start gap-3 lg:grid-cols-[3fr_2fr]">
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
              <SkelImage />
            </div>
            <div className="flex gap-3 overflow-x-auto lg:grid lg:grid-cols-2 lg:grid-rows-[auto_auto] lg:gap-3 lg:self-start lg:overflow-visible">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="relative aspect-[4/3] w-28 flex-shrink-0 overflow-hidden rounded-xl sm:w-36 lg:w-full"
                >
                  <Shimmer
                    className="absolute inset-0"
                    rounded="rounded-xl"
                  />
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* Body + rate card */}
      <section className="bg-cream pb-16">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
            <div className="space-y-4">
              <Shimmer className="h-6 w-1/2" rounded="rounded-md" />
              <Shimmer className="h-4 w-3/4" rounded="rounded-md" />
              <div className="space-y-2 pt-4">
                <Shimmer className="h-3 w-full" rounded="rounded-md" />
                <Shimmer className="h-3 w-11/12" rounded="rounded-md" />
                <Shimmer className="h-3 w-10/12" rounded="rounded-md" />
                <Shimmer className="h-3 w-9/12" rounded="rounded-md" />
              </div>
            </div>
            <div className="rounded-2xl border border-border-warm bg-white p-6 shadow-sm">
              <div className="space-y-4">
                <Shimmer className="h-5 w-1/3" rounded="rounded-md" />
                <Shimmer className="h-3 w-2/3" rounded="rounded-md" />
                <Shimmer className="h-10 w-full" rounded="rounded-lg" />
                <Shimmer className="h-10 w-full" rounded="rounded-lg" />
                <Shimmer className="h-12 w-full" rounded="rounded-xl" />
              </div>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
