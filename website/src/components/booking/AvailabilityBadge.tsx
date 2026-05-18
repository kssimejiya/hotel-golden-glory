import { cn } from "@/lib/utils";

interface AvailabilityBadgeProps {
  available: boolean;
  remaining: number;
  loading?: boolean;
}

export function AvailabilityBadge({
  available,
  remaining,
  loading,
}: AvailabilityBadgeProps) {
  if (loading) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-cream px-3 py-1 text-xs font-medium text-soft-gray">
        <span className="h-2 w-2 animate-pulse rounded-full bg-soft-gray" />
        Checking...
      </span>
    );
  }

  if (!available) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-600">
        <span className="h-2 w-2 rounded-full bg-red-500" />
        Sold out for these dates
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
        remaining <= 3
          ? "bg-amber-50 text-amber-700"
          : "bg-green-50 text-green-700"
      )}
    >
      <span
        className={cn(
          "h-2 w-2 rounded-full",
          remaining <= 3 ? "bg-amber-500" : "bg-green-500"
        )}
      />
      {remaining <= 3 ? `Only ${remaining} left` : "Available"}
    </span>
  );
}
