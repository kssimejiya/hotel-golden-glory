import { Container } from "@/components/shared/Container";
import {
  PageHeroSkeleton,
  RoomCardSkeleton,
} from "@/components/shared/Skeletons";

/**
 * /rooms is a 2-up card grid. Skeleton matches the real layout exactly
 * (PageHero + 2-col grid of room cards) so the swap-in is invisible.
 */
export default function RoomsLoading() {
  return (
    <>
      <PageHeroSkeleton />
      <section className="bg-cream py-12">
        <Container>
          <div className="grid gap-8 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <RoomCardSkeleton key={i} />
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
