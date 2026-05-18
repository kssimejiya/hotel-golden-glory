import { cn } from "@/lib/utils";

/**
 * Visual loading skeleton — a brand-tinted gradient sweep (cream → warmer →
 * cream). Pure CSS, so no JS framework cost; respects prefers-reduced-motion
 * (falls back to a static tint). Reuse anywhere a loading state is needed.
 */
export function Shimmer({
  className,
  rounded = "rounded-lg",
  style,
}: {
  className?: string;
  /**
   * Tailwind rounded-* class. Default rounded-lg; pass an empty string to
   * disable when stacking inside an already-rounded container.
   */
  rounded?: string;
  /** Inline style escape hatch for arbitrary widths/heights in skeletons. */
  style?: React.CSSProperties;
}) {
  return (
    <div
      aria-hidden
      className={cn("shimmer h-full w-full", rounded, className)}
      style={style}
    />
  );
}
