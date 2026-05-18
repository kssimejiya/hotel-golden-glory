import { cn } from "@/lib/utils";
import { Shimmer } from "./Shimmer";
import { Container } from "./Container";

/**
 * Skeleton primitives reused across loading.tsx files. Each is a Shimmer
 * tile with a brand-appropriate radius. Pure CSS animation — respects
 * prefers-reduced-motion via the same media query that gates .shimmer.
 */

export function SkelLine({
  width = "100%",
  height = "0.75rem",
  className,
}: {
  width?: string;
  height?: string;
  className?: string;
}) {
  return (
    <Shimmer
      className={cn(className)}
      rounded="rounded-md"
      style={{ width, height }}
    />
  );
}

/**
 * Fills its (positioned) parent. Use inside an aspect-ratio container.
 */
export function SkelImage({ className }: { className?: string }) {
  return (
    <Shimmer
      className={cn("absolute inset-0", className)}
      rounded="rounded-2xl"
    />
  );
}

/**
 * Page hero placeholder — matches PageHero's dark band + headline area.
 */
export function PageHeroSkeleton() {
  return (
    <div className="bg-charcoal pb-16 pt-32">
      <Container>
        <div className="space-y-3">
          <Shimmer className="h-8 w-64 opacity-40" rounded="rounded-md" />
          <Shimmer
            className="h-4 w-96 max-w-full opacity-30"
            rounded="rounded-md"
          />
        </div>
      </Container>
    </div>
  );
}

/**
 * One room card skeleton — used in 4-up grid for /rooms and the homepage.
 */
export function RoomCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
      <div className="relative aspect-[16/9]">
        <SkelImage />
      </div>
      <div className="space-y-3 p-6">
        <Shimmer className="h-5 w-2/3" rounded="rounded-md" />
        <Shimmer className="h-3 w-full" rounded="rounded-md" />
        <Shimmer className="h-3 w-5/6" rounded="rounded-md" />
        <div className="flex items-center justify-between pt-2">
          <Shimmer className="h-3 w-24" rounded="rounded-md" />
          <Shimmer className="h-6 w-20" rounded="rounded-md" />
        </div>
      </div>
    </div>
  );
}

/**
 * Generic admin page header (title + subtitle line) skeleton.
 */
export function AdminPageHeaderSkeleton() {
  return (
    <div className="space-y-2">
      <Shimmer className="h-7 w-40" rounded="rounded-md" />
      <Shimmer className="h-4 w-72 max-w-full" rounded="rounded-md" />
    </div>
  );
}

/**
 * Generic table-row skeleton — used by /admin/bookings to skeleton the
 * rows under the table header chrome.
 */
export function TableRowSkeleton({ cols = 6 }: { cols?: number }) {
  return (
    <div className="flex items-center gap-4 px-4 py-3">
      {Array.from({ length: cols }).map((_, i) => (
        <Shimmer
          key={i}
          className={cn(
            "h-3",
            i === 0 && "w-28",
            i === 1 && "flex-1",
            i === 2 && "w-24",
            i === 3 && "w-40",
            i === 4 && "ml-auto w-20",
            i === 5 && "w-24"
          )}
          rounded="rounded-md"
        />
      ))}
    </div>
  );
}
